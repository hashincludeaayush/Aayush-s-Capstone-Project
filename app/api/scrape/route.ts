import { NextResponse } from "next/server";
import { triggerScrapeProduct } from "@/lib/scraper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

    const trigger = await triggerScrapeProduct(url);

    if (!trigger.ok) {
      return NextResponse.json(
        { status: "failed", message: trigger.error },
        { status: 502 },
      );
    }

    if (trigger.queued === false && trigger.productId) {
      return NextResponse.json({ status: "complete", productId: trigger.productId });
    }

    return NextResponse.json({
      status: "queued",
      message:
        "Workflow started. We’ll redirect automatically once the product is ready.",
    });
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
