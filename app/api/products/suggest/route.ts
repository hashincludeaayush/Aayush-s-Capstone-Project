import { NextResponse } from "next/server";
import Product from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongoose";

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();

    if (!q) {
      return NextResponse.json({ items: [] });
    }

    await connectToDB();

    const tokens = q
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 6);

    const tokenClauses = tokens.map((token) => {
      const escaped = escapeRegex(token);
      return {
        $or: [
          { title: { $regex: escaped, $options: "i" } },
          { description: { $regex: escaped, $options: "i" } },
          { category: { $regex: escaped, $options: "i" } },
        ],
      };
    });

    const filter = tokenClauses.length > 0 ? { $and: tokenClauses } : {};

    const products = await Product.find(filter)
      .sort({ updatedAt: -1 })
      .limit(8)
      .select({ _id: 1, title: 1, image: 1, currentPrice: 1, currency: 1 });

    const items = products.map((p: any) => ({
      id: p._id.toString(),
      title: p.title as string,
      image: p.image as string,
      currentPrice: p.currentPrice as number,
      currency: p.currency as string,
    }));

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json(
      { items: [], error: "Failed to load suggestions" },
      { status: 500 }
    );
  }
}
