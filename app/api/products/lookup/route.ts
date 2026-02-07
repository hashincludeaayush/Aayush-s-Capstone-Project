import { NextResponse } from "next/server";
import Product from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongoose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildUrlCandidates(input: string) {
  const candidates = new Set<string>();
  const trimmed = input.trim();
  if (trimmed) candidates.add(trimmed);

  try {
    const u = new URL(trimmed);
    u.hash = "";
    candidates.add(u.toString());
    u.search = "";
    candidates.add(u.toString());
    candidates.add(u.toString().replace(/\/$/, ""));
  } catch {
    // ignore
  }

  return Array.from(candidates).filter(Boolean);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url") || "";

    if (!url.trim()) {
      return NextResponse.json(
        { found: false, message: "Missing url" },
        { status: 400 },
      );
    }

    await connectToDB();

    const urlList = buildUrlCandidates(url);

    const found = await Product.findOne({ url: { $in: urlList } })
      .select("_id")
      .lean<{ _id?: any } | null>();

    if (!found?._id) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({ found: true, productId: found._id.toString() });
  } catch (error: any) {
    return NextResponse.json(
      { found: false, message: error?.message || "Lookup failed" },
      { status: 500 },
    );
  }
}
