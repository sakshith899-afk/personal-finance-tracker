"use client";

import React, { useState, useMemo } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Area, AreaChart, CartesianGrid
} from "recharts";
import { 
  Calendar, TrendingUp, DollarSign, Target, Search, X, Download, Plus, Filter, 
  ArrowUpDown, Lightbulb 
} from "lucide-react";

// Dynamic date helpers (so real data, not just the Nov sample, shows up)
const TODAY = new Date().toISOString().split("T")[0];
const EARLY_DATE = "2020-01-01";
const MAX_AMOUNT = 1000000;

// Brand colors
const LIME = "#89F336";
const BLUE = "#0000FF";
const pieColors = [LIME, BLUE, "#a78bfa", "#f472b6", "#fb923c", "#60a5fa", "#4ade80", "#facc15"];

// Expanded sample data (closer to your real usage)
const baseTransactions = [
  { id: "1", date: "2025-11-28", description: "tiffin", category: "food", amount: 60 },
  { id: "2", date: "2025-11-28", description: "McDonald's", category: "food", amount: 100 },
  { id: "3", date: "2025-11-28", description: "Xerox", category: "education", amount: 15 },
  { id: "4", date: "2025-11-28", description: "petrol", category: "transport", amount: 545 },
  { id: "5", date: "2025-11-27", description: "tiffin", category: "food", amount: 60 },
  { id: "6", date: "2025-11-26", description: "tiffin", category: "food", amount: 60 },
  { id: "7", date: "2025-11-26", description: "clothing", category: "lifestyle", amount: 545 },
  { id: "8", date: "2025-11-26", description: "Rapido", category: "transport", amount: 50 },
  { id: "9", date: "2025-11-26", description: "bike service", category: "transport", amount: 685 },
  { id: "10", date: "2025-11-26", description: "pizza", category: "food", amount: 190 },
  { id: "11", date: "2025-11-25", description: "tiffin", category: "food", amount: 45 },
  { id: "12", date: "2025-11-25", description: "wonderla", category: "entertainment", amount: 1925 },
  { id: "13", date: "2025-11-24", description: "petrol", category: "transport", amount: 200 },
  { id: "14", date: "2025-11-23", description: "fruits", category: "food", amount: 20 },
  { id: "15", date: "2025-11-23", description: "water bottle", category: "food", amount: 20 },
  { id: "16", date: "2025-11-22", description: "tiffin", category: "food", amount: 60 },
  { id: "17", date: "2025-11-21", description: "biryani", category: "food", amount: 120 },
  { id: "18", date: "2025-11-21", description: "petrol", category: "transport", amount: 470 },
  { id: "19", date: "2025-11-20", description: "tiffin", category: "food", amount: 55 },
  { id: "20", date: "2025-11-18", description: "KFC", category: "food", amount: 243 },
  { id: "21", date: "2025-11-17", description: "Recharge", category: "personal", amount: 860 },
  { id: "22", date: "2025-11-15", description: "spotify", category: "entertainment", amount: 59 },
];

const ALL_CATEGORIES = ["food", "transport", "entertainment", "lifestyle", "education", "personal", "investment", "others"];

type Transaction = {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
};

