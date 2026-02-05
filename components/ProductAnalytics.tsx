"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  ReferenceDot,
  ReferenceLine,
  Sector,
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

  keyword_cloud?: any[];

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

function volatilityRatingClasses(rating: string) {
  const r = rating.toLowerCase();

  if (
    r.includes("very high") ||
    r.includes("extreme") ||
    r.includes("severe")
  ) {
    return "border-red-500/30 bg-red-500/10 text-red-200";
  }
  if (r.includes("high") || r.includes("spike") || r.includes("volatile")) {
    return "border-primary-orange/35 bg-primary-orange/10 text-primary-orange";
  }
  if (r.includes("moderate") || r.includes("medium") || r.includes("normal")) {
    return "border-chart-1/35 bg-chart-1/10 text-white-100";
  }
  if (r.includes("slightly") || r.includes("slight") || r.includes("mild")) {
    return "border-sky-400/30 bg-sky-400/10 text-sky-200";
  }
  if (r.includes("low") || r.includes("stable") || r.includes("calm")) {
    return "border-primary-green/30 bg-primary-green/10 text-primary-green";
  }

  return "border-white-100/10 bg-white-100/5 text-white-100";
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

  const [trendAutoIndex, setTrendAutoIndex] = useState(0);
  const [trendHovering, setTrendHovering] = useState(false);
  const trendHoveringRef = useRef(false);
  const trendChartWrapRef = useRef<HTMLDivElement | null>(null);
  const [trendOverlayPos, setTrendOverlayPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

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

  const competitorPalette = useMemo(
    () =>
      [
        {
          dot: "bg-violet-400",
          pill: "border-violet-400/20 bg-violet-400/10 text-violet-100",
        },
        {
          dot: "bg-fuchsia-400",
          pill: "border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-100",
        },
        {
          dot: "bg-amber-400",
          pill: "border-amber-400/20 bg-amber-400/10 text-amber-100",
        },
        {
          dot: "bg-cyan-400",
          pill: "border-cyan-400/20 bg-cyan-400/10 text-cyan-100",
        },
        {
          dot: "bg-rose-400",
          pill: "border-rose-400/20 bg-rose-400/10 text-rose-100",
        },
        {
          dot: "bg-lime-400",
          pill: "border-lime-400/20 bg-lime-400/10 text-lime-100",
        },
      ] as const,
    [],
  );

  const competitorPricePoints = useMemo(() => {
    return competitorSnapshot
      .filter((c) => c && Number.isFinite(Number((c as any).price)))
      .map((c) => ({
        name: String((c as any).name ?? "").trim() || "Competitor",
        price: Number((c as any).price),
        url: typeof (c as any).url === "string" ? String((c as any).url) : null,
      }))
      .slice(0, 6);
  }, [competitorSnapshot]);

  const competitorView = useMemo(() => {
    const items = competitorSnapshot
      .filter((c) => !!c && Number.isFinite(Number((c as any).price)))
      .map((c) => ({
        name: String((c as any).name ?? "").trim() || "Competitor",
        price: Number((c as any).price),
        website:
          typeof (c as any).website === "string"
            ? String((c as any).website)
            : null,
        difference:
          typeof (c as any).difference === "string"
            ? String((c as any).difference)
            : null,
        url: typeof (c as any).url === "string" ? String((c as any).url) : null,
      }))
      .slice(0, 4);

    if (!items.length) {
      return {
        items,
        min: null as number | null,
        max: null as number | null,
      };
    }

    const min = Math.min(...items.map((c) => c.price));
    const max = Math.max(...items.map((c) => c.price));
    return { items, min, max };
  }, [competitorSnapshot]);

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
  const sentimentPieData = [
    {
      name: "Positive",
      value: positivePct,
      fill: "#22c55e",
      shadow: "#166534",
    },
    {
      name: "Neutral",
      value: neutralPct,
      fill: "#60a5fa",
      shadow: "#1d4ed8",
    },
    {
      name: "Negative",
      value: negativePct,
      fill: "#f97316",
      shadow: "#9a3412",
    },
  ].filter((d) => d.value > 0);
  const sentimentTotal = sentimentPieData.reduce((acc, d) => acc + d.value, 0);

  const sentimentSummary = useMemo(() => {
    const entries = [
      {
        name: "Positive" as const,
        value: positivePct,
        dot: "bg-emerald-400",
        pill: "border-emerald-400/20 bg-gradient-to-br from-emerald-400/18 via-white-100/6 to-white-100/0",
        text: "text-emerald-100",
      },
      {
        name: "Neutral" as const,
        value: neutralPct,
        dot: "bg-sky-400",
        pill: "border-sky-400/20 bg-gradient-to-br from-sky-400/18 via-white-100/6 to-white-100/0",
        text: "text-sky-100",
      },
      {
        name: "Negative" as const,
        value: negativePct,
        dot: "bg-orange-400",
        pill: "border-orange-400/20 bg-gradient-to-br from-orange-400/18 via-white-100/6 to-white-100/0",
        text: "text-orange-100",
      },
    ];

    const dominant = entries.reduce(
      (best, cur) => (cur.value > best.value ? cur : best),
      entries[0],
    );

    const net = Math.max(
      -100,
      Math.min(100, (positivePct ?? 0) - (negativePct ?? 0)),
    );
    const netTone =
      net >= 20
        ? {
            label: "Mostly positive",
            cls: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
          }
        : net <= -20
          ? {
              label: "Mostly negative",
              cls: "border-orange-400/20 bg-orange-400/10 text-orange-100",
            }
          : {
              label: "Mixed",
              cls: "border-sky-400/20 bg-sky-400/10 text-sky-100",
            };

    return {
      entries,
      dominant,
      net,
      netTone,
      markerLeftPct: ((net + 100) / 200) * 100,
    };
  }, [positivePct, neutralPct, negativePct]);
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

    const c = String(currency ?? "").trim();
    if (!c) return formatCompactNumber(n);

    // Prefer real currency symbol formatting when a 3-letter code is provided.
    if (/^[A-Z]{3}$/.test(c)) {
      try {
        return new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: c,
          maximumFractionDigits: 0,
        }).format(n);
      } catch {
        return `${c} ${formatCompactNumber(n)}`;
      }
    }

    // If it's already a symbol (₹, $, €) or shorthand (Rs.), prefix directly.
    const needsSpace = /^[A-Za-z]{1,4}\.?$/.test(c);
    const prefix = needsSpace ? `${c} ` : c;
    return `${prefix}${formatCompactNumber(n)}`;
  };

  const priceTrend =
    (payload as any)?.price_trend ?? (payload as any)?.priceTrend ?? null;
  const priceTrendCurrency =
    typeof priceTrend?.currency === "string" ? priceTrend.currency : "";

  const volatilityCurrencyHint =
    typeof (volatility as any)?.currency_symbol === "string"
      ? String((volatility as any).currency_symbol)
      : typeof (volatility as any)?.currency === "string"
        ? String((volatility as any).currency)
        : typeof (payload as any)?.currency_symbol === "string"
          ? String((payload as any).currency_symbol)
          : typeof (payload as any)?.currency === "string"
            ? String((payload as any).currency)
            : priceTrendCurrency;

  const whiskerCurrencyHint =
    typeof (whiskers as any)?.currency === "string"
      ? String((whiskers as any).currency)
      : typeof (whiskers as any)?.currency_symbol === "string"
        ? String((whiskers as any).currency_symbol)
        : priceTrendCurrency || volatilityCurrencyHint;
  const priceTrendSource =
    typeof priceTrend?.source === "string" ? priceTrend.source : null;
  const priceTrendPoints: Array<{ date: string; price: number }> =
    useMemo(() => {
      if (!Array.isArray(priceTrend?.points)) return [];

      return priceTrend.points
        .filter(
          (p: any): p is { date: string; price: number } =>
            !!p &&
            typeof (p as any).date === "string" &&
            Number.isFinite(numberOrNull((p as any).price) as any),
        )
        .map((p: { date: string; price: number }) => ({
          date: p.date,
          price: Number(p.price),
        }));
    }, [priceTrend?.points]);

  const trendSvgId = useId();
  const trendIdSafe = trendSvgId.replace(/:/g, "");
  const trendStrokeId = `trend-stroke-${trendIdSafe}`;
  const trendFillId = `trend-fill-${trendIdSafe}`;

  const whiskerSvgId = useId();
  const whiskerIdSafe = whiskerSvgId.replace(/:/g, "");
  const whiskerRangeId = `whisker-range-${whiskerIdSafe}`;

  const sentimentSvgId = useId();
  const sentimentIdSafe = sentimentSvgId.replace(/:/g, "");
  const sentimentShadowId = `sentiment-pie-shadow-${sentimentIdSafe}`;

  const crossSiteSvgId = useId();
  const crossSiteIdSafe = crossSiteSvgId.replace(/:/g, "");
  const crossSiteLowGradId = `cross-site-low-${crossSiteIdSafe}`;
  const crossSiteMidGradId = `cross-site-mid-${crossSiteIdSafe}`;
  const crossSiteHighGradId = `cross-site-high-${crossSiteIdSafe}`;
  const crossSiteBarGlowId = `cross-site-glow-${crossSiteIdSafe}`;

  const trendStats = useMemo(() => {
    if (!priceTrendPoints.length) return null;
    const prices = priceTrendPoints.map((p) => p.price).filter(Number.isFinite);
    if (!prices.length) return null;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const latest = prices[prices.length - 1];
    return { min, max, latest };
  }, [priceTrendPoints]);

  useEffect(() => {
    trendHoveringRef.current = trendHovering;
  }, [trendHovering]);

  useEffect(() => {
    // Autoplay the trend cursor left -> right.
    // Pause while hovering, but keep the interval alive so it can resume
    // even if hover was true during initial mount.
    if (priceTrendPoints.length < 2) return;

    const id = window.setInterval(() => {
      if (trendHoveringRef.current) return;

      setTrendAutoIndex((prev) => {
        const next = prev + 1;
        return next >= priceTrendPoints.length ? 0 : next;
      });
    }, 900);

    return () => window.clearInterval(id);
  }, [priceTrendPoints.length]);

  useEffect(() => {
    // Keep index in bounds if data length changes.
    const len = priceTrendPoints.length;
    if (len < 1) return;
    setTrendAutoIndex((prev) => Math.max(0, Math.min(prev, len - 1)));
  }, [priceTrendPoints.length]);

  useEffect(() => {
    // Position the autoplay mini-card using the rendered SVG elements.
    // (More reliable than relying on internal Recharts props.)
    if (trendHovering) {
      setTrendOverlayPos(null);
      return;
    }
    if (priceTrendPoints.length < 2) {
      setTrendOverlayPos(null);
      return;
    }

    const root = trendChartWrapRef.current;
    if (!root) return;

    let raf = 0;
    raf = window.requestAnimationFrame(() => {
      const svg = root.querySelector("svg");
      if (!svg) return;

      const rect = root.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      // Moving dot: we render a circle filled with #60a5fa.
      const dot = svg.querySelector(
        'circle[fill="#60a5fa"]',
      ) as SVGCircleElement | null;
      const cx = dot ? Number(dot.getAttribute("cx")) : NaN;
      if (!Number.isFinite(cx)) return;

      let y = 52;
      {
        // Y-axis ticks: select the leftmost set of ticks in the SVG,
        // then pick the 3rd tick from the top.
        const tickEls = Array.from(
          svg.querySelectorAll("g.recharts-cartesian-axis-tick"),
        ) as SVGGElement[];

        const tickRects = tickEls
          .map((el) => {
            const r = el.getBoundingClientRect();
            return {
              el,
              left: r.left,
              top: r.top,
              height: r.height,
            };
          })
          .filter((t) => Number.isFinite(t.left) && Number.isFinite(t.top));

        if (tickRects.length) {
          const leftMost = Math.min(...tickRects.map((t) => t.left));
          // Keep only ticks very close to the left-most axis (tolerance handles minor differences).
          const yAxisTicks = tickRects
            .filter((t) => t.left <= leftMost + 2)
            .sort((a, b) => a.top - b.top);

          const third = yAxisTicks[2] ?? yAxisTicks[1] ?? yAxisTicks[0];
          if (third) {
            y = third.top - rect.top + third.height + 10;
          }
        }
      }

      const boxW = 150;
      const boxH = 34;
      const clamp = (n: number, min: number, max: number) =>
        Math.max(min, Math.min(max, n));

      const x = clamp(cx - boxW / 2, 8, rect.width - boxW - 8);
      y = clamp(y, 8, rect.height - boxH - 8);

      setTrendOverlayPos({ x, y });
    });

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [trendAutoIndex, trendHovering, priceTrendPoints.length]);

  // Reset autoplay to the beginning when the dataset changes.
  const trendSignature = useMemo(() => {
    if (priceTrendPoints.length < 1) return "";
    const first = priceTrendPoints[0]?.date ?? "";
    const last = priceTrendPoints[priceTrendPoints.length - 1]?.date ?? "";
    return `${priceTrendPoints.length}|${first}|${last}`;
  }, [priceTrendPoints]);

  useEffect(() => {
    if (priceTrendPoints.length) setTrendAutoIndex(0);
  }, [trendSignature, priceTrendPoints.length]);

  const trendXTicks = useMemo(() => {
    const n = priceTrendPoints.length;
    if (n < 2) return [] as string[];

    const desired = Math.min(4, n);
    const ticks: string[] = [];
    for (let i = 0; i < desired; i++) {
      const idx = desired === 1 ? 0 : Math.round(((n - 1) * i) / (desired - 1));
      const d = priceTrendPoints[idx]?.date;
      if (typeof d === "string" && d) ticks.push(d);
    }

    return ticks.filter((d, i) => ticks.indexOf(d) === i);
  }, [priceTrendPoints]);

  const formatMonthYear = (value: unknown) => {
    const raw = typeof value === "string" ? value : String(value ?? "");
    if (!raw) return "";
    const parsed = new Date(
      /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T00:00:00Z` : raw,
    );
    if (Number.isNaN(parsed.getTime())) return raw;
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      year: "numeric",
    }).format(parsed);
  };

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

  const crossSiteView = useMemo(() => {
    const items = Array.isArray(crossSitePrices) ? [...crossSitePrices] : [];
    items.sort((a, b) => Number(a.price) - Number(b.price));

    if (!items.length) {
      return {
        items: [] as typeof items,
        min: null as number | null,
        max: null as number | null,
        avg: null as number | null,
        cheapest: null as (typeof items)[number] | null,
        priciest: null as (typeof items)[number] | null,
        spread: null as number | null,
      };
    }

    const min = Math.min(...items.map((p) => p.price));
    const max = Math.max(...items.map((p) => p.price));
    const avg = items.reduce((acc, p) => acc + p.price, 0) / items.length;
    const cheapest = items[0];
    const priciest = items[items.length - 1];
    const spread = Math.max(0, priciest.price - cheapest.price);

    return {
      items: items.slice(0, 8),
      min,
      max,
      avg,
      cheapest,
      priciest,
      spread,
    };
  }, [crossSitePrices]);

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
            for this product. It can take a few minutes to generate its analysis
            report. Meanwhile, please feel free to analyze prices using our AI
            Agent chat.
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
              title="Cross-site prices"
              subtitle="Shows prices from other websites to confirm the best current place to buy"
              tone="cross"
            />
            <PlaceholderCard
              title="Active discounts & offers"
              subtitle="Lists active discounts and card offers with sources, expiry, and direct links"
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
              title="Price volatility context"
              subtitle="Explains price swings, extreme highs/lows, and events driving movement over time"
              tone="context"
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
                {competitorView.items.length ? (
                  competitorView.items.map((c, idx) => {
                    const palette =
                      competitorPalette[idx % competitorPalette.length];
                    const min = competitorView.min ?? c.price;
                    const max = competitorView.max ?? c.price;
                    const denom = Math.max(1e-9, max - min);
                    const t = (c.price - min) / denom;
                    const barW = Math.round(12 + t * 88);

                    const diff = (c.difference ?? "").toLowerCase();
                    const diffTone =
                      diff.includes("-") ||
                      diff.includes("lower") ||
                      diff.includes("cheaper")
                        ? "good"
                        : diff.includes("+") ||
                            diff.includes("higher") ||
                            diff.includes("expensive")
                          ? "bad"
                          : "neutral";

                    const diffPill =
                      diffTone === "good"
                        ? "border-primary-green/25 bg-primary-green/10 text-primary-green"
                        : diffTone === "bad"
                          ? "border-primary-orange/25 bg-primary-orange/10 text-primary-orange"
                          : "border-white-100/12 bg-white-100/6 text-white-200";

                    const barGrad =
                      idx % 3 === 0
                        ? "linear-gradient(90deg, rgba(167,139,250,0.95), rgba(236,72,153,0.85))"
                        : idx % 3 === 1
                          ? "linear-gradient(90deg, rgba(34,197,94,0.95), rgba(96,165,250,0.85))"
                          : "linear-gradient(90deg, rgba(251,146,60,0.95), rgba(250,204,21,0.85))";

                    return (
                      <div
                        key={`${c.name}-${idx}`}
                        className="rounded-xl border border-white-100/10 bg-white-100/5 px-4 py-3 overflow-hidden"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${
                                  palette.dot
                                }`}
                                aria-hidden="true"
                              />
                              <p className="text-white-100 text-sm font-semibold truncate">
                                {c.name}
                              </p>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-white-200">
                              {c.website ? (
                                <span className="truncate">
                                  Source: {c.website}
                                </span>
                              ) : null}
                              {c.difference ? (
                                <span
                                  className={`inline-flex items-center rounded-full border px-2 py-0.5 ${diffPill}`}
                                >
                                  {c.difference}
                                </span>
                              ) : null}
                              {c.url ? (
                                <a
                                  href={c.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`inline-flex items-center rounded-full border px-2 py-0.5 ${palette.pill} underline-offset-2 hover:underline`}
                                >
                                  View
                                </a>
                              ) : null}
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <div className="text-[11px] text-white-200">
                              Price
                            </div>
                            <div className="text-white-100 text-sm font-extrabold">
                              {Number.isFinite(c.price)
                                ? formatMoney(c.price, whiskerCurrencyHint)
                                : "—"}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="h-2 w-full rounded-full bg-white-100/10 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${barW}%`,
                                backgroundImage: barGrad,
                              }}
                            />
                          </div>
                          <div className="mt-1 flex items-center justify-between text-[11px] text-white-200">
                            <span>Cheaper</span>
                            <span>Pricey</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-white-200">No competitor data.</p>
                )}
              </div>
            </div>

            {/* Cross-site prices (swap into left column) */}
            <div className="rounded-2xl border p-5 shadow-xs overflow-hidden border-sky-400/15 bg-gradient-to-br from-sky-500/12 via-neutral-black/55 to-indigo-500/10">
              <p className="text-white-100 font-semibold">Cross-site prices</p>
              <p className="text-xs text-white-200 mt-1">
                Shows current listed prices across other sites.
              </p>

              {crossSiteView.items.length ? (
                <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-white-200">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-2 w-7 rounded-full"
                      style={{
                        backgroundImage:
                          "linear-gradient(90deg, rgba(74,222,128,0.95), rgba(34,197,94,0.9), rgba(22,101,52,0.85))",
                      }}
                    />
                    Cheaper
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-2 w-7 rounded-full"
                      style={{
                        backgroundImage:
                          "linear-gradient(90deg, rgba(147,197,253,0.95), rgba(96,165,250,0.9), rgba(29,78,216,0.85))",
                      }}
                    />
                    Typical
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-2 w-7 rounded-full"
                      style={{
                        backgroundImage:
                          "linear-gradient(90deg, rgba(251,146,60,0.95), rgba(249,115,22,0.9), rgba(154,52,18,0.85))",
                      }}
                    />
                    Pricey
                  </span>
                </div>
              ) : null}

              <div className="mt-4 h-[180px] overflow-hidden rounded-xl border border-white-100/10 bg-white-100/5">
                {crossSitePrices.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={crossSiteView.items}
                      margin={{ top: 10, right: 16, bottom: 10, left: 8 }}
                    >
                      <defs>
                        <linearGradient
                          id={crossSiteLowGradId}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#4ade80"
                            stopOpacity={0.98}
                          />
                          <stop
                            offset="55%"
                            stopColor="#22c55e"
                            stopOpacity={0.95}
                          />
                          <stop
                            offset="100%"
                            stopColor="#166534"
                            stopOpacity={0.9}
                          />
                        </linearGradient>
                        <linearGradient
                          id={crossSiteMidGradId}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#93c5fd"
                            stopOpacity={0.98}
                          />
                          <stop
                            offset="55%"
                            stopColor="#60a5fa"
                            stopOpacity={0.95}
                          />
                          <stop
                            offset="100%"
                            stopColor="#1d4ed8"
                            stopOpacity={0.9}
                          />
                        </linearGradient>
                        <linearGradient
                          id={crossSiteHighGradId}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#fb923c"
                            stopOpacity={0.98}
                          />
                          <stop
                            offset="55%"
                            stopColor="#f97316"
                            stopOpacity={0.95}
                          />
                          <stop
                            offset="100%"
                            stopColor="#9a3412"
                            stopOpacity={0.9}
                          />
                        </linearGradient>

                        <filter
                          id={crossSiteBarGlowId}
                          x="-50%"
                          y="-50%"
                          width="200%"
                          height="200%"
                        >
                          <feDropShadow
                            dx="0"
                            dy="0"
                            stdDeviation="2.2"
                            floodColor="rgba(255,255,255,0.55)"
                            floodOpacity="0.10"
                          />
                          <feDropShadow
                            dx="0"
                            dy="2"
                            stdDeviation="3.2"
                            floodColor="rgba(0,0,0,0.50)"
                            floodOpacity="0.22"
                          />
                        </filter>
                      </defs>

                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis
                        dataKey="site"
                        tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        height={42}
                        tickFormatter={(v) =>
                          typeof v === "string" && v.length > 10
                            ? `${v.slice(0, 10)}…`
                            : String(v ?? "")
                        }
                      />
                      <YAxis
                        tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={46}
                        tickFormatter={(v) => formatCompactNumber(v)}
                      />

                      {typeof crossSiteView.avg === "number" ? (
                        <ReferenceLine
                          y={crossSiteView.avg}
                          stroke="rgba(255,255,255,0.22)"
                          strokeDasharray="4 4"
                        />
                      ) : null}
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active) return null;
                          const item = payload?.[0];
                          const site = String(
                            (item as any)?.payload?.site ?? "",
                          );
                          const price = (item as any)?.value;
                          return (
                            <div className="rounded-lg border border-white-100/10 bg-neutral-black/80 px-3 py-2 text-xs text-white-100 shadow-sm">
                              <div className="font-semibold">
                                {site || "Cross-site"}
                              </div>
                              <div className="mt-1 text-white-200">
                                {formatMoney(price)}
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Bar
                        dataKey="price"
                        isAnimationActive={false}
                        radius={[12, 12, 12, 12]}
                        maxBarSize={46}
                      >
                        {crossSiteView.items.map((row, idx) => {
                          const min = crossSiteView.min ?? row.price;
                          const max = crossSiteView.max ?? row.price;
                          const denom = Math.max(1e-9, max - min);
                          const t = (row.price - min) / denom;
                          const fillId =
                            t <= 0.18
                              ? crossSiteLowGradId
                              : t >= 0.82
                                ? crossSiteHighGradId
                                : crossSiteMidGradId;

                          return (
                            <Cell
                              key={`cross-site-bar-${row.site}-${idx}`}
                              fill={`url(#${fillId})`}
                              stroke="rgba(255,255,255,0.14)"
                              strokeWidth={0.8}
                              filter={`url(#${crossSiteBarGlowId})`}
                            />
                          );
                        })}
                      </Bar>
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

              {crossSiteView.items.length ? (
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-xl border border-white-100/10 bg-white-100/5 px-3 py-2">
                    <div className="text-[11px] text-white-200">Cheapest</div>
                    <div className="mt-0.5 font-semibold text-white-100">
                      {crossSiteView.cheapest?.site ?? "—"}
                    </div>
                    <div className="text-white-200">
                      {typeof crossSiteView.cheapest?.price === "number"
                        ? formatMoney(crossSiteView.cheapest.price)
                        : "—"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white-100/10 bg-white-100/5 px-3 py-2">
                    <div className="text-[11px] text-white-200">Average</div>
                    <div className="mt-0.5 font-semibold text-white-100">
                      {typeof crossSiteView.avg === "number"
                        ? formatMoney(crossSiteView.avg)
                        : "—"}
                    </div>
                    <div className="text-white-200">Guide line on chart</div>
                  </div>

                  <div className="rounded-xl border border-white-100/10 bg-white-100/5 px-3 py-2">
                    <div className="text-[11px] text-white-200">Spread</div>
                    <div className="mt-0.5 font-semibold text-white-100">
                      {typeof crossSiteView.spread === "number"
                        ? formatMoney(crossSiteView.spread)
                        : "—"}
                    </div>
                    <div className="text-white-200">Cheapest → priciest</div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Active discounts & offers */}
            <div className="rounded-2xl border p-5 shadow-xs border-primary-green/20 bg-gradient-to-br from-primary-green/10 via-neutral-black/55 to-chart-1/10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-white-100 font-semibold">
                    Active discounts & offers
                  </p>
                  <p className="text-xs text-white-200 mt-1">
                    Lists active discounts and card offers with sources, expiry,
                    and direct links.
                  </p>
                </div>
                {offers.length ? (
                  <span className="shrink-0 inline-flex items-center rounded-full border border-white-100/10 bg-white-100/5 px-3 py-1 text-xs font-semibold text-white-100">
                    {offers.length} live
                  </span>
                ) : null}
              </div>

              <div className="mt-4 space-y-3">
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
                        className="rounded-xl border border-white-100/10 bg-white-100/5 px-4 py-3 overflow-hidden"
                      >
                        <div
                          className="-mx-4 -mt-3 mb-3 h-[2px]"
                          style={{
                            backgroundImage:
                              idx % 3 === 0
                                ? "linear-gradient(90deg, rgba(34,197,94,0.0), rgba(34,197,94,0.85), rgba(96,165,250,0.85), rgba(34,197,94,0.0))"
                                : idx % 3 === 1
                                  ? "linear-gradient(90deg, rgba(96,165,250,0.0), rgba(129,140,248,0.9), rgba(236,72,153,0.85), rgba(96,165,250,0.0))"
                                  : "linear-gradient(90deg, rgba(251,146,60,0.0), rgba(251,146,60,0.9), rgba(250,204,21,0.85), rgba(251,146,60,0.0))",
                          }}
                          aria-hidden="true"
                        />
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-white-100 text-sm font-semibold line-clamp-2">
                            {String((o as any).title ?? "Untitled offer")}
                          </p>
                          <div className="shrink-0 flex items-center gap-2">
                            {pct !== null && (
                              <span
                                className="inline-flex items-center rounded-full border border-primary-green/30 bg-primary-green/10 px-2.5 py-1 text-xs font-extrabold text-primary-green"
                                title="Discount percent"
                              >
                                -{Math.round(pct)}%
                              </span>
                            )}
                            {final !== null && (
                              <span
                                className="inline-flex items-center rounded-full border border-sky-400/20 bg-sky-400/10 px-2.5 py-1 text-xs font-extrabold text-sky-100"
                                title="Final price after discount"
                              >
                                Final price:{" "}
                                {formatMoney(final, volatilityCurrencyHint)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white-200">
                          {website ? (
                            <span className="inline-flex items-center rounded-full border border-white-100/10 bg-white-100/5 px-2 py-0.5">
                              {website}
                            </span>
                          ) : null}
                          {merchant ? (
                            <span className="inline-flex items-center rounded-full border border-white-100/10 bg-white-100/5 px-2 py-0.5">
                              {merchant}
                            </span>
                          ) : null}
                          {cardOffer ? (
                            <span className="inline-flex items-center rounded-full border border-white-100/10 bg-white-100/5 px-2 py-0.5">
                              Card: {cardOffer}
                            </span>
                          ) : null}
                          {expiresAt ? (
                            <span className="inline-flex items-center rounded-full border border-white-100/10 bg-white-100/5 px-2 py-0.5">
                              Expires: {expiresAt}
                            </span>
                          ) : null}
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="ml-auto inline-flex items-center rounded-full border border-white-100/10 bg-white-100/5 px-2 py-0.5 text-white-100/85 hover:bg-white-100/8"
                              title="Open offer"
                            >
                              Open
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

              <div className="mt-4 h-[220px] overflow-hidden rounded-xl border border-white-100/10 bg-white-100/5 relative">
                <div
                  className="pointer-events-none absolute inset-0 opacity-90"
                  style={{
                    background:
                      "radial-gradient(circle at 18% 30%, rgba(96,165,250,0.22), transparent 55%), radial-gradient(circle at 85% 70%, rgba(129,140,248,0.18), transparent 55%)",
                  }}
                  aria-hidden="true"
                />
                {priceTrendPoints.length < 2 ? (
                  <div className="relative h-full w-full p-4">
                    <p className="text-xs text-white-200">No trend data yet.</p>
                  </div>
                ) : (
                  <div
                    className="relative h-full w-full"
                    ref={trendChartWrapRef}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={priceTrendPoints}
                        margin={{ top: 16, right: 30, bottom: 10, left: 16 }}
                        onMouseEnter={() => setTrendHovering(true)}
                        onMouseLeave={() => setTrendHovering(false)}
                      >
                        <defs>
                          <linearGradient
                            id={trendStrokeId}
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="0"
                          >
                            <stop
                              offset="0%"
                              stopColor="#60a5fa"
                              stopOpacity={0.95}
                            />
                            <stop
                              offset="55%"
                              stopColor="#818cf8"
                              stopOpacity={0.95}
                            />
                            <stop
                              offset="100%"
                              stopColor="#22c55e"
                              stopOpacity={0.7}
                            />
                          </linearGradient>
                          <linearGradient
                            id={trendFillId}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#60a5fa"
                              stopOpacity={0.2}
                            />
                            <stop
                              offset="70%"
                              stopColor="#60a5fa"
                              stopOpacity={0.04}
                            />
                            <stop
                              offset="100%"
                              stopColor="#60a5fa"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>

                        <CartesianGrid
                          strokeDasharray="3 6"
                          opacity={0.18}
                          stroke="rgba(255,255,255,0.16)"
                        />
                        <XAxis
                          dataKey="date"
                          padding={{ left: 6, right: 14 }}
                          tickMargin={8}
                          ticks={
                            trendXTicks.length >= 2 ? trendXTicks : undefined
                          }
                          interval={0}
                          tickFormatter={formatMonthYear}
                          tick={{
                            fill: "rgba(255,255,255,0.60)",
                            fontSize: 11,
                          }}
                          axisLine={{ stroke: "rgba(255,255,255,0.18)" }}
                          tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
                          minTickGap={28}
                        />
                        <YAxis
                          tick={{
                            fill: "rgba(255,255,255,0.60)",
                            fontSize: 11,
                          }}
                          axisLine={{ stroke: "rgba(255,255,255,0.18)" }}
                          tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
                          tickFormatter={(v) =>
                            formatMoney(v, priceTrendCurrency)
                          }
                          width={70}
                        />
                        <Tooltip
                          cursor={{
                            stroke: "rgba(255,255,255,0.18)",
                            strokeDasharray: "4 4",
                          }}
                          content={({ active, payload, label }) => {
                            if (!active) return null;
                            const val = payload?.[0]?.value;
                            if (val === undefined || val === null) return null;
                            return (
                              <div className="rounded-lg border border-white-100/10 bg-neutral-black/85 px-3 py-2 text-xs text-white-100 shadow-lg shadow-black/30">
                                <div className="font-semibold">
                                  {formatMonthYear(label)}
                                </div>
                                <div className="mt-1 text-white-200">
                                  Price: {formatMoney(val, priceTrendCurrency)}
                                </div>
                              </div>
                            );
                          }}
                        />

                        {!trendHovering && priceTrendPoints[trendAutoIndex] && (
                          <ReferenceLine
                            x={priceTrendPoints[trendAutoIndex].date}
                            stroke="rgba(255,255,255,0.20)"
                            strokeDasharray="4 4"
                          />
                        )}

                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke="transparent"
                          fill={`url(#${trendFillId})`}
                          isAnimationActive={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="price"
                          stroke={`url(#${trendStrokeId})`}
                          strokeWidth={2.5}
                          dot={(props: any) => {
                            if (trendHovering) return null;
                            if (!priceTrendPoints.length) return null;
                            if (props.index !== trendAutoIndex) return null;

                            const cx = Number(props.cx);
                            const cy = Number(props.cy);
                            if (!Number.isFinite(cx) || !Number.isFinite(cy)) {
                              return null;
                            }

                            return (
                              <g>
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={7}
                                  fill="rgba(96,165,250,0.14)"
                                />
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={4.5}
                                  fill="#60a5fa"
                                  stroke="rgba(255,255,255,0.85)"
                                  strokeWidth={1}
                                />
                              </g>
                            );
                          }}
                          activeDot={{
                            r: 4.5,
                            fill: "#60a5fa",
                            stroke: "rgba(255,255,255,0.85)",
                            strokeWidth: 1,
                          }}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>

                    {!trendHovering && trendOverlayPos && (
                      <div
                        className="pointer-events-none absolute"
                        style={{
                          left: trendOverlayPos.x,
                          top: trendOverlayPos.y,
                        }}
                      >
                        <div className="rounded-xl border border-white-100/10 bg-neutral-black/85 px-3 py-2 text-[11px] text-white-100 shadow-lg shadow-black/30">
                          <div className="font-semibold leading-none">
                            {formatMonthYear(
                              priceTrendPoints[trendAutoIndex]?.date,
                            )}
                          </div>
                          <div className="mt-1 text-white-200 leading-none">
                            {formatMoney(
                              priceTrendPoints[trendAutoIndex]?.price,
                              priceTrendCurrency,
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {trendStats ? (
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-white-100/10 bg-white-100/5 px-3 py-1 text-white-100">
                    Low {formatMoney(trendStats.min, priceTrendCurrency)}
                  </span>
                  <span className="rounded-full border border-white-100/10 bg-white-100/5 px-3 py-1 text-white-100">
                    High {formatMoney(trendStats.max, priceTrendCurrency)}
                  </span>
                  <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-sky-100">
                    Latest {formatMoney(trendStats.latest, priceTrendCurrency)}
                  </span>
                </div>
              ) : null}
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

            {/* Price volatility context (swap into middle column) */}
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
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${volatilityRatingClasses(
                      volatilityRating,
                    )}`}
                  >
                    {volatilityRating}
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-white-200">
                <div>
                  All-time low:{" "}
                  <span className="text-white-100 font-semibold">
                    {formatMoney(allTimeLow, volatilityCurrencyHint)}
                  </span>
                </div>
                <div>
                  All-time high:{" "}
                  <span className="text-white-100 font-semibold">
                    {formatMoney(allTimeHigh, volatilityCurrencyHint)}
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-white-100/10 bg-white-100/5 p-4">
                <p className="text-white-100 text-sm font-semibold">
                  Annotated events
                </p>
                {annotatedEvents.length ? (
                  <ul className="mt-3 space-y-2">
                    {annotatedEvents.map((e, idx) => {
                      const rawEvent = String((e as any)?.event ?? "");
                      const split = rawEvent.split(" - ");
                      const eventTitle = (split[0] ?? "").trim();
                      const eventDesc = split.slice(1).join(" - ").trim();

                      const tone = idx % 4;
                      const barClass =
                        tone === 0
                          ? "bg-gradient-to-b from-primary-orange/80 to-chart-1/70"
                          : tone === 1
                            ? "bg-gradient-to-b from-sky-400/80 to-indigo-400/70"
                            : tone === 2
                              ? "bg-gradient-to-b from-primary-green/80 to-teal-400/70"
                              : "bg-gradient-to-b from-red-400/80 to-primary-orange/70";
                      const dotClass =
                        tone === 0
                          ? "bg-primary-orange/90"
                          : tone === 1
                            ? "bg-sky-400/90"
                            : tone === 2
                              ? "bg-primary-green/90"
                              : "bg-red-400/90";

                      const bgClass =
                        tone === 0
                          ? "bg-gradient-to-br from-primary-orange/10 via-neutral-black/35 to-chart-1/10"
                          : tone === 1
                            ? "bg-gradient-to-br from-sky-400/10 via-neutral-black/35 to-indigo-400/10"
                            : tone === 2
                              ? "bg-gradient-to-br from-primary-green/10 via-neutral-black/35 to-teal-400/10"
                              : "bg-gradient-to-br from-red-400/10 via-neutral-black/35 to-primary-orange/10";

                      return (
                        <li
                          key={`${e.event}-${idx}`}
                          className={`relative overflow-hidden rounded-lg border border-white-100/10 px-3 py-2.5 ${bgClass} transition-transform duration-200 ease-out hover:-translate-y-[2px] hover:border-white-100/20 hover:shadow-lg hover:shadow-black/30 motion-reduce:transition-none motion-reduce:hover:transform-none`}
                        >
                          <span
                            className="pointer-events-none absolute inset-0 opacity-70"
                            style={{
                              background:
                                "radial-gradient(circle at 18% 35%, rgba(255,255,255,0.08), transparent 55%)",
                            }}
                            aria-hidden="true"
                          />
                          <span
                            className={`absolute left-0 top-0 h-full w-0.5 ${barClass}`}
                            aria-hidden="true"
                          />

                          <div className="relative flex items-start gap-2.5">
                            <span
                              className={`mt-1 h-2 w-2 rounded-full ${dotClass}`}
                              style={{
                                boxShadow:
                                  "0 0 0 2px rgba(255,255,255,0.05), 0 10px 24px rgba(0,0,0,0.35)",
                              }}
                              aria-hidden="true"
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-[13px] text-white-100 font-semibold leading-snug break-words">
                                  {eventTitle || rawEvent}
                                </p>
                                {e.date_approx ? (
                                  <span className="inline-flex items-center rounded-full border border-white-100/10 bg-white-100/5 px-2 py-0.5 text-[10px] leading-none text-white-200">
                                    {e.date_approx}
                                  </span>
                                ) : null}
                              </div>
                              {eventDesc ? (
                                <p className="mt-0.5 text-[12px] text-white-200 font-normal leading-snug break-words">
                                  {eventDesc}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-white-200">
                    No events provided.
                  </p>
                )}
              </div>
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
                  <div className="relative overflow-hidden rounded-xl border border-white-100/10 bg-white-100/5 p-5">
                    <div
                      className="pointer-events-none absolute inset-0 opacity-90"
                      style={{
                        background:
                          "radial-gradient(circle at 16% 40%, rgba(249,115,22,0.20), transparent 55%), radial-gradient(circle at 82% 60%, rgba(96,165,250,0.14), transparent 55%)",
                      }}
                      aria-hidden="true"
                    />

                    {(() => {
                      const low = Math.min(marketLow, marketHigh);
                      const high = Math.max(marketLow, marketHigh);
                      const domainMin = whiskerDomain?.[0] ?? low;
                      const domainMax = whiskerDomain?.[1] ?? high;
                      const span = Math.max(1e-9, domainMax - domainMin);
                      const pct = (v: number) =>
                        Math.max(
                          0,
                          Math.min(100, ((v - domainMin) / span) * 100),
                        );

                      const rangeL = pct(low);
                      const rangeR = pct(high);
                      const avgP =
                        typeof marketAvg === "number" ? pct(marketAvg) : null;
                      const youP =
                        typeof currentPos === "number" ? pct(currentPos) : null;

                      const competitors = competitorPricePoints.map(
                        (c, idx) => ({
                          ...c,
                          p: pct(c.price),
                          idx,
                        }),
                      );

                      const leftLabel = formatMoney(low, whiskerCurrencyHint);
                      const rightLabel = formatMoney(high, whiskerCurrencyHint);

                      return (
                        <div className="relative">
                          <div className="flex items-center justify-between text-[11px] text-white-200">
                            <span className="truncate">
                              <span className="text-white-100 font-semibold">
                                Low
                              </span>{" "}
                              {leftLabel}
                            </span>
                            <span className="truncate">
                              <span className="text-white-100 font-semibold">
                                High
                              </span>{" "}
                              {rightLabel}
                            </span>
                          </div>

                          <div className="mt-4 relative h-16">
                            {/* Track */}
                            <div className="absolute left-0 right-0 top-9 h-4 rounded-full border border-white-100/10 bg-white-100/5" />

                            {/* Market band */}
                            <div
                              className="absolute top-9 h-4 rounded-full bg-gradient-to-r from-sky-400/55 via-orange-500/55 to-orange-400/70 shadow-sm"
                              style={{
                                left: `${rangeL}%`,
                                width: `${Math.max(0, rangeR - rangeL)}%`,
                              }}
                            />

                            {/* Low/High ticks */}
                            <div
                              className="absolute top-[28px] h-7 w-[2px] rounded-full bg-white-100/30"
                              style={{ left: `calc(${rangeL}% - 1px)` }}
                              aria-hidden="true"
                            />
                            <div
                              className="absolute top-[28px] h-7 w-[2px] rounded-full bg-white-100/30"
                              style={{ left: `calc(${rangeR}% - 1px)` }}
                              aria-hidden="true"
                            />

                            {/* Avg marker */}
                            {avgP !== null ? (
                              <div
                                className="absolute top-2"
                                style={{ left: `calc(${avgP}% - 1px)` }}
                                title={`Avg: ${formatMoney(marketAvg, whiskerCurrencyHint)}`}
                              >
                                <div className="h-[46px] w-[2px] rounded-full bg-sky-400/85 shadow-[0_0_0_1px_rgba(255,255,255,0.18)]" />
                                <div className="mt-1 -translate-x-1/2 text-[10px] text-sky-100 whitespace-nowrap">
                                  Avg
                                </div>
                              </div>
                            ) : null}

                            {/* You marker */}
                            {youP !== null ? (
                              <div
                                className="absolute top-1"
                                style={{ left: `calc(${youP}% - 2px)` }}
                                title={`You: ${formatMoney(currentPos, whiskerCurrencyHint)}`}
                              >
                                <div className="h-[50px] w-[3px] rounded-full bg-emerald-400/95 shadow-[0_0_0_1px_rgba(255,255,255,0.22)]" />
                                <div className="absolute left-1/2 top-[30px] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-emerald-300 shadow-[0_0_0_2px_rgba(0,0,0,0.35)]" />
                                <div className="mt-1 -translate-x-1/2 text-[10px] text-emerald-100 whitespace-nowrap font-semibold">
                                  You
                                </div>
                              </div>
                            ) : null}

                            {/* Competitor snapshot markers */}
                            {competitors.length ? (
                              <div className="absolute inset-x-0 top-0">
                                {competitors.map((c) => {
                                  const palette =
                                    competitorPalette[
                                      c.idx % competitorPalette.length
                                    ];
                                  const lane = c.idx % 3;
                                  const top =
                                    lane === 0 ? 6 : lane === 1 ? 18 : 30;
                                  return (
                                    <div
                                      key={`${c.name}-${c.idx}`}
                                      className="group absolute"
                                      style={{
                                        left: `calc(${c.p}% - 5px)`,
                                        top,
                                      }}
                                    >
                                      <div
                                        className={`h-2.5 w-2.5 rounded-full ${palette.dot} shadow-[0_0_0_2px_rgba(0,0,0,0.35)]`}
                                        aria-hidden="true"
                                      />
                                      <div className="pointer-events-none absolute left-1/2 top-3 z-10 w-max -translate-x-1/2 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                                        <div className="rounded-lg border border-white-100/10 bg-neutral-black/85 px-2.5 py-1.5 text-[10px] text-white-100 shadow-lg shadow-black/30">
                                          <div className="font-semibold leading-none">
                                            {c.name}
                                          </div>
                                          <div className="mt-1 text-white-200 leading-none">
                                            {formatMoney(
                                              c.price,
                                              whiskerCurrencyHint,
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : null}
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-white-200">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white-100/10 bg-white-100/5 px-2 py-1">
                              <span className="h-2 w-2 rounded-full bg-gradient-to-r from-sky-400/70 to-orange-400/80" />
                              Market range
                            </span>
                            {typeof marketAvg === "number" ? (
                              <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-2 py-1 text-sky-100">
                                <span className="h-2 w-2 rounded-full bg-sky-400" />
                                Avg{" "}
                                {formatMoney(marketAvg, whiskerCurrencyHint)}
                              </span>
                            ) : null}
                            {typeof currentPos === "number" ? (
                              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-emerald-100">
                                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                You{" "}
                                {formatMoney(currentPos, whiskerCurrencyHint)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-sky-100">
                    <span
                      className="h-2 w-2 rounded-full bg-sky-400"
                      aria-hidden="true"
                    />
                    Low
                    <span className="font-semibold text-white-100">
                      {marketLow === null
                        ? "—"
                        : formatMoney(marketLow, whiskerCurrencyHint)}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1 text-orange-100">
                    <span
                      className="h-2 w-2 rounded-full bg-orange-400"
                      aria-hidden="true"
                    />
                    High
                    <span className="font-semibold text-white-100">
                      {marketHigh === null
                        ? "—"
                        : formatMoney(marketHigh, whiskerCurrencyHint)}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-indigo-100">
                    <span
                      className="h-2 w-2 rounded-full bg-sky-400"
                      aria-hidden="true"
                    />
                    Avg
                    <span className="font-semibold text-white-100">
                      {marketAvg === null
                        ? "—"
                        : formatMoney(marketAvg, whiskerCurrencyHint)}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-emerald-100">
                    <span
                      className="h-2 w-2 rounded-full bg-emerald-400"
                      aria-hidden="true"
                    />
                    You
                    <span className="font-semibold text-white-100">
                      {currentPos === null
                        ? "—"
                        : formatMoney(currentPos, whiskerCurrencyHint)}
                    </span>
                  </span>

                  {competitorPricePoints.map((c, idx) => {
                    const palette =
                      competitorPalette[idx % competitorPalette.length];
                    return (
                      <span
                        key={`${c.name}-${idx}`}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${palette.pill}`}
                        title={c.url ?? c.name}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${palette.dot}`}
                          aria-hidden="true"
                        />
                        <span className="font-semibold text-white-100">
                          {c.name}
                        </span>{" "}
                        <span className="text-white-100/90">
                          {formatMoney(c.price, whiskerCurrencyHint)}
                        </span>
                      </span>
                    );
                  })}
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
              <div className="mt-4 flex flex-col gap-4">
                <div className="relative flex flex-col overflow-hidden rounded-xl border border-white-100/10 bg-white-100/5 p-3">
                  <span
                    className="pointer-events-none absolute inset-0 opacity-90"
                    style={{
                      background:
                        "radial-gradient(circle at 18% 25%, rgba(249,115,22,0.18), transparent 55%), radial-gradient(circle at 86% 70%, rgba(96,165,250,0.16), transparent 58%), radial-gradient(circle at 45% 55%, rgba(34,197,94,0.10), transparent 62%)",
                    }}
                    aria-hidden="true"
                  />

                  <div className="relative h-[220px]">
                    {sentimentTotal > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <defs>
                            <filter
                              id={sentimentShadowId}
                              x="-30%"
                              y="-30%"
                              width="160%"
                              height="160%"
                            >
                              <feDropShadow
                                dx="0"
                                dy="7"
                                stdDeviation="6"
                                floodColor="rgba(0,0,0,0.38)"
                              />
                            </filter>

                            <filter
                              id={`${sentimentShadowId}-wall`}
                              x="-40%"
                              y="-40%"
                              width="190%"
                              height="190%"
                            >
                              <feDropShadow
                                dx="0"
                                dy="4"
                                stdDeviation="3"
                                floodColor="rgba(0,0,0,0.30)"
                              />
                            </filter>

                            {sentimentPieData.map((entry, idx) => (
                              <g key={`sent-grads-${entry.name}-${idx}`}>
                                <linearGradient
                                  id={`sentiment-top-${sentimentIdSafe}-${idx}`}
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="0%"
                                    stopColor={
                                      entry.name === "Positive"
                                        ? "#bbf7d0"
                                        : entry.name === "Neutral"
                                          ? "#dbeafe"
                                          : "#ffedd5"
                                    }
                                    stopOpacity={0.98}
                                  />
                                  <stop
                                    offset="45%"
                                    stopColor={entry.fill}
                                    stopOpacity={0.96}
                                  />
                                  <stop
                                    offset="100%"
                                    stopColor={entry.shadow}
                                    stopOpacity={0.94}
                                  />
                                </linearGradient>

                                <linearGradient
                                  id={`sentiment-side-${sentimentIdSafe}-${idx}`}
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="0%"
                                    stopColor={entry.shadow}
                                    stopOpacity={0.72}
                                  />
                                  <stop
                                    offset="65%"
                                    stopColor={entry.shadow}
                                    stopOpacity={0.86}
                                  />
                                  <stop
                                    offset="100%"
                                    stopColor="rgba(0,0,0,0.55)"
                                    stopOpacity={0.78}
                                  />
                                </linearGradient>

                                <filter
                                  id={`sentiment-glow-${sentimentIdSafe}-${idx}`}
                                  x="-50%"
                                  y="-50%"
                                  width="200%"
                                  height="200%"
                                >
                                  <feDropShadow
                                    dx="0"
                                    dy="0"
                                    stdDeviation="3.0"
                                    floodColor={entry.fill}
                                    floodOpacity="0.42"
                                  />
                                  <feDropShadow
                                    dx="0"
                                    dy="-1"
                                    stdDeviation="1.8"
                                    floodColor="rgba(255,255,255,0.70)"
                                    floodOpacity="0.32"
                                  />
                                </filter>
                              </g>
                            ))}
                          </defs>

                          <ellipse
                            cx="50%"
                            cy="72%"
                            rx={108}
                            ry={26}
                            fill="rgba(0,0,0,0.24)"
                          />

                          <ellipse
                            cx="50%"
                            cy="56%"
                            rx={84}
                            ry={Math.round(84 * 0.64)}
                            fill="rgba(0,0,0,0.01)"
                            filter={`url(#${sentimentShadowId})`}
                            opacity={0.38}
                          />

                          <Pie
                            data={sentimentPieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="52%"
                            outerRadius={82}
                            startAngle={90}
                            endAngle={-270}
                            paddingAngle={0}
                            isAnimationActive={false}
                            stroke="none"
                            strokeWidth={0}
                            shape={(p: any) => {
                              if (!p) return <g />;

                              const cx = Number(p.cx);
                              const cy = Number(p.cy);
                              const r = Number(p.outerRadius);
                              const startAngle = Number(p.startAngle);
                              const endAngle = Number(p.endAngle);
                              const idx = Number(p.index ?? 0);
                              const payload = (p.payload ?? {}) as any;

                              const tilt = 0.64;
                              const depth = 20;

                              const expandDeg = 0.35;
                              const dir = Math.sign(endAngle - startAngle) || 1;
                              const startAngleEx = startAngle - dir * expandDeg;
                              const endAngleEx = endAngle + dir * expandDeg;

                              const midAngle = (startAngle + endAngle) / 2;
                              const midRad = (Math.PI / 180) * midAngle;

                              const explode = 0;
                              const ox = Math.cos(midRad) * explode;
                              const oy = Math.sin(midRad) * explode * tilt;
                              const sx = cx + ox;
                              const sy = cy + oy;

                              const span = Math.abs(endAngleEx - startAngleEx);
                              const steps = Math.max(
                                60,
                                Math.ceil(span / 1.25),
                              );
                              const angles = Array.from(
                                { length: steps + 1 },
                                (_, i) =>
                                  startAngleEx +
                                  (endAngleEx - startAngleEx) * (i / steps),
                              );

                              const pts = angles.map((a) => {
                                const rad = (Math.PI / 180) * a;
                                return {
                                  x: sx + r * Math.cos(rad),
                                  y: sy + r * Math.sin(rad) * tilt,
                                  sin: Math.sin(rad),
                                };
                              });

                              const topPath = `M ${sx} ${sy} L ${pts
                                .map((pt) => `${pt.x} ${pt.y}`)
                                .join(" L ")} Z`;

                              const sideFill = `url(#sentiment-side-${sentimentIdSafe}-${idx})`;

                              const segments: Array<{
                                start: number;
                                end: number;
                              }> = [];
                              let segStart = -1;
                              for (let i = 0; i < pts.length; i += 1) {
                                const visible = pts[i].sin > 0;
                                if (visible) {
                                  if (segStart < 0) segStart = i;
                                } else if (segStart >= 0) {
                                  segments.push({
                                    start: segStart,
                                    end: i - 1,
                                  });
                                  segStart = -1;
                                }
                              }
                              if (segStart >= 0)
                                segments.push({
                                  start: segStart,
                                  end: pts.length - 1,
                                });

                              return (
                                <g>
                                  <defs>
                                    <radialGradient
                                      id={`sentiment-shine-${sentimentIdSafe}-${idx}`}
                                      gradientUnits="userSpaceOnUse"
                                      cx={sx - r * 0.32}
                                      cy={sy - r * 0.38}
                                      r={r * 0.95}
                                    >
                                      <stop
                                        offset="0%"
                                        stopColor="rgba(255,255,255,0.92)"
                                      />
                                      <stop
                                        offset="25%"
                                        stopColor="rgba(255,255,255,0.40)"
                                      />
                                      <stop
                                        offset="55%"
                                        stopColor="rgba(255,255,255,0.14)"
                                      />
                                      <stop
                                        offset="78%"
                                        stopColor="rgba(255,255,255,0.05)"
                                      />
                                      <stop
                                        offset="100%"
                                        stopColor="rgba(255,255,255,0.00)"
                                      />
                                    </radialGradient>
                                  </defs>

                                  {segments.map((seg, sIdx) => {
                                    const top = pts.slice(
                                      seg.start,
                                      seg.end + 1,
                                    );
                                    if (top.length < 2) return null;
                                    const bottom = top.map((pt) => ({
                                      x: pt.x,
                                      y: pt.y + depth,
                                    }));

                                    const sidePath = `M ${top[0].x} ${top[0].y} L ${top
                                      .slice(1)
                                      .map((pt) => `${pt.x} ${pt.y}`)
                                      .join(
                                        " L ",
                                      )} L ${bottom[bottom.length - 1].x} ${
                                      bottom[bottom.length - 1].y
                                    } L ${bottom
                                      .slice(0, -1)
                                      .reverse()
                                      .map((pt) => `${pt.x} ${pt.y}`)
                                      .join(" L ")} Z`;

                                    return (
                                      <path
                                        key={`sent-side-${idx}-${sIdx}`}
                                        d={sidePath}
                                        fill={sideFill}
                                        opacity={0.88}
                                        filter={`url(#${sentimentShadowId}-wall)`}
                                      />
                                    );
                                  })}

                                  <path
                                    d={topPath}
                                    fill={`url(#sentiment-top-${sentimentIdSafe}-${idx})`}
                                    stroke="rgba(255,255,255,0.10)"
                                    strokeWidth={0.6}
                                    strokeLinejoin="round"
                                    strokeLinecap="round"
                                    filter={`url(#sentiment-glow-${sentimentIdSafe}-${idx})`}
                                  />

                                  <path
                                    d={topPath}
                                    fill={`url(#sentiment-shine-${sentimentIdSafe}-${idx})`}
                                    opacity={0.52}
                                    style={{ mixBlendMode: "screen" }}
                                  />
                                </g>
                              );
                            }}
                            labelLine={false}
                            label={(p: any) => {
                              if (!p) return null;
                              const cx = Number(p.cx);
                              const cy = Number(p.cy);
                              const outerRadius = Number(p.outerRadius);
                              const startAngle = Number(p.startAngle);
                              const endAngle = Number(p.endAngle);
                              const value = Number(p.value ?? 0);
                              const name = String(
                                p?.name ?? p?.payload?.name ?? "",
                              );

                              const tilt = 0.64;
                              const depth = 20;
                              const midAngle = (startAngle + endAngle) / 2;
                              const rad = (Math.PI / 180) * midAngle;

                              const explode = 0;
                              const dx = Math.cos(rad) * explode;
                              const dy = Math.sin(rad) * explode * tilt;

                              const lift = Math.sin(rad) > 0 ? depth * 0.62 : 0;

                              const sx =
                                cx + dx + (outerRadius + 4) * Math.cos(rad);
                              const sy =
                                cy +
                                dy +
                                (outerRadius + 4) * Math.sin(rad) * tilt +
                                lift;

                              const ex =
                                cx + dx + (outerRadius + 26) * Math.cos(rad);
                              const ey =
                                cy +
                                dy +
                                (outerRadius + 26) * Math.sin(rad) * tilt +
                                lift;

                              const dir = Math.cos(rad) >= 0 ? 1 : -1;
                              const hx = ex + dir * 18;
                              const hy = ey;

                              const pct = Math.round(value);

                              return (
                                <g>
                                  <path
                                    d={`M ${sx} ${sy} L ${ex} ${ey} L ${hx} ${hy}`}
                                    stroke="rgba(255,255,255,0.38)"
                                    strokeWidth={1}
                                    fill="none"
                                  />

                                  {name ? (
                                    <text
                                      x={hx + dir * 16}
                                      y={hy - 18}
                                      textAnchor="middle"
                                      dominantBaseline="middle"
                                      fill="rgba(255,255,255,0.86)"
                                      fontSize={10}
                                      fontWeight={800}
                                    >
                                      {name}
                                    </text>
                                  ) : null}

                                  <circle
                                    cx={hx + dir * 16}
                                    cy={hy}
                                    r={14}
                                    fill="rgba(255,255,255,0.95)"
                                  />
                                  <text
                                    x={hx + dir * 16}
                                    y={hy + 0.5}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill="rgba(0,0,0,0.72)"
                                    fontSize={11}
                                    fontWeight={800}
                                  >
                                    {pct}%
                                  </text>
                                </g>
                              );
                            }}
                          >
                            {sentimentPieData.map((entry, idx) => (
                              <Cell
                                key={`${entry.name}-${idx}`}
                                fill={`url(#sentiment-top-${sentimentIdSafe}-${idx})`}
                              />
                            ))}
                          </Pie>

                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active) return null;
                              const item = payload?.[0] as any;
                              if (!item) return null;

                              const name =
                                String(
                                  item?.name ?? item?.payload?.name ?? "",
                                ) || "Sentiment";
                              const value = Number(item?.value ?? 0);
                              const color =
                                String(
                                  item?.payload?.fill ?? item?.color ?? "",
                                ) || "rgba(255,255,255,0.8)";

                              return (
                                <div className="rounded-lg border border-white-100/10 bg-neutral-black/80 px-3 py-2 text-xs text-white-100 shadow-sm">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="h-2.5 w-2.5 rounded-full"
                                      style={{ backgroundColor: color }}
                                    />
                                    <span className="font-semibold">
                                      {name}
                                    </span>
                                  </div>
                                  <div className="mt-1 text-white-200">
                                    {formatCompactNumber(value)}%
                                  </div>
                                </div>
                              );
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div className="rounded-xl border border-white-100/10 bg-neutral-black/40 px-4 py-3 text-xs text-white-200">
                          No sentiment data available yet.
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative mt-3 grid grid-cols-1 gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 ${sentimentSummary.netTone.cls}`}
                        title={`Net sentiment = Positive - Negative = ${Math.round(sentimentSummary.net)}%`}
                      >
                        <span className="h-2 w-2 rounded-full bg-white-100/70" />
                        {sentimentSummary.netTone.label}
                      </span>

                      <span className="inline-flex items-center gap-2 rounded-full border border-white-100/10 bg-white-100/5 px-2.5 py-1 text-white-200">
                        Dominant
                        <span className="text-white-100 font-semibold">
                          {sentimentSummary.dominant?.name ?? "—"}
                        </span>
                      </span>
                    </div>

                    <div className="w-full">
                      <div className="relative h-2.5 overflow-hidden rounded-full border border-white-100/10 bg-white-100/5">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-400/70 via-sky-400/70 to-emerald-400/75" />
                        <div
                          className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-white-100/25 bg-neutral-black/70 shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
                          style={{
                            left: `calc(${sentimentSummary.markerLeftPct}% - 8px)`,
                          }}
                          title={`Net sentiment: ${Math.round(sentimentSummary.net)}%`}
                        />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-white-200">
                        <span>More negative</span>
                        <span>More positive</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 gap-2">
                    {sentimentSummary.entries.map((e) => (
                      <div
                        key={`sent-tile-${e.name}`}
                        className={`relative overflow-hidden rounded-xl border p-3 ${e.pill}`}
                      >
                        <span
                          className="pointer-events-none absolute inset-0 opacity-70"
                          style={{
                            background:
                              "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.08), transparent 55%)",
                          }}
                          aria-hidden="true"
                        />
                        <div className="relative flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${e.dot}`}
                              aria-hidden="true"
                            />
                            <span className="text-[12px] font-semibold text-white-100">
                              {e.name}
                            </span>
                          </div>

                          <div
                            className={`text-[22px] font-extrabold leading-none ${e.text}`}
                            title={`${e.name}: ${Math.round(e.value)}%`}
                          >
                            {Math.round(e.value)}%
                          </div>

                          <div className="text-[11px] text-white-200 leading-snug">
                            {e.name === "Positive"
                              ? "What people liked"
                              : e.name === "Neutral"
                                ? "Mixed / informational"
                                : "Common complaints"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {summaryQuote ? (
                    <div className="rounded-xl border border-white-100/10 bg-gradient-to-br from-white-100/7 via-neutral-black/35 to-white-100/0 p-4">
                      <p className="text-[12px] font-semibold text-white-100">
                        Summary
                      </p>
                      <p className="mt-1 text-xs text-white-200 italic leading-relaxed">
                        “{summaryQuote}”
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              {realComments.length ? (
                <div className="mt-4 rounded-xl border border-white-100/10 bg-gradient-to-br from-white-100/6 via-neutral-black/40 to-white-100/0 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-white-100 text-sm font-semibold">
                        Real user comments
                      </p>
                      <p className="mt-0.5 text-[11px] text-white-200">
                        Quick quotes that explain the score.
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full border border-white-100/10 bg-white-100/5 px-2.5 py-1 text-[10px] text-white-200">
                      Top {realComments.length}
                    </span>
                  </div>

                  <ul className="mt-3 space-y-2">
                    {realComments.map((c, idx) => {
                      const tone = idx % 3;
                      const barClass =
                        tone === 0
                          ? "bg-gradient-to-b from-emerald-400/80 to-teal-400/60"
                          : tone === 1
                            ? "bg-gradient-to-b from-sky-400/80 to-indigo-400/60"
                            : "bg-gradient-to-b from-orange-400/80 to-red-400/60";

                      return (
                        <li
                          key={idx}
                          className="relative overflow-hidden rounded-lg border border-white-100/10 bg-white-100/5 px-3 py-2.5"
                        >
                          <span
                            className="pointer-events-none absolute inset-0 opacity-80"
                            style={{
                              background:
                                "radial-gradient(circle at 20% 35%, rgba(255,255,255,0.08), transparent 55%)",
                            }}
                            aria-hidden="true"
                          />
                          <span
                            className={`absolute left-0 top-0 h-full w-0.5 ${barClass}`}
                            aria-hidden="true"
                          />

                          <div className="relative">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-white-100 font-semibold text-xs">
                                {c.source}
                              </span>
                              {typeof c.url === "string" && c.url ? (
                                <a
                                  href={c.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] text-white-100/75 underline underline-offset-2"
                                >
                                  link
                                </a>
                              ) : null}
                            </div>
                            <div className="mt-1 text-xs text-white-200 italic leading-relaxed">
                              “{c.comment}”
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
