"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, TrendingUp, TrendingDown, PackagePlus, PackageMinus, Activity } from "lucide-react";
import { toast } from "sonner";
import { dc } from "@/lib/dashboard-theme";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

interface Holding {
  ticker: string;
  name: string;
  industry: string;
  quantity: number;
  amount: number;
  weight: number;
}

interface FundReport {
  _id: string;
  reportMonth: string;
  data: Holding[];
}

export default function FundRadarAnalysisPage() {
  const { id } = useParams();
  const [reports, setReports] = useState<FundReport[]>([]);
  const [fundName, setFundName] = useState<string>("Loading...");
  const [loading, setLoading] = useState(true);
  
  const [currentMonthIdx, setCurrentMonthIdx] = useState<number>(0);
  const [prevMonthIdx, setPrevMonthIdx] = useState<number>(1);

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/fund-radar/${id}/reports`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
      });
      const data = await res.json();
      if (data.success) {
        setReports(data.data);
        if (data.fundName) {
          setFundName(data.fundName);
        }
      }
    } catch (e) {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Compute analysis
  const analysis = useMemo(() => {
    if (reports.length < 2) return null;
    const current = reports[currentMonthIdx];
    const prev = reports[prevMonthIdx];
    if (!current || !prev) return null;

    const currentMap = new Map(current.data.map(h => [h.ticker, h]));
    const prevMap = new Map(prev.data.map(h => [h.ticker, h]));

    const newBuys: Holding[] = [];
    const increased: (Holding & { qtyDiff: number, pctDiff: number })[] = [];
    const decreased: (Holding & { qtyDiff: number, pctDiff: number })[] = [];
    const exits: Holding[] = [];

    current.data.forEach(cH => {
      const pH = prevMap.get(cH.ticker);
      if (!pH) {
        newBuys.push(cH);
      } else {
        const qtyDiff = cH.quantity - pH.quantity;
        const pctDiff = cH.weight - pH.weight;
        const qtyPctChange = pH.quantity ? (qtyDiff / pH.quantity) * 100 : 0;
        
        if (qtyDiff > 0 || pctDiff > 0.5) { // Meaningful increase
          increased.push({ ...cH, qtyDiff, pctDiff, qtyPctChange } as any);
        } else if (qtyDiff < 0 || pctDiff < -0.5) {
          decreased.push({ ...cH, qtyDiff, pctDiff, qtyPctChange } as any);
        }
      }
    });

    prev.data.forEach(pH => {
      if (!currentMap.has(pH.ticker)) {
        exits.push(pH);
      }
    });

    return { current, prev, newBuys, increased, decreased, exits };
  }, [reports, currentMonthIdx, prevMonthIdx]);

  if (loading) {
    return (
      <div className="flex justify-center p-32">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="dashboard-subpage min-h-full animate-in fade-in space-y-8 px-4 py-8 duration-500 sm:px-10 sm:py-10">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/fund-radar" className="p-2 bg-muted hover:bg-muted/80 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Link>
        <div>
          <h1 className={cn(dc.title, "text-2xl sm:text-3xl")}>{fundName}</h1>
          <p className={cn(dc.subtitle, "mt-1")}>Compare holdings to spot institutional moves.</p>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-3xl">
          <h3 className="text-xl font-bold text-foreground">No reports found</h3>
          <p className="text-muted-foreground mt-2">Upload monthly reports in the main radar dashboard to see analysis here.</p>
        </div>
      ) : reports.length === 1 ? (
        <div className="text-center py-20 bg-card border border-border rounded-3xl">
          <Activity className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground">Only one month uploaded</h3>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">Upload at least one more month to compare and generate buying/selling insights.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4 bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-muted-foreground">Base Month:</span>
              <select value={prevMonthIdx} onChange={e => setPrevMonthIdx(Number(e.target.value))} className="bg-background border border-border rounded-xl px-4 py-2 text-sm font-bold text-foreground outline-none">
                {reports.map((r, i) => <option key={r._id} value={i}>{r.reportMonth}</option>)}
              </select>
            </div>
            <span className="text-sm font-bold text-muted-foreground">vs New Month:</span>
            <select value={currentMonthIdx} onChange={e => setCurrentMonthIdx(Number(e.target.value))} className="bg-background border border-border rounded-xl px-4 py-2 text-sm font-bold text-foreground outline-none">
              {reports.map((r, i) => <option key={r._id} value={i}>{r.reportMonth}</option>)}
            </select>
          </div>

          {analysis && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* New Buys */}
              <div className="rounded-3xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-6">
                <h3 className="text-emerald-700 dark:text-emerald-400 font-black uppercase tracking-wider text-sm flex items-center gap-2 mb-4">
                  <PackagePlus className="w-4 h-4" /> New Additions
                </h3>
                {analysis.newBuys.length === 0 ? <p className="text-sm text-emerald-600/50 dark:text-emerald-400/50 font-medium">No new stocks added.</p> : (
                  <ul className="space-y-3">
                    {analysis.newBuys.map(h => (
                      <li key={h.ticker} className="flex justify-between items-center bg-white dark:bg-emerald-900/40 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/50 shadow-sm">
                        <div>
                          <div className="font-bold text-foreground text-sm">{h.name}</div>
                          <div className="text-xs text-muted-foreground">{h.industry}</div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <div className="text-[10px] text-muted-foreground">Units: {new Intl.NumberFormat().format(h.quantity)}</div>
                          <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full inline-block">{h.weight.toFixed(2)}% of AUM</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Complete Exits */}
              <div className="rounded-3xl border border-rose-500/30 bg-rose-50 dark:bg-rose-950/20 p-6">
                <h3 className="text-rose-700 dark:text-rose-400 font-black uppercase tracking-wider text-sm flex items-center gap-2 mb-4">
                  <PackageMinus className="w-4 h-4" /> Complete Exits
                </h3>
                {analysis.exits.length === 0 ? <p className="text-sm text-rose-600/50 dark:text-rose-400/50 font-medium">No complete exits.</p> : (
                  <ul className="space-y-3">
                    {analysis.exits.map(h => (
                      <li key={h.ticker} className="flex justify-between items-center bg-white dark:bg-rose-900/40 p-3 rounded-xl border border-rose-100 dark:border-rose-800/50 shadow-sm">
                        <div>
                          <div className="font-bold text-foreground text-sm line-through decoration-rose-500/40">{h.name}</div>
                          <div className="text-xs text-muted-foreground">{h.industry}</div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <div className="text-[10px] text-muted-foreground">Units were: {new Intl.NumberFormat().format(h.quantity)}</div>
                          <div className="text-xs font-black text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/60 px-2 py-0.5 rounded-full inline-block">Sold Out ({h.weight.toFixed(2)}% AUM)</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Increased */}
              <div className="rounded-3xl border border-sky-500/30 bg-sky-50 dark:bg-sky-950/20 p-6">
                <h3 className="text-sky-700 dark:text-sky-400 font-black uppercase tracking-wider text-sm flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4" /> Increased Stake
                </h3>
                {analysis.increased.length === 0 ? <p className="text-sm text-sky-600/50 dark:text-sky-400/50 font-medium">No significant stake increases.</p> : (
                  <ul className="space-y-3">
                    {analysis.increased.map((h: any) => (
                      <li key={h.ticker} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white dark:bg-sky-900/40 p-3 rounded-xl border border-sky-100 dark:border-sky-800/50 shadow-sm gap-3">
                        <div className="truncate pr-4 flex-1">
                          <div className="font-bold text-foreground text-sm truncate">{h.name}</div>
                          <div className="text-[11px] text-muted-foreground mt-1 flex gap-3">
                            <span><span className="font-semibold text-foreground">{h.weight.toFixed(2)}%</span> AUM (was {(h.weight - h.pctDiff).toFixed(2)}%)</span>
                            <span><span className="font-semibold text-foreground">{new Intl.NumberFormat().format(h.quantity)}</span> units (was {new Intl.NumberFormat().format(h.quantity - h.qtyDiff)})</span>
                          </div>
                        </div>
                        <div className="flex flex-row flex-wrap sm:flex-nowrap gap-2 shrink-0">
                          <div className="text-xs font-black text-sky-600 dark:text-sky-400 flex items-center gap-1 bg-sky-100 dark:bg-sky-900/60 px-2 py-1 rounded-md">
                            {new Intl.NumberFormat().format(h.qtyDiff)} units added ({h.qtyPctChange > 0 ? '+' : ''}{h.qtyPctChange.toFixed(2)}%)
                          </div>
                          <div className="text-xs font-black text-sky-600 dark:text-sky-400 flex items-center gap-1 bg-sky-100 dark:bg-sky-900/60 px-2 py-1 rounded-md">
                            +{h.pctDiff.toFixed(2)}% AUM <TrendingUp className="w-3 h-3" />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Decreased */}
              <div className="rounded-3xl border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-6">
                <h3 className="text-amber-700 dark:text-amber-400 font-black uppercase tracking-wider text-sm flex items-center gap-2 mb-4">
                  <TrendingDown className="w-4 h-4" /> Decreased Stake
                </h3>
                {analysis.decreased.length === 0 ? <p className="text-sm text-amber-600/50 dark:text-amber-400/50 font-medium">No significant stake decreases.</p> : (
                  <ul className="space-y-3">
                    {analysis.decreased.map((h: any) => (
                      <li key={h.ticker} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white dark:bg-amber-900/40 p-3 rounded-xl border border-amber-100 dark:border-amber-800/50 shadow-sm gap-3">
                        <div className="truncate pr-4 flex-1">
                          <div className="font-bold text-foreground text-sm truncate">{h.name}</div>
                          <div className="text-[11px] text-muted-foreground mt-1 flex gap-3">
                            <span><span className="font-semibold text-foreground">{h.weight.toFixed(2)}%</span> AUM (was {(h.weight - h.pctDiff).toFixed(2)}%)</span>
                            <span><span className="font-semibold text-foreground">{new Intl.NumberFormat().format(h.quantity)}</span> units (was {new Intl.NumberFormat().format(h.quantity - h.qtyDiff)})</span>
                          </div>
                        </div>
                        <div className="flex flex-row flex-wrap sm:flex-nowrap gap-2 shrink-0">
                          <div className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-100 dark:bg-amber-900/60 px-2 py-1 rounded-md">
                            {new Intl.NumberFormat().format(Math.abs(h.qtyDiff))} units sold ({h.qtyPctChange.toFixed(2)}%)
                          </div>
                          <div className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-100 dark:bg-amber-900/60 px-2 py-1 rounded-md">
                            {h.pctDiff.toFixed(2)}% AUM <TrendingDown className="w-3 h-3" />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
