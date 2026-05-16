"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { useTheme } from "next-themes";
import { RootState } from "@/lib/store";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PieChart as PieChartIcon,
  Layers,
  ArrowRight,
  Briefcase,
  Globe,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

const CHART_COLORS_LIGHT = ["#7c3aed", "#6366f1", "#8b5cf6", "#4f46e5", "#059669"];
const CHART_COLORS_DARK = ["#a78bfa", "#818cf8", "#c4b5fd", "#6366f1", "#34d399"];

export default function DashboardOverviewPage() {
  const user = useSelector((s: RootState) => s.auth.user);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getUserId = useCallback(() => {
    if (user?.id || user?._id) return user?.id || user?._id;

    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          return parsed.id || parsed._id;
        } catch {
          return null;
        }
      }
    }
    return null;
  }, [user]);

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = useCallback(async () => {
    const userId = getUserId();
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/dashboard/stats/${userId}`);
      if (!res.ok) throw new Error("API failure");
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (e) {
      console.error("Dashboard stats load error", e);
    } finally {
      setLoading(false);
    }
  }, [getUserId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDashboardStats();
    }, 100);
    return () => clearTimeout(timer);
  }, [fetchDashboardStats]);

  const formatINR = (v: number) =>
    "₹" + v.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const chartColors = resolvedTheme === "dark" ? CHART_COLORS_DARK : CHART_COLORS_LIGHT;

  const tooltipStyle = useMemo(
    () => ({
      borderRadius: "16px",
      border: "1px solid",
      borderColor: resolvedTheme === "dark" ? "oklch(0.5 0.1 285 / 30%)" : "rgba(0,0,0,0.06)",
      boxShadow:
        resolvedTheme === "dark"
          ? "0 20px 48px -12px oklch(0.08 0.03 285 / 90%)"
          : "0 20px 40px -12px rgba(0,0,0,0.15)",
      backgroundColor: resolvedTheme === "dark" ? "oklch(0.17 0.042 288)" : "#ffffff",
      color: resolvedTheme === "dark" ? "oklch(0.94 0.015 285)" : "#18181b",
    }),
    [resolvedTheme]
  );

  if (!mounted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-violet-600" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-muted border-t-violet-600" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-violet-500" />
          </div>
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">
          Curating your financial story...
        </p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-card shadow-lg">
          <Wallet className="h-9 w-9 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-black text-foreground">Vault access restricted</h3>
          <p className="mt-1 font-medium text-muted-foreground">
            Sign in to view your wealth intelligence dashboard.
          </p>
        </div>
        <Link
          href="/auth/signin"
          className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-transform hover:scale-[1.02]"
        >
          Sign in to access
        </Link>
      </div>
    );
  }

  const { summary, allocation, marketAllocation, groups, movers } = stats;

  return (
    <div className="animate-in fade-in min-h-full px-4 py-8 duration-700 sm:px-10 sm:py-10 lg:px-12">
      {/* Header */}
      <div className="mx-auto mb-12 max-w-[1400px]">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-600 dark:text-[oklch(0.78_0.16_285)]">
                Wealth intelligence
              </span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
              Master{" "}
              <span className="bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
                Dashboard
              </span>
            </h1>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              Real-time overview of capital deployed, net worth, and portfolio performance.
            </p>
          </div>
          <Link
            href="/dashboard/portfolios"
            className="group flex w-fit items-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-violet-500/20 transition-all hover:scale-[1.02] hover:shadow-violet-500/30"
          >
            Explore portfolios
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] space-y-10">
        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="dashboard-card group relative overflow-hidden rounded-[2rem] border border-border/60 bg-card/80 p-8 shadow-lg backdrop-blur-xl transition-shadow hover:shadow-xl">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Capital deployed
            </p>
            <h3 className="text-3xl font-black text-foreground sm:text-4xl">
              {formatINR(summary.totalInvestment)}
            </h3>
            <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl transition-opacity group-hover:opacity-100" />
          </div>

          <div className="group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-700 p-8 shadow-xl shadow-violet-500/25 dark:from-[oklch(0.48_0.2_285)] dark:via-[oklch(0.42_0.18_280)] dark:to-[oklch(0.38_0.16_275)] dark:shadow-[0_20px_50px_-12px_oklch(0.35_0.18_285/50%)]">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-violet-100/70">
              Total net worth
            </p>
            <h3 className="text-3xl font-black text-white sm:text-4xl">
              {formatINR(summary.currentValue)}
            </h3>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold text-violet-50 backdrop-blur-md">
              <TrendingUp className="h-4 w-4" /> Real-time value
            </div>
            <div className="absolute -left-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-[60px]" />
          </div>

          <div
            className={cn(
              "group relative overflow-hidden rounded-[2rem] border p-8 shadow-lg backdrop-blur-xl transition-shadow hover:shadow-xl",
              summary.totalPL >= 0
                ? "border-emerald-500/20 bg-emerald-500/5 dark:border-[oklch(0.55_0.14_155/35%)] dark:bg-[oklch(0.2_0.06_155/40%)]"
                : "border-rose-500/20 bg-rose-500/5 dark:border-[oklch(0.55_0.16_25/35%)] dark:bg-[oklch(0.2_0.07_25/40%)]"
            )}
          >
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Portfolio yield
            </p>
            <h3
              className={cn(
                "mb-4 text-3xl font-black sm:text-4xl",
                summary.totalPL >= 0
                  ? "text-emerald-600 dark:text-[oklch(0.78_0.16_155)]"
                  : "text-rose-600 dark:text-[oklch(0.75_0.18_25)]"
              )}
            >
              {summary.totalPL >= 0 ? "+" : "-"}
              {formatINR(Math.abs(summary.totalPL))}
            </h3>
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black text-white shadow-lg",
                summary.totalPL >= 0
                  ? "bg-emerald-500 shadow-emerald-500/25"
                  : "bg-rose-500 shadow-rose-500/25"
              )}
            >
              {summary.totalPL >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {Math.abs(summary.plPct).toFixed(2)}% growth
            </div>
          </div>
        </div>

        {/* Charts + vaults */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-8">
            {/* Asset composition */}
            <section className="dashboard-card rounded-[2rem] border border-border/60 bg-card/70 p-8 shadow-lg backdrop-blur-xl">
              <h3 className="mb-8 flex items-center gap-3 text-lg font-black text-foreground">
                <PieChartIcon className="h-6 w-6 text-violet-600 dark:text-[oklch(0.78_0.16_285)]" />
                Asset composition
              </h3>
              <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={allocation}
                        cx="50%"
                        cy="50%"
                        innerRadius={90}
                        outerRadius={125}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {allocation.map((_: unknown, index: number) => (
                          <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(val) => formatINR(Number(val))}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {allocation.map((item: { name: string; percent: number }, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-2xl border border-border/50 bg-muted/30 px-4 py-3.5 dark:border-[oklch(0.45_0.08_285/25%)] dark:bg-[oklch(0.18_0.04_288/60%)]"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: chartColors[idx % chartColors.length] }}
                        />
                        <span className="font-bold text-foreground">{item.name}</span>
                      </div>
                      <span className="text-sm font-black text-muted-foreground">
                        {item.percent.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Market distribution */}
            <section className="dashboard-card rounded-[2rem] border border-border/60 bg-card/70 p-8 shadow-lg backdrop-blur-xl">
              <h3 className="mb-8 flex items-center gap-3 text-lg font-black text-foreground">
                <Globe className="h-6 w-6 text-violet-600 dark:text-[oklch(0.78_0.16_285)]" />
                Market distribution
              </h3>
              <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={marketAllocation}
                        cx="50%"
                        cy="50%"
                        innerRadius={90}
                        outerRadius={125}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {marketAllocation?.map((_: unknown, index: number) => (
                          <Cell
                            key={`mcell-${index}`}
                            fill={chartColors[(index + 2) % chartColors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(val) => formatINR(Number(val))}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {marketAllocation?.map((item: { name: string; percent: number }, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-2xl border border-border/50 bg-muted/30 px-4 py-3.5 dark:border-[oklch(0.45_0.08_285/25%)] dark:bg-[oklch(0.18_0.04_288/60%)]"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: chartColors[(idx + 2) % chartColors.length] }}
                        />
                        <span className="font-bold text-foreground">{item.name}</span>
                      </div>
                      <span className="text-sm font-black text-muted-foreground">
                        {item.percent.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Top movers */}
            <section className="dashboard-card rounded-[2rem] border border-border/60 bg-card/70 p-8 shadow-lg backdrop-blur-xl">
              <h3 className="mb-8 flex items-center gap-3 text-lg font-black text-foreground">
                <TrendingUp className="h-6 w-6 text-emerald-500 dark:text-[oklch(0.75_0.16_155)]" />
                Top growth & volatility
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {movers.map((mover: { name: string; perf: number }, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-2xl border border-border/50 bg-muted/20 p-5 transition-colors hover:bg-muted/40 dark:border-[oklch(0.45_0.08_285/20%)] dark:bg-[oklch(0.16_0.04_288/50%)] dark:hover:bg-[oklch(0.2_0.05_288/70%)]"
                  >
                    <div>
                      <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Asset
                      </p>
                      <h4 className="font-black text-foreground">{mover.name}</h4>
                    </div>
                    <div className="text-right">
                      <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Performance
                      </p>
                      <span
                        className={cn(
                          "flex items-center justify-end gap-1 text-sm font-black",
                          mover.perf >= 0
                            ? "text-emerald-600 dark:text-[oklch(0.78_0.16_155)]"
                            : "text-rose-600 dark:text-[oklch(0.75_0.18_25)]"
                        )}
                      >
                        {mover.perf >= 0 ? (
                          <TrendingUp className="h-3.5 w-3.5" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5" />
                        )}
                        {Math.abs(mover.perf).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Vaults sidebar */}
          <div className="space-y-6 lg:col-span-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="flex items-center gap-3 text-lg font-black text-foreground">
                <Layers className="h-6 w-6 text-violet-600 dark:text-[oklch(0.72_0.16_285)]" />
                My vaults
              </h3>
              <Link
                href="/dashboard/portfolios"
                className="text-[10px] font-black uppercase tracking-widest text-violet-600 hover:underline dark:text-[oklch(0.72_0.16_285)]"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {groups.map((group: { _id: string; name: string; itemCount: number }) => (
                <Link
                  key={group._id}
                  href="/dashboard/portfolios"
                  className="dashboard-card group block rounded-2xl border border-border/60 bg-card/80 p-6 shadow-md backdrop-blur-xl transition-all hover:scale-[1.01] hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/10 dark:hover:border-[oklch(0.55_0.14_285/40%)]"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 transition-colors group-hover:bg-violet-600">
                      <Briefcase className="h-6 w-6 text-violet-600 group-hover:text-white dark:text-[oklch(0.75_0.15_285)]" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-violet-500" />
                  </div>
                  <h4 className="text-lg font-black text-foreground">{group.name}</h4>
                  <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {group.itemCount} active positions
                  </p>
                </Link>
              ))}
              {groups.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center">
                  <p className="text-sm font-medium leading-relaxed text-muted-foreground">
                    No vaults found. Group your assets into portfolios to get started.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
