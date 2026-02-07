"use server"

import { revalidatePath } from "next/cache";
import Product from "../models/product.model";
import { connectToDB } from "../mongoose";
import { scrapeProduct } from "../scraper";
import { getAveragePrice, getHighestPrice, getLowestPrice } from "../utility";
import { User } from "@/types";
import { generateEmailBody, sendEmail } from "../nodemailer";

type ScrapeAndStoreResult =
  | { status: "complete"; productId: string }
  | { status: "queued"; message: string }
  | { status: "failed"; message: string };

export async function scrapeAndStoreProduct(productUrl: string) {
  if(!productUrl) return;

  try {
    connectToDB();

    const candidates = new Set<string>();
    const trimmed = productUrl.trim();
    if (trimmed) candidates.add(trimmed);

    let primaryUrl = trimmed;

    try {
      const u = new URL(trimmed);
      u.hash = "";
      candidates.add(u.toString());
      u.search = "";
      candidates.add(u.toString());
      primaryUrl = u.toString().replace(/\/$/, "");
      candidates.add(primaryUrl);
    } catch {
      // ignore invalid URL parsing here; Searchbar validates on client.
    }

    const urlList = Array.from(candidates).filter(Boolean);

    // Wait for the workflow to finish and respond.
    const webhook = await scrapeProduct(primaryUrl);

    if (!webhook.ok) {
      return { status: "failed", message: webhook.error } satisfies ScrapeAndStoreResult;
    }

    const scrapedProduct = webhook.data;

    const hasScrapedPayload =
      scrapedProduct &&
      typeof scrapedProduct === "object" &&
      typeof (scrapedProduct as any).url === "string";

    if (hasScrapedPayload) {
      let product = scrapedProduct;

      const existingProduct = await Product.findOne({
        url: (scrapedProduct as any).url,
      });

      if (existingProduct) {
        const updatedPriceHistory: any = [
          ...existingProduct.priceHistory,
          { price: (scrapedProduct as any).currentPrice },
        ];

        product = {
          ...scrapedProduct,
          priceHistory: updatedPriceHistory,
          lowestPrice: getLowestPrice(updatedPriceHistory),
          highestPrice: getHighestPrice(updatedPriceHistory),
          averagePrice: getAveragePrice(updatedPriceHistory),
        };
      }

      const newProduct = await Product.findOneAndUpdate(
        { url: (scrapedProduct as any).url },
        product,
        { upsert: true, new: true },
      );

      revalidatePath(`/products/${newProduct._id}`);

      return {
        status: "complete",
        productId: newProduct._id.toString(),
      } satisfies ScrapeAndStoreResult;
    }

    // Workflow finished but responded with an empty body.
    // Poll briefly for the product that the workflow should have written to MongoDB.
    const start = Date.now();
    const maxWaitMs = 45_000;
    const intervalMs = 2_500;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const found = await Product.findOne({ url: { $in: urlList } })
        .select("_id")
        .lean<{ _id?: any } | null>();

      if (found?._id) {
        revalidatePath(`/products/${found._id}`);
        return {
          status: "complete",
          productId: found._id.toString(),
        } satisfies ScrapeAndStoreResult;
      }

      if (Date.now() - start >= maxWaitMs) break;
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    return {
      status: "queued",
      message:
        "The scrape finished, but the product record is still being saved. Please try again in a moment.",
    } satisfies ScrapeAndStoreResult;
  } catch (error: any) {
    return {
      status: "failed",
      message: `Failed to create/update product: ${error.message}`,
    } satisfies ScrapeAndStoreResult;
  }
}

export async function getProductById(productId: string) {
  try {
    connectToDB();

    const product = await Product.findOne({ _id: productId }).lean();

    if(!product) return null;

    return JSON.parse(JSON.stringify(product));
  } catch (error) {
    console.log(error);
  }
}

export async function getAllProducts(searchQuery?: string) {
  try {
    connectToDB();

    const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const trimmed = searchQuery?.trim();

    const filter = (() => {
      if (!trimmed) return {};

      const tokens = trimmed
        .split(/[\s,]+/g)
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 6);

      if (tokens.length === 0) return {};

      return {
        $and: tokens.map((token) => {
          const safe = escapeRegex(token);
          const rx = { $regex: safe, $options: "i" };
          return {
            $or: [{ title: rx }, { description: rx }, { category: rx }],
          };
        }),
      };
    })();

    const products = await Product.find(filter).lean();

    return JSON.parse(JSON.stringify(products));
  } catch (error) {
    console.log(error);
  }
}

export async function getProductsByCategory(category: string) {
  try {
    connectToDB();

    const trimmed = category?.trim();
    if (!trimmed) return [];

    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const products = await Product.find({
      category: { $regex: escaped, $options: "i" },
    }).lean();

    return JSON.parse(JSON.stringify(products));
  } catch (error) {
    console.log(error);
  }
}

export async function getSimilarProducts(productId: string) {
  try {
    connectToDB();

    const currentProduct = await Product.findById(productId).lean();

    if(!currentProduct) return null;

    const limit = 24;

    const escapeRegex = (value: string) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const category =
      typeof (currentProduct as any)?.category === "string"
        ? String((currentProduct as any).category).trim()
        : "";

    const baseFilter: any = {
      _id: { $ne: productId },
    };

    // Prefer products from the same category when possible.
    const primaryFilter = category
      ? {
          ...baseFilter,
          category: { $regex: escapeRegex(category), $options: "i" },
        }
      : baseFilter;

    const primary = await Product.find(primaryFilter)
      .limit(limit)
      .lean();

    if (primary.length >= limit) {
      return JSON.parse(JSON.stringify(primary));
    }

    // Fallback: fill the remaining slots with any other products.
    const remaining = Math.max(0, limit - primary.length);
    const primaryIds = primary
      .map((p: any) => p?._id)
      .filter(Boolean);

    const secondary = remaining
      ? await Product.find({
          ...baseFilter,
          _id: { $ne: productId, $nin: primaryIds },
        })
          .limit(remaining)
          .lean()
      : [];

    const combined = [...primary, ...secondary];

    return JSON.parse(JSON.stringify(combined));
  } catch (error) {
    console.log(error);
  }
}

export async function addUserEmailToProduct(productId: string, userEmail: string) {
  try {
    const product = await Product.findById(productId);

    if(!product) return;

    const userExists = product.users.some((user: User) => user.email === userEmail);

    if(!userExists) {
      product.users.push({ email: userEmail });

      await product.save();

      const emailContent = await generateEmailBody(product, "WELCOME");

      await sendEmail(emailContent, [userEmail]);
    }
  } catch (error) {
    console.log(error);
  }
}