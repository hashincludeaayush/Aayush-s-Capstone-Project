"use server"

import axios from 'axios';

export type ScrapeWebhookResult =
  | { ok: true; status: number; data: any }
  | { ok: false; status?: number; error: string };

export type TriggerScrapeResult =
  | { ok: true; status?: number; queued: true; productId?: string }
  | { ok: true; status?: number; queued: false; productId: string }
  | { ok: false; status?: number; error: string };

function extractProductId(value: any): string {
  const pick = (v: any) => {
    if (!v) return "";
    if (typeof v === "string") return v.trim();
    return "";
  };

  if (typeof value === "string") {
    const direct = pick(value);
    if (direct && /^[a-f\d]{24}$/i.test(direct)) return direct;

    try {
      return extractProductId(JSON.parse(value));
    } catch {
      return "";
    }
  }

  if (!value || typeof value !== "object") return "";

  const direct =
    pick((value as any).productId) ||
    pick((value as any).productID) ||
    pick((value as any).id);

  if (direct) return direct;

  // Common nesting patterns: { data: { productId } } or { result: { productId } }
  const nested =
    extractProductId((value as any).data) ||
    extractProductId((value as any).result) ||
    extractProductId((value as any).payload);

  return nested;
}

export async function scrapeProduct(url: string): Promise<ScrapeWebhookResult> {
  if (!url) return { ok: false, error: "Missing URL" };

  try {
    // Replace with your actual n8n webhook URL
    const n8nEndpoint = "https://workflows.shoto.cloud/webhook/66cb6b95-4bc2-4921-a6c2-ccb62793184f";
    const response = await axios.post(
      n8nEndpoint,
      { url },
      {
        timeout: 300_000,
        // Don't throw on non-2xx so we can return a clear error.
        validateStatus: () => true,
      }
    );

    if (response.status >= 200 && response.status < 300) {
      // n8n may respond with an empty body (e.g. 204) even when the workflow succeeded.
      return { ok: true, status: response.status, data: response.data };
    }

    const message =
      typeof response.data === "string" && response.data.trim()
        ? response.data.trim()
        : `Workflow request failed (${response.status})`;

    return { ok: false, status: response.status, error: message };
  } catch (error: any) {
    return {
      ok: false,
      error: error?.message || "Failed to reach workflow",
    };
  }
}

// For serverless environments (e.g. Vercel Hobby), we must not wait minutes for the
// workflow HTTP response. This function tries to trigger the workflow and returns
// quickly; the UI can then poll MongoDB until the product exists.
export async function triggerScrapeProduct(url: string): Promise<TriggerScrapeResult> {
  if (!url) return { ok: false, error: "Missing URL" };

  try {
    const n8nEndpoint = "https://workflows.shoto.cloud/webhook/66cb6b95-4bc2-4921-a6c2-ccb62793184f";
    const response = await axios.post(
      n8nEndpoint,
      { url },
      {
        timeout: 8_000,
        validateStatus: () => true,
      },
    );

    if (response.status >= 200 && response.status < 300) {
      const data: any = response.data;
      const productId = extractProductId(data);

      if (productId) {
        return { ok: true, status: response.status, queued: false, productId };
      }

      return { ok: true, status: response.status, queued: true };
    }

    const message =
      typeof response.data === "string" && response.data.trim()
        ? response.data.trim()
        : `Workflow trigger failed (${response.status})`;

    return { ok: false, status: response.status, error: message };
  } catch (error: any) {
    // If we timed out waiting for a response, assume the webhook was received and
    // the workflow is still running.
    const message = String(error?.message || "");
    const isTimeout = /timeout|timed out|exceeded|ECONNABORTED/i.test(message);
    if (isTimeout) {
      return { ok: true, queued: true };
    }

    return {
      ok: false,
      error: error?.message || "Failed to reach workflow",
    };
  }
}