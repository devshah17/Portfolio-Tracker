"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Radar, Plus, UploadCloud, Trash2, X, FileText, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { dc } from "@/lib/dashboard-theme";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

interface MutualFund {
  _id: string;
  name: string;
  amc: string;
  category: string;
}

export default function FundRadarPage() {
  const [funds, setFunds] = useState<MutualFund[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Fund Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFund, setNewFund] = useState({ name: "", amc: "", category: "Equity" });

  // Upload Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFundId, setUploadFundId] = useState<string | null>(null);
  const [reportMonth, setReportMonth] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchFunds = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/fund-radar`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
      });
      const data = await res.json();
      if (data.success) setFunds(data.data);
    } catch (e) {
      toast.error("Failed to load mutual funds");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFunds();
  }, [fetchFunds]);

  const handleAddFund = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/fund-radar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`
        },
        body: JSON.stringify(newFund),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Fund added to radar");
      setShowAddModal(false);
      setNewFund({ name: "", amc: "", category: "Equity" });
      fetchFunds();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDeleteFund = async (id: string) => {
    if (!confirm("Remove this fund from radar? All its reports will be deleted.")) return;
    try {
      const res = await fetch(`${API_BASE}/fund-radar/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Fund removed");
      fetchFunds();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !uploadFundId || !reportMonth) return toast.error("Please provide all fields");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("reportMonth", reportMonth);

    try {
      const res = await fetch(`${API_BASE}/fund-radar/${uploadFundId}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(data.message);
      setShowUploadModal(false);
      setFile(null);
      setReportMonth("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="dashboard-subpage min-h-full animate-in fade-in space-y-8 px-4 py-8 duration-500 sm:px-10 sm:py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={cn(dc.title, "text-3xl sm:text-4xl flex items-center gap-3")}>
            <Radar className="w-10 h-10 text-emerald-500" />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
              Fund Radar
            </span>
          </h1>
          <p className={cn(dc.subtitle, "mt-1")}>
            Track mutual fund buying and selling patterns via monthly disclosures.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-full font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Track New Fund
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-20"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : funds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center mb-6">
            <Radar className="w-10 h-10 text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-foreground">No funds on radar</h3>
          <p className="text-muted-foreground mt-2 max-w-md">Add a mutual fund and upload its monthly disclosure Excel template to track what institutional money is buying and selling.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {funds.map((fund) => (
            <div key={fund._id} className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-md p-6 hover:shadow-xl hover:border-emerald-500/30 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    {fund.category}
                  </span>
                  <h3 className="text-lg font-bold text-foreground mt-3 leading-tight">{fund.name}</h3>
                  <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">{fund.amc}</p>
                </div>
                <button onClick={() => handleDeleteFund(fund._id)} className="p-2 text-muted-foreground hover:bg-rose-100 dark:hover:bg-rose-950 hover:text-rose-600 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 mt-8">
                <button
                  onClick={() => { setUploadFundId(fund._id); setShowUploadModal(true); }}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
                >
                  <UploadCloud className="w-4 h-4" /> Upload Month
                </button>
                <Link
                  href={`/dashboard/fund-radar/${fund._id}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-foreground text-background font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-foreground/80 transition-colors"
                >
                  Analyze <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-foreground">Track Mutual Fund</h2>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleAddFund} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Fund Name</label>
                <input required value={newFund.name} onChange={e => setNewFund({...newFund, name: e.target.value})} className="w-full mt-1.5 bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500" placeholder="e.g. Parag Parikh Flexi Cap" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">AMC</label>
                <input required value={newFund.amc} onChange={e => setNewFund({...newFund, amc: e.target.value})} className="w-full mt-1.5 bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500" placeholder="e.g. PPFAS" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</label>
                <select value={newFund.category} onChange={e => setNewFund({...newFund, category: e.target.value})} className="w-full mt-1.5 bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500">
                  <option>Equity</option>
                  <option>Debt</option>
                  <option>Hybrid</option>
                  <option>Index</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 mt-2">Add to Radar</button>
            </form>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><UploadCloud className="w-5 h-5 text-emerald-500"/> Upload Portfolio</h2>
              <button onClick={() => {setShowUploadModal(false); setFile(null);}} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleUpload} className="space-y-6">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Report Month</label>
                <input required type="month" value={reportMonth} onChange={e => setReportMonth(e.target.value)} className="w-full mt-1.5 bg-background border border-border rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-emerald-500" />
              </div>

              <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:bg-muted/50 transition-colors relative">
                <input type="file" required accept=".xlsx, .xls, .csv" onChange={e => setFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <FileText className="w-10 h-10 text-emerald-500/50 mx-auto mb-3" />
                <p className="text-sm font-semibold text-foreground">{file ? file.name : "Click or drag to upload report"}</p>
                <p className="text-xs text-muted-foreground mt-1">Supports .xlsx and .csv templates</p>
                {file && <span className="inline-block mt-3 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Selected</span>}
              </div>

              <button disabled={uploading} type="submit" className="w-full bg-emerald-600 disabled:bg-emerald-600/50 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-700 flex justify-center items-center gap-2">
                {uploading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Process & Extract Data"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
