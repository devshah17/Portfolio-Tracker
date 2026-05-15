"use client";

import { useEffect, useState, type FormEvent } from "react";
import {

  Trash2,
  PencilLine,
  Search,
  Globe,
  Tag,
  RefreshCcw,
  X,
  Zap,
  Activity,
  Box,
} from "lucide-react";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

type TickerType = "Stock" | "MF";

type Ticker = {
  _id: string;
  name: string;
  tickerName: string;
  type: TickerType;
  currency: string;
  market: string;
};

type FormState = {
  name: string;
  tickerName: string;
  type: TickerType;
  currency: string;
  market: string;
};

const initialFormState: FormState = {
  name: "",
  tickerName: "",
  type: "Stock",
  currency: "INR",
  market: "NSE",
};

export default function DashboardTickersPage() {
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTickers = async () => {
    try {
      setListLoading(true);
      const res = await fetch(`${API_BASE}/tickers`, { cache: "no-store" });
      const data = await res.json();
      setTickers(data.data || []);
    } catch (err: any) {
      toast.error("Failed to load ticker universe");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchTickers();
  }, []);

  const handleChange = (field: keyof FormState, value: string | TickerType) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(initialFormState);
    setEditingId(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      const url = editingId
        ? `${API_BASE}/tickers/${editingId}`
        : `${API_BASE}/tickers`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Synchronization failed");

      toast.success(
        editingId ? "Instrument updated" : "New instrument cataloged",
      );
      await fetchTickers();
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Could not update universe");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ticker: Ticker) => {
    setEditingId(ticker._id);
    setForm({
      name: ticker.name,
      tickerName: ticker.tickerName,
      type: ticker.type,
      currency: ticker.currency,
      market: ticker.market,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently purge this instrument?")) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/tickers/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Purge failed");
      toast.success("Instrument removed from universe");
      await fetchTickers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickers = tickers.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tickerName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="relative min-h-full animate-in fade-in px-4 py-8 duration-1000 sm:px-10 sm:py-10">
      {/* ── Background Ambiance ─────────────────────────────────────────── */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/10 blur-[180px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto mb-16 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-violet-500/20">
                <Box className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-black text-violet-400 uppercase tracking-[0.4em]">
                Global Universe
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tighter leading-none">
              Asset{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
                Library.
              </span>
            </h1>
            <p className="text-slate-400 font-medium mt-6 max-w-2xl text-lg">
              Manage the core financial instruments powering your analytics
              engine.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-8 shadow-xl">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                  LIVE TICKERS
                </p>
                <p className="text-2xl font-black text-white">
                  {tickers.length}
                </p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <button
                onClick={fetchTickers}
                className="p-4 bg-violet-600 text-white rounded-2xl hover:bg-violet-500 transition-all shadow-lg shadow-violet-600/20"
              >
                <RefreshCcw
                  className={`w-5 h-5 ${listLoading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-12 relative z-10">
        {/* ── Left: Management Panel (5 cols) ────────────────────────────── */}
        <div className="xl:col-span-5">
          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-[3.5rem] p-12 sticky top-12">
            <h3 className="text-2xl font-black text-white mb-10 flex items-center gap-3">
              <Zap className="w-6 h-6 text-violet-400" />
              {editingId ? "Refine Entry" : "New Instrument"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">
                    Official Name
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] px-6 py-5 text-white font-bold placeholder:text-slate-700 focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50 outline-none transition-all"
                    placeholder="e.g. Apple Inc."
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">
                    Market Ticker
                  </label>
                  <input
                    value={form.tickerName}
                    onChange={(e) =>
                      handleChange("tickerName", e.target.value.toUpperCase())
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] px-6 py-5 text-white font-black placeholder:text-slate-700 focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50 outline-none transition-all uppercase tracking-wider"
                    placeholder="e.g. AAPL"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">
                    Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      handleChange("type", e.target.value as TickerType)
                    }
                    className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-sm font-black text-white focus:ring-2 focus:ring-violet-500/40 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="Stock">Stock</option>
                    <option value="MF">MF</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">
                    Currency
                  </label>
                  <select
                    value={form.currency}
                    onChange={(e) => handleChange("currency", e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-sm font-black text-white focus:ring-2 focus:ring-violet-500/40 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">
                    Exchange
                  </label>
                  <select
                    value={form.market}
                    onChange={(e) => handleChange("market", e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-sm font-black text-white focus:ring-2 focus:ring-violet-500/40 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="NSE">NSE</option>
                    <option value="BSE">BSE</option>
                    <option value="NASDAQ">NASDAQ</option>
                    <option value="NYSE">NYSE</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 flex items-center gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-grow bg-violet-600 text-white font-black py-5 rounded-[1.5rem] shadow-2xl shadow-violet-600/20 hover:bg-violet-500 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading
                    ? "Synchronizing..."
                    : editingId
                      ? "Commit Changes"
                      : "Register Instrument"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="p-5 bg-white/5 border border-white/10 rounded-[1.5rem] text-white hover:bg-white/10 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* ── Right: Ticker Explorer (7 cols) ────────────────────────────── */}
        <div className="xl:col-span-7 space-y-8">
          {/* Search Box */}
          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-[2.5rem] p-8 flex items-center gap-6">
            <div className="relative flex-grow">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, symbol, or market..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-6 py-4 text-white font-bold placeholder:text-slate-700 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
              />
            </div>
            <div className="hidden sm:flex items-center gap-2 px-6 py-3 bg-violet-500/10 rounded-2xl border border-violet-500/20 text-xs font-black text-violet-400 uppercase tracking-widest">
              <Activity className="w-4 h-4" /> {filteredTickers.length} Result
              {filteredTickers.length !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Explorer List */}
          <div className="grid grid-cols-1 gap-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar pb-20">
            {filteredTickers.map((ticker) => (
              <div
                key={ticker._id}
                className="group bg-white/[0.03] backdrop-blur-md border border-white/10 shadow-sm rounded-[2.5rem] p-8 hover:bg-white/[0.07] hover:border-violet-500/30 transition-all duration-500"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-xl font-black text-xl text-white group-hover:scale-110 transition-transform duration-500">
                      {ticker.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-white tracking-tight mb-1">
                        {ticker.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest flex items-center gap-1.5 bg-violet-500/10 px-3 py-1 rounded-lg border border-violet-500/10">
                          <Tag className="w-3 h-3" /> {ticker.tickerName}
                        </span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                          <Globe className="w-3 h-3" /> {ticker.market}
                        </span>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/10">
                          {ticker.currency}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button
                      onClick={() => handleEdit(ticker)}
                      className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-violet-600 hover:border-violet-500 shadow-sm transition-all"
                    >
                      <PencilLine className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(ticker._id)}
                      className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-600 hover:text-white hover:bg-rose-600 hover:border-rose-500 shadow-sm transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredTickers.length === 0 && !listLoading && (
              <div className="bg-white/5 border border-dashed border-white/10 rounded-[3rem] p-24 text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-700">
                  <Search className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-white mb-2">
                  No Instruments Located
                </h3>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                  Verify your search criteria and try again.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.3);
        }
      `}</style>
    </div>
  );
}
