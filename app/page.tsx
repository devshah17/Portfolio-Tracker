"use client";

import Link from "next/link";
import { 
  ArrowRight, 
  Sparkles, 
  Layers, 
  TrendingUp, 
  Globe, 
  BarChart3, 
  ChevronRight,
  Database
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden font-sans">
      
      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 sm:px-20 py-8 flex items-center justify-between backdrop-blur-md bg-slate-950/20 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight">Wealth.io</span>
        </div>
        <div className="hidden md:flex items-center gap-10">
          <Link href="#features" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Platform</Link>
          <Link href="#security" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Security</Link>
          <Link href="#intelligence" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Intelligence</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth/signin" className="text-sm font-bold text-slate-400 hover:text-white transition-colors px-4">Sign In</Link>
          <Link 
            href="/auth/signup" 
            className="bg-white text-slate-950 px-6 py-2.5 rounded-full text-sm font-black hover:bg-indigo-500 hover:text-white transition-all shadow-xl shadow-white/5"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative pt-44 pb-32 px-6 sm:px-20 min-h-screen flex flex-col items-center text-center">
        {/* Background Effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/20 blur-[200px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-violet-600/10 blur-[180px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.05] pointer-events-none" />

        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-full mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Institutional Wealth Management</span>
          </div>
          
          <h1 className="text-6xl sm:text-8xl font-black tracking-tighter leading-[0.9] mb-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            One Vault. <br /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 animate-gradient">All Your Assets.</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-400 font-medium max-w-2xl mx-auto mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            The high-performance dashboard for modern investors. Track global stocks, mutual funds, and complex portfolios in a single, institutional-grade workspace.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
            <Link 
              href="/auth/signup" 
              className="group bg-indigo-600 text-white px-10 py-5 rounded-[2rem] text-lg font-black shadow-2xl shadow-indigo-600/20 hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3"
            >
              Start Your Vault
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/dashboard" 
              className="bg-white/5 border border-white/10 text-white px-10 py-5 rounded-[2rem] text-lg font-black hover:bg-white/10 transition-all"
            >
              View Live Demo
            </Link>
          </div>
        </div>

        {/* Floating Preview Card */}
        <div className="mt-24 relative z-10 w-full max-w-6xl group animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
          <div className="absolute inset-0 bg-indigo-600/20 blur-[120px] rounded-full opacity-50 group-hover:opacity-70 transition-opacity" />
          <div className="bg-slate-900/60 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-1 sm:p-2 shadow-2xl relative overflow-hidden">
             {/* Mock Dashboard UI */}
             <div className="bg-slate-950 rounded-[2.5rem] p-8 sm:p-12 border border-white/5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                   <div className="space-y-4">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">NET WORTH</div>
                      <div className="text-4xl font-black">₹12,58,430</div>
                      <div className="flex items-center gap-2 text-emerald-400 font-black text-xs">
                        <TrendingUp className="w-4 h-4" /> +12.4% THIS YEAR
                      </div>
                   </div>
                   <div className="col-span-2 hidden md:block">
                      <div className="flex items-end gap-3 h-24">
                        {[40, 60, 45, 90, 65, 80, 100, 75, 85].map((h, i) => (
                          <div key={i} className="flex-1 bg-indigo-500/20 rounded-t-lg relative group">
                            <div className="absolute bottom-0 left-0 right-0 bg-indigo-600 rounded-t-lg transition-all duration-1000" style={{ height: `${h}%` }} />
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex justify-between text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        <span>JAN</span><span>MAR</span><span>MAY</span><span>JUL</span><span>SEP</span><span>NOV</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* ── Intelligence Grid ────────────────────────────────────────────── */}
      <section id="features" className="py-32 px-6 sm:px-20 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-end justify-between gap-10 mb-20">
            <div className="max-w-2xl">
              <h2 className="text-5xl font-black tracking-tight leading-[1.1] mb-6">
                Engineered for the <br /> 
                <span className="text-indigo-400">Modern Capitalist.</span>
              </h2>
              <p className="text-lg text-slate-400 font-medium">
                We've combined deep financial analytics with an intuitive interface to help you master your wealth universe.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-black text-slate-500 uppercase tracking-widest">
              Built for performance <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white/5 border border-white/5 p-10 rounded-[2.5rem] hover:bg-white/10 transition-all group">
              <div className="w-14 h-14 bg-indigo-600/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Globe className="w-7 h-7 text-indigo-400" />
              </div>
              <h4 className="text-xl font-black mb-4">Cross-Border Tracking</h4>
              <p className="text-slate-500 font-medium leading-relaxed">Automatic currency conversion and global exchange data for seamless international management.</p>
            </div>

            <div className="bg-white/5 border border-white/5 p-10 rounded-[2.5rem] hover:bg-white/10 transition-all group">
              <div className="w-14 h-14 bg-emerald-600/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-7 h-7 text-emerald-400" />
              </div>
              <h4 className="text-xl font-black mb-4">Deep Analytics</h4>
              <p className="text-slate-500 font-medium leading-relaxed">Advanced allocation breakdown, risk analysis, and historical performance trendlines at your fingertips.</p>
            </div>

            <div className="bg-white/5 border border-white/5 p-10 rounded-[2.5rem] hover:bg-white/10 transition-all group">
              <div className="w-14 h-14 bg-violet-600/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Database className="w-7 h-7 text-violet-400" />
              </div>
              <h4 className="text-xl font-black mb-4">Unified Data Lake</h4>
              <p className="text-slate-500 font-medium leading-relaxed">Consolidate stocks, mutual funds, and alternate assets into a single source of truth for your wealth.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Final ────────────────────────────────────────────────────── */}
      <section className="py-44 px-6 sm:px-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-600/10 blur-[150px] rounded-full translate-y-1/2" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl sm:text-7xl font-black tracking-tighter mb-10">
            Ready to <span className="text-indigo-400">Master Your Wealth?</span>
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link 
              href="/auth/signup" 
              className="w-full sm:w-auto bg-white text-slate-950 px-12 py-6 rounded-[2rem] text-xl font-black hover:bg-indigo-500 hover:text-white transition-all shadow-2xl"
            >
              Establish Your Vault
            </Link>
          </div>
          <p className="mt-10 text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">Trusted by elite investors worldwide</p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="py-20 px-6 sm:px-20 border-t border-white/5 text-center sm:text-left">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black">Wealth.io</span>
          </div>
          <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">© 2026 Wealth.io Architecture. All Rights Reserved.</p>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 8s ease infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 0px;
        }
      `}</style>

    </div>
  );
}
