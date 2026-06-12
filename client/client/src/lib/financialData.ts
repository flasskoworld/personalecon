// Hustle Board — Financial Data Store
// All user financial data, calculations, and game plan logic

export const INCOME = {
  biweekly: 1600,
  monthly: 3200,
  annual: 38400,
  nextPayday: "May 1, 2026",
};

export const EXPENSES_FIXED: Expense[] = [
  { id: "car", name: "Car Payment", amount: 493, category: "transport", essential: true },
  { id: "rent", name: "Rent", amount: 400, category: "housing", essential: true },
  { id: "insurance", name: "Car Insurance", amount: 155, category: "transport", essential: true },
  { id: "food", name: "Food / Groceries", amount: 312, category: "food", essential: true },
  { id: "gas", name: "Gas", amount: 150, category: "transport", essential: true },
  { id: "gym", name: "Gym", amount: 20, category: "health", essential: false },
  { id: "canva", name: "Canva", amount: 12.99, category: "subscriptions", essential: false },
  { id: "xbox", name: "Xbox Live", amount: 9.99, category: "subscriptions", essential: false },
  { id: "capcut", name: "CapCut", amount: 20, category: "subscriptions", essential: false },
  { id: "chatgpt", name: "ChatGPT", amount: 20, category: "subscriptions", essential: false },
  { id: "manus", name: "Manus", amount: 40, category: "subscriptions", essential: false },
];

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: string;
  essential: boolean;
}

export interface Debt {
  id: string;
  name: string;
  balance: number;
  originalBalance: number;
  paid: number;
  apr: number;        // annual percentage rate as decimal (e.g. 0.2274 = 22.74%)
  minPayment: number;
  color: string;
  // priority is computed dynamically based on strategy
}

// Raw debt definitions — priority order set by strategy at runtime
export const DEBTS_INITIAL: Debt[] = [
  { id: "d4", name: "Debt 4",  balance: 351,  originalBalance: 351,  paid: 0, apr: 0.0,    minPayment: 25,  color: "#10b981" },
  { id: "d5", name: "Debt 5",  balance: 452,  originalBalance: 452,  paid: 0, apr: 0.0,    minPayment: 25,  color: "#34d399" },
  { id: "d1", name: "Debt 1",  balance: 4013, originalBalance: 4013, paid: 0, apr: 0.1765, minPayment: 60,  color: "#fbbf24" },
  { id: "d2", name: "Debt 2",  balance: 4674, originalBalance: 4674, paid: 0, apr: 0.2274, minPayment: 70,  color: "#f97316" },
  { id: "d3", name: "Debt 3",  balance: 6112, originalBalance: 6112, paid: 0, apr: 0.17,   minPayment: 90,  color: "#f43f5e" },
];

export type DebtStrategy = "snowball" | "avalanche";

/** Sort debts by strategy, keeping 0-APR debts always first (they're free wins) */
export function sortDebtsByStrategy(debts: Debt[], strategy: DebtStrategy): Debt[] {
  const zeroApr = debts.filter((d) => d.apr === 0 && d.balance > 0);
  const withApr = debts.filter((d) => d.apr > 0 && d.balance > 0);
  const paid = debts.filter((d) => d.balance === 0);

  if (strategy === "snowball") {
    zeroApr.sort((a, b) => a.balance - b.balance);
    withApr.sort((a, b) => a.balance - b.balance);
  } else {
    zeroApr.sort((a, b) => a.balance - b.balance);
    withApr.sort((a, b) => b.apr - a.apr);
  }

  return [...zeroApr, ...withApr, ...paid];
}

/** Monthly interest cost for a single debt */
export function monthlyInterest(debt: Debt): number {
  return debt.balance * (debt.apr / 12);
}

/** Total monthly interest bleeding across all debts */
export function totalMonthlyInterest(debts: Debt[]): number {
  return debts.reduce((sum, d) => sum + monthlyInterest(d), 0);
}

/** Simulate full payoff for a given strategy — returns months and total interest */
export function simulatePayoff(
  debts: Debt[],
  strategy: DebtStrategy,
  monthlyBudget: number
): { months: number; totalInterest: number; payoffOrder: { name: string; month: number }[] } {
  // Deep clone
  const ds = debts.map((d) => ({ ...d }));
  const sorted = sortDebtsByStrategy(ds, strategy);

  let month = 0;
  let totalInterest = 0;
  const payoffOrder: { name: string; month: number }[] = [];

  while (sorted.some((d) => d.balance > 0)) {
    month++;
    if (month > 360) break;

    // Accrue interest
    for (const d of sorted) {
      if (d.balance > 0) {
        const interest = d.balance * (d.apr / 12);
        d.balance += interest;
        totalInterest += interest;
      }
    }

    // Pay minimums on non-target debts, dump rest on target
    const active = sorted.filter((d) => d.balance > 0);
    let budget = monthlyBudget;

    const target = active[0];
    const rest = active.slice(1);

    for (const d of rest) {
      const pay = Math.min(d.minPayment, d.balance);
      d.balance -= pay;
      budget -= pay;
      if (budget < 0) budget = 0;
    }

    const payTarget = Math.min(budget, target.balance);
    target.balance -= payTarget;

    if (target.balance <= 0.01) {
      target.balance = 0;
      payoffOrder.push({ name: target.name, month });
    }
  }

  return { months: month, totalInterest: Math.round(totalInterest * 100) / 100, payoffOrder };
}

