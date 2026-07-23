"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { useTheme } from "next-themes";
import { RootState } from "@/lib/store";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Save,
  Wallet,
  Activity,
  ArrowRight,
  Plus,
  PieChart as PieChartIcon
} from "lucide-react";
import {
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

const CHART_COLORS_LIGHT = ["#7c3aed", "#6366f1", "#8b5cf6", "#4f46e5", "#059669"];
const CHART_COLORS_DARK = ["#a78bfa", "#818cf8", "#c4b5fd", "#6366f1", "#34d399"];

export default function RebalancePage() {
  const user = useSelector((s: RootState) => s.auth.user);
  const { resolvedTheme } = useTheme();
  
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [targetAllocations, setTargetAllocations] = useState<Record<string, number>>({});
  const [freshCapital, setFreshCapital] = useState<number>(0);
  const [saving, setSaving] = useState(false);

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

  const fetchRebalanceData = useCallback(async () => {
    const userId = getUserId();
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/rebalance/${userId}`);
      if (!res.ok) throw new Error("API failure");
      const result = await res.json();
      if (result.success) {
        setData(result.data);
        
        const fetchedTargets = { ...result.data.targetAllocations };
        
        // Ensure standard categories and any held categories exist in the target map so sliders show up
        const defaultCategories = ["Indian Stock", "US Stock", "Indian MF", "US MF"];
        const heldCategories = Object.keys(result.data.currentAllocations || {});
        
        const allPossibleCategories = new Set([...defaultCategories, ...heldCategories]);
        
        allPossibleCategories.forEach(cat => {
          if (fetchedTargets[cat] === undefined) {
            fetchedTargets[cat] = 0;
          }
        });
        
        setTargetAllocations(fetchedTargets);
      }
    } catch (e) {
      console.error("Rebalance stats load error", e);
      toast.error("Failed to load rebalancing data.");
    } finally {
      setLoading(false);
    }
  }, [getUserId]);

  useEffect(() => {
    setMounted(true);
    fetchRebalanceData();
  }, [fetchRebalanceData]);

  const formatINR = (v: number) =>
    "₹" + v.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const chartColors = resolvedTheme === "dark" ? CHART_COLORS_DARK : CHART_COLORS_LIGHT;
  
  const handleTargetChange = (category: string, value: number) => {
    setTargetAllocations(prev => ({ ...prev, [category]: value }));
  };

  const handleSaveTargets = async () => {
    const userId = getUserId();
    if (!userId) return;

    let sum = 0;
    Object.values(targetAllocations).forEach(v => sum += v);
    
    if (Math.abs(sum - 100) > 0.1 && sum !== 0) {
      toast.error(`Allocations must sum to 100%. Current sum: ${sum.toFixed(1)}%`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/rebalance/${userId}/targets`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetAllocations }),
      });
      if (!res.ok) throw new Error("API failure");
      toast.success("Target allocations saved successfully!");
      fetchRebalanceData(); // Refresh the action plan
    } catch (e) {
      console.error(e);
      toast.error("Failed to save target allocations.");
    } finally {
      setSaving(false);
    }
  };

  const dynamicActionPlan = useMemo(() => {
    if (!data) return [];
    
    const totalCurrentValue = data.totalValue;
    const plan = [];

    // Calculate dynamic targets with fresh capital
    const newTotalValue = totalCurrentValue + freshCapital;

    const allCategories = new Set([...Object.keys(data.currentValues), ...Object.keys(targetAllocations)]);
    
    for (const category of allCategories) {
      const currentVal = data.currentValues[category] || 0;
      const targetPct = targetAllocations[category] || 0;
      const targetVal = (targetPct / 100) * newTotalValue;
      const diffVal = targetVal - currentVal;

      if (Math.abs(diffVal) > 1) { // Ignore minor rounding differences
        plan.push({
          category,
          action: diffVal > 0 ? "BUY" : "SELL",
          amount: Math.abs(diffVal),
          diffVal
        });
      }
    }

    // Sort: Buys first (descending amount), then Sells (descending amount)
    return plan.sort((a, b) => b.diffVal - a.diffVal);
  }, [data, targetAllocations, freshCapital]);

  if (!mounted) return null;

  if (!getUserId()) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Please log in to view rebalancing.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (!data) return null;

  const currentPieData = Object.entries(data.currentAllocations).map(([name, val]) => ({ name, value: val as number }));
  const targetPieData = Object.entries(targetAllocations).map(([name, val]) => ({ name, value: val as number }));

  const currentSum = Object.values(targetAllocations).reduce((acc, curr) => acc + curr, 0);

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <header className="mb-10">
        <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl flex items-center gap-4">
          <RefreshCw className="h-10 w-10 text-violet-500" />
          Smart Rebalancing
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground leading-relaxed">
          Align your portfolio to your exact financial goals. Set your target allocations, and let the engine calculate precisely what to buy or sell.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Targets Panel */}
        <section className="dashboard-card rounded-[2rem] border border-border/60 bg-card/70 p-8 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-foreground flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-violet-500" />
              Target Allocation
            </h3>
            <span className={`px-3 py-1 text-sm font-bold rounded-full ${Math.abs(currentSum - 100) < 0.1 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
              Total: {currentSum.toFixed(1)}%
            </span>
          </div>

          <div className="space-y-6">
            {Object.keys(targetAllocations).length === 0 && (
              <p className="text-muted-foreground text-sm">No allocations set. Please add them.</p>
            )}
            {Object.entries(targetAllocations).map(([category, targetPct], idx) => {
               const currentPct = data.currentAllocations[category] || 0;
               return (
                 <div key={category} className="space-y-2">
                   <div className="flex justify-between items-center text-sm">
                     <span className="font-bold text-foreground">{category}</span>
                     <span className="text-muted-foreground">Current: {currentPct.toFixed(1)}% &rarr; <span className="text-foreground font-bold">{targetPct.toFixed(1)}%</span></span>
                   </div>
                   <input 
                     type="range" 
                     min="0" 
                     max="100" 
                     step="1"
                     value={targetPct}
                     onChange={(e) => handleTargetChange(category, Number(e.target.value))}
                     className="w-full accent-violet-500"
                   />
                 </div>
               )
            })}
          </div>

          <div className="mt-8 flex justify-end">
             <Button 
               onClick={handleSaveTargets} 
               disabled={saving || Math.abs(currentSum - 100) > 0.1}
               className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-6 font-bold"
             >
               {saving ? <Activity className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
               Save Strategy
             </Button>
          </div>
        </section>

        {/* Visual Comparison */}
        <section className="dashboard-card rounded-[2rem] border border-border/60 bg-card/70 p-8 shadow-lg backdrop-blur-xl">
           <h3 className="mb-8 text-xl font-black text-foreground flex items-center gap-3">
              <PieChartIcon className="h-6 w-6 text-violet-500" />
              Allocation Drift
           </h3>
           <div className="grid grid-cols-2 gap-4 h-[250px]">
             <div className="relative">
               <h4 className="absolute top-0 w-full text-center text-xs font-bold text-muted-foreground z-10">CURRENT</h4>
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={currentPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {currentPieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => typeof val === 'number' ? val.toFixed(1) + "%" : val} />
                  </PieChart>
               </ResponsiveContainer>
             </div>
             <div className="relative">
               <h4 className="absolute top-0 w-full text-center text-xs font-bold text-muted-foreground z-10">TARGET</h4>
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={targetPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {targetPieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => typeof val === 'number' ? val.toFixed(1) + "%" : val} />
                  </PieChart>
               </ResponsiveContainer>
             </div>
           </div>
        </section>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Fresh Capital Calculator */}
        <section className="lg:col-span-1 dashboard-card rounded-[2rem] border border-border/60 bg-card/70 p-8 shadow-lg backdrop-blur-xl">
          <h3 className="mb-4 text-xl font-black text-foreground flex items-center gap-3">
            <Wallet className="h-6 w-6 text-emerald-500" />
            Inject Fresh Capital
          </h3>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Want to rebalance without selling? Enter the amount of new money you want to invest, and we'll tell you where to put it to fix your allocation.
          </p>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
            <input 
              type="number"
              min="0"
              value={freshCapital}
              onChange={(e) => setFreshCapital(Number(e.target.value))}
              className="w-full bg-background border border-border/50 rounded-2xl py-4 pl-8 pr-4 font-bold focus:ring-2 focus:ring-violet-500 outline-none transition-all"
              placeholder="0"
            />
          </div>
        </section>

        {/* Action Plan */}
        <section className="lg:col-span-2 dashboard-card rounded-[2rem] border border-border/60 bg-card/70 p-8 shadow-lg backdrop-blur-xl">
          <h3 className="mb-8 text-xl font-black text-foreground flex items-center gap-3">
            <Activity className="h-6 w-6 text-blue-500" />
            Action Plan
          </h3>
          
          <div className="space-y-4">
            {dynamicActionPlan.length === 0 && (
              <div className="text-center py-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 mb-4">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-foreground">Perfectly Balanced!</h4>
                <p className="text-muted-foreground mt-2">Your portfolio matches your target allocations.</p>
              </div>
            )}
            {dynamicActionPlan.map((action, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-4 mb-4 sm:mb-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-black text-sm ${action.action === 'BUY' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                    {action.action}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">{action.category}</h4>
                    <p className="text-xs text-muted-foreground">Drift: {formatINR(Math.abs(action.diffVal))}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 self-end sm:self-auto">
                   <div className="text-right">
                     <div className="font-black text-lg text-foreground">{formatINR(action.amount)}</div>
                     <div className="text-xs text-muted-foreground">Recommended amount</div>
                   </div>
                   <ArrowRight className="w-5 h-5 text-muted-foreground opacity-50" />
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
