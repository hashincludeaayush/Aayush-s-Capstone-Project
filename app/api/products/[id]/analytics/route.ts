import { NextResponse } from "next/server";
import Product from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongoose";
import { getAnalyzedReportModel } from "@/lib/models/analyzedReport.model";
import mongoose from "mongoose";

const DEFAULT_POLL_SHOULD_RETRIGGER_AFTER_MS = 10 * 60 * 1000;

function getRequestedAtMs(value: unknown): number | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  const ms = date.getTime();
  return Number.isFinite(ms) ? ms : null;
}

async function findAnalyzedReportByAnyId(
  AnalyzedReport: ReturnType<typeof getAnalyzedReportModel>,
  id: string
) {
  // Use the underlying collection to avoid schema-driven casting.
  const col = AnalyzedReport.collection;

  // If analyzed docs store _id as ObjectId.
  if (mongoose.isValidObjectId(id)) {
    try {
      const byObjectId = await col.findOne({
        _id: new mongoose.Types.ObjectId(id),
      });
      if (byObjectId) return byObjectId;
    } catch {
      // ignore
    }
  }

  // If analyzed docs store _id as a string (common when inserting from tools/workflows).
  const byString = await col.findOne({ _id: id as any });
  if (byString) return byString;

  return null;
}

async function findAnalyzedReportAcrossDbs(options: {
  AnalyzedReport: ReturnType<typeof getAnalyzedReportModel>;
  id: string;
  productUrl?: string;
}) {
  const { AnalyzedReport, id, productUrl } = options;

  const collections: Array<{ findOne: (q: any) => Promise<any> }> = [];
  const seen = new Set<string>();
  const add = (col: any, key: string) => {
    if (!col) return;
    if (seen.has(key)) return;
    seen.add(key);
    collections.push(col);
  };

  // 1) Dedicated analyzed DB (whatever getAnalyzedReportModel() points at)
  add(AnalyzedReport.collection, "model");

  // 2) Explicit DB/collection name variants (Mongo DB names are case-sensitive)
  try {
    const dbLower = mongoose.connection.useDb("analyzed");
    add(dbLower.collection("analyzed"), "analyzed/analyzed");
    add(dbLower.collection("Analyzed"), "analyzed/Analyzed");
  } catch {
    // ignore
  }

  try {
    const dbUpper = mongoose.connection.useDb("Analyzed");
    add(dbUpper.collection("analyzed"), "Analyzed/analyzed");
    add(dbUpper.collection("Analyzed"), "Analyzed/Analyzed");
  } catch {
    // ignore
  }

  // 3) Same DB as products (fallback)
  if (mongoose.connection?.db) {
    add(mongoose.connection.db.collection("analyzed"), "default/analyzed");
    add(mongoose.connection.db.collection("Analyzed"), "default/Analyzed");
  }

  for (const col of collections) {
    // Try by _id (ObjectId then string)
    if (mongoose.isValidObjectId(id)) {
      try {
        const byObjectId = await col.findOne({
          _id: new mongoose.Types.ObjectId(id),
        });
        if (byObjectId) return byObjectId;
      } catch {
        // ignore
      }
    }

    const byString = await col.findOne({ _id: id as any });
    if (byString) return byString;

    // If the workflow inserted EJSON shape into _id (e.g. { $oid: "..." }).
    const byEjson = await col.findOne({ "_id.$oid": id } as any);
    if (byEjson) return byEjson;

    // Optional: try by productUrl if the workflow stores that instead
    if (productUrl) {
      const byUrl = await col.findOne({ productUrl });
      if (byUrl) return byUrl;
    }
  }

  return null;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDB();

    const debug = new URL(req.url).searchParams.get("debug") === "1";

    const AnalyzedReport = getAnalyzedReportModel();

    const product = await Product.findById(params.id)
      .select("url analytics")
      .lean<{ url?: string; analytics?: any } | null>();

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Preferred lookup: analyzed report uses the same _id as the Product document.
    const reportById = await findAnalyzedReportAcrossDbs({
      AnalyzedReport,
      id: params.id,
      productUrl: product.url,
    });

    if (reportById) {
      return NextResponse.json(
        {
          analytics: {
            status: "complete",
            data: reportById,
          },
          ...(debug
            ? {
                debug: {
                  matched: "byId_orUrl_acrossDbs",
                  productUrl: product.url ?? null,
                },
              }
            : null),
        },
        { status: 200 }
      );
    }

    // Primary lookup: report stored with a productId.
    const reportByProductId = await AnalyzedReport.findOne({
      productId: params.id,
    })
      .sort({ createdAt: -1 })
      .lean();

    if (reportByProductId) {
      return NextResponse.json(
        {
          analytics: {
            status: "complete",
            data: reportByProductId,
          },
        },
        { status: 200 }
      );
    }

    // Fallback lookup: report stored with productUrl.
    if (product.url) {
      const reportByUrl = await AnalyzedReport.findOne({
        productUrl: product.url,
      })
        .sort({ createdAt: -1 })
        .lean();

      if (reportByUrl) {
        return NextResponse.json(
          {
            analytics: {
              status: "complete",
              data: reportByUrl,
            },
          },
          { status: 200 }
        );
      }
    }

    return NextResponse.json(
      {
        analytics: product.analytics ?? { status: "idle" },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load analytics" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDB();

    const AnalyzedReport = getAnalyzedReportModel();

    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "1";

    const product = await Product.findById(params.id)
      .select("_id url analytics")
      .lean<{ _id: any; url?: string; analytics?: any } | null>();

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // If a report already exists, don't retrigger unless forced.
    if (!force) {
      const existingById = await findAnalyzedReportAcrossDbs({
        AnalyzedReport,
        id: params.id,
        productUrl: product.url,
      });
      const existingByProductId = await AnalyzedReport.findOne({ productId: params.id })
        .select("_id")
        .lean();

      if (existingById?._id || existingByProductId?._id) {
        return NextResponse.json(
          { ok: true, status: "complete", retriggered: false },
          { status: 200 }
        );
      }
    }

    const reportWebhookUrl = process.env.N8N_PRODUCT_REPORT_WEBHOOK_URL;
    const callbackUrl = process.env.N8N_PRODUCT_REPORT_CALLBACK_URL;

    if (!reportWebhookUrl) {
      // Some deployments trigger the n8n analysis workflow elsewhere (e.g. on URL paste)
      // and only rely on this endpoint for polling. In that case, do not surface an error.
      return NextResponse.json(
        { ok: true, status: "pending", retriggered: false },
        { status: 202 }
      );
    }

    const status: string | undefined = product.analytics?.status;
    const requestedAtMs = getRequestedAtMs(product.analytics?.requestedAt);

    const isFreshPending =
      status === "pending" &&
      requestedAtMs !== null &&
      Date.now() - requestedAtMs < DEFAULT_POLL_SHOULD_RETRIGGER_AFTER_MS;

    if (!force && isFreshPending) {
      return NextResponse.json(
        { ok: true, status: "pending", retriggered: false },
        { status: 202 }
      );
    }

    await Product.updateOne(
      { _id: params.id },
      {
        $set: {
          "analytics.status": "pending",
          "analytics.requestedAt": new Date(),
          "analytics.completedAt": null,
          "analytics.error": null,
        },
      }
    );

    // Fire-and-forget: n8n is expected to POST the final payload back (or write to Mongo itself).
    // We include callbackUrl so n8n doesn't need DB credentials.
    void fetch(reportWebhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        productId: String(product._id),
        productUrl: product.url,
        callbackUrl,
      }),
    }).catch(async (e) => {
      await Product.updateOne(
        { _id: params.id },
        {
          $set: {
            "analytics.status": "failed",
            "analytics.completedAt": new Date(),
            "analytics.error":
              e?.message || "Failed to trigger analytics workflow",
          },
        }
      );
    });

    return NextResponse.json(
      { ok: true, status: "pending", retriggered: true },
      { status: 202 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to trigger analytics" },
      { status: 500 }
    );
  }
}
