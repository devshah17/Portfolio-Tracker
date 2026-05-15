"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store/store";
import {
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  RefreshCcw,
  Search,
  X,
  Pencil,
  Briefcase,
  ChevronDown,
  PieChart,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { dc } from "@/lib/dashboard-theme";
import { cn } from "@/lib/utils";
import {
  DailyPriceChartModal,
  type DailyPricePoint,
  type DailyPriceTicker,
} from "@/components/dashboard/daily-price-chart-modal";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

interface PortfolioItem {
  _id: string;
  buyingPrice: number;
  quantity: number;
  tickerDetails?: {
    _id: string;
    name: string;
    tickerName: string;
    currency: string;
    type: string;
  };
  currentPrice: number | null;
  currentExchangeRate: number;
  exchangeRate: number;
}

interface Ticker {
  _id: string;
  name: string;
  tickerName: string;
  currency: string;
  type: string;
}

const formatINR = (value: number) =>
  "₹" +
  value.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

export default function DashboardAssetsPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const getUserId = React.useCallback(() => {
    if (user?.id || user?._id) return user?.id || user?._id;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return parsed.id || parsed._id;
        } catch (e) { return null; }
      }
    }
    return null;
  }, [user]);

  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);

  const [selectedTickerId, setSelectedTickerId] = useState("");
  const [buyingPrice, setBuyingPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [exchangeRate, setExchangeRate] = useState("1");
  const [submitting, setSubmitting] = useState(false);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [tickerSearch, setTickerSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [priceModalTicker, setPriceModalTicker] = useState<DailyPriceTicker | null>(null);
  const [dailyPrices, setDailyPrices] = useState<DailyPricePoint[]>([]);
  const [loadingDailyPrices, setLoadingDailyPrices] = useState(false);

  const selectedTicker = tickers.find((t) => t._id === selectedTickerId);
  const filteredTickers = tickers.filter(
    (t) =>
      (t.tickerName?.toLowerCase() || "").includes(tickerSearch.toLowerCase()) ||
      (t.name?.toLowerCase() || "").includes(tickerSearch.toLowerCase()),
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPortfolio = async () => {
    if (!getUserId()) return;
    try {
      setRefreshing(true);
      const res = await fetch(`${API_BASE}/portfolios/user/${getUserId()}`);
      const data = await res.json();
      setPortfolio(data.data || []);
    } catch (err: any) {
      toast.error("Could not load assets");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTickers = async () => {
    try {
      const res = await fetch(`${API_BASE}/tickers`);
      const data = await res.json();
      setTickers(data.data || []);
    } catch (err: any) {
      console.error("Failed to load tickers", err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (getUserId()) {
        fetchPortfolio();
        fetchTickers();
      } else {
        setLoading(false); // Stop loading if no user found after delay
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [user, getUserId]);

  const openAddModal = () => {
    setEditingItem(null);
    setSelectedTickerId("");
    setBuyingPrice("");
    setQuantity("1");
    setExchangeRate("1");
    setModalMode("add");
  };

  const openEditModal = (item: PortfolioItem) => {
    setEditingItem(item);
    setBuyingPrice(String(item.buyingPrice));
    setQuantity(String(item.quantity));
    setExchangeRate(String(item.exchangeRate || 1));
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingItem(null);
    resetForm();
  };

  const resetForm = () => {
    setSelectedTickerId("");
    setBuyingPrice("");
    setQuantity("1");
    setExchangeRate("1");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === "add" && !selectedTickerId) return toast.error("Select an asset");
    
    setSubmitting(true);
    try {
      const url = modalMode === "edit" ? `${API_BASE}/portfolios/${editingItem?._id}` : `${API_BASE}/portfolios`;
      const method = modalMode === "edit" ? "PUT" : "POST";
      
      const body = modalMode === "edit" 
        ? { buyingPrice: Number(buyingPrice), quantity: Number(quantity), exchangeRate: Number(exchangeRate) || 1 }
        : { userId: getUserId(), tickerId: selectedTickerId, buyingPrice: Number(buyingPrice), quantity: Number(quantity), exchangeRate: Number(exchangeRate) || 1 };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to save holdings");

      toast.success(modalMode === "edit" ? "Holdings updated" : "Asset added to portfolio");
      closeModal();
      fetchPortfolio();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openPriceModal = async (tickerId: string) => {
    setPriceModalOpen(true);
    setPriceModalTicker(null);
    setDailyPrices([]);
    setLoadingDailyPrices(true);
    try {
      const res = await fetch(`${API_BASE}/tickers/${tickerId}/daily-prices?limit=120`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load prices");
      setPriceModalTicker(json.data.ticker);
      setDailyPrices(json.data.prices ?? []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load prices";
      toast.error(msg);
      setPriceModalOpen(false);
    } finally {
      setLoadingDailyPrices(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Permanently remove this asset from your holdings?")) return;
    try {
      const res = await fetch(`${API_BASE}/portfolios/${itemId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Deletion failed");
      toast.success("Asset removed");
      fetchPortfolio();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const totalInvestment = portfolio.reduce(
    (acc, item) => acc + item.buyingPrice * (item.exchangeRate || 1) * item.quantity,
    0
  );
  const currentValue = portfolio.reduce((acc, item) => {
    const rate = item.exchangeRate || 1;
    const price = item.currentPrice ?? item.buyingPrice;
    return acc + price * rate * item.quantity;
  }, 0);
  const totalPL = currentValue - totalInvestment;
  const plPct = totalInvestment > 0 ? (totalPL / totalInvestment) * 100 : 0;

  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className={dc.spinner} />
      </div>
    );
  }

  return (
    <div className="dashboard-subpage min-h-full animate-in fade-in px-4 py-8 duration-700 sm:px-10 sm:py-10">
      
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className={dc.iconBox}>
                <Briefcase className="h-4 w-4 text-white" />
              </div>
              <span className={dc.eyebrow}>Asset management</span>
            </div>
            <h1 className={dc.title}>
              Holdings <span className={dc.titleGradient}>inventory</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchPortfolio}
              className={dc.btnIcon}
            >
              <RefreshCcw className={`w-5 h-5 text-slate-500 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <button 
              onClick={openAddModal}
              className={dc.btnPrimary}
            >
              <Plus className="h-5 w-5" /> Add new asset
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto space-y-10">
        
        {/* ── Stats Summary ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className={cn(dc.statCard, "rounded-[2.5rem] p-10")}>
            <p className={`mb-4 ${dc.statLabel}`}>Total invested</p>
            <h3 className={dc.statValue}>{formatINR(totalInvestment)}</h3>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-indigo-100/50 blur-3xl rounded-full" />
          </div>

          <div className={cn(dc.heroCard, "rounded-[2.5rem] p-10")}>
            <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-violet-100/70">Current value</p>
            <h3 className="text-3xl font-black text-white sm:text-4xl">{formatINR(currentValue)}</h3>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-slate-100/50 blur-3xl rounded-full" />
          </div>

          <div className={cn(dc.plCardBase, "rounded-[2.5rem] p-10", totalPL >= 0 ? dc.plCardUp : dc.plCardDown)}>
            <p className={`mb-4 ${dc.statLabel}`}>Unrealized P&L</p>
            <div className="flex items-baseline gap-3">
              <h3 className={cn("text-3xl font-black sm:text-4xl", totalPL >= 0 ? dc.plTextUp : dc.plTextDown)}>
                {totalPL >= 0 ? "+" : "-"}{formatINR(Math.abs(totalPL))}
              </h3>
              <div className={`px-3 py-1 rounded-full text-xs font-black border ${totalPL >= 0 ? "bg-emerald-500 text-white border-emerald-400" : "bg-rose-500 text-white border-rose-400"}`}>
                {plPct.toFixed(2)}%
              </div>
            </div>
            <div className={`absolute -right-8 -bottom-8 w-32 h-32 blur-3xl opacity-20 rounded-full ${totalPL >= 0 ? "bg-emerald-500" : "bg-rose-500"}`} />
          </div>
        </div>

        {/* ── Assets Table ────────────────────────────────────────────────── */}
        <div className={cn(dc.tableWrap, "rounded-[3rem]")}>
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <div className={dc.spinner} />
              <p className="text-slate-500 font-bold tracking-widest uppercase text-[10px]">Synchronizing Holdings...</p>
            </div>
          ) : portfolio.length === 0 ? (
            <div className="p-24 text-center">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-300">
                <PieChart className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">No Assets Tracked</h3>
              <p className="text-slate-500 font-medium mb-8">Start your financial journey by adding your first investment.</p>
              <button onClick={openAddModal} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-200">
                Add Asset Now
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/5 border-b border-slate-200/60">
                    <th className="py-6 px-10 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Asset Identity</th>
                    <th className="py-6 px-10 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Avg Purchase (INR)</th>
                    <th className="py-6 px-10 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Holdings</th>
                    <th className="py-6 px-10 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Performance</th>
                    <th className="py-6 px-10 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {portfolio.map((item) => {
                    const rate = item.exchangeRate || 1;
                    const buyINR = item.buyingPrice * rate;
                    const plPerc =
                      item.currentPrice && item.buyingPrice > 0
                        ? ((item.currentPrice - item.buyingPrice) / item.buyingPrice) * 100
                        : 0;

                    const tickerId = item.tickerDetails?._id;
                    return (
                      <tr
                        key={item._id}
                        className={cn(
                          "hover:bg-indigo-50/30 transition-all group",
                          tickerId && "cursor-pointer"
                        )}
                        onClick={() => tickerId && openPriceModal(tickerId)}
                      >
                        <td className="py-6 px-10">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm font-black text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                              {item.tickerDetails?.name?.charAt(0) || "?"}
                            </div>
                            <div>
                              <div className="font-black text-slate-800 tracking-tight">{item.tickerDetails?.name}</div>
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.tickerDetails?.tickerName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-6 px-10 text-right">
                          <div className="font-black text-slate-800">{formatINR(buyINR)}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">{item.tickerDetails?.currency} {item.buyingPrice.toFixed(2)} @ {rate.toFixed(2)}</div>
                        </td>
                        <td className="py-6 px-10 text-center font-black text-slate-700">
                          {item.quantity} <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Units</span>
                        </td>
                        <td className="py-6 px-10 text-center">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black ${plPerc >= 0 ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
                            {plPerc >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {Math.abs(plPerc).toFixed(2)}%
                          </div>
                        </td>
                        <td className="py-6 px-10">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(item);
                              }}
                              className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(item._id);
                              }}
                              className="p-2.5 bg-white border border-slate-200 rounded-xl text-rose-400 hover:text-rose-600 hover:border-rose-200 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal (Vault Aesthetic) ────────────────────────────────────────── */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/10 rounded-[3rem] shadow-2xl w-full max-w-lg relative">
            <div className="absolute inset-0 rounded-[3rem] overflow-hidden pointer-events-none">
               <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="p-10 border-b border-white/5 relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">{modalMode === "edit" ? "Refine Holdings" : "New Acquisition"}</h2>
                  <p className="text-slate-400 font-medium text-sm">Synchronize your portfolio with the global market.</p>
                </div>
              </div>
              <button onClick={closeModal} className="absolute right-10 top-10 p-2 text-slate-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-10 space-y-8 relative z-10">
              {modalMode === "add" && (
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Select Instrument</label>
                  <div ref={dropdownRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white hover:bg-white/10 transition-all outline-none"
                    >
                      <span className={selectedTicker ? "font-black" : "text-slate-600"}>
                        {selectedTicker ? `${selectedTicker.name} — ${selectedTicker.tickerName}` : "Choose from catalog..."}
                      </span>
                      <ChevronDown className={`w-5 h-5 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {dropdownOpen && (
                      <div className="absolute z-50 mt-4 w-full bg-slate-800 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-4 bg-slate-900 border-b border-white/5">
                          <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2 border border-white/5">
                            <Search className="w-4 h-4 text-slate-500" />
                            <input 
                              autoFocus 
                              value={tickerSearch} 
                              onChange={(e) => setTickerSearch(e.target.value)} 
                              placeholder="Search..." 
                              className="bg-transparent border-none outline-none text-white text-sm font-bold w-full"
                            />
                          </div>
                        </div>
                        <ul className="max-h-60 overflow-y-auto">
                          {filteredTickers.map(t => (
                            <li 
                              key={t._id} 
                              onClick={() => { setSelectedTickerId(t._id); setDropdownOpen(false); }}
                              className={`px-6 py-4 cursor-pointer hover:bg-indigo-600 text-white transition-all ${selectedTickerId === t._id ? "bg-indigo-600" : ""}`}
                            >
                              <div className="font-black text-sm">{t.name}</div>
                              <div className="text-[10px] font-bold text-slate-400 group-hover:text-white/60">{t.tickerName}</div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Avg Buying Price {(selectedTicker?.currency || editingItem?.tickerDetails?.currency) && (selectedTicker?.currency || editingItem?.tickerDetails?.currency) !== 'INR' ? `(${(selectedTicker?.currency || editingItem?.tickerDetails?.currency)})` : ''}</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-black">
                      {(selectedTicker?.currency || editingItem?.tickerDetails?.currency) === 'USD' ? '$' : (selectedTicker?.currency || editingItem?.tickerDetails?.currency) === 'EUR' ? '€' : '₹'}
                    </span>
                    <input 
                      type="number" step="any" value={buyingPrice} onChange={(e) => setBuyingPrice(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-6 py-4 text-white font-black outline-none focus:ring-2 focus:ring-indigo-500/40"
                      placeholder="0.00" required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Units Owned</label>
                  <input 
                    type="number" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black outline-none focus:ring-2 focus:ring-indigo-500/40"
                    placeholder="1.00" required
                  />
                </div>

                {(selectedTicker || editingItem) && (selectedTicker?.currency || editingItem?.tickerDetails?.currency) !== 'INR' && (
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                      Exchange Rate (To INR)
                    </label>
                    <div className="relative">
                      <input 
                        type="number" step="any" value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black outline-none focus:ring-2 focus:ring-indigo-500/40"
                        placeholder="83.50" required
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 flex gap-4">
                <button type="submit" disabled={submitting} className="flex-grow bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                  {submitting ? "Processing..." : (modalMode === "edit" ? "Commit Changes" : "Save Acquisition")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DailyPriceChartModal
        open={priceModalOpen}
        onClose={() => setPriceModalOpen(false)}
        ticker={priceModalTicker}
        prices={dailyPrices}
        loading={loadingDailyPrices}
      />
    </div>
  );
}
