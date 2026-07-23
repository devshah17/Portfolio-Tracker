"use client";
import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Bot, Loader2, Zap, ShieldAlert, BarChart2, AlertTriangle, Lightbulb, Target, ChevronDown, ChevronUp } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
const PIE_COLORS = ["#8b5cf6","#06b6d4","#10b981","#f59e0b","#ef4444","#ec4899","#6366f1","#84cc16","#f97316","#14b8a6"];

const fmt = (n: number) => n?.toLocaleString("en-IN", { maximumFractionDigits: 0 }) ?? "—";
const fmtPct = (n: number) => (n >= 0 ? "+" : "") + n?.toFixed(2) + "%";
const actionColor: Record<string, string> = {
  BUY: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  HOLD: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  SELL: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  REDUCE: "bg-orange-500/15 text-orange-400 border-orange-500/30",
};
const stanceColor: Record<string, string> = { Overweight: "text-rose-400", Underweight: "text-amber-400", Maintain: "text-emerald-400" };
const riskColor: Record<string, string> = { Low: "text-emerald-400", Medium: "text-amber-400", High: "text-rose-400", "Very High": "text-red-500" };
const divColor: Record<string, string> = { Excellent: "text-emerald-400", Good: "text-cyan-400", Fair: "text-amber-400", Poor: "text-rose-400" };

interface Holding {
  ticker: string; name: string; type: string; sector: string; market: string;
  currency: string; quantity: number; buyPrice: number; currentPrice: number;
  investedINR: number; currentValueINR: number; plINR: number; plPct: number;
  weight: string; fiftyTwoWeekHigh: number|null; fiftyTwoWeekLow: number|null;
  trailingPE: number|null; forwardPE: number|null; marketCap: number|null;
  priceToBook: number|null; averageAnalystRating: string|null;
}
interface Analysis {
  overallStrategy: string; portfolioScore: number; diversificationRating: string;
  riskLevel: string; topRecommendation: string;
  holdings: { ticker: string; companyName: string; action: string; conviction: string; rationale: string; targetWeight: string }[];
  sectorInsights: { sector: string; currentWeight: string; stance: string; insight: string }[];
  keyRisks: string[]; opportunities: string[];
}
interface PortfolioSummary { totalInvested: number; totalCurrentValue: number; totalPL: number; totalPLPct: number; holdingCount: number; }

