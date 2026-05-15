"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Layers, 
  ArrowRight, 
  Lock, 
  User, 
  Mail,
  ChevronLeft,
  Briefcase,
  Sparkles
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { signUp } from "@/lib/features/authSlice";

export default function SignUpPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { status } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      if (token) {
        router.push("/dashboard");
      }
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = toast.loading("Initializing your financial vault...");
    try {
      await dispatch(
        signUp({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          username: formData.username,
        }),
      ).unwrap();

      if (typeof window !== "undefined") {
        localStorage.setItem("verifyEmail", formData.email);
      }

      toast.success("Vault Created! Verification required.", { id });
      router.push(`/auth/verify?email=${encodeURIComponent(formData.email)}`);
    } catch (error: any) {
      toast.error("Account initialization failed", { id });
    }
  };

  const isLoading = status === "loading";

  return (
    <div className="min-h-screen bg-slate-950 flex relative overflow-hidden font-sans">
      
      {/* ── Visual Backdrop ────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/20 blur-[180px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 blur-[150px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
      </div>

      {/* ── Left Content (Hidden on Mobile) ───────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-20 relative z-10">
        <Link href="/" className="flex items-center gap-4 group">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20">
            <Layers className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">Wealth.io</span>
        </Link>

        <div className="max-w-md">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">New Acquisition</span>
          </div>
          <h2 className="text-6xl font-black text-white leading-tight mb-6">
            Join the <br /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Elite Tier</span>
          </h2>
          <p className="text-xl text-slate-400 font-medium leading-relaxed">
            Start your institutional tracking journey today. Secure, real-time, and cross-border ready.
          </p>
        </div>

        <div className="flex items-center gap-10">
          <div className="text-white/40 font-black text-xs uppercase tracking-[0.3em]">Precision Engineering</div>
        </div>
      </div>

      {/* ── Right Content (Form) ────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-[520px]">
          
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-black text-white">Wealth.io</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-12 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
            <div className="mb-10">
              <h3 className="text-3xl font-black text-white mb-2">Create Identity</h3>
              <p className="text-slate-400 font-medium">Establish your personal wealth vault.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Legal Name</label>
                  <div className="relative group">
                    <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                    <input 
                      type="text" name="name" value={formData.name} onChange={handleChange}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all placeholder:text-slate-700 text-sm"
                      placeholder="Full Name" required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Username</label>
                  <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                    <input 
                      type="text" name="username" value={formData.username} onChange={handleChange}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all placeholder:text-slate-700 text-sm"
                      placeholder="Unique ID" required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                  <input 
                    type="email" name="email" value={formData.email} onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all placeholder:text-slate-700 text-sm"
                    placeholder="you@institutional.com" required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Master Key</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                  <input 
                    type="password" name="password" value={formData.password} onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all placeholder:text-slate-700 text-sm"
                    placeholder="Min 8 characters" required
                  />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" disabled={isLoading}
                  className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-600/20 hover:bg-emerald-500 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isLoading ? "Provisioning Account..." : "Create Financial Vault"}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </form>

            <div className="mt-10 text-center">
              <p className="text-slate-500 text-sm font-medium">
                Already have a vault?{" "}
                <Link href="/auth/signin" className="text-emerald-400 font-black hover:text-emerald-300 transition-colors underline underline-offset-8">
                  Sign In Here
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-400 transition-all text-xs font-black uppercase tracking-widest">
              <ChevronLeft className="w-4 h-4" /> Return to Terminal
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
