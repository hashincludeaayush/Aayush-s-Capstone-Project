import { NextResponse } from "next/server";
import Product from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongoose";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();

    if (!q) {
      return NextResponse.json({ items: [] });
    }

    await connectToDB();

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const products = await Product.find({
      title: { $regex: escaped, $options: "i" },
    })
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
