"use client";

import { useMemo } from "react";
import { useTheme } from "next-themes";
import { X, LineChart as LineChartIcon, Loader2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { dc } from "@/lib/dashboard-theme";

export type DailyPricePoint = {
  date: string;
  price: number;
  exchangeRate: number;
  priceINR: number;
};

export type DailyPriceTicker = {
  _id: string;
  name: string;
  tickerName: string;
  currency: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  ticker: DailyPriceTicker | null;
  prices: DailyPricePoint[];
  loading: boolean;
};

const formatINR = (v: number) =>
  "₹" + v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function DailyPriceChartModal({
  open,
  onClose,
  ticker,
  prices,
  loading,
}: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const chartTheme = useMemo(
    () => ({
      grid: isDark ? "oklch(0.45 0.08 285 / 25%)" : "#e2e8f0",
      tick: isDark ? "oklch(0.62 0.05 285)" : "#64748b",
      line: isDark ? "oklch(0.72 0.19 285)" : "#7c3aed",
      cursor: isDark ? "oklch(0.55 0.18 285 / 18%)" : "#e2e8f0",
      tooltip: {
        borderRadius: "16px",
        border: "1px solid",
        borderColor: isDark ? "oklch(0.5 0.1 285 / 30%)" : "rgba(0,0,0,0.06)",
        boxShadow: isDark
          ? "0 20px 48px -12px oklch(0.08 0.03 285 / 90%)"
          : "0 20px 25px -5px rgb(0 0 0 / 0.1)",
        backgroundColor: isDark ? "oklch(0.17 0.042 288)" : "#ffffff",
        color: isDark ? "oklch(0.94 0.015 285)" : "#18181b",
      },
    }),
    [isDark]
  );

  const chartData = useMemo(
    () =>
      prices.map((p) => ({
        ...p,
        label: new Date(p.date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        }),
      })),
    [prices]
  );

  if (!open) return null;

  return (
    <div
      className={cn(dc.modalOverlay, "z-[60] animate-in fade-in duration-200")}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={cn(
          dc.modalPanel,
          "max-h-[90vh] w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200"
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="daily-price-modal-title"
      >
        <div className="flex items-start justify-between border-b border-border/60 p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <div className={dc.iconBox}>
              <LineChartIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 id="daily-price-modal-title" className={dc.modalTitle}>
                {ticker?.name ?? "Price history"}
              </h2>
              <p className={cn(dc.modalSub, "mt-1")}>
                {ticker?.tickerName}
                {ticker?.currency ? ` · ${ticker.currency}` : ""}
                {prices.length > 0 ? ` · ${prices.length} daily points` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {loading ? (
            <div className="flex h-[360px] flex-col items-center justify-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-violet-600 dark:text-[oklch(0.72_0.16_285)]" />
              <p className="text-sm font-bold text-muted-foreground">Loading price history…</p>
            </div>
          ) : prices.length === 0 ? (
            <div className={cn(dc.emptyWrap, "py-16")}>
              <p className="font-medium text-muted-foreground">
                No daily price data found for this asset yet.
              </p>
            </div>
          ) : (
            <div className="h-[380px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 12, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: chartTheme.tick, fontSize: 11 }}
                    dy={8}
                    minTickGap={24}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: chartTheme.tick, fontSize: 11 }}
                    tickFormatter={(v) => formatINR(Number(v))}
                    width={72}
                  />
                  <Tooltip
                    cursor={{ stroke: chartTheme.line, strokeWidth: 1, strokeDasharray: "4 4" }}
                    contentStyle={chartTheme.tooltip}
                    labelStyle={{ color: chartTheme.tooltip.color, fontWeight: 700 }}
                    formatter={(value: any, name: any) => {
                      if (name === "priceINR") return [formatINR(Number(value || 0)), "INR value"];
                      return [Number(value || 0).toFixed(2), ticker?.currency ?? "Price"];
                    }}
                    labelFormatter={(_, payload) => {
                      const row = payload?.[0]?.payload as { date?: string } | undefined;
                      if (!row?.date) return "";
                      return new Date(row.date).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      });
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="priceINR"
                    name="priceINR"
                    stroke={chartTheme.line}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: chartTheme.line, stroke: "#fff", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
