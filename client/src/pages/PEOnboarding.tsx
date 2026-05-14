// Personal Economy Pro — Onboarding Wizard
// 5 steps: Profile → Expenses → Debts → Savings → Investments
// Design: Dark Premium Fintech | Syne + Inter

import { useState } from "react";
import { PoweredByFooter, PoweredByBadge } from "@/components/PoweredByFooter";
import { useLocation } from "wouter";
import { useStore } from "@/hooks/usePEStore";
import {
  UserProfile, Expense, Debt, Investment,
  PayFrequency, generateDebtId, generateExpenseId, generateInvestmentId,
  getDebtColor, getInvestColor,
} from "@/lib/peStore";
import { Plus, Trash2, ArrowRight, ArrowLeft, CheckCircle2, DollarSign } from "lucide-react";
import { toast } from "sonner";

type Step = 1 | 2 | 3 | 4 | 5;

const STEPS = [
  { id: 1, label: "Income" },
  { id: 2, label: "Expenses" },
  { id: 3, label: "Debts" },
  { id: 4, label: "Savings" },
  { id: 5, label: "Investments" },
];

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

const INVEST_TYPES = [
  { value: "stocks", label: "Stocks" },
  { value: "etf", label: "ETF / Index Fund" },
  { value: "crypto", label: "Crypto" },
  { value: "401k", label: "401(k)" },
  { value: "ira", label: "IRA / Roth IRA" },
  { value: "real_estate", label: "Real Estate" },
  { value: "other", label: "Other" },
];

