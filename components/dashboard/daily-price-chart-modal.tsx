"use client";

import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { X, LineChart as LineChartIcon, Loader2, BarChart2, Activity, Scale } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import { dc } from "@/lib/dashboard-theme";

export type DailyPricePoint = {
  date: string;
  price: number;
  exchangeRate: number;
  priceINR: number;
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

const fmtINR = (v: number) => "₹" + v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtCrore = (v: number) => {
  if (v >= 1e12) return `₹${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `₹${(v / 1e7).toFixed(0)} Cr`;
  return fmtINR(v);
};
const fmtVol = (v: number) => {
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return v.toString();
};

function MetricPill({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: "green" | "red" | "amber" | "blue" | "default" }) {
  const accents: Record<string, string> = {
    green: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300",
    red: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300",
    amber: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300",
    blue: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300",
    default: "bg-muted/40 dark:bg-muted/20 border-border/50 text-foreground",
  };
  return (
    <div className={cn("rounded-2xl border px-4 py-3.5 flex flex-col gap-1", accents[accent ?? "default"])}>
      <span className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">{label}</span>
      <span className="text-lg font-black leading-tight">{value}</span>
      {sub && <span className="text-[11px] font-medium opacity-55 leading-snug">{sub}</span>}
    </div>
  );
}

export function DailyPriceChartModal({ open, onClose, ticker, prices, loading }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [activeTab, setActiveTab] = useState<"price" | "volume" | "valuation">("price");

  const chartTheme = useMemo(() => ({
    grid: isDark ? "oklch(0.45 0.08 285 / 20%)" : "#e2e8f0",
    tick: isDark ? "oklch(0.62 0.05 285)" : "#64748b",
    line: isDark ? "oklch(0.72 0.19 285)" : "#7c3aed",
    ma50: isDark ? "oklch(0.75 0.18 155)" : "#10b981",
    ma200: isDark ? "oklch(0.72 0.16 25)" : "#f59e0b",
    volBar: isDark ? "oklch(0.72 0.19 285 / 70%)" : "rgba(124, 58, 237, 0.7)",
    peLine: isDark ? "oklch(0.72 0.16 25)" : "#f59e0b",
    pbLine: isDark ? "oklch(0.65 0.18 285)" : "#4f46e5",
    cursor: isDark ? "oklch(0.55 0.18 285 / 18%)" : "#e2e8f0",
    tooltip: {
      borderRadius: "16px",
      border: "1px solid",
      borderColor: isDark ? "oklch(0.5 0.1 285 / 30%)" : "rgba(0,0,0,0.06)",
      boxShadow: isDark ? "0 20px 48px -12px oklch(0.08 0.03 285 / 90%)" : "0 20px 25px -5px rgb(0 0 0 / 0.1)",
      backgroundColor: isDark ? "oklch(0.17 0.042 288)" : "#ffffff",
      color: isDark ? "oklch(0.94 0.015 285)" : "#18181b",
    },
  }), [isDark]);

  const chartData = useMemo(() => prices.map((p) => ({
    ...p,
    label: new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    ma50INR: p.fiftyDayAverage != null ? p.fiftyDayAverage * (p.exchangeRate || 1) : undefined,
    ma200INR: p.twoHundredDayAverage != null ? p.twoHundredDayAverage * (p.exchangeRate || 1) : undefined,
  })), [prices]);

  const volumeData = useMemo(() => chartData.filter(d => d.regularMarketVolume != null && d.regularMarketVolume > 0), [chartData]);
  const valuationData = useMemo(() => chartData.filter(d => d.trailingPE != null || d.priceToBook != null), [chartData]);

  const latest = prices[prices.length - 1] ?? null;
  const curPrice = latest?.priceINR ?? latest?.price ?? 0;
  const wkHigh = latest?.fiftyTwoWeekHigh;
  const wkLow = latest?.fiftyTwoWeekLow;
  const wkRangePercent = wkHigh != null && wkLow != null && wkHigh !== wkLow ? ((curPrice - wkLow) / (wkHigh - wkLow)) * 100 : null;

  if (!open) return null;

  return (
    <div className={cn(dc.modalOverlay, "z-[60] animate-in fade-in duration-200")} onClick={onClose} role="presentation">
      <div className={cn(dc.modalPanel, "max-h-[92vh] w-full max-w-5xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200")} onClick={(e) => e.stopPropagation()} role="dialog">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/60 p-6 sm:p-8 shrink-0">
          <div className="flex items-center gap-4">
            <div className={dc.iconBox}>
              <LineChartIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className={dc.modalTitle}>{ticker?.name ?? "Asset Insights"}</h2>
              <p className={cn(dc.modalSub, "mt-1")}>
                {ticker?.tickerName} {ticker?.currency ? `· ${ticker.currency}` : ""} {prices.length > 0 ? `· ${prices.length} days of history` : ""}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-border/60 px-6 sm:px-8 flex gap-6 shrink-0">
          {[
            { id: "price", label: "Price & Technicals", icon: Activity },
            { id: "volume", label: "Trading Volume", icon: BarChart2 },
            { id: "valuation", label: "Valuation Trends", icon: Scale },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "price" | "volume" | "valuation")}
              className={cn(
                "py-4 flex items-center gap-2 text-sm font-black border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-violet-500 text-violet-600 dark:text-violet-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex h-[360px] flex-col items-center justify-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-violet-600 dark:text-violet-400" />
              <p className="text-sm font-bold text-muted-foreground">Loading asset data…</p>
            </div>
          ) : prices.length === 0 ? (
            <div className={cn(dc.emptyWrap, "py-16")}>
              <p className="font-medium text-muted-foreground">No daily data found for this asset yet.</p>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300 fill-mode-both">
              
              {/* TAB 1: PRICE & TECHNICALS */}
              {activeTab === "price" && (
                <>
                  <div className="h-[360px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 12, right: 16, left: 8, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: chartTheme.tick, fontSize: 11 }} dy={8} minTickGap={24} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: chartTheme.tick, fontSize: 11 }} tickFormatter={(v) => fmtINR(Number(v))} width={80} />
                        <Tooltip
                          cursor={{ stroke: chartTheme.line, strokeWidth: 1, strokeDasharray: "4 4" }}
                          contentStyle={chartTheme.tooltip}
                          labelStyle={{ color: chartTheme.tooltip.color, fontWeight: 700 }}
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          formatter={(value: any, name: any) => {
                            if (name === "priceINR") return [fmtINR(Number(value || 0)), "Price (INR)"];
                            if (name === "ma50INR") return [fmtINR(Number(value || 0)), "50-day MA"];
                            if (name === "ma200INR") return [fmtINR(Number(value || 0)), "200-day MA"];
                            return [Number(value || 0).toFixed(2), ticker?.currency ?? "Price"];
                          }}
                        />
                        <Line type="monotone" dataKey="priceINR" name="priceINR" stroke={chartTheme.line} strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: chartTheme.line, stroke: "#fff", strokeWidth: 2 }} />
                        {chartData.some(d => d.ma50INR) && <Line type="monotone" dataKey="ma50INR" name="ma50INR" stroke={chartTheme.ma50} strokeWidth={1.5} strokeDasharray="6 3" dot={false} activeDot={false} />}
                        {chartData.some(d => d.ma200INR) && <Line type="monotone" dataKey="ma200INR" name="ma200INR" stroke={chartTheme.ma200} strokeWidth={1.5} strokeDasharray="4 4" dot={false} activeDot={false} />}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  {latest && (
                    <div className="space-y-6 pt-2">
                      <div className="flex items-center gap-3">
                        <div className="h-6 w-1 rounded-full bg-violet-600 dark:bg-violet-500" />
                        <h3 className="text-base font-black text-foreground">Technical Insights</h3>
                      </div>
                      
                      {wkHigh != null && wkLow != null && wkRangePercent != null && (
                        <div className="rounded-2xl border border-border/50 bg-muted/20 dark:bg-muted/10 px-5 py-4">
                          <div className="flex justify-between text-[11px] font-bold text-muted-foreground mb-2">
                            <span>52W Low · {fmtINR(wkLow * (latest.exchangeRate || 1))}</span>
                            <span className="text-foreground font-black">Current · {fmtINR(curPrice)}</span>
                            <span>52W High · {fmtINR(wkHigh * (latest.exchangeRate || 1))}</span>
                          </div>
                          <div className="relative h-2.5 rounded-full bg-muted dark:bg-muted/40 overflow-hidden">
                            <div className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" style={{ width: `${Math.max(2, Math.min(100, wkRangePercent))}%` }} />
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-2 text-center font-medium">
                            Price is in the <strong>{wkRangePercent.toFixed(0)}th</strong> percentile of its 52-week range
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {latest.fiftyDayAverage != null && (
                          <MetricPill
                            label="50-Day Avg"
                            value={fmtINR(latest.fiftyDayAverage * (latest.exchangeRate || 1))}
                            sub={curPrice > latest.fiftyDayAverage * (latest.exchangeRate || 1) ? "Price above — bullish short-term" : "Price below — bearish short-term"}
                            accent={curPrice > latest.fiftyDayAverage * (latest.exchangeRate || 1) ? "green" : "red"}
                          />
                        )}
                        {latest.twoHundredDayAverage != null && (
                          <MetricPill
                            label="200-Day Avg"
                            value={fmtINR(latest.twoHundredDayAverage * (latest.exchangeRate || 1))}
                            sub={curPrice > latest.twoHundredDayAverage * (latest.exchangeRate || 1) ? "Price above — long-term uptrend" : "Price below — long-term downtrend"}
                            accent={curPrice > latest.twoHundredDayAverage * (latest.exchangeRate || 1) ? "green" : "red"}
                          />
                        )}
                        {latest.fiftyDayAverage != null && latest.twoHundredDayAverage != null && (
                          <MetricPill
                            label="MA Crossover"
                            value={latest.fiftyDayAverage > latest.twoHundredDayAverage ? "Golden Cross" : "Death Cross"}
                            sub={latest.fiftyDayAverage > latest.twoHundredDayAverage ? "50-day above 200-day" : "50-day below 200-day"}
                            accent={latest.fiftyDayAverage > latest.twoHundredDayAverage ? "green" : "red"}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* TAB 2: TRADING VOLUME */}
              {activeTab === "volume" && (
                <>
                  {volumeData.length === 0 ? (
                    <div className={cn(dc.emptyWrap, "py-16")}>
                      <p className="font-medium text-muted-foreground">Volume data is not available for this asset.</p>
                    </div>
                  ) : (
                    <>
                      <div className="h-[360px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={volumeData} margin={{ top: 12, right: 16, left: 8, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: chartTheme.tick, fontSize: 11 }} dy={8} minTickGap={24} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: chartTheme.tick, fontSize: 11 }} tickFormatter={(v) => fmtVol(Number(v))} width={60} />
                            <Tooltip
                              cursor={{ fill: chartTheme.cursor }}
                              contentStyle={chartTheme.tooltip}
                              labelStyle={{ color: chartTheme.tooltip.color, fontWeight: 700 }}
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              formatter={(value: any, name: any) => {
                                if (name === "regularMarketVolume") return [fmtVol(Number(value || 0)), "Volume"];
                                return [Number(value || 0).toLocaleString(), name];
                              }}
                            />
                            <Bar dataKey="regularMarketVolume" name="regularMarketVolume" fill={chartTheme.volBar} radius={[4, 4, 0, 0]} maxBarSize={40} />
                            {latest?.averageDailyVolume3Month && (
                              <ReferenceLine y={latest.averageDailyVolume3Month} stroke={chartTheme.ma200} strokeDasharray="3 3" label={{ position: 'top', value: '3M Avg', fill: chartTheme.ma200, fontSize: 10, fontWeight: 'bold' }} />
                            )}
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      {latest && latest.regularMarketVolume != null && (
                        <div className="space-y-6 pt-2">
                          <div className="flex items-center gap-3">
                            <div className="h-6 w-1 rounded-full bg-violet-600 dark:bg-violet-500" />
                            <h3 className="text-base font-black text-foreground">Liquidity & Activity Insights</h3>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <MetricPill
                              label="Today's Volume"
                              value={fmtVol(latest.regularMarketVolume)}
                              sub="Shares traded today"
                              accent="blue"
                            />
                            {latest.averageDailyVolume3Month != null && (
                              <MetricPill
                                label="3-Month Average"
                                value={fmtVol(latest.averageDailyVolume3Month)}
                                sub="Normal daily liquidity"
                              />
                            )}
                            {latest.averageDailyVolume3Month != null && latest.averageDailyVolume3Month > 0 && (
                              <MetricPill
                                label="Volume Anomaly"
                                value={`${(latest.regularMarketVolume / latest.averageDailyVolume3Month).toFixed(2)}×`}
                                sub="Ratio vs 3-month average"
                                accent={latest.regularMarketVolume > latest.averageDailyVolume3Month * 2 ? "amber" : "default"}
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {/* TAB 3: VALUATION TRENDS */}
              {activeTab === "valuation" && (
                <>
                  {valuationData.length === 0 ? (
                    <div className={cn(dc.emptyWrap, "py-16")}>
                      <p className="font-medium text-muted-foreground">Historical valuation metrics not yet populated. Check back tomorrow.</p>
                    </div>
                  ) : (
                    <>
                      <div className="h-[360px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={valuationData} margin={{ top: 12, right: 16, left: 8, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: chartTheme.tick, fontSize: 11 }} dy={8} minTickGap={24} />
                            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: chartTheme.tick, fontSize: 11 }} width={40} />
                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: chartTheme.tick, fontSize: 11 }} width={40} />
                            <Tooltip
                              cursor={{ stroke: chartTheme.line, strokeWidth: 1, strokeDasharray: "4 4" }}
                              contentStyle={chartTheme.tooltip}
                              labelStyle={{ color: chartTheme.tooltip.color, fontWeight: 700 }}
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              formatter={(value: any, name: any) => {
                                if (name === "trailingPE") return [`${Number(value || 0).toFixed(1)}x`, "Trailing P/E"];
                                if (name === "priceToBook") return [`${Number(value || 0).toFixed(2)}x`, "Price/Book"];
                                return [Number(value || 0).toFixed(2), name];
                              }}
                            />
                            {valuationData.some(d => d.trailingPE) && <Line yAxisId="left" type="monotone" dataKey="trailingPE" name="trailingPE" stroke={chartTheme.peLine} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />}
                            {valuationData.some(d => d.priceToBook) && <Line yAxisId="right" type="monotone" dataKey="priceToBook" name="priceToBook" stroke={chartTheme.pbLine} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      {latest && (
                        <div className="space-y-6 pt-2">
                          <div className="flex items-center gap-3">
                            <div className="h-6 w-1 rounded-full bg-violet-600 dark:bg-violet-500" />
                            <h3 className="text-base font-black text-foreground">Fundamental Valuation</h3>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {latest.trailingPE != null && (
                              <MetricPill
                                label="Trailing P/E"
                                value={`${latest.trailingPE.toFixed(1)}×`}
                                sub={latest.trailingPE > 40 ? "Trading at premium" : latest.trailingPE < 12 ? "Potentially undervalued" : "Fair value range"}
                                accent={latest.trailingPE > 40 ? "amber" : latest.trailingPE < 12 ? "green" : "default"}
                              />
                            )}
                            {latest.forwardPE != null && (
                              <MetricPill
                                label="Forward P/E"
                                value={`${latest.forwardPE.toFixed(1)}×`}
                                sub="Based on analyst estimates"
                                accent={latest.forwardPE < (latest.trailingPE ?? 99) ? "green" : "default"}
                              />
                            )}
                            {latest.priceToBook != null && (
                              <MetricPill
                                label="Price / Book"
                                value={`${latest.priceToBook.toFixed(2)}×`}
                                sub={latest.priceToBook < 1 ? "Below book value" : latest.priceToBook > 6 ? "High premium" : "Relative to net assets"}
                                accent={latest.priceToBook < 1 ? "green" : latest.priceToBook > 6 ? "amber" : "default"}
                              />
                            )}
                            {latest.epsTrailingTwelveMonths != null && (
                              <MetricPill
                                label="EPS (TTM)"
                                value={fmtINR(latest.epsTrailingTwelveMonths * (latest.exchangeRate || 1))}
                                sub="Trailing 12-month earnings"
                              />
                            )}
                            {latest.marketCap != null && latest.marketCap > 0 && (
                              <MetricPill
                                label="Market Cap"
                                value={fmtCrore(latest.marketCap * (latest.exchangeRate || 1))}
                                sub={latest.marketCap > 5e12 ? "Large-cap" : latest.marketCap > 5e11 ? "Mid-cap" : "Small-cap"}
                              />
                            )}
                            {latest.dividendYield != null && latest.dividendYield > 0 && (
                              <MetricPill
                                label="Dividend Yield"
                                value={`${(latest.dividendYield * 100).toFixed(2)}%`}
                                sub={latest.dividendYield * 100 >= 3 ? "High income yield" : "Standard yield"}
                                accent={latest.dividendYield * 100 >= 3 ? "green" : "default"}
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
