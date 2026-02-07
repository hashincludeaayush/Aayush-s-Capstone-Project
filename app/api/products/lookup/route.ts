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

    const noTrailingSlash = u.toString().replace(/\/$/, "");
    candidates.add(noTrailingSlash);

    // Heuristics for Amazon-style URLs where identifiers are in the path and
    // tracking segments like `/ref=...` are also in the path (not in query).
    const host = u.hostname.toLowerCase();
    const pathname = u.pathname;

    const isAmazonLike =
      host.includes("amazon.") ||
      host === "amzn.in" ||
      host === "amzn.to" ||
      host.endsWith(".amazon") ||
      host.startsWith("www.amazon.");

    if (isAmazonLike) {
      // Canonicalize `/dp/<ASIN>` and `/gp/product/<ASIN>` to a stable form.
      const asinMatch = pathname.match(/\/(dp|gp\/product)\/([A-Z0-9]{10})(?:\/|$)/i);
      if (asinMatch) {
        const asin = asinMatch[2].toUpperCase();
        const baseHost = host.startsWith("www.") ? host.slice(4) : host;
        candidates.add(`https://${baseHost}/dp/${asin}`);
        candidates.add(`https://www.${baseHost}/dp/${asin}`);
        candidates.add(`http://${baseHost}/dp/${asin}`);
        candidates.add(`http://www.${baseHost}/dp/${asin}`);
      }

      // Strip common Amazon path tracking segments, e.g. `/ref=...`.
      if (pathname.includes("/ref=")) {
        const strippedPath = pathname.split("/ref=")[0];
        const stripped = new URL(u.toString());
        stripped.pathname = strippedPath;
        stripped.search = "";
        stripped.hash = "";
        candidates.add(stripped.toString().replace(/\/$/, ""));
      }
    }
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
      // If the user pasted a short link (e.g. amzn.to), try to resolve the final URL
      // quickly and re-check. This is best-effort and should stay fast.
      const host = (() => {
        try {
          return new URL(url).hostname.toLowerCase();
        } catch {
          return "";
        }
      })();

      const canResolve = host === "amzn.to" || host.endsWith(".amzn.to");

      if (canResolve) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 3000);
          const res = await fetch(url, {
            method: "GET",
            redirect: "follow",
            signal: controller.signal,
            headers: {
              "User-Agent": "Mozilla/5.0",
            },
          });
          clearTimeout(timer);
          // Avoid downloading the body.
          try {
            await res.body?.cancel?.();
          } catch {
            // ignore
          }

          const resolvedUrl = res.url;
          if (resolvedUrl && resolvedUrl !== url) {
            const resolvedCandidates = buildUrlCandidates(resolvedUrl);
            const merged = Array.from(new Set([...urlList, ...resolvedCandidates]));
            const foundResolved = await Product.findOne({ url: { $in: merged } })
              .select("_id")
              .lean<{ _id?: any } | null>();

            if (foundResolved?._id) {
              return NextResponse.json({
                found: true,
                productId: foundResolved._id.toString(),
              });
            }
          }
        } catch {
          // ignore resolve failures
        }
      }

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
