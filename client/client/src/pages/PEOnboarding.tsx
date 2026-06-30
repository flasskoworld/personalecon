// Personal Economy Pro — Onboarding Wizard
// 5 steps: Income → Expenses → Debts → Savings → Investments
// Design: SE HQ Sovereign Dark | Syne + Space Mono + Inter | Gold #C9A84C
// Feel: Bloomberg terminal intake form — sharp edges, mono labels, gold focus

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

// ── SE HQ form styles — sharp edges, gold focus ───────────────────────────────
const inputClass = "w-full bg-white/4 border border-white/8 px-3 py-2.5 text-sm focus:outline-none transition-all";
const inputStyle: React.CSSProperties = {color: "#F0EDE4"};
const labelClass = "block uppercase mb-1.5 font-bold";
const labelStyle: React.CSSProperties = {fontSize: "8px", letterSpacing: "0.18em", color: "#4A505E"};
const labelMono = { fontFamily: "'Space Mono', monospace" } as React.CSSProperties;
const selectClass = "w-full border border-white/8 px-3 py-2.5 text-sm focus:outline-none transition-all";
const selectStyle: React.CSSProperties = {background: "#0B0E16", color: "#F0EDE4"};

// SE-styled card container
const seCard = "border border-white/6 p-4";
const seCardStyle: React.CSSProperties = {background: "rgba(255,255,255,0.02)"};
const seCardGold = "border p-4";
const seCardGoldStyle: React.CSSProperties = {borderColor: "rgba(201,168,76,0.2)", background: "rgba(201,168,76,0.04)"};

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

 // Step titles use Playfair for editorial weight
 const stepTitle = (text: string) => (
 <h2
 className="text-2xl md:text-3xl font-extrabold mb-1.5" style={{color: '#F0EDE4', fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "-0.01em"}}
 >
 {text}
 </h2>
 );

 const stepEyebrow = (text: string) => (
 <div
 className="inline-flex items-center gap-2 uppercase mb-4 border-l-2 pl-2.5" style={{fontSize: '9px', letterSpacing: '0.25em', color: '#C9A84C', borderColor: "#C9A84C"}}
 >
 {text}
 </div>
 );

 return (
 <div
 className="min-h-screen flex flex-col" style={{color: '#F0EDE4', background: "#06080E",
 fontFamily: "'Inter', sans-serif",
 backgroundImage:
 "linear-gradient(rgba(201,168,76,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.025) 1px, transparent 1px)",
 backgroundSize: "40px 40px",
 backgroundAttachment: "fixed",}}
 >

 {/* TOP BAR */}
 <div
 className="border-b px-6 py-3.5 flex items-center justify-between"
 style={{ borderColor: "rgba(201,168,76,0.15)", background: "rgba(6,8,14,0.95)", backdropFilter: "blur(12px)" }}
 >
 <div className="flex items-center gap-2.5">
 <img src="/evergreen-icon.png" alt="Evergreen Icon" style={{width:"32px",height:"32px",objectFit:"contain"}}/>
 <div>
 <div className="font-bold uppercase leading-tight" style={{fontFamily: "'Syne', sans-serif", fontSize: '12px', letterSpacing: '0.1em'}}>Personal Economy</div>
 <div className="uppercase leading-tight" style={{fontSize: '7px', letterSpacing: '0.2em', color: '#C9A84C'}}>Setup Protocol</div>
 </div>
 </div>
 <div className="flex items-center gap-4">
 <span className="uppercase" style={{fontSize: '9px', letterSpacing: '0.15em', color: '#4A505E'}}>
 Step {step} / {STEPS.length}
 </span>
 <button
 onClick={() => navigate("/pro")}
 className="uppercase transition-colors" style={{fontSize: '9px', letterSpacing: '0.12em', color: '#3D4250'}}
 >
 ← Exit
 </button>
 </div>
 </div>

 {/* PROGRESS BAR — gold */}
 <div className="bg-white/4" style={{height: '2px'}}>
 <div
 className="h-full transition-all duration-700"
 style={{ width: `${progress}%`, background: "linear-gradient(90deg, #A07830, #C9A84C)" }}
 />
 </div>

 {/* STEP INDICATORS */}
 <div className="border-b border-white/5 px-6 py-3">
 <div className="max-w-2xl mx-auto flex items-center justify-between">
 {STEPS.map((s, i) => (
 <div key={s.id} className="flex items-center gap-1.5">
 <div
 className={`w-6 h-6 flex items-center justify-center text-[10px] font-bold transition-all ${
 step > s.id
 ? "active-done" /* via style */
 : step === s.id
 ? "border active-step" /* via style */
 : "border"
 }`}
 style={labelMono}
 >
 {step > s.id ? <CheckCircle2 size={11} /> : s.id}
 </div>
 <span
 className={`uppercase hidden sm:inline ${step === s.id ? "" /* color via style */ : "" /* color via style */}`}
 style={labelMono}
 >
 {s.label}
 </span>
 {i < STEPS.length - 1 && <div className="w-4 md:w-10 h-px mx-1" style={{ background: step > s.id ? "rgba(201,168,76,0.3)" : "rgba(255,255,255,0.06)" }} />}
 </div>
 ))}
 </div>
 </div>

 {/* FORM CONTENT */}
 <div className="flex-1 flex items-start justify-center py-10 px-6">
 <div className="w-full max-w-2xl animate-fade-slide" key={step}>

 {/* STEP 1 — INCOME */}
 {step === 1 && (
 <div>
 {stepEyebrow("Foundation")}
 {stepTitle("Let's start with your income")}
 <p className="text-sm mb-8" style={{color: '#7A8090'}}>This is the foundation of your entire plan.</p>
 <div className="space-y-5">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className={labelClass} style={{...labelStyle, ...labelMono}}>Your Name</label>
 <input className={inputClass} style={inputStyle} placeholder="e.g. Jordan" value={name} onChange={(e) => setName(e.target.value)} />
 </div>
 <div>
 <label className={labelClass} style={{...labelStyle, ...labelMono}}>Currency</label>
 <select className={selectClass} style={selectStyle} value={currency} onChange={(e) => setCurrency(e.target.value)}>
 <option value="$">$ USD</option>
 <option value="£">£ GBP</option>
 <option value="€">€ EUR</option>
 <option value="CA$">CA$ CAD</option>
 </select>
 </div>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className={labelClass} style={{...labelStyle, ...labelMono}}>Pay Amount (per paycheck)</label>
 <div className="relative">
 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{color: '#7A8090'}}>{currency}</span>
 <input className={inputClass + " pl-7"} style={inputStyle} type="number" placeholder="1,600" value={income} onChange={(e) => setIncome(e.target.value)} />
 </div>
 </div>
 <div>
 <label className={labelClass} style={{...labelStyle, ...labelMono}}>Pay Frequency</label>
 <select className={selectClass} style={selectStyle} value={payFrequency} onChange={(e) => setPayFrequency(e.target.value as PayFrequency)}>
 <option value="biweekly">Biweekly (every 2 weeks)</option>
 <option value="weekly">Weekly</option>
 <option value="semimonthly">Semimonthly (1st & 15th)</option>
 <option value="monthly">Monthly</option>
 </select>
 </div>
 </div>
 <div>
 <label className={labelClass} style={{...labelStyle, ...labelMono}}>Next Payday</label>
 <input
 className={inputClass}
 type="date"
 value={firstPayday}
 onChange={(e) => setFirstPayday(e.target.value)}
 style={{ colorScheme: "dark" }}
 />
 </div>
 {income && (
 <div className={seCardGold + " relative overflow-hidden"} style={seCardGoldStyle}>
 <div className="absolute top-0 left-0 right-0" style={{background: "linear-gradient(90deg, #C9A84C, transparent 70%)", height: '2px'}} />
 <div className="uppercase mb-1.5" style={{fontSize: '8px', color: '#C9A84C', letterSpacing: '0.2em'}}>Estimated Monthly Income</div>
 <div className="text-2xl font-extrabold" style={{fontFamily: "'Syne', sans-serif", letterSpacing: "-0.02em", color: '#F0EDE4'}}>
 {currency}{Math.round(
 payFrequency === "biweekly" ? Number(income) * 26 / 12 :
 payFrequency === "weekly" ? Number(income) * 52 / 12 :
 payFrequency === "semimonthly" ? Number(income) * 2 :
 Number(income)
 ).toLocaleString()}<span className="text-sm font-normal" style={{color: '#4A505E'}}>/mo</span>
 </div>
 </div>
 )}
 </div>
 </div>
 )}

 {/* STEP 2 — EXPENSES */}
 {step === 2 && (
 <div>
 {stepEyebrow("Outflows")}
 {stepTitle("Monthly expenses")}
 <p className="text-sm mb-8" style={{color: '#7A8090'}}>Add every recurring bill and regular expense. Be honest — this is where most money disappears.</p>
 <div className="space-y-3 mb-4">
 {expenses.map((e, i) => (
 <div key={e.id} className={seCard} style={seCardStyle}>
 <div className="flex flex-col sm:flex-row sm:items-end gap-3">
 <div className="flex-1 min-w-0">
 {i === 0 && <label className={labelClass} style={{...labelStyle, ...labelMono}}>Expense Name</label>}
 <input className={inputClass} style={inputStyle} placeholder="e.g. Rent" value={e.label} onChange={(ev) => updateExpense(e.id, { label: ev.target.value })} />
 </div>
 <div className="w-full sm:w-28">
 {i === 0 && <label className={labelClass} style={{...labelStyle, ...labelMono}}>Amount</label>}
 <div className="relative">
 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{color: '#7A8090'}}>$</span>
 <input className={inputClass + " pl-6"} style={inputStyle} type="number" placeholder="0" value={e.amount || ""} onChange={(ev) => updateExpense(e.id, { amount: Number(ev.target.value) })} />
 </div>
 </div>
 <div className="w-full sm:w-36">
 {i === 0 && <label className={labelClass} style={{...labelStyle, ...labelMono}}>Category</label>}
 <select className={selectClass} style={selectStyle} value={e.category} onChange={(ev) => updateExpense(e.id, { category: ev.target.value as Expense["category"] })}>
 {EXPENSE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
 </select>
 </div>
 <div className="w-full sm:w-20">
 {i === 0 && <label className={labelClass} style={{...labelStyle, ...labelMono}}>Due Day</label>}
 <input
 className={inputClass}
 style={inputStyle}
 type="number"
 min="1"
 max="31"
 placeholder="Day"
 title="Day of month this bill is due (1-31)"
 value={e.dueDay || ""}
 onChange={(ev) => updateExpense(e.id, { dueDay: ev.target.value ? Number(ev.target.value) : undefined })}
 />
 </div>
 <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-2">
 <label className="flex items-center gap-1.5 cursor-pointer">
 <input type="checkbox" checked={e.isEssential} onChange={(ev) => updateExpense(e.id, { isEssential: ev.target.checked })} className="w-3.5 h-3.5" />
 <span className="uppercase" style={{fontSize: '9px', letterSpacing: '0.08em', color: '#4A505E'}}>Essential</span>
 </label>
 {expenses.length > 1 && (
 <button onClick={() => removeExpense(e.id)} className="hover:text-[#E05252] transition-colors p-1" style={{color: '#3D4250'}}>
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
 className="flex items-center gap-2 uppercase font-bold transition-colors border px-4 py-2.5 w-full justify-center" style={{fontSize: '10px', letterSpacing: '0.1em', color: '#C9A84C', borderColor: 'rgba(201,168,76,0.2)'}}
 >
 <Plus size={13} /> Add Expense
 </button>
 {expenses.length > 0 && (
 <div className={"mt-4 " + seCard + " flex justify-between items-center"} style={seCardStyle}>
 <span className="uppercase" style={{fontSize: '9px', letterSpacing: '0.15em', color: '#4A505E'}}>Total Monthly Expenses</span>
 <span className="text-xl font-extrabold" style={{fontFamily: "'Syne', sans-serif", color: '#F0EDE4'}}>
 ${expenses.reduce((s, e) => s + (e.amount || 0), 0).toLocaleString()}
 </span>
 </div>
 )}
 </div>
 )}

 {/* STEP 3 — DEBTS */}
 {step === 3 && (
 <div>
 {stepEyebrow("Liabilities")}
 {stepTitle("Do you have any debt?")}
 <p className="text-sm mb-8" style={{color: '#7A8090'}}>Credit cards, loans, medical bills — anything you owe. This is where your plan gets real.</p>

 {hasDebts === null && (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <button
 onClick={() => { setHasDebts(true); if (debts.length === 0) addDebt(); }}
 className="border border-white/8 p-6 text-left transition-all group" style={{background: 'rgba(255,255,255,0.02)'}}
 >
 <div className="w-9 h-9 mb-3 flex items-center justify-center border text-base transition-all" style={{borderColor: 'rgba(224,82,82,0.25)', color: '#E05252'}}>⚔</div>
 <div className="font-bold mb-1 text-sm" style={{fontFamily: "'Syne', sans-serif", color: '#F0EDE4'}}>Yes, I have debt</div>
 <div className="" style={{fontSize: '10px', color: '#4A505E', letterSpacing: '0.04em'}}>Add my debts · build a payoff plan</div>
 </button>
 <button
 onClick={() => setHasDebts(false)}
 className="border border-white/8 p-6 text-left transition-all group" style={{background: 'rgba(255,255,255,0.02)'}}
 >
 <div className="w-9 h-9 mb-3 flex items-center justify-center border text-base transition-all" style={{borderColor: 'rgba(201,168,76,0.25)', color: '#C9A84C'}}>◎</div>
 <div className="font-bold mb-1 text-sm" style={{fontFamily: "'Syne', sans-serif", color: '#F0EDE4'}}>No debt — I'm clear</div>
 <div className="" style={{fontSize: '10px', color: '#4A505E', letterSpacing: '0.04em'}}>Skip this step · focus on savings</div>
 </button>
 </div>
 )}

 {hasDebts === false && (
 <div className={seCardGold + " text-center py-8 relative overflow-hidden"} style={seCardGoldStyle}>
 <div className="absolute top-0 left-0 right-0" style={{background: "linear-gradient(90deg, #C9A84C, transparent 70%)", height: '2px'}} />
 <CheckCircle2 size={32} className="mx-auto mb-3" style={{color: '#C9A84C'}} />
 <div className="font-bold mb-1" style={{fontFamily: "'Syne', sans-serif", color: '#F0EDE4'}}>Debt-free. That's a W.</div>
 <div className="text-sm" style={{color: '#7A8090'}}>We'll focus your plan entirely on savings and investments.</div>
 <button onClick={() => setHasDebts(null)} className="mt-4 uppercase transition-colors" style={{fontSize: '9px', letterSpacing: '0.1em', color: '#4A505E'}}>
 Actually, I do have debt →
 </button>
 </div>
 )}

 {hasDebts === true && (
 <div>
 <div className="space-y-3 mb-4">
 {debts.map((d, i) => (
 <div key={d.id} className={seCard} style={seCardStyle}>
 <div className="flex items-center gap-2 mb-3">
 <div className="w-2.5 h-2.5 shrink-0" style={{ background: d.color }} />
 <span className="uppercase" style={{fontSize: '9px', letterSpacing: '0.15em', color: '#4A505E'}}>Debt {String(i + 1).padStart(2, "0")}</span>
 <button onClick={() => removeDebt(d.id)} className="ml-auto transition-colors" style={{color: '#3D4250'}}>
 <Trash2 size={13} />
 </button>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className={labelClass} style={{...labelStyle, ...labelMono}}>Debt Name</label>
 <input className={inputClass} style={inputStyle} placeholder="e.g. Capital One" value={d.name} onChange={(e) => updateDebt(d.id, { name: e.target.value })} />
 </div>
 <div>
 <label className={labelClass} style={{...labelStyle, ...labelMono}}>Current Balance</label>
 <div className="relative">
 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{color: '#7A8090'}}>$</span>
 <input className={inputClass + " pl-6"} style={inputStyle} type="number" placeholder="0" value={d.balance || ""} onChange={(e) => updateDebt(d.id, { balance: Number(e.target.value) })} />
 </div>
 </div>
 <div>
 <label className={labelClass} style={{...labelStyle, ...labelMono}}>APR / Interest Rate %</label>
 <div className="relative">
 <input className={inputClass + " pr-6"} style={inputStyle} type="number" placeholder="0" value={d.apr || ""} onChange={(e) => updateDebt(d.id, { apr: Number(e.target.value) })} />
 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{color: '#7A8090'}}>%</span>
 </div>
 </div>
 <div>
 <label className={labelClass} style={{...labelStyle, ...labelMono}}>Minimum Monthly Payment</label>
 <div className="relative">
 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{color: '#7A8090'}}>$</span>
 <input className={inputClass + " pl-6"} style={inputStyle} type="number" placeholder="0" value={d.minimumPayment || ""} onChange={(e) => updateDebt(d.id, { minimumPayment: Number(e.target.value) })} />
 </div>
 </div>
 <div>
 <label className={labelClass} style={{...labelStyle, ...labelMono}}>Payment Due Day</label>
 <input
 className={inputClass}
 style={inputStyle}
 type="number"
 min="1"
 max="31"
 placeholder="e.g. 15"
 title="Day of month this payment is due (1-31)"
 value={d.dueDay || ""}
 onChange={(e) => updateDebt(d.id, { dueDay: e.target.value ? Number(e.target.value) : undefined })}
 />
 </div>
 </div>
 </div>
 ))}
 </div>
 <button
 onClick={addDebt}
 className="flex items-center gap-2 uppercase font-bold border px-4 py-2.5 w-full justify-center transition-all" style={{fontSize: '10px', letterSpacing: '0.1em', color: '#C9A84C', borderColor: 'rgba(201,168,76,0.2)'}}
 >
 <Plus size={13} /> Add Another Debt
 </button>
 {debts.length > 0 && (
 <div className={"mt-4 " + seCard + " flex justify-between items-center"} style={seCardStyle}>
 <span className="uppercase" style={{fontSize: '9px', letterSpacing: '0.15em', color: '#4A505E'}}>Total Debt</span>
 <span className="text-xl font-extrabold" style={{fontFamily: "'Syne', sans-serif", color: '#E05252'}}>
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
 {stepEyebrow("Reserves")}
 {stepTitle("Savings goal")}
 <p className="text-sm mb-8" style={{color: '#7A8090'}}>What are you trying to stack? Set a target and we'll track your progress.</p>
 <div className="space-y-5">
 <div>
 <label className={labelClass} style={{...labelStyle, ...labelMono}}>How much do you currently have saved?</label>
 <div className="relative">
 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{color: '#7A8090'}}>$</span>
 <input className={inputClass + " pl-7"} style={inputStyle} type="number" placeholder="0" value={currentSaved} onChange={(e) => setCurrentSaved(e.target.value)} />
 </div>
 </div>
 <div>
 <label className={labelClass} style={{...labelStyle, ...labelMono}}>Savings Goal</label>
 <div className="relative">
 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{color: '#7A8090'}}>$</span>
 <input className={inputClass + " pl-7"} style={inputStyle} type="number" placeholder="e.g. 10000" value={savingsGoal} onChange={(e) => setSavingsGoal(e.target.value)} />
 </div>
 </div>
 <div className="grid grid-cols-3 gap-3">
 {[1000, 5000, 10000].map((g) => (
 <button
 key={g}
 onClick={() => setSavingsGoal(String(g))}
 className={`border py-3 text-[11px] font-bold uppercase tracking-[0.08em] transition-all ${
 savingsGoal === String(g)
 ? "border" /* gold via style */
 : "border-white/8 text-[#4A505E]"
 }`}
 style={labelMono}
 >
 ${g.toLocaleString()}
 </button>
 ))}
 </div>
 {savingsGoal && Number(currentSaved) < Number(savingsGoal) && (
 <div className={seCardGold + " relative overflow-hidden"} style={seCardGoldStyle}>
 <div className="absolute top-0 left-0 right-0" style={{background: "linear-gradient(90deg, #C9A84C, transparent 70%)", height: '2px'}} />
 <div className="uppercase mb-1.5" style={{fontSize: '8px', color: '#C9A84C', letterSpacing: '0.2em'}}>Still Need to Save</div>
 <div className="text-2xl font-extrabold" style={{fontFamily: "'Syne', sans-serif", letterSpacing: "-0.02em", color: '#F0EDE4'}}>
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
 {stepEyebrow("Assets")}
 {stepTitle("Do you invest?")}
 <p className="text-sm mb-8" style={{color: '#7A8090'}}>Stocks, ETFs, crypto, 401k — add them to see your full net worth picture.</p>

 {hasInvestments === null && (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <button
 onClick={() => { setHasInvestments(true); if (investments.length === 0) addInvestment(); }}
 className="border border-white/8 p-6 text-left transition-all group" style={{background: 'rgba(255,255,255,0.02)'}}
 >
 <div className="w-9 h-9 mb-3 flex items-center justify-center border text-base transition-all" style={{borderColor: 'rgba(129,140,248,0.25)', color: '#818CF8'}}>▲</div>
 <div className="font-bold mb-1 text-sm" style={{fontFamily: "'Syne', sans-serif", color: '#F0EDE4'}}>Yes, I invest</div>
 <div className="" style={{fontSize: '10px', color: '#4A505E', letterSpacing: '0.04em'}}>Add my portfolio · track gains</div>
 </button>
 <button
 onClick={() => { setHasInvestments(false); finish(); }}
 className="border border-white/8 p-6 text-left transition-all group" style={{background: 'rgba(255,255,255,0.02)'}}
 >
 <div className="w-9 h-9 mb-3 flex items-center justify-center border text-base transition-all" style={{borderColor: 'rgba(201,168,76,0.25)', color: '#C9A84C'}}>→</div>
 <div className="font-bold mb-1 text-sm" style={{fontFamily: "'Syne', sans-serif", color: '#F0EDE4'}}>Not yet — skip</div>
 <div className="" style={{fontSize: '10px', color: '#4A505E', letterSpacing: '0.04em'}}>Finish setup · open my dashboard</div>
 </button>
 </div>
 )}

 {hasInvestments === true && (
 <div>
 <div className="space-y-3 mb-4">
 {investments.map((inv, i) => (
 <div key={inv.id} className={seCard} style={seCardStyle}>
 <div className="flex items-center gap-2 mb-3">
 <div className="w-2.5 h-2.5 shrink-0" style={{ background: inv.color }} />
 <span className="uppercase" style={{fontSize: '9px', letterSpacing: '0.15em', color: '#4A505E'}}>Investment {String(i + 1).padStart(2, "0")}</span>
 <button onClick={() => removeInvestment(inv.id)} className="ml-auto transition-colors" style={{color: '#3D4250'}}>
 <Trash2 size={13} />
 </button>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className={labelClass} style={{...labelStyle, ...labelMono}}>Name / Ticker</label>
 <input className={inputClass} style={inputStyle} placeholder="e.g. S&P 500 ETF" value={inv.name} onChange={(e) => updateInvestment(inv.id, { name: e.target.value })} />
 </div>
 <div>
 <label className={labelClass} style={{...labelStyle, ...labelMono}}>Type</label>
 <select className={selectClass} style={selectStyle} value={inv.type} onChange={(e) => updateInvestment(inv.id, { type: e.target.value as Investment["type"] })}>
 {INVEST_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
 </select>
 </div>
 <div>
 <label className={labelClass} style={{...labelStyle, ...labelMono}}>Current Value</label>
 <div className="relative">
 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{color: '#7A8090'}}>$</span>
 <input className={inputClass + " pl-6"} style={inputStyle} type="number" placeholder="0" value={inv.currentValue || ""} onChange={(e) => updateInvestment(inv.id, { currentValue: Number(e.target.value) })} />
 </div>
 </div>
 <div>
 <label className={labelClass} style={{...labelStyle, ...labelMono}}>Amount Invested (cost basis)</label>
 <div className="relative">
 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{color: '#7A8090'}}>$</span>
 <input className={inputClass + " pl-6"} style={inputStyle} type="number" placeholder="0" value={inv.amountInvested || ""} onChange={(e) => updateInvestment(inv.id, { amountInvested: Number(e.target.value) })} />
 </div>
 </div>
 <div className="col-span-2">
 <label className={labelClass} style={{...labelStyle, ...labelMono}}>Monthly Contribution (optional)</label>
 <div className="relative">
 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{color: '#7A8090'}}>$</span>
 <input className={inputClass + " pl-6"} style={inputStyle} type="number" placeholder="0" value={inv.monthlyContribution || ""} onChange={(e) => updateInvestment(inv.id, { monthlyContribution: Number(e.target.value) })} />
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 <button
 onClick={addInvestment}
 className="flex items-center gap-2 uppercase font-bold border px-4 py-2.5 w-full justify-center transition-all mb-4" style={{fontSize: '10px', letterSpacing: '0.1em', color: '#818CF8', borderColor: 'rgba(129,140,248,0.2)'}}
 >
 <Plus size={13} /> Add Investment
 </button>
 {investments.length > 0 && (
 <div className={seCard + " flex justify-between items-center"} style={seCardStyle}>
 <span className="uppercase" style={{fontSize: '9px', letterSpacing: '0.15em', color: '#4A505E'}}>Total Portfolio Value</span>
 <span className="text-xl font-extrabold" style={{fontFamily: "'Syne', sans-serif", color: '#818CF8'}}>
 ${investments.reduce((s, i) => s + (i.currentValue || 0), 0).toLocaleString()}
 </span>
 </div>
 )}
 </div>
 )}
 </div>
 )}

 {/* NAVIGATION BUTTONS */}
 <div className="flex items-center justify-between mt-6 sm:mt-10 pt-4 sm:pt-6 border-t" style={{ borderColor: "rgba(201,168,76,0.12)" }}>
 <button
 onClick={back}
 className={`flex items-center gap-2 px-4 py-2.5 uppercase border border-white/8 transition-all ${step === 1 ? "invisible" : ""}`}
 style={labelMono}
 >
 <ArrowLeft size={13} /> Back
 </button>

 {step < 5 ? (
 <button
 onClick={next}
 className="flex items-center gap-2 px-7 py-2.5 uppercase font-bold transition-all hover:opacity-90 hover:-translate-y-px active:translate-y-0" style={{fontSize: '10px', letterSpacing: '0.1em', color: '#06080E', ...labelMono, background: "#C9A84C"}}
 >
 Continue <ArrowRight size={13} />
 </button>
 ) : hasInvestments === true ? (
 <button
 onClick={finish}
 className="flex items-center gap-2 px-7 py-2.5 uppercase font-bold transition-all hover:opacity-90 hover:-translate-y-px active:translate-y-0" style={{fontSize: '10px', letterSpacing: '0.1em', color: '#06080E', ...labelMono, background: "#C9A84C"}}
 >
 Build My Dashboard <ArrowRight size={13} />
 </button>
 ) : null}
 </div>

 </div>
 </div>

 {/* BOTTOM FOOTER BAR */}
 <footer className="border-t py-4 mt-8" style={{ borderColor: "rgba(201,168,76,0.12)" }}>
 <div className="max-w-2xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-3">
 <div className="flex items-center gap-2">
 <img src="/evergreen-icon.png" alt="Evergreen Icon" style={{width:"20px",height:"20px",objectFit:"contain"}}/>
 <span className="font-semibold" style={{fontFamily: "'Syne', sans-serif", fontSize: '10px', color: '#4A505E'}}>Personal Economy</span>
 </div>
 <PoweredByBadge />
 <p className="" style={{fontSize: '9px', color: '#2E3340', letterSpacing: '0.05em'}}>All data is stored locally on your device.</p>
 </div>
 </footer>
 </div>
 );
}
