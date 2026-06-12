// Hustle Board — Main Dashboard Page
// Design: Dark Urban Fintech | Syne + Inter | Emerald/Rose/Amber accents
// Sections: Overview KPIs, Debt Tracker (with APR + strategy toggle), Budget, Savings, Game Plan

import { useState, useMemo } from "react";
import { DebtEditModal } from "@/components/DebtEditModal";
import { LiveDateBar } from "@/components/LiveDateBar";
import { useLiveClock } from "@/hooks/useLiveClock";
import type { Debt } from "@/lib/financialData";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { useFinancialStore } from "@/hooks/useFinancialStore";
import {
  INCOME,
  EXPENSES_FIXED,
  BUDGET_CATEGORIES,
  SAVINGS_PROJECTION,
  GAME_PLAN,
  TOTAL_EXPENSES,
  MONTHLY_LEFTOVER,
  CUTS_RECOMMENDED,
  FREED_PER_MONTH,
  ALLOCATION,
  DebtStrategy,
  sortDebtsByStrategy,
  simulatePayoff,
  monthlyInterest,
  formatCurrency,
  formatCurrencyDecimal,
  formatPercent,
} from "@/lib/financialData";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import {
  TrendingUp,
  Target,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Zap,
  ChevronRight,
  Plus,
  RotateCcw,
  BookOpen,
  BarChart3,
  Wallet,
  List,
  Flame,
  Snowflake,
  Info,
} from "lucide-react";
import { toast } from "sonner";

type Tab = "overview" | "debts" | "budget" | "savings" | "plan";

const HERO_BG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663192782655/GXoMctSFQX8j75azAgdFxw/finance-hero-bg-6aaKdDxdDUR89mJ4xvzFh8.webp";

