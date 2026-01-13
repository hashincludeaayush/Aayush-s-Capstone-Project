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

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));

    const webhook = await scrapeProduct(productUrl);

    if (!webhook.ok) {
      return { status: "failed", message: webhook.error } satisfies ScrapeAndStoreResult;
    }

    const scrapedProduct = webhook.data;

    // If n8n returned product data, we can store/update immediately (old behavior).
    const hasScrapedPayload =
      scrapedProduct &&
      typeof scrapedProduct === "object" &&
      typeof (scrapedProduct as any).url === "string";

    if(!hasScrapedPayload) {
      // If n8n responds with no body (e.g. 204), we still treat it as success.
      // Many workflows upsert into MongoDB themselves, so we poll briefly for the product.
      const candidates = new Set<string>();
      const trimmed = productUrl.trim();
      if (trimmed) candidates.add(trimmed);

      try {
        const u = new URL(trimmed);
        u.hash = "";
        candidates.add(u.toString());
        u.search = "";
        candidates.add(u.toString());
        candidates.add(u.toString().replace(/\/$/, ""));
      } catch {
        // ignore invalid URL parsing here; Searchbar validates on client.
      }

      const urlList = Array.from(candidates).filter(Boolean);

      for (let attempt = 0; attempt < 12; attempt += 1) {
        const existing = await Product.findOne({ url: { $in: urlList } })
          .select("_id")
          .lean<{ _id?: any } | null>();

        if (existing?._id) {
          revalidatePath(`/products/${existing._id}`);
          return {
            status: "complete",
            productId: existing._id.toString(),
          } satisfies ScrapeAndStoreResult;
        }

        await sleep(1000);
      }

      return {
        status: "queued",
        message:
          "Workflow finished, but no product payload was returned. The product may still be saving—please refresh in a moment.",
      } satisfies ScrapeAndStoreResult;
    }

    let product = scrapedProduct;

    const existingProduct = await Product.findOne({ url: scrapedProduct.url });

    if(existingProduct) {
      const updatedPriceHistory: any = [
        ...existingProduct.priceHistory,
        { price: scrapedProduct.currentPrice }
      ]

      product = {
        ...scrapedProduct,
        priceHistory: updatedPriceHistory,
        lowestPrice: getLowestPrice(updatedPriceHistory),
        highestPrice: getHighestPrice(updatedPriceHistory),
        averagePrice: getAveragePrice(updatedPriceHistory),
      }
    }

    const newProduct = await Product.findOneAndUpdate(
      { url: scrapedProduct.url },
      product,
      { upsert: true, new: true }
    );

    revalidatePath(`/products/${newProduct._id}`);

    return {
      status: "complete",
      productId: newProduct._id.toString(),
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

    const similarProducts = await Product.find({
      _id: { $ne: productId },
    }).limit(3).lean();

    return JSON.parse(JSON.stringify(similarProducts));
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