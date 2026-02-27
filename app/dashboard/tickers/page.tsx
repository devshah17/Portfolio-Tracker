"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpRight,
  Loader2,
  Plus,
  Trash2,
  PencilLine,
} from "lucide-react";

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
  const [error, setError] = useState<string | null>(null);

  const fetchTickers = async () => {
    if (!API_BASE) return;
    try {
      setListLoading(true);
      const res = await fetch(`${API_BASE}/tickers`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch tickers");
      }
      setTickers(data.data || []);
    } catch (err: any) {
      setError(err.message || "Something went wrong while loading tickers");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchTickers();
  }, []);

  const handleChange = (
    field: keyof FormState,
    value: string | TickerType,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(initialFormState);
    setEditingId(null);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!API_BASE) return;

    try {
      setLoading(true);
      setError(null);

      const url = editingId
        ? `${API_BASE}/tickers/${editingId}`
        : `${API_BASE}/tickers`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to save ticker");
      }

      await fetchTickers();
      resetForm();
    } catch (err: any) {
      setError(err.message || "Something went wrong while saving ticker");
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
  };

  const handleDelete = async (id: string) => {
    if (!API_BASE) return;
    if (!confirm("Are you sure you want to delete this ticker?")) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE}/tickers/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete ticker");
      }

      await fetchTickers();
      if (editingId === id) {
        resetForm();
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong while deleting ticker");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-indigo-500/10 text-emerald-700 border-emerald-200">
              Universe of tickers
            </Badge>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
            Manage instruments you care about
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            Curate stocks and mutual funds once, then reuse them across
            portfolios. Add currency and market so analytics stay context-aware.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)]">
        <Card className="border-slate-200/80 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-slate-50 shadow-lg shadow-slate-900/30">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm md:text-base">
              {editingId ? "Edit ticker" : "Add new ticker"}
              <span className="text-[0.7rem] font-normal text-slate-400">
                Name, symbol, type, currency & market
              </span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Keep your ticker universe clean and standardized for downstream
              portfolio analytics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="ticker-name"
                    className="text-xs font-medium text-slate-200"
                  >
                    Display name
                  </label>
                  <Input
                    id="ticker-name"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="e.g. Amazon Inc."
                    className="border-slate-600 bg-slate-900/40 text-slate-50 placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="ticker-symbol"
                    className="text-xs font-medium text-slate-200"
                  >
                    Ticker symbol
                  </label>
                  <Input
                    id="ticker-symbol"
                    value={form.tickerName}
                    onChange={(e) =>
                      handleChange("tickerName", e.target.value.toUpperCase())
                    }
                    placeholder="e.g. AMZN, RELIANCE.NS"
                    className="border-slate-600 bg-slate-900/40 text-slate-50 placeholder:text-slate-500 uppercase"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="ticker-type"
                    className="text-xs font-medium text-slate-200"
                  >
                    Type
                  </label>
                  <Select
                    value={form.type}
                    onValueChange={(value) =>
                      handleChange("type", value as TickerType)
                    }
                  >
                    <SelectTrigger className="w-full border-slate-600 bg-slate-900/40 text-slate-50">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Stock">Stock</SelectItem>
                      <SelectItem value="MF">Mutual Fund</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="ticker-currency"
                    className="text-xs font-medium text-slate-200"
                  >
                    Currency
                  </label>
                  <Select
                    value={form.currency}
                    onValueChange={(value) => handleChange("currency", value)}
                  >
                    <SelectTrigger className="w-full border-slate-600 bg-slate-900/40 text-slate-50">
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="ticker-market"
                    className="text-xs font-medium text-slate-200"
                  >
                    Market
                  </label>
                  <Select
                    value={form.market}
                    onValueChange={(value) => handleChange("market", value)}
                  >
                    <SelectTrigger className="w-full border-slate-600 bg-slate-900/40 text-slate-50">
                      <SelectValue placeholder="Market" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NSE">NSE</SelectItem>
                      <SelectItem value="BSE">BSE</SelectItem>
                      <SelectItem value="NASDAQ">NASDAQ</SelectItem>
                      <SelectItem value="NYSE">NYSE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {error && (
                <p className="text-xs font-medium text-red-300">{error}</p>
              )}

              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  size="sm"
                  className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span>{editingId ? "Save changes" : "Add ticker"}</span>
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-slate-500 bg-slate-900/40 text-slate-100 hover:bg-slate-800"
                    onClick={resetForm}
                    disabled={loading}
                  >
                    Cancel edit
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm md:text-base">
              Saved tickers
              <span className="text-[0.7rem] font-normal text-slate-500">
                {tickers.length} configured
              </span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Click a row&apos;s edit icon to tweak details or remove it from
              your universe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {listLoading ? (
              <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading tickers...
              </div>
            ) : tickers.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center space-y-2 text-center text-xs text-muted-foreground">
                <p>No tickers yet.</p>
                <p>Add your first stock or mutual fund on the left.</p>
              </div>
            ) : (
              <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1 text-xs">
                <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto] items-center gap-3 rounded-md bg-slate-50 px-3 py-2 font-medium text-slate-600">
                  <span>Name</span>
                  <span>Ticker</span>
                  <span>Type</span>
                  <span>Currency</span>
                  <span>Market</span>
                  <span className="text-right">Actions</span>
                </div>
                {tickers.map((ticker) => (
                  <div
                    key={ticker._id}
                    className="group grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto] items-center gap-3 rounded-md border border-slate-100 bg-white px-3 py-2 text-[0.75rem] shadow-xs transition hover:border-emerald-200 hover:bg-emerald-50/40"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900">
                        {ticker.name}
                      </span>
                      <span className="text-[0.7rem] text-slate-500">
                        {ticker.type === "Stock" ? "Equity" : "Mutual fund"}
                      </span>
                    </div>
                    <span className="font-mono text-[0.7rem] text-slate-800">
                      {ticker.tickerName}
                    </span>
                    <span>
                      <Badge
                        variant="outline"
                        className="border-slate-200 bg-slate-50 text-[0.7rem] font-medium"
                      >
                        {ticker.type}
                      </Badge>
                    </span>
                    <span className="text-slate-700">{ticker.currency}</span>
                    <span className="text-slate-700">{ticker.market}</span>
                    <div className="flex justify-end gap-1.5">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 border-slate-200 text-slate-700 hover:border-emerald-400 hover:bg-emerald-50"
                        onClick={() => handleEdit(ticker)}
                        disabled={loading}
                      >
                        <PencilLine className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 border-slate-200 text-red-600 hover:border-red-400 hover:bg-red-50"
                        onClick={() => handleDelete(ticker._id)}
                        disabled={loading}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