export default function PersonalFinanceDashboard() {
  // === Advanced Filter State ===
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([...ALL_CATEGORIES]);
  const [dateFrom, setDateFrom] = useState(EARLY_DATE);
  const [dateTo, setDateTo] = useState(TODAY);
  const [minAmount, setMinAmount] = useState(0);
  const [maxAmount, setMaxAmount] = useState(MAX_AMOUNT);
  const [sortBy, setSortBy] = useState<"date" | "amount" | "description">("date");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  // Live data from Supabase
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real transactions from Supabase
  const loadTransactions = React.useCallback(async () => {
    try {
      const res = await fetch("/api/transactions");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setTransactions(data);
        }
      }
    } catch (e) {
      console.error("Failed to load transactions", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // === Live Filtering ===
  const filteredTransactions = useMemo(() => {
    let result = transactions.filter((t) => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategories.includes(t.category);
      const matchesDate = t.date >= dateFrom && t.date <= dateTo;
      const matchesAmount = t.amount >= minAmount && t.amount <= maxAmount;
      return matchesSearch && matchesCategory && matchesDate && matchesAmount;
    });

    // Sorting
    result = [...result].sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (sortBy === "date") {
        valA = a.date;
        valB = b.date;
      }
      if (sortBy === "amount") {
        valA = a.amount;
        valB = b.amount;
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [transactions, searchTerm, selectedCategories, dateFrom, dateTo, minAmount, maxAmount, sortBy, sortDir]);

  // === Derived Data for Charts & Insights (all from filtered) ===
  const totalSpent = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  const uniqueDays = new Set(filteredTransactions.map(t => t.date)).size || 1;
  const avgPerDay = Math.round(totalSpent / uniqueDays);
  const txnCount = filteredTransactions.length;

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTransactions.forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value, pct: totalSpent ? Math.round((value / totalSpent) * 100) : 0 }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, totalSpent]);

  // Daily trend (for line/area)
  const dailyTrend = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTransactions.forEach(t => {
      map[t.date] = (map[t.date] || 0) + t.amount;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({ 
        date: date.slice(5), 
        fullDate: date,
        amount 
      }));
  }, [filteredTransactions]);

  // Top expenses (for bar)
  const topExpenses = useMemo(() => {
    return [...filteredTransactions]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6)
      .map(t => ({
        name: t.description.length > 14 ? t.description.slice(0, 13) + "…" : t.description,
        amount: t.amount,
        category: t.category,
        id: t.id
      }));
  }, [filteredTransactions]);

  // Day of week breakdown
  const dayOfWeek = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const map: Record<number, { day: string; amount: number; count: number }> = {};
    filteredTransactions.forEach(t => {
      const d = new Date(t.date).getDay();
      if (!map[d]) map[d] = { day: days[d], amount: 0, count: 0 };
      map[d].amount += t.amount;
      map[d].count += 1;
    });
    return Object.values(map).sort((a, b) => days.indexOf(a.day) - days.indexOf(b.day));
  }, [filteredTransactions]);

  // === Actionable Insights (computed live) ===
  const foodPct = categoryBreakdown.find(c => c.name === "food")?.pct || 0;
  const topCategory = categoryBreakdown[0];
  const highestSingle = [...filteredTransactions].sort((a,b) => b.amount - a.amount)[0];

  const recurringTiffin = filteredTransactions.filter(t => t.description.toLowerCase().includes("tiffin")).length;
  const avgTiffinCost = recurringTiffin > 0 
    ? Math.round(filteredTransactions.filter(t => t.description.toLowerCase().includes("tiffin")).reduce((s,t)=>s+t.amount,0) / recurringTiffin) 
    : 0;

  const potentialMonthlyFoodCut = Math.round((totalSpent * (foodPct / 100) * 0.25)); // 25% reduction fantasy

  // === Interactive Handlers ===
  const toggleCategory = (cat: string) => {
    if (selectedCategories.length === 1 && selectedCategories[0] === cat) {
      setSelectedCategories([...ALL_CATEGORIES]); // reset if only one left
    } else if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const selectOnlyCategory = (cat: string) => {
    setSelectedCategories([cat]);
  };

  const setQuickDate = (days: number) => {
    const start = new Date();
    start.setDate(start.getDate() - days);
    setDateFrom(start.toISOString().split("T")[0]);
    setDateTo(TODAY);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategories([...ALL_CATEGORIES]);
    setDateFrom(EARLY_DATE);
    setDateTo(TODAY);
    setMinAmount(0);
    setMaxAmount(MAX_AMOUNT);
    setSortBy("date");
    setSortDir("desc");
  };

  const toggleSort = (field: "date" | "amount" | "description") => {
    if (sortBy === field) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortDir(field === "date" ? "desc" : "asc");
    }
  };

  // Click pie / top expense → filter
  const filterByCategory = (cat: string | undefined) => {
    if (!cat) return;
    setSelectedCategories([cat]);
    setSearchTerm("");
  };

  // Add manual expense (demo interactivity)
  const [showAdd, setShowAdd] = useState(false);
  const [newDesc, setNewDesc] = useState("");
  const [newAmount, setNewAmount] = useState(100);
  const [newCat, setNewCat] = useState("food");
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isSaving, setIsSaving] = useState(false);

  const addManual = async () => {
    if (!newDesc || isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: newDate,
          description: newDesc,
          category: newCat,
          amount: newAmount,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert("Could not save: " + (err.error || res.status));
        return;
      }
      await loadTransactions();
      setNewDesc("");
      setNewAmount(100);
      setShowAdd(false);
    } catch (e) {
      console.error(e);
      alert("Could not save. Check your connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!confirm("Delete this transaction? This cannot be undone.")) return;
    // optimistic removal
    setTransactions(prev => prev.filter(t => t.id !== id));
    try {
      const res = await fetch(`/api/transactions?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        alert("Delete failed on server, reloading.");
        await loadTransactions();
      }
    } catch (e) {
      console.error(e);
      await loadTransactions();
    }
  };

  // Export current filtered view as CSV
  const exportCSV = () => {
    const headers = ["Date", "Description", "Category", "Amount"];
    const rows = filteredTransactions.map(t => [t.date, t.description, t.category, t.amount]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${dateFrom}-to-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // === UI ===
  return (
    <div className="min-h-screen text-white bg-[#0a0b14]" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      {/* Glass Header */}
      <header className="glass-strong sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-lime flex items-center justify-center shadow-lg shadow-lime/30">
              <span className="text-black font-bold text-xl tracking-[-1.5px]">P</span>
            </div>
            <div>
              <div className="font-semibold tracking-[-0.8px] text-2xl">Personal Finance</div>
              <div className="text-[10px] text-white/50 -mt-1.5">TRACKER • GLASS</div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="px-4 py-1.5 rounded-2xl glass text-xs text-white/70 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-lime animate-pulse" /> TELEGRAM LIVE
            </div>
            <button 
              onClick={() => setShowAdd(true)}
              className="btn-primary px-5 py-2 flex items-center gap-2 text-sm"
            >
              <Plus size={16} /> Add Manual
            </button>
            <button onClick={exportCSV} className="btn-secondary px-4 py-2 flex items-center gap-2 text-sm">
              <Download size={15} /> Export CSV
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 xl:px-12 py-8">
        {/* Hero */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-6 gap-3">
          <div>
            <div className="uppercase tracking-[3px] text-xs text-white/50 mb-1">WHERE IS YOUR MONEY ACTUALLY GOING?</div>
            <h1 className="text-5xl font-semibold tracking-[-2.2px]">Find the leaks.<br />Cut the waste.</h1>
          </div>
          <div className="text-sm text-white/60 max-w-[260px]">
            Live from your Telegram voice notes • Powered by Gemini 2.5 Flash
          </div>
        </div>

        {/* === ADVANCED FILTERS (the star of the show) === */}
        <div className="glass p-6 mb-8 min-h-[140px] w-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm font-medium text-white/80">
              <Filter size={16} /> ADVANCED FILTERS <span className="text-xs text-white/40">(live updates)</span>
            </div>
            <button onClick={resetFilters} className="btn-ghost px-4 py-1 text-xs flex items-center gap-1">
              <X size={14} /> Reset all
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
            {/* Search */}
            <div className="lg:col-span-4">
              <div className="text-xs text-white/60 mb-1.5">SEARCH</div>
              <div className="relative">
                <Search className="absolute left-4 top-3.5 text-white/40" size={16} />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search items (tiffin, petrol, biryani...)"
                  className="glass w-full pl-11 py-3 rounded-2xl bg-transparent border border-white/15 placeholder:text-white/40 text-sm focus:outline-none focus:border-lime/50"
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="lg:col-span-3">
              <div className="text-xs text-white/60 mb-1.5">DATE RANGE</div>
              <div className="flex gap-2 mb-2">
                {[7, 14, 30].map(d => (
                  <button key={d} onClick={() => setQuickDate(d)} className="pill text-xs px-3 py-1 active:scale-[0.985]">{d}d</button>
                ))}
                <button onClick={() => { setDateFrom(EARLY_DATE); setDateTo(TODAY); }} className="pill text-xs px-3 py-1">All</button>
              </div>
              <div className="flex gap-2">
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="glass flex-1 px-3 py-2 text-sm rounded-2xl bg-transparent border border-white/15" />
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="glass flex-1 px-3 py-2 text-sm rounded-2xl bg-transparent border border-white/15" />
              </div>
            </div>

            {/* Amount Range */}
            <div className="lg:col-span-2">
              <div className="text-xs text-white/60 mb-1.5">AMOUNT</div>
              <div className="flex gap-2">
                <div>
                  <div className="text-[10px] text-white/50">MIN</div>
                  <input type="number" value={minAmount} onChange={e => setMinAmount(Number(e.target.value))} className="glass w-full px-3 py-2 text-sm rounded-2xl bg-transparent border border-white/15" />
                </div>
                <div>
                  <div className="text-[10px] text-white/50">MAX</div>
                  <input type="number" value={maxAmount} onChange={e => setMaxAmount(Number(e.target.value))} className="glass w-full px-3 py-2 text-sm rounded-2xl bg-transparent border border-white/15" />
                </div>
              </div>
            </div>

            {/* Live count */}
            <div className="lg:col-span-3 flex items-end">
              <div className="glass px-5 py-3 rounded-2xl text-sm w-full flex justify-between items-center">
                <div>
                  <span className="text-lime font-semibold text-xl">{txnCount}</span>
                  <span className="text-white/60"> transactions</span>
                </div>
                <div className="text-right">
                  <div className="text-lime font-semibold">₹{totalSpent}</div>
                  <div className="text-[10px] text-white/50 -mt-0.5">shown</div>
                </div>
              </div>
            </div>
          </div>

          {/* Category Multi-Select Pills (very interactive) */}
          <div className="mt-5">
            <div className="text-xs text-white/60 mb-2">CATEGORIES — click to toggle, click twice to isolate</div>
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  onDoubleClick={() => selectOnlyCategory(cat)}
                  className={`pill capitalize ${selectedCategories.includes(cat) ? "active" : ""}`}
                >
                  {cat}
                  {selectedCategories.includes(cat) && <span className="ml-1 opacity-60">×</span>}
                </button>
              ))}
            </div>
            <div className="text-[10px] text-white/40 mt-1.5">Tip: Double-click any pill to filter only that category across all charts &amp; the table.</div>
          </div>
        </div>

        {/* === KPIs (glass) === */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass p-6">
            <div className="flex items-center gap-2 text-xs text-white/60 mb-1">
              <DollarSign size={15} /> TOTAL SPENT (FILTERED)
            </div>
            <div className="text-5xl font-semibold tracking-[-1.8px] text-lime tabular-nums">₹{totalSpent.toLocaleString()}</div>
            <div className="text-xs text-white/50 mt-1">Avg ₹{avgPerDay}/day over {uniqueDays} days</div>
          </div>

          <div className="glass p-6">
            <div className="flex items-center gap-2 text-xs text-white/60 mb-1">
              <TrendingUp size={15} /> AVERAGE DAILY
            </div>
            <div className="text-5xl font-semibold tracking-[-1.8px] text-blue tabular-nums">₹{avgPerDay}</div>
          </div>

          <div className="glass p-6">
            <div className="flex items-center gap-2 text-xs text-white/60 mb-1">
              <Target size={15} /> TRANSACTIONS SHOWN
            </div>
            <div className="text-5xl font-semibold tracking-[-1.8px]">{txnCount}</div>
            <div className="text-xs text-white/50 mt-1">of {transactions.length} total</div>
          </div>

          <div className="glass p-6">
            <div className="flex items-center gap-2 text-xs text-white/60 mb-1">
              <Calendar size={15} /> BIGGEST LEAK
            </div>
            <div className="text-4xl font-semibold tracking-[-1.2px] capitalize text-lime">{topCategory?.name || "food"}</div>
            <div className="text-sm text-white/70 mt-0.5">{topCategory?.pct}% of spend</div>
          </div>
        </div>

        {/* === ACTIONABLE INSIGHTS (the money part) === */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3 px-1 text-sm font-medium text-white/70">
            <Lightbulb size={16} className="text-lime" /> WHERE YOU CAN ACTUALLY REDUCE SPENDING
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Insight 1 */}
            <div onClick={() => filterByCategory("food")} className="glass p-5 insight cursor-pointer">
              <div className="text-lime text-xs mb-1 font-medium">FOOD IS YOUR #1 LEVER</div>
              <div className="text-2xl leading-tight">You spent <span className="font-semibold text-lime">{foodPct}%</span> on food.</div>
              <div className="mt-3 text-sm text-white/70">Cutting just 25% (one less expensive meal/day) could save you ~<span className="text-lime font-medium">₹{potentialMonthlyFoodCut}</span> per month.</div>
            </div>

            {/* Insight 2 */}
            <div onClick={() => setSearchTerm("tiffin")} className="glass p-5 insight-blue cursor-pointer">
              <div className="text-blue text-xs mb-1 font-medium">RECURRING DAILY HABIT</div>
              <div className="text-2xl leading-tight">Tiffin appears <span className="font-semibold">{recurringTiffin}</span> times.</div>
              <div className="mt-3 text-sm text-white/70">Average ₹{avgTiffinCost} per tiffin. That’s ~₹{avgTiffinCost * 25} if you had it every day this month.</div>
            </div>

            {/* Insight 3 */}
            <div className="glass p-5">
              <div className="text-xs mb-1 font-medium text-white/60">HIGHEST SINGLE HIT</div>
              <div className="text-2xl leading-tight font-medium">{highestSingle?.description}</div>
              <div className="text-4xl text-lime font-semibold tracking-tight mt-1">₹{highestSingle?.amount}</div>
              <div className="text-xs text-white/50 mt-2">One big entertainment or lifestyle purchase can erase weeks of small wins. These are the real targets.</div>
            </div>
          </div>
        </div>

        {/* === CHARTS ROW (rich & interactive) === */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-8">
          {/* Category Breakdown - clickable pie */}
          <div className="glass p-6 lg:col-span-2">
            <div className="font-medium tracking-tight mb-4 flex items-center justify-between">
              CATEGORY BREAKDOWN
              <span className="text-xs text-white/50">Click slice to filter</span>
            </div>
            <div className="h-[300px] w-full -mx-2 -mb-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="46%"
                    innerRadius={82}
                    outerRadius={120}
                    paddingAngle={3}
                    onClick={(e) => filterByCategory(e.name)}
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={index} fill={pieColors[index % pieColors.length]} className="cursor-pointer" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-1 mt-1 text-sm">
              {categoryBreakdown.map((c, i) => (
                <div key={i} onClick={() => filterByCategory(c.name)} className="flex items-center gap-2 cursor-pointer hover:text-lime">
                  <div className="w-3 h-3 rounded flex-shrink-0" style={{ background: pieColors[i % pieColors.length] }} />
                  <div className="flex-1 capitalize">{c.name} <span className="text-white/50">• {c.pct}%</span></div>
                  <div className="font-medium">₹{c.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Trend - Area + Line (much nicer than plain bar) */}
          <div className="glass p-6 lg:col-span-3">
            <div className="font-medium tracking-tight mb-3">SPENDING OVER TIME</div>
            <div className="h-[300px] w-full -mx-4 -mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="date" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                  <Tooltip />
                  <Area type="natural" dataKey="amount" stroke={LIME} fill={LIME} fillOpacity={0.15} />
                  <Line type="natural" dataKey="amount" stroke={BLUE} strokeWidth={2.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Individual Expenses */}
          <div className="glass p-6 lg:col-span-3">
            <div className="font-medium tracking-tight mb-4">YOUR BIGGEST SINGLE EXPENSES</div>
            <div className="space-y-2">
              {topExpenses.map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => filterByCategory(item.category)}
                  className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 cursor-pointer border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs px-2 py-px rounded bg-white/10 text-white/60">{item.category}</div>
                  </div>
                  <div className="font-semibold text-lime tabular-nums">₹{item.amount}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Day of Week Heat */}
          <div className="glass p-6 lg:col-span-2">
            <div className="font-medium tracking-tight mb-4">SPEND BY DAY OF WEEK</div>
            <div className="h-[260px] w-full -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayOfWeek}>
                  <XAxis dataKey="day" tick={{ fill: '#a1a1aa' }} />
                  <YAxis tick={{ fill: '#a1a1aa' }} />
                  <Tooltip />
                  <Bar dataKey="amount" fill={BLUE} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-xs text-white/50 mt-2">Weekends and entertainment spikes often hide the biggest opportunities.</div>
          </div>
        </div>

        {/* === INTERACTIVE TRANSACTIONS TABLE === */}
        <div className="glass p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="font-medium tracking-tight">Filtered Transactions ({filteredTransactions.length})</div>
            <div className="text-xs text-white/50">Click column headers to sort • Click category to filter</div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/60 border-b border-white/10 bg-white/5">
                  <th onClick={() => toggleSort("date")} className="px-5 py-3 text-left cursor-pointer hover:text-white select-none">Date {sortBy === "date" && (sortDir === "desc" ? "↓" : "↑")}</th>
                  <th onClick={() => toggleSort("description")} className="px-5 py-3 text-left cursor-pointer hover:text-white select-none">Item {sortBy === "description" && (sortDir === "desc" ? "↓" : "↑")}</th>
                  <th className="px-5 py-3 text-left">Category</th>
                  <th onClick={() => toggleSort("amount")} className="px-5 py-3 text-right cursor-pointer hover:text-white select-none">Amount {sortBy === "amount" && (sortDir === "desc" ? "↓" : "↑")}</th>
                  <th className="px-5 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-white/5">
                      <td className="px-5 py-3 text-white/70 tabular-nums">{t.date}</td>
                      <td className="px-5 py-3 font-medium">{t.description}</td>
                      <td className="px-5 py-3">
                        <span onClick={() => filterByCategory(t.category)} className="pill text-xs active:scale-95 inline-block cursor-pointer">
                          {t.category}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-medium tabular-nums text-lime">₹{t.amount}</td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <button onClick={() => filterByCategory(t.category)} className="text-xs text-white/40 hover:text-lime mr-3">filter</button>
                        <button onClick={() => deleteTransaction(t.id)} className="text-xs text-white/40 hover:text-red-400">delete</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-white/50">No transactions match your current filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer actions + note */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between text-xs text-white/50 px-1">
          <div>
            Live data from your database. Send a voice note via Telegram or use Add expense,
            and it appears here instantly.
          </div>
          <button onClick={resetFilters} className="btn-ghost px-5 py-2 text-xs">Clear everything &amp; see full picture</button>
        </div>
      </div>

      {/* Add Manual Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]" onClick={() => setShowAdd(false)}>
          <div className="glass p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="font-semibold text-xl mb-5 tracking-tight">Add expense</div>

            <input
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="Description (shawarma, petrol...)"
              className="glass w-full mb-3 px-4 py-3 rounded-2xl"
            />

            <div className="grid grid-cols-2 gap-3 mb-3">
              <input type="number" value={newAmount} onChange={e => setNewAmount(Number(e.target.value))} className="glass px-4 py-3 rounded-2xl" placeholder="Amount" />
              <select value={newCat} onChange={e => setNewCat(e.target.value)} className="glass px-4 py-3 rounded-2xl">
                {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="glass w-full mb-4 px-4 py-3 rounded-2xl" />

            <div className="flex gap-3">
              <button onClick={() => setShowAdd(false)} className="btn-ghost flex-1 py-3">Cancel</button>
              <button onClick={addManual} disabled={isSaving} className="btn-primary flex-1 py-3 disabled:opacity-50">{isSaving ? "Saving..." : "Save expense"}</button>
            </div>
            <div className="text-[10px] text-center mt-3 text-white/40">Saved to your database. Appears everywhere instantly.</div>
          </div>
        </div>
      )}
    </div>
  );
}
