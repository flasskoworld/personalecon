// Hustle Board — Financial Store Hook
// Persists debt payments, savings, and monthly log to localStorage

import { useState, useEffect, useCallback } from "react";
import { DEBTS_INITIAL, Debt, ALLOCATION } from "@/lib/financialData";

export interface MonthlyLog {
  month: string; // "May 2026"
  savingsAdded: number;
  debtPaid: number;
  notes: string;
}

export interface FinancialState {
  debts: Debt[];
  totalSaved: number;
  monthlyLogs: MonthlyLog[];
  savingsGoal: number;
  lastUpdated: string;
}

const STORAGE_KEY = "hustle-board-v1";

const DEFAULT_STATE: FinancialState = {
  debts: DEBTS_INITIAL,
  totalSaved: 0,
  monthlyLogs: [],
  savingsGoal: 5000,
  lastUpdated: new Date().toISOString(),
};

export function useFinancialStore() {
  const [state, setState] = useState<FinancialState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as FinancialState;
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

  const resetAll = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  const totalDebt = state.debts.reduce((s, d) => s + d.balance, 0);
  const totalPaid = state.debts.reduce((s, d) => s + d.paid, 0);
  const savingsProgress = Math.min(100, (state.totalSaved / state.savingsGoal) * 100);
  const debtProgress = Math.min(100, (totalPaid / (totalPaid + totalDebt)) * 100);

  return {
    state,
    makePayment,
    addSavings,
    addMonthlyLog,
    updateSavingsGoal,
    resetAll,
    totalDebt,
    totalPaid,
    savingsProgress,
    debtProgress,
  };
}
