"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useTheme } from "next-themes";
import { useSelector } from "react-redux";
import Link from "next/link";
import { RootState } from "@/lib/store";
import {
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  X,
  Layers,
  PackagePlus,
  PackageMinus,
  RefreshCcw,
  AlertCircle,
  Search,
  HelpCircle,
  BarChart2,
  Zap,
  BadgeDollarSign,
  Activity,
  Scale,
} from "lucide-react";
import { toast } from "sonner";
import { dc } from "@/lib/dashboard-theme";
import { cn } from "@/lib/utils";
import {
  DailyPriceChartModal,
  type DailyPricePoint,
  type DailyPriceTicker,
} from "@/components/dashboard/daily-price-chart-modal";
import { VaultAdvisor } from "@/components/dashboard/vault-advisor";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,

  Treemap
} from "recharts";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

interface PortfolioGroup {
  _id: string;
  name: string;
  isDefault: boolean;
}

interface LatestMetrics {
  trailingPE?: number;
  forwardPE?: number;
  epsTrailingTwelveMonths?: number;
  epsForward?: number;
  priceToBook?: number;
  marketCap?: number;
  dividendYield?: number;
  trailingAnnualDividendYield?: number;
  fiftyDayAverage?: number;
  twoHundredDayAverage?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  regularMarketVolume?: number;
  averageDailyVolume3Month?: number;
}

interface AssetItem {
  _id: string;
  buyingPrice: number;
  quantity: number;
  tickerDetails?: { _id: string; name: string; tickerName: string; currency: string; type?: string; sector?: string; };
  currentPrice: number | null;
  exchangeRate: number;
  latestMetrics?: LatestMetrics | null;
}

const TICKER_GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-600",
  "from-orange-400 to-rose-500",
  "from-pink-500 to-fuchsia-600",
  "from-amber-400 to-orange-500",
  "from-sky-500 to-blue-600",
  "from-green-400 to-emerald-600",
  "from-red-500 to-rose-600",
  "from-indigo-500 to-violet-600",
];

const getTickerGradient = (ticker: string) => {
  let hash = 0;
  for (let i = 0; i < ticker.length; i++) hash = ticker.charCodeAt(i) + ((hash << 5) - hash);
  return TICKER_GRADIENTS[Math.abs(hash) % TICKER_GRADIENTS.length];
};

const toINR = (price: number, rate: number) => price * rate;
const formatINR = (v: number) =>
  "₹" + v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Sentinel ID for the virtual "All Assets" default portfolio
const ALL_ASSETS_ID = "__all__";

