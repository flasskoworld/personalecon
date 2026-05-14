// Personal Economy Pro — Core Data Store
// All user financial data, sample demo data, and localStorage persistence

export type PayFrequency = "biweekly" | "weekly" | "semimonthly" | "monthly";

export interface UserProfile {
  name: string;
  income: number;
  payFrequency: PayFrequency;
  firstPayday: string; // ISO date string e.g. "2026-05-01"
  savingsGoal: number;
  currency: string; // "$" | "£" | "€"
}

export interface Expense {
  id: string;
  label: string;
  amount: number;
  category: "housing" | "transport" | "food" | "insurance" | "subscriptions" | "utilities" | "health" | "other";
  isEssential: boolean;
}

export interface Debt {
  id: string;
  name: string;
  balance: number;
  originalBalance: number;
  apr: number;
  minimumPayment: number;
  paid: number;
  color: string;
}

export interface AdditionalIncome {
  id: string;
  label: string;  // e.g. "Freelance", "Side Hustle", "Part-time Job"
  amount: number; // per-period amount
  frequency: PayFrequency;
}

export interface Investment {
  id: string;
  name: string;
  type: "stocks" | "etf" | "crypto" | "real_estate" | "401k" | "ira" | "other";
  currentValue: number;
  amountInvested: number;
  monthlyContribution: number;
  color: string;
}

export interface AppState {
  profile: UserProfile | null;
  expenses: Expense[];
  debts: Debt[];
  investments: Investment[];
  additionalIncome: AdditionalIncome[]; // optional extra income sources
  totalSaved: number;
  debtPayments: Record<string, number>; // debtId -> total paid this session
  investmentLogs: Record<string, number>; // investmentId -> current value override
  strategy: "avalanche" | "snowball";
  setupComplete: boolean;
  isDemo: boolean;
  lastUpdated: string;
}

const STORAGE_KEY = "personal-economy-pro-v1";

const DEBT_COLORS = ["#10b981", "#f59e0b", "#6366f1", "#ec4899", "#14b8a6", "#f97316"];
const INVEST_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#14b8a6", "#f97316"];

// ─── DEMO DATA ────────────────────────────────────────────────────────────────

export const DEMO_STATE: AppState = {
  profile: {
    name: "Jordan Rivers",
    income: 2500,
    payFrequency: "biweekly",
    firstPayday: "2026-05-01",
    savingsGoal: 15000,
    currency: "$",
  },
  expenses: [
    { id: "e1", label: "Rent", amount: 1200, category: "housing", isEssential: true },
    { id: "e2", label: "Car Payment", amount: 420, category: "transport", isEssential: true },
    { id: "e3", label: "Car Insurance", amount: 165, category: "insurance", isEssential: true },
    { id: "e4", label: "Groceries", amount: 350, category: "food", isEssential: true },
    { id: "e5", label: "Gas", amount: 140, category: "transport", isEssential: true },
    { id: "e6", label: "Phone Bill", amount: 85, category: "utilities", isEssential: true },
    { id: "e7", label: "Streaming Services", amount: 45, category: "subscriptions", isEssential: false },
    { id: "e8", label: "Gym Membership", amount: 50, category: "health", isEssential: false },
    { id: "e9", label: "Dining Out", amount: 180, category: "food", isEssential: false },
    { id: "e10", label: "Miscellaneous", amount: 100, category: "other", isEssential: false },
  ],
  debts: [
    { id: "d1", name: "Visa Credit Card", balance: 3850, originalBalance: 3850, apr: 24.99, minimumPayment: 95, paid: 0, color: DEBT_COLORS[0] },
    { id: "d2", name: "Personal Loan", balance: 4200, originalBalance: 4200, apr: 16.5, minimumPayment: 130, paid: 0, color: DEBT_COLORS[1] },
    { id: "d3", name: "Student Loan", balance: 1480, originalBalance: 1480, apr: 5.5, minimumPayment: 60, paid: 0, color: DEBT_COLORS[2] },
    { id: "d4", name: "Medical Bill", balance: 540, originalBalance: 540, apr: 0, minimumPayment: 45, paid: 0, color: DEBT_COLORS[3] },
  ],
  investments: [
    { id: "i1", name: "S&P 500 Index Fund", type: "etf", currentValue: 4800, amountInvested: 4200, monthlyContribution: 150, color: INVEST_COLORS[0] },
    { id: "i2", name: "Roth IRA", type: "ira", currentValue: 6200, amountInvested: 5500, monthlyContribution: 250, color: INVEST_COLORS[1] },
    { id: "i3", name: "Ethereum", type: "crypto", currentValue: 780, amountInvested: 1000, monthlyContribution: 0, color: INVEST_COLORS[2] },
  ],
  totalSaved: 2100,
  additionalIncome: [],
  debtPayments: {},
  investmentLogs: {},
  strategy: "avalanche",
  setupComplete: true,
  isDemo: true,
  lastUpdated: new Date().toISOString(),
};

