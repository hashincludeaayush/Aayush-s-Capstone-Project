"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AnalyticsState = {
  status: "idle" | "pending" | "complete" | "failed";
  requestedAt?: string;
  completedAt?: string;
  error?: string;
  data?: any;
};

type AnalyticsPayload = {
  deal_score?: number;
  deal_verdict?: string;

  competitor_snapshot?: Array<{
    name: string;
    price: number;
    difference?: string;
    website?: string;
    url?: string;
  }>;

  market_position_whiskers?: {
    category_name?: string;
    market_low?: number;
    market_high?: number;
    market_average?: number;
    current_product_position?: number;
  };

  price_volatility_context?: {
    rating?: string;
    all_time_low?: number;
    all_time_high?: number;
    annotated_events?: Array<{ event: string; date_approx?: string }>;
  };

  sentiment_bar_data?: {
    positive_pct?: number;
    neutral_pct?: number;
    negative_pct?: number;
    summary_quote?: string;
    real_comments?: Array<{
      source: string;
      comment: string;
      url?: string;
    }>;
  };

  keyword_cloud?: Array<{
    word: string;
    type: "positive" | "negative";
    weight: number;
  }>;

  price_trend?: {
    currency?: string;
    points?: Array<{ date: string; price: number }>;
    source?: string;
  };

  active_discounts_offers?: Array<{
    title: string;
    merchant?: string;
    website?: string;
    card_offer?: string;
    discount_pct?: number;
    discount_amount?: number;
    final_price?: number;
    expires_at?: string;
    url?: string;
  }>;

  cross_site_prices?: Array<{
    site: string;
    price: number;
    in_stock?: boolean;
    url?: string;
    last_checked_at?: string;
  }>;
};

function clampPct(value: any): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function numberOrNull(value: any): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function ChipSkeleton() {
  return (
    <span className="inline-flex h-7 w-20 animate-pulse rounded-full bg-white-100/10 border border-white-100/10" />
  );
}

type CardTone =
  | "default"
  | "deal"
  | "context"
  | "trend"
  | "keywords"
  | "cross"
  | "whiskers"
  | "sentiment";

function toneClasses(tone: CardTone | undefined) {
  switch (tone) {
    case "deal":
      return {
        wrapper:
          "border-primary-green/20 bg-gradient-to-br from-primary-orange/10 via-neutral-black/55 to-primary-green/12",
        icon: "bg-gradient-to-br from-primary-orange/35 via-chart-1/25 to-primary-green/35",
      };
    case "context":
      return {
        wrapper:
          "border-chart-1/20 bg-gradient-to-br from-chart-1/12 via-neutral-black/55 to-primary-orange/10",
        icon: "bg-gradient-to-br from-chart-1/35 via-primary-orange/20 to-white-100/10",
      };
    case "trend":
      return {
        wrapper:
          "border-sky-400/15 bg-gradient-to-br from-sky-500/12 via-neutral-black/55 to-indigo-500/10",
        icon: "bg-gradient-to-br from-sky-500/30 via-indigo-500/20 to-white-100/10",
      };
    case "keywords":
      return {
        wrapper:
          "border-primary-green/15 bg-gradient-to-br from-primary-green/10 via-neutral-black/55 to-red-500/10",
        icon: "bg-gradient-to-br from-primary-green/30 via-white-100/10 to-red-500/20",
      };
    case "cross":
      return {
        wrapper:
          "border-teal-400/15 bg-gradient-to-br from-teal-500/10 via-neutral-black/55 to-sky-500/10",
        icon: "bg-gradient-to-br from-teal-500/30 via-sky-500/20 to-white-100/10",
      };
    case "whiskers":
      return {
        wrapper:
          "border-primary-orange/20 bg-gradient-to-br from-primary-orange/12 via-neutral-black/55 to-chart-1/10",
        icon: "bg-gradient-to-br from-primary-orange/30 via-chart-1/25 to-white-100/10",
      };
    case "sentiment":
      return {
        wrapper:
          "border-red-500/15 bg-gradient-to-br from-red-500/10 via-neutral-black/55 to-sky-500/10",
        icon: "bg-gradient-to-br from-red-500/25 via-sky-500/20 to-white-100/10",
      };
    default:
      return {
        wrapper: "border-white-100/10 bg-neutral-black/40",
        icon: "bg-gradient-to-br from-primary-orange/30 via-chart-1/25 to-primary-green/30",
      };
  }
}