export const TOTAL_DEBT = DEBTS_INITIAL.reduce((s, d) => s + d.balance, 0); // 15602

export const TOTAL_EXPENSES = EXPENSES_FIXED.reduce((s, e) => s + e.amount, 0);

export const MONTHLY_LEFTOVER = INCOME.monthly - TOTAL_EXPENSES; // ~1567

// Recommended cuts
export const CUTS_RECOMMENDED = [
  { id: "xbox", name: "Xbox Live", amount: 9.99, reason: "Pause for 6 months — save $60" },
  { id: "capcut", name: "CapCut", amount: 20, reason: "Use free version or pause" },
];

export const CUTS_TOTAL = CUTS_RECOMMENDED.reduce((s, c) => s + c.amount, 0);
export const FOOD_REDUCTION = 62;
export const FREED_PER_MONTH = CUTS_TOTAL + FOOD_REDUCTION;

// Recommended monthly allocation
export const ALLOCATION = {
  debtPayment: 500,
  savings: 650,
  buffer: 350,
};

// Savings goal
export const SAVINGS_GOAL = 5000;
export const MONTHS_TO_5K = Math.ceil(SAVINGS_GOAL / ALLOCATION.savings);

// Game Plan Steps
export const GAME_PLAN = [
  {
    step: 1,
    month: "May 2026",
    title: "Wipe Debt 4",
    description: "Pay off $351 in full. One down, four to go. This is your first W.",
    action: "Pay $351 toward Debt 4. Put $650 into savings. Cut Xbox + CapCut.",
    color: "#10b981",
  },
  {
    step: 2,
    month: "June 2026",
    title: "Wipe Debt 5",
    description: "Pay off $452 in full. Two small debts gone. You're building momentum.",
    action: "Pay $452 toward Debt 5. Continue $650/mo savings. Meal prep to cut food to $250.",
    color: "#10b981",
  },
  {
    step: 3,
    month: "Jul–Oct 2026",
    title: "Attack Debt 2 (22.74% APR — Most Expensive)",
    description: "Debt 2 is bleeding $88/mo in interest alone. Hit it hard with $500/mo.",
    action: "Pay $500/mo toward Debt 2. Keep stacking savings. No lifestyle creep.",
    color: "#f97316",
  },
  {
    step: 4,
    month: "Nov 2026",
    title: "$5,000 Savings Milestone",
    description: "At $650/mo savings, you hit $5k by ~December 2026. That's your emergency wall.",
    action: "Celebrate the milestone. Keep going — don't touch the savings fund.",
    color: "#10b981",
  },
  {
    step: 5,
    month: "2027",
    title: "Clear Debt 2 + Start Debt 1",
    description: "Debt 2 cleared by ~month 19. Roll everything into Debt 1 ($4,013 at 17.65%).",
    action: "Snowball method: every cleared debt adds more firepower to the next.",
    color: "#fbbf24",
  },
  {
    step: 6,
    month: "2027–2028",
    title: "Finish Debt 1 + Destroy Debt 3",
    description: "Final two debts. By the time you reach Debt 3 ($6,112), you'll have serious momentum.",
    action: "Stay the course. Debt-free is the goal. Every dollar counts.",
    color: "#f43f5e",
  },
];

// Budget categories for pie chart
export const BUDGET_CATEGORIES = [
  { name: "Transport", amount: 493 + 155 + 150, color: "#f97316" },
  { name: "Housing", amount: 400, color: "#8b5cf6" },
  { name: "Food", amount: 312, color: "#fbbf24" },
  { name: "Health", amount: 20, color: "#10b981" },
  { name: "Subscriptions", amount: 12.99 + 9.99 + 20 + 20 + 40, color: "#f43f5e" },
];

// Monthly savings projection (8 months from May)
export const SAVINGS_PROJECTION = [
  { month: "May", savings: 650, cumulative: 650 },
  { month: "Jun", savings: 650, cumulative: 1300 },
  { month: "Jul", savings: 650, cumulative: 1950 },
  { month: "Aug", savings: 650, cumulative: 2600 },
  { month: "Sep", savings: 650, cumulative: 3250 },
  { month: "Oct", savings: 650, cumulative: 3900 },
  { month: "Nov", savings: 650, cumulative: 4550 },
  { month: "Dec", savings: 650, cumulative: 5200 },
];

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyDecimal(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(apr: number): string {
  return (apr * 100).toFixed(2) + "%";
}
