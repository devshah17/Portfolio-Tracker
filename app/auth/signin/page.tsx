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
  ShieldCheck,
  ChevronLeft
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { login, hydrateFromStorage } from "@/lib/features/authSlice";

export default function SignInPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { status } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    emailOrUsername: "",
    password: "",
  });

  useEffect(() => {
    dispatch(hydrateFromStorage());
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      if (token) {
        router.push("/dashboard");
      }
    }
  }, [dispatch, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = toast.loading("Authenticating your access...");
    try {
      const result = await dispatch(
        login({
          emailOrUsername: formData.emailOrUsername,
          password: formData.password,
        }),
      ).unwrap();

      const user = result?.user;
      if (!user?.verify || !user?.active) {
        toast.error("Account verification required", { id });
        router.push(`/auth/verify?email=${encodeURIComponent(user?.email || formData.emailOrUsername)}`);
      } else {
        toast.success("Access Granted. Welcome back!", { id });
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast.error("Invalid credentials or access denied", { id });
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
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Enterprise Security</span>
          </div>
          <h2 className="text-6xl font-black text-white leading-tight mb-6">
            Institutional <br /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Wealth Tracking</span>
          </h2>
          <p className="text-xl text-slate-400 font-medium leading-relaxed">
            Manage your entire portfolio universe with state-of-the-art analytics and real-time global market data.
          </p>
        </div>

        <div className="flex items-center gap-10">
          <div className="text-white/40 font-black text-xs uppercase tracking-[0.3em]">Built for precision</div>
        </div>
      </div>

      {/* ── Right Content (Form) ────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-[480px]">
          
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-black text-white">Wealth.io</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-12 shadow-2xl">
            <div className="mb-10">
              <h3 className="text-3xl font-black text-white mb-2">Welcome Back</h3>
              <p className="text-slate-400 font-medium">Enter your credentials to access your vault.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Identify Yourself</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input 
                    type="text"
                    name="emailOrUsername"
                    value={formData.emailOrUsername}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all placeholder:text-slate-700"
                    placeholder="Email or Username"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Security Key</label>
                  <Link href="/auth/forgot-password" size="sm" className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors">
                    Forgot Key?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input 
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all placeholder:text-slate-700"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isLoading ? "Synchronizing Vault..." : "Access Dashboard"}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </form>

            <div className="mt-10 text-center">
              <p className="text-slate-500 text-sm font-medium">
                New to the platform?{" "}
                <Link href="/auth/signup" className="text-indigo-400 font-black hover:text-indigo-300 transition-colors underline underline-offset-8">
                  Create an Account
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