// ─── DEFAULT EMPTY STATE ──────────────────────────────────────────────────────

export const DEFAULT_STATE: AppState = {
  profile: null,
  expenses: [],
  debts: [],
  investments: [],
  totalSaved: 0,
  additionalIncome: [],
  debtPayments: {},
  investmentLogs: {},
  strategy: "avalanche",
  setupComplete: false,
  isDemo: false,
  lastUpdated: new Date().toISOString(),
};

// ─── PERSISTENCE ──────────────────────────────────────────────────────────────

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return JSON.parse(raw) as AppState;
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, lastUpdated: new Date().toISOString() }));
  } catch {}
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ─── CALCULATIONS ─────────────────────────────────────────────────────────────

export function monthlyIncome(state: AppState): number {
  if (!state.profile) return 0;
  const { income, payFrequency } = state.profile;
  switch (payFrequency) {
    case "weekly": return income * 52 / 12;
    case "biweekly": return income * 26 / 12;
    case "semimonthly": return income * 2;
    case "monthly": return income;
    default: return income;
  }
}

/** Convert a single AdditionalIncome source to a monthly amount */
export function toMonthlyAmount(amount: number, frequency: PayFrequency): number {
  switch (frequency) {
    case "weekly": return amount * 52 / 12;
    case "biweekly": return amount * 26 / 12;
    case "semimonthly": return amount * 2;
    case "monthly": return amount;
    default: return amount;
  }
}

/** Total monthly income from all additional sources */
export function additionalMonthlyIncome(state: AppState): number {
  return (state.additionalIncome || []).reduce(
    (sum, s) => sum + toMonthlyAmount(s.amount, s.frequency),
    0
  );
}

/** Combined primary + additional monthly income */
export function totalMonthlyIncome(state: AppState): number {
  return monthlyIncome(state) + additionalMonthlyIncome(state);
}

