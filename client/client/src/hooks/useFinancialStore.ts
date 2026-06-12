// Hustle Board — Financial Store Hook
// Persists debt payments, savings, strategy choice, and monthly log to localStorage

import { useState, useEffect, useCallback } from "react";
import { DEBTS_INITIAL, Debt, DebtStrategy, totalMonthlyInterest } from "@/lib/financialData";

export interface MonthlyLog {
  month: string;
  savingsAdded: number;
  debtPaid: number;
  notes: string;
}

export interface FinancialState {
  debts: Debt[];
  totalSaved: number;
  monthlyLogs: MonthlyLog[];
  savingsGoal: number;
  strategy: DebtStrategy;
  lastUpdated: string;
}

const STORAGE_KEY = "personal-economy-v2";

const DEFAULT_STATE: FinancialState = {
  debts: DEBTS_INITIAL,
  totalSaved: 0,
  monthlyLogs: [],
  savingsGoal: 5000,
  strategy: "avalanche",
  lastUpdated: new Date().toISOString(),
};

export function useFinancialStore() {
  const [state, setState] = useState<FinancialState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as FinancialState;
        // Ensure APR fields exist (migration from v1)
        const merged = {
          ...DEFAULT_STATE,
          ...parsed,
          debts: DEBTS_INITIAL.map((init) => {
            const saved = parsed.debts?.find((d) => d.id === init.id);
            return saved ? { ...init, balance: saved.balance, paid: saved.paid } : init;
          }),
        };
        return merged;
      }
    } catch {
      // ignore
    }
    return DEFAULT_STATE;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const makePayment = useCallback((debtId: string, amount: number) => {
    setState((prev) => ({
      ...prev,
      lastUpdated: new Date().toISOString(),
      debts: prev.debts.map((d) => {
        if (d.id !== debtId) return d;
        const newBalance = Math.max(0, d.balance - amount);
        const newPaid = d.paid + (d.balance - newBalance);
        return { ...d, balance: newBalance, paid: newPaid };
      }),
    }));
  }, []);

  const addSavings = useCallback((amount: number) => {
    setState((prev) => ({
      ...prev,
      totalSaved: prev.totalSaved + amount,
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  const addMonthlyLog = useCallback((log: MonthlyLog) => {
    setState((prev) => ({
      ...prev,
      monthlyLogs: [...prev.monthlyLogs, log],
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  const updateSavingsGoal = useCallback((goal: number) => {
    setState((prev) => ({ ...prev, savingsGoal: goal }));
  }, []);

  const setStrategy = useCallback((strategy: DebtStrategy) => {
    setState((prev) => ({ ...prev, strategy }));
  }, []);

  const updateDebt = useCallback(
    (debtId: string, fields: Partial<Pick<Debt, "balance" | "paid" | "apr" | "minPayment" | "name">>) => {
      setState((prev) => ({
        ...prev,
        lastUpdated: new Date().toISOString(),
        debts: prev.debts.map((d) =>
          d.id === debtId ? { ...d, ...fields } : d
        ),
      }));
    },
    []
  );

  const resetAll = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  const totalDebt = state.debts.reduce((s, d) => s + d.balance, 0);
  const totalPaid = state.debts.reduce((s, d) => s + d.paid, 0);
  const savingsProgress = Math.min(100, (state.totalSaved / state.savingsGoal) * 100);
  const debtProgress = Math.min(100, (totalPaid / (totalPaid + totalDebt)) * 100);
  const currentMonthlyInterest = totalMonthlyInterest(state.debts);

  return {
    state,
    makePayment,
    addSavings,
    addMonthlyLog,
    updateSavingsGoal,
    setStrategy,
    updateDebt,
    resetAll,
    totalDebt,
    totalPaid,
    savingsProgress,
    debtProgress,
    currentMonthlyInterest,
  };
}
