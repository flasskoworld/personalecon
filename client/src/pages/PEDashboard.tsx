// Personal Economy Pro — Main Dashboard
// Tabs: Overview | Debt Tracker | Budget | Savings & Investments | Game Plan
// Design: Dark Premium Fintech | Syne + Inter | Emerald/Gold/Indigo accents

import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useStore } from "@/hooks/usePEStore";
import {
  sortDebtsByStrategy, simulatePayoff, getDebtFreeDate, formatCurrency,
  buildSavingsProjection, monthlyInterestCost, Debt, Investment,
} from "@/lib/peStore";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Target,
  Flame, Snowflake, Edit3, X, RotateCcw, ChevronRight, DollarSign,
  BarChart3, Shield, Layers, ArrowUpRight, ArrowDownRight, Plus, Trash2,
} from "lucide-react";
import { toast } from "sonner";

// ── Shared styles ─────────────────────────────────────────────────────────────
const card = "rounded-2xl border border-white/8 bg-white/3 p-5";
const cardDark = "rounded-2xl border border-white/8 bg-[#0d1117] p-5";
const inputClass = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all";
const labelClass = "block text-xs text-slate-400 mb-1 font-medium";

// ── Live Clock Hook ────────────────────────────────────────────────────────────
function useLiveClock(firstPayday: string, payFrequency: string) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const getNextPayday = () => {
    if (!firstPayday) return null;
    const base = new Date(firstPayday + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let next = new Date(base);
    const periodDays = payFrequency === "weekly" ? 7 : payFrequency === "biweekly" ? 14 : payFrequency === "monthly" ? 30 : 15;
    while (next < today) {
      next.setDate(next.getDate() + periodDays);
    }
    return next;
  };

  const nextPayday = getNextPayday();
  const diffMs = nextPayday ? nextPayday.getTime() - now.getTime() : 0;
  const isToday = diffMs >= 0 && diffMs < 86400000;
  const days = Math.floor(diffMs / 86400000);
  const hours = Math.floor((diffMs % 86400000) / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  const secs = Math.floor((diffMs % 60000) / 1000);

  const monthProgress = Math.round((now.getDate() / new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()) * 100);

  return { now, nextPayday, days, hours, mins, secs, isToday, monthProgress };
}

// ── Animated Number ────────────────────────────────────────────────────────────
function AnimNum({ value, prefix = "$", className = "" }: { value: number; prefix?: string; className?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(value);
  useEffect(() => {
    const start = ref.current;
    const end = value;
    const dur = 600;
    const startTime = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - startTime) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + (end - start) * ease));
      if (p < 1) requestAnimationFrame(tick);
      else ref.current = end;
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <span className={className}>{prefix}{display.toLocaleString()}</span>;
}

// ── Debt Edit Modal ────────────────────────────────────────────────────────────
function DebtEditModal({ debt, onSave, onClose, currency }: {
  debt: Debt; onSave: (fields: Partial<Debt>) => void; onClose: () => void; currency: string;
}) {
  const [name, setName] = useState(debt.name);
  const [balance, setBalance] = useState(String(debt.balance));
  const [apr, setApr] = useState(String(debt.apr));
  const [minPay, setMinPay] = useState(String(debt.minimumPayment));
  const [paid, setPaid] = useState(String(debt.paid));

  const save = () => {
    onSave({ name, balance: Number(balance), apr: Number(apr), minimumPayment: Number(minPay), paid: Number(paid) });
    onClose();
    toast.success("Debt updated");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1117] p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Edit Debt</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div><label className={labelClass}>Debt Name</label><input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Current Balance</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{currency}</span>
                <input className={inputClass + " pl-6"} type="number" value={balance} onChange={(e) => setBalance(e.target.value)} /></div></div>
            <div><label className={labelClass}>APR %</label>
              <div className="relative"><input className={inputClass + " pr-6"} type="number" value={apr} onChange={(e) => setApr(e.target.value)} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span></div></div>
            <div><label className={labelClass}>Min. Payment</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{currency}</span>
                <input className={inputClass + " pl-6"} type="number" value={minPay} onChange={(e) => setMinPay(e.target.value)} /></div></div>
            <div><label className={labelClass}>Total Paid So Far</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{currency}</span>
                <input className={inputClass + " pl-6"} type="number" value={paid} onChange={(e) => setPaid(e.target.value)} /></div></div>
          </div>
          {Number(balance) > 0 && Number(apr) > 0 && (
            <div className="rounded-xl bg-rose-500/8 border border-rose-500/15 p-3 text-xs text-rose-300">
              Monthly interest: <strong>{currency}{((Number(balance) * Number(apr) / 100) / 12).toFixed(2)}</strong>
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-white/10 text-sm text-slate-400 hover:text-white transition-all">Cancel</button>
          <button onClick={save} className="flex-1 py-2.5 rounded-lg text-sm font-bold text-black transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

// ── Investment Edit Modal ──────────────────────────────────────────────────────
function InvestEditModal({ inv, onSave, onClose, currency }: {
  inv: Investment; onSave: (fields: Partial<Investment>) => void; onClose: () => void; currency: string;
}) {
  const [name, setName] = useState(inv.name);
  const [currentValue, setCurrentValue] = useState(String(inv.currentValue));
  const [amountInvested, setAmountInvested] = useState(String(inv.amountInvested));
  const [monthlyContrib, setMonthlyContrib] = useState(String(inv.monthlyContribution));

  const save = () => {
    onSave({ name, currentValue: Number(currentValue), amountInvested: Number(amountInvested), monthlyContribution: Number(monthlyContrib) });
    onClose();
    toast.success("Investment updated");
  };

  const gain = Number(currentValue) - Number(amountInvested);
  const gainPct = Number(amountInvested) > 0 ? (gain / Number(amountInvested)) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1117] p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Edit Investment</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div><label className={labelClass}>Name / Ticker</label><input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Current Value</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{currency}</span>
                <input className={inputClass + " pl-6"} type="number" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} /></div></div>
            <div><label className={labelClass}>Cost Basis (invested)</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{currency}</span>
                <input className={inputClass + " pl-6"} type="number" value={amountInvested} onChange={(e) => setAmountInvested(e.target.value)} /></div></div>
            <div className="col-span-2"><label className={labelClass}>Monthly Contribution</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{currency}</span>
                <input className={inputClass + " pl-6"} type="number" value={monthlyContrib} onChange={(e) => setMonthlyContrib(e.target.value)} /></div></div>
          </div>
          {Number(amountInvested) > 0 && (
            <div className={`rounded-xl p-3 text-xs border ${gain >= 0 ? "bg-emerald-500/8 border-emerald-500/15 text-emerald-300" : "bg-rose-500/8 border-rose-500/15 text-rose-300"}`}>
              Unrealized {gain >= 0 ? "gain" : "loss"}: <strong>{currency}{Math.abs(gain).toFixed(2)}</strong> ({gainPct.toFixed(1)}%)
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-white/10 text-sm text-slate-400 hover:text-white transition-all">Cancel</button>
          <button onClick={save} className="flex-1 py-2.5 rounded-lg text-sm font-bold text-black transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [, navigate] = useLocation();
  const { state, computed, makePayment, updateDebt, addSavings, updateInvestment, addInvestment, removeInvestment, setStrategy, resetAll } = useStore();
  const [activeTab, setActiveTab] = useState<"overview" | "debt" | "budget" | "savings" | "plan">("overview");
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [editingInvest, setEditingInvest] = useState<Investment | null>(null);
  const [payAmount, setPayAmount] = useState<Record<string, string>>({});
  const [saveAmount, setSaveAmount] = useState("");
  const [showReset, setShowReset] = useState(false);

  const clock = useLiveClock(state.profile?.firstPayday || "", state.profile?.payFrequency || "biweekly");
  const currency = state.profile?.currency || "$";

  // Redirect to landing if no setup
  useEffect(() => {
    if (!state.setupComplete) navigate("/pro");
  }, [state.setupComplete]);

  if (!state.setupComplete || !state.profile) return null;

  const { monthlyIncome, totalExpenses, totalDebt, totalMonthlyInterest, monthlyLeftover, totalInvestmentValue, totalInvestmentGain, netWorth } = computed;

  const sortedDebts = sortDebtsByStrategy(state.debts, state.strategy);
  const debtBudget = Math.max(0, monthlyLeftover * 0.4);
  const savingsBudget = Math.max(0, monthlyLeftover * 0.4);
  const snowball = simulatePayoff(state.debts, debtBudget, "snowball");
  const avalanche = simulatePayoff(state.debts, debtBudget, "avalanche");
  const currentSim = state.strategy === "avalanche" ? avalanche : snowball;
  const savingsProjection = buildSavingsProjection(savingsBudget, state.totalSaved, 12);

  const TABS = [
    { id: "overview", label: "Overview", icon: <BarChart3 size={15} /> },
    { id: "debt", label: "Debt Tracker", icon: <Shield size={15} /> },
    { id: "budget", label: "Budget", icon: <Layers size={15} /> },
    { id: "savings", label: "Savings & Investments", icon: <TrendingUp size={15} /> },
    { id: "plan", label: "Game Plan", icon: <Target size={15} /> },
  ];

  return (
    <div className="min-h-screen bg-[#080a0f] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* HEADER */}
      <header className="border-b border-white/6 sticky top-0 z-40" style={{ background: "rgba(8,10,15,0.95)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md flex items-center justify-center text-sm font-black" style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff" }}>£</div>
            <span className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>Personal Economy</span>
            {state.isDemo && <span className="text-xs bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono">DEMO</span>}
          </div>
          <div className="hidden md:flex items-center gap-4 text-xs text-slate-500 font-mono">
            <span>{clock.now.toLocaleTimeString()}</span>
            <span className="text-white/20">|</span>
            {clock.isToday ? (
              <span className="text-emerald-400 font-bold animate-pulse">💸 PAYDAY TODAY</span>
            ) : (
              <span>Next pay: <span className="text-slate-300">{clock.days}d {clock.hours}h {clock.mins}m</span></span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReset(true)}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white border border-white/8 hover:border-white/20 px-3 py-1.5 rounded-lg transition-all"
            >
              <RotateCcw size={12} /> Reset
            </button>
            <button
              onClick={() => navigate("/pro")}
              className="text-xs text-slate-500 hover:text-white border border-white/8 hover:border-white/20 px-3 py-1.5 rounded-lg transition-all"
            >
              ← Home
            </button>
          </div>
        </div>
      </header>

      {/* HERO STRIP */}
      <div className="border-b border-white/6 py-5" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.05), rgba(99,102,241,0.03))" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-black" style={{ fontFamily: "'Syne', sans-serif" }}>{state.profile.name}'s Economy</h1>
              <p className="text-xs text-slate-500 mt-0.5">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 mb-0.5">Net Worth</div>
              <div className={`text-2xl font-black ${netWorth >= 0 ? "text-emerald-400" : "text-rose-400"}`} style={{ fontFamily: "'Syne', sans-serif" }}>
                <AnimNum value={netWorth} prefix={currency} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Monthly Income", value: monthlyIncome, color: "text-white", icon: <DollarSign size={14} /> },
              { label: "Total Debt", value: totalDebt, color: "text-rose-400", icon: <AlertTriangle size={14} /> },
              { label: "Savings Stack", value: state.totalSaved, color: "text-emerald-400", icon: <Target size={14} /> },
              { label: "Portfolio Value", value: totalInvestmentValue, color: "text-indigo-400", icon: <TrendingUp size={14} /> },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-white/8 bg-white/3 px-4 py-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">{s.icon}{s.label}</div>
                <div className={`text-xl font-black ${s.color}`} style={{ fontFamily: "'Syne', sans-serif" }}>
                  <AnimNum value={s.value} prefix={currency} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="border-b border-white/6 sticky top-14 z-30" style={{ background: "rgba(8,10,15,0.95)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as typeof activeTab)}
                className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                  activeTab === t.id
                    ? "border-emerald-500 text-white"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Cash flow alert */}
            {monthlyLeftover > 0 ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-start gap-3">
                <CheckCircle2 size={18} className="text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-white">You have <span className="text-emerald-400">{currency}{Math.round(monthlyLeftover).toLocaleString()}/mo</span> left after expenses.</div>
                  <div className="text-xs text-slate-400 mt-0.5">Recommended split: {currency}{Math.round(savingsBudget).toLocaleString()} to savings · {currency}{Math.round(debtBudget).toLocaleString()} to debt · {currency}{Math.round(monthlyLeftover * 0.2).toLocaleString()} buffer</div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 flex items-start gap-3">
                <AlertTriangle size={18} className="text-rose-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-white">Expenses exceed income by <span className="text-rose-400">{currency}{Math.abs(Math.round(monthlyLeftover)).toLocaleString()}/mo</span></div>
                  <div className="text-xs text-slate-400 mt-0.5">Review your Budget tab to find cuts. Every dollar freed up goes directly to your plan.</div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Cash Flow Breakdown */}
              <div className={card}>
                <h3 className="text-sm font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>Cash Flow Breakdown</h3>
                <div className="space-y-2.5">
                  {[
                    { label: "Monthly Income", value: monthlyIncome, color: "#10b981", pct: 100 },
                    { label: "Fixed Expenses", value: totalExpenses, color: "#f59e0b", pct: Math.min(100, (totalExpenses / monthlyIncome) * 100) },
                    { label: "Interest Bleed", value: totalMonthlyInterest, color: "#ef4444", pct: Math.min(100, (totalMonthlyInterest / monthlyIncome) * 100) },
                    { label: "Available", value: Math.max(0, monthlyLeftover), color: "#6366f1", pct: Math.max(0, Math.min(100, (monthlyLeftover / monthlyIncome) * 100)) },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">{row.label}</span>
                        <span style={{ color: row.color }} className="font-mono font-semibold">{currency}{Math.round(row.value).toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${row.pct}%`, background: row.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strategy Comparison */}
              {state.debts.length > 0 && (
                <div className={card}>
                  <h3 className="text-sm font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>Payoff Strategy Comparison</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "snowball", label: "Snowball ❄️", data: snowball, color: "#6366f1", desc: "Smallest balance first" },
                      { key: "avalanche", label: "Avalanche 🔥", data: avalanche, color: "#10b981", desc: "Highest APR first" },
                    ].map((s) => (
                      <div
                        key={s.key}
                        className={`rounded-xl border p-3 cursor-pointer transition-all ${state.strategy === s.key ? "border-opacity-60" : "border-white/8 opacity-60 hover:opacity-80"}`}
                        style={{ borderColor: state.strategy === s.key ? s.color : undefined, background: state.strategy === s.key ? s.color + "10" : "rgba(255,255,255,0.02)" }}
                        onClick={() => setStrategy(s.key as "snowball" | "avalanche")}
                      >
                        <div className="text-xs font-bold mb-2" style={{ color: s.color }}>{s.label}</div>
                        <div className="text-xs text-slate-500 mb-2">{s.desc}</div>
                        <div className="text-lg font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{s.data.months}mo</div>
                        <div className="text-xs text-slate-400">to debt-free</div>
                        <div className="text-xs text-slate-500 mt-1">{currency}{Math.round(s.data.totalInterest).toLocaleString()} total interest</div>
                        {state.strategy === s.key && <div className="text-xs font-semibold mt-2" style={{ color: s.color }}>✓ Active</div>}
                      </div>
                    ))}
                  </div>
                  {avalanche.totalInterest < snowball.totalInterest && (
                    <div className="mt-3 text-xs text-emerald-400 bg-emerald-500/8 border border-emerald-500/15 rounded-lg p-2.5">
                      💡 Avalanche saves you <strong>{currency}{Math.round(snowball.totalInterest - avalanche.totalInterest).toLocaleString()}</strong> and {snowball.months - avalanche.months} months vs. Snowball
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Savings projection chart */}
            <div className={card}>
              <h3 className="text-sm font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>12-Month Savings Projection</h3>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={savingsProjection}>
                  <defs>
                    <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${currency}${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`${currency}${v.toLocaleString()}`, "Savings"]} contentStyle={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={2} fill="url(#sg)" />
                  {state.profile?.savingsGoal && (
                    <Area type="monotone" dataKey={() => state.profile!.savingsGoal} stroke="#d4af37" strokeWidth={1} strokeDasharray="4 4" fill="none" name="Goal" />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── DEBT TRACKER TAB ─────────────────────────────────────────────── */}
        {activeTab === "debt" && (
          <div className="space-y-6">
            {state.debts.length === 0 ? (
              <div className="text-center py-20">
                <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>No debts tracked</h3>
                <p className="text-slate-400 text-sm">You're either debt-free or haven't added any debts yet.</p>
              </div>
            ) : (
              <>
                {/* Strategy toggle */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">Strategy:</span>
                  {(["snowball", "avalanche"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStrategy(s)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        state.strategy === s
                          ? s === "avalanche" ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400" : "bg-indigo-500/15 border-indigo-500/40 text-indigo-400"
                          : "border-white/10 text-slate-500 hover:border-white/20"
                      }`}
                    >
                      {s === "avalanche" ? <Flame size={12} /> : <Snowflake size={12} />}
                      {s === "avalanche" ? "Avalanche 🔥" : "Snowball ❄️"}
                    </button>
                  ))}
                  <span className="text-xs text-slate-600 ml-2">Debt-free by: <span className="text-white">{getDebtFreeDate(currentSim.months)}</span></span>
                </div>

                {/* Interest bleed bar */}
                {totalMonthlyInterest > 0 && (
                  <div className="rounded-xl border border-rose-500/15 bg-rose-500/5 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm text-rose-300 font-semibold">
                        <Flame size={15} /> You're bleeding <span className="text-rose-400">{currency}{Math.round(totalMonthlyInterest).toLocaleString()}/month</span> in interest
                      </div>
                    </div>
                    <div className="space-y-2">
                      {state.debts.filter((d) => d.apr > 0 && d.balance > 0).sort((a, b) => monthlyInterestCost(b) - monthlyInterestCost(a)).map((d) => (
                        <div key={d.id} className="flex items-center gap-3">
                          <div className="w-24 text-xs text-slate-400 truncate">{d.name}</div>
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, (monthlyInterestCost(d) / totalMonthlyInterest) * 100)}%`, background: d.color }} />
                          </div>
                          <div className="text-xs text-rose-300 font-mono w-16 text-right">{currency}{monthlyInterestCost(d).toFixed(2)}/mo</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Debt cards */}
                <div className="space-y-4">
                  {sortedDebts.map((debt, idx) => {
                    const progress = debt.originalBalance > 0 ? Math.min(100, (debt.paid / (debt.originalBalance)) * 100) : 0;
                    const isPaidOff = debt.balance <= 0;
                    const isTarget = idx === 0 && !isPaidOff;
                    return (
                      <div
                        key={debt.id}
                        className={`rounded-2xl border p-5 transition-all ${isTarget ? "border-opacity-40" : "border-white/8"} ${isPaidOff ? "opacity-50" : ""}`}
                        style={{ borderColor: isTarget ? debt.color : undefined, background: isTarget ? debt.color + "08" : "rgba(255,255,255,0.02)" }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: debt.color }} />
                            <div>
                              <div className="font-bold text-white text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>{debt.name}</div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {debt.apr > 0 ? `${debt.apr}% APR · ${currency}${monthlyInterestCost(debt).toFixed(2)}/mo interest` : "0% APR — no interest"}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isTarget && !isPaidOff && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: debt.color + "20", color: debt.color }}>TARGET</span>}
                            {isPaidOff && <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">PAID OFF ✓</span>}
                            <button onClick={() => setEditingDebt(debt)} className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all">
                              <Edit3 size={13} />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-end justify-between mb-3">
                          <div>
                            <div className="text-2xl font-black" style={{ color: isPaidOff ? "#10b981" : debt.color, fontFamily: "'Syne', sans-serif" }}>
                              {currency}{Math.round(debt.balance).toLocaleString()}
                            </div>
                            <div className="text-xs text-slate-500">remaining · min. {currency}{debt.minimumPayment}/mo</div>
                          </div>
                          {debt.paid > 0 && (
                            <div className="text-right">
                              <div className="text-sm font-bold text-emerald-400">{currency}{Math.round(debt.paid).toLocaleString()} paid</div>
                              <div className="text-xs text-slate-500">{progress.toFixed(0)}% cleared</div>
                            </div>
                          )}
                        </div>

                        <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-4">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, background: debt.color }} />
                        </div>

                        {!isPaidOff && (
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{currency}</span>
                              <input
                                className={inputClass + " pl-6 py-2"}
                                type="number"
                                placeholder={`Payment amount (min ${currency}${debt.minimumPayment})`}
                                value={payAmount[debt.id] || ""}
                                onChange={(e) => setPayAmount((p) => ({ ...p, [debt.id]: e.target.value }))}
                              />
                            </div>
                            <button
                              onClick={() => {
                                const amt = Number(payAmount[debt.id]);
                                if (!amt || amt <= 0) { toast.error("Enter a payment amount"); return; }
                                makePayment(debt.id, amt);
                                setPayAmount((p) => ({ ...p, [debt.id]: "" }));
                                toast.success(`${currency}${amt} payment logged on ${debt.name}`);
                              }}
                              className="px-4 py-2 rounded-lg text-sm font-bold text-black transition-all hover:opacity-90"
                              style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                            >
                              Log Payment
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── BUDGET TAB ───────────────────────────────────────────────────── */}
        {activeTab === "budget" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Pie chart */}
              <div className={card}>
                <h3 className="text-sm font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>Spending Breakdown</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={state.expenses} dataKey="amount" nameKey="label" cx="50%" cy="50%" outerRadius={80} innerRadius={50}>
                      {state.expenses.map((e, i) => (
                        <Cell key={e.id} fill={["#10b981", "#f59e0b", "#6366f1", "#ec4899", "#14b8a6", "#f97316", "#8b5cf6", "#06b6d4"][i % 8]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`${currency}${v.toLocaleString()}`, ""]} contentStyle={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Essential vs non-essential */}
              <div className={card}>
                <h3 className="text-sm font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>Essential vs. Cuttable</h3>
                {(() => {
                  const essential = state.expenses.filter((e) => e.isEssential).reduce((s, e) => s + e.amount, 0);
                  const nonEssential = state.expenses.filter((e) => !e.isEssential).reduce((s, e) => s + e.amount, 0);
                  return (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">Essential (fixed)</span><span className="text-white font-mono">{currency}{Math.round(essential).toLocaleString()}</span></div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (essential / monthlyIncome) * 100)}%` }} /></div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">Non-essential (cuttable)</span><span className="text-rose-400 font-mono">{currency}{Math.round(nonEssential).toLocaleString()}</span></div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(100, (nonEssential / monthlyIncome) * 100)}%` }} /></div>
                      </div>
                      <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/15 p-3 text-xs text-emerald-300">
                        Cutting non-essentials frees up <strong>{currency}{Math.round(nonEssential).toLocaleString()}/mo</strong> — that's <strong>{currency}{Math.round(nonEssential * 12).toLocaleString()}/year</strong> toward debt or savings
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Expense list */}
            <div className={card}>
              <h3 className="text-sm font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>All Expenses</h3>
              <div className="space-y-2">
                {state.expenses.sort((a, b) => b.amount - a.amount).map((e, i) => (
                  <div key={e.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ background: ["#10b981", "#f59e0b", "#6366f1", "#ec4899", "#14b8a6", "#f97316", "#8b5cf6", "#06b6d4"][i % 8] }} />
                      <div>
                        <div className="text-sm text-white">{e.label}</div>
                        <div className="text-xs text-slate-500 capitalize">{e.category}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {!e.isEssential && <span className="text-xs text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">cuttable</span>}
                      <span className="text-sm font-mono font-semibold text-white">{currency}{e.amount.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-3 border-t border-white/10">
                  <span className="text-sm font-bold text-white">Total</span>
                  <span className="text-sm font-bold text-white font-mono">{currency}{Math.round(totalExpenses).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SAVINGS & INVESTMENTS TAB ─────────────────────────────────────── */}
        {activeTab === "savings" && (
          <div className="space-y-6">
            {/* Savings section */}
            <div className={card}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Savings Stack</h3>
                <div className="text-xs text-slate-500">Goal: <span className="text-white">{currency}{(state.profile?.savingsGoal || 0).toLocaleString()}</span></div>
              </div>
              <div className="flex items-end gap-4 mb-4">
                <div>
                  <div className="text-3xl font-black text-emerald-400" style={{ fontFamily: "'Syne', sans-serif" }}>
                    <AnimNum value={state.totalSaved} prefix={currency} />
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {state.profile?.savingsGoal ? `${Math.round((state.totalSaved / state.profile.savingsGoal) * 100)}% of goal` : "saved"}
                  </div>
                </div>
              </div>
              {state.profile?.savingsGoal && (
                <div className="h-3 bg-white/5 rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (state.totalSaved / state.profile.savingsGoal) * 100)}%`, background: "linear-gradient(90deg, #10b981, #059669)" }}
                  />
                </div>
              )}
              {/* Milestones */}
              <div className="grid grid-cols-4 gap-2 mb-5">
                {[500, 1000, 5000, state.profile?.savingsGoal || 10000].map((m) => (
                  <div key={m} className={`rounded-lg border p-2 text-center transition-all ${state.totalSaved >= m ? "border-emerald-500/40 bg-emerald-500/10" : "border-white/8 opacity-50"}`}>
                    {state.totalSaved >= m ? <CheckCircle2 size={14} className="text-emerald-400 mx-auto mb-1" /> : <div className="w-3.5 h-3.5 rounded-full border border-white/20 mx-auto mb-1" />}
                    <div className="text-xs font-bold" style={{ color: state.totalSaved >= m ? "#10b981" : "#64748b" }}>{currency}{m.toLocaleString()}</div>
                  </div>
                ))}
              </div>
              {/* Log savings */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{currency}</span>
                  <input className={inputClass + " pl-6 py-2"} type="number" placeholder="Amount to add" value={saveAmount} onChange={(e) => setSaveAmount(e.target.value)} />
                </div>
                <button
                  onClick={() => {
                    const amt = Number(saveAmount);
                    if (!amt || amt <= 0) { toast.error("Enter an amount"); return; }
                    addSavings(amt);
                    setSaveAmount("");
                    toast.success(`${currency}${amt} added to savings stack!`);
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-bold text-black hover:opacity-90 transition-all"
                  style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                >
                  Add to Stack
                </button>
              </div>
            </div>

            {/* Savings chart */}
            <div className={card}>
              <h3 className="text-sm font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>Projected Savings Growth</h3>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={savingsProjection}>
                  <defs>
                    <linearGradient id="sg2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${currency}${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`${currency}${v.toLocaleString()}`, "Savings"]} contentStyle={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={2} fill="url(#sg2)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Investments section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Investment Portfolio</h3>
                <div className="flex items-center gap-3">
                  <div className={`text-sm font-bold ${totalInvestmentGain >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {totalInvestmentGain >= 0 ? <ArrowUpRight size={14} className="inline" /> : <ArrowDownRight size={14} className="inline" />}
                    {currency}{Math.abs(Math.round(totalInvestmentGain)).toLocaleString()} total {totalInvestmentGain >= 0 ? "gain" : "loss"}
                  </div>
                </div>
              </div>

              {state.investments.length === 0 ? (
                <div className={card + " text-center py-10"}>
                  <TrendingUp size={32} className="text-indigo-400 mx-auto mb-3" />
                  <h4 className="font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>No investments tracked yet</h4>
                  <p className="text-sm text-slate-400 mb-4">Add your stocks, ETFs, crypto, or retirement accounts.</p>
                  <button
                    onClick={() => {
                      const { generateInvestmentId, getInvestColor } = require("@/lib/store");
                      addInvestment({ id: generateInvestmentId(), name: "", type: "etf", currentValue: 0, amountInvested: 0, monthlyContribution: 0, color: getInvestColor(0) });
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-black hover:opacity-90 transition-all"
                    style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
                  >
                    <Plus size={14} /> Add Investment
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {state.investments.map((inv) => {
                    const gain = inv.currentValue - inv.amountInvested;
                    const gainPct = inv.amountInvested > 0 ? (gain / inv.amountInvested) * 100 : 0;
                    return (
                      <div key={inv.id} className="rounded-2xl border border-white/8 bg-white/3 p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: inv.color }} />
                            <div>
                              <div className="font-bold text-white text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>{inv.name || "Unnamed"}</div>
                              <div className="text-xs text-slate-500 capitalize">{inv.type.replace("_", " ")}</div>
                            </div>
                          </div>
                          <button onClick={() => setEditingInvest(inv)} className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all">
                            <Edit3 size={13} />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <div className="text-xs text-slate-500 mb-0.5">Current Value</div>
                            <div className="text-lg font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{currency}{inv.currentValue.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 mb-0.5">Gain / Loss</div>
                            <div className={`text-sm font-bold ${gain >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                              {gain >= 0 ? "+" : ""}{currency}{Math.abs(Math.round(gain)).toLocaleString()} ({gainPct.toFixed(1)}%)
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 mb-0.5">Monthly Contrib.</div>
                            <div className="text-sm font-bold text-indigo-400">{currency}{inv.monthlyContribution}/mo</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <button
                    onClick={() => {
                      const idx = state.investments.length;
                      addInvestment({
                        id: `i_${Date.now()}`,
                        name: "",
                        type: "etf",
                        currentValue: 0,
                        amountInvested: 0,
                        monthlyContribution: 0,
                        color: ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#14b8a6"][idx % 5],
                      });
                    }}
                    className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/40 rounded-lg px-4 py-2.5 w-full justify-center transition-all"
                  >
                    <Plus size={14} /> Add Investment
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── GAME PLAN TAB ─────────────────────────────────────────────────── */}
        {activeTab === "plan" && (
          <div className="space-y-6">
            {/* The 3 Rules */}
            <div className={card}>
              <h3 className="text-sm font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>The 3 Rules</h3>
              <div className="space-y-3">
                {[
                  { num: "01", title: "Pay yourself first", desc: `Every payday, move ${currency}${Math.round(savingsBudget / 2).toLocaleString()} to savings before spending anything. Non-negotiable.`, color: "#10b981" },
                  { num: "02", title: "Attack the highest APR debt", desc: `After minimums, throw every extra dollar at your highest-rate debt. ${state.strategy === "avalanche" ? "You're on Avalanche — this is the mathematically correct move." : "Consider switching to Avalanche to save on interest."}`, color: "#f59e0b" },
                  { num: "03", title: "Found money goes to the plan", desc: "Tax refund, overtime, selling something — 100% of unexpected income goes to debt or savings. Don't let it disappear.", color: "#6366f1" },
                ].map((r) => (
                  <div key={r.num} className="flex gap-4 rounded-xl border border-white/8 bg-white/3 p-4">
                    <div className="text-2xl font-black shrink-0" style={{ color: r.color, fontFamily: "'Syne', sans-serif" }}>{r.num}</div>
                    <div>
                      <div className="font-bold text-white text-sm mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>{r.title}</div>
                      <div className="text-xs text-slate-400 leading-relaxed">{r.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Month-by-month roadmap */}
            {state.debts.length > 0 && (
              <div className={card}>
                <h3 className="text-sm font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>Debt Payoff Roadmap</h3>
                <div className="space-y-3">
                  {currentSim.payoffOrder.map((item, i) => {
                    const d = new Date();
                    d.setMonth(d.getMonth() + item.month);
                    return (
                      <div key={item.name} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">{i + 1}</div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-white">{item.name} — <span className="text-emerald-400">PAID OFF</span></div>
                          <div className="text-xs text-slate-500">{d.toLocaleDateString("en-US", { month: "long", year: "numeric" })} (month {item.month})</div>
                        </div>
                        <CheckCircle2 size={16} className="text-emerald-500/40 shrink-0" />
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-4 pt-2 border-t border-white/8">
                    <div className="w-8 h-8 rounded-full border border-amber-500/30 bg-amber-500/10 flex items-center justify-center shrink-0">🏁</div>
                    <div>
                      <div className="text-sm font-bold text-white">Completely Debt-Free</div>
                      <div className="text-xs text-slate-500">{getDebtFreeDate(currentSim.months)} · {currency}{Math.round(currentSim.totalInterest).toLocaleString()} total interest paid</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick wins */}
            <div className={card}>
              <h3 className="text-sm font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>Quick Wins Right Now</h3>
              <div className="space-y-2">
                {[
                  state.debts.filter((d) => d.apr === 0 && d.balance > 0).length > 0 && {
                    text: `Wipe your 0% APR debts first (${state.debts.filter((d) => d.apr === 0 && d.balance > 0).map((d) => d.name).join(", ")}) — free wins with no interest cost`,
                    color: "#10b981",
                  },
                  state.expenses.filter((e) => !e.isEssential).length > 0 && {
                    text: `Cut non-essential subscriptions to free up ${currency}${Math.round(state.expenses.filter((e) => !e.isEssential).reduce((s, e) => s + e.amount, 0)).toLocaleString()}/mo`,
                    color: "#f59e0b",
                  },
                  totalMonthlyInterest > 100 && {
                    text: `You're paying ${currency}${Math.round(totalMonthlyInterest).toLocaleString()}/mo in interest — every extra dollar to debt directly reduces this`,
                    color: "#ef4444",
                  },
                  monthlyLeftover > 500 && {
                    text: `You have ${currency}${Math.round(monthlyLeftover).toLocaleString()}/mo available — automate ${currency}${Math.round(savingsBudget).toLocaleString()} to savings on payday so it never gets spent`,
                    color: "#6366f1",
                  },
                ].filter(Boolean).map((w: any, i) => (
                  <div key={i} className="flex gap-3 rounded-xl border border-white/8 bg-white/3 p-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: w.color }} />
                    <div className="text-xs text-slate-300 leading-relaxed">{w.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODALS */}
      {editingDebt && (
        <DebtEditModal
          debt={editingDebt}
          currency={currency}
          onSave={(fields) => updateDebt(editingDebt.id, fields)}
          onClose={() => setEditingDebt(null)}
        />
      )}

      {editingInvest && (
        <InvestEditModal
          inv={editingInvest}
          currency={currency}
          onSave={(fields) => updateInvestment(editingInvest.id, fields)}
          onClose={() => setEditingInvest(null)}
        />
      )}

      {/* RESET CONFIRM */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d1117] p-6 text-center">
            <RotateCcw size={32} className="text-rose-400 mx-auto mb-4" />
            <h3 className="font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>Reset Everything?</h3>
            <p className="text-sm text-slate-400 mb-6">This will clear all your data and return to the start. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowReset(false)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-sm text-slate-400 hover:text-white transition-all">Cancel</button>
              <button
                onClick={() => { resetAll(); navigate("/pro"); }}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 transition-all"
              >
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