// ── Treemap Custom Renderers ──────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTreemapContent = (props: any) => {
  const { x, y, width, height, name, plPerc = 0 } = props;
  
  // Determine color based on performance
  let fill = "#f1f5f9"; // default slate
  if (plPerc >= 5) fill = "#10b981"; // emerald 500
  else if (plPerc > 0) fill = "#6ee7b7"; // emerald 300
  else if (plPerc <= -5) fill = "#f43f5e"; // rose 500
  else if (plPerc < 0) fill = "#fda4af"; // rose 300

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill,
          stroke: "#fff",
          strokeWidth: 2,
          strokeOpacity: 1,
        }}
      />
      {width > 60 && height > 40 && (
        <foreignObject x={x} y={y} width={width} height={height}>
          <div className="w-full h-full flex flex-col items-center justify-center p-1 text-center pointer-events-none">
            <span className="text-[10px] sm:text-xs font-bold text-white drop-shadow-sm uppercase leading-tight truncate w-full">
              {name}
            </span>
            <span className="text-[9px] sm:text-[10px] font-medium text-white/90 drop-shadow-sm">
              {plPerc >= 0 ? "+" : ""}{Number(plPerc).toFixed(1)}%
            </span>
          </div>
        </foreignObject>
      )}
    </g>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTreemapTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="dashboard-card rounded-2xl border border-border/60 bg-card/95 p-4 shadow-2xl backdrop-blur-md">
        <p className="mb-1 text-base font-bold text-foreground">{data.name}</p>
        <p className="mb-2 text-sm text-muted-foreground">
          Value: <span className="font-semibold">₹{data.size.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </p>
        <div className={`text-sm font-bold flex items-center gap-1 ${data.plPerc >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
          Performance: {data.plPerc >= 0 ? "+" : ""}{data.plPerc.toFixed(2)}%
        </div>
      </div>
    );
  }
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Tooltip helper
// ─────────────────────────────────────────────────────────────────────────────
function InfoTooltip({ text }: { text: string }) {
  return (
    <div className="relative group/tip inline-flex items-center">
      <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help ml-1.5 shrink-0" />
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-64 rounded-2xl bg-slate-900 p-3.5 text-xs text-slate-200 leading-relaxed shadow-2xl opacity-0 group-hover/tip:opacity-100 transition-opacity duration-200 z-50">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45 -mt-1" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Portfolio Insights Panel
// ─────────────────────────────────────────────────────────────────────────────
type AlertRow = { name: string; ticker: string; detail: string; severity: "warn" | "ok" | "info"; allocWeight: number };

interface InsightCard {
  id: string;
  icon: React.ReactNode;
  label: string;
  tooltipText: string;
  colorClass: string; // border + bg tint
  headerColor: string; // icon/label accent
  badgeClass: string;
  alerts: AlertRow[];
  emptyText: string;
}

function InsightAlertRow({ row }: { row: AlertRow }) {
  const dot =
    row.severity === "warn"
      ? "bg-amber-400 dark:bg-amber-300"
      : row.severity === "ok"
      ? "bg-emerald-400 dark:bg-emerald-300"
      : "bg-blue-400 dark:bg-blue-300";
  return (
    <div className="flex items-start gap-3.5 py-3.5 border-b border-border/40 last:border-0">
      <span className={`mt-2 w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-bold text-foreground text-sm">{row.name}</span>
          <span className="text-muted-foreground text-xs">({row.ticker})</span>
          {row.allocWeight > 0 && (
            <span className="text-[10px] font-black text-muted-foreground/70 bg-muted/40 dark:bg-muted/30 px-1.5 py-0.5 rounded-full">
              {row.allocWeight.toFixed(1)}% of portfolio
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{row.detail}</p>
      </div>
    </div>
  );
}

function InsightCard({ card }: { card: InsightCard }) {
  const hasAlerts = card.alerts.length > 0;
  return (
    <div
      className={`rounded-3xl border p-7 transition-all duration-300 ${
        hasAlerts ? card.colorClass : "border-border/50 bg-card/60"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              hasAlerts ? card.headerColor : "bg-muted/50"
            }`}
          >
            {card.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span
                className={`text-xs font-black uppercase tracking-[0.18em] ${
                  hasAlerts ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {card.label}
              </span>
              <InfoTooltip text={card.tooltipText} />
            </div>
          </div>
        </div>
        {hasAlerts && (
          <span className={`shrink-0 text-xs font-black px-3 py-1.5 rounded-full ${card.badgeClass}`}>
            {card.alerts.length} signal{card.alerts.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Body */}
      {hasAlerts ? (
        <div className="space-y-0 max-h-72 overflow-y-auto pr-1">
          {card.alerts.map((row, i) => (
            <InsightAlertRow key={i} row={row} />
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 mt-3">
          <span className="text-emerald-500 dark:text-emerald-400 text-xl">✓</span>
          <p className="text-sm text-muted-foreground font-medium">{card.emptyText}</p>
        </div>
      )}
    </div>
  );
}

function PortfolioInsights({
  items,
  currentValue,
}: {
  items: AssetItem[];
  currentValue: number;
}) {
  const cards: InsightCard[] = React.useMemo(() => {
    // Build allocation % map for each item
    const allocMap = new Map<string, number>();
    for (const item of items) {
      const rate = item.exchangeRate || 1;
      const val = (item.currentPrice ? item.currentPrice * rate : item.buyingPrice * rate) * item.quantity;
      allocMap.set(item._id, currentValue > 0 ? (val / currentValue) * 100 : 0);
    }
    const byWeight = (a: AlertRow, b: AlertRow) => b.allocWeight - a.allocWeight;

    // 1. Valuation Radar
    const valuationAlerts: AlertRow[] = [];
    for (const item of items) {
      const m = item.latestMetrics;
      if (!m) continue;
      const name = item.tickerDetails?.name || "Unknown";
      const ticker = item.tickerDetails?.tickerName || "";
      const allocWeight = allocMap.get(item._id) ?? 0;
      if (m.trailingPE != null && m.trailingPE > 40) {
        valuationAlerts.push({ name, ticker, severity: "warn", allocWeight, detail: `P/E ratio is ${m.trailingPE.toFixed(1)}× — trading at a significant premium. Earnings must grow substantially to justify this price.` });
      } else if (m.trailingPE != null && m.trailingPE > 0 && m.trailingPE < 12) {
        valuationAlerts.push({ name, ticker, severity: "ok", allocWeight, detail: `P/E ratio is only ${m.trailingPE.toFixed(1)}× — potentially undervalued or a value opportunity.` });
      }
      if (m.priceToBook != null && m.priceToBook < 1 && m.priceToBook > 0) {
        valuationAlerts.push({ name, ticker, severity: "ok", allocWeight, detail: `Price-to-Book is ${m.priceToBook.toFixed(2)}× — trading below book value. May indicate a margin of safety.` });
      } else if (m.priceToBook != null && m.priceToBook > 6) {
        valuationAlerts.push({ name, ticker, severity: "warn", allocWeight, detail: `Price-to-Book is ${m.priceToBook.toFixed(2)}× — premium valuation relative to net assets.` });
      }
    }
    valuationAlerts.sort(byWeight);

    // 2. Technical Signals
    const technicalAlerts: AlertRow[] = [];
    for (const item of items) {
      const m = item.latestMetrics;
      const price = item.currentPrice;
      if (!m || price == null) continue;
      const name = item.tickerDetails?.name || "Unknown";
      const ticker = item.tickerDetails?.tickerName || "";
      const allocWeight = allocMap.get(item._id) ?? 0;
      if (m.fiftyTwoWeekHigh != null && price >= m.fiftyTwoWeekHigh * 0.97) {
        technicalAlerts.push({ name, ticker, severity: "warn", allocWeight, detail: `Price (₹${price.toFixed(2)}) is within 3% of its 52-week high of ₹${m.fiftyTwoWeekHigh.toFixed(2)}. Momentum is strong but upside may be limited short-term.` });
      } else if (m.fiftyTwoWeekLow != null && price <= m.fiftyTwoWeekLow * 1.05) {
        technicalAlerts.push({ name, ticker, severity: "warn", allocWeight, detail: `Price (₹${price.toFixed(2)}) is near its 52-week low of ₹${m.fiftyTwoWeekLow.toFixed(2)}. Could be a buying opportunity or signal further weakness.` });
      }
      if (m.fiftyDayAverage != null && m.twoHundredDayAverage != null && m.fiftyDayAverage < m.twoHundredDayAverage * 0.98) {
        technicalAlerts.push({ name, ticker, severity: "warn", allocWeight, detail: `50-day avg (₹${m.fiftyDayAverage.toFixed(0)}) is below 200-day avg (₹${m.twoHundredDayAverage.toFixed(0)}) — a bearish "death cross" signal.` });
      } else if (m.fiftyDayAverage != null && m.twoHundredDayAverage != null && m.fiftyDayAverage > m.twoHundredDayAverage * 1.04) {
        technicalAlerts.push({ name, ticker, severity: "ok", allocWeight, detail: `50-day avg (₹${m.fiftyDayAverage.toFixed(0)}) is well above 200-day avg (₹${m.twoHundredDayAverage.toFixed(0)}) — a bullish "golden cross" signal.` });
      }
    }
    technicalAlerts.sort(byWeight);

    // 3. Dividend Watch
    const dividendAlerts: AlertRow[] = [];
    for (const item of items) {
      const m = item.latestMetrics;
      if (!m) continue;
      const name = item.tickerDetails?.name || "Unknown";
      const ticker = item.tickerDetails?.tickerName || "";
      const allocWeight = allocMap.get(item._id) ?? 0;
      const yld = (m.dividendYield ?? 0) * 100;
      const effectiveYld = yld > 0 ? yld : (m.trailingAnnualDividendYield ?? 0) * 100;
      if (effectiveYld >= 3) {
        dividendAlerts.push({ name, ticker, severity: "ok", allocWeight, detail: `Dividend yield is ${effectiveYld.toFixed(2)}% — a high-income opportunity paying well above typical fixed-income alternatives.` });
      } else if (effectiveYld > 0 && effectiveYld < 1) {
        dividendAlerts.push({ name, ticker, severity: "info", allocWeight, detail: `Dividend yield is low at ${effectiveYld.toFixed(2)}%. This is largely a growth play — don't rely on it for income.` });
      }
    }
    dividendAlerts.sort(byWeight);

    // 4. Volume Anomaly
    const volumeAlerts: AlertRow[] = [];
    for (const item of items) {
      const m = item.latestMetrics;
      if (!m) continue;
      const name = item.tickerDetails?.name || "Unknown";
      const ticker = item.tickerDetails?.tickerName || "";
      const allocWeight = allocMap.get(item._id) ?? 0;
      const vol = m.regularMarketVolume ?? 0;
      const avgVol = m.averageDailyVolume3Month ?? 0;
      if (vol > 0 && avgVol > 0) {
        const ratio = vol / avgVol;
        if (ratio >= 3) volumeAlerts.push({ name, ticker, severity: "warn", allocWeight, detail: `Today's volume (${(vol / 1000).toFixed(0)}K) is ${ratio.toFixed(1)}× the 3-month average. Significant institutional or news-driven activity.` });
        else if (ratio >= 2) volumeAlerts.push({ name, ticker, severity: "info", allocWeight, detail: `Today's volume (${(vol / 1000).toFixed(0)}K) is ${ratio.toFixed(1)}× the normal average — elevated activity worth watching.` });
      }
    }
    volumeAlerts.sort(byWeight);

    // 5. Concentration Risk
    const concentrationAlerts: AlertRow[] = [];
    for (const item of items) {
      const rate = item.exchangeRate || 1;
      const effINR = (item.currentPrice ? item.currentPrice * rate : item.buyingPrice * rate);
      const alloc = currentValue > 0 ? (effINR * item.quantity / currentValue) * 100 : 0;
      const name = item.tickerDetails?.name || "Unknown";
      const ticker = item.tickerDetails?.tickerName || "";
      if (alloc > 20) concentrationAlerts.push({ name, ticker, severity: "warn", allocWeight: alloc, detail: `${alloc.toFixed(1)}% of your portfolio is in this single asset — very high concentration. A bad quarter here has an outsized portfolio impact.` });
      else if (alloc > 5) concentrationAlerts.push({ name, ticker, severity: "warn", allocWeight: alloc, detail: `${alloc.toFixed(1)}% allocation exceeds the 5% diversification guideline. Consider if this concentration is intentional.` });
    }
    concentrationAlerts.sort(byWeight);

    return [
      { id: "valuation", icon: <Scale className="w-5 h-5 text-amber-600 dark:text-amber-400" />, label: "Valuation Radar", tooltipText: "P/E (Price-to-Earnings) shows how much you pay per ₹1 of profit. P/B (Price-to-Book) compares price to net asset value. High P/E (>40) = expensive; low P/E (<12) = potentially cheap. P/B < 1 means you're buying below asset value.", colorClass: "border-amber-200 dark:border-amber-800/50 bg-amber-50/70 dark:bg-amber-950/20", headerColor: "bg-amber-100 dark:bg-amber-900/40", badgeClass: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300", alerts: valuationAlerts, emptyText: "All valuations are within normal ranges." },
      { id: "technical", icon: <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />, label: "Technical Signals", tooltipText: "Moving averages smooth out price noise. When the 50-day average crosses above the 200-day (golden cross) it's bullish; crossing below (death cross) is bearish. Prices near 52-week highs show strength; near 52-week lows show weakness.", colorClass: "border-indigo-200 dark:border-indigo-800/50 bg-indigo-50/70 dark:bg-indigo-950/20", headerColor: "bg-indigo-100 dark:bg-indigo-900/40", badgeClass: "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300", alerts: technicalAlerts, emptyText: "No notable technical crossovers or extremes." },
      { id: "dividend", icon: <BadgeDollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />, label: "Dividend Watch", tooltipText: "Dividend yield = annual dividend ÷ current price. A yield above 3% is generally considered high income. Most fixed deposits in India return 6–7%, so compare accordingly. Low yield isn't bad — it often means the company reinvests profits for growth instead.", colorClass: "border-blue-200 dark:border-blue-800/50 bg-blue-50/70 dark:bg-blue-950/20", headerColor: "bg-blue-100 dark:bg-blue-900/40", badgeClass: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300", alerts: dividendAlerts, emptyText: "No notable dividend signals in this portfolio." },
      { id: "volume", icon: <Zap className="w-5 h-5 text-violet-600 dark:text-violet-400" />, label: "Volume Anomaly", tooltipText: "Volume is the number of shares traded in a day. When today's volume is 2× or more vs the 3-month average, it often signals institutional buying/selling, news events, or earnings reactions. High volume on a price spike = strong conviction; high volume on a drop = potential panic selling.", colorClass: "border-violet-200 dark:border-violet-800/50 bg-violet-50/70 dark:bg-violet-950/20", headerColor: "bg-violet-100 dark:bg-violet-900/40", badgeClass: "bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300", alerts: volumeAlerts, emptyText: "No unusual trading volume detected today." },
      { id: "concentration", icon: <BarChart2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />, label: "Concentration Risk", tooltipText: "A single asset exceeding 5% of your portfolio increases overall risk. If it drops 30%, it moves your whole portfolio by 1.5%+. The 5% rule is a common diversification guideline — intentional concentration in high-conviction picks is fine, but it should be a deliberate choice.", colorClass: "border-rose-200 dark:border-rose-800/50 bg-rose-50/70 dark:bg-rose-950/20", headerColor: "bg-rose-100 dark:bg-rose-900/40", badgeClass: "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300", alerts: concentrationAlerts, emptyText: "Portfolio is well-diversified. No position exceeds 5%." },
    ];
  }, [items, currentValue]);

  const totalSignals = cards.reduce((acc, c) => acc + c.alerts.length, 0);

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Zap className="w-6 h-6 text-violet-500 dark:text-[oklch(0.72_0.16_285)]" />
            Portfolio Insights
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Intelligent signals sorted by portfolio weight · derived from today&apos;s market data
          </p>
        </div>
        {totalSignals > 0 && (
          <div className="flex items-center gap-2 bg-violet-50 dark:bg-[oklch(0.22_0.06_285/50%)] border border-violet-200 dark:border-[oklch(0.45_0.14_285/40%)] text-violet-700 dark:text-[oklch(0.78_0.16_285)] text-xs font-black px-4 py-2.5 rounded-full">
            <AlertCircle className="w-3.5 h-3.5" />
            {totalSignals} active signal{totalSignals !== 1 ? "s" : ""}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {cards.map((card) => (
          <InsightCard key={card.id} card={card} />
        ))}
      </div>
      {items.every((i) => !i.latestMetrics) && (
        <div className="mt-5 text-center text-sm text-muted-foreground bg-muted/30 border border-border/50 rounded-2xl px-6 py-5">
          <AlertCircle className="w-4 h-4 mx-auto mb-1.5 text-muted-foreground/50" />
          Financial metrics will appear once today&apos;s price sync runs. Concentration Risk is always available.
        </div>
      )}
    </div>
  );
}

export default function DashboardPortfoliosPage() {
  const user = useSelector((s: RootState) => s.auth.user);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  const perfChartTheme = useMemo(
    () => ({
      gridStroke: isDark ? "oklch(0.45 0.08 285 / 25%)" : "#e2e8f0",
      tickFill: isDark ? "oklch(0.62 0.05 285)" : "#64748b",
      cursorFill: isDark ? "oklch(0.55 0.18 285 / 18%)" : "#e2e8f0",
      legendColor: isDark ? "oklch(0.75 0.12 285)" : "#475569",
      tooltipStyle: {
        borderRadius: "16px",
        border: "1px solid",
        borderColor: isDark ? "oklch(0.5 0.1 285 / 30%)" : "rgba(0,0,0,0.06)",
        boxShadow: isDark
          ? "0 20px 48px -12px oklch(0.08 0.03 285 / 90%)"
          : "0 20px 25px -5px rgb(0 0 0 / 0.1)",
        backgroundColor: isDark ? "oklch(0.17 0.042 288)" : "#f8fafc",
        color: isDark ? "oklch(0.94 0.015 285)" : "#18181b",
      },
      investedGradient: isDark
        ? { top: "#a78bfa", bottom: "#7c3aed" }
        : { top: "#ddd6fe", bottom: "#c4b5fd" },
      currentGradient: isDark
        ? { top: "#c4b5fd", bottom: "#6366f1" }
        : { top: "#8b5cf6", bottom: "#7c3aed" },
    }),
    [isDark]
  );
  
  const getUserId = React.useCallback(() => {
    if (user?.id || user?._id) return user?.id || user?._id;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return parsed.id || parsed._id;
        } catch (_e) { return null; }
      }
    }
    return null;
  }, [user]);

  // portfolio group list
  const [groups, setGroups] = useState<PortfolioGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // items in selected group
  const [items, setItems] = useState<AssetItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // all assets (for add-to-portfolio panel)
  const [allAssets, setAllAssets] = useState<AssetItem[]>([]);
  const [showAddPanel, setShowAddPanel] = useState(false);

  // create group modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [creating, setCreating] = useState(false);

  // daily price chart modal
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [priceModalTicker, setPriceModalTicker] = useState<DailyPriceTicker | null>(null);
  const [dailyPrices, setDailyPrices] = useState<DailyPricePoint[]>([]);
  const [loadingDailyPrices, setLoadingDailyPrices] = useState(false);

  // ── outside click ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // ── data loading ──────────────────────────────────────────────────────────
  const fetchGroups = useCallback(async () => {
    if (!getUserId()) return;
    try {
      const res = await fetch(`${API_BASE}/portfolio-groups/user/${getUserId()}`);
      const data = await res.json();
      setGroups(data.data || []);
    } catch (_e) {
      toast.error("Could not load portfolios");
    }
  }, [user]);

  const fetchGroupItems = useCallback(async (groupId: string) => {
    setLoadingItems(true);
    setRefreshing(true);
    try {
      const res = await fetch(
        `${API_BASE}/portfolio-groups/${groupId}/items?userId=${getUserId()}`
      );
      const data = await res.json();
      setItems(data.data || []);
    } catch (_e) {
      toast.error("Could not load portfolio items");
    } finally {
      setLoadingItems(false);
      setRefreshing(false);
    }
  }, [user]);

  const fetchAllAssets = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/portfolios/user/${getUserId()}`);
      const data = await res.json();
      setAllAssets(data.data || []);
    } catch (_e) {
      console.error("Failed to load all assets");
    }
  }, [user]);

  // When data first loads, default to All Assets
  useEffect(() => {
    const timer = setTimeout(() => {
      const uid = getUserId();
      if (uid) {
        fetchGroups();
        fetchAllAssets();
        setSelectedGroupId(ALL_ASSETS_ID);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [user, getUserId, fetchGroups, fetchAllAssets]);

  useEffect(() => {
    if (!selectedGroupId) return;
    if (selectedGroupId === ALL_ASSETS_ID) {
      // Show all assets directly
      setLoadingItems(true);
      fetchAllAssets().then(() => setLoadingItems(false));
    } else {
      fetchGroupItems(selectedGroupId);
    }
  }, [selectedGroupId]);

  // ── derived ───────────────────────────────────────────────────────────────
  const isAllAssets = selectedGroupId === ALL_ASSETS_ID;
  const selectedGroup = groups.find((g) => g._id === selectedGroupId);
  const selectedGroupName = isAllAssets ? "All Assets" : (selectedGroup?.name ?? "Select Portfolio");

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "value" | "pl">("value");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // items shown in the table
  const displayItems = isAllAssets ? allAssets : items;

  const filteredAndSortedItems = React.useMemo(() => {
    const result = [...displayItems].filter(item => 
      item.tickerDetails?.tickerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tickerDetails?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    result.sort((a, b) => {
      const rateA = a.exchangeRate || 1;
      const rateB = b.exchangeRate || 1;
      const valA = (a.currentPrice || a.buyingPrice) * rateA * a.quantity;
      const valB = (b.currentPrice || b.buyingPrice) * rateB * b.quantity;
      
      if (sortBy === "name") {
        const nameA = a.tickerDetails?.name || a.tickerDetails?.tickerName || "";
        const nameB = b.tickerDetails?.name || b.tickerDetails?.tickerName || "";
        return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      
      if (sortBy === "value") {
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }
      
      if (sortBy === "pl") {
        const plA = a.currentPrice ? (a.currentPrice - a.buyingPrice) / a.buyingPrice : 0;
        const plB = b.currentPrice ? (b.currentPrice - b.buyingPrice) / b.buyingPrice : 0;
        return sortOrder === "asc" ? plA - plB : plB - plA;
      }
      
      return 0;
    });

    return result;
  }, [displayItems, searchQuery, sortBy, sortOrder]);

  const assetsNotInGroup = allAssets.filter(
    (asset) => !items.some((item) => item._id === asset._id)
  );

  const totalInvestment = displayItems.reduce(
    (acc, item) => acc + item.buyingPrice * (item.exchangeRate || 1) * item.quantity,
    0
  );
  const currentValue = displayItems.reduce((acc, item) => {
    const priceINR = item.currentPrice
      ? toINR(item.currentPrice, item.exchangeRate || 1)
      : item.buyingPrice * (item.exchangeRate || 1);
    return acc + priceINR * item.quantity;
  }, 0);
  const totalPL = currentValue - totalInvestment;
  const plPct = totalInvestment > 0 ? (totalPL / totalInvestment) * 100 : 0;

  // ── chart data ────────────────────────────────────────────────────────────
  const allocationData = displayItems.map((item) => {
    const rate = item.exchangeRate || 1;
    const val = (item.currentPrice || item.buyingPrice) * rate * item.quantity;
    return {
      name: item.tickerDetails?.name || item.tickerDetails?.tickerName || "Unknown",
      value: val,
      displayPercent: currentValue > 0 ? (val / currentValue) * 100 : 0
    };
  }).sort((a, b) => b.value - a.value);

  const performanceData = displayItems.map((item) => {
    const rate = item.exchangeRate || 1;
    const invested = item.buyingPrice * rate * item.quantity;
    const current = (item.currentPrice || item.buyingPrice) * rate * item.quantity;
    return {
      name: item.tickerDetails?.name || item.tickerDetails?.tickerName || "Unknown",
      Invested: Math.round(invested),
      Current: Math.round(current),
    };
  });

  const treemapData = displayItems.map((item) => {
    const rate = item.exchangeRate || 1;
    const buyINR = item.buyingPrice * rate;
    const curINR = item.currentPrice ? toINR(item.currentPrice, rate) : buyINR;
    const val = curINR * item.quantity;
    const plPerc = item.currentPrice
      ? ((item.currentPrice - item.buyingPrice) / item.buyingPrice) * 100
      : 0;

    return {
      name: item.tickerDetails?.name || item.tickerDetails?.tickerName || "Unknown",
      size: val,
      plPerc: plPerc,
    };
  });

  const COLORS = [
    "#A5B4FC", // Light Indigo
    "#818CF8", // Indigo 400
    "#93C5FD", // Blue 300
    "#60A5FA", // Blue 400
    "#C084FC", // Purple 400
    "#F472B6", // Pink 400
    "#FB923C", // Orange 400
    "#34D399", // Emerald 400
  ];

  // ── actions ───────────────────────────────────────────────────────────────
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/portfolio-groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: getUserId(), name: newGroupName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(`Portfolio "${newGroupName}" created`);
      setNewGroupName("");
      setShowCreateModal(false);
      await fetchGroups();
      setSelectedGroupId(data.data._id);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const openPriceModal = async (tickerId: string) => {
    setPriceModalOpen(true);
    setPriceModalTicker(null);
    setDailyPrices([]);
    setLoadingDailyPrices(true);
    try {
      const res = await fetch(`${API_BASE}/tickers/${tickerId}/daily-prices?limit=120`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load prices");
      setPriceModalTicker(json.data.ticker);
      setDailyPrices(json.data.prices ?? []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load prices";
      toast.error(msg);
      setPriceModalOpen(false);
    } finally {
      setLoadingDailyPrices(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Delete this portfolio?")) return;
    try {
      const res = await fetch(`${API_BASE}/portfolio-groups/${groupId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Portfolio deleted");
      setSelectedGroupId(ALL_ASSETS_ID);
      setItems([]);
      fetchGroups();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    }
  };

  const handleAddAsset = async (portfolioItemId: string) => {
    if (!selectedGroupId) return;
    try {
      const res = await fetch(`${API_BASE}/portfolio-groups/${selectedGroupId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolioItemId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Asset added to portfolio");
      fetchGroupItems(selectedGroupId);
      fetchAllAssets();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    }
  };

  const handleRemoveAsset = async (portfolioItemId: string) => {
    if (!selectedGroupId) return;
    try {
      const res = await fetch(
        `${API_BASE}/portfolio-groups/${selectedGroupId}/entries/${portfolioItemId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success("Asset removed from portfolio");
      fetchGroupItems(selectedGroupId);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    }
  };

  if (!mounted) {
    return (
      <div className="p-20 text-center flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-slate-500 font-bold tracking-widest uppercase text-[10px]">Initializing Vault...</p>
      </div>
    );
  }

  if (!getUserId() && !loadingItems) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-6 animate-in fade-in">
        <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center">
          <Layers className="w-8 h-8 text-indigo-300" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-black text-slate-800">Vault Access Restricted</h3>
          <p className="text-slate-500 font-medium mt-1">Please sign in to view your portfolios.</p>
        </div>
        <Link href="/auth/signin" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100">
          Sign In to Access
        </Link>
      </div>
    );
  }

  return (
    <div className="dashboard-subpage min-h-full animate-in fade-in space-y-8 px-4 py-8 duration-500 sm:px-10 sm:py-10">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={cn(dc.title, "text-3xl sm:text-4xl")}>
            <span className={dc.titleGradient}>Portfolios</span>
          </h1>
          <p className={cn(dc.subtitle, "mt-1")}>
            Organise your assets into custom portfolios
          </p>
        </div>

        {/* Portfolio Switcher */}
        <div className="flex items-center gap-3">
          {selectedGroupId && (
            <button
              onClick={() => {
                setRefreshing(true);
                if (isAllAssets) fetchAllAssets();
                else fetchGroupItems(selectedGroupId!);
              }}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              title="Refresh"
            >
              <RefreshCcw className={`w-5 h-5 text-slate-600 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          )}

          {/* Dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-full font-medium shadow-sm hover:shadow-md transition-all min-w-[180px] justify-between"
            >
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                {selectedGroupName}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 z-50 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                {/* Always-first: All Assets (virtual, non-deletable) */}
                <ul className="py-1">
                  <li
                    className={`flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-indigo-50 transition-colors ${isAllAssets ? "bg-indigo-50 text-indigo-700" : "text-slate-700"}`}
                    onClick={() => { setSelectedGroupId(ALL_ASSETS_ID); setDropdownOpen(false); setShowAddPanel(false); }}
                  >
                    <span className="text-sm font-semibold flex-1">All Assets</span>
                    <span className="text-[10px] text-indigo-400 font-medium uppercase tracking-wider">Default</span>
                  </li>
                </ul>
                {groups.length > 0 && (
                  <>
                    <div className="mx-4 border-t border-slate-100" />
                    <ul className="max-h-48 overflow-y-auto py-1">
                      {groups.map((g) => (
                        <li
                          key={g._id}
                          className={`flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-indigo-50 transition-colors ${selectedGroupId === g._id ? "bg-indigo-50 text-indigo-700" : "text-slate-700"}`}
                        >
                          <span
                            className="flex-1 text-sm font-medium"
                            onClick={() => { setSelectedGroupId(g._id); setDropdownOpen(false); setShowAddPanel(false); }}
                          >
                            {g.name}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteGroup(g._id); }}
                            className="p-1 rounded-full hover:bg-rose-100 hover:text-rose-600 text-slate-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                <div className="border-t border-slate-100 p-2">
                  <button
                    onClick={() => { setDropdownOpen(false); setShowCreateModal(true); }}
                    className="flex items-center gap-2 w-full text-sm text-indigo-600 font-medium px-3 py-2 rounded-xl hover:bg-indigo-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Create new portfolio
                  </button>
                </div>
              </div>
            )}
          </div>

          {selectedGroupId && !isAllAssets && (
            <button
              onClick={() => setShowAddPanel((s) => !s)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all active:scale-95 ${showAddPanel ? "bg-slate-200 text-slate-700" : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-lg hover:shadow-indigo-500/30"}`}
            >
              <PackagePlus className="w-4 h-4" />
              {showAddPanel ? "Done" : "Add Asset"}
            </button>
          )}
        </div>
      </div>

      {/* ── No portfolio selected ─────────────────────────────────────────── */}
      {!selectedGroupId && (
        <div className="flex flex-col items-center justify-center py-24 gap-5">
          <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center">
            <Layers className="w-10 h-10 text-indigo-400" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No portfolio selected</h3>
            <p className="text-slate-500 max-w-sm">
              Select a portfolio from the dropdown above or create a new one to get started.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Create Portfolio
          </button>
        </div>
      )}

      {/* ── Selected portfolio content ────────────────────────────────────── */}
      {selectedGroupId && (
        <>
          {/* ── Dashboard Summary Cards ────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Invested */}
            <div className={cn(dc.statCard, "rounded-3xl p-8")}>
              <div className="relative z-10">
                <p className={cn(dc.statLabel, "mb-2 text-sm")}>Total invested</p>
                <h3 className={cn(dc.statValue, "text-3xl")}>{formatINR(totalInvestment)}</h3>
              </div>
              <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl" />
            </div>

            {/* Current Value */}
            <div className={cn(dc.heroCard, "rounded-3xl p-8 group hover:scale-[1.02] transition-all duration-500")}>
              <div className="relative z-10 text-white">
                <p className="text-sm font-medium text-indigo-100 uppercase tracking-wider mb-2">Current Value</p>
                <h3 className="text-4xl font-bold">{formatINR(currentValue)}</h3>
              </div>
              <div className="absolute right-4 top-4 p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                <TrendingUp className="w-6 h-6 text-indigo-100" />
              </div>
            </div>

            {/* P&L */}
            <div className={cn(dc.plCardBase, "rounded-3xl p-8", totalPL >= 0 ? dc.plCardUp : dc.plCardDown)}>
              <div className="relative z-10">
                <p className={cn(dc.statLabel, "mb-2 text-sm")}>Overall P&L</p>
                <div className={cn("flex items-baseline gap-2 text-3xl font-bold", totalPL >= 0 ? dc.plTextUp : dc.plTextDown)}>
                  {totalPL >= 0 ? "+" : "-"}{formatINR(Math.abs(totalPL))}
                  <span className="text-sm font-semibold px-2 py-0.5 rounded-full bg-white/50 border border-white/20">
                    {totalPL >= 0 ? "+" : ""}{plPct.toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className={`absolute -right-6 -bottom-6 w-32 h-32 blur-3xl opacity-20 rounded-full ${totalPL >= 0 ? "bg-emerald-500" : "bg-rose-500"}`} />
            </div>
          </div>

          {/* ── Full Width Charts ─────────────────────────────────────── */}
          <div className="flex flex-col gap-8">
            {/* Asset Allocation Donut */}
            <div className={cn(dc.sectionCard, "flex flex-col rounded-3xl")}>
              <h3 className="mb-8 flex items-center gap-2 text-xl font-bold text-foreground">
                <div className="h-7 w-2.5 rounded-full bg-violet-600 dark:bg-[oklch(0.65_0.18_285)]" />
                Asset Allocation
              </h3>
              <div className="h-[600px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="40%"
                      cy="50%"
                      innerRadius={160}
                      outerRadius={240}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                      label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(1)}%)`}
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(val: any, name: any, entry: any) => {
                        const percent = entry?.payload?.displayPercent ?? 0;
                        return [`${formatINR(Number(val || 0))} (${Number(percent).toFixed(1)}%)`, 'Value'];
                      }}
                      contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', backgroundColor: '#f8fafc' }}
                    />
                    <Legend 
                      layout="vertical" 
                      verticalAlign="middle" 
                      align="right"
                      wrapperStyle={{ 
                        paddingLeft: '20px',
                        maxHeight: '400px',
                        overflowY: 'auto'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Performance Comparison (Invested vs Current) */}
            <div className={cn(dc.sectionCard, "flex flex-col rounded-3xl")}>
              <h3 className="mb-8 flex items-center gap-2 text-xl font-bold text-foreground">
                <div className="h-7 w-2.5 rounded-full bg-emerald-500 dark:bg-[oklch(0.65_0.16_155)]" />
                Performance Comparison
              </h3>
              <div className="h-[600px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="barInvested" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={perfChartTheme.investedGradient.top} stopOpacity={0.95} />
                        <stop offset="100%" stopColor={perfChartTheme.investedGradient.bottom} stopOpacity={isDark ? 0.85 : 0.7} />
                      </linearGradient>
                      <linearGradient id="barCurrent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={perfChartTheme.currentGradient.top} stopOpacity={1} />
                        <stop offset="100%" stopColor={perfChartTheme.currentGradient.bottom} stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={perfChartTheme.gridStroke} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: perfChartTheme.tickFill, fontSize: 13, fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: perfChartTheme.cursorFill, radius: 8 }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(val: any) => [formatINR(Number(val || 0)), "Value"]}
                      contentStyle={perfChartTheme.tooltipStyle}
                      labelStyle={{ color: perfChartTheme.tooltipStyle.color, fontWeight: 700 }}
                      itemStyle={{ color: perfChartTheme.tooltipStyle.color }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="circle"
                      wrapperStyle={{ paddingBottom: "20px", color: perfChartTheme.legendColor }}
                    />
                    <Bar
                      dataKey="Invested"
                      fill="url(#barInvested)"
                      radius={[8, 8, 8, 8]}
                      barSize={40}
                      activeBar={{ fill: "url(#barInvested)", opacity: 0.85, stroke: isDark ? "oklch(0.72 0.16 285)" : "#8b5cf6", strokeWidth: 1 }}
                    />
                    <Bar
                      dataKey="Current"
                      fill="url(#barCurrent)"
                      radius={[8, 8, 8, 8]}
                      barSize={40}
                      activeBar={{ fill: "url(#barCurrent)", opacity: 0.9, stroke: isDark ? "oklch(0.78 0.14 285)" : "#6d28d9", strokeWidth: 1 }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ── Analysis Section (Heatmap) ─────────────────────────────────── */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                <Layers className="w-7 h-7 text-indigo-600" />
                Portfolio Heatmap
              </h2>
              <div className="hidden sm:flex items-center gap-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">
                <span>Distribution & Gain Analysis</span>
              </div>
            </div>
            
            <div className="bg-indigo-50/50 backdrop-blur-2xl border border-indigo-100 shadow-2xl rounded-[2.5rem] p-10">
              <div className="h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={treemapData}
                    dataKey="size"
                    aspectRatio={4 / 3}
                    stroke="#fff"
                    fill="#8884d8"
                    content={<CustomTreemapContent />}
                  >
                    <Tooltip content={<CustomTreemapTooltip />} />
                  </Treemap>
                </ResponsiveContainer>
              </div>
              <div className="mt-8 pt-8 border-t border-indigo-100/50 flex flex-wrap items-center justify-center gap-8">
                <div className="flex items-center gap-3 bg-white/50 px-4 py-2 rounded-full border border-white/20">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" />
                  <span className="text-xs font-bold text-slate-600 tracking-wide">+5% Gain</span>
                </div>
                <div className="flex items-center gap-3 bg-white/50 px-4 py-2 rounded-full border border-white/20">
                  <div className="w-3 h-3 rounded-full bg-emerald-300 shadow-sm shadow-emerald-100" />
                  <span className="text-xs font-bold text-slate-600 tracking-wide">Growth</span>
                </div>
                <div className="flex items-center gap-3 bg-white/50 px-4 py-2 rounded-full border border-white/20">
                  <div className="w-3 h-3 rounded-full bg-rose-300 shadow-sm shadow-rose-100" />
                  <span className="text-xs font-bold text-slate-600 tracking-wide">Minor Dip</span>
                </div>
                <div className="flex items-center gap-3 bg-white/50 px-4 py-2 rounded-full border border-white/20">
                  <div className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-200" />
                  <span className="text-xs font-bold text-slate-600 tracking-wide">-5% Loss</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Portfolio Insights ─────────────────────────────────────────── */}
          <PortfolioInsights items={displayItems} currentValue={currentValue} />

          {/* Exchange Rate Strip */}
          {(() => {
            const fxRates = Array.from(
              new Map(
                displayItems
                  .filter(
                    (item) =>
                      item.tickerDetails?.currency &&
                      item.tickerDetails.currency !== "INR" &&
                      item.exchangeRate
                  )
                  .map((item) => [
                    item.tickerDetails!.currency,
                    { currency: item.tickerDetails!.currency, rate: item.exchangeRate },
                  ])
              ).values()
            );
            if (fxRates.length === 0) return null;
            return (
              <div className="flex flex-wrap items-center gap-3 px-1 mt-8 mb-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Market Conversion</span>
                <div className="flex flex-wrap items-center gap-3">
                  {fxRates.map(({ currency, rate }) => (
                    <span
                      key={currency}
                      className="flex items-center gap-2 text-xs font-bold bg-white/80 text-slate-700 border border-slate-100 px-4 py-2 rounded-2xl shadow-sm backdrop-blur-md"
                    >
                      1 {currency}
                      <span className="text-indigo-400">→</span>
                      ₹{rate.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Add Asset Panel */}
          {showAddPanel && (
            <div className={cn(dc.tableWrap, "rounded-3xl")}>
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">Add assets to &quot;{selectedGroup?.name}&quot;</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Click the + button to add an asset from your holdings</p>
                </div>
                <button onClick={() => setShowAddPanel(false)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {assetsNotInGroup.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-slate-400">
                  All your assets are already in this portfolio, or you have no assets yet.
                  <br />
                  Go to <strong>Assets</strong> to add holdings first.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {assetsNotInGroup.map((asset) => (
                    <li key={asset._id} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getTickerGradient(asset.tickerDetails?.name || "?")} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                          {asset.tickerDetails?.name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-slate-800">{asset.tickerDetails?.name || "Unknown"}</div>
                          <div className="text-xs text-slate-500">{asset.tickerDetails?.tickerName}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddAsset(asset._id)}
                        className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ── Assets Table UI Controls ────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by symbol or name..."
                className="w-full bg-white/50 border border-slate-200 rounded-2xl pl-12 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/20 transition-all"
              />
            </div>
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-full sm:w-auto">
              {[
                { id: "name", label: "Name" },
                { id: "value", label: "Value" },
                { id: "pl", label: "P&L" }
              ].map((sort) => (
                <button
                  key={sort.id}
                  onClick={() => {
                    if (sortBy === sort.id) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    else setSortBy(sort.id as "name" | "value" | "pl");
                  }}
                  className={`flex-1 sm:flex-none px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    sortBy === sort.id ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {sort.label} {sortBy === sort.id && (sortOrder === "asc" ? "↑" : "↓")}
                </button>
              ))}
            </div>
          </div>

          {/* Portfolio Items Table */}
          <div className={cn(dc.tableWrap, "rounded-3xl shadow-slate-200/50")}>
            {loadingItems ? (
              <div className="p-12 text-center text-slate-500 animate-pulse">Loading assets...</div>
            ) : filteredAndSortedItems.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-7 h-7 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No matching assets</h3>
                <p className="text-slate-500 text-sm">Adjust your search or filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/60 bg-slate-50/50">
                      <th className="py-4 px-6 font-medium text-slate-500 text-sm uppercase tracking-wider">Asset</th>
                      <th className="py-4 px-6 font-medium text-slate-500 text-sm uppercase tracking-wider text-right">Avg Price (₹)</th>
                      <th className="py-4 px-6 font-medium text-slate-500 text-sm uppercase tracking-wider text-right">Current (₹)</th>
                      <th className="py-4 px-6 font-medium text-slate-500 text-sm uppercase tracking-wider text-right">Holdings</th>
                      <th className="py-4 px-6 font-medium text-slate-500 text-sm uppercase tracking-wider text-right">P&L</th>
                      <th className="py-4 px-6 font-medium text-slate-500 text-sm uppercase tracking-wider text-center">
                        Allocation
                      </th>
                      {!isAllAssets && (
                        <th className="py-4 px-6 font-medium text-slate-500 text-sm uppercase tracking-wider text-center">
                          Remove
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAndSortedItems.map((item) => {
                      const rate = item.exchangeRate || 1;
                      const buyINR = item.buyingPrice * rate;
                      const curINR = item.currentPrice ? toINR(item.currentPrice, rate) : null;
                      const effINR = curINR ?? buyINR;
                      const pl = (effINR - buyINR) * item.quantity;
                      const plPerc = item.currentPrice
                        ? ((item.currentPrice - item.buyingPrice) / item.buyingPrice) * 100
                        : 0;
                      const pos = pl >= 0;
                      const tickerId = item.tickerDetails?._id;
                      return (
                        <tr
                          key={item._id}
                          className={cn(
                            "hover:bg-slate-50/50 transition-colors group",
                            tickerId && "cursor-pointer"
                          )}
                          onClick={() => tickerId && openPriceModal(tickerId)}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getTickerGradient(item.tickerDetails?.name || "?")} flex items-center justify-center font-bold text-white shadow-md text-sm`}>
                                {item.tickerDetails?.name?.charAt(0) || "?"}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-800">{item.tickerDetails?.name || "Unknown"}</div>
                                <div className="text-xs text-slate-500">{item.tickerDetails?.tickerName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right font-medium text-slate-700">{formatINR(buyINR)}</td>
                          <td className="py-4 px-6 text-right">
                            {curINR !== null
                              ? <span className="font-medium text-slate-800">{formatINR(curINR)}</span>
                              : <span className="text-sm text-slate-400">Unavailable</span>}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="font-medium text-slate-800">{item.quantity}</div>
                            <div className="text-xs text-slate-500">{formatINR(effINR * item.quantity)}</div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className={`font-semibold flex items-center justify-end gap-1 ${pos ? "text-emerald-600" : "text-rose-600"}`}>
                              {pos ? "+" : "-"}{formatINR(Math.abs(pl))}
                            </div>
                            <div className={`text-xs flex items-center justify-end ${pos ? "text-emerald-500" : "text-rose-500"}`}>
                              {pos ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                              {Math.abs(plPerc).toFixed(2)}%
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            {(() => {
                              const alloc = currentValue > 0 ? ((effINR * item.quantity) / currentValue) * 100 : 0;
                              const isHigh = alloc > 5;
                              return (
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                  isHigh 
                                    ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse-subtle" 
                                    : "bg-indigo-50 text-indigo-700 border-indigo-100"
                                }`}>
                                  {isHigh && <AlertCircle className="w-3 h-3" />}
                                  {alloc.toFixed(1)}%
                                </div>
                              );
                            })()}
                          </td>
                          {!isAllAssets && (
                            <td className="py-4 px-6 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveAsset(item._id);
                                }}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title="Remove from portfolio"
                              >
                                <PackageMinus className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Create Portfolio Modal ─────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-2xl border border-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Create Portfolio</h2>
                <p className="text-sm text-slate-500 mt-1">Give your portfolio a name</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateGroup} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Portfolio Name</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  placeholder="e.g. Tech Stocks, Long Term…"
                  autoFocus
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-70"
                >
                  {creating ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Vault AI Advisor ─────────────────────────────────────────────── */}
      {selectedGroupId && displayItems.length > 0 && (
        <div className="max-w-[1400px] mx-auto mt-10">
          <VaultAdvisor 
            groupId={isAllAssets ? null : selectedGroupId} 
            groupName={selectedGroupName} 
          />
        </div>
      )}

      <DailyPriceChartModal
        open={priceModalOpen}
        onClose={() => setPriceModalOpen(false)}
        ticker={priceModalTicker}
        prices={dailyPrices}
        loading={loadingDailyPrices}
      />
    </div>
  );
}
