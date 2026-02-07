import { NextResponse } from "next/server";
import { scrapeAndStoreProduct } from "@/lib/actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { url?: string }
      | null;

    const url = typeof body?.url === "string" ? body.url : "";

    if (!url.trim()) {
      return NextResponse.json(
        { status: "failed", message: "Missing product URL." },
        { status: 400 },
      );
    }

    const result = await scrapeAndStoreProduct(url);

    return NextResponse.json(result ?? { status: "failed", message: "Failed." });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "failed",
        message: error?.message || "Failed to start scrape.",
      },
      { status: 500 },
    );
  }
}
