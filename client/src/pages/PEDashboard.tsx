// Personal Economy Pro — Main Dashboard
// Tabs: Overview | Debt Tracker | Budget | Savings & Investments | Game Plan
// Design: Dark Premium Fintech | Syne + Inter | Emerald/Gold/Indigo accents

import { useState, useEffect, useRef } from "react";
import { PoweredByFooter, PoweredByBadge } from "@/components/PoweredByFooter";
import { useLocation } from "wouter";
import { useStore } from "@/hooks/usePEStore";
import {
  sortDebtsByStrategy, simulatePayoff, getDebtFreeDate, formatCurrency,
  buildSavingsProjection, monthlyInterestCost, generateInvestmentId, getInvestColor,
  generateDebtId, generateExpenseId, getDebtColor,
  Debt, Investment, Expense,
} from "@/lib/peStore";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Target,
  Flame, Snowflake, Edit3, X, RotateCcw, ChevronRight, DollarSign,
  BarChart3, Shield, Layers, ArrowUpRight, ArrowDownRight, Plus, Trash2,
  Zap, BookOpen, Info, Lightbulb,
} from "lucide-react";
import { useCloudSync } from "@/hooks/useCloudSync";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

// ── Shared styles ─────────────────────────────────────────────────────────────
const card = "rounded-2xl border border-white/8 p-5" + " " + "[background:var(--card-bg-subtle)]";
const cardDark = "rounded-2xl border border-white/8 p-5" + " " + "[background:var(--card-bg)]";
const inputClass = "w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500/50 transition-all" + " " + "border"
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
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
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