const inputClass = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all";
const labelClass = "block text-xs text-slate-400 mb-1.5 font-medium";
const selectClass = "w-full bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all";

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { completeSetup } = useStore();
  const [step, setStep] = useState<Step>(1);

  // Step 1 — Profile
  const [name, setName] = useState("");
  const [income, setIncome] = useState("");
  const [payFrequency, setPayFrequency] = useState<PayFrequency>("biweekly");
  const [firstPayday, setFirstPayday] = useState("");
  const [currency, setCurrency] = useState("$");

  // Step 2 — Expenses
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: generateExpenseId(), label: "", amount: 0, category: "housing", isEssential: true },
  ]);

  // Step 3 — Debts
  const [debts, setDebts] = useState<Debt[]>([]);
  const [hasDebts, setHasDebts] = useState<boolean | null>(null);

  // Step 4 — Savings
  const [savingsGoal, setSavingsGoal] = useState("");
  const [currentSaved, setCurrentSaved] = useState("0");

  // Step 5 — Investments
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [hasInvestments, setHasInvestments] = useState<boolean | null>(null);

  // ── Expense helpers ────────────────────────────────────────────────────────
  const addExpense = () => {
    setExpenses((prev) => [
      ...prev,
      { id: generateExpenseId(), label: "", amount: 0, category: "other", isEssential: false },
    ]);
  };

  const updateExpense = (id: string, fields: Partial<Expense>) => {
    setExpenses((prev) => prev.map((e) => e.id === id ? { ...e, ...fields } : e));
  };

  const removeExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // ── Debt helpers ───────────────────────────────────────────────────────────
  const addDebt = () => {
    const idx = debts.length;
    setDebts((prev) => [
      ...prev,
      {
        id: generateDebtId(),
        name: "",
        balance: 0,
        originalBalance: 0,
        apr: 0,
        minimumPayment: 0,
        paid: 0,
        color: getDebtColor(idx),
      },
    ]);
  };

  const updateDebt = (id: string, fields: Partial<Debt>) => {
    setDebts((prev) => prev.map((d) => d.id === id ? { ...d, ...fields } : d));
  };

  const removeDebt = (id: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== id));
  };

  // ── Investment helpers ─────────────────────────────────────────────────────
  const addInvestment = () => {
    const idx = investments.length;
    setInvestments((prev) => [
      ...prev,
      {
        id: generateInvestmentId(),
        name: "",
        type: "etf",
        currentValue: 0,
        amountInvested: 0,
        monthlyContribution: 0,
        color: getInvestColor(idx),
      },
    ]);
  };

  const updateInvestment = (id: string, fields: Partial<Investment>) => {
    setInvestments((prev) => prev.map((i) => i.id === id ? { ...i, ...fields } : i));
  };

  const removeInvestment = (id: string) => {
    setInvestments((prev) => prev.filter((i) => i.id !== id));
  };

  // ── Navigation ─────────────────────────────────────────────────────────────
  const next = () => {
    if (step === 1) {
      if (!name.trim()) { toast.error("Please enter your name"); return; }
      if (!income || isNaN(Number(income)) || Number(income) <= 0) { toast.error("Please enter a valid income"); return; }
      if (!firstPayday) { toast.error("Please select your next payday"); return; }
    }
    if (step === 2) {
      const valid = expenses.every((e) => e.label.trim() && e.amount > 0);
      if (!valid) { toast.error("Please fill in all expense fields"); return; }
    }
    if (step === 3 && hasDebts && debts.length > 0) {
      const valid = debts.every((d) => d.name.trim() && d.balance > 0);
      if (!valid) { toast.error("Please fill in all debt fields"); return; }
    }
    if (step < 5) setStep((s) => (s + 1) as Step);
  };

  const back = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  };

  const finish = () => {
    const profile: UserProfile = {
      name: name.trim(),
      income: Number(income),
      payFrequency,
      firstPayday,
      savingsGoal: Number(savingsGoal) || 5000,
      currency,
    };

    const finalDebts: Debt[] = (hasDebts ? debts : []).map((d) => ({
      ...d,
      originalBalance: d.balance,
    }));

    const finalInvestments: Investment[] = hasInvestments ? investments : [];

    completeSetup(profile, expenses, finalDebts, finalInvestments, Number(currentSaved) || 0);
    toast.success("Your Personal Economy is ready!");
    navigate("/pro/dashboard");
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-[#080a0f] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* TOP BAR */}
      <div className="border-b border-white/6 px-6 py-4 flex items-center justify-between" style={{ background: "rgba(8,10,15,0.95)" }}>
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center text-sm font-black"
            style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff" }}
          >
            £
          </div>
          <span className="text-sm font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Personal Economy</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">Step {step} of {STEPS.length}</span>
          <button
            onClick={() => navigate("/pro")}
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            ← Exit
          </button>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="h-0.5 bg-white/5">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${progress}%`, background: "linear-gradient(90deg, #10b981, #059669)" }}
        />
      </div>

      {/* STEP INDICATORS */}
      <div className="border-b border-white/6 px-6 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > s.id
                    ? "bg-emerald-500 text-white"
                    : step === s.id
                    ? "border-2 border-emerald-500 text-emerald-400"
                    : "border border-white/15 text-slate-600"
                }`}
              >
                {step > s.id ? <CheckCircle2 size={12} /> : s.id}
              </div>
              <span className={`text-xs hidden sm:inline ${step === s.id ? "text-white font-semibold" : "text-slate-600"}`}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && <div className="w-4 md:w-12 h-px bg-white/8 mx-1" />}
            </div>
          ))}
        </div>
      </div>

      {/* FORM CONTENT */}
      <div className="flex-1 flex items-start justify-center py-10 px-6">
        <div className="w-full max-w-2xl">

          {/* STEP 1 — INCOME */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-black mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>Let's start with your income</h2>
              <p className="text-slate-400 text-sm mb-8">This is the foundation of your entire plan.</p>
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Your Name</label>
                    <input className={inputClass} placeholder="e.g. Jordan" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Currency</label>
                    <select className={selectClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                      <option value="$">$ USD</option>
                      <option value="£">£ GBP</option>
                      <option value="€">€ EUR</option>
                      <option value="CA$">CA$ CAD</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Pay Amount (per paycheck)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{currency}</span>
                      <input className={inputClass + " pl-7"} type="number" placeholder="1,600" value={income} onChange={(e) => setIncome(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Pay Frequency</label>
                    <select className={selectClass} value={payFrequency} onChange={(e) => setPayFrequency(e.target.value as PayFrequency)}>
                      <option value="biweekly">Biweekly (every 2 weeks)</option>
                      <option value="weekly">Weekly</option>
                      <option value="semimonthly">Semimonthly (1st & 15th)</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Next Payday</label>
                  <input
                    className={inputClass}
                    type="date"
                    value={firstPayday}
                    onChange={(e) => setFirstPayday(e.target.value)}
                    style={{ colorScheme: "dark" }}
                  />
                </div>
                {income && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <div className="text-xs text-emerald-400 font-mono uppercase tracking-wider mb-1">Estimated Monthly Income</div>
                    <div className="text-2xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                      {currency}{Math.round(
                        payFrequency === "biweekly" ? Number(income) * 26 / 12 :
                        payFrequency === "weekly" ? Number(income) * 52 / 12 :
                        payFrequency === "semimonthly" ? Number(income) * 2 :
                        Number(income)
                      ).toLocaleString()}/mo
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2 — EXPENSES */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-black mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>Monthly expenses</h2>
              <p className="text-slate-400 text-sm mb-8">Add every recurring bill and regular expense. Be honest — this is where most money disappears.</p>
              <div className="space-y-3 mb-4">
                {expenses.map((e, i) => (
                  <div key={e.id} className="rounded-xl border border-white/8 bg-white/3 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                      <div className="flex-1 min-w-0">
                        {i === 0 && <label className={labelClass}>Expense Name</label>}
                        <input className={inputClass} placeholder="e.g. Rent" value={e.label} onChange={(ev) => updateExpense(e.id, { label: ev.target.value })} />
                      </div>
                      <div className="w-full sm:w-28">
                        {i === 0 && <label className={labelClass}>Amount</label>}
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                          <input className={inputClass + " pl-6"} type="number" placeholder="0" value={e.amount || ""} onChange={(ev) => updateExpense(e.id, { amount: Number(ev.target.value) })} />
                        </div>
                      </div>
                      <div className="w-full sm:w-36">
                        {i === 0 && <label className={labelClass}>Category</label>}
                        <select className={selectClass} value={e.category} onChange={(ev) => updateExpense(e.id, { category: ev.target.value as Expense["category"] })}>
                          {EXPENSE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-2">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input type="checkbox" checked={e.isEssential} onChange={(ev) => updateExpense(e.id, { isEssential: ev.target.checked })} className="w-3.5 h-3.5 accent-emerald-500" />
                          <span className="text-xs text-slate-500">Essential</span>
                        </label>
                        {expenses.length > 1 && (
                          <button onClick={() => removeExpense(e.id)} className="text-slate-600 hover:text-rose-400 transition-colors p-1">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={addExpense}
                className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors border border-emerald-500/20 hover:border-emerald-500/40 rounded-lg px-4 py-2.5 w-full justify-center"
              >
                <Plus size={14} /> Add Expense
              </button>
              {expenses.length > 0 && (
                <div className="mt-4 rounded-xl border border-white/8 bg-white/3 p-4 flex justify-between items-center">
                  <span className="text-sm text-slate-400">Total Monthly Expenses</span>
                  <span className="text-xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                    ${expenses.reduce((s, e) => s + (e.amount || 0), 0).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 3 — DEBTS */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-black mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>Do you have any debt?</h2>
              <p className="text-slate-400 text-sm mb-8">Credit cards, loans, medical bills — anything you owe. This is where your plan gets real.</p>

              {hasDebts === null && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => { setHasDebts(true); if (debts.length === 0) addDebt(); }}
                    className="rounded-xl border border-white/10 hover:border-emerald-500/40 bg-white/3 hover:bg-emerald-500/5 p-6 text-left transition-all"
                  >
                    <div className="text-2xl mb-2">💳</div>
                    <div className="font-bold text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>Yes, I have debt</div>
                    <div className="text-xs text-slate-500">Add my debts and build a payoff plan</div>
                  </button>
                  <button
                    onClick={() => setHasDebts(false)}
                    className="rounded-xl border border-white/10 hover:border-emerald-500/40 bg-white/3 hover:bg-emerald-500/5 p-6 text-left transition-all"
                  >
                    <div className="text-2xl mb-2">✅</div>
                    <div className="font-bold text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>No debt — I'm clear</div>
                    <div className="text-xs text-slate-500">Skip this step and focus on savings</div>
                  </button>
                </div>
              )}

              {hasDebts === false && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
                  <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-3" />
                  <div className="font-bold text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>Debt-free! That's a W.</div>
                  <div className="text-sm text-slate-400">We'll focus your plan entirely on savings and investments.</div>
                  <button onClick={() => setHasDebts(null)} className="mt-4 text-xs text-slate-500 hover:text-white transition-colors">
                    Actually, I do have debt →
                  </button>
                </div>
              )}

              {hasDebts === true && (
                <div>
                  <div className="space-y-3 mb-4">
                    {debts.map((d, i) => (
                      <div key={d.id} className="rounded-xl border border-white/8 bg-white/3 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ background: d.color }} />
                          <span className="text-xs text-slate-400 font-mono">Debt {i + 1}</span>
                          <button onClick={() => removeDebt(d.id)} className="ml-auto text-slate-600 hover:text-rose-400 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className={labelClass}>Debt Name</label>
                            <input className={inputClass} placeholder="e.g. Capital One" value={d.name} onChange={(e) => updateDebt(d.id, { name: e.target.value })} />
                          </div>
                          <div>
                            <label className={labelClass}>Current Balance</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                              <input className={inputClass + " pl-6"} type="number" placeholder="0" value={d.balance || ""} onChange={(e) => updateDebt(d.id, { balance: Number(e.target.value) })} />
                            </div>
                          </div>
                          <div>
                            <label className={labelClass}>APR / Interest Rate %</label>
                            <div className="relative">
                              <input className={inputClass + " pr-6"} type="number" placeholder="0" value={d.apr || ""} onChange={(e) => updateDebt(d.id, { apr: Number(e.target.value) })} />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                            </div>
                          </div>
                          <div>
                            <label className={labelClass}>Minimum Monthly Payment</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                              <input className={inputClass + " pl-6"} type="number" placeholder="0" value={d.minimumPayment || ""} onChange={(e) => updateDebt(d.id, { minimumPayment: Number(e.target.value) })} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={addDebt}
                    className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 hover:border-emerald-500/40 rounded-lg px-4 py-2.5 w-full justify-center transition-all"
                  >
                    <Plus size={14} /> Add Another Debt
                  </button>
                  {debts.length > 0 && (
                    <div className="mt-4 rounded-xl border border-white/8 bg-white/3 p-4 flex justify-between items-center">
                      <span className="text-sm text-slate-400">Total Debt</span>
                      <span className="text-xl font-black text-rose-400" style={{ fontFamily: "'Syne', sans-serif" }}>
                        ${debts.reduce((s, d) => s + (d.balance || 0), 0).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 4 — SAVINGS */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-black mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>Savings goal</h2>
              <p className="text-slate-400 text-sm mb-8">What are you trying to stack? Set a target and we'll track your progress.</p>
              <div className="space-y-5">
                <div>
                  <label className={labelClass}>How much do you currently have saved?</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input className={inputClass + " pl-7"} type="number" placeholder="0" value={currentSaved} onChange={(e) => setCurrentSaved(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Savings Goal</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input className={inputClass + " pl-7"} type="number" placeholder="e.g. 10000" value={savingsGoal} onChange={(e) => setSavingsGoal(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[1000, 5000, 10000].map((g) => (
                    <button
                      key={g}
                      onClick={() => setSavingsGoal(String(g))}
                      className={`rounded-xl border py-3 text-sm font-semibold transition-all ${
                        savingsGoal === String(g)
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                          : "border-white/10 text-slate-400 hover:border-white/20"
                      }`}
                    >
                      ${g.toLocaleString()}
                    </button>
                  ))}
                </div>
                {savingsGoal && Number(currentSaved) < Number(savingsGoal) && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <div className="text-xs text-emerald-400 font-mono uppercase tracking-wider mb-1">Still Need to Save</div>
                    <div className="text-2xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                      ${(Number(savingsGoal) - Number(currentSaved)).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5 — INVESTMENTS */}
          {step === 5 && (
            <div>
              <h2 className="text-2xl font-black mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>Do you invest?</h2>
              <p className="text-slate-400 text-sm mb-8">Stocks, ETFs, crypto, 401k — add them to see your full net worth picture.</p>

              {hasInvestments === null && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => { setHasInvestments(true); if (investments.length === 0) addInvestment(); }}
                    className="rounded-xl border border-white/10 hover:border-indigo-500/40 bg-white/3 hover:bg-indigo-500/5 p-6 text-left transition-all"
                  >
                    <div className="text-2xl mb-2">📈</div>
                    <div className="font-bold text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>Yes, I invest</div>
                    <div className="text-xs text-slate-500">Add my portfolio and track gains</div>
                  </button>
                  <button
                    onClick={() => { setHasInvestments(false); finish(); }}
                    className="rounded-xl border border-white/10 hover:border-emerald-500/40 bg-white/3 hover:bg-emerald-500/5 p-6 text-left transition-all"
                  >
                    <div className="text-2xl mb-2">🚀</div>
                    <div className="font-bold text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>Not yet — skip</div>
                    <div className="text-xs text-slate-500">Finish setup and open my dashboard</div>
                  </button>
                </div>
              )}

              {hasInvestments === true && (
                <div>
                  <div className="space-y-3 mb-4">
                    {investments.map((inv, i) => (
                      <div key={inv.id} className="rounded-xl border border-white/8 bg-white/3 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ background: inv.color }} />
                          <span className="text-xs text-slate-400 font-mono">Investment {i + 1}</span>
                          <button onClick={() => removeInvestment(inv.id)} className="ml-auto text-slate-600 hover:text-rose-400 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className={labelClass}>Name / Ticker</label>
                            <input className={inputClass} placeholder="e.g. S&P 500 ETF" value={inv.name} onChange={(e) => updateInvestment(inv.id, { name: e.target.value })} />
                          </div>
                          <div>
                            <label className={labelClass}>Type</label>
                            <select className={selectClass} value={inv.type} onChange={(e) => updateInvestment(inv.id, { type: e.target.value as Investment["type"] })}>
                              {INVEST_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={labelClass}>Current Value</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                              <input className={inputClass + " pl-6"} type="number" placeholder="0" value={inv.currentValue || ""} onChange={(e) => updateInvestment(inv.id, { currentValue: Number(e.target.value) })} />
                            </div>
                          </div>
                          <div>
                            <label className={labelClass}>Amount Invested (cost basis)</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                              <input className={inputClass + " pl-6"} type="number" placeholder="0" value={inv.amountInvested || ""} onChange={(e) => updateInvestment(inv.id, { amountInvested: Number(e.target.value) })} />
                            </div>
                          </div>
                          <div className="col-span-2">
                            <label className={labelClass}>Monthly Contribution (optional)</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                              <input className={inputClass + " pl-6"} type="number" placeholder="0" value={inv.monthlyContribution || ""} onChange={(e) => updateInvestment(inv.id, { monthlyContribution: Number(e.target.value) })} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={addInvestment}
                    className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/40 rounded-lg px-4 py-2.5 w-full justify-center transition-all mb-4"
                  >
                    <Plus size={14} /> Add Investment
                  </button>
                  {investments.length > 0 && (
                    <div className="rounded-xl border border-white/8 bg-white/3 p-4 flex justify-between items-center">
                      <span className="text-sm text-slate-400">Total Portfolio Value</span>
                      <span className="text-xl font-black text-indigo-400" style={{ fontFamily: "'Syne', sans-serif" }}>
                        ${investments.reduce((s, i) => s + (i.currentValue || 0), 0).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* NAVIGATION BUTTONS */}
          <div className="flex items-center justify-between mt-6 sm:mt-10 pt-4 sm:pt-6 border-t border-white/8">
            <button
              onClick={back}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white border border-white/10 hover:border-white/20 transition-all ${step === 1 ? "invisible" : ""}`}
            >
              <ArrowLeft size={14} /> Back
            </button>

            {step < 5 ? (
              <button
                onClick={next}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-black transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
              >
                Continue <ArrowRight size={14} />
              </button>
            ) : hasInvestments === true ? (
              <button
                onClick={finish}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-black transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
              >
                Build My Dashboard <ArrowRight size={14} />
              </button>
            ) : null}
          </div>

        </div>
      </div>
      {/* BOTTOM FOOTER BAR */}
      <footer className="border-t border-white/6 py-4 mt-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-black" style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff" }}>£</div>
            <span className="text-xs font-semibold text-slate-500" style={{ fontFamily: "'Syne', sans-serif" }}>Personal Economy</span>
          </div>
          <PoweredByBadge />
          <p className="text-xs text-slate-600">All data is stored locally on your device.</p>
        </div>
      </footer>
    </div>
  );
}
