"use client";

import { Activity, TrendingDown, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type RiskMetricsProps = {
  beta: number;
  maxDrawdown: number;
  volatilityProfile: string;
  className?: string;
};

export default function RiskMetricsWidget({ beta, maxDrawdown, volatilityProfile, className }: RiskMetricsProps) {
  // Determine color coding based on Beta
  let betaColor = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
  let betaLabel = "Low Volatility";
  
  if (beta > 1.2) {
    betaColor = "text-rose-500 bg-rose-500/10 border-rose-500/20";
    betaLabel = "High Volatility";
  } else if (beta >= 0.8) {
    betaColor = "text-amber-500 bg-amber-500/10 border-amber-500/20";
    betaLabel = "Market Average";
  }

  // Drawdown formatting
  const drawdownFormatted = maxDrawdown ? `-${maxDrawdown.toFixed(2)}%` : "N/A";

  // Volatility Profile
  const isHighRisk = volatilityProfile.toLowerCase() === "high";
  const ProfileIcon = isHighRisk ? AlertTriangle : ShieldCheck;
  const profileColor = isHighRisk 
    ? "text-rose-400 bg-rose-400/10 border-rose-400/20" 
    : "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";

  return (
    <div className={cn("glass-panel p-6 flex flex-col gap-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-400" />
            Risk & Volatility
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Portfolio risk metrics based on 1Y data
          </p>
        </div>
        <div className={cn("px-3 py-1 rounded-full border flex items-center gap-2", profileColor)}>
          <ProfileIcon className="h-4 w-4" />
          <span className="text-xs font-semibold tracking-wide uppercase">{volatilityProfile} Risk</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Beta */}
        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
          <div className="text-sm font-medium text-slate-400 mb-1 flex items-center gap-1.5">
            Portfolio Beta
          </div>
          <div className="flex items-end justify-between">
            <div className="text-2xl font-bold text-white">{beta ? beta.toFixed(2) : "1.00"}</div>
            <div className={cn("text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-bold", betaColor)}>
              {betaLabel}
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Beta measures volatility vs the broader market (1.0 = exactly moves with market).
          </div>
        </div>

        {/* Max Drawdown */}
        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
          <div className="text-sm font-medium text-slate-400 mb-1 flex items-center gap-1.5">
            <TrendingDown className="h-4 w-4 text-rose-400" />
            Max Drawdown
          </div>
          <div className="text-2xl font-bold text-white">{drawdownFormatted}</div>
          <div className="text-xs text-slate-500 mt-2">
            The maximum observed loss from a peak to a trough in the last 52 weeks.
          </div>
        </div>
      </div>
    </div>
  );
}
