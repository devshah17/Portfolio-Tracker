"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store/store";
import {
  Plus,
  Trash2,
  RefreshCcw,
  Search,
  X,
  ArrowRightLeft,
  ChevronDown,
  Sparkles,
  Calendar,
  Pencil
} from "lucide-react";
import { toast } from "sonner";
import { dc } from "@/lib/dashboard-theme";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

interface Transaction {
  _id: string;
  ticker: {
    _id: string;
    name: string;
    tickerName: string;
    currency: string;
  };
  type: "BUY" | "SELL";
  date: string;
  quantity: number;
  price: number;
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

export default function DashboardTransactionsPage() {
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

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    totalRealisedGain: 0,
    totalUnrealisedGain: 0,
    totalInvested: 0,
    totalCurrentValue: 0
  });
  const [availableFYs, setAvailableFYs] = useState<string[]>([]);
  const [selectedFY, setSelectedFY] = useState<string>("ALL");

  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editingTxnId, setEditingTxnId] = useState<string | null>(null);
  const [selectedTickerId, setSelectedTickerId] = useState("");
  const [type, setType] = useState<"BUY" | "SELL">("BUY");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [exchangeRate, setExchangeRate] = useState("1");
  const [submitting, setSubmitting] = useState(false);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [tickerSearch, setTickerSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const fetchTransactions = async () => {
    if (!getUserId()) return;
    try {
      setRefreshing(true);
      const url = `${API_BASE}/transactions/${getUserId()}/stats${selectedFY !== "ALL" ? `?fy=${selectedFY}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.data.transactions || []);
        setStats(data.data.stats);
        if (availableFYs.length === 0) {
          setAvailableFYs(data.data.availableFYs || []);
        }
      }
    } catch (err: any) {
      toast.error("Could not load transactions");
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
        fetchTransactions();
        fetchTickers();
      } else {
        setLoading(false);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [user, getUserId, selectedFY]); // Refetch when FY changes

  const openModal = () => {
    setSelectedTickerId("");
    setType("BUY");
    setDate(new Date().toISOString().split("T")[0]);
    setPrice("");
    setQuantity("1");
    setExchangeRate("1");
    setModalMode("add");
    setEditingTxnId(null);
  };

  const openEditModal = (txn: Transaction) => {
    setSelectedTickerId(txn.ticker._id);
    setType(txn.type);
    setDate(new Date(txn.date).toISOString().split("T")[0]);
    setPrice(String(txn.price));
    setQuantity(String(txn.quantity));
    setExchangeRate(String(txn.exchangeRate || 1));
    setModalMode("edit");
    setEditingTxnId(txn._id);
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingTxnId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTickerId) return toast.error("Select an asset");
    
    setSubmitting(true);
    try {
      const body = { 
        tickerId: selectedTickerId, 
        type, 
        date, 
        quantity: Number(quantity), 
        price: Number(price),
        exchangeRate: Number(exchangeRate) || 1
      };

      const url = modalMode === "edit" 
        ? `${API_BASE}/transactions/${getUserId()}/${editingTxnId}`
        : `${API_BASE}/transactions/${getUserId()}`;
        
      const res = await fetch(url, {
        method: modalMode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(modalMode === "edit" ? "Failed to update transaction" : "Failed to save transaction");

      toast.success(modalMode === "edit" ? "Transaction updated successfully" : "Transaction mapped successfully");
      closeModal();
      fetchTransactions();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (txnId: string) => {
    if (!confirm("Permanently delete this transaction? This will affect P&L calculations.")) return;
    try {
      const res = await fetch(`${API_BASE}/transactions/${getUserId()}/${txnId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Deletion failed");
      toast.success("Transaction removed");
      fetchTransactions();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
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
                <ArrowRightLeft className="h-4 w-4 text-white" />
              </div>
              <span className={dc.eyebrow}>Tax & mapping</span>
            </div>
            <h1 className={dc.title}>
              Transaction <span className={dc.titleGradient}>ledger</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={selectedFY}
              onChange={(e) => setSelectedFY(e.target.value)}
              className={dc.select}
            >
              <option value="ALL">All Time</option>
              {availableFYs.map(fy => (
                <option key={fy} value={fy}>FY {fy}</option>
              ))}
            </select>
            <button 
              onClick={fetchTransactions}
              className={dc.btnIcon}
            >
              <RefreshCcw className={`w-5 h-5 text-slate-500 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <button 
              onClick={openModal}
              className={dc.btnPrimary}
            >
              <Plus className="h-5 w-5" /> Map transaction
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto space-y-10">
        
        {/* ── Stats Summary ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className={cn(dc.plCardBase, "rounded-[2.5rem] p-10", stats.totalRealisedGain >= 0 ? dc.plCardUp : dc.plCardDown)}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Realised P&L (FIFO)</p>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedFY !== "ALL" ? `FY ${selectedFY}` : "ALL TIME"}</span>
            </div>
            <div className="flex items-baseline gap-3">
              <h3 className={`text-4xl font-black ${stats.totalRealisedGain >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {stats.totalRealisedGain >= 0 ? "+" : "-"}{formatINR(Math.abs(stats.totalRealisedGain))}
              </h3>
            </div>
            <div className={`absolute -right-8 -bottom-8 w-32 h-32 blur-3xl opacity-20 rounded-full ${stats.totalRealisedGain >= 0 ? "bg-emerald-500" : "bg-rose-500"}`} />
          </div>

          <div className={cn(dc.accentCard, "rounded-[2.5rem] p-10 shadow-xl", stats.totalUnrealisedGain >= 0 ? dc.plCardUp : "border-orange-500/20 bg-orange-500/5 dark:border-[oklch(0.55_0.16_55/35%)] dark:bg-[oklch(0.22_0.08_55/40%)]")}>
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Unrealised P&L</p>
            <div className="flex items-baseline gap-3">
              <h3 className={`text-4xl font-black ${stats.totalUnrealisedGain >= 0 ? "text-indigo-600" : "text-orange-600"}`}>
                {stats.totalUnrealisedGain >= 0 ? "+" : "-"}{formatINR(Math.abs(stats.totalUnrealisedGain))}
              </h3>
            </div>
            <div className={`absolute -right-8 -bottom-8 w-32 h-32 blur-3xl opacity-20 rounded-full ${stats.totalUnrealisedGain >= 0 ? "bg-indigo-500" : "bg-orange-500"}`} />
          </div>
        </div>

        {/* ── Transactions Table ──────────────────────────────────────────── */}
        <div className={cn(dc.tableWrap, "rounded-[3rem]")}>
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-slate-500 font-bold tracking-widest uppercase text-[10px]">Loading Ledger...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-24 text-center">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-300">
                <ArrowRightLeft className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">No Transactions Found</h3>
              <p className="text-slate-500 font-medium mb-8">Map your historical buys and sells to calculate your actual P&L.</p>
              <button onClick={openModal} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-200">
                Map First Transaction
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/5 border-b border-slate-200/60">
                    <th className="py-6 px-10 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Asset & Date</th>
                    <th className="py-6 px-10 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Type</th>
                    <th className="py-6 px-10 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Quantity</th>
                    <th className="py-6 px-10 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Price</th>
                    <th className="py-6 px-10 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((txn) => {
                    const isBuy = txn.type === "BUY";
                    return (
                      <tr key={txn._id} className="hover:bg-indigo-50/30 transition-all group">
                        <td className="py-6 px-10">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm font-black transition-all duration-500 ${isBuy ? "bg-indigo-50 text-indigo-600" : "bg-rose-50 text-rose-600"}`}>
                              {txn.ticker?.name?.charAt(0) || "?"}
                            </div>
                            <div>
                              <div className="font-black text-slate-800 tracking-tight">{txn.ticker?.name}</div>
                              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                <Calendar className="w-3 h-3" />
                                {new Date(txn.date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-6 px-10 text-center">
                           <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black tracking-widest uppercase ${isBuy ? "bg-indigo-100 text-indigo-600" : "bg-rose-100 text-rose-600"}`}>
                            {txn.type}
                          </div>
                        </td>
                        <td className="py-6 px-10 text-center font-black text-slate-700">
                          {txn.quantity} <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Units</span>
                        </td>
                        <td className="py-6 px-10 text-right">
                          <div className="font-black text-slate-800">{formatINR(txn.price * (txn.exchangeRate || 1))}</div>
                          {txn.exchangeRate && txn.exchangeRate !== 1 && (
                            <div className="text-[10px] font-bold text-slate-400 uppercase">{txn.ticker?.currency} {txn.price.toFixed(2)}</div>
                          )}
                        </td>
                        <td className="py-6 px-10">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => openEditModal(txn)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(txn._id)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-rose-400 hover:text-rose-600 hover:border-rose-200 transition-all">
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
                  <h2 className="text-2xl font-black text-white">{modalMode === "edit" ? "Edit Transaction" : "Map Transaction"}</h2>
                  <p className="text-slate-400 font-medium text-sm">{modalMode === "edit" ? "Correct your historical trade records." : "Add historical or new trades for tax calculations."}</p>
                </div>
              </div>
              <button onClick={closeModal} className="absolute right-10 top-10 p-2 text-slate-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-10 space-y-8 relative z-10">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  type="button" 
                  onClick={() => setType("BUY")}
                  className={`py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${type === "BUY" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5"}`}
                >
                  Buy
                </button>
                <button 
                  type="button" 
                  onClick={() => setType("SELL")}
                  className={`py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${type === "SELL" ? "bg-rose-600 text-white shadow-lg shadow-rose-500/20" : "bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5"}`}
                >
                  Sell
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Select Asset</label>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Transaction Date</label>
                  <input 
                    type="date" value={date} onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black outline-none focus:ring-2 focus:ring-indigo-500/40"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Units</label>
                  <input 
                    type="number" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black outline-none focus:ring-2 focus:ring-indigo-500/40"
                    placeholder="1.00" required
                  />
                </div>
              </div>

              <div className={`grid grid-cols-1 ${selectedTicker?.currency !== 'INR' ? 'sm:grid-cols-2' : ''} gap-8`}>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                    Execution Price {selectedTicker?.currency ? `(${selectedTicker.currency})` : ''}
                  </label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-black">
                      {selectedTicker?.currency === 'USD' ? '$' : selectedTicker?.currency === 'EUR' ? '€' : '₹'}
                    </span>
                    <input 
                      type="number" step="any" value={price} onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-6 py-4 text-white font-black outline-none focus:ring-2 focus:ring-indigo-500/40"
                      placeholder="0.00" required
                    />
                  </div>
                </div>

                {selectedTicker && selectedTicker.currency !== 'INR' && (
                  <div>
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
                <button type="submit" disabled={submitting} className={`flex-grow font-black py-4 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all ${type === "BUY" ? "bg-indigo-600 text-white shadow-indigo-500/20" : "bg-rose-600 text-white shadow-rose-500/20"}`}>
                  {submitting ? "Processing..." : (modalMode === "edit" ? "Update Transaction" : "Map Transaction")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
