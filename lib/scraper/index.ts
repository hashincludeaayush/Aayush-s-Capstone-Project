"use server"

import axios from 'axios';

export type ScrapeWebhookResult =
  | { ok: true; status: number; data: any }
  | { ok: false; status?: number; error: string };

export async function scrapeProduct(url: string): Promise<ScrapeWebhookResult> {
  if (!url) return { ok: false, error: "Missing URL" };

  try {
    // Replace with your actual n8n webhook URL
    const n8nEndpoint = "https://workflows.shoto.cloud/webhook/66cb6b95-4bc2-4921-a6c2-ccb62793184f";
    const response = await axios.post(
      n8nEndpoint,
      { url },
      {
        timeout: 120_000,
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