export function totalExpenses(state: AppState): number {
  return state.expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function totalDebt(state: AppState): number {
  return state.debts.reduce((sum, d) => sum + d.balance, 0);
}

export function totalPaid(state: AppState): number {
  return state.debts.reduce((sum, d) => sum + d.paid, 0);
}

export function monthlyInterestCost(debt: Debt): number {
  return (debt.balance * (debt.apr / 100)) / 12;
}

export function totalMonthlyInterest(state: AppState): number {
  return state.debts.reduce((sum, d) => sum + monthlyInterestCost(d), 0);
}

export function monthlyLeftover(state: AppState): number {
  return totalMonthlyIncome(state) - totalExpenses(state);
}

export function totalInvestmentValue(state: AppState): number {
  return state.investments.reduce((sum, i) => sum + i.currentValue, 0);
}

export function totalInvestmentGain(state: AppState): number {
  return state.investments.reduce((sum, i) => sum + (i.currentValue - i.amountInvested), 0);
}

export function totalMonthlyInvestContrib(state: AppState): number {
  return state.investments.reduce((sum, i) => sum + i.monthlyContribution, 0);
}

export function netWorth(state: AppState): number {
  return state.totalSaved + totalInvestmentValue(state) - totalDebt(state);
}

// ─── DEBT PAYOFF SIMULATION ───────────────────────────────────────────────────

export type DebtStrategy = "avalanche" | "snowball";

export function sortDebtsByStrategy(debts: Debt[], strategy: DebtStrategy): Debt[] {
  const active = debts.filter((d) => d.balance > 0);
  const paid = debts.filter((d) => d.balance === 0);
  const sorted = [...active].sort((a, b) =>
    strategy === "avalanche" ? b.apr - a.apr : a.balance - b.balance
  );
  return [...sorted, ...paid];
}

export interface PayoffResult {
  months: number;
  totalInterest: number;
  payoffOrder: { name: string; month: number }[];
}

export function simulatePayoff(debts: Debt[], monthlyBudget: number, strategy: DebtStrategy): PayoffResult {
  if (debts.length === 0 || monthlyBudget <= 0) return { months: 0, totalInterest: 0, payoffOrder: [] };

  const working = debts.map((d) => ({ ...d, bal: d.balance }));
  let totalInterest = 0;
  let month = 0;
  const payoffOrder: { name: string; month: number }[] = [];
  const MAX_MONTHS = 360;

  while (working.some((d) => d.bal > 0) && month < MAX_MONTHS) {
    month++;
    // Sort by strategy
    const active = working.filter((d) => d.bal > 0).sort((a, b) =>
      strategy === "avalanche" ? b.apr - a.apr : a.bal - b.bal
    );

    // Pay minimums first
    let remaining = monthlyBudget;
    for (const d of working) {
      if (d.bal <= 0) continue;
      const interest = (d.bal * (d.apr / 100)) / 12;
      totalInterest += interest;
      d.bal += interest;
      const minPay = Math.min(d.minimumPayment, d.bal);
      d.bal = Math.max(0, d.bal - minPay);
      remaining -= minPay;
      if (d.bal === 0) payoffOrder.push({ name: d.name, month });
    }

    // Apply extra to target
    if (remaining > 0 && active.length > 0) {
      const target = active[0];
      const extra = Math.min(remaining, target.bal);
      target.bal = Math.max(0, target.bal - extra);
      if (target.bal === 0 && !payoffOrder.find((p) => p.name === target.name)) {
        payoffOrder.push({ name: target.name, month });
      }
    }
  }

  return { months: month, totalInterest, payoffOrder };
}

export function getDebtFreeDate(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function formatCurrency(n: number, currency = "$"): string {
  return `${currency}${Math.round(n).toLocaleString()}`;
}

export function formatCurrencyDecimal(n: number, currency = "$"): string {
  return `${currency}${n.toFixed(2)}`;
}

export function formatPercent(n: number): string {
  return `${n.toFixed(2)}%`;
}

export function generateDebtId(): string {
  return `d_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function generateExpenseId(): string {
  return `e_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function generateInvestmentId(): string {
  return `i_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function getDebtColor(index: number): string {
  return DEBT_COLORS[index % DEBT_COLORS.length];
}

export function getInvestColor(index: number): string {
  return INVEST_COLORS[index % INVEST_COLORS.length];
}

// ─── SAVINGS PROJECTION ───────────────────────────────────────────────────────

export function buildSavingsProjection(monthlySavings: number, currentSaved: number, months = 12) {
  const data = [];
  let balance = currentSaved;
  for (let i = 1; i <= months; i++) {
    balance += monthlySavings;
    const d = new Date();
    d.setMonth(d.getMonth() + i);
    data.push({
      month: d.toLocaleDateString("en-US", { month: "short" }),
      balance: Math.round(balance),
    });
  }
  return data;
}
