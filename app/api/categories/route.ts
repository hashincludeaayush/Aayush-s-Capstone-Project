import { NextResponse } from "next/server";
import Product from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongoose";

export async function GET() {
  try {
    await connectToDB();

    const raw = (await Product.distinct("category")) as Array<unknown>;

    const categories = raw
      .filter((c): c is string => typeof c === "string")
      .map((c) => c.trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    return NextResponse.json({ categories });
  } catch {
    return NextResponse.json(
      { categories: [], error: "Failed to load categories" },
      { status: 500 }
    );
  }
}