const MONTHLY_DEBT_BUDGET = 500;

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [paymentInputs, setPaymentInputs] = useState<Record<string, string>>({});
  const [savingsInput, setSavingsInput] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const clock = useLiveClock();

  const {
    state,
    makePayment,
    addSavings,
    setStrategy,
    updateDebt,
    resetAll,
    totalDebt,
    totalPaid,
    savingsProgress,
    debtProgress,
    currentMonthlyInterest,
  } = useFinancialStore();

  const handlePayment = (debtId: string) => {
    const amount = parseFloat(paymentInputs[debtId] || "0");
    if (!amount || amount <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }
    const debt = state.debts.find((d) => d.id === debtId);
    if (!debt) return;
    const actual = Math.min(amount, debt.balance);
    makePayment(debtId, actual);
    setPaymentInputs((p) => ({ ...p, [debtId]: "" }));
    if (debt.balance - actual <= 0) {
      toast.success(`🎉 ${debt.name} is PAID OFF! That's a W!`);
    } else {
      toast.success(`Payment of ${formatCurrency(actual)} logged!`);
    }
  };

  const handleAddSavings = () => {
    const amount = parseFloat(savingsInput || "0");
    if (!amount || amount <= 0) {
      toast.error("Enter a valid savings amount");
      return;
    }
    addSavings(amount);
    setSavingsInput("");
    toast.success(`${formatCurrency(amount)} added to your savings stack!`);
  };

  // Sorted debts by current strategy
  const sortedDebts = useMemo(
    () => sortDebtsByStrategy(state.debts, state.strategy),
    [state.debts, state.strategy]
  );

  // Simulation results for both strategies
  const snowballSim = useMemo(
    () => simulatePayoff(state.debts, "snowball", MONTHLY_DEBT_BUDGET),
    [state.debts]
  );
  const avalancheSim = useMemo(
    () => simulatePayoff(state.debts, "avalanche", MONTHLY_DEBT_BUDGET),
    [state.debts]
  );

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <BarChart3 size={16} /> },
    { id: "debts", label: "Debt Tracker", icon: <Target size={16} /> },
    { id: "budget", label: "Budget", icon: <Wallet size={16} /> },
    { id: "savings", label: "Savings", icon: <TrendingUp size={16} /> },
    { id: "plan", label: "Game Plan", icon: <List size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* HERO HEADER */}
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(to bottom, rgba(10,10,15,0.55) 0%, rgba(10,10,15,0.85) 60%, rgba(10,10,15,1) 100%), url(${HERO_BG}) center/cover no-repeat`,
          minHeight: "220px",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase bg-emerald-400/10 px-2 py-1 rounded">
                  Personal Economy
                </span>
              </div>
              <h1
                className="text-4xl md:text-5xl font-black text-white leading-tight flex items-center gap-3"
                style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "-0.03em" }}
              >
                <span
                  className="inline-flex items-center justify-center w-12 h-12 rounded-xl text-2xl font-black shrink-0"
                  style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#fff", boxShadow: "0 4px 16px rgba(16,185,129,0.35)" }}
                >
                  £
                </span>
                Personal Economy
              </h1>
              <p className="text-slate-400 mt-1 text-sm">
                Your personalized path from drowning to stacking. Next payday:{" "}
                <span className={clock.payday.isToday ? "text-emerald-400 font-bold animate-pulse" : "text-emerald-400 font-semibold"}>
                  {clock.payday.isToday
                    ? "TODAY 💸"
                    : clock.payday.nextPayday.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </span>
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Monthly Income</span>
              <span
                className="text-3xl font-black text-white"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                {formatCurrency(INCOME.monthly)}
              </span>
              <span className="text-xs text-slate-500">{formatCurrency(INCOME.biweekly)} biweekly</span>
            </div>
          </div>

          {/* Top KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            {[
              {
                label: "Total Debt",
                value: totalDebt,
                prefix: "$",
                color: "text-rose-400",
                bg: "bg-rose-500/10",
                border: "border-rose-500/20",
                icon: <AlertTriangle size={14} className="text-rose-400" />,
              },
              {
                label: "Total Paid",
                value: totalPaid,
                prefix: "$",
                color: "text-emerald-400",
                bg: "bg-emerald-500/10",
                border: "border-emerald-500/20",
                icon: <CheckCircle2 size={14} className="text-emerald-400" />,
              },
              {
                label: "Savings Stack",
                value: state.totalSaved,
                prefix: "$",
                color: "text-emerald-400",
                bg: "bg-emerald-500/10",
                border: "border-emerald-500/20",
                icon: <TrendingUp size={14} className="text-emerald-400" />,
              },
              {
                label: "Interest/Month",
                value: currentMonthlyInterest,
                prefix: "$",
                color: "text-rose-400",
                bg: "bg-rose-500/10",
                border: "border-rose-500/20",
                icon: <Flame size={14} className="text-rose-400" />,
              },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className={`rounded-xl border ${kpi.border} ${kpi.bg} px-4 py-3`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {kpi.icon}
                  <span className="text-xs text-slate-400">{kpi.label}</span>
                </div>
                <div
                  className={`text-2xl font-black ${kpi.color}`}
                  style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "-0.02em" }}
                >
                  <AnimatedNumber value={kpi.value} prefix={kpi.prefix} duration={1000} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LIVE DATE BAR */}
      <LiveDateBar />

      {/* TABS */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex gap-1 mt-4 border-b border-white/8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "border-emerald-400 text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="py-6">
          {activeTab === "overview" && (
            <OverviewTab
              state={state}
              totalDebt={totalDebt}
              savingsProgress={savingsProgress}
              debtProgress={debtProgress}
              currentMonthlyInterest={currentMonthlyInterest}
              snowballSim={snowballSim}
              avalancheSim={avalancheSim}
            />
          )}
          {activeTab === "debts" && (
            <DebtsTab
              state={state}
              sortedDebts={sortedDebts}
              paymentInputs={paymentInputs}
              setPaymentInputs={setPaymentInputs}
              handlePayment={handlePayment}
              totalDebt={totalDebt}
              totalPaid={totalPaid}
              debtProgress={debtProgress}
              currentMonthlyInterest={currentMonthlyInterest}
              setStrategy={setStrategy}
              snowballSim={snowballSim}
              avalancheSim={avalancheSim}
              onEditDebt={setEditingDebt}
            />
          )}
          {activeTab === "budget" && <BudgetTab />}
          {activeTab === "savings" && (
            <SavingsTab
              state={state}
              savingsInput={savingsInput}
              setSavingsInput={setSavingsInput}
              handleAddSavings={handleAddSavings}
              savingsProgress={savingsProgress}
            />
          )}
          {activeTab === "plan" && <GamePlanTab />}
        </div>
      </div>

      {/* Debt Edit Modal */}
      <DebtEditModal
        debt={editingDebt}
        onClose={() => setEditingDebt(null)}
        onSave={(id, fields) => updateDebt(id, fields)}
      />

      {/* Reset */}
      <div className="max-w-6xl mx-auto px-6 pb-8 flex justify-end">
        {!showReset ? (
          <button
            onClick={() => setShowReset(true)}
            className="text-xs text-slate-600 hover:text-slate-400 flex items-center gap-1 transition-colors"
          >
            <RotateCcw size={12} /> Reset all data
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Are you sure? This clears all progress.</span>
            <button
              onClick={() => { resetAll(); setShowReset(false); toast.info("Data reset."); }}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
            >
              Yes, reset
            </button>
            <button onClick={() => setShowReset(false)} className="text-xs text-slate-400 hover:text-slate-200">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────

function OverviewTab({
  state, totalDebt, savingsProgress, debtProgress, currentMonthlyInterest, snowballSim, avalancheSim,
}: {
  state: ReturnType<typeof useFinancialStore>["state"];
  totalDebt: number;
  savingsProgress: number;
  debtProgress: number;
  currentMonthlyInterest: number;
  snowballSim: ReturnType<typeof simulatePayoff>;
  avalancheSim: ReturnType<typeof simulatePayoff>;
}) {
  return (
    <div className="space-y-6">
      {/* Interest Bleed Alert */}
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/8 px-5 py-4 flex items-start gap-3">
        <Flame size={18} className="text-rose-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-rose-300" style={{ fontFamily: "'Syne', sans-serif" }}>
            You're bleeding <span className="text-rose-400">{formatCurrency(currentMonthlyInterest)}/month</span> in interest alone.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Debt 2 (22.74% APR) costs <strong className="text-rose-300">$89/mo</strong> just to exist. Debt 3 (17%) costs <strong className="text-rose-300">$87/mo</strong>. That's money going nowhere. The faster you attack these, the less you lose.
          </p>
        </div>
      </div>

      {/* Strategy Comparison */}
      <div className="rounded-xl border border-white/8 bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Target size={16} className="text-amber-400" />
          <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
            Snowball vs. Avalanche — What the Math Says
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Snowball */}
          <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Snowflake size={16} className="text-sky-400" />
              <span className="text-sm font-bold text-sky-400" style={{ fontFamily: "'Syne', sans-serif" }}>Snowball</span>
              <span className="text-xs text-slate-500">(smallest balance first)</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Months to debt-free</span>
                <span className="text-white font-mono font-bold">{snowballSim.months} months</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total interest paid</span>
                <span className="text-rose-400 font-mono font-bold">{formatCurrency(snowballSim.totalInterest)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Debt-free by</span>
                <span className="text-white font-mono font-bold">~{getDebtFreeDate(snowballSim.months)}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/5">
              <p className="text-xs text-slate-400">
                <strong className="text-sky-400">Pro:</strong> Quick wins on small debts keep you motivated.
              </p>
            </div>
          </div>

          {/* Avalanche */}
          <div className="rounded-xl border border-orange-500/30 bg-orange-500/8 p-4 relative">
            <div className="absolute top-3 right-3 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-semibold">
              RECOMMENDED
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Flame size={16} className="text-orange-400" />
              <span className="text-sm font-bold text-orange-400" style={{ fontFamily: "'Syne', sans-serif" }}>Avalanche</span>
              <span className="text-xs text-slate-500">(highest APR first)</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Months to debt-free</span>
                <span className="text-white font-mono font-bold">{avalancheSim.months} months</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total interest paid</span>
                <span className="text-emerald-400 font-mono font-bold">{formatCurrency(avalancheSim.totalInterest)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Debt-free by</span>
                <span className="text-white font-mono font-bold">~{getDebtFreeDate(avalancheSim.months)}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/5">
              <p className="text-xs text-slate-400">
                <strong className="text-orange-400">Pro:</strong> Saves you{" "}
                <strong className="text-emerald-400">{formatCurrency(snowballSim.totalInterest - avalancheSim.totalInterest)}</strong>{" "}
                and finishes {snowballSim.months - avalancheSim.months} months faster.
              </p>
            </div>
          </div>
        </div>

        {/* Verdict Banner */}
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
          <p className="text-xs text-emerald-300 leading-relaxed">
            <strong className="text-emerald-400">Bottom line:</strong> Debt 4 and 5 have 0% APR — wipe those first regardless of strategy (they're free wins). Then switch to <strong>Avalanche</strong>: attack Debt 2 (22.74%) first since it's costing you the most per month. You'll save <strong>{formatCurrency(snowballSim.totalInterest - avalancheSim.totalInterest)}</strong> in interest and be debt-free {snowballSim.months - avalancheSim.months} months sooner.
          </p>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/8 bg-card p-5 card-glow-rose">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Debt Elimination</span>
            <span className="text-xs font-mono text-rose-400">{debtProgress.toFixed(1)}%</span>
          </div>
          <div className="text-3xl font-black text-rose-400 mb-1 stat-number">
            <AnimatedNumber value={totalDebt} prefix="$" duration={1200} />
          </div>
          <p className="text-xs text-slate-500 mb-3">remaining of $15,602 total</p>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full progress-rose rounded-full transition-all duration-1000" style={{ width: `${debtProgress}%` }} />
          </div>
        </div>

        <div className="rounded-xl border border-white/8 bg-card p-5 card-glow-emerald">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Savings Stack</span>
            <span className="text-xs font-mono text-emerald-400">{savingsProgress.toFixed(1)}%</span>
          </div>
          <div className="text-3xl font-black text-emerald-400 mb-1 stat-number">
            <AnimatedNumber value={state.totalSaved} prefix="$" duration={1200} />
          </div>
          <p className="text-xs text-slate-500 mb-3">of {formatCurrency(state.savingsGoal)} goal</p>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full progress-emerald rounded-full transition-all duration-1000" style={{ width: `${savingsProgress}%` }} />
          </div>
        </div>
      </div>

      {/* Cash Flow */}
      <div className="rounded-xl border border-white/8 bg-card p-5">
        <h3 className="text-sm font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
          Monthly Cash Flow Breakdown
        </h3>
        <div className="space-y-3">
          {[
            { label: "Monthly Income", value: INCOME.monthly, color: "text-emerald-400", bar: "progress-emerald", pct: 100 },
            { label: "Fixed Expenses", value: -TOTAL_EXPENSES, color: "text-rose-400", bar: "progress-rose", pct: (TOTAL_EXPENSES / INCOME.monthly) * 100 },
            { label: "Debt Payment", value: -ALLOCATION.debtPayment, color: "text-amber-400", bar: "progress-amber", pct: (ALLOCATION.debtPayment / INCOME.monthly) * 100 },
            { label: "Savings Target", value: -ALLOCATION.savings, color: "text-emerald-400", bar: "progress-emerald", pct: (ALLOCATION.savings / INCOME.monthly) * 100 },
            { label: "Buffer / Flex", value: MONTHLY_LEFTOVER - ALLOCATION.debtPayment - ALLOCATION.savings, color: "text-slate-300", bar: "bg-slate-600", pct: ((MONTHLY_LEFTOVER - ALLOCATION.debtPayment - ALLOCATION.savings) / INCOME.monthly) * 100 },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <div className="w-36 shrink-0">
                <span className="text-xs text-slate-400">{row.label}</span>
              </div>
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full ${row.bar} rounded-full`} style={{ width: `${Math.abs(row.pct)}%` }} />
              </div>
              <div className={`w-20 text-right text-xs font-mono font-semibold ${row.color}`}>
                {row.value >= 0 ? "+" : ""}{formatCurrency(row.value)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Wins */}
      <div className="rounded-xl border border-white/8 bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={16} className="text-amber-400" />
          <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
            Quick Wins — Free Up {formatCurrency(FREED_PER_MONTH)}/mo
          </h3>
        </div>
        <div className="space-y-3">
          {[
            ...CUTS_RECOMMENDED.map((c) => ({ name: c.name, amount: c.amount, reason: c.reason })),
            { name: "Food (Meal Prep)", amount: 62, reason: "Drop from $312 → $250 with weekly meal prep" },
          ].map((cut) => (
            <div key={cut.name} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div>
                <p className="text-sm text-white font-medium">{cut.name}</p>
                <p className="text-xs text-slate-500">{cut.reason}</p>
              </div>
              <span className="text-sm font-mono font-bold text-emerald-400">+{formatCurrencyDecimal(cut.amount)}/mo</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Total freed up</span>
            <span className="text-lg font-black text-emerald-400 stat-number">+{formatCurrency(FREED_PER_MONTH)}/mo</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DEBT TRACKER TAB ─────────────────────────────────────────────────────────

function DebtsTab({
  state, sortedDebts, paymentInputs, setPaymentInputs, handlePayment,
  totalDebt, totalPaid, debtProgress, currentMonthlyInterest,
  setStrategy, snowballSim, avalancheSim, onEditDebt,
}: {
  state: ReturnType<typeof useFinancialStore>["state"];
  sortedDebts: ReturnType<typeof sortDebtsByStrategy>;
  paymentInputs: Record<string, string>;
  setPaymentInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handlePayment: (id: string) => void;
  totalDebt: number;
  totalPaid: number;
  debtProgress: number;
  currentMonthlyInterest: number;
  setStrategy: (s: DebtStrategy) => void;
  snowballSim: ReturnType<typeof simulatePayoff>;
  avalancheSim: ReturnType<typeof simulatePayoff>;
  onEditDebt: (debt: Debt) => void;
}) {
  const interestBarData = state.debts
    .filter((d) => d.apr > 0)
    .map((d) => ({
      name: d.name,
      monthly: parseFloat(monthlyInterest(d).toFixed(2)),
      apr: parseFloat((d.apr * 100).toFixed(2)),
      color: d.color,
    }))
    .sort((a, b) => b.monthly - a.monthly);

  return (
    <div className="space-y-5">
      {/* Strategy Toggle */}
      <div className="rounded-xl border border-white/8 bg-card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
              Payoff Strategy
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Choose how to prioritize your debt attacks</p>
          </div>
          {/* Toggle */}
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            <button
              onClick={() => setStrategy("snowball")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                state.strategy === "snowball"
                  ? "bg-sky-500/20 text-sky-400 border-r border-sky-500/30"
                  : "text-slate-400 hover:text-slate-200 border-r border-white/10"
              }`}
            >
              <Snowflake size={14} />
              Snowball
            </button>
            <button
              onClick={() => setStrategy("avalanche")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                state.strategy === "avalanche"
                  ? "bg-orange-500/20 text-orange-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Flame size={14} />
              Avalanche
            </button>
          </div>
        </div>

        {/* Strategy description */}
        {state.strategy === "snowball" ? (
          <div className="rounded-lg bg-sky-500/8 border border-sky-500/15 px-4 py-3 text-xs text-sky-300">
            <strong className="text-sky-400">Snowball:</strong> Pay minimums on everything, dump extra cash on the smallest balance first. Great for motivation — you get quick wins. Costs you <strong>{formatCurrency(snowballSim.totalInterest)}</strong> in interest over <strong>{snowballSim.months} months</strong>.
          </div>
        ) : (
          <div className="rounded-lg bg-orange-500/8 border border-orange-500/15 px-4 py-3 text-xs text-orange-300">
            <strong className="text-orange-400">Avalanche:</strong> Pay minimums on everything, dump extra cash on the highest APR first. Mathematically optimal — saves you <strong className="text-emerald-400">{formatCurrency(snowballSim.totalInterest - avalancheSim.totalInterest)}</strong> vs. snowball and finishes <strong className="text-emerald-400">{snowballSim.months - avalancheSim.months} months sooner</strong> ({avalancheSim.months} months total).
          </div>
        )}

        {/* Comparison mini-table */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: "Strategy", snowball: "Snowball ❄️", avalanche: "Avalanche 🔥" },
            { label: "Months", snowball: `${snowballSim.months} mo`, avalanche: `${avalancheSim.months} mo` },
            { label: "Total Interest", snowball: formatCurrency(snowballSim.totalInterest), avalanche: formatCurrency(avalancheSim.totalInterest) },
          ].map((row) => (
            <div key={row.label} className="text-center">
              <div className="text-xs text-slate-500 mb-1">{row.label}</div>
              <div className={`text-xs font-mono font-semibold px-2 py-1 rounded ${state.strategy === "snowball" ? "bg-sky-500/10 text-sky-400" : "bg-white/5 text-slate-400"}`}>{row.snowball}</div>
              <div className="text-slate-600 text-xs my-0.5">vs</div>
              <div className={`text-xs font-mono font-semibold px-2 py-1 rounded ${state.strategy === "avalanche" ? "bg-orange-500/10 text-orange-400" : "bg-white/5 text-slate-400"}`}>{row.avalanche}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Interest Cost Chart */}
      <div className="rounded-xl border border-white/8 bg-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <Flame size={15} className="text-rose-400" />
          <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
            Monthly Interest Bleeding — {formatCurrencyDecimal(currentMonthlyInterest)}/mo total
          </h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">This is money you pay just for having the debt — it buys you nothing.</p>
        <div className="space-y-3">
          {interestBarData.map((d) => (
            <div key={d.name} className="flex items-center gap-3">
              <div className="w-28 shrink-0">
                <p className="text-xs text-slate-300 truncate">{d.name}</p>
                <p className="text-xs font-mono" style={{ color: d.color }}>{d.apr}% APR</p>
              </div>
              <div className="flex-1 h-5 bg-white/5 rounded overflow-hidden relative">
                <div
                  className="h-full rounded transition-all duration-700 flex items-center justify-end pr-2"
                  style={{
                    width: `${(d.monthly / interestBarData[0].monthly) * 100}%`,
                    background: `linear-gradient(90deg, ${d.color}66, ${d.color})`,
                    minWidth: "60px",
                  }}
                >
                  <span className="text-xs font-mono font-bold text-white">${d.monthly}/mo</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Remaining Debt", value: totalDebt, color: "text-rose-400", prefix: "$" },
          { label: "Total Paid", value: totalPaid, color: "text-emerald-400", prefix: "$" },
          { label: "Progress", value: debtProgress, color: "text-amber-400", suffix: "%", decimals: 1 },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/8 bg-card p-4 text-center">
            <div className={`text-2xl font-black stat-number ${s.color}`}>
              <AnimatedNumber value={s.value} prefix={s.prefix || ""} suffix={s.suffix || ""} decimals={s.decimals || 0} />
            </div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Debt Cards — sorted by active strategy */}
      <div className="space-y-4">
        {sortedDebts.map((debt, i) => {
          const pct = Math.max(0, 100 - (debt.balance / debt.originalBalance) * 100);
          const isPaidOff = debt.balance === 0;
          const intCost = monthlyInterest(debt);
          const isTarget = i === 0 && !isPaidOff;

          return (
            <div
              key={debt.id}
              className={`rounded-xl border bg-card p-5 transition-all ${
                isPaidOff ? "border-emerald-500/30 opacity-60" : isTarget ? "border-white/15" : "border-white/8"
              }`}
              style={isTarget ? { boxShadow: `0 0 0 1px ${debt.color}44, 0 4px 24px ${debt.color}14` } : {}}
            >
              <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ background: debt.color + "22", color: debt.color }}
                  >
                    #{i + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                        {debt.name}
                      </h4>
                      {isTarget && (
                        <span className="text-xs px-1.5 py-0.5 rounded font-semibold" style={{ background: debt.color + "22", color: debt.color }}>
                          {state.strategy === "avalanche" ? "🔥 ATTACK NOW" : "❄️ ATTACK NOW"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-xs text-slate-500">
                        Started {formatCurrency(debt.originalBalance)} · Paid {formatCurrency(debt.paid)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {isPaidOff ? (
                    <div className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 size={16} />
                      <span className="text-sm font-bold">PAID OFF</span>
                    </div>
                  ) : (
                    <div>
                      <div className="text-2xl font-black stat-number" style={{ color: debt.color, fontFamily: "'Syne', sans-serif" }}>
                        {formatCurrency(debt.balance)}
                      </div>
                      {debt.apr > 0 && (
                        <div className="text-xs text-right mt-0.5 space-y-0.5">
                          <div className="font-mono text-rose-400">{formatPercent(debt.apr)} APR</div>
                          <div className="text-slate-500">{formatCurrencyDecimal(intCost)}/mo interest</div>
                        </div>
                      )}
                      {debt.apr === 0 && (
                        <div className="text-xs text-emerald-400 font-mono text-right mt-0.5">0% APR — Free!</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${debt.color}88, ${debt.color})` }}
                />
              </div>
              <div className="flex justify-between mb-3">
                <span className="text-xs text-slate-500">{pct.toFixed(1)}% paid off</span>
                <span className="text-xs text-slate-500">{formatCurrency(debt.balance)} left</span>
              </div>

              {/* Payment Input + Edit */}
              <div className="flex gap-2 flex-wrap">
                {!isPaidOff && (
                  <>
                    <div className="relative flex-1 min-w-[140px]">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                      <input
                        type="number"
                        placeholder="Payment amount"
                        value={paymentInputs[debt.id] || ""}
                        onChange={(e) => setPaymentInputs((p) => ({ ...p, [debt.id]: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                        onKeyDown={(e) => e.key === "Enter" && handlePayment(debt.id)}
                      />
                    </div>
                    <button
                      onClick={() => handlePayment(debt.id)}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-black transition-all hover:opacity-90 active:scale-95"
                      style={{ background: debt.color }}
                    >
                      Log Payment
                    </button>
                  </>
                )}
                <button
                  onClick={() => onEditDebt(debt)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white border border-white/10 hover:border-white/20 transition-all"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payoff Timeline */}
      <div className="rounded-xl border border-white/8 bg-card p-5">
        <h3 className="text-sm font-bold text-white mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
          Projected Payoff Timeline ({state.strategy === "avalanche" ? "Avalanche 🔥" : "Snowball ❄️"})
        </h3>
        <div className="space-y-2">
          {(state.strategy === "avalanche" ? avalancheSim : snowballSim).payoffOrder.map((p) => (
            <div key={p.name} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span className="text-sm text-slate-300">{p.name}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-slate-400">Month {p.month}</span>
                <span className="text-xs text-slate-500 ml-2">~{getDebtFreeDate(p.month)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── BUDGET TAB ───────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-white/10 rounded-lg px-3 py-2 text-xs">
        {payload.map((p) => (
          <p key={p.name} className="text-white font-semibold">{p.name}: {formatCurrency(p.value)}</p>
        ))}
      </div>
    );
  }
  return null;
};

function BudgetTab() {
  const essential = EXPENSES_FIXED.filter((e) => e.essential);
  const nonEssential = EXPENSES_FIXED.filter((e) => !e.essential);
  const subTotal = nonEssential.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: "Monthly Income", value: INCOME.monthly, color: "text-emerald-400", sub: "2 paychecks" },
          { label: "Total Expenses", value: TOTAL_EXPENSES, color: "text-rose-400", sub: "all bills" },
          { label: "Left After Bills", value: MONTHLY_LEFTOVER, color: "text-amber-400", sub: "to allocate" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/8 bg-card p-4">
            <div className="text-xs text-slate-400 mb-1">{s.label}</div>
            <div className={`text-2xl font-black stat-number ${s.color}`}>
              <AnimatedNumber value={s.value} prefix="$" />
            </div>
            <div className="text-xs text-slate-500 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/8 bg-card p-5">
        <h3 className="text-sm font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
          Spending by Category
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={BUDGET_CATEGORIES} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="amount">
                {BUDGET_CATEGORIES.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-card border border-white/10 rounded-lg px-3 py-2 text-xs">
                        <p className="text-white font-semibold">{d.name}</p>
                        <p className="text-slate-400">{formatCurrency(d.amount)}/mo</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend formatter={(value) => <span style={{ color: "#94a3b8", fontSize: "12px" }}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-white/8 bg-card p-5">
        <h3 className="text-sm font-bold text-white mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>Essential Expenses</h3>
        <div className="space-y-2">
          {essential.map((e) => (
            <div key={e.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <span className="text-sm text-slate-300">{e.name}</span>
              <span className="text-sm font-mono font-semibold text-white">{formatCurrencyDecimal(e.amount)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-bold text-white">Subtotal</span>
            <span className="text-sm font-mono font-bold text-rose-400">{formatCurrency(essential.reduce((s, e) => s + e.amount, 0))}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={15} className="text-amber-400" />
          <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
            Subscriptions & Non-Essentials — {formatCurrency(subTotal)}/mo
          </h3>
        </div>
        <div className="space-y-2">
          {nonEssential.map((e) => (
            <div key={e.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div>
                <span className="text-sm text-slate-300">{e.name}</span>
                {(e.id === "xbox" || e.id === "capcut") && (
                  <span className="ml-2 text-xs bg-amber-400/15 text-amber-400 px-1.5 py-0.5 rounded">Consider pausing</span>
                )}
              </div>
              <span className="text-sm font-mono font-semibold text-amber-400">{formatCurrencyDecimal(e.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SAVINGS TAB ──────────────────────────────────────────────────────────────

function SavingsTab({ state, savingsInput, setSavingsInput, handleAddSavings, savingsProgress }: {
  state: ReturnType<typeof useFinancialStore>["state"];
  savingsInput: string;
  setSavingsInput: (v: string) => void;
  handleAddSavings: () => void;
  savingsProgress: number;
}) {
  return (
    <div className="space-y-5">
      <div
        className="rounded-xl border border-emerald-500/30 bg-card p-6 card-glow-emerald text-center"
        style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(10,10,15,0.8) 100%)" }}
      >
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Your Savings Stack</p>
        <div className="text-6xl font-black text-emerald-400 stat-number mb-2" style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "-0.04em" }}>
          <AnimatedNumber value={state.totalSaved} prefix="$" duration={1200} />
        </div>
        <p className="text-sm text-slate-400">
          of <span className="text-white font-semibold">{formatCurrency(state.savingsGoal)}</span> goal ·{" "}
          <span className="text-emerald-400 font-semibold">{savingsProgress.toFixed(1)}% there</span>
        </p>
        <div className="h-3 bg-white/5 rounded-full overflow-hidden mt-4 mx-auto max-w-sm">
          <div className="h-full progress-emerald rounded-full transition-all duration-1000" style={{ width: `${savingsProgress}%` }} />
        </div>
        <div className="flex gap-2 mt-5 max-w-sm mx-auto">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
            <input
              type="number"
              placeholder="Amount to add"
              value={savingsInput}
              onChange={(e) => setSavingsInput(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
              onKeyDown={(e) => e.key === "Enter" && handleAddSavings()}
            />
          </div>
          <button
            onClick={handleAddSavings}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg text-sm font-bold transition-all flex items-center gap-1"
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-white/8 bg-card p-5">
        <h3 className="text-sm font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>Savings Milestones</h3>
        <div className="space-y-3">
          {[
            { label: "Emergency Buffer", amount: 500, desc: "1 month of breathing room" },
            { label: "First $1,000", amount: 1000, desc: "The hardest milestone — and the most important" },
            { label: "Quarter Way", amount: 1250, desc: "You're building real momentum" },
            { label: "Half Way", amount: 2500, desc: "Halfway to $5k" },
            { label: "Goal: $5,000", amount: 5000, desc: "Your emergency fund is fully stacked" },
            { label: "Stretch: $10,000", amount: 10000, desc: "Real financial security" },
          ].map((m) => {
            const reached = state.totalSaved >= m.amount;
            return (
              <div key={m.label} className={`flex items-center gap-3 py-2 border-b border-white/5 last:border-0 ${reached ? "opacity-100" : "opacity-60"}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${reached ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-slate-600"}`}>
                  {reached ? <CheckCircle2 size={14} /> : <div className="w-2 h-2 rounded-full bg-slate-600" />}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${reached ? "text-white" : "text-slate-400"}`}>{m.label}</p>
                  <p className="text-xs text-slate-500">{m.desc}</p>
                </div>
                <span className={`text-sm font-mono font-bold ${reached ? "text-emerald-400" : "text-slate-500"}`}>{formatCurrency(m.amount)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-white/8 bg-card p-5">
        <h3 className="text-sm font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
          Projected Savings — May to Dec 2026 (at $650/mo)
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={SAVINGS_PROJECTION} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="cumulative" name="Savings" stroke="#10b981" strokeWidth={2} fill="url(#savingsGrad)" dot={{ fill: "#10b981", r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-slate-500 mt-2 text-center">
          At $650/mo, you hit $5,000 by <span className="text-emerald-400">December 2026</span>
        </p>
      </div>
    </div>
  );
}

// ─── GAME PLAN TAB ────────────────────────────────────────────────────────────

function GamePlanTab() {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-white/8 bg-card p-5">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={16} className="text-emerald-400" />
          <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
            The Real Game Plan — 2026 to 2028
          </h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          You're not broke — you're unorganized. You have <strong className="text-white">$1,567/mo</strong> after bills. Follow the Avalanche method: wipe the 0% debts fast, then destroy Debt 2 (22.74% APR) which is bleeding you the most.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { num: "01", title: "Pay Yourself First", desc: "The moment your paycheck hits, move $325 to savings BEFORE spending anything else. Automate it.", color: "#10b981" },
          { num: "02", title: "Kill the 22.74% APR", desc: "Debt 2 is your most expensive debt. After the quick kills, it gets all your firepower.", color: "#f97316" },
          { num: "03", title: "No Lifestyle Creep", desc: "When you clear a debt, roll that payment into the next one — don't spend it.", color: "#f43f5e" },
        ].map((rule) => (
          <div key={rule.num} className="rounded-xl border bg-card p-4" style={{ borderColor: rule.color + "33" }}>
            <div className="text-3xl font-black mb-2 opacity-30" style={{ fontFamily: "'Syne', sans-serif", color: rule.color }}>{rule.num}</div>
            <h4 className="text-sm font-bold text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>{rule.title}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{rule.desc}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <h3 className="text-sm font-bold text-white mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>Every Month, Do This</h3>
        <div className="space-y-2">
          {[
            { label: "Payday → Savings (auto-transfer)", amount: 650, color: "#10b981", note: "Non-negotiable. Do this first." },
            { label: "Debt Payment (current priority)", amount: 500, color: "#fbbf24", note: "Attack current target debt" },
            { label: "Fixed Bills", amount: TOTAL_EXPENSES, color: "#f43f5e", note: "Car, rent, insurance, food, gas, subs" },
            { label: "Buffer / Flex", amount: MONTHLY_LEFTOVER - 650 - 500, color: "#94a3b8", note: "Gas overages, unexpected costs" },
          ].map((row) => (
            <div key={row.label} className="flex items-start justify-between py-2 border-b border-white/5 last:border-0">
              <div>
                <p className="text-sm text-white">{row.label}</p>
                <p className="text-xs text-slate-500">{row.note}</p>
              </div>
              <span className="text-sm font-mono font-bold" style={{ color: row.color }}>{formatCurrency(row.amount)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/8 bg-card p-5">
        <h3 className="text-sm font-bold text-white mb-5" style={{ fontFamily: "'Syne', sans-serif" }}>Month-by-Month Roadmap</h3>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-white/8" />
          <div className="space-y-6">
            {GAME_PLAN.map((step, i) => (
              <div key={step.step} className="flex gap-4 relative animate-fade-slide" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10" style={{ background: step.color + "22", color: step.color, border: `1px solid ${step.color}44` }}>
                  {step.step}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-slate-500">{step.month}</span>
                    <ChevronRight size={12} className="text-slate-600" />
                    <h4 className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif", color: step.color }}>{step.title}</h4>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{step.description}</p>
                  <div className="text-xs rounded-lg px-3 py-2" style={{ background: step.color + "12", color: step.color, border: `1px solid ${step.color}22` }}>
                    <strong>Action:</strong> {step.action}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/8 bg-card p-5">
        <h3 className="text-sm font-bold text-white mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>The Mindset Shift</h3>
        <div className="space-y-3">
          {[
            { from: "\"I never have enough\"", to: "\"I have $1,567 left every month — I just need to direct it\"" },
            { from: "\"My money just leaves\"", to: "\"My money goes where I tell it to go\"" },
            { from: "\"I'll save what's left over\"", to: "\"I save first, then spend what's left\"" },
            { from: "\"I'll pay off debt someday\"", to: "\"I'm wiping Debt 4 this month, period\"" },
          ].map((shift) => (
            <div key={shift.from} className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-rose-500/8 border border-rose-500/15 px-3 py-2">
                <p className="text-xs text-rose-400 italic">{shift.from}</p>
              </div>
              <div className="rounded-lg bg-emerald-500/8 border border-emerald-500/15 px-3 py-2">
                <p className="text-xs text-emerald-400">{shift.to}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getDebtFreeDate(months: number): string {
  const start = new Date(2026, 4, 1); // May 2026
  start.setMonth(start.getMonth() + months);
  return start.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
