// Personal Economy Pro — Main Dashboard
// Tabs: Overview | Debt Tracker | Budget | Savings & Investments | Game Plan
// Design: SE HQ Sovereign Terminal | Syne + Space Mono + Inter
// Accent: Gold #C9A84C (primary) · Rose #E05252 (debt) · Teal #2DD4BF (savings) · Indigo #818CF8 (invest)

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
import { StrategyInfoModal } from "@/components/StrategyInfoModal";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";


// ── Bloomberg Ticker Tape component ─────────────────────────────────────────
function DashboardTicker({ items }: { items: { sym: string; val: string; note: string; up: boolean }[] }) {
  const doubled = [...items, ...items];
  return (
    <div className="pe-ticker">
      <div className="pe-ticker-track">
        {doubled.map((item, i) => (
          <span key={i} className="pe-ticker-item">
            <span className="pe-ticker-sym">{item.sym}</span>
            <span style={{color: '#F0EDE4', fontWeight: 600}}>{item.val}</span>
            <span className={item.up ? "pe-ticker-up" : "pe-ticker-dn"}>{item.note}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── SE HQ palette constants ───────────────────────────────────────────────────
const GOLD = "#C9A84C";
const GOLD_LIGHT = "#E8C97A";
const ROSE = "#E05252";
const TEAL = "#2DD4BF";
const INDIGO = "#818CF8";
const AMBER = "#F59E0B";
const BG = "#06080E";
const BG_CARD = "#0B0E16";

const mono = { fontFamily: "'Space Mono', monospace" } as React.CSSProperties;
const syne = { fontFamily: "'Syne', sans-serif" } as React.CSSProperties;

// ── Shared styles — sharp edges, gold-tinted borders ──────────────────────────
const card = "border border-white/6 p-5"; const cardStyle: React.CSSProperties = {background: "rgba(255,255,255,0.02)"};
const cardDark = "border border-white/8 p-5"; const cardDarkStyle: React.CSSProperties = {background: "#0B0E16"};
const inputClass = "w-full bg-white/4 border border-white/8 px-3 py-2 text-sm focus:outline-none transition-all";
const inputStyle: React.CSSProperties = {color: "#F0EDE4"};
const labelClass = "block uppercase mb-1.5 font-bold";
const labelStyle: React.CSSProperties = {fontSize: "8px", letterSpacing: "0.18em", color: "#4A505E"};
const monoLabel = "uppercase";
const monoLabelStyle: React.CSSProperties = {fontSize: "9px", letterSpacing: "0.15em"};

// Gold flat button (replaces emerald gradients)
const btnGold = "px-4 py-2 uppercase font-bold transition-all hover:opacity-90";
const btnGoldStyle: React.CSSProperties = {fontSize: "10px", letterSpacing: "0.1em", color: "#06080E"};
const btnGhost = "px-4 py-2 uppercase border border-white/8 transition-all";
const btnGhostStyle: React.CSSProperties = {fontSize: "10px", letterSpacing: "0.1em", color: "#7A8090"};

// Modal shell — shared across all modals
const modalShell: React.CSSProperties = {
 width: "100%",
 maxWidth: "440px",
 background: BG_CARD,
 border: "1px solid rgba(201,168,76,0.20)",
 boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
 position: "relative",
 overflow: "hidden",
};
const modalTopBar = (color: string): React.CSSProperties => ({
 position: "absolute", top: 0, left: 0, right: 0, height: "2px",
 background: `linear-gradient(90deg, ${color}, transparent 70%)`,
});

// ── Live Clock Hook (unchanged logic) ──────────────────────────────────────────
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

// ── Animated Number (unchanged logic) ──────────────────────────────────────────
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

// ── Modal header component (shared visual language) ───────────────────────────
function ModalHeader({ title, sub, onClose }: { title: string; sub?: string; onClose: () => void }) {
 return (
 <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/6">
 <div>
 <h3 className="text-sm font-extrabold" style={{color: '#F0EDE4'}}>{title}</h3>
 {sub && <p className="uppercase mt-0.5" style={{fontSize: '8px', letterSpacing: '0.12em', color: '#4A505E'}}>{sub}</p>}
 </div>
 <button onClick={onClose} className="w-7 h-7 flex items-center justify-center border border-white/8 hover:border-white/15 transition-all" style={{color: '#7A8090'}}>
 <X size={14} />
 </button>
 </div>
 );
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
 const [dueDay, setDueDay] = useState(String(debt.dueDay || ""));
 const save = () => {
 onSave({ name, balance: Number(balance), apr: Number(apr), minimumPayment: Number(minPay), paid: Number(paid), dueDay: dueDay ? Number(dueDay) : undefined });
 onClose();
 toast.success("Debt updated");
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}>
 <div style={modalShell}>
 <div style={modalTopBar(debt.color)} />
 <ModalHeader title="Edit Debt" sub="Update balance · payments · APR" onClose={onClose} />
 <div className="px-5 py-4 space-y-4">
 <div><label className={labelClass} style={{...labelStyle, ...mono}}>Debt Name</label><input className={inputClass} style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} /></div>
 <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
 <div><label className={labelClass} style={{...labelStyle, ...mono}}>Current Balance</label>
 <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{color: '#7A8090'}}>{currency}</span>
 <input className={inputClass + " pl-6"} style={inputStyle} type="number" value={balance} onChange={(e) => setBalance(e.target.value)} /></div></div>
 <div><label className={labelClass} style={{...labelStyle, ...mono}}>APR %</label>
 <div className="relative"><input className={inputClass + " pr-6"} style={inputStyle} type="number" value={apr} onChange={(e) => setApr(e.target.value)} />
 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{color: '#7A8090'}}>%</span></div></div>
 <div><label className={labelClass} style={{...labelStyle, ...mono}}>Min. Payment</label>
 <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{color: '#7A8090'}}>{currency}</span>
 <input className={inputClass + " pl-6"} style={inputStyle} type="number" value={minPay} onChange={(e) => setMinPay(e.target.value)} /></div></div>
 <div><label className={labelClass} style={{...labelStyle, ...mono}}>Total Paid So Far</label>
 <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{color: '#7A8090'}}>{currency}</span>
 <input className={inputClass + " pl-6"} style={inputStyle} type="number" value={paid} onChange={(e) => setPaid(e.target.value)} /></div></div>
 <div><label className={labelClass} style={{...labelStyle, ...mono}}>Payment Due Day</label>
 <input className={inputClass} style={inputStyle} type="number" min="1" max="31" placeholder="e.g. 15" title="Day of month this payment is due" value={dueDay} onChange={(e) => setDueDay(e.target.value)} /></div>
 </div>
 {Number(balance) > 0 && Number(apr) > 0 && (
 <div className="border p-3 flex items-center justify-between" style={{borderColor: 'rgba(224,82,82,0.15)', background: 'rgba(224,82,82,0.05)'}}>
 <span className="uppercase" style={{fontSize: '9px', letterSpacing: '0.08em', color: '#7A8090'}}>Monthly interest</span>
 <strong className="" style={{fontSize: '11px', color: '#E05252'}}>{currency}{((Number(balance) * Number(apr) / 100) / 12).toFixed(2)}/mo</strong>
 </div>
 )}
 </div>
 <div className="flex gap-3 px-5 pb-5 pt-3 border-t border-white/6">
 <button onClick={onClose} className={"flex-1 py-2.5 " + btnGhost} style={{...btnGhostStyle, ...mono}}>Cancel</button>
 <button onClick={save} className={"flex-1 py-2.5 " + btnGold} style={{ ...mono, background: GOLD }}>Save Changes</button>
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
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}>
 <div style={modalShell}>
 <div style={modalTopBar(INDIGO)} />
 <ModalHeader title="Edit Investment" sub="Update value · basis · contribution" onClose={onClose} />
 <div className="px-5 py-4 space-y-4">
 <div><label className={labelClass} style={{...labelStyle, ...mono}}>Name / Ticker</label><input className={inputClass} style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} /></div>
 <div className="grid grid-cols-2 gap-3">
 <div><label className={labelClass} style={{...labelStyle, ...mono}}>Current Value</label>
 <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{color: '#7A8090'}}>{currency}</span>
 <input className={inputClass + " pl-6"} style={inputStyle} type="number" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} /></div></div>
 <div><label className={labelClass} style={{...labelStyle, ...mono}}>Cost Basis (invested)</label>
 <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{color: '#7A8090'}}>{currency}</span>
 <input className={inputClass + " pl-6"} style={inputStyle} type="number" value={amountInvested} onChange={(e) => setAmountInvested(e.target.value)} /></div></div>
 <div className="col-span-2"><label className={labelClass} style={{...labelStyle, ...mono}}>Monthly Contribution</label>
 <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{color: '#7A8090'}}>{currency}</span>
 <input className={inputClass + " pl-6"} style={inputStyle} type="number" value={monthlyContrib} onChange={(e) => setMonthlyContrib(e.target.value)} /></div></div>
 </div>
 {Number(amountInvested) > 0 && (
 <div className="p-3 flex items-center justify-between border" style={{background: gain >= 0 ? 'rgba(45,212,191,0.05)' : 'rgba(224,82,82,0.05)', borderColor: gain >= 0 ? 'rgba(45,212,191,0.15)' : 'rgba(224,82,82,0.15)'}}>
 <span className="uppercase" style={{fontSize: '9px', letterSpacing: '0.08em', color: '#7A8090'}}>Unrealized {gain >= 0 ? "gain" : "loss"}</span>
 <strong className="" style={{...mono, color: gain >= 0 ? TEAL : ROSE, fontSize: '11px'}}>{currency}{Math.abs(gain).toFixed(2)} ({gainPct.toFixed(1)}%)</strong>
 </div>
 )}
 </div>
 <div className="flex gap-3 px-5 pb-5 pt-3 border-t border-white/6">
 <button onClick={onClose} className={"flex-1 py-2.5 " + btnGhost} style={{...btnGhostStyle, ...mono}}>Cancel</button>
 <button onClick={save} className={"flex-1 py-2.5 " + btnGold} style={{ ...mono, background: INDIGO }}>Save Changes</button>
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
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}>
 <div style={modalShell}>
 <div style={modalTopBar(ROSE)} />
 <ModalHeader title="Add New Debt" sub="Track it to attack it" onClose={onClose} />
 <div className="px-5 py-4 space-y-4">
 <div><label className={labelClass} style={{...labelStyle, ...mono}}>Debt Name</label><input className={inputClass} style={inputStyle} placeholder="e.g. Chase Credit Card" value={name} onChange={(e) => setName(e.target.value)} /></div>
 <div className="grid grid-cols-2 gap-3">
 <div><label className={labelClass} style={{...labelStyle, ...mono}}>Current Balance</label>
 <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{color: '#7A8090'}}>{currency}</span>
 <input className={inputClass + " pl-6"} style={inputStyle} type="number" placeholder="0" value={balance} onChange={(e) => setBalance(e.target.value)} /></div></div>
 <div><label className={labelClass} style={{...labelStyle, ...mono}}>APR %</label>
 <div className="relative"><input className={inputClass + " pr-6"} style={inputStyle} type="number" placeholder="0" value={apr} onChange={(e) => setApr(e.target.value)} />
 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{color: '#7A8090'}}>%</span></div></div>
 <div className="col-span-2"><label className={labelClass} style={{...labelStyle, ...mono}}>Minimum Monthly Payment</label>
 <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{color: '#7A8090'}}>{currency}</span>
 <input className={inputClass + " pl-6"} style={inputStyle} type="number" placeholder="0" value={minPay} onChange={(e) => setMinPay(e.target.value)} /></div></div>
 </div>
 {Number(balance) > 0 && Number(apr) > 0 && (
 <div className="border p-3 flex items-center justify-between" style={{borderColor: 'rgba(224,82,82,0.15)', background: 'rgba(224,82,82,0.05)'}}>
 <span className="uppercase" style={{fontSize: '9px', letterSpacing: '0.08em', color: '#7A8090'}}>Monthly interest</span>
 <strong className="" style={{fontSize: '11px', color: '#E05252'}}>{currency}{((Number(balance) * Number(apr) / 100) / 12).toFixed(2)}/mo</strong>
 </div>
 )}
 </div>
 <div className="flex gap-3 px-5 pb-5 pt-3 border-t border-white/6">
 <button onClick={onClose} className={"flex-1 py-2.5 " + btnGhost} style={{...btnGhostStyle, ...mono}}>Cancel</button>
 <button onClick={save} className={"flex-1 py-2.5 " + btnGold} style={{ ...mono, background: GOLD }}>Add Debt</button>
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
 const [dueDay, setDueDay] = useState("");
 const save = () => {
 if (!label.trim()) { toast.error("Enter an expense name"); return; }
 if (!amount || Number(amount) <= 0) { toast.error("Enter a valid amount"); return; }
 const expense: Expense = {
 id: generateExpenseId(),
 label: label.trim(),
 amount: Number(amount),
 category,
 isEssential,
 dueDay: dueDay ? Number(dueDay) : undefined,
 };
 onSave(expense);
 onClose();
 toast.success(`${label} added to your budget`);
 };

 const selectClass = "w-full border border-white/8 px-3 py-2 text-sm focus:outline-none transition-all";
 const selectStyle: React.CSSProperties = {background: "#0B0E16", color: "#F0EDE4"};

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}>
 <div style={modalShell}>
 <div style={modalTopBar(AMBER)} />
 <ModalHeader title="Add New Expense" sub="Every dollar accounted for" onClose={onClose} />
 <div className="px-5 py-4 space-y-4">
 <div><label className={labelClass} style={{...labelStyle, ...mono}}>Expense Name</label><input className={inputClass} style={inputStyle} placeholder="e.g. Netflix, Gym, Rent" value={label} onChange={(e) => setLabel(e.target.value)} /></div>
 <div className="grid grid-cols-2 gap-3">
 <div><label className={labelClass} style={{...labelStyle, ...mono}}>Monthly Amount</label>
 <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{color: '#7A8090'}}>{currency}</span>
 <input className={inputClass + " pl-6"} style={inputStyle} type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} /></div></div>
 <div><label className={labelClass} style={{...labelStyle, ...mono}}>Category</label>
 <select className={selectClass} value={category} onChange={(e) => setCategory(e.target.value as Expense["category"])}>
 {EXPENSE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
 </select></div>
 </div>
 <div className="flex items-center gap-3 border border-white/6 p-3" style={{background: 'rgba(255,255,255,0.02)'}}>
 <button
 type="button"
 onClick={() => setIsEssential((v) => !v)}
 className={`w-10 h-6 transition-all flex items-center`} style={{background: isEssential ? '#C9A84C' : 'rgba(255,255,255,0.1)'}}
 >
 <span className={`w-4 h-4 transition-all mx-1 ${isEssential ? "translate-x-4" : "translate-x-0"}`} style={{background:'#06080E'}} />
 </button>
 <div>
 <div className="text-xs font-bold" style={{color: '#F0EDE4'}}>{isEssential ? "Essential (fixed)" : "Non-essential (cuttable)"}</div>
 <div className="uppercase" style={{fontSize: '8px', letterSpacing: '0.1em', color: '#4A505E'}}>{isEssential ? "Rent · utilities · insurance" : "Subscriptions · dining · entertainment"}</div>
 </div>
 </div>
 <div>
 <label className={labelClass} style={{...labelStyle, ...mono}}>Bill Due Day <span style={{color:'#4A505E'}}>(optional)</span></label>
 <input className={inputClass} style={inputStyle} type="number" min="1" max="31" placeholder="e.g. 15" title="Day of month this bill is due (1-31)" value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
 </div>
 </div>
 <div className="flex gap-3 px-5 pb-5 pt-3 border-t border-white/6">
 <button onClick={onClose} className={"flex-1 py-2.5 " + btnGhost} style={{...btnGhostStyle, ...mono}}>Cancel</button>
 <button onClick={save} className={"flex-1 py-2.5 " + btnGold} style={{ ...mono, background: AMBER }}>Add Expense</button>
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
 const [dueDay, setDueDay] = useState(String(expense.dueDay || ""));
 const save = () => {
 if (!label.trim()) { toast.error("Enter an expense name"); return; }
 if (!amount || Number(amount) <= 0) { toast.error("Enter a valid amount"); return; }
 onSave(expense.id, { label: label.trim(), amount: Number(amount), category, isEssential, dueDay: dueDay ? Number(dueDay) : undefined });
 onClose();
 toast.success(`${label} updated`);
 };

 const selectClass = "w-full border border-white/8 px-3 py-2 text-sm focus:outline-none transition-all";
 const selectStyle: React.CSSProperties = {background: "#0B0E16", color: "#F0EDE4"};

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}>
 <div style={modalShell}>
 <div style={modalTopBar(AMBER)} />
 <ModalHeader title="Edit Expense" sub="Adjust the line item" onClose={onClose} />
 <div className="px-5 py-4 space-y-4">
 <div><label className={labelClass} style={{...labelStyle, ...mono}}>Expense Name</label><input className={inputClass} style={inputStyle} value={label} onChange={(e) => setLabel(e.target.value)} /></div>
 <div className="grid grid-cols-2 gap-3">
 <div><label className={labelClass} style={{...labelStyle, ...mono}}>Monthly Amount</label>
 <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{color: '#7A8090'}}>{currency}</span>
 <input className={inputClass + " pl-6"} style={inputStyle} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div></div>
 <div><label className={labelClass} style={{...labelStyle, ...mono}}>Category</label>
 <select className={selectClass} value={category} onChange={(e) => setCategory(e.target.value as Expense["category"])}>
 {EXPENSE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
 </select></div>
 </div>
 <div className="flex items-center gap-3 border border-white/6 p-3" style={{background: 'rgba(255,255,255,0.02)'}}>
 <button
 type="button"
 onClick={() => setIsEssential((v) => !v)}
 className={`w-10 h-6 transition-all flex items-center`} style={{background: isEssential ? '#C9A84C' : 'rgba(255,255,255,0.1)'}}
 >
 <span className={`w-4 h-4 transition-all mx-1 ${isEssential ? "translate-x-4" : "translate-x-0"}`} style={{background:'#06080E'}} />
 </button>
 <div>
 <div className="text-xs font-bold" style={{color: '#F0EDE4'}}>{isEssential ? "Essential (fixed)" : "Non-essential (cuttable)"}</div>
 <div className="uppercase" style={{fontSize: '8px', letterSpacing: '0.1em', color: '#4A505E'}}>{isEssential ? "Rent · utilities · insurance" : "Subscriptions · dining · entertainment"}</div>
 </div>
 </div>
 <div>
 <label className={labelClass} style={{...labelStyle, ...mono}}>Bill Due Day <span style={{color:'#4A505E'}}>(optional)</span></label>
 <input className={inputClass} style={inputStyle} type="number" min="1" max="31" placeholder="e.g. 15" title="Day of month this bill is due (1-31)" value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
 </div>
 </div>
 <div className="flex gap-3 px-5 pb-5 pt-3 border-t border-white/6">
 <button onClick={onClose} className={"flex-1 py-2.5 " + btnGhost} style={{...btnGhostStyle, ...mono}}>Cancel</button>
 <button onClick={save} className={"flex-1 py-2.5 " + btnGold} style={{ ...mono, background: AMBER }}>Save Changes</button>
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
 const [showStrategyInfo, setShowStrategyInfo] = useState(false);
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
 const debtFreeDate = currentSim.months > 0 ? getDebtFreeDate(currentSim.months) : null;
 const emergencyFundMonths = totalMonthlyIncome > 0 ? (state.totalSaved / totalMonthlyIncome).toFixed(1) : "0.0";
 const tickerItems = [
   { sym: "NET WORTH", val: `${currency}${Math.abs(Math.round(netWorth)).toLocaleString()}`, note: netWorth >= 0 ? "\u25b2 POSITIVE" : "\u25bc NEGATIVE", up: netWorth >= 0 },
   { sym: "DEBT REMAINING", val: `${currency}${Math.round(totalDebt).toLocaleString()}`, note: totalDebt > 0 ? `\u25bc ${state.strategy.toUpperCase()}` : "\u25b2 DEBT FREE", up: totalDebt === 0 },
   { sym: "SAVINGS STACK", val: `${currency}${Math.round(state.totalSaved).toLocaleString()}`, note: state.profile.savingsGoal ? `${Math.round((state.totalSaved / state.profile.savingsGoal) * 100)}% OF GOAL` : "\u25b2 BUILDING", up: true },
   { sym: "PORTFOLIO", val: `${currency}${Math.round(totalInvestmentValue).toLocaleString()}`, note: totalInvestmentGain >= 0 ? `\u25b2 +${currency}${Math.abs(Math.round(totalInvestmentGain)).toLocaleString()}` : `\u25bc -${currency}${Math.abs(Math.round(totalInvestmentGain)).toLocaleString()}`, up: totalInvestmentGain >= 0 },
   { sym: "MONTHLY INCOME", val: `${currency}${Math.round(totalMonthlyIncome).toLocaleString()}`, note: state.profile.payFrequency?.toUpperCase() ?? "MONTHLY", up: true },
   { sym: "DEBT FREE DATE", val: debtFreeDate ?? "TBD", note: totalDebt > 0 ? `\u25b2 ${currentSim.months} MONTHS` : "\u25b2 ACHIEVED", up: true },
   { sym: "EMERGENCY FUND", val: `${emergencyFundMonths} MO`, note: parseFloat(emergencyFundMonths) >= 3 ? "\u25b2 SOLID" : "\u25b2 BUILDING", up: true },
   { sym: "MONTHLY INTEREST", val: `${currency}${Math.round(totalMonthlyInterest).toLocaleString()}`, note: totalMonthlyInterest > 0 ? "COST TO WAIT" : "DEBT FREE", up: false },
 ];
 return (
 <div
 className="min-h-screen" style={{color: '#F0EDE4', background: BG,
 fontFamily: "'Inter', sans-serif",
 backgroundImage:
 "linear-gradient(rgba(201,168,76,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.02) 1px, transparent 1px)",
 backgroundSize: "40px 40px",
 backgroundAttachment: "fixed",}}
 >

 {/* BLOOMBERG TICKER TAPE */}
 <DashboardTicker items={tickerItems} />
 {/* HEADER */}
 <header className="border-b sticky top-0 z-40" style={{ borderColor: "rgba(201,168,76,0.15)", background: "rgba(6,8,14,0.95)", backdropFilter: "blur(12px)" }}>
 <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between">
 <div className="flex items-center gap-2.5">
 <img src="/evergreen-icon.png" alt="Evergreen Icon" style={{width:"32px",height:"32px",objectFit:"contain"}}/>
 <span className="text-sm font-bold hidden xs:inline sm:inline uppercase" style={{...syne, letterSpacing: "0.08em"}}>Personal Economy</span>
 {state.isDemo && <span className="uppercase border px-2 py-0.5" style={{fontSize: '8px', letterSpacing: '0.15em', background: 'rgba(129,140,248,0.1)', color: '#818CF8', borderColor: 'rgba(129,140,248,0.2)'}}>DEMO PREVIEW</span>}
 </div>
 {/* Terminal-style clock readout */}
 <div className="hidden md:flex items-center gap-4" style={{fontSize: '10px', color: '#4A505E'}}>
 <span>{clock.now.toLocaleTimeString()}</span>
 <span style={{color: 'rgba(201,168,76,0.3)'}}>|</span>
 {clock.isToday ? (
 <span className="font-bold animate-pulse" style={{color: '#C9A84C'}}>▲ PAYDAY TODAY</span>
 ) : (
 <span>NEXT PAY: <span className="" style={{color: '#F0EDE4'}}>{clock.days}D {clock.hours}H {clock.mins}M</span></span>
 )}
 </div>
 <div className="flex items-center gap-2">
 {isSyncing && (
 <span className="uppercase hidden sm:inline animate-pulse" style={{fontSize: '9px', letterSpacing: '0.1em', color: '#4A505E'}}>syncing…</span>
 )}
 <button
 onClick={() => setShowReset(true)}
 className="flex items-center gap-1.5 uppercase border border-white/6 hover:border-white/15 px-2 sm:px-3 py-1.5 transition-all" style={{fontSize: '9px', letterSpacing: '0.1em', color: '#4A505E'}}
 >
 <RotateCcw size={11} /> <span className="hidden sm:inline">Reset</span>
 </button>
 <button
 onClick={() => navigate("/pro")}
 className="uppercase border border-white/6 hover:border-white/15 px-2 sm:px-3 py-1.5 transition-all" style={{fontSize: '9px', letterSpacing: '0.1em', color: '#4A505E'}}
 >
 <span className="hidden sm:inline">← Home</span><span className="sm:hidden">←</span>
 </button>
 </div>
 </div>
 </header>

 {/* DEMO CTA BANNER — only visible in demo mode */}
 {state.isDemo && (
 <div className="sticky top-14 z-20 border-b" style={{ borderColor: "rgba(201,168,76,0.25)", background: "linear-gradient(90deg, rgba(201,168,76,0.10) 0%, rgba(129,140,248,0.06) 100%)", backdropFilter: "blur(8px)" }}>
 <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 flex-wrap">
 <div className="flex items-center gap-2 min-w-0">
 <span className="text-sm shrink-0" style={{color: '#C9A84C'}}>◉</span>
 <p className="text-xs sm:text-sm truncate" style={{color: '#7A8090'}}>
 <span className="font-semibold" style={{color: '#F0EDE4'}}>You're previewing a demo.</span>
 <span className="hidden sm:inline" style={{color: '#4A505E'}}> This is Jordan Rivers's sample plan — not your real data.</span>
 </p>
 </div>
 <button
 onClick={() => { resetAll(); navigate("/pro/onboarding"); }}
 className="shrink-0 flex items-center gap-1.5 uppercase font-bold px-3 sm:px-4 py-1.5 sm:py-2 transition-all hover:opacity-90" style={{fontSize: '10px', letterSpacing: '0.1em', ...mono, background: GOLD, color: BG}}
 >
 <span>Start Your Own Plan</span>
 <span>→</span>
 </button>
 </div>
 </div>
 )}

 {/* HERO STRIP */}
 <div className="border-b border-white/5 py-5" style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.04), rgba(129,140,248,0.02))" }}>
 <div className="max-w-7xl mx-auto px-3 sm:px-6">
 <div className="flex items-center justify-between mb-4">
 <div>
 <h1 className="text-xl sm:text-2xl font-extrabold" style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "-0.01em" }}>{state.profile.name}'s <em className="" style={{fontStyle: "italic", color: '#C9A84C'}}>Economy</em></h1>
 <p className="uppercase mt-1" style={{fontSize: '9px', letterSpacing: '0.15em', color: '#4A505E'}}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
 </div>
 <div className="text-right">
 <div className="uppercase mb-0.5" style={{fontSize: '8px', letterSpacing: '0.2em', color: '#4A505E'}}>Net Worth</div>
 <div className={`text-xl sm:text-2xl font-extrabold`} style={{ ...syne, color: netWorth >= 0 ? GOLD : ROSE, letterSpacing: "-0.02em" }}>
 <AnimNum value={netWorth} prefix={currency} />
 </div>
 </div>
 </div>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-white/6">
 {[
 { label: "Monthly Income", value: totalMonthlyIncome, color: GOLD, icon: <DollarSign size={13} /> },
 { label: "Total Debt", value: totalDebt, color: ROSE, icon: <AlertTriangle size={13} /> },
 { label: "Savings Stack", value: state.totalSaved, color: TEAL, icon: <Target size={13} /> },
 { label: "Portfolio Value", value: totalInvestmentValue, color: INDIGO, icon: <TrendingUp size={13} /> },
 ].map((s, i) => (
 <div key={s.label} className={`px-3 sm:px-4 py-2.5 sm:py-3 ${i < 3 ? "border-r border-white/6" : ""} ${i < 2 ? "border-b md:border-b-0 border-white/6" : ""}`}>
 <div className="flex items-center gap-1.5 uppercase mb-1.5" style={{fontSize: '8px', letterSpacing: '0.15em', color: '#4A505E'}}>{s.icon}{s.label}</div>
 <div className="text-lg sm:text-xl font-extrabold" style={{ ...syne, color: s.color, letterSpacing: "-0.02em" }}>
 <AnimNum value={s.value} prefix={currency} />
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* TABS */}
 <div className="border-b sticky top-14 z-30" style={{ borderColor: "rgba(201,168,76,0.12)", background: "rgba(6,8,14,0.95)", backdropFilter: "blur(12px)" }}>
 <div className="max-w-7xl mx-auto px-3 sm:px-6">
 <div className="flex overflow-x-auto scrollbar-hide">
 {TABS.map((t) => (
 <button
 key={t.id}
 onClick={() => setActiveTab(t.id as typeof activeTab)}
 className={`flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-3 sm:py-3.5 text-[10px] uppercase tracking-[0.1em] font-bold whitespace-nowrap border-b-2 transition-all min-w-[44px] sm:min-w-0 ${
 activeTab === t.id
 ? "border-transparent" /* active: style prop */
 : "border-transparent"
 }`}
 style={mono}
 >
 <span className="flex-shrink-0">{t.icon}</span>
 <span className="hidden sm:inline">{t.label}</span>
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* CONTENT */}
 <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 animate-fade-slide" key={activeTab}>

 {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
 {activeTab === "overview" && (
 <div className="space-y-6">
 {/* Cash flow alert */}
 {monthlyLeftover > 0 ? (
 <div className="border p-3 sm:p-4 flex items-start gap-2 sm:gap-3 relative overflow-hidden" style={{borderColor: 'rgba(201,168,76,0.2)', background: 'rgba(201,168,76,0.04)'}}>
 <div className="absolute top-0 left-0 right-0" style={{background: `linear-gradient(90deg, ${GOLD}, transparent 70%)`, height: '2px'}} />
 <CheckCircle2 size={18} className="mt-0.5 shrink-0" style={{color: '#C9A84C'}} />
 <div>
 <div className="text-sm font-semibold" style={{color: '#F0EDE4'}}>You have <span className="" style={{color: '#C9A84C'}}>{currency}{Math.round(monthlyLeftover).toLocaleString()}/mo</span> left after expenses.</div>
 <div className="mt-1" style={{fontSize: '10px', letterSpacing: '0.04em', color: '#7A8090'}}>SPLIT → {currency}{Math.round(savingsBudget).toLocaleString()} SAVINGS · {currency}{Math.round(debtBudget).toLocaleString()} DEBT · {currency}{Math.round(monthlyLeftover * 0.2).toLocaleString()} BUFFER</div>
 </div>
 </div>
 ) : (
 <div className="border p-3 sm:p-4 flex items-start gap-2 sm:gap-3 relative overflow-hidden" style={{borderColor: 'rgba(224,82,82,0.2)', background: 'rgba(224,82,82,0.04)'}}>
 <div className="absolute top-0 left-0 right-0" style={{background: `linear-gradient(90deg, ${ROSE}, transparent 70%)`, height: '2px'}} />
 <AlertTriangle size={18} className="mt-0.5 shrink-0" style={{color: '#E05252'}} />
 <div>
 <div className="text-sm font-semibold" style={{color: '#F0EDE4'}}>Expenses exceed income by <span className="" style={{color: '#E05252'}}>{currency}{Math.abs(Math.round(monthlyLeftover)).toLocaleString()}/mo</span></div>
 <div className="text-xs mt-0.5" style={{color: '#7A8090'}}>Review your Budget tab to find cuts. Every dollar freed up goes directly to your plan.</div>
 </div>
 </div>
 )}

 <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
 {/* Cash Flow Breakdown */}
 <div className={card} style={cardStyle}>
 <h3 className={"font-bold mb-4"} style={{...monoLabelStyle, ...mono}}>Cash Flow Breakdown</h3>
 <div className="space-y-3">
 {[
 { label: "Monthly Income", value: totalMonthlyIncome, color: GOLD, pct: 100 },
 { label: "Fixed Expenses", value: totalExpenses, color: AMBER, pct: Math.min(100, (totalExpenses / totalMonthlyIncome) * 100) },
 { label: "Interest Bleed", value: totalMonthlyInterest, color: ROSE, pct: Math.min(100, (totalMonthlyInterest / totalMonthlyIncome) * 100) },
 { label: "Available", value: Math.max(0, monthlyLeftover), color: INDIGO, pct: Math.max(0, Math.min(100, (monthlyLeftover / totalMonthlyIncome) * 100)) },
 ].map((row) => (
 <div key={row.label}>
 <div className="flex justify-between mb-1.5" style={{fontSize: '10px'}}>
 <span className="uppercase" style={{letterSpacing: '0.1em', color: '#4A505E'}}>{row.label}</span>
 <span style={{ ...mono, color: row.color }} className="font-bold">{currency}{Math.round(row.value).toLocaleString()}</span>
 </div>
 <div className="bg-white/5 overflow-hidden" style={{height: '3px'}}>
 <div className="h-full transition-all duration-700" style={{ width: `${row.pct}%`, background: row.color }} />
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Strategy Comparison */}
 {state.debts.length > 0 && (
 <div className={card} style={cardStyle}>
 <h3 className={"font-bold mb-4"} style={{...monoLabelStyle, ...mono}}>Payoff Strategy Comparison</h3>
 <div className="grid grid-cols-2 gap-3">
 {[
 { key: "snowball", label: "SNOWBALL ❄", data: snowball, color: INDIGO, desc: "Smallest balance first" },
 { key: "avalanche", label: "AVALANCHE ▲", data: avalanche, color: GOLD, desc: "Highest APR first" },
 ].map((s) => (
 <div
 key={s.key}
 className={`border p-3 cursor-pointer transition-all ${state.strategy === s.key ? "" : "border-white/6 opacity-60 hover:opacity-80"}`}
 style={{ borderColor: state.strategy === s.key ? s.color + "60" : undefined, background: state.strategy === s.key ? s.color + "0C" : "rgba(255,255,255,0.02)" }}
 onClick={() => setStrategy(s.key as "snowball" | "avalanche")}
 >
 <div className="font-bold mb-2" style={{...mono, color: s.color, fontSize: '10px', letterSpacing: '0.1em'}}>{s.label}</div>
 <div className="mb-2" style={{fontSize: '9px', color: '#4A505E'}}>{s.desc}</div>
 <div className="text-lg font-extrabold" style={{color: '#F0EDE4'}}>{s.data.months}mo</div>
 <div className="uppercase" style={{fontSize: '9px', letterSpacing: '0.08em', color: '#4A505E'}}>to debt-free</div>
 <div className="mt-1" style={{fontSize: '9px', color: '#4A505E'}}>{currency}{Math.round(s.data.totalInterest).toLocaleString()} total interest</div>
 {state.strategy === s.key && <div className="font-bold mt-2" style={{...mono, color: s.color, fontSize: '9px', letterSpacing: '0.1em'}}>✓ ACTIVE</div>}
 </div>
 ))}
 </div>
 {avalanche.totalInterest < snowball.totalInterest && (
 <div className="mt-3 border p-2.5" style={{fontSize: '10px', letterSpacing: '0.03em', color: '#C9A84C', background: 'rgba(201,168,76,0.05)', borderColor: 'rgba(201,168,76,0.15)'}}>
 ▲ AVALANCHE SAVES YOU <strong>{currency}{Math.round(snowball.totalInterest - avalanche.totalInterest).toLocaleString()}</strong> AND {snowball.months - avalanche.months} MONTHS VS SNOWBALL
 </div>
 )}
 </div>
 )}
 </div>

 {/* Income Management */}
 <div className={card} style={cardStyle}>
 <div className="flex items-center justify-between mb-4">
 <h3 className={"font-bold"} style={{...monoLabelStyle, ...mono}}>Income</h3>
 <button
 onClick={() => { setShowIncomeEditor(!showIncomeEditor); setIncomeEditVal(state.profile?.income?.toString() || ""); setIncomeFreqEdit(state.profile?.payFrequency || "biweekly"); }}
 className="uppercase flex items-center gap-1 transition-colors" style={{fontSize: '9px', letterSpacing: '0.1em', color: '#7A8090'}}
 >
 <Edit3 size={11} /> Edit
 </button>
 </div>
 {/* Primary income row */}
 <div className="flex items-center justify-between py-2.5 border-b border-white/5">
 <div>
 <div className="uppercase mb-1" style={{fontSize: '8px', letterSpacing: '0.18em', color: '#4A505E'}}>Primary Income</div>
 <div className="capitalize" style={{fontSize: '10px', color: '#7A8090'}}>{state.profile?.payFrequency} · {currency}{state.profile?.income?.toLocaleString()} per period</div>
 </div>
 <div className="text-lg font-extrabold" style={{color: '#F0EDE4'}}>
 <AnimNum value={monthlyIncome} prefix={currency} /><span className="font-normal" style={{fontSize: '10px', color: '#4A505E'}}>/mo</span>
 </div>
 </div>
 {/* Primary income editor */}
 {showIncomeEditor && (
 <div className="mt-3 p-3 border border-white/6 space-y-3" style={{background: 'rgba(255,255,255,0.02)'}}>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className={labelClass} style={{...labelStyle, ...mono}}>Amount per period</label>
 <input className={inputClass} style={inputStyle} type="number" value={incomeEditVal} onChange={(e) => setIncomeEditVal(e.target.value)} placeholder="e.g. 2500" />
 </div>
 <div>
 <label className={labelClass} style={{...labelStyle, ...mono}}>Pay frequency</label>
 <select className={inputClass} style={inputStyle} value={incomeFreqEdit} onChange={(e) => setIncomeFreqEdit(e.target.value as typeof incomeFreqEdit)}>
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
 className="w-full py-2 border uppercase font-bold transition-all" style={{background: 'rgba(201,168,76,0.1)', borderColor: 'rgba(201,168,76,0.3)', color: '#C9A84C', fontSize: '10px', letterSpacing: '0.1em'}}
 >
 Save Income
 </button>
 </div>
 )}
 {/* Additional income sources */}
 {(state.additionalIncome || []).map((src) => (
 <div key={src.id} className="flex items-center justify-between py-2.5 border-b border-white/5">
 <div>
 <div className="text-sm" style={{color: '#F0EDE4'}}>{src.label}</div>
 <div className="capitalize" style={{fontSize: '10px', color: '#4A505E'}}>{src.frequency} · {currency}{src.amount.toLocaleString()} per period</div>
 </div>
 <div className="flex items-center gap-3">
 <div className="text-sm font-semibold" style={{color: '#C9A84C'}}>
 +<AnimNum value={src.frequency === "weekly" ? src.amount * 52/12 : src.frequency === "biweekly" ? src.amount * 26/12 : src.frequency === "semimonthly" ? src.amount * 2 : src.amount} prefix={currency} /><span className="font-normal" style={{fontSize: '10px', color: '#4A505E'}}>/mo</span>
 </div>
 <button onClick={() => { removeAdditionalIncome(src.id); toast.success(`${src.label} removed`); }} className="hover:text-[#E05252] transition-colors p-1" style={{color: '#3D4250'}}>
 <X size={14} />
 </button>
 </div>
 </div>
 ))}
 {/* Total combined income — only shown when there are additional sources */}
 {(state.additionalIncome || []).length > 0 && (
 <div className="flex items-center justify-between py-2.5 border-b border-white/5">
 <div className="uppercase font-bold" style={{fontSize: '8px', letterSpacing: '0.2em', color: '#4A505E'}}>Total Combined</div>
 <div className="text-lg font-extrabold" style={{color: '#C9A84C'}}>
 <AnimNum value={totalMonthlyIncome} prefix={currency} /><span className="font-normal" style={{fontSize: '10px', color: '#4A505E'}}>/mo</span>
 </div>
 </div>
 )}
 {/* Add additional income source */}
 <div className="mt-4">
 <div className="uppercase mb-2 font-bold" style={{fontSize: '8px', letterSpacing: '0.18em', color: '#4A505E'}}>Add income source <span className="normal-case tracking-normal" style={{color: '#2E3340'}}>(side hustle, freelance, part-time)</span></div>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
 <input className={inputClass} style={inputStyle} placeholder="Label (e.g. Freelance)" value={newSourceLabel} onChange={(e) => setNewSourceLabel(e.target.value)} />
 <input className={inputClass} style={inputStyle} type="number" placeholder="Amount per period" value={newSourceAmount} onChange={(e) => setNewSourceAmount(e.target.value)} />
 <select className={inputClass} style={inputStyle} value={newSourceFreq} onChange={(e) => setNewSourceFreq(e.target.value as typeof newSourceFreq)}>
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
 className="mt-2 w-full py-2 border border-white/8 uppercase font-bold transition-all flex items-center justify-center gap-1.5" style={{background: 'rgba(255,255,255,0.03)', color: '#7A8090', fontSize: '10px', letterSpacing: '0.1em'}}
 >
 <Plus size={11} /> Add Income Source
 </button>
 </div>
 </div>

 {/* Savings projection chart */}
 <div className={card} style={cardStyle}>
 <h3 className={"font-bold mb-4"} style={{...monoLabelStyle, ...mono}}>12-Month Savings Projection</h3>
 <ResponsiveContainer width="100%" height={180}>
 <AreaChart data={savingsProjection}>
 <defs>
 <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor={TEAL} stopOpacity={0.25} />
 <stop offset="95%" stopColor={TEAL} stopOpacity={0} />
 </linearGradient>
 </defs>
 <XAxis dataKey="month" tick={{ fill: "#4A505E", fontSize: 10, fontFamily: "'Space Mono', monospace" }} axisLine={false} tickLine={false} />
 <YAxis tick={{ fill: "#4A505E", fontSize: 10, fontFamily: "'Space Mono', monospace" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${currency}${(v / 1000).toFixed(0)}k`} />
 <Tooltip formatter={(v: number) => [`${currency}${v.toLocaleString()}`, "Savings"]} contentStyle={{ background: BG_CARD, border: "1px solid rgba(201,168,76,0.2)", borderRadius: 0, fontSize: 11, fontFamily: "'Space Mono', monospace" }} />
 <Area type="monotone" dataKey="balance" stroke={TEAL} strokeWidth={2} fill="url(#sg)" />
 {state.profile?.savingsGoal && (
 <Area type="monotone" dataKey={() => state.profile!.savingsGoal} stroke={GOLD} strokeWidth={1} strokeDasharray="4 4" fill="none" name="Goal" />
 )}
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>
 )}

 {/* ── DEBT TRACKER TAB ────────────────────────────────────────────── */}
 {activeTab === "debt" && (
 <div className="space-y-6">
 {/* Tab header with Add Debt button */}
 <div className="flex items-center justify-between">
 <h2 className="text-base font-extrabold uppercase" style={{color: '#F0EDE4', letterSpacing: '0.04em'}}>Debt Tracker</h2>
 <button
 onClick={() => setShowAddDebt(true)}
 className="flex items-center gap-1.5 px-3 py-2 uppercase font-bold transition-all hover:opacity-90" style={{fontSize: '10px', letterSpacing: '0.1em', color: '#06080E', ...mono, background: GOLD}}
 >
 <Plus size={13} /> Add Debt
 </button>
 </div>
 {state.debts.length === 0 ? (
 <div className="text-center py-16 border border-white/6" style={{background: 'rgba(255,255,255,0.01)'}}>
 <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center border" style={{borderColor: 'rgba(201,168,76,0.25)', color: '#C9A84C'}}><CheckCircle2 size={24} /></div>
 <h3 className="text-xl font-extrabold mb-2" style={{fontFamily: "'Playfair Display', Georgia, serif", color: '#F0EDE4'}}>No debts tracked</h3>
 <p className="text-sm mb-6" style={{color: '#7A8090'}}>You're either debt-free or haven't added any debts yet.</p>
 <button
 onClick={() => setShowAddDebt(true)}
 className="inline-flex items-center gap-2 px-5 py-2.5 uppercase font-bold transition-all hover:opacity-90" style={{fontSize: '10px', letterSpacing: '0.1em', color: '#06080E', ...mono, background: GOLD}}
 >
 <Plus size={14} /> Add Your First Debt
 </button>
 </div> ) : (
 <>
 {/* Strategy toggle */}
 <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
 <div className="flex items-center gap-2 flex-wrap">
 <span className="uppercase" style={{fontSize: '9px', letterSpacing: '0.15em', color: '#4A505E'}}>Strategy:</span>
 <button
   onClick={() => setShowStrategyInfo(true)}
   className="flex items-center justify-center border transition-all hover:opacity-80"
   style={{width:'16px', height:'16px', borderColor:'rgba(201,168,76,0.3)', color:'#C9A84C', borderRadius:'50%'}}
   title="What do these mean?"
 >
   <Info size={9} />
 </button>
 {(["snowball", "avalanche"] as const).map((s) => (
 <button
 key={s}
 onClick={() => setStrategy(s)}
 className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-[0.1em] font-bold border transition-all ${
 state.strategy === s
 ? s === "avalanche" ? "" /* bg/border/text via style */ : "" /* bg/border/text via style */
 : "border-white/8"
 }`}
 style={mono}
 >
 {s === "avalanche" ? <Flame size={11} /> : <Snowflake size={11} />}
 {s === "avalanche" ? "Avalanche" : "Snowball"}
 </button>
 ))}
 </div>
 <span className="uppercase" style={{fontSize: '9px', letterSpacing: '0.1em', color: '#3D4250'}}>Debt-free by: <span className="" style={{color: '#F0EDE4'}}>{getDebtFreeDate(currentSim.months)}</span></span>
 </div>

 {/* Interest bleed bar */}
 {totalMonthlyInterest > 0 && (
 <div className="border p-4 relative overflow-hidden" style={{borderColor: 'rgba(224,82,82,0.15)', background: 'rgba(224,82,82,0.04)'}}>
 <div className="absolute top-0 left-0 right-0" style={{background: `linear-gradient(90deg, ${ROSE}, transparent 70%)`, height: '2px'}} />
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-2 uppercase font-bold" style={{fontSize: '11px', letterSpacing: '0.08em', color: '#E05252'}}>
 <Flame size={14} /> Bleeding {currency}{Math.round(totalMonthlyInterest).toLocaleString()}/month in interest
 </div>
 </div>
 <div className="space-y-2">
 {state.debts.filter((d) => d.apr > 0 && d.balance > 0).sort((a, b) => monthlyInterestCost(b) - monthlyInterestCost(a)).map((d) => (
 <div key={d.id} className="flex items-center gap-3">
 <div className="w-24 truncate" style={{fontSize: '9px', color: '#7A8090'}}>{d.name}</div>
 <div className="flex-1 bg-white/5 overflow-hidden" style={{height: '3px'}}>
 <div className="h-full transition-all duration-700" style={{ width: `${Math.min(100, (monthlyInterestCost(d) / totalMonthlyInterest) * 100)}%`, background: d.color }} />
 </div>
 <div className="w-20 text-right" style={{fontSize: '9px', color: '#E05252'}}>{currency}{monthlyInterestCost(d).toFixed(2)}/mo</div>
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
 className={`border p-5 transition-all relative overflow-hidden ${isTarget ? "" : "border-white/6"} ${isPaidOff ? "opacity-50" : ""}`}
 style={{ borderColor: isTarget ? debt.color + "50" : undefined, background: isTarget ? debt.color + "06" : "rgba(255,255,255,0.015)" }}
 >
 {isTarget && <div className="absolute top-0 left-0 right-0" style={{background: `linear-gradient(90deg, ${debt.color}, transparent 70%)`, height: '2px'}} />}

 <div className="flex items-start justify-between mb-3 gap-2">
 <div className="flex items-center gap-2.5">
 <div className="w-2.5 h-2.5 shrink-0" style={{ background: debt.color }} />
 <div>
 <div className="font-bold text-sm" style={{color: '#F0EDE4'}}>{debt.name}</div>
 <div className="mt-0.5" style={{fontSize: '9px', letterSpacing: '0.05em', color: '#4A505E'}}>
 {debt.apr > 0 ? `${debt.apr}% APR · ${currency}${monthlyInterestCost(debt).toFixed(2)}/MO INTEREST` : "0% APR — NO INTEREST"}
 </div>
 </div>
 </div>
 <div className="flex items-center gap-2">
 {isTarget && !isPaidOff && <span className="font-bold px-2 py-0.5" style={{...mono, background: debt.color + "20", color: debt.color, fontSize: '8px', letterSpacing: '0.15em'}}>TARGET</span>}
 {isPaidOff && <span className="font-bold px-2 py-0.5" style={{fontSize: '8px', letterSpacing: '0.15em', color: '#2DD4BF', background: 'rgba(45,212,191,0.1)'}}>PAID ✓</span>}
 {debt.dueDay && !isPaidOff && <span className="font-bold px-2 py-0.5" title={`Payment due on the ${debt.dueDay}${debt.dueDay === 1 ? 'st' : debt.dueDay === 2 ? 'nd' : debt.dueDay === 3 ? 'rd' : 'th'} of each month`} style={{fontSize: '8px', letterSpacing: '0.12em', color: '#C9A84C', background: 'rgba(201,168,76,0.08)', cursor: 'default'}}>DUE {debt.dueDay}</span>}
 <button
 onClick={() => setEditingDebt(debt)}
 className="hover:text-[#F0EDE4] p-1.5 transition-all" style={{color: '#4A505E'}}
 title="Edit debt"
 >
 <Edit3 size={13} />
 </button>
 <button
 onClick={() => { removeDebt(debt.id); toast.success(`${debt.name} removed`); }}
 className="hover:text-[#E05252] p-1.5 transition-all" style={{color: '#3D4250'}}
 title="Remove debt"
 >
 <Trash2 size={13} />
 </button>
 </div>
 </div>

 <div className="flex items-end justify-between mb-3">
 <div>
 <div className="text-xl sm:text-2xl font-extrabold" style={{ ...syne, color: isPaidOff ? TEAL : debt.color, letterSpacing: "-0.02em" }}>
 {currency}{Math.round(debt.balance).toLocaleString()}
 </div>
 <div className="" style={{fontSize: '9px', letterSpacing: '0.05em', color: '#4A505E'}}>REMAINING · MIN {currency}{debt.minimumPayment}/MO</div>
 </div>
 {debt.paid > 0 && (
 <div className="text-right">
 <div className="text-sm font-bold" style={{color: '#2DD4BF'}}>{currency}{Math.round(debt.paid).toLocaleString()} PAID</div>
 <div className="" style={{fontSize: '9px', letterSpacing: '0.05em', color: '#4A505E'}}>{progress.toFixed(0)}% CLEARED</div>
 </div>
 )}
 </div>

 <div className="bg-white/5 overflow-hidden mb-4" style={{height: '4px'}}>
 <div className="h-full transition-all duration-700" style={{ width: `${progress}%`, background: debt.color }} />
 </div>

 {!isPaidOff && (
 <div className="flex gap-2">
 <div className="relative flex-1">
 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{color: '#7A8090'}}>{currency}</span>
 <input
 className={inputClass + " pl-6 py-2"} style={inputStyle}
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
 className="px-4 py-2 uppercase font-bold transition-all hover:opacity-90" style={{fontSize: '10px', letterSpacing: '0.1em', color: '#06080E', ...mono, background: GOLD}}
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
 {/* ── BUDGET TAB ────────────────────────────────────────────────────── */}
 {activeTab === "budget" && (
 <div className="space-y-6">
 {/* Tab header with Add Expense button */}
 <div className="flex items-center justify-between">
 <h2 className="text-base font-extrabold uppercase" style={{color: '#F0EDE4', letterSpacing: '0.04em'}}>Budget</h2>
 <button
 onClick={() => setShowAddExpense(true)}
 className="flex items-center gap-1.5 px-3 py-2 uppercase font-bold transition-all hover:opacity-90" style={{fontSize: '10px', letterSpacing: '0.1em', color: '#06080E', ...mono, background: AMBER}}
 >
 <Plus size={13} /> Add Expense
 </button>
 </div>
 <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
 {/* Pie chart */}
 <div className={card} style={cardStyle}>
 <h3 className={"font-bold mb-4"} style={{...monoLabelStyle, ...mono}}>Spending Breakdown</h3>
 {state.expenses.length === 0 ? (
 <div className="flex flex-col items-center justify-center text-center" style={{height: '200px'}}>
 <p className="text-sm" style={{color: '#4A505E'}}>No expenses added yet.</p>
 <button onClick={() => setShowAddExpense(true)} className="mt-3 uppercase underline underline-offset-4 transition-colors" style={{fontSize: '10px', letterSpacing: '0.1em', color: '#C9A84C'}}>Add your first expense</button>
 </div>
 ) : (
 <ResponsiveContainer width="100%" height={200}>
 <PieChart>
 <Pie data={state.expenses} dataKey="amount" nameKey="label" cx="50%" cy="50%" outerRadius={80} innerRadius={50}>
 {state.expenses.map((e, i) => (
 <Cell key={e.id} fill={[GOLD, AMBER, INDIGO, "#EC4899", TEAL, "#F97316", "#8B5CF6", "#06B6D4"][i % 8]} />
 ))}
 </Pie>
 <Tooltip formatter={(v: number) => [`${currency}${v.toLocaleString()}`, ""]} contentStyle={{ background: BG_CARD, border: "1px solid rgba(201,168,76,0.2)", borderRadius: 0, fontSize: 11, fontFamily: "'Space Mono', monospace" }} />
 </PieChart>
 </ResponsiveContainer>
 )}
 </div>

 {/* Essential vs non-essential */}
 <div className={card} style={cardStyle}>
 <h3 className={"font-bold mb-4"} style={{...monoLabelStyle, ...mono}}>Essential vs. Cuttable</h3>
 {(() => {
 const essential = state.expenses.filter((e) => e.isEssential).reduce((s, e) => s + e.amount, 0);
 const nonEssential = state.expenses.filter((e) => !e.isEssential).reduce((s, e) => s + e.amount, 0);
 return (
 <div className="space-y-4">
 <div>
 <div className="flex justify-between mb-1.5" style={{fontSize: '10px'}}><span className="uppercase" style={{...{letterSpacing: '0.1em', color: '#4A505E'}, ...mono}}>Essential (fixed)</span><span className="text-[#F0EDE4]" style={mono}>{currency}{Math.round(essential).toLocaleString()}</span></div>
 <div className="bg-white/5 overflow-hidden"><div className="h-full transition-all duration-700" style={{width: `${Math.min(100, (essential / totalMonthlyIncome) * 100)}%`, background: AMBER, height: '4px'}} /></div>
 </div>
 <div>
 <div className="flex justify-between mb-1.5" style={{fontSize: '10px'}}><span className="uppercase" style={{...{letterSpacing: '0.1em', color: '#4A505E'}, ...mono}}>Non-essential (cuttable)</span><span className="text-[#E05252]" style={mono}>{currency}{Math.round(nonEssential).toLocaleString()}</span></div>
 <div className="bg-white/5 overflow-hidden"><div className="h-full transition-all duration-700" style={{width: `${Math.min(100, (nonEssential / totalMonthlyIncome) * 100)}%`, background: ROSE, height: '4px'}} /></div>
 </div>
 <div className="border p-3" style={{background: 'rgba(201,168,76,0.05)', borderColor: 'rgba(201,168,76,0.15)', fontSize: '10px', letterSpacing: '0.03em', color: '#C9A84C'}}>
 CUTTING NON-ESSENTIALS FREES UP <strong>{currency}{Math.round(nonEssential).toLocaleString()}/MO</strong> — THAT'S <strong>{currency}{Math.round(nonEssential * 12).toLocaleString()}/YEAR</strong> TOWARD DEBT OR SAVINGS
 </div>
 </div>
 );
 })()}
 </div>
 </div>

 {/* Expense list */}
 <div className={card} style={cardStyle}>
 <h3 className={"font-bold mb-4"} style={{...monoLabelStyle, ...mono}}>All Expenses</h3>
 <div className="space-y-2">
 {state.expenses.sort((a, b) => b.amount - a.amount).map((e, i) => (
 <div key={e.id} className="flex items-center justify-between py-2 border-b border-white/4 last:border-0">
 <div className="flex items-center gap-3">
 <div className="w-2 h-2" style={{ background: [GOLD, AMBER, INDIGO, "#EC4899", TEAL, "#F97316", "#8B5CF6", "#06B6D4"][i % 8] }} />
 <div>
 <div className="text-sm" style={{color: '#F0EDE4'}}>{e.label}</div>
 <div className="uppercase" style={{fontSize: '9px', letterSpacing: '0.1em', color: '#4A505E'}}>{e.category}</div>
 </div>
 </div>
 <div className="flex items-center gap-2">
 {!e.isEssential && <span className="uppercase px-2 py-0.5" style={{fontSize: '8px', letterSpacing: '0.1em', color: '#E05252', background: 'rgba(224,82,82,0.1)'}}>cuttable</span>}
 {e.dueDay && <span className="uppercase px-2 py-0.5" title={`Due on the ${e.dueDay}${e.dueDay === 1 ? 'st' : e.dueDay === 2 ? 'nd' : e.dueDay === 3 ? 'rd' : 'th'} of each month`} style={{fontSize: '8px', letterSpacing: '0.1em', color: '#C9A84C', background: 'rgba(201,168,76,0.08)', cursor: 'default'}}>DUE {e.dueDay}</span>}
 <span className="text-sm font-bold" style={{color: '#F0EDE4'}}>{currency}{e.amount.toLocaleString()}</span>
 <button
 onClick={() => setEditingExpense(e)}
 className="hover:text-[#F0EDE4] p-1 transition-all" style={{color: '#3D4250'}}
 title="Edit expense"
 ><Edit3 size={12} /></button>
 <button
 onClick={() => { removeExpense(e.id); toast.success(`${e.label} removed`); }}
 className="hover:text-[#E05252] p-1 transition-all" style={{color: '#3D4250'}}
 title="Remove expense"
 ><Trash2 size={12} /></button>
 </div>
 </div>
 ))}
 <div className="flex justify-between pt-3 border-t" style={{ borderColor: "rgba(201,168,76,0.15)" }}>
 <span className="uppercase font-bold self-center" style={{fontSize: '9px', letterSpacing: '0.2em', color: '#4A505E'}}>Total</span>
 <span className="text-sm font-bold" style={{color: '#F0EDE4'}}>{currency}{Math.round(totalExpenses).toLocaleString()}</span>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* ── SAVINGS & INVESTMENTS TAB ─────────────────────────────────────── */}
 {activeTab === "savings" && (
 <div className="space-y-6">
 {/* Savings section */}
 <div className={card + " relative overflow-hidden"} style={cardStyle}>
 <div className="absolute top-0 left-0 right-0" style={{background: `linear-gradient(90deg, ${TEAL}, transparent 70%)`, height: '2px'}} />
 <div className="flex items-center justify-between mb-4">
 <h3 className={"font-bold"} style={{...monoLabelStyle, ...mono}}>Savings Stack</h3>
 <div className="flex items-center gap-2">
 <div className="uppercase" style={{fontSize: '9px', letterSpacing: '0.1em', color: '#4A505E'}}>Goal: <span className="" style={{color: '#F0EDE4'}}>{currency}{(state.profile?.savingsGoal || 0).toLocaleString()}</span></div>
 <button
 onClick={() => { setGoalInput((state.profile?.savingsGoal || "").toString()); setShowGoalModal(true); }}
 className="flex items-center gap-1 uppercase border px-2 py-0.5 transition-all" style={{fontSize: '8px', letterSpacing: '0.1em', color: '#C9A84C', borderColor: 'rgba(201,168,76,0.3)'}}
 >
 <Edit3 size={9} /> Update Goal
 </button>
 </div>
 </div>
 <div className="flex items-end gap-4 mb-4">
 <div>
 <div className="text-3xl font-extrabold" style={{ ...syne, color: TEAL, letterSpacing: "-0.025em" }}>
 <AnimNum value={state.totalSaved} prefix={currency} />
 </div>
 <div className="uppercase mt-1" style={{fontSize: '9px', letterSpacing: '0.1em', color: '#4A505E'}}>
 {state.profile?.savingsGoal ? `${Math.round((state.totalSaved / state.profile.savingsGoal) * 100)}% OF GOAL` : "SAVED"}
 </div>
 </div>
 </div>
 {state.profile?.savingsGoal && (
 <div className="bg-white/5 overflow-hidden mb-4" style={{height: '5px'}}>
 <div
 className="h-full transition-all duration-700"
 style={{ width: `${Math.min(100, (state.totalSaved / state.profile.savingsGoal) * 100)}%`, background: `linear-gradient(90deg, #1FA396, ${TEAL})` }}
 />
 </div>
 )}
 {/* Milestones */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 sm:mb-5">
 {Array.from(new Set([500, 1000, 5000, state.profile?.savingsGoal || 10000])).map((m, i) => (
 <div key={`milestone-${i}-${m}`} className={`border p-2 text-center transition-all ${state.totalSaved >= m ? "" : "opacity-50"}`} style={{borderColor: state.totalSaved >= m ? 'rgba(45,212,191,0.4)' : 'rgba(255,255,255,0.06)', background: state.totalSaved >= m ? 'rgba(45,212,191,0.06)' : 'transparent'}}>
 {state.totalSaved >= m ? <CheckCircle2 size={13} className="mx-auto mb-1" style={{color: '#2DD4BF'}} /> : <div className="w-3 h-3 border border-white/15 mx-auto mb-1" />}
 <div className="font-bold" style={{...mono, color: state.totalSaved >= m ? TEAL : "#4A505E", fontSize: '10px'}}>{currency}{m.toLocaleString()}</div>
 </div>
 ))}
 </div>
 {/* Goal reached celebration */}
 {state.profile?.savingsGoal && state.totalSaved >= state.profile.savingsGoal && (
 <div className="mb-4 border px-4 py-3 flex items-center justify-between gap-3" style={{borderColor: 'rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.06)'}}>
 <div className="flex items-center gap-2">
 <span className="" style={{color: '#C9A84C'}}>◆</span>
 <div>
 <p className="uppercase font-bold" style={{fontSize: '10px', letterSpacing: '0.15em', color: '#C9A84C'}}>Goal Reached</p>
 <p className="text-xs" style={{color: '#7A8090'}}>You hit {currency}{state.profile.savingsGoal.toLocaleString()}. Set a new target to keep building.</p>
 </div>
 </div>
 <button
 onClick={() => { setGoalInput(""); setShowGoalModal(true); }}
 className="uppercase font-bold px-3 py-1.5 shrink-0 transition-all hover:opacity-90" style={{fontSize: '9px', letterSpacing: '0.1em', color: '#06080E', ...mono, background: GOLD}}
 >
 New Goal
 </button>
 </div>
 )}
 {/* Log savings */}
 <div className="flex gap-2">
 <div className="relative flex-1">
 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{color: '#7A8090'}}>{currency}</span>
 <input className={inputClass + " pl-6 py-2"} style={inputStyle} type="number" placeholder="Amount to add" value={saveAmount} onChange={(e) => setSaveAmount(e.target.value)} />
 </div>
 <button
 onClick={() => {
 const amt = Number(saveAmount);
 if (!amt || amt <= 0) { toast.error("Enter an amount"); return; }
 addSavings(amt);
 setSaveAmount("");
 toast.success(`${currency}${amt} added to savings stack!`);
 }}
 className="px-4 py-2 uppercase font-bold hover:opacity-90 transition-all" style={{fontSize: '10px', letterSpacing: '0.1em', color: '#06080E', ...mono, background: GOLD}}
 >
 Add to Stack
 </button>
 </div>
 </div>

 {/* Savings chart */}
 <div className={card} style={cardStyle}>
 <h3 className={"font-bold mb-4"} style={{...monoLabelStyle, ...mono}}>Projected Savings Growth</h3>
 <ResponsiveContainer width="100%" height={180}>
 <AreaChart data={savingsProjection}>
 <defs>
 <linearGradient id="sg2" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor={TEAL} stopOpacity={0.25} />
 <stop offset="95%" stopColor={TEAL} stopOpacity={0} />
 </linearGradient>
 </defs>
 <XAxis dataKey="month" tick={{ fill: "#4A505E", fontSize: 10, fontFamily: "'Space Mono', monospace" }} axisLine={false} tickLine={false} />
 <YAxis tick={{ fill: "#4A505E", fontSize: 10, fontFamily: "'Space Mono', monospace" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${currency}${(v / 1000).toFixed(0)}k`} />
 <Tooltip formatter={(v: number) => [`${currency}${v.toLocaleString()}`, "Savings"]} contentStyle={{ background: BG_CARD, border: "1px solid rgba(201,168,76,0.2)", borderRadius: 0, fontSize: 11, fontFamily: "'Space Mono', monospace" }} />
 <Area type="monotone" dataKey="balance" stroke={TEAL} strokeWidth={2} fill="url(#sg2)" />
 </AreaChart>
 </ResponsiveContainer>
 </div>

 {/* Investments section */}
 <div>
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-base font-extrabold uppercase" style={{color: '#F0EDE4', letterSpacing: '0.04em'}}>Investment Portfolio</h3>
 <div className="flex items-center gap-3">
 <div className="font-bold" style={{...mono, color: totalInvestmentGain >= 0 ? TEAL : ROSE, fontSize: '11px'}}>
 {totalInvestmentGain >= 0 ? <ArrowUpRight size={13} className="inline" /> : <ArrowDownRight size={13} className="inline" />}
 {currency}{Math.abs(Math.round(totalInvestmentGain)).toLocaleString()} TOTAL {totalInvestmentGain >= 0 ? "GAIN" : "LOSS"}
 </div>
 </div>
 </div>

 {state.investments.length === 0 ? (
 <div className={card + " text-center py-10"} style={cardStyle}>
 <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center border" style={{borderColor: 'rgba(129,140,248,0.25)', color: '#818CF8'}}><TrendingUp size={20} /></div>
 <h4 className="font-extrabold mb-2" style={{fontFamily: "'Playfair Display', Georgia, serif", color: '#F0EDE4'}}>No investments tracked yet</h4>
 <p className="text-sm mb-4" style={{color: '#7A8090'}}>Add your stocks, ETFs, crypto, or retirement accounts.</p>
 <button
 onClick={() => {
 addInvestment({ id: generateInvestmentId(), name: "", type: "etf", currentValue: 0, amountInvested: 0, monthlyContribution: 0, color: getInvestColor(0) });
 }}
 className="inline-flex items-center gap-2 px-4 py-2 uppercase font-bold hover:opacity-90 transition-all" style={{fontSize: '10px', letterSpacing: '0.1em', color: '#06080E', ...mono, background: INDIGO}}
 >
 <Plus size={13} /> Add Investment
 </button>
 </div>
 ) : (
 <div className="space-y-3">
 {state.investments.map((inv) => {
 const gain = inv.currentValue - inv.amountInvested;
 const gainPct = inv.amountInvested > 0 ? (gain / inv.amountInvested) * 100 : 0;
 return (
 <div key={inv.id} className="border border-white/6 p-4" style={{background: 'rgba(255,255,255,0.02)'}}>
 <div className="flex items-start justify-between mb-3 gap-2">
 <div className="flex items-center gap-2.5">
 <div className="w-2.5 h-2.5 shrink-0" style={{ background: inv.color }} />
 <div>
 <div className="font-bold text-sm" style={{color: '#F0EDE4'}}>{inv.name || "Unnamed"}</div>
 <div className="uppercase" style={{fontSize: '9px', letterSpacing: '0.1em', color: '#4A505E'}}>{inv.type.replace("_", " ")}</div>
 </div>
 </div>
 <button onClick={() => setEditingInvest(inv)} className="hover:text-[#F0EDE4] p-1.5 transition-all" style={{color: '#4A505E'}}>
 <Edit3 size={13} />
 </button>
 </div>
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
 <div>
 <div className="uppercase mb-1" style={{fontSize: '8px', letterSpacing: '0.18em', color: '#4A505E'}}>Current Value</div>
 <div className="text-lg font-extrabold" style={{color: '#F0EDE4'}}>{currency}{inv.currentValue.toLocaleString()}</div>
 </div>
 <div>
 <div className="uppercase mb-1" style={{fontSize: '8px', letterSpacing: '0.18em', color: '#4A505E'}}>Gain / Loss</div>
 <div className="text-sm font-bold" style={{ ...mono, color: gain >= 0 ? TEAL : ROSE }}>
 {gain >= 0 ? "+" : ""}{currency}{Math.abs(Math.round(gain)).toLocaleString()} ({gainPct.toFixed(1)}%)
 </div>
 </div>
 <div>
 <div className="uppercase mb-1" style={{fontSize: '8px', letterSpacing: '0.18em', color: '#4A505E'}}>Monthly Contrib.</div>
 <div className="text-sm font-bold" style={{color: '#818CF8'}}>{currency}{inv.monthlyContribution}/mo</div>
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
 color: [INDIGO, GOLD, AMBER, "#EC4899", TEAL][idx % 5],
 });
 }}
 className="flex items-center gap-2 uppercase font-bold border px-4 py-2.5 w-full justify-center transition-all" style={{fontSize: '10px', letterSpacing: '0.1em', color: '#818CF8', borderColor: 'rgba(129,140,248,0.2)'}}
 >
 <Plus size={13} /> Add Investment
 </button>
 </div>
 )}
 </div>
 </div>
 )}

 {/* ── GAME PLAN TAB ─────────────────────────────────────────────────── */}
 {activeTab === "plan" && (() => {
 // ── Personalised Game Plan computations (unchanged) ──────────────────
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
 color: ROSE, priority: "critical", badge: "DO FIRST",
 });
 }

 if (!hasEmergencyFund) {
 prioritySteps.push({
 icon: <Shield size={16} />,
 title: `Build a ${currency}${Math.round(emergencyFundTarget).toLocaleString()} emergency fund (3 months of expenses)`,
 desc: state.totalSaved > 0
 ? `You have ${currency}${Math.round(state.totalSaved).toLocaleString()} saved. At ${currency}${Math.round(savingsBudget).toLocaleString()}/mo you'll hit your target in ~${monthsToEmergencyFund} months.`
 : `No emergency fund means any unexpected expense pushes you into more debt. Save ${currency}${Math.round(savingsBudget).toLocaleString()}/mo and reach this in ~${monthsToEmergencyFund} months.`,
 color: AMBER, priority: isOverspending ? "high" : "critical", badge: isOverspending ? undefined : "DO FIRST",
 });
 }

 if (zeroAprDebts.length > 0) {
 prioritySteps.push({
 icon: <Zap size={16} />,
 title: `Wipe your 0% APR debts — free wins`,
 desc: `${zeroAprDebts.map((d) => `${d.name} (${currency}${Math.round(d.balance).toLocaleString()})`).join(", ")} carry no interest. Pay these off first for quick wins at zero cost.`,
 color: TEAL, priority: "high",
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
 color: ROSE, priority: "high",
 });
 }

 if (nonEssentialExpenses.length > 0 && nonEssentialTotal > 50) {
 prioritySteps.push({
 icon: <Trash2 size={16} />,
 title: `Cut ${currency}${Math.round(nonEssentialTotal).toLocaleString()}/mo in non-essential spending`,
 desc: `You have ${nonEssentialExpenses.length} non-essential expense${nonEssentialExpenses.length > 1 ? "s" : ""}: ${nonEssentialExpenses.map((e) => e.label).join(", ")}. Redirecting half (${currency}${Math.round(nonEssentialTotal / 2).toLocaleString()}/mo) to debt saves ${currency}${Math.round((nonEssentialTotal / 2) * 12).toLocaleString()} in a year.`,
 color: AMBER, priority: "medium",
 });
 }

 if (!isOverspending && savingsBudget > 0) {
 prioritySteps.push({
 icon: <TrendingUp size={16} />,
 title: `Automate ${currency}${Math.round(savingsBudget).toLocaleString()}/mo to savings on payday`,
 desc: `You have ${currency}${Math.round(monthlyLeftover).toLocaleString()}/mo left after expenses. Set up an automatic transfer of ${currency}${Math.round(savingsBudget).toLocaleString()} to savings the same day you get paid — before you can spend it. Savings rate: ${Math.round(savingsRate)}%.`,
 color: INDIGO, priority: "medium",
 });
 }

 if (totalDebt === 0 && monthlyLeftover > 200) {
 prioritySteps.push({
 icon: <ArrowUpRight size={16} />,
 title: `You're debt-free — invest ${currency}${Math.round(monthlyLeftover * 0.5).toLocaleString()}/mo`,
 desc: totalInvestmentMonthly > 0
 ? `You're already contributing ${currency}${Math.round(totalInvestmentMonthly).toLocaleString()}/mo — consider increasing it. Your ${currency}${Math.round(monthlyLeftover).toLocaleString()}/mo surplus can compound significantly over time.`
 : `Start with index funds or a tax-advantaged account (ISA/401k/IRA). Your ${currency}${Math.round(monthlyLeftover).toLocaleString()}/mo surplus invested at 7% avg return grows to ${currency}${Math.round(monthlyLeftover * 0.5 * 12 * 10 * 1.07).toLocaleString()} in 10 years.`,
 color: TEAL, priority: "medium",
 });
 }

 prioritySteps.push({
 icon: <DollarSign size={16} />,
 title: "Found money rule — windfalls go to the plan",
 desc: `Tax refund, overtime, selling something — 100% of unexpected income goes to ${totalDebt > 0 ? `debt (${currency}${Math.round(totalDebt).toLocaleString()} remaining)` : "savings or investments"}. Don't let it disappear into lifestyle.`,
 color: INDIGO, priority: "low",
 });

 const priorityColors: Record<Priority, string> = { critical: ROSE, high: AMBER, medium: INDIGO, low: "#4A505E" };
 const priorityLabels: Record<Priority, string> = { critical: "CRITICAL", high: "HIGH", medium: "MEDIUM", low: "LOW" };

 const score = Math.max(0, Math.min(100, Math.round(
 (isOverspending ? 0 : 25) +
 (hasEmergencyFund ? 20 : Math.min(20, (state.totalSaved / Math.max(1, emergencyFundTarget)) * 20)) +
 (totalDebt === 0 ? 25 : Math.max(0, 25 - (debtToIncomeRatio / 4))) +
 (savingsRate >= 20 ? 20 : (savingsRate / 20) * 20) +
 (totalInvestmentMonthly > 0 ? 10 : 0)
 )));
 const scoreColor = score >= 70 ? TEAL : score >= 40 ? GOLD : ROSE;
 const scoreLabel = score >= 70 ? "Strong" : score >= 40 ? "Building" : "Needs Work";

 return (
 <div className="space-y-6">
 {/* Financial Health Score */}
 <div className={card + " relative overflow-hidden"} style={cardStyle}>
 <div className="absolute top-0 left-0 right-0" style={{background: `linear-gradient(90deg, ${scoreColor}, transparent 70%)`, height: '2px'}} />
 <div className="flex items-center justify-between mb-4">
 <h3 className={"font-bold"} style={{...monoLabelStyle, ...mono}}>Your Financial Health Score</h3>
 <span className="uppercase px-2 py-0.5" style={{...mono, background: `${scoreColor}18`, color: scoreColor, fontSize: '9px', letterSpacing: '0.15em'}}>{scoreLabel}</span>
 </div>
 <div className="flex items-end gap-4 mb-4">
 <div className="text-5xl font-extrabold" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: scoreColor, letterSpacing: "-0.02em" }}>{score}</div>
 <div className="text-sm mb-1" style={{color: '#4A505E'}}>/100</div>
 </div>
 <div className="w-full bg-white/5 mb-4 overflow-hidden" style={{height: '4px'}}>
 <div className="h-full transition-all duration-700" style={{ width: `${score}%`, background: scoreColor }} />
 </div>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
 {[
 { label: "Cash Flow", ok: !isOverspending, val: isOverspending ? `-${currency}${Math.round(overspendAmount)}` : `+${currency}${Math.round(monthlyLeftover)}` },
 { label: "Emergency Fund", ok: hasEmergencyFund, val: hasEmergencyFund ? "3MO ✓" : `${Math.round((state.totalSaved / Math.max(1, emergencyFundTarget)) * 100)}%` },
 { label: "Debt Ratio", ok: debtToIncomeRatio < 36, val: `${Math.round(debtToIncomeRatio)}%` },
 { label: "Savings Rate", ok: savingsRate >= 20, val: `${Math.round(savingsRate)}%` },
 ].map((item) => (
 <div key={item.label} className="border border-white/6 p-2.5" style={{background: 'rgba(255,255,255,0.02)'}}>
 <div className="uppercase mb-1" style={{fontSize: '8px', letterSpacing: '0.15em', color: '#4A505E'}}>{item.label}</div>
 <div className="font-bold" style={{...mono, color: item.ok ? TEAL : AMBER, fontSize: '11px'}}>{item.val}</div>
 </div>
 ))}
 </div>
 </div>

 {/* Personalised Priority Steps */}
 <div className={card} style={cardStyle}>
 <div className="flex items-center gap-2 mb-4">
 <Lightbulb size={15} className="" style={{color: '#C9A84C'}} />
 <h3 className={"font-bold"} style={{...monoLabelStyle, ...mono}}>Your Personalised Action Plan</h3>
 </div>
 <p className="uppercase mb-4" style={{fontSize: '9px', letterSpacing: '0.1em', color: '#4A505E'}}>Ranked by priority based on your actual numbers — not generic advice.</p>
 <div className="space-y-3">
 {prioritySteps.map((step, i) => (
 <div key={i} className="flex gap-4 border border-white/6 p-4 hover:bg-white/[0.04] transition-all" style={{background: 'rgba(255,255,255,0.02)'}}>
 <div className="w-8 h-8 flex items-center justify-center shrink-0 border" style={{ borderColor: `${step.color}30`, color: step.color }}>
 {step.icon}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1 flex-wrap">
 <div className="font-bold text-sm" style={{color: '#F0EDE4'}}>{step.title}</div>
 {step.badge && (
 <span className="px-1.5 py-0.5 shrink-0" style={{...mono, background: `${step.color}18`, color: step.color, fontSize: '8px', letterSpacing: '0.12em'}}>{step.badge}</span>
 )}
 <span className="px-1.5 py-0.5 shrink-0" style={{...mono, background: `${priorityColors[step.priority]}12`, color: priorityColors[step.priority], fontSize: '8px', letterSpacing: '0.12em'}}>{priorityLabels[step.priority]}</span>
 </div>
 <div className="text-xs leading-relaxed" style={{color: '#7A8090'}}>{step.desc}</div>
 </div>
 <div className="text-sm font-bold shrink-0 mt-1" style={{color: '#2E3340'}}>{String(i + 1).padStart(2, "0")}</div>
 </div>
 ))}
 </div>
 </div>

 {/* Debt Payoff Roadmap */}
 {state.debts.length > 0 && currentSim.payoffOrder.length > 0 && (
 <div className={card} style={cardStyle}>
 <div className="flex items-center gap-2 mb-4">
 <Target size={15} className="" style={{color: '#C9A84C'}} />
 <h3 className={"font-bold"} style={{...monoLabelStyle, ...mono}}>Debt Payoff Roadmap</h3>
 <span className="ml-auto uppercase" style={{fontSize: '9px', letterSpacing: '0.1em', color: '#4A505E'}}>{state.strategy === "avalanche" ? "Avalanche" : "Snowball"} strategy</span>
 </div>
 <div className="space-y-3">
 {currentSim.payoffOrder.map((item, i) => {
 const d = new Date();
 d.setMonth(d.getMonth() + item.month);
 const debt = state.debts.find((x) => x.name === item.name);
 return (
 <div key={item.name} className="flex items-center gap-4">
 <div className="w-8 h-8 border flex items-center justify-center font-bold shrink-0" style={{borderColor: 'rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.06)', fontSize: '10px', color: '#C9A84C'}}>{String(i + 1).padStart(2, "0")}</div>
 <div className="flex-1">
 <div className="text-sm font-semibold" style={{color: '#F0EDE4'}}>{item.name} — <span style={{...{color:"#2DD4BF"}, ...mono}}>PAID OFF</span></div>
 <div className="uppercase" style={{fontSize: '9px', letterSpacing: '0.08em', color: '#4A505E'}}>{d.toLocaleDateString("en-US", { month: "long", year: "numeric" })} · MONTH {item.month}{debt ? ` · ${debt.apr}% APR` : ""}</div>
 </div>
 <CheckCircle2 size={15} style={{color:"rgba(45,212,191,0.4)"}} className="shrink-0" />
 </div>
 );
 })}
 <div className="flex items-center gap-4 pt-3 border-t" style={{ borderColor: "rgba(201,168,76,0.15)" }}>
 <div className="w-8 h-8 border flex items-center justify-center shrink-0" style={{borderColor: 'rgba(201,168,76,0.4)', background: 'rgba(201,168,76,0.1)', color: '#C9A84C'}}>◆</div>
 <div>
 <div className="text-sm font-extrabold" style={{color: '#F0EDE4'}}>Completely Debt-Free</div>
 <div className="uppercase" style={{fontSize: '9px', letterSpacing: '0.08em', color: '#4A505E'}}>{getDebtFreeDate(currentSim.months)} · {currency}{Math.round(currentSim.totalInterest).toLocaleString()} TOTAL INTEREST PAID</div>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* The 3 Rules */}
 <div className={card} style={cardStyle}>
 <div className="flex items-center gap-2 mb-4">
 <BookOpen size={15} className="" style={{color: '#C9A84C'}} />
 <h3 className={"font-bold"} style={{...monoLabelStyle, ...mono}}>The 3 Rules</h3>
 </div>
 <div className="space-y-3">
 {[
 {
 num: "01",
 title: "Pay yourself first",
 desc: savingsBudget > 0
 ? `Every payday, move ${currency}${Math.round(savingsBudget).toLocaleString()} to savings before spending anything. Non-negotiable.`
 : "Every payday, move money to savings before spending anything. Even a small amount builds the habit.",
 color: GOLD,
 },
 {
 num: "02",
 title: "Attack the highest APR debt",
 desc: state.debts.length > 0
 ? `After minimums, throw every extra dollar at your highest-rate debt. ${state.strategy === "avalanche" ? "You're on Avalanche — this is the mathematically correct move." : "Consider switching to Avalanche to save on interest."}`
 : "Once you have debt, after paying minimums throw every extra dollar at the highest-rate balance.",
 color: ROSE,
 },
 {
 num: "03",
 title: "Found money goes to the plan",
 desc: `Tax refund, overtime, selling something — 100% of unexpected income goes to ${totalDebt > 0 ? "debt or savings" : "savings or investments"}. Don't let it disappear into lifestyle.`,
 color: INDIGO,
 },
 ].map((r) => (
 <div key={r.num} className="flex gap-4 border border-white/6 p-4" style={{background: 'rgba(255,255,255,0.02)'}}>
 <div className="text-2xl font-bold shrink-0" style={{ ...mono, color: r.color + "50" }}>{r.num}</div>
 <div>
 <div className="font-bold text-sm mb-1" style={{color: '#F0EDE4'}}>{r.title}</div>
 <div className="text-xs leading-relaxed" style={{color: '#7A8090'}}>{r.desc}</div>
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
 color: TEAL,
 });
 }
 if (state.expenses.filter((e) => !e.isEssential).length > 0) {
 const nonEssTotal = state.expenses.filter((e) => !e.isEssential).reduce((s, e) => s + e.amount, 0);
 quickWins.push({
 text: `Cut non-essential subscriptions to free up ${currency}${Math.round(nonEssTotal).toLocaleString()}/mo`,
 color: AMBER,
 });
 }
 if (totalMonthlyInterest > 100) {
 quickWins.push({
 text: `You're paying ${currency}${Math.round(totalMonthlyInterest).toLocaleString()}/mo in interest — every extra dollar to debt directly reduces this`,
 color: ROSE,
 });
 }
 if (monthlyLeftover > 500) {
 quickWins.push({
 text: `You have ${currency}${Math.round(monthlyLeftover).toLocaleString()}/mo available — automate ${currency}${Math.round(savingsBudget).toLocaleString()} to savings on payday so it never gets spent`,
 color: INDIGO,
 });
 }
 if (quickWins.length === 0) return null;
 return (
 <div className={card} style={cardStyle}>
 <div className="flex items-center gap-2 mb-4">
 <Zap size={15} className="" style={{color: '#C9A84C'}} />
 <h3 className={"font-bold"} style={{...monoLabelStyle, ...mono}}>Quick Wins Right Now</h3>
 </div>
 <div className="space-y-2">
 {quickWins.map((w, i) => (
 <div key={i} className="flex gap-3 border border-white/6 p-3" style={{background: 'rgba(255,255,255,0.02)'}}>
 <div className="w-1.5 h-1.5 mt-1.5 shrink-0" style={{ background: w.color }} />
 <div className="text-xs leading-relaxed" style={{color: '#7A8090'}}>{w.text}</div>
 </div>
 ))}
 </div>
 </div>
 );
 })()}

 {/* Strategy Comparison */}
 {state.debts.length > 0 && (
 <div className={card} style={cardStyle}>
 <div className="flex items-center gap-2 mb-4">
 <Info size={15} className="" style={{color: '#818CF8'}} />
 <h3 className={"font-bold"} style={{...monoLabelStyle, ...mono}}>Snowball vs Avalanche — Which Is Better for You?</h3>
 </div>
 <div className="grid grid-cols-2 gap-4">
 {[
 { label: "Snowball", sim: snowball, desc: "Pay smallest balance first. Faster wins, better motivation.", color: INDIGO },
 { label: "Avalanche", sim: avalanche, desc: "Pay highest APR first. Saves the most money mathematically.", color: GOLD },
 ].map((s) => (
 <div key={s.label} className={`border p-4 transition-all`} style={{borderColor: state.strategy === s.label.toLowerCase() ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.06)', background: state.strategy === s.label.toLowerCase() ? 'rgba(201,168,76,0.04)' : 'rgba(255,255,255,0.02)'}}>
 <div className="flex items-center justify-between mb-2">
 <div className="font-bold uppercase" style={{...mono, color: s.color, fontSize: '11px', letterSpacing: '0.1em'}}>{s.label}</div>
 {state.strategy === s.label.toLowerCase() && <span className="" style={{fontSize: '8px', letterSpacing: '0.15em', color: '#C9A84C'}}>ACTIVE</span>}
 </div>
 <div className="text-xs mb-3" style={{color: '#7A8090'}}>{s.desc}</div>
 <div className="space-y-1.5">
 <div className="flex justify-between" style={{fontSize: '10px'}}><span className="uppercase" style={{...{letterSpacing:"0.08em",color:"#4A505E"}, ...mono}}>Debt-free in</span><span className="text-[#F0EDE4]" style={mono}>{s.sim.months} MONTHS</span></div>
 <div className="flex justify-between" style={{fontSize: '10px'}}><span className="uppercase" style={{...{letterSpacing:"0.08em",color:"#4A505E"}, ...mono}}>Total interest</span><span className="text-[#E05252]" style={mono}>{currency}{Math.round(s.sim.totalInterest).toLocaleString()}</span></div>
 </div>
 </div>
 ))}
 </div>
 {avalanche.totalInterest < snowball.totalInterest && (
 <div className="mt-3 border p-3" style={{fontSize: '10px', letterSpacing: '0.03em', color: '#C9A84C', background: 'rgba(201,168,76,0.04)', borderColor: 'rgba(201,168,76,0.2)'}}>
 ▲ AVALANCHE SAVES YOU {currency}{Math.round(snowball.totalInterest - avalanche.totalInterest).toLocaleString()} IN INTEREST VS SNOWBALL. {state.strategy !== "avalanche" ? "CONSIDER SWITCHING." : "YOU'RE ON THE RIGHT STRATEGY."}
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
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}>
 <div style={{ ...modalShell, maxWidth: "380px" }}>
 <div style={modalTopBar(GOLD)} />
 <ModalHeader
 title={state.totalSaved >= (state.profile?.savingsGoal || 0) && state.profile?.savingsGoal ? "◆ New Savings Goal" : "Update Savings Goal"}
 sub="Set the next target"
 onClose={() => setShowGoalModal(false)}
 />
 <div className="px-5 py-4">
 {state.totalSaved >= (state.profile?.savingsGoal || 0) && state.profile?.savingsGoal ? (
 <p className="text-xs mb-4" style={{color: '#C9A84C'}}>You've hit your goal of {currency}{state.profile.savingsGoal.toLocaleString()}! Set a new target to keep the momentum going.</p>
 ) : (
 <p className="text-xs mb-4" style={{color: '#7A8090'}}>Current goal: <span className="" style={{color: '#F0EDE4'}}>{currency}{(state.profile?.savingsGoal || 0).toLocaleString()}</span>. Update it anytime as your situation changes.</p>
 )}
 <div className="relative mb-4">
 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{color: '#7A8090'}}>{currency}</span>
 <input
 className={inputClass + " pl-6 py-2"} style={inputStyle}
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
 <button onClick={() => setShowGoalModal(false)} className={"flex-1 py-2 " + btnGhost} style={mono}>Cancel</button>
 <button
 onClick={() => {
 const val = Number(goalInput);
 if (!val || val <= 0) { toast.error("Enter a valid goal amount"); return; }
 updateSavingsGoal(val);
 setShowGoalModal(false);
 toast.success(`Savings goal updated to ${currency}${val.toLocaleString()}!`);
 }}
 className={"flex-1 py-2 " + btnGold}
 style={{ ...mono, background: GOLD }}
 >
 Save Goal
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* BOTTOM FOOTER BAR */}
 <footer className="border-t py-6 mt-8" style={{ borderColor: "rgba(201,168,76,0.12)" }}>
 <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col gap-4">
 {/* Top row: branding + powered by + privacy note */}
 <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
 <div className="flex items-center gap-2">
 <div className="w-5 h-5 flex items-center justify-center font-bold" style={{border: "1px solid #C9A84C", color: GOLD, ...mono, fontSize: '8px'}}>PE</div>
 <span className="font-semibold" style={{fontSize: '10px', color: '#4A505E'}}>Personal Economy</span>
 </div>
 <PoweredByBadge />
 {isAuthenticated ? (
 <p className="flex items-center gap-1.5" style={{fontSize: '9px', letterSpacing: '0.05em', color: '#3D4250'}}>
 {isSyncing ? (
 <><span style={{width:"6px",height:"6px",background:"#C9A84C",display:"inline-block"}} className="animate-pulse" />SYNCING TO CLOUD…</>
 ) : (
 <><span style={{width:"6px",height:"6px",background:"#C9A84C",display:"inline-block"}} />SYNCED ACROSS DEVICES</>
 )}
 </p>
 ) : (
 <p className="" style={{fontSize: '9px', letterSpacing: '0.05em', color: '#3D4250'}}>
 DATA STORED LOCALLY. 
 <a href={getLoginUrl()} className="hover:text-[#E8C97A] underline underline-offset-2 transition-colors" style={{color: '#C9A84C'}}>SIGN IN</a>
 TO SYNC ACROSS DEVICES.
 </p>
 )}
 </div>
 {/* Bottom row: support */}
 <div className="flex flex-col sm:flex-row items-center justify-center gap-x-6 gap-y-2 border-t border-white/4 pt-4">
 <a
 href="mailto:streetecon@proton.me"
 className="uppercase transition-colors flex items-center gap-1.5" style={{fontSize: '9px', letterSpacing: '0.12em', color: '#4A505E'}}
 >
 <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
 Contact Support
 </a>
 </div>
 </div>
 </footer>



 {/* RESET CONFIRM */}
 {showReset && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}>
 <div style={{ ...modalShell, maxWidth: "380px" }} className="p-6 text-center">
 <div style={modalTopBar(ROSE)} />
 <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center border" style={{borderColor: 'rgba(224,82,82,0.3)', color: '#E05252'}}><RotateCcw size={22} /></div>
 <h3 className="font-extrabold mb-2" style={{fontFamily: "'Playfair Display', Georgia, serif", fontSize: "18px", color: '#F0EDE4'}}>Reset Everything?</h3>
 <p className="text-sm mb-6" style={{color: '#7A8090'}}>This will clear all your data and return to the start. This cannot be undone.</p>
 <div className="flex gap-3">
 <button onClick={() => setShowReset(false)} className={"flex-1 py-2.5 " + btnGhost} style={{...btnGhostStyle, ...mono}}>Cancel</button>
 <button
 onClick={() => { resetAll(); navigate("/pro"); }}
 className="flex-1 py-2.5 uppercase font-bold transition-all" style={{fontSize: '10px', letterSpacing: '0.1em', color: '#F0EDE4'}}
 >
 Yes, Reset
 </button>
 </div>
 </div>
 </div>
 )}

 <StrategyInfoModal open={showStrategyInfo} onClose={() => setShowStrategyInfo(false)} />
 </div>
 );
}
