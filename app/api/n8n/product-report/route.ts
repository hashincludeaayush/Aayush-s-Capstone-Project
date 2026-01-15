import { NextResponse } from "next/server";
import Product from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongoose";
import { getAnalyzedReportModel } from "@/lib/models/analyzedReport.model";

type Payload = {
  productId?: string;
  status?: "complete" | "failed";
  error?: string;
  data?: any;
};

export async function POST(req: Request) {
  try {
    const secret = process.env.N8N_PRODUCT_REPORT_SECRET;
    if (secret) {
      const provided = req.headers.get("x-n8n-secret") || "";
      if (provided !== secret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = (await req.json().catch(() => ({}))) as Payload;
    const productId = body.productId?.trim();

    if (!productId) {
      return NextResponse.json(
        { error: "Missing productId" },
        { status: 400 }
      );
    }

    await connectToDB();

    const AnalyzedReport = getAnalyzedReportModel();

    const isFailed = body.status === "failed" || !!body.error;

    const update: Record<string, any> = {
      "analytics.completedAt": new Date(),
      "analytics.status": isFailed ? "failed" : "complete",
      "analytics.error": isFailed ? body.error || "Workflow failed" : null,
    };

    if (!isFailed) {
      update["analytics.data"] = body.data ?? {};
    }

    // Also upsert into the separate analytics DB/collection.
    // Expected shape is either { analytics_payload: {...} } or the raw payload fields.
    if (!isFailed) {
      const raw = body.data ?? {};
      const analyticsPayload =
        raw && typeof raw === "object" && (raw as any).analytics_payload
          ? (raw as any).analytics_payload
          : raw;

      if (analyticsPayload && typeof analyticsPayload === "object") {
        await AnalyzedReport.updateOne(
          { productId },
          { $set: { productId, ...analyticsPayload } },
          { upsert: true }
        );
      }
    }

    const res = await Product.updateOne({ _id: productId }, { $set: update });

    if (res.matchedCount === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to store report" },
      { status: 500 }
    );
  }
}