export function VaultAdvisor({ groupId, groupName }: { groupId?: string | null; groupName?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary|null>(null);
  const [analysis, setAnalysis] = useState<Analysis|null>(null);
  const [activeTab, setActiveTab] = useState<"holdings"|"allocation"|"heatmap"|"ai">("holdings");
  const [expanded, setExpanded] = useState(false);

  const analyse = useCallback(async () => {
    setLoading(true); setError(null);
    setExpanded(true);
    try {
      const res = await fetch(`${API_BASE}/ai/portfolio-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        body: JSON.stringify({ groupId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Analysis failed");
      setHoldings(data.holdings);
      setSummary(data.portfolioSummary);
      setAnalysis(data.analysis);
      setActiveTab("holdings");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [groupId]);

  // Reset analysis when group changes
  React.useEffect(() => {
    setHoldings([]);
    setSummary(null);
    setAnalysis(null);
    setExpanded(false);
  }, [groupId]);

  const pieDataType = holdings.reduce((acc: any[], h) => {
    const ex = acc.find(a => a.name === h.type);
    if (ex) ex.value += h.currentValueINR; else acc.push({ name: h.type, value: h.currentValueINR });
    return acc;
  }, []);

  const pieDataSector = holdings.filter(h => h.type === "Stock").reduce((acc: any[], h) => {
    const sec = h.sector || "Other";
    const ex = acc.find(a => a.name === sec);
    if (ex) ex.value += h.currentValueINR; else acc.push({ name: sec, value: h.currentValueINR });
    return acc;
  }, []);

  const maxHeatVal = Math.max(...holdings.map(h => Math.abs(h.plINR)), 1);

  return (
    <div className="rounded-[2.5rem] border border-violet-500/20 bg-card/60 backdrop-blur-sm overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between p-8 border-b border-border/40">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-violet-600/10 flex items-center justify-center shrink-0">
            <Bot className="h-6 w-6 text-violet-500"/>
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground">Vault AI Advisor</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Analysing: <span className="font-bold text-foreground">{groupName || "All Assets"}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={analyse} disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-colors disabled:opacity-50 cursor-pointer">
            {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Zap className="h-4 w-4"/>}
            {loading ? "Analysing…" : analysis ? "Re-Analyse" : "Analyse Vault"}
          </motion.button>
          {summary && (
            <button onClick={() => setExpanded(e => !e)} className="p-2 rounded-xl border border-border/50 text-muted-foreground hover:text-foreground transition-colors">
              {expanded ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 m-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-rose-400 text-sm">
          <ShieldAlert className="h-5 w-5 shrink-0"/>{error}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-violet-500"/>
          <p className="text-muted-foreground text-sm">Reading vault, fetching market data, consulting AI…</p>
        </div>
      )}

      <AnimatePresence>
        {!loading && summary && expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="p-8 space-y-6">
              {/* Summary strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Invested", val: `₹${fmt(summary.totalInvested)}` },
                  { label: "Current Value", val: `₹${fmt(summary.totalCurrentValue)}` },
                  { label: "Total P&L", val: `₹${fmt(Math.abs(summary.totalPL))}`, sub: fmtPct(summary.totalPLPct), pos: summary.totalPL >= 0 },
                  { label: "Holdings", val: `${summary.holdingCount}` },
                ].map(({ label, val, sub, pos }) => (
                  <div key={label} className="rounded-2xl border border-border/50 bg-background/50 p-4">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{label}</p>
                    <p className={`text-lg font-black mt-1 ${pos === undefined ? "text-foreground" : pos ? "text-emerald-400" : "text-rose-400"}`}>{val}</p>
                    {sub && <p className={`text-xs mt-0.5 font-semibold ${pos ? "text-emerald-400" : "text-rose-400"}`}>{sub}</p>}
                  </div>
                ))}
              </div>

              {/* AI score strip */}
              {analysis && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Portfolio Score</p>
                    <p className="text-2xl font-black text-violet-600 dark:text-violet-400 mt-1">{analysis.portfolioScore}<span className="text-sm text-muted-foreground font-normal">/10</span></p>
                  </div>
                  <div className="rounded-2xl border border-border/40 bg-background/50 p-4">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Risk Level</p>
                    <p className={`text-lg font-black mt-1 ${riskColor[analysis.riskLevel]}`}>{analysis.riskLevel}</p>
                  </div>
                  <div className="rounded-2xl border border-border/40 bg-background/50 p-4">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Diversification</p>
                    <p className={`text-lg font-black mt-1 ${divColor[analysis.diversificationRating]}`}>{analysis.diversificationRating}</p>
                  </div>
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Top Action</p>
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mt-1 leading-snug line-clamp-3">{analysis.topRecommendation}</p>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-2 flex-wrap">
                {(["holdings","allocation","heatmap","ai"] as const).filter(t => t !== "ai" || analysis).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors capitalize ${activeTab === tab ? "bg-violet-600 text-white" : "bg-background/50 text-muted-foreground hover:text-foreground border border-border/50"}`}>
                    {tab === "ai" ? "AI Analysis" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Holdings table */}
              {activeTab === "holdings" && (
                <div className="rounded-2xl border border-border/50 bg-background/30 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          {["Ticker","Name","Type","Qty","Avg Buy","Curr Price","Value (INR)","Weight","P&L","P&L %","P/E","52W Range"].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {holdings.map((h, i) => (
                          <tr key={h.ticker} className={`border-b border-border/30 hover:bg-white/5 transition-colors ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                            <td className="px-4 py-3 font-black text-foreground">{h.ticker}</td>
                            <td className="px-4 py-3 text-muted-foreground max-w-[130px] truncate">{h.name}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{h.type}</td>
                            <td className="px-4 py-3 text-foreground">{h.quantity}</td>
                            <td className="px-4 py-3 text-foreground whitespace-nowrap">{h.buyPrice?.toFixed(2)} {h.currency}</td>
                            <td className="px-4 py-3 font-semibold whitespace-nowrap">{h.currentPrice?.toFixed(2)}</td>
                            <td className="px-4 py-3 font-bold whitespace-nowrap">₹{fmt(h.currentValueINR)}</td>
                            <td className="px-4 py-3 text-muted-foreground">{h.weight}</td>
                            <td className={`px-4 py-3 font-bold whitespace-nowrap ${h.plINR >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{h.plINR >= 0 ? "+" : ""}₹{fmt(h.plINR)}</td>
                            <td className={`px-4 py-3 font-bold ${h.plPct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{fmtPct(h.plPct)}</td>
                            <td className="px-4 py-3 text-muted-foreground">{h.trailingPE ? h.trailingPE.toFixed(1) : "—"}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{h.fiftyTwoWeekLow && h.fiftyTwoWeekHigh ? `${h.fiftyTwoWeekLow.toFixed(0)} – ${h.fiftyTwoWeekHigh.toFixed(0)}` : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Allocation charts */}
              {activeTab === "allocation" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[{ title: "By Asset Type", data: pieDataType }, { title: "By Sector", data: pieDataSector }].map(({ title, data }) => (
                    <div key={title} className="rounded-2xl border border-border/50 bg-background/30 p-5">
                      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">{title}</h3>
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie data={data} cx="50%" cy="50%" innerRadius={65} outerRadius={100} paddingAngle={3} dataKey="value">
                            {data.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]}/>)}
                          </Pie>
                          <Tooltip formatter={(v: any) => `₹${fmt(v)}`} contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 12 }}/>
                          <Legend formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ))}
                </div>
              )}

              {/* Heatmap */}
              {activeTab === "heatmap" && (
                <div className="rounded-2xl border border-border/50 bg-background/30 p-6">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-5">P&L Heatmap — tile size = portfolio weight</h3>
                  <div className="flex flex-wrap gap-3">
                    {[...holdings].sort((a, b) => b.currentValueINR - a.currentValueINR).map(h => {
                      const w = parseFloat(h.weight);
                      const size = Math.max(80, Math.min(200, w * 12));
                      const intensity = Math.min(Math.abs(h.plINR) / maxHeatVal, 1);
                      const bg = h.plINR >= 0 ? `rgba(16,185,129,${0.12 + intensity * 0.35})` : `rgba(239,68,68,${0.12 + intensity * 0.35})`;
                      const border = h.plINR >= 0 ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)";
                      return (
                        <div key={h.ticker} style={{ width: size, height: size, background: bg, borderColor: border }}
                          className="rounded-2xl border flex flex-col items-center justify-center p-2 hover:scale-105 transition-transform">
                          <span className="font-black text-sm text-foreground text-center leading-tight">{h.ticker}</span>
                          <span className={`text-xs font-bold mt-1 ${h.plPct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{fmtPct(h.plPct)}</span>
                          <span className="text-[10px] text-muted-foreground mt-0.5">{h.weight}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* AI Analysis */}
              {activeTab === "ai" && analysis && (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
                    <h3 className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider flex items-center gap-2 mb-3"><Bot className="h-3.5 w-3.5"/> Overall Strategy</h3>
                    <p className="text-sm text-foreground/90 leading-relaxed">{analysis.overallStrategy}</p>
                  </div>

                  <div className="rounded-2xl border border-border/50 bg-background/30 p-5">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-4"><Target className="h-3.5 w-3.5 text-cyan-400"/> Holding Recommendations</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {analysis.holdings.map(h => (
                        <div key={h.ticker} className="p-4 rounded-xl border border-border/40 bg-background/50 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-400 font-black text-xs shrink-0">{h.ticker}</span>
                              <span className="font-bold text-sm text-foreground truncate">{h.companyName}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <span className={`text-[10px] uppercase tracking-widest font-black px-2 py-1 rounded-full border ${actionColor[h.action] ?? ""}`}>{h.action}</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{h.rationale}</p>
                          <p className="text-[10px] text-muted-foreground/60">Target: <span className="text-foreground/80 font-semibold">{h.targetWeight}</span></p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {analysis.sectorInsights?.length > 0 && (
                    <div className="rounded-2xl border border-border/50 bg-background/30 p-5">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-4"><BarChart2 className="h-3.5 w-3.5 text-amber-400"/> Sector Insights</h3>
                      <div className="space-y-3">
                        {analysis.sectorInsights.map(s => (
                          <div key={s.sector} className="flex items-start gap-3">
                            <div className="flex items-center gap-2 w-44 shrink-0">
                              <span className="font-bold text-sm text-foreground truncate">{s.sector}</span>
                              <span className="text-xs text-muted-foreground shrink-0">{s.currentWeight}</span>
                            </div>
                            <span className={`text-xs font-bold shrink-0 ${stanceColor[s.stance]}`}>{s.stance}</span>
                            <p className="text-xs text-muted-foreground leading-relaxed">{s.insight}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
                      <h3 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-2 mb-3"><AlertTriangle className="h-3.5 w-3.5"/> Key Risks</h3>
                      <ul className="space-y-2">{analysis.keyRisks.map((r,i) => <li key={i} className="flex items-start gap-2 text-sm text-rose-900/80 dark:text-rose-200/80"><span className="text-rose-600 dark:text-rose-500 mt-0.5 shrink-0">▸</span>{r}</li>)}</ul>
                    </div>
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                      <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2 mb-3"><Lightbulb className="h-3.5 w-3.5"/> Opportunities</h3>
                      <ul className="space-y-2">{analysis.opportunities.map((o,i) => <li key={i} className="flex items-start gap-2 text-sm text-emerald-900/80 dark:text-emerald-200/80"><span className="text-emerald-600 dark:text-emerald-500 mt-0.5 shrink-0">▸</span>{o}</li>)}</ul>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground/40 text-center pb-2">Powered by Gemini AI — Not financial advice. Always consult a certified advisor.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
