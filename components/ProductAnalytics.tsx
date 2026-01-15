"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
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
  };

  keyword_cloud?: Array<{
    word: string;
    type: "positive" | "negative";
    weight: number;
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

function PlaceholderCard({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-white-100/10 bg-neutral-black/40 p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-white-100 font-semibold">{title}</p>
          <p className="text-xs text-white-200 mt-1">{subtitle}</p>
        </div>
        <div
          className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-orange/30 via-chart-1/25 to-primary-green/30"
          aria-hidden="true"
        />
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
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white-100/10 bg-neutral-black/40 p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-white-100 font-semibold">{title}</p>
          {subtitle && (
            <p className="text-xs text-white-200 mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-orange/30 via-chart-1/25 to-primary-green/30"
          aria-hidden="true"
        />
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
    const p = (raw as any).analytics_payload ?? raw;
    if (!p || typeof p !== "object") return null;
    return p as AnalyticsPayload;
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
      (v): v is number => typeof v === "number" && Number.isFinite(v)
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

  const keywords = Array.isArray(payload?.keyword_cloud)
    ? payload?.keyword_cloud
    : [];
  const positiveKeywords = keywords.filter((k) => k?.type === "positive");
  const negativeKeywords = keywords.filter((k) => k?.type === "negative");

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
          <PlaceholderBlock
            title="Deal score"
            subtitle="Scoring current price vs market + history"
          >
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white-100/10 border border-white-100/10 animate-pulse" />
              <div className="flex-1">
                <div className="h-3 w-2/3 rounded bg-white-100/10 animate-pulse" />
                <div className="mt-2 h-3 w-1/2 rounded bg-white-100/10 animate-pulse" />
              </div>
            </div>
            <div className="mt-4 h-2 w-full rounded-full bg-white-100/10 overflow-hidden">
              <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-primary-orange via-chart-1 to-primary-green animate-[shimmer_1.1s_ease-in-out_infinite]" />
            </div>
          </PlaceholderBlock>

          <PlaceholderBlock
            title="Competitor snapshot"
            subtitle="Finding 2–3 top alternatives and their current prices"
          >
            <div className="grid grid-cols-1 gap-3">
              <div className="h-14 rounded-xl bg-white-100/5 border border-white-100/10 animate-pulse" />
              <div className="h-14 rounded-xl bg-white-100/5 border border-white-100/10 animate-pulse" />
              <div className="h-14 rounded-xl bg-white-100/5 border border-white-100/10 animate-pulse" />
            </div>
          </PlaceholderBlock>

          <PlaceholderCard
            title="Market position (whiskers plot)"
            subtitle="Building category range + your position"
          />

          <PlaceholderCard
            title="Price context"
            subtitle="All-time low/high + key timeline events"
          />

          <PlaceholderCard
            title="Sentiment split"
            subtitle="Estimating positive/neutral/negative from real users"
          />

          <PlaceholderBlock
            title="Keyword cloud"
            subtitle="Extracting recurring praises + red flags"
          >
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <ChipSkeleton key={i} />
              ))}
            </div>
          </PlaceholderBlock>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-white-100/10 bg-neutral-black/40 p-5 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-white-100 font-semibold">Deal score</p>
                <p className="text-xs text-white-200 mt-1">
                  Quick verdict based on your report.
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
          </div>

          <div className="rounded-2xl border border-white-100/10 bg-neutral-black/40 p-5 shadow-xs">
            <p className="text-white-100 font-semibold">Competitor snapshot</p>
            <p className="text-xs text-white-200 mt-1">
              Head-to-head alternatives.
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
                        {Number.isFinite(c.price) ? c.price : "—"}
                      </p>
                    </div>
                    {c.difference && (
                      <p className="text-xs text-white-200 mt-1">
                        {c.difference}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-white-200">No competitor data.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white-100/10 bg-neutral-black/40 p-5 shadow-xs overflow-hidden">
            <p className="text-white-100 font-semibold">
              Market position (whiskers)
            </p>
            <p className="text-xs text-white-200 mt-1 break-words line-clamp-2">
              {whiskers?.category_name
                ? `Category: ${whiskers.category_name}`
                : "Category range"}
            </p>
            <div className="mt-4">
              {marketLow === null || marketHigh === null ? (
                <p className="text-xs text-white-200">Missing market range.</p>
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
                        tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 12 }}
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
                      {/* Range bar: offset is transparent, range is visible */}
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

          <div className="rounded-2xl border border-white-100/10 bg-neutral-black/40 p-5 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-white-100 font-semibold">
                  Price volatility context
                </p>
                <p className="text-xs text-white-200 mt-1">
                  All-time low/high + annotated events.
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
                <ul className="mt-2 space-y-2">
                  {annotatedEvents.slice(0, 4).map((e, idx) => (
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
          </div>

          <div className="rounded-2xl border border-white-100/10 bg-neutral-black/40 p-5 shadow-xs">
            <p className="text-white-100 font-semibold">
              Voice of customer (sentiment)
            </p>
            <p className="text-xs text-white-200 mt-1">
              Positive vs neutral vs negative.
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
                  <Tooltip />
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

          <div className="rounded-2xl border border-white-100/10 bg-neutral-black/40 p-5 shadow-xs">
            <p className="text-white-100 font-semibold">Keyword cloud</p>
            <p className="text-xs text-white-200 mt-1">
              Weighted recurring themes.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {keywords.length ? (
                keywords
                  .slice(0, 18)
                  .sort((a, b) => (b?.weight ?? 0) - (a?.weight ?? 0))
                  .map((k, idx) => {
                    const weight = Math.max(
                      1,
                      Math.min(10, Number(k.weight) || 1)
                    );
                    const isNeg = k.type === "negative";
                    const scale = 0.82 + weight * 0.06;

                    return (
                      <span
                        key={`${k.word}-${idx}`}
                        className={`rounded-full border px-3 py-1 ${
                          isNeg
                            ? "border-red-500/30 bg-red-500/10 text-red-100"
                            : "border-primary-green/30 bg-primary-green/10 text-primary-green"
                        }`}
                        style={{ fontSize: `${12 * scale}px` }}
                        title={`weight ${weight}`}
                      >
                        {k.word}
                      </span>
                    );
                  })
              ) : (
                <p className="text-xs text-white-200">No keywords provided.</p>
              )}
            </div>

            {(positiveKeywords.length || negativeKeywords.length) && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-white-100/10 bg-white-100/5 p-3">
                  <p className="text-white-100 font-semibold">Green flags</p>
                  <p className="text-white-200 mt-1">
                    {positiveKeywords
                      .slice(0, 6)
                      .map((k) => k.word)
                      .join(", ") || "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-white-100/10 bg-white-100/5 p-3">
                  <p className="text-white-100 font-semibold">Red flags</p>
                  <p className="text-white-200 mt-1">
                    {negativeKeywords
                      .slice(0, 6)
                      .map((k) => k.word)
                      .join(", ") || "—"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