// ── Add Debt Modal ────────────────────────────────────────────────────────────
function AddDebtModal({ onSave, onClose, currency, debtCount }: {
  onSave: (debt: Debt) => void; onClose: () => void; currency: string; debtCount: number;
}) {
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [apr, setApr] = useState("");
  const [minPay, setMinPay] = useState("");

  const save = () => {
    if (!name.trim()) { toast.error("Enter a debt name"); return; }
    if (!balance || Number(balance) <= 0) { toast.error("Enter a valid balance"); return; }
    const debt: Debt = {
      id: generateDebtId(),
      name: name.trim(),
      balance: Number(balance),
      originalBalance: Number(balance),
      apr: Number(apr) || 0,
      minimumPayment: Number(minPay) || 0,
      paid: 0,
      color: getDebtColor(debtCount),
    };
    onSave(debt);
    onClose();
    toast.success(`${name} added to your debt tracker`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1117] p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Add New Debt</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div><label className={labelClass}>Debt Name</label><input className={inputClass} placeholder="e.g. Chase Credit Card" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Current Balance</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{currency}</span>
                <input className={inputClass + " pl-6"} type="number" placeholder="0" value={balance} onChange={(e) => setBalance(e.target.value)} /></div></div>
            <div><label className={labelClass}>APR %</label>
              <div className="relative"><input className={inputClass + " pr-6"} type="number" placeholder="0" value={apr} onChange={(e) => setApr(e.target.value)} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span></div></div>
            <div className="col-span-2"><label className={labelClass}>Minimum Monthly Payment</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{currency}</span>
                <input className={inputClass + " pl-6"} type="number" placeholder="0" value={minPay} onChange={(e) => setMinPay(e.target.value)} /></div></div>
          </div>
          {Number(balance) > 0 && Number(apr) > 0 && (
            <div className="rounded-xl bg-rose-500/8 border border-rose-500/15 p-3 text-xs text-rose-300">
              Monthly interest: <strong>{currency}{((Number(balance) * Number(apr) / 100) / 12).toFixed(2)}</strong>
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-white/10 text-sm text-slate-400 hover:text-white transition-all">Cancel</button>
          <button onClick={save} className="flex-1 py-2.5 rounded-lg text-sm font-bold text-black transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>Add Debt</button>
        </div>
      </div>
    </div>
  );
}

// ── Add Expense Modal ──────────────────────────────────────────────────────────
const EXPENSE_CATEGORIES = [
  { value: "housing", label: "Housing" },
  { value: "transport", label: "Transport" },
  { value: "food", label: "Food" },
  { value: "insurance", label: "Insurance" },
  { value: "subscriptions", label: "Subscriptions" },
  { value: "utilities", label: "Utilities" },
  { value: "health", label: "Health" },
  { value: "other", label: "Other" },
];

function AddExpenseModal({ onSave, onClose, currency }: {
  onSave: (expense: Expense) => void; onClose: () => void; currency: string;
}) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Expense["category"]>("other");
  const [isEssential, setIsEssential] = useState(false);

  const save = () => {
    if (!label.trim()) { toast.error("Enter an expense name"); return; }
    if (!amount || Number(amount) <= 0) { toast.error("Enter a valid amount"); return; }
    const expense: Expense = {
      id: generateExpenseId(),
      label: label.trim(),
      amount: Number(amount),
      category,
      isEssential,
    };
    onSave(expense);
    onClose();
    toast.success(`${label} added to your budget`);
  };

  const selectClass = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1117] p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Add New Expense</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div><label className={labelClass}>Expense Name</label><input className={inputClass} placeholder="e.g. Netflix, Gym, Rent" value={label} onChange={(e) => setLabel(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Monthly Amount</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{currency}</span>
                <input className={inputClass + " pl-6"} type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} /></div></div>
            <div><label className={labelClass}>Category</label>
              <select className={selectClass} value={category} onChange={(e) => setCategory(e.target.value as Expense["category"])}>
                {EXPENSE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select></div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 p-3">
            <button
              type="button"
              onClick={() => setIsEssential((v) => !v)}
              className={`w-10 h-6 rounded-full transition-all flex items-center ${isEssential ? "bg-amber-500" : "bg-white/10"}`}
            >
              <span className={`w-4 h-4 rounded-full bg-white transition-all mx-1 ${isEssential ? "translate-x-4" : "translate-x-0"}`} />
            </button>
            <div>
              <div className="text-xs font-semibold text-white">{isEssential ? "Essential (fixed)" : "Non-essential (cuttable)"}</div>
              <div className="text-xs text-slate-500">{isEssential ? "Rent, utilities, insurance" : "Subscriptions, dining, entertainment"}</div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-white/10 text-sm text-slate-400 hover:text-white transition-all">Cancel</button>
          <button onClick={save} className="flex-1 py-2.5 rounded-lg text-sm font-bold text-black transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>Add Expense</button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Expense Modal ───────────────────────────────────────────────────────
function EditExpenseModal({ expense, onSave, onClose, currency }: {
  expense: Expense; onSave: (id: string, fields: Partial<Expense>) => void; onClose: () => void; currency: string;
}) {
  const [label, setLabel] = useState(expense.label);
  const [amount, setAmount] = useState(String(expense.amount));
  const [category, setCategory] = useState<Expense["category"]>(expense.category);
  const [isEssential, setIsEssential] = useState(expense.isEssential);

  const save = () => {
    if (!label.trim()) { toast.error("Enter an expense name"); return; }
    if (!amount || Number(amount) <= 0) { toast.error("Enter a valid amount"); return; }
    onSave(expense.id, { label: label.trim(), amount: Number(amount), category, isEssential });
    onClose();
    toast.success(`${label} updated`);
  };

  const selectClass = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1117] p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Edit Expense</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div><label className={labelClass}>Expense Name</label><input className={inputClass} value={label} onChange={(e) => setLabel(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Monthly Amount</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{currency}</span>
                <input className={inputClass + " pl-6"} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div></div>
            <div><label className={labelClass}>Category</label>
              <select className={selectClass} value={category} onChange={(e) => setCategory(e.target.value as Expense["category"])}>
                {EXPENSE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select></div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 p-3">
            <button
              type="button"
              onClick={() => setIsEssential((v) => !v)}
              className={`w-10 h-6 rounded-full transition-all flex items-center ${isEssential ? "bg-amber-500" : "bg-white/10"}`}
            >
              <span className={`w-4 h-4 rounded-full bg-white transition-all mx-1 ${isEssential ? "translate-x-4" : "translate-x-0"}`} />
            </button>
            <div>
              <div className="text-xs font-semibold text-white">{isEssential ? "Essential (fixed)" : "Non-essential (cuttable)"}</div>
              <div className="text-xs text-slate-500">{isEssential ? "Rent, utilities, insurance" : "Subscriptions, dining, entertainment"}</div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-white/10 text-sm text-slate-400 hover:text-white transition-all">Cancel</button>
          <button onClick={save} className="flex-1 py-2.5 rounded-lg text-sm font-bold text-black transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [, navigate] = useLocation();
  const { state, computed, makePayment, updateDebt, addDebt, removeDebt, addExpense, removeExpense, updateExpense, addSavings, updateInvestment, addInvestment, removeInvestment, setStrategy, resetAll, updatePrimaryIncome, addAdditionalIncome, removeAdditionalIncome, replaceState, updateSavingsGoal } = useStore();
  // All features are free — no Pro gating
  const [activeTab, setActiveTab] = useState<"overview" | "debt" | "budget" | "savings" | "plan">("overview");
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [editingInvest, setEditingInvest] = useState<Investment | null>(null);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [payAmount, setPayAmount] = useState<Record<string, string>>({});
  const [saveAmount, setSaveAmount] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  // Income editor state (must be declared before early return to follow rules of hooks)
  const [showIncomeEditor, setShowIncomeEditor] = useState(false);
  const [incomeEditVal, setIncomeEditVal] = useState(state.profile?.income?.toString() || "");
  const [incomeFreqEdit, setIncomeFreqEdit] = useState<"biweekly"|"weekly"|"semimonthly"|"monthly">(state.profile?.payFrequency || "biweekly");
  const [newSourceLabel, setNewSourceLabel] = useState("");
  const [newSourceAmount, setNewSourceAmount] = useState("");
  const [newSourceFreq, setNewSourceFreq] = useState<"biweekly"|"weekly"|"semimonthly"|"monthly">("monthly");

  const clock = useLiveClock(state.profile?.firstPayday || "", state.profile?.payFrequency || "biweekly");
  const currency = state.profile?.currency || "$";
  const { isAuthenticated } = useAuth();
  // Cloud sync — auto-saves on change, auto-loads on login
  const { isSyncing } = useCloudSync({ state, onCloudLoad: replaceState });

  // Redirect to onboarding if no plan has been set up yet
  useEffect(() => {
    if (!state.setupComplete) navigate("/pro/onboarding");
  }, [state.setupComplete]);

  if (!state.setupComplete || !state.profile) return null;

  const { monthlyIncome, totalMonthlyIncome, additionalMonthlyIncome, totalExpenses, totalDebt, totalMonthlyInterest, monthlyLeftover, totalInvestmentValue, totalInvestmentGain, netWorth } = computed;

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
      <header className="border-b border-white/6 sticky top-0 z-40" style={{ background: "var(--header-bg)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md flex items-center justify-center text-sm font-black" style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff" }}>£</div>
            <span className="text-sm font-bold hidden xs:inline sm:inline" style={{ fontFamily: "'Syne', sans-serif" }}>Personal Economy</span>
            {state.isDemo && <span className="text-xs bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-mono">DEMO PREVIEW</span>}
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
            {isSyncing && (
              <span className="text-xs text-slate-500 font-mono hidden sm:inline animate-pulse">syncing…</span>
            )}
            <button
              onClick={() => setShowReset(true)}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white border border-white/8 hover:border-white/20 px-2 sm:px-3 py-1.5 rounded-lg transition-all"
            >
              <RotateCcw size={12} /> <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              onClick={() => navigate("/pro")}
              className="text-xs text-slate-500 hover:text-white border border-white/8 hover:border-white/20 px-2 sm:px-3 py-1.5 rounded-lg transition-all"
            >
              <span className="hidden sm:inline">← Home</span><span className="sm:hidden">←</span>
            </button>
          </div>
        </div>
      </header>

      {/* DEMO CTA BANNER — only visible in demo mode */}
      {state.isDemo && (
        <div className="sticky top-14 z-20 border-b border-emerald-500/20" style={{ background: "linear-gradient(90deg, rgba(16,185,129,0.12) 0%, rgba(99,102,241,0.10) 100%)", backdropFilter: "blur(8px)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-emerald-400 text-sm shrink-0">👀</span>
              <p className="text-xs sm:text-sm text-slate-300 truncate">
                <span className="font-semibold text-white">You're previewing a demo.</span>
                <span className="hidden sm:inline text-slate-400"> This is Jordan Rivers's sample plan — not your real data.</span>
              </p>
            </div>
            <button
              onClick={() => { resetAll(); navigate("/pro/onboarding"); }}
              className="shrink-0 flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", boxShadow: "0 2px 12px rgba(16,185,129,0.35)" }}
            >
              <span>Start Your Own Plan</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* HERO STRIP */}
      <div className="border-b border-white/6 py-5" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.05), rgba(99,102,241,0.03))" }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black" style={{ fontFamily: "'Syne', sans-serif" }}>{state.profile.name}'s Economy</h1>
              <p className="text-xs text-slate-500 mt-0.5">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 mb-0.5">Net Worth</div>
              <div className={`text-xl sm:text-2xl font-black ${netWorth >= 0 ? "text-emerald-400" : "text-rose-400"}`} style={{ fontFamily: "'Syne', sans-serif" }}>
                <AnimNum value={netWorth} prefix={currency} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            {[
              { label: "Monthly Income", value: totalMonthlyIncome, color: "text-white", icon: <DollarSign size={14} /> },
              { label: "Total Debt", value: totalDebt, color: "text-rose-400", icon: <AlertTriangle size={14} /> },
              { label: "Savings Stack", value: state.totalSaved, color: "text-emerald-400", icon: <Target size={14} /> },
              { label: "Portfolio Value", value: totalInvestmentValue, color: "text-indigo-400", icon: <TrendingUp size={14} /> },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-white/8 bg-white/3 px-3 sm:px-4 py-2.5 sm:py-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">{s.icon}{s.label}</div>
                <div className={`text-lg sm:text-xl font-black ${s.color}`} style={{ fontFamily: "'Syne', sans-serif" }}>
                  <AnimNum value={s.value} prefix={currency} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="border-b border-white/6 sticky top-14 z-30" style={{ background: "var(--header-bg)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex overflow-x-auto scrollbar-hide">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as typeof activeTab)}
                className={`flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-3 sm:py-3.5 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-all min-w-[44px] sm:min-w-0 ${
                  activeTab === t.id
                    ? "border-emerald-500 text-white"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                <span className="flex-shrink-0">{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">

        {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Cash flow alert */}
            {monthlyLeftover > 0 ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                <CheckCircle2 size={18} className="text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-white">You have <span className="text-emerald-400">{currency}{Math.round(monthlyLeftover).toLocaleString()}/mo</span> left after expenses.</div>
                  <div className="text-xs text-slate-400 mt-0.5">Recommended split: {currency}{Math.round(savingsBudget).toLocaleString()} to savings · {currency}{Math.round(debtBudget).toLocaleString()} to debt · {currency}{Math.round(monthlyLeftover * 0.2).toLocaleString()} buffer</div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                <AlertTriangle size={18} className="text-rose-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-white">Expenses exceed income by <span className="text-rose-400">{currency}{Math.abs(Math.round(monthlyLeftover)).toLocaleString()}/mo</span></div>
                  <div className="text-xs text-slate-400 mt-0.5">Review your Budget tab to find cuts. Every dollar freed up goes directly to your plan.</div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              {/* Cash Flow Breakdown */}
                <div className={card}>
                  <h3 className="text-sm font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>Cash Flow Breakdown</h3>
                  <div className="space-y-2.5">
                    {[
                      { label: "Monthly Income", value: totalMonthlyIncome, color: "#10b981", pct: 100 },
                      { label: "Fixed Expenses", value: totalExpenses, color: "#f59e0b", pct: Math.min(100, (totalExpenses / totalMonthlyIncome) * 100) },
                      { label: "Interest Bleed", value: totalMonthlyInterest, color: "#ef4444", pct: Math.min(100, (totalMonthlyInterest / totalMonthlyIncome) * 100) },
                      { label: "Available", value: Math.max(0, monthlyLeftover), color: "#6366f1", pct: Math.max(0, Math.min(100, (monthlyLeftover / totalMonthlyIncome) * 100)) },
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

            {/* Income Management */}
            <div className={card}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Income</h3>
                <button
                  onClick={() => { setShowIncomeEditor(!showIncomeEditor); setIncomeEditVal(state.profile?.income?.toString() || ""); setIncomeFreqEdit(state.profile?.payFrequency || "biweekly"); }}
                  className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                >
                  <Edit3 size={12} /> Edit
                </button>
              </div>
              {/* Primary income row */}
              <div className="flex items-center justify-between py-2.5 border-b border-white/6">
                <div>
                  <div className="text-xs text-slate-500 mb-0.5">Primary Income</div>
                  <div className="text-xs text-slate-400 capitalize">{state.profile?.payFrequency} &middot; {currency}{state.profile?.income?.toLocaleString()} per period</div>
                </div>
                <div className="text-lg font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                  <AnimNum value={monthlyIncome} prefix={currency} /><span className="text-xs text-slate-500 font-normal">/mo</span>
                </div>
              </div>
              {/* Primary income editor */}
              {showIncomeEditor && (
                <div className="mt-3 p-3 rounded-xl bg-white/3 border border-white/8 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Amount per period</label>
                      <input className={inputClass} type="number" value={incomeEditVal} onChange={(e) => setIncomeEditVal(e.target.value)} placeholder="e.g. 2500" />
                    </div>
                    <div>
                      <label className={labelClass}>Pay frequency</label>
                      <select className={inputClass} value={incomeFreqEdit} onChange={(e) => setIncomeFreqEdit(e.target.value as typeof incomeFreqEdit)}>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Biweekly</option>
                        <option value="semimonthly">Semi-monthly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const val = parseFloat(incomeEditVal);
                      if (!val || val <= 0) { toast.error("Enter a valid income amount"); return; }
                      updatePrimaryIncome(val, incomeFreqEdit);
                      setShowIncomeEditor(false);
                      toast.success("Primary income updated!");
                    }}
                    className="w-full py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition-all"
                  >
                    Save Income
                  </button>
                </div>
              )}
              {/* Additional income sources */}
              {(state.additionalIncome || []).map((src) => (
                <div key={src.id} className="flex items-center justify-between py-2.5 border-b border-white/6">
                  <div>
                    <div className="text-sm text-slate-300">{src.label}</div>
                    <div className="text-xs text-slate-500 capitalize">{src.frequency} &middot; {currency}{src.amount.toLocaleString()} per period</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-semibold text-emerald-400">
                      +<AnimNum value={src.frequency === "weekly" ? src.amount * 52/12 : src.frequency === "biweekly" ? src.amount * 26/12 : src.frequency === "semimonthly" ? src.amount * 2 : src.amount} prefix={currency} /><span className="text-xs text-slate-500 font-normal">/mo</span>
                    </div>
                    <button onClick={() => { removeAdditionalIncome(src.id); toast.success(`${src.label} removed`); }} className="text-slate-600 hover:text-rose-400 transition-colors p-1">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {/* Total combined income — only shown when there are additional sources */}
              {(state.additionalIncome || []).length > 0 && (
                <div className="flex items-center justify-between py-2.5 border-b border-white/6">
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Total Combined</div>
                  <div className="text-lg font-black text-emerald-400" style={{ fontFamily: "'Syne', sans-serif" }}>
                    <AnimNum value={totalMonthlyIncome} prefix={currency} /><span className="text-xs text-slate-500 font-normal">/mo</span>
                  </div>
                </div>
              )}
              {/* Add additional income source */}
              <div className="mt-4">
                <div className="text-xs text-slate-500 mb-2 font-medium">Add income source <span className="text-slate-600">(side hustle, freelance, part-time, etc.)</span></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input className={inputClass} placeholder="Label (e.g. Freelance)" value={newSourceLabel} onChange={(e) => setNewSourceLabel(e.target.value)} />
                  <input className={inputClass} type="number" placeholder="Amount per period" value={newSourceAmount} onChange={(e) => setNewSourceAmount(e.target.value)} />
                  <select className={inputClass} value={newSourceFreq} onChange={(e) => setNewSourceFreq(e.target.value as typeof newSourceFreq)}>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Biweekly</option>
                    <option value="semimonthly">Semi-monthly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <button
                  onClick={() => {
                    const amt = parseFloat(newSourceAmount);
                    if (!newSourceLabel.trim() || !amt || amt <= 0) { toast.error("Enter a label and amount"); return; }
                    addAdditionalIncome({ id: `ai-${Date.now()}`, label: newSourceLabel.trim(), amount: amt, frequency: newSourceFreq });
                    setNewSourceLabel(""); setNewSourceAmount("");
                    toast.success(`${newSourceLabel.trim()} added to your income!`);
                  }}
                  className="mt-2 w-full py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus size={12} /> Add Income Source
                </button>
              </div>
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
                  <Tooltip formatter={(v: number) => [`${currency}${v.toLocaleString()}`, "Savings"]} contentStyle={{ background: "var(--card-bg)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={2} fill="url(#sg)" />
                  {state.profile?.savingsGoal && (
                    <Area type="monotone" dataKey={() => state.profile!.savingsGoal} stroke="#d4af37" strokeWidth={1} strokeDasharray="4 4" fill="none" name="Goal" />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}        {/* ── DEBT TRACKER TAB ────────────────────────────────────────────────────────── */}
        {activeTab === "debt" && (
          <div className="space-y-6">
            {/* Tab header with Add Debt button */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Debt Tracker</h2>
              <button
                onClick={() => setShowAddDebt(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-black transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
              >
                <Plus size={14} /> Add Debt
              </button>
            </div>
            {state.debts.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>No debts tracked</h3>
                <p className="text-slate-400 text-sm mb-6">You're either debt-free or haven't added any debts yet.</p>
                <button
                  onClick={() => setShowAddDebt(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-black transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                >
                  <Plus size={15} /> Add Your First Debt
                </button>
              </div>    ) : (
              <>
                {/* Strategy toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
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
                  </div>
                  <span className="text-xs text-slate-600">Debt-free by: <span className="text-white">{getDebtFreeDate(currentSim.months)}</span></span>
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
                        className={`rounded-2xl border p-5 transition-all relative ${isTarget ? "border-opacity-40" : "border-white/8"} ${isPaidOff ? "opacity-50" : ""}`}
                        style={{ borderColor: isTarget ? debt.color : undefined, background: isTarget ? debt.color + "08" : "rgba(255,255,255,0.02)" }}
                      >

                        <div className="flex items-start justify-between mb-3 gap-2">
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
                            <button
                              onClick={() => setEditingDebt(debt)}
                              className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all"
                              title="Edit debt"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => { removeDebt(debt.id); toast.success(`${debt.name} removed`); }}
                              className="text-slate-600 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all"
                              title="Remove debt"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-end justify-between mb-3">
                          <div>
                            <div className="text-xl sm:text-2xl font-black" style={{ color: isPaidOff ? "#10b981" : debt.color, fontFamily: "'Syne', sans-serif" }}>
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
        {/* ── BUDGET TAB ────────────────────────────────────────────────────────── */}
        {activeTab === "budget" && (
          <div className="space-y-6">
            {/* Tab header with Add Expense button */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Budget</h2>
              <button
                onClick={() => setShowAddExpense(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-black transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
              >
                <Plus size={14} /> Add Expense
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">              {/* Pie chart */}
              <div className={card}>
                <h3 className="text-sm font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>Spending Breakdown</h3>
                {state.expenses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[200px] text-center">
                    <p className="text-slate-500 text-sm">No expenses added yet.</p>
                    <button onClick={() => setShowAddExpense(true)} className="mt-3 text-xs text-amber-400 hover:text-amber-300 underline transition-colors">Add your first expense</button>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={state.expenses} dataKey="amount" nameKey="label" cx="50%" cy="50%" outerRadius={80} innerRadius={50}>
                        {state.expenses.map((e, i) => (
                          <Cell key={e.id} fill={["#10b981", "#f59e0b", "#6366f1", "#ec4899", "#14b8a6", "#f97316", "#8b5cf6", "#06b6d4"][i % 8]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [`${currency}${v.toLocaleString()}`, ""]} contentStyle={{ background: "var(--card-bg)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
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
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (essential / totalMonthlyIncome) * 100)}%` }} /></div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">Non-essential (cuttable)</span><span className="text-rose-400 font-mono">{currency}{Math.round(nonEssential).toLocaleString()}</span></div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(100, (nonEssential / totalMonthlyIncome) * 100)}%` }} /></div>
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
                    <div className="flex items-center gap-2">
                      {!e.isEssential && <span className="text-xs text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">cuttable</span>}
                      <span className="text-sm font-mono font-semibold text-white">{currency}{e.amount.toLocaleString()}</span>
                      <button
                        onClick={() => setEditingExpense(e)}
                        className="text-slate-600 hover:text-white p-1 rounded hover:bg-white/5 transition-all"
                        title="Edit expense"
                      ><Edit3 size={12} /></button>
                      <button
                        onClick={() => { removeExpense(e.id); toast.success(`${e.label} removed`); }}
                        className="text-slate-600 hover:text-rose-400 p-1 rounded hover:bg-rose-500/10 transition-all"
                        title="Remove expense"
                      ><Trash2 size={12} /></button>
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
                <div className="flex items-center gap-2">
                  <div className="text-xs text-slate-500">Goal: <span className="text-white">{currency}{(state.profile?.savingsGoal || 0).toLocaleString()}</span></div>
                  <button
                    onClick={() => { setGoalInput((state.profile?.savingsGoal || "").toString()); setShowGoalModal(true); }}
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-400/60 px-2 py-0.5 rounded-lg transition-all"
                  >
                    <Edit3 size={10} /> Update Goal
                  </button>
                </div>
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 sm:mb-5">
                {Array.from(new Set([500, 1000, 5000, state.profile?.savingsGoal || 10000])).map((m, i) => (
                  <div key={`milestone-${i}-${m}`} className={`rounded-lg border p-2 text-center transition-all ${state.totalSaved >= m ? "border-emerald-500/40 bg-emerald-500/10" : "border-white/8 opacity-50"}`}>
                    {state.totalSaved >= m ? <CheckCircle2 size={14} className="text-emerald-400 mx-auto mb-1" /> : <div className="w-3.5 h-3.5 rounded-full border border-white/20 mx-auto mb-1" />}
                    <div className="text-xs font-bold" style={{ color: state.totalSaved >= m ? "#10b981" : "#64748b" }}>{currency}{m.toLocaleString()}</div>
                  </div>
                ))}
              </div>
              {/* Goal reached celebration */}
              {state.profile?.savingsGoal && state.totalSaved >= state.profile.savingsGoal && (
                <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎉</span>
                    <div>
                      <p className="text-xs font-bold text-emerald-400">Goal Reached!</p>
                      <p className="text-xs text-slate-400">You hit {currency}{state.profile.savingsGoal.toLocaleString()}. Set a new target to keep building.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setGoalInput(""); setShowGoalModal(true); }}
                    className="text-xs font-bold text-white px-3 py-1.5 rounded-lg shrink-0 transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                  >
                    New Goal
                  </button>
                </div>
              )}
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
                  <Tooltip formatter={(v: number) => [`${currency}${v.toLocaleString()}`, "Savings"]} contentStyle={{ background: "var(--card-bg)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
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
                        <div className="flex items-start justify-between mb-3 gap-2">
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
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
        {/* ── GAME PLAN TAB ─────────────────────────────────────────────────── */}
        {activeTab === "plan" && (() => {
          // ── Personalised Game Plan computations ───────────────────────────────
          const nonEssentialExpenses = state.expenses.filter((e) => !e.isEssential);
          const nonEssentialTotal = nonEssentialExpenses.reduce((s, e) => s + e.amount, 0);
          const zeroAprDebts = state.debts.filter((d) => d.apr === 0 && d.balance > 0);
          const highAprDebt = state.debts.filter((d) => d.balance > 0).sort((a, b) => b.apr - a.apr)[0];
          const debtToIncomeRatio = totalMonthlyIncome > 0 ? (totalDebt / (totalMonthlyIncome * 12)) * 100 : 0;
          const savingsRate = totalMonthlyIncome > 0 ? (savingsBudget / totalMonthlyIncome) * 100 : 0;
          const emergencyFundTarget = totalExpenses * 3;
          const hasEmergencyFund = state.totalSaved >= emergencyFundTarget;
          const monthsToEmergencyFund = savingsBudget > 0 ? Math.ceil((emergencyFundTarget - state.totalSaved) / savingsBudget) : 0;
          const totalInvestmentMonthly = state.investments.reduce((s, i) => s + i.monthlyContribution, 0);
          const isOverspending = monthlyLeftover < 0;
          const overspendAmount = Math.abs(monthlyLeftover);

          type Priority = "critical" | "high" | "medium" | "low";
          const prioritySteps: { icon: React.ReactNode; title: string; desc: string; color: string; priority: Priority; badge?: string }[] = [];

          if (isOverspending) {
            prioritySteps.push({
              icon: <AlertTriangle size={16} />,
              title: `Stop the bleed — you're overspending by ${currency}${Math.round(overspendAmount).toLocaleString()}/mo`,
              desc: `Your expenses exceed your income by ${currency}${Math.round(overspendAmount).toLocaleString()} every month. Fix this before anything else. Cut ${nonEssentialTotal > 0 ? `non-essentials (${currency}${Math.round(nonEssentialTotal).toLocaleString()}/mo available)` : "expenses"} or increase income.`,
              color: "#ef4444", priority: "critical", badge: "DO FIRST",
            });
          }

          if (!hasEmergencyFund) {
            prioritySteps.push({
              icon: <Shield size={16} />,
              title: `Build a ${currency}${Math.round(emergencyFundTarget).toLocaleString()} emergency fund (3 months of expenses)`,
              desc: state.totalSaved > 0
                ? `You have ${currency}${Math.round(state.totalSaved).toLocaleString()} saved. At ${currency}${Math.round(savingsBudget).toLocaleString()}/mo you'll hit your target in ~${monthsToEmergencyFund} months.`
                : `No emergency fund means any unexpected expense pushes you into more debt. Save ${currency}${Math.round(savingsBudget).toLocaleString()}/mo and reach this in ~${monthsToEmergencyFund} months.`,
              color: "#f59e0b", priority: isOverspending ? "high" : "critical", badge: isOverspending ? undefined : "DO FIRST",
            });
          }

          if (zeroAprDebts.length > 0) {
            prioritySteps.push({
              icon: <Zap size={16} />,
              title: `Wipe your 0% APR debts — free wins`,
              desc: `${zeroAprDebts.map((d) => `${d.name} (${currency}${Math.round(d.balance).toLocaleString()})`).join(", ")} carry no interest. Pay these off first for quick wins at zero cost.`,
              color: "#10b981", priority: "high",
            });
          }

          if (highAprDebt && highAprDebt.apr > 0) {
            const monthlyInterestCostHigh = (highAprDebt.balance * highAprDebt.apr) / 100 / 12;
            prioritySteps.push({
              icon: <Flame size={16} />,
              title: `Attack ${highAprDebt.name} — ${highAprDebt.apr}% APR costs you ${currency}${Math.round(monthlyInterestCostHigh).toLocaleString()}/mo`,
              desc: state.strategy === "avalanche"
                ? `You're on Avalanche — correct. After minimums on everything else, throw every extra dollar at ${highAprDebt.name}. Every ${currency}100 extra saves ~${currency}${Math.round((highAprDebt.apr / 100) * 100).toLocaleString()} per year.`
                : `Switch to Avalanche and target ${highAprDebt.name} first. It's your most expensive debt and directly reduces your ${currency}${Math.round(totalMonthlyInterest).toLocaleString()}/mo interest bill.`,
              color: "#ef4444", priority: "high",
            });
          }

          if (nonEssentialExpenses.length > 0 && nonEssentialTotal > 50) {
            prioritySteps.push({
              icon: <Trash2 size={16} />,
              title: `Cut ${currency}${Math.round(nonEssentialTotal).toLocaleString()}/mo in non-essential spending`,
              desc: `You have ${nonEssentialExpenses.length} non-essential expense${nonEssentialExpenses.length > 1 ? "s" : ""}: ${nonEssentialExpenses.map((e) => e.label).join(", ")}. Redirecting half (${currency}${Math.round(nonEssentialTotal / 2).toLocaleString()}/mo) to debt saves ${currency}${Math.round((nonEssentialTotal / 2) * 12).toLocaleString()} in a year.`,
              color: "#f59e0b", priority: "medium",
            });
          }

          if (!isOverspending && savingsBudget > 0) {
            prioritySteps.push({
              icon: <TrendingUp size={16} />,
              title: `Automate ${currency}${Math.round(savingsBudget).toLocaleString()}/mo to savings on payday`,
              desc: `You have ${currency}${Math.round(monthlyLeftover).toLocaleString()}/mo left after expenses. Set up an automatic transfer of ${currency}${Math.round(savingsBudget).toLocaleString()} to savings the same day you get paid — before you can spend it. Savings rate: ${Math.round(savingsRate)}%.`,
              color: "#6366f1", priority: "medium",
            });
          }

          if (totalDebt === 0 && monthlyLeftover > 200) {
            prioritySteps.push({
              icon: <ArrowUpRight size={16} />,
              title: `You're debt-free — invest ${currency}${Math.round(monthlyLeftover * 0.5).toLocaleString()}/mo`,
              desc: totalInvestmentMonthly > 0
                ? `You're already contributing ${currency}${Math.round(totalInvestmentMonthly).toLocaleString()}/mo — consider increasing it. Your ${currency}${Math.round(monthlyLeftover).toLocaleString()}/mo surplus can compound significantly over time.`
                : `Start with index funds or a tax-advantaged account (ISA/401k/IRA). Your ${currency}${Math.round(monthlyLeftover).toLocaleString()}/mo surplus invested at 7% avg return grows to ${currency}${Math.round(monthlyLeftover * 0.5 * 12 * 10 * 1.07).toLocaleString()} in 10 years.`,
              color: "#10b981", priority: "medium",
            });
          }

          prioritySteps.push({
            icon: <DollarSign size={16} />,
            title: "Found money rule — windfalls go to the plan",
            desc: `Tax refund, overtime, selling something — 100% of unexpected income goes to ${totalDebt > 0 ? `debt (${currency}${Math.round(totalDebt).toLocaleString()} remaining)` : "savings or investments"}. Don't let it disappear into lifestyle.`,
            color: "#6366f1", priority: "low",
          });

          const priorityColors: Record<Priority, string> = { critical: "#ef4444", high: "#f59e0b", medium: "#6366f1", low: "#64748b" };
          const priorityLabels: Record<Priority, string> = { critical: "CRITICAL", high: "HIGH", medium: "MEDIUM", low: "LOW" };

          const score = Math.max(0, Math.min(100, Math.round(
            (isOverspending ? 0 : 25) +
            (hasEmergencyFund ? 20 : Math.min(20, (state.totalSaved / Math.max(1, emergencyFundTarget)) * 20)) +
            (totalDebt === 0 ? 25 : Math.max(0, 25 - (debtToIncomeRatio / 4))) +
            (savingsRate >= 20 ? 20 : (savingsRate / 20) * 20) +
            (totalInvestmentMonthly > 0 ? 10 : 0)
          )));
          const scoreColor = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";
          const scoreLabel = score >= 70 ? "Strong" : score >= 40 ? "Building" : "Needs Work";

          return (
          <div className="space-y-6">
            {/* Financial Health Score */}
            <div className={card}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Your Financial Health Score</h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: `${scoreColor}20`, color: scoreColor }}>{scoreLabel}</span>
              </div>
              <div className="flex items-end gap-4 mb-4">
                <div className="text-5xl font-black" style={{ fontFamily: "'Syne', sans-serif", color: scoreColor }}>{score}</div>
                <div className="text-slate-500 text-sm mb-1">/100</div>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2 mb-4">
                <div className="h-2 rounded-full transition-all" style={{ width: `${score}%`, background: scoreColor }} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { label: "Cash Flow", ok: !isOverspending, val: isOverspending ? `-${currency}${Math.round(overspendAmount)}` : `+${currency}${Math.round(monthlyLeftover)}` },
                  { label: "Emergency Fund", ok: hasEmergencyFund, val: hasEmergencyFund ? "3mo ✓" : `${Math.round((state.totalSaved / Math.max(1, emergencyFundTarget)) * 100)}%` },
                  { label: "Debt Ratio", ok: debtToIncomeRatio < 36, val: `${Math.round(debtToIncomeRatio)}%` },
                  { label: "Savings Rate", ok: savingsRate >= 20, val: `${Math.round(savingsRate)}%` },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-white/8 bg-white/3 p-2">
                    <div className="text-slate-500 mb-1">{item.label}</div>
                    <div className="font-semibold" style={{ color: item.ok ? "#10b981" : "#f59e0b" }}>{item.val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Personalised Priority Steps */}
            <div className={card}>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb size={16} className="text-amber-400" />
                <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Your Personalised Action Plan</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">Ranked by priority based on your actual numbers — not generic advice.</p>
              <div className="space-y-3">
                {prioritySteps.map((step, i) => (
                  <div key={i} className="flex gap-4 rounded-xl border border-white/8 bg-white/3 p-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: `${step.color}20`, color: step.color }}>
                      {step.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <div className="font-bold text-white text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>{step.title}</div>
                        {step.badge && (
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded shrink-0" style={{ background: `${step.color}20`, color: step.color }}>{step.badge}</span>
                        )}
                        <span className="text-xs font-mono px-1.5 py-0.5 rounded shrink-0" style={{ background: `${priorityColors[step.priority]}15`, color: priorityColors[step.priority] }}>{priorityLabels[step.priority]}</span>
                      </div>
                      <div className="text-xs text-slate-400 leading-relaxed">{step.desc}</div>
                    </div>
                    <div className="text-slate-600 text-sm font-bold shrink-0 mt-1">{String(i + 1).padStart(2, "0")}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Debt Payoff Roadmap */}
            {state.debts.length > 0 && currentSim.payoffOrder.length > 0 && (
              <div className={card}>
                <div className="flex items-center gap-2 mb-4">
                  <Target size={16} className="text-emerald-400" />
                  <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Debt Payoff Roadmap</h3>
                  <span className="ml-auto text-xs text-slate-500 font-mono">{state.strategy === "avalanche" ? "Avalanche" : "Snowball"} strategy</span>
                </div>
                <div className="space-y-3">
                  {currentSim.payoffOrder.map((item, i) => {
                    const d = new Date();
                    d.setMonth(d.getMonth() + item.month);
                    const debt = state.debts.find((x) => x.name === item.name);
                    return (
                      <div key={item.name} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">{i + 1}</div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-white">{item.name} — <span className="text-emerald-400">PAID OFF</span></div>
                          <div className="text-xs text-slate-500">{d.toLocaleDateString("en-US", { month: "long", year: "numeric" })} · month {item.month}{debt ? ` · ${debt.apr}% APR` : ""}</div>
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

            {/* The 3 Rules */}
            <div className={card}>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen size={16} className="text-emerald-400" />
                <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>The 3 Rules</h3>
              </div>
              <div className="space-y-3">
                {[
                  {
                    num: "01",
                    title: "Pay yourself first",
                    desc: savingsBudget > 0
                      ? `Every payday, move ${currency}${Math.round(savingsBudget).toLocaleString()} to savings before spending anything. Non-negotiable.`
                      : "Every payday, move money to savings before spending anything. Even a small amount builds the habit.",
                    color: "#10b981",
                  },
                  {
                    num: "02",
                    title: "Attack the highest APR debt",
                    desc: state.debts.length > 0
                      ? `After minimums, throw every extra dollar at your highest-rate debt. ${state.strategy === "avalanche" ? "You're on Avalanche — this is the mathematically correct move." : "Consider switching to Avalanche to save on interest."}`
                      : "Once you have debt, after paying minimums throw every extra dollar at the highest-rate balance.",
                    color: "#f59e0b",
                  },
                  {
                    num: "03",
                    title: "Found money goes to the plan",
                    desc: `Tax refund, overtime, selling something — 100% of unexpected income goes to ${totalDebt > 0 ? "debt or savings" : "savings or investments"}. Don't let it disappear into lifestyle.`,
                    color: "#6366f1",
                  },
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

            {/* Quick Wins Right Now */}
            {(() => {
              const quickWins: { text: string; color: string }[] = [];
              if (state.debts.filter((d) => d.apr === 0 && d.balance > 0).length > 0) {
                quickWins.push({
                  text: `Wipe your 0% APR debts first (${state.debts.filter((d) => d.apr === 0 && d.balance > 0).map((d) => d.name).join(", ")}) — free wins with no interest cost`,
                  color: "#10b981",
                });
              }
              if (state.expenses.filter((e) => !e.isEssential).length > 0) {
                const nonEssTotal = state.expenses.filter((e) => !e.isEssential).reduce((s, e) => s + e.amount, 0);
                quickWins.push({
                  text: `Cut non-essential subscriptions to free up ${currency}${Math.round(nonEssTotal).toLocaleString()}/mo`,
                  color: "#f59e0b",
                });
              }
              if (totalMonthlyInterest > 100) {
                quickWins.push({
                  text: `You're paying ${currency}${Math.round(totalMonthlyInterest).toLocaleString()}/mo in interest — every extra dollar to debt directly reduces this`,
                  color: "#ef4444",
                });
              }
              if (monthlyLeftover > 500) {
                quickWins.push({
                  text: `You have ${currency}${Math.round(monthlyLeftover).toLocaleString()}/mo available — automate ${currency}${Math.round(savingsBudget).toLocaleString()} to savings on payday so it never gets spent`,
                  color: "#6366f1",
                });
              }
              if (quickWins.length === 0) return null;
              return (
                <div className={card}>
                  <div className="flex items-center gap-2 mb-4">
                    <Zap size={16} className="text-amber-400" />
                    <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Quick Wins Right Now</h3>
                  </div>
                  <div className="space-y-2">
                    {quickWins.map((w, i) => (
                      <div key={i} className="flex gap-3 rounded-xl border border-white/8 bg-white/3 p-3">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: w.color }} />
                        <div className="text-xs text-slate-300 leading-relaxed">{w.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Strategy Comparison */}
            {state.debts.length > 0 && (
              <div className={card}>
                <div className="flex items-center gap-2 mb-4">
                  <Info size={16} className="text-indigo-400" />
                  <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Snowball vs Avalanche — Which is Better for You?</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Snowball", sim: snowball, desc: "Pay smallest balance first. Faster wins, better motivation.", color: "#6366f1" },
                    { label: "Avalanche", sim: avalanche, desc: "Pay highest APR first. Saves the most money mathematically.", color: "#10b981" },
                  ].map((s) => (
                    <div key={s.label} className={`rounded-xl border p-4 transition-all ${state.strategy === s.label.toLowerCase() ? "border-emerald-500/40 bg-emerald-500/5" : "border-white/8 bg-white/3"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-bold text-sm" style={{ color: s.color, fontFamily: "'Syne', sans-serif" }}>{s.label}</div>
                        {state.strategy === s.label.toLowerCase() && <span className="text-xs text-emerald-400 font-mono">ACTIVE</span>}
                      </div>
                      <div className="text-xs text-slate-400 mb-3">{s.desc}</div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between"><span className="text-slate-500">Debt-free in</span><span className="text-white font-mono">{s.sim.months} months</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Total interest</span><span className="text-rose-400 font-mono">{currency}{Math.round(s.sim.totalInterest).toLocaleString()}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
                {avalanche.totalInterest < snowball.totalInterest && (
                  <div className="mt-3 text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
                    💡 Avalanche saves you {currency}{Math.round(snowball.totalInterest - avalanche.totalInterest).toLocaleString()} in interest vs Snowball. {state.strategy !== "avalanche" ? "Consider switching." : "You're on the right strategy."}
                  </div>
                )}
              </div>
            )}
          </div>
          );
        })()}


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

      {showAddDebt && (
        <AddDebtModal
          currency={currency}
          debtCount={state.debts.length}
          onSave={(debt) => addDebt(debt)}
          onClose={() => setShowAddDebt(false)}
        />
      )}

      {showAddExpense && (
        <AddExpenseModal
          currency={currency}
          onSave={(expense) => addExpense(expense)}
          onClose={() => setShowAddExpense(false)}
        />
      )}

      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          currency={currency}
          onSave={(id, fields) => updateExpense(id, fields)}
          onClose={() => setEditingExpense(null)}
        />
      )}

      {/* SAVINGS GOAL MODAL */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className={cardDark + " w-full max-w-sm"} style={{ background: "var(--card-bg)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                {state.totalSaved >= (state.profile?.savingsGoal || 0) && state.profile?.savingsGoal ? "🎉 New Savings Goal" : "Update Savings Goal"}
              </h3>
              <button onClick={() => setShowGoalModal(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
            </div>
            {state.totalSaved >= (state.profile?.savingsGoal || 0) && state.profile?.savingsGoal ? (
              <p className="text-xs text-emerald-400 mb-4">You've hit your goal of {currency}{state.profile.savingsGoal.toLocaleString()}! Set a new target to keep the momentum going.</p>
            ) : (
              <p className="text-xs text-slate-400 mb-4">Current goal: <span className="text-white">{currency}{(state.profile?.savingsGoal || 0).toLocaleString()}</span>. Update it anytime as your situation changes.</p>
            )}
            <div className="relative mb-4">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{currency}</span>
              <input
                className={inputClass + " pl-6 py-2"}
                type="number"
                placeholder="e.g. 10000"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = Number(goalInput);
                    if (!val || val <= 0) { toast.error("Enter a valid goal amount"); return; }
                    updateSavingsGoal(val);
                    setShowGoalModal(false);
                    toast.success(`Savings goal updated to ${currency}${val.toLocaleString()}!`);
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowGoalModal(false)} className="flex-1 text-xs text-slate-400 border border-white/8 py-2 rounded-lg hover:border-white/20 transition-all">Cancel</button>
              <button
                onClick={() => {
                  const val = Number(goalInput);
                  if (!val || val <= 0) { toast.error("Enter a valid goal amount"); return; }
                  updateSavingsGoal(val);
                  setShowGoalModal(false);
                  toast.success(`Savings goal updated to ${currency}${val.toLocaleString()}!`);
                }}
                className="flex-1 text-xs font-bold text-white py-2 rounded-lg transition-all"
                style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
              >
                Save Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM FOOTER BAR */}
      <footer className="border-t border-white/6 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col gap-4">
          {/* Top row: branding + powered by + privacy note */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-black" style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff" }}>£</div>
              <span className="text-xs font-semibold text-slate-500" style={{ fontFamily: "'Syne', sans-serif" }}>Personal Economy</span>
            </div>
            <PoweredByBadge />
            {isAuthenticated ? (
              <p className="text-xs text-slate-600 flex items-center gap-1.5">
                {isSyncing ? (
                  <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />syncing to cloud…</>
                ) : (
                  <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />synced across devices</>
                )}
              </p>
            ) : (
              <p className="text-xs text-slate-600">
                Data stored locally. 
                <a href={getLoginUrl()} className="text-emerald-500 hover:text-emerald-400 underline underline-offset-2 transition-colors">Sign in</a>
                 to sync across devices.
              </p>
            )}
          </div>
          {/* Bottom row: support */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-x-6 gap-y-2 border-t border-white/5 pt-4">
            <a
              href="mailto:streetecon@proton.me"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              Contact Support
            </a>
          </div>
        </div>
      </footer>



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
