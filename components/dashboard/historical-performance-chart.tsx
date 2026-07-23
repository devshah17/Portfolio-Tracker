"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Loader2, TrendingUp, AlertCircle } from "lucide-react";

type HistoricalData = {
  date: string;
  portfolioValue: number;
  portfolioPct?: number;
  "^NSEI"?: number;
  "^NSEI_pct"?: number;
  "^GSPC"?: number;
  "^GSPC_pct"?: number;
  "BTC-USD"?: number;
  "BTC-USD_pct"?: number;
};

type Props = {
  userId: string;
  className?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function HistoricalPerformanceChart({ userId, className }: Props) {
  const { resolvedTheme } = useTheme();
  const [data, setData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(30);

  // Toggles for benchmarks
  const [showNifty, setShowNifty] = useState(false);
  const [showSp500, setShowSp500] = useState(false);
  const [showBtc, setShowBtc] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/dashboard/historical/${userId}?days=${days}`);
      if (!res.ok) throw new Error("API failure");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        throw new Error(json.message || "Failed to load data");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userId, days]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const hasBenchmarks = showNifty || showSp500 || showBtc;

  const tooltipStyle = useMemo(
    () => ({
      borderRadius: "16px",
      border: "1px solid",
      borderColor: resolvedTheme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
      backgroundColor: resolvedTheme === "dark" ? "rgba(15,23,42,0.85)" : "rgba(255,255,255,0.95)",
      backdropFilter: "blur(12px)",
      color: resolvedTheme === "dark" ? "#e2e8f0" : "#1e293b",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      padding: "16px",
    }),
    [resolvedTheme]
  );

  const formatXAxis = (tickItem: string) => {
    const d = new Date(tickItem);
    return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={tooltipStyle}>
          <p className="font-semibold mb-2 border-b border-border/50 pb-2">{formatXAxis(label)}</p>
          <div className="flex flex-col gap-1.5">
            {payload.map((entry: any, index: number) => {
              // Extract the name or key to determine how to format
              const key = entry.dataKey;
              let name = "Portfolio";
              let valStr = "";
              
              if (key === "portfolioValue") {
                valStr = "₹" + entry.value.toLocaleString("en-IN", { maximumFractionDigits: 0 });
              } else if (key === "totalGains") {
                name = "Total Gains";
                valStr = "₹" + entry.value.toLocaleString("en-IN", { maximumFractionDigits: 0 });
                if (entry.value > 0) valStr = "+" + valStr;
              } else if (key === "portfolioPct") {
                valStr = entry.value.toFixed(2) + "%";
              } else if (key === "^NSEI_pct") {
                name = "NIFTY 50";
                valStr = entry.value.toFixed(2) + "%";
              } else if (key === "^GSPC_pct") {
                name = "S&P 500";
                valStr = entry.value.toFixed(2) + "%";
              } else if (key === "BTC-USD_pct") {
                name = "Bitcoin";
                valStr = entry.value.toFixed(2) + "%";
              }

              return (
                <div key={index} className="flex justify-between gap-6 text-sm">
                  <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    {name}
                  </span>
                  <span className="font-medium text-foreground">{valStr}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  const chartColor = resolvedTheme === "dark" ? "#818cf8" : "#4f46e5";
  const gainsColor = "#10b981"; // green for gains
  const niftyColor = "#f59e0b"; // amber
  const spColor = "#0ea5e9"; // sky blue
  const btcColor = "#f97316"; // orange

  return (
    <div className={cn("glass-panel p-6 flex flex-col", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Simulated Historical Growth
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            How your current portfolio would have performed
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/40 p-1 rounded-lg border border-slate-200 dark:border-slate-700/50">
            {[30, 90, 180, 365].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                  days === d
                    ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                {d === 365 ? "1Y" : d === 180 ? "6M" : d === 90 ? "3M" : "1M"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Compare vs:</span>
        <button 
          onClick={() => setShowNifty(!showNifty)}
          className={cn("px-3 py-1 text-xs font-semibold rounded-full border transition-all", showNifty ? "bg-amber-100 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 shadow-sm" : "bg-transparent border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600")}
        >
          NIFTY 50
        </button>
        <button 
          onClick={() => setShowSp500(!showSp500)}
          className={cn("px-3 py-1 text-xs font-semibold rounded-full border transition-all", showSp500 ? "bg-emerald-100 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 shadow-sm" : "bg-transparent border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600")}
        >
          S&P 500
        </button>
        <button 
          onClick={() => setShowBtc(!showBtc)}
          className={cn("px-3 py-1 text-xs font-semibold rounded-full border transition-all", showBtc ? "bg-orange-100 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30 text-orange-700 dark:text-orange-400 shadow-sm" : "bg-transparent border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600")}
        >
          Bitcoin
        </button>
      </div>

      <div className="h-[350px] w-full">
        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-indigo-500" />
            <p>Crunching historical data...</p>
          </div>
        ) : error ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-rose-400">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p className="text-sm">{error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
            No historical data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={resolvedTheme === "dark" ? "#334155" : "#e2e8f0"} opacity={0.5} />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: resolvedTheme === "dark" ? "#94a3b8" : "#64748b", fontSize: 12 }}
                tickFormatter={formatXAxis}
                minTickGap={30}
              />
              <YAxis 
                yAxisId="value"
                orientation="left"
                axisLine={false}
                tickLine={false}
                tick={{ fill: resolvedTheme === "dark" ? "#94a3b8" : "#64748b", fontSize: 12 }}
                tickFormatter={(val) => "₹" + (val / 1000).toFixed(0) + "k"}
                width={80}
                hide={hasBenchmarks} // hide absolute values if comparing percentages
              />
              {hasBenchmarks && (
                <YAxis 
                  yAxisId="percent"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: resolvedTheme === "dark" ? "#94a3b8" : "#64748b", fontSize: 12 }}
                  tickFormatter={(val) => val.toFixed(0) + "%"}
                  width={50}
                />
              )}
              <Tooltip content={<CustomTooltip />} />
              
              <Area 
                yAxisId={hasBenchmarks ? "percent" : "value"}
                type="monotone" 
                dataKey={hasBenchmarks ? "portfolioPct" : "portfolioValue"} 
                stroke={chartColor} 
                strokeWidth={3}
                fillOpacity={hasBenchmarks ? 0 : 1} 
                fill={hasBenchmarks ? "none" : "url(#colorValue)"} 
                activeDot={{ r: 6, strokeWidth: 0, fill: chartColor }}
                name="Portfolio"
              />

              {!hasBenchmarks && (
                <Area 
                  yAxisId="value"
                  type="monotone" 
                  dataKey="totalGains" 
                  stroke={gainsColor} 
                  strokeWidth={2}
                  fillOpacity={0}
                  fill="none" 
                  activeDot={{ r: 4, fill: gainsColor }}
                  name="Total Gains"
                />
              )}

              {showNifty && (
                <Area 
                  yAxisId="percent"
                  type="monotone" 
                  dataKey="^NSEI_pct" 
                  stroke={niftyColor} 
                  strokeWidth={2}
                  fill="none" 
                  dot={false}
                  activeDot={{ r: 4, fill: niftyColor }}
                  name="NIFTY 50"
                />
              )}
              {showSp500 && (
                <Area 
                  yAxisId="percent"
                  type="monotone" 
                  dataKey="^GSPC_pct" 
                  stroke={spColor} 
                  strokeWidth={2}
                  fill="none" 
                  dot={false}
                  activeDot={{ r: 4, fill: spColor }}
                  name="S&P 500"
                />
              )}
              {showBtc && (
                <Area 
                  yAxisId="percent"
                  type="monotone" 
                  dataKey="BTC-USD_pct" 
                  stroke={btcColor} 
                  strokeWidth={2}
                  fill="none" 
                  dot={false}
                  activeDot={{ r: 4, fill: btcColor }}
                  name="Bitcoin"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