function PlaceholderCard({
  title,
  subtitle,
  tone = "default",
}: {
  title: string;
  subtitle: string;
  tone?: CardTone;
}) {
  const t = toneClasses(tone);
  return (
    <div className={`rounded-2xl border p-5 shadow-xs ${t.wrapper}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-white-100 font-semibold">{title}</p>
          <p className="text-xs text-white-200 mt-1">{subtitle}</p>
        </div>
        <div className={`h-9 w-9 rounded-xl ${t.icon}`} aria-hidden="true" />
      </div>

      <div className="mt-4 h-[220px] rounded-xl bg-white-100/5 border border-white-100/10 overflow-hidden">
        <div className="h-full w-full animate-pulse bg-gradient-to-r from-white-100/5 via-white-100/10 to-white-100/5" />
      </div>
    </div>
  );
}

function PlaceholderBlock({
  title,
  subtitle,
  children,
  tone = "default",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  tone?: CardTone;
}) {
  const t = toneClasses(tone);
  return (
    <div className={`rounded-2xl border p-5 shadow-xs ${t.wrapper}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-white-100 font-semibold">{title}</p>
          {subtitle && (
            <p className="text-xs text-white-200 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`h-9 w-9 rounded-xl ${t.icon}`} aria-hidden="true" />
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default function ProductAnalytics({ productId }: { productId: string }) {
  const [analytics, setAnalytics] = useState<AnalyticsState>({
    status: "idle",
  });
  const [triggerError, setTriggerError] = useState<string | null>(null);
  const started = useRef(false);

  const payload: AnalyticsPayload | null = useMemo(() => {
    const raw = analytics.data;
    if (!raw || typeof raw !== "object") return null;

    const nested = (raw as any).analytics_payload;
    if (nested && typeof nested === "object") {
      return { ...(raw as any), ...(nested as any) } as AnalyticsPayload;
    }

    return raw as AnalyticsPayload;
  }, [analytics.data]);

  const dealScore = numberOrNull(payload?.deal_score);
  const dealVerdict =
    typeof payload?.deal_verdict === "string" ? payload?.deal_verdict : null;

  const competitorSnapshot = Array.isArray(payload?.competitor_snapshot)
    ? payload?.competitor_snapshot
    : [];

  const whiskers = payload?.market_position_whiskers;
  const marketLow = numberOrNull(whiskers?.market_low);
  const marketHigh = numberOrNull(whiskers?.market_high);
  const marketAvg = numberOrNull(whiskers?.market_average);
  const currentPos = numberOrNull(whiskers?.current_product_position);

  const whiskerDomain = useMemo(() => {
    const values = [marketLow, marketHigh, marketAvg, currentPos].filter(
      (v): v is number => typeof v === "number" && Number.isFinite(v),
    );

    if (values.length === 0) return null;

    let min = Math.min(...values);
    let max = Math.max(...values);

    if (min === max) {
      const pad = Math.max(1, Math.round(Math.abs(min) * 0.05));
      min -= pad;
      max += pad;
    } else {
      const pad = (max - min) * 0.08;
      min -= pad;
      max += pad;
    }

    // Prices shouldn't go negative.
    min = Math.max(0, min);

    return [min, max] as const;
  }, [marketLow, marketHigh, marketAvg, currentPos]);

  const whiskerBarData = useMemo(() => {
    if (marketLow === null || marketHigh === null) return null;

    const low = Math.min(marketLow, marketHigh);
    const high = Math.max(marketLow, marketHigh);
    const range = Math.max(0, high - low);

    return {
      low,
      high,
      range,
      offset: low,
    };
  }, [marketLow, marketHigh]);

  const volatility = payload?.price_volatility_context;
  const volatilityRating =
    typeof volatility?.rating === "string" ? volatility?.rating : null;
  const allTimeLow = numberOrNull(volatility?.all_time_low);
  const allTimeHigh = numberOrNull(volatility?.all_time_high);
  const annotatedEvents = Array.isArray(volatility?.annotated_events)
    ? volatility?.annotated_events
    : [];

  const sentiment = payload?.sentiment_bar_data;
  const positivePct = clampPct(sentiment?.positive_pct);
  const neutralPct = clampPct(sentiment?.neutral_pct);
  const negativePct = clampPct(sentiment?.negative_pct);
  const summaryQuote =
    typeof sentiment?.summary_quote === "string"
      ? sentiment?.summary_quote
      : null;

  const realComments = Array.isArray(sentiment?.real_comments)
    ? sentiment?.real_comments
        .filter(
          (c): c is { source: string; comment: string; url?: string } =>
            !!c &&
            typeof (c as any).source === "string" &&
            typeof (c as any).comment === "string",
        )
        .slice(0, 4)
    : [];

  const keywords = Array.isArray(payload?.keyword_cloud)
    ? payload?.keyword_cloud
    : [];
  const positiveKeywords = keywords.filter((k) => k?.type === "positive");
  const negativeKeywords = keywords.filter((k) => k?.type === "negative");

  const formatMoney = (value: unknown, currency: string | undefined = "") => {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return "—";
    const prefix = currency ? `${currency} ` : "";
    return `${prefix}${formatCompactNumber(n)}`;
  };

  const priceTrend =
    (payload as any)?.price_trend ?? (payload as any)?.priceTrend ?? null;
  const priceTrendCurrency =
    typeof priceTrend?.currency === "string" ? priceTrend.currency : "";
  const priceTrendSource =
    typeof priceTrend?.source === "string" ? priceTrend.source : null;
  const priceTrendPoints = Array.isArray(priceTrend?.points)
    ? priceTrend.points
        .filter(
          (p: any): p is { date: string; price: number } =>
            !!p &&
            typeof (p as any).date === "string" &&
            Number.isFinite(numberOrNull((p as any).price) as any),
        )
        .map((p: { date: string; price: number }) => ({
          date: p.date,
          price: Number(p.price),
        }))
    : [];

  const offers = Array.isArray((payload as any)?.active_discounts_offers)
    ? ((payload as any).active_discounts_offers as any[])
    : Array.isArray((payload as any)?.activeDiscountsOffers)
      ? ((payload as any).activeDiscountsOffers as any[])
      : [];

  const crossSitePrices = Array.isArray((payload as any)?.cross_site_prices)
    ? ((payload as any).cross_site_prices as any[])
        .filter(
          (
            p: any,
          ): p is {
            site: string;
            price: number;
            in_stock?: boolean;
            url?: string;
            last_checked_at?: string;
          } =>
            !!p &&
            typeof (p as any).site === "string" &&
            Number.isFinite(numberOrNull((p as any).price) as any),
        )
        .map(
          (p: {
            site: string;
            price: number;
            in_stock?: boolean;
            url?: string;
            last_checked_at?: string;
          }) => ({
            site: String((p as any).site),
            price: Number((p as any).price),
            in_stock:
              typeof (p as any).in_stock === "boolean"
                ? (p as any).in_stock
                : undefined,
            url:
              typeof (p as any).url === "string" ? (p as any).url : undefined,
            last_checked_at:
              typeof (p as any).last_checked_at === "string"
                ? (p as any).last_checked_at
                : undefined,
          }),
        )
    : Array.isArray((payload as any)?.crossSitePrices)
      ? ((payload as any).crossSitePrices as any[])
      : [];

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const trigger = async () => {
      setTriggerError(null);
      const res = await fetch(`/api/products/${productId}/analytics`, {
        method: "POST",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setTriggerError(body?.error || "Failed to trigger analytics");
      }
    };

    void trigger();
  }, [productId]);

  useEffect(() => {
    let cancelled = false;
    let interval: any;

    const load = async () => {
      const res = await fetch(`/api/products/${productId}/analytics`, {
        method: "GET",
        cache: "no-store",
      });
      if (!res.ok) return;
      const body = await res.json().catch(() => null);
      if (!body || cancelled) return;
      setAnalytics(body.analytics ?? { status: "idle" });
    };

    void load();

    interval = setInterval(load, 4000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [productId]);

  const isPending =
    analytics.status === "pending" || analytics.status === "idle";

  const formatCompactNumber = (value: unknown) => {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return "—";
    if (Math.abs(n) >= 1000)
      return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
    if (Math.abs(n) >= 100)
      return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
    return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
  };

  return (
    <section className="mt-14 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="section-text">Insights & Analytics</h3>
          <p className="text-white-200 text-sm mt-1 max-w-3xl">
            Gathering deeper signals (reviews, recommendations, market context)
            for this product. Meanwhile, feel free to analyze prices using our
            AI Agent chat.
          </p>
        </div>

        {analytics.status === "complete" && (
          <span className="inline-flex items-center rounded-full border border-primary-green/30 bg-primary-green/10 px-3 py-1 text-xs font-semibold text-primary-green">
            Report ready
          </span>
        )}
        {analytics.status === "failed" && (
          <span className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
            Report failed
          </span>
        )}
      </div>

      {triggerError && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
          {triggerError}
        </div>
      )}

      {analytics.status === "failed" && analytics.error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
          {analytics.error}
        </div>
      )}

      {isPending ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="flex flex-col gap-5">
            <PlaceholderCard
              title="Deal score + competitor snapshot"
              subtitle="Scores value and compares alternatives to explain whether this deal is good"
              tone="deal"
            />
            <PlaceholderCard
              title="Price context + offers"
              subtitle="Summarizes volatility, notable price events, and active discounts available right now"
              tone="context"
            />
          </div>

          <div className="flex flex-col gap-5">
            <PlaceholderCard
              title="Price trend"
              subtitle="Charts historical price movement so you can see trends and reversals"
              tone="trend"
            />
            <PlaceholderBlock
              title="Keyword cloud"
              subtitle="Extracting recurring themes from reviews: praises, complaints, and repeated keywords"
              tone="keywords"
            >
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <ChipSkeleton key={i} />
                ))}
              </div>
            </PlaceholderBlock>
            <PlaceholderCard
              title="Cross-site prices"
              subtitle="Shows prices from other websites to confirm the best current place to buy"
              tone="cross"
            />
          </div>

          <div className="flex flex-col gap-5">
            <PlaceholderCard
              title="Market position (whiskers plot)"
              subtitle="Builds category price range and places this product inside that distribution"
              tone="whiskers"
            />
            <PlaceholderCard
              title="Voice of customer"
              subtitle="Summarizes buyer sentiment and real comments to explain satisfaction and concerns"
              tone="sentiment"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left column */}
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border p-5 shadow-xs border-primary-green/20 bg-gradient-to-br from-primary-orange/10 via-neutral-black/55 to-primary-green/12">
              {/* Deal score + Competitor snapshot */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-white-100 font-semibold">Deal score</p>
                  <p className="text-xs text-white-200 mt-1">
                    Summarizes overall value: price vs market, competition, and
                    recent signals.
                  </p>
                </div>
                {typeof dealScore === "number" && (
                  <span className="inline-flex items-center rounded-full border border-white-100/10 bg-white-100/5 px-3 py-1 text-xs font-semibold text-white-100">
                    {Math.round(dealScore)}/100
                  </span>
                )}
              </div>

              <div className="mt-4">
                <div className="h-2 w-full rounded-full bg-white-100/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-orange via-chart-1 to-primary-green"
                    style={{
                      width: `${Math.max(0, Math.min(100, dealScore ?? 0))}%`,
                    }}
                  />
                </div>
                <p className="mt-3 text-sm text-white-100">
                  {dealVerdict ?? "No verdict provided."}
                </p>
              </div>

              <div className="my-5 h-px w-full bg-white-100/10" />

              <p className="text-white-100 font-semibold">
                Competitor snapshot
              </p>
              <p className="text-xs text-white-200 mt-1">
                Compares similar products’ prices across sources to see
                better-value alternatives quickly.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3">
                {competitorSnapshot.length ? (
                  competitorSnapshot.slice(0, 3).map((c, idx) => (
                    <div
                      key={`${c.name}-${idx}`}
                      className="rounded-xl border border-white-100/10 bg-white-100/5 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-white-100 text-sm font-semibold truncate">
                          {c.name}
                        </p>
                        <p className="text-white-100 text-sm font-semibold">
                          {Number.isFinite(c.price)
                            ? formatCompactNumber(c.price)
                            : "—"}
                        </p>
                      </div>
                      {(c.website || c.difference || c.url) && (
                        <p className="text-xs text-white-200 mt-1">
                          {c.website ? `Source: ${c.website}` : ""}
                          {c.website && c.difference ? " • " : ""}
                          {c.difference ?? ""}
                          {c.url ? (
                            <>
                              {c.website || c.difference ? " • " : ""}
                              <a
                                href={c.url}
                                target="_blank"
                                rel="noreferrer"
                                className="underline underline-offset-2 text-white-100/80"
                              >
                                link
                              </a>
                            </>
                          ) : null}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-white-200">No competitor data.</p>
                )}
              </div>
            </div>

            {/* Volatility + Offers */}
            <div className="rounded-2xl border p-5 shadow-xs border-chart-1/20 bg-gradient-to-br from-chart-1/12 via-neutral-black/55 to-primary-orange/10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-white-100 font-semibold">
                    Price volatility context
                  </p>
                  <p className="text-xs text-white-200 mt-1">
                    Highlights price extremes and events that explain major
                    jumps or drops.
                  </p>
                </div>
                {volatilityRating && (
                  <span className="inline-flex items-center rounded-full border border-white-100/10 bg-white-100/5 px-3 py-1 text-xs font-semibold text-white-100">
                    {volatilityRating}
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-white-200">
                <div>
                  All-time low:{" "}
                  <span className="text-white-100 font-semibold">
                    {allTimeLow ?? "—"}
                  </span>
                </div>
                <div>
                  All-time high:{" "}
                  <span className="text-white-100 font-semibold">
                    {allTimeHigh ?? "—"}
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-white-100/10 bg-white-100/5 p-4">
                <p className="text-white-100 text-sm font-semibold">
                  Annotated events
                </p>
                {annotatedEvents.length ? (
                  <ul className="mt-2 space-y-2 max-h-40 overflow-auto pr-1">
                    {annotatedEvents.slice(0, 8).map((e, idx) => (
                      <li key={idx} className="text-xs text-white-200">
                        <span className="text-white-100 font-semibold">
                          {e.event}
                        </span>
                        {e.date_approx ? ` • ${e.date_approx}` : ""}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-white-200">
                    No events provided.
                  </p>
                )}
              </div>

              <div className="mt-4 rounded-xl border border-white-100/10 bg-white-100/5 p-4">
                <p className="text-white-100 text-sm font-semibold">
                  Active discounts & offers
                </p>
                <p className="text-xs text-white-200 mt-1">
                  Lists active discounts and card offers found online, with
                  sources and links.
                </p>

                <div className="mt-3 space-y-3">
                  {offers.length ? (
                    offers.slice(0, 4).map((o, idx) => {
                      const pct = numberOrNull((o as any).discount_pct);
                      const final = numberOrNull((o as any).final_price);
                      const merchant =
                        typeof (o as any).merchant === "string"
                          ? (o as any).merchant
                          : null;
                      const website =
                        typeof (o as any).website === "string"
                          ? (o as any).website
                          : null;
                      const cardOffer =
                        typeof (o as any).card_offer === "string"
                          ? (o as any).card_offer
                          : null;
                      const expiresAt =
                        typeof (o as any).expires_at === "string"
                          ? (o as any).expires_at
                          : null;
                      const url =
                        typeof (o as any).url === "string"
                          ? (o as any).url
                          : null;

                      return (
                        <div
                          key={`${(o as any).title ?? "offer"}-${idx}`}
                          className="rounded-xl border border-white-100/10 bg-neutral-black/30 px-4 py-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-white-100 text-sm font-semibold line-clamp-2">
                              {String((o as any).title ?? "Untitled offer")}
                            </p>
                            {pct !== null && (
                              <span className="shrink-0 inline-flex items-center rounded-full border border-primary-green/30 bg-primary-green/10 px-2.5 py-1 text-xs font-semibold text-primary-green">
                                {Math.round(pct)}%
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white-200">
                            {website && (
                              <span className="truncate">{website}</span>
                            )}
                            {merchant && (
                              <span className="truncate">{merchant}</span>
                            )}
                            {cardOffer && (
                              <span className="truncate">
                                Card: {cardOffer}
                              </span>
                            )}
                            {final !== null && (
                              <span className="text-white-100 font-semibold">
                                {formatMoney(final)}
                              </span>
                            )}
                            {expiresAt && (
                              <span className="truncate">
                                Expires: {expiresAt}
                              </span>
                            )}
                            {url ? (
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="underline underline-offset-2 text-white-100/80"
                              >
                                link
                              </a>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-white-200">
                      No active offers found.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Middle column */}
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border p-5 shadow-xs overflow-hidden border-sky-400/15 bg-gradient-to-br from-sky-500/12 via-neutral-black/55 to-indigo-500/10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-white-100 font-semibold">Price trend</p>
                  <p className="text-xs text-white-200 mt-1">
                    Visualizes price movement over time to spot trends and
                    seasonal changes.
                  </p>
                </div>
                {priceTrendSource && (
                  <span className="inline-flex items-center rounded-full border border-white-100/10 bg-white-100/5 px-3 py-1 text-xs font-semibold text-white-100 truncate max-w-[160px]">
                    {priceTrendSource}
                  </span>
                )}
              </div>

              <div className="mt-4 h-[220px] overflow-hidden rounded-xl border border-white-100/10 bg-white-100/5">
                {priceTrendPoints.length < 2 ? (
                  <div className="h-full w-full p-4">
                    <p className="text-xs text-white-200">No trend data yet.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={priceTrendPoints}
                      margin={{ top: 12, right: 16, bottom: 12, left: 16 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 12 }}
                        axisLine={{ stroke: "rgba(255,255,255,0.18)" }}
                        tickLine={{ stroke: "rgba(255,255,255,0.18)" }}
                        minTickGap={24}
                      />
                      <YAxis
                        tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 12 }}
                        axisLine={{ stroke: "rgba(255,255,255,0.18)" }}
                        tickLine={{ stroke: "rgba(255,255,255,0.18)" }}
                        tickFormatter={(v) =>
                          formatMoney(v, priceTrendCurrency)
                        }
                        width={64}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active) return null;
                          const val = payload?.[0]?.value;
                          if (val === undefined || val === null) return null;
                          return (
                            <div className="rounded-lg border border-white-100/10 bg-neutral-black/80 px-3 py-2 text-xs text-white-100 shadow-sm">
                              <div className="font-semibold">
                                {String(label ?? "")}
                              </div>
                              <div className="mt-1 text-white-200">
                                Price: {formatMoney(val, priceTrendCurrency)}
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#60a5fa"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="rounded-2xl border p-5 shadow-xs relative overflow-hidden border-primary-green/15 bg-gradient-to-br from-primary-green/10 via-neutral-black/55 to-red-500/10">
              {/* Cloudy backdrop */}
              <div
                className="pointer-events-none absolute -top-8 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute top-10 -left-12 h-44 w-44 rounded-full bg-primary-green/10 blur-3xl"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute -bottom-10 left-1/3 h-48 w-48 rounded-full bg-red-500/10 blur-3xl"
                aria-hidden="true"
              />

              <p className="text-white-100 font-semibold">Keyword cloud</p>
              <p className="text-xs text-white-200 mt-1">
                Surfaces recurring review themes: what users praise, complain
                about, and mention often.
              </p>

              <div className="mt-4 relative rounded-2xl border border-white-100/10 bg-white-100/5 p-4">
                <div
                  className="pointer-events-none absolute inset-0 rounded-2xl opacity-80"
                  style={{
                    background:
                      "radial-gradient(circle at 20% 35%, rgba(255,255,255,0.10), transparent 45%), radial-gradient(circle at 70% 25%, rgba(34,197,94,0.12), transparent 50%), radial-gradient(circle at 60% 75%, rgba(239,68,68,0.10), transparent 55%)",
                  }}
                  aria-hidden="true"
                />

                <div className="relative flex flex-wrap gap-2">
                  {keywords.length ? (
                    keywords
                      .slice(0, 18)
                      .sort((a, b) => (b?.weight ?? 0) - (a?.weight ?? 0))
                      .map((k, idx) => {
                        const weight = Math.max(
                          1,
                          Math.min(10, Number((k as any).weight) || 1),
                        );
                        const isNeg = (k as any).type === "negative";

                        const cloudBg = isNeg
                          ? "rgba(239, 68, 68, 0.14)"
                          : "rgba(34, 197, 94, 0.14)";
                        const cloudBorder = isNeg
                          ? "rgba(239, 68, 68, 0.30)"
                          : "rgba(34, 197, 94, 0.30)";
                        const cloudGlow = isNeg
                          ? "rgba(239, 68, 68, 0.12)"
                          : "rgba(34, 197, 94, 0.12)";

                        // Keep chip size consistent (smaller), while still using weight for ordering/animation.
                        const fontSize = 11;
                        const padY = 5;
                        const padX = 10;
                        const baseH = 26;

                        // Constant oval shape (no per-chip scaling).
                        const sx = 1.08;
                        const sy = 1.02;

                        const driftClass =
                          idx % 3 === 0
                            ? "cloud-drift-a"
                            : idx % 3 === 1
                              ? "cloud-drift-b"
                              : "cloud-drift-c";
                        const driftDuration =
                          10 + (idx % 6) * 1.5 + weight * 0.25;
                        const driftDelay = -1 * ((idx % 8) * 1.2);

                        return (
                          <span
                            key={`${(k as any).word}-${idx}`}
                            className="relative inline-flex items-center justify-center select-none whitespace-nowrap font-semibold tracking-tight transition hover:-translate-y-[1px]"
                            style={{
                              fontSize,
                              padding: `${padY}px ${padX}px`,
                              minHeight: baseH,
                            }}
                            title={`weight ${weight}`}
                          >
                            {/* Oval background */}
                            <span
                              className="absolute inset-0 -z-10 rounded-full"
                              aria-hidden="true"
                              style={{
                                transform: `scale(${sx}, ${sy})`,
                              }}
                            >
                              <span
                                className={`absolute inset-0 rounded-full ${driftClass}`}
                                style={{
                                  background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.14), transparent 55%), ${cloudBg}`,
                                  backgroundSize: "160% 160%",
                                  backgroundRepeat: "no-repeat",
                                  border: `1px solid ${cloudBorder}`,
                                  boxShadow: `0 10px 30px ${cloudGlow}`,
                                  animationDuration: `${driftDuration}s`,
                                  animationDelay: `${driftDelay}s`,
                                }}
                              />
                            </span>

                            <span
                              className={
                                isNeg ? "text-red-100" : "text-primary-green"
                              }
                              style={{
                                textShadow: `0 2px 18px ${cloudGlow}`,
                              }}
                            >
                              {String((k as any).word ?? "")}
                            </span>
                          </span>
                        );
                      })
                  ) : (
                    <p className="text-xs text-white-200">
                      No keywords provided.
                    </p>
                  )}
                </div>
              </div>

              {(positiveKeywords.length || negativeKeywords.length) && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-primary-green/25 bg-gradient-to-br from-primary-green/12 via-white-100/5 to-white-100/0 p-3">
                    <p className="text-primary-green font-semibold">
                      Green flags
                    </p>
                    <p className="text-white-200 mt-1">
                      {positiveKeywords
                        .slice(0, 6)
                        .map((k) => (k as any).word)
                        .join(", ") || "—"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-red-500/25 bg-gradient-to-br from-red-500/12 via-white-100/5 to-white-100/0 p-3">
                    <p className="text-red-200 font-semibold">Red flags</p>
                    <p className="text-white-200 mt-1">
                      {negativeKeywords
                        .slice(0, 6)
                        .map((k) => (k as any).word)
                        .join(", ") || "—"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border p-5 shadow-xs overflow-hidden border-teal-400/15 bg-gradient-to-br from-teal-500/10 via-neutral-black/55 to-sky-500/10">
              <p className="text-white-100 font-semibold">Cross-site prices</p>
              <p className="text-xs text-white-200 mt-1">
                Compares live prices across websites to find the cheapest
                trusted seller.
              </p>

              <div className="mt-4 h-[220px] overflow-hidden rounded-xl border border-white-100/10 bg-white-100/5">
                {crossSitePrices.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={crossSitePrices
                        .slice(0, 6)
                        .sort((a, b) => a.price - b.price)}
                      margin={{ top: 12, right: 16, bottom: 12, left: 16 }}
                      barCategoryGap={8}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis
                        type="number"
                        tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 12 }}
                        axisLine={{ stroke: "rgba(255,255,255,0.18)" }}
                        tickLine={{ stroke: "rgba(255,255,255,0.18)" }}
                        tickFormatter={formatCompactNumber}
                      />
                      <YAxis
                        type="category"
                        dataKey="site"
                        width={90}
                        tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active) return null;
                          const item = payload?.[0]?.payload as any;
                          if (!item) return null;
                          return (
                            <div className="rounded-lg border border-white-100/10 bg-neutral-black/80 px-3 py-2 text-xs text-white-100 shadow-sm">
                              <div className="font-semibold">
                                {String(item.site ?? "")}
                              </div>
                              <div className="mt-1 text-white-200">
                                Price: {formatCompactNumber(item.price)}
                              </div>
                              {typeof item.in_stock === "boolean" && (
                                <div className="text-white-200">
                                  {item.in_stock ? "In stock" : "Out of stock"}
                                </div>
                              )}
                            </div>
                          );
                        }}
                      />
                      <Bar
                        dataKey="price"
                        fill="rgba(255,255,255,0.14)"
                        isAnimationActive={false}
                        radius={[10, 10, 10, 10]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full p-4">
                    <p className="text-xs text-white-200">
                      No cross-site prices yet.
                    </p>
                  </div>
                )}
              </div>

              {crossSitePrices.length ? (
                <div className="mt-3 text-xs text-white-200">
                  Lowest:{" "}
                  <span className="text-white-100 font-semibold">
                    {formatCompactNumber(
                      Math.min(...crossSitePrices.map((p) => p.price)),
                    )}
                  </span>
                  {" • "}
                  Highest:{" "}
                  <span className="text-white-100 font-semibold">
                    {formatCompactNumber(
                      Math.max(...crossSitePrices.map((p) => p.price)),
                    )}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border p-5 shadow-xs overflow-hidden border-primary-orange/20 bg-gradient-to-br from-primary-orange/12 via-neutral-black/55 to-chart-1/10">
              <p className="text-white-100 font-semibold">
                Market position (whiskers)
              </p>
              <p className="text-xs text-white-200 mt-1">
                Shows category price distribution and marks where this product
                sits today.
              </p>
              <p className="text-xs text-white-200/80 mt-1 break-words line-clamp-2">
                {whiskers?.category_name
                  ? `Category: ${whiskers.category_name}`
                  : "Category range"}
              </p>
              <div className="mt-4">
                {marketLow === null || marketHigh === null ? (
                  <p className="text-xs text-white-200">No data yet.</p>
                ) : (
                  <div className="h-[190px] overflow-hidden rounded-xl border border-white-100/10 bg-white-100/5">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={
                          whiskerBarData
                            ? [{ name: "Market", ...whiskerBarData }]
                            : []
                        }
                        margin={{ top: 18, right: 18, bottom: 10, left: 18 }}
                        barCategoryGap={0}
                        barGap={0}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis
                          type="number"
                          domain={
                            whiskerDomain ?? [
                              Math.min(marketLow, marketHigh),
                              Math.max(marketLow, marketHigh),
                            ]
                          }
                          allowDataOverflow
                          tick={{
                            fill: "rgba(255,255,255,0.65)",
                            fontSize: 12,
                          }}
                          tickFormatter={formatCompactNumber}
                          axisLine={{ stroke: "rgba(255,255,255,0.18)" }}
                          tickLine={{ stroke: "rgba(255,255,255,0.18)" }}
                        />
                        <YAxis type="category" dataKey="name" hide />
                        <Tooltip
                          cursor={false}
                          content={({ active, payload }) => {
                            if (!active) return null;
                            if (!payload || payload.length === 0) return null;

                            return (
                              <div className="rounded-lg border border-white-100/10 bg-neutral-black/80 px-3 py-2 text-xs text-white-100 shadow-sm">
                                <div className="font-semibold">
                                  Market position
                                </div>
                                <div className="mt-1 text-white-200">
                                  Range: {formatCompactNumber(marketLow)} –{" "}
                                  {formatCompactNumber(marketHigh)}
                                </div>
                                <div className="text-white-200">
                                  Avg: {formatCompactNumber(marketAvg)}
                                </div>
                                <div className="text-white-200">
                                  You: {formatCompactNumber(currentPos)}
                                </div>
                              </div>
                            );
                          }}
                        />
                        <ReferenceLine
                          x={marketLow}
                          stroke="rgba(255,255,255,0.25)"
                        />
                        <ReferenceLine
                          x={marketHigh}
                          stroke="rgba(255,255,255,0.25)"
                        />
                        {marketAvg !== null && (
                          <ReferenceLine
                            x={marketAvg}
                            stroke="#60a5fa"
                            strokeDasharray="6 4"
                          />
                        )}
                        {currentPos !== null && (
                          <ReferenceLine
                            x={currentPos}
                            stroke="#f97316"
                            strokeWidth={2}
                          />
                        )}
                        <Bar
                          dataKey="offset"
                          stackId="a"
                          fill="transparent"
                          isAnimationActive={false}
                        />
                        <Bar
                          dataKey="range"
                          stackId="a"
                          fill="rgba(255,255,255,0.14)"
                          isAnimationActive={false}
                          radius={[10, 10, 10, 10]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white-200">
                  <div className="min-w-0 truncate">
                    Low:{" "}
                    <span className="text-white-100 font-semibold">
                      {marketLow ?? "—"}
                    </span>
                  </div>
                  <div className="min-w-0 truncate">
                    High:{" "}
                    <span className="text-white-100 font-semibold">
                      {marketHigh ?? "—"}
                    </span>
                  </div>
                  <div className="min-w-0 truncate">
                    Avg:{" "}
                    <span className="text-white-100 font-semibold">
                      {marketAvg ?? "—"}
                    </span>
                  </div>
                  <div className="min-w-0 truncate">
                    You:{" "}
                    <span className="text-white-100 font-semibold">
                      {currentPos ?? "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border p-5 shadow-xs border-red-500/15 bg-gradient-to-br from-red-500/10 via-neutral-black/55 to-sky-500/10">
              <p className="text-white-100 font-semibold">
                Voice of customer (sentiment)
              </p>
              <p className="text-xs text-white-200 mt-1">
                Aggregates review sentiment and highlights real quotes
                explaining what buyers like or dislike.
              </p>
              <div className="mt-4 h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: "Sentiment",
                        positive: positivePct,
                        neutral: neutralPct,
                        negative: negativePct,
                      },
                    ]}
                    layout="vertical"
                    margin={{ top: 10, right: 20, bottom: 10, left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 12 }}
                    />
                    <YAxis type="category" dataKey="name" hide />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active) return null;
                        const item = payload?.[0];
                        if (!item) return null;
                        return (
                          <div className="rounded-lg border border-white-100/10 bg-neutral-black/80 px-3 py-2 text-xs text-white-100 shadow-sm">
                            <div className="font-semibold">Sentiment</div>
                            <div className="mt-1 text-white-200">
                              {String(item.name ?? item.dataKey ?? "")}:{" "}
                              {formatCompactNumber(item.value)}%
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Bar
                      dataKey="positive"
                      stackId="a"
                      fill="#22c55e"
                      isAnimationActive={false}
                    />
                    <Bar
                      dataKey="neutral"
                      stackId="a"
                      fill="#60a5fa"
                      isAnimationActive={false}
                    />
                    <Bar
                      dataKey="negative"
                      stackId="a"
                      fill="#f97316"
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {summaryQuote && (
                <p className="mt-3 text-xs text-white-200 italic">
                  “{summaryQuote}”
                </p>
              )}

              {realComments.length ? (
                <div className="mt-4 rounded-xl border border-white-100/10 bg-white-100/5 p-4">
                  <p className="text-white-100 text-sm font-semibold">
                    Real user comments
                  </p>
                  <ul className="mt-2 space-y-2">
                    {realComments.map((c, idx) => (
                      <li key={idx} className="text-xs text-white-200">
                        <span className="text-white-100 font-semibold">
                          {c.source}
                        </span>
                        {typeof c.url === "string" && c.url ? (
                          <>
                            {" "}
                            <a
                              href={c.url}
                              target="_blank"
                              rel="noreferrer"
                              className="underline underline-offset-2 text-white-100/80"
                            >
                              link
                            </a>
                          </>
                        ) : null}
                        <div className="mt-1 italic">“{c.comment}”</div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-white-100/10 bg-white-100/5 px-3 py-1 text-white-100">
                  Positive {positivePct}%
                </span>
                <span className="rounded-full border border-white-100/10 bg-white-100/5 px-3 py-1 text-white-100">
                  Neutral {neutralPct}%
                </span>
                <span className="rounded-full border border-white-100/10 bg-white-100/5 px-3 py-1 text-white-100">
                  Negative {negativePct}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
