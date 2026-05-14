// Personal Economy Pro — App Store Hook
// Manages all state, persistence, and actions

import { useState, useEffect, useCallback } from "react";
import {
  AppState,
  AdditionalIncome,
  Debt,
  Expense,
  Investment,
  UserProfile,
  DEFAULT_STATE,
  DEMO_STATE,
  loadState,
  saveState,
  clearState,
  monthlyIncome,
  additionalMonthlyIncome,
  totalMonthlyIncome,
  totalExpenses,
  totalDebt,
  totalPaid,
  totalMonthlyInterest,
  monthlyLeftover,
  totalInvestmentValue,
  totalInvestmentGain,
  totalMonthlyInvestContrib,
  netWorth,
  DebtStrategy,
} from "@/lib/peStore";

export function useStore() {
  const [state, setState] = useState<AppState>(() => {
    const loaded = loadState();
    // Migrate existing saved states that don't have additionalIncome yet
    if (!loaded.additionalIncome) {
      return { ...loaded, additionalIncome: [] };
    }
    return loaded;
  });

  // Persist on every change
  useEffect(() => {
    saveState(state);
  }, [state]);

  const update = useCallback((updater: (prev: AppState) => AppState) => {
    setState((prev) => updater(prev));
  }, []);

  // ── Setup ──────────────────────────────────────────────────────────────────

  const completeSetup = useCallback((
    profile: UserProfile,
    expenses: Expense[],
    debts: Debt[],
    investments: Investment[],
    totalSaved: number
  ) => {
    const newState: AppState = {
      profile,
      expenses,
      debts,
      investments,
      additionalIncome: [],
      totalSaved,
      debtPayments: {},
      investmentLogs: {},
      strategy: "avalanche",
      setupComplete: true,
      isDemo: false,
      lastUpdated: new Date().toISOString(),
    };
    // Save synchronously FIRST so the dashboard reads fresh data
    // even if navigation fires before the useEffect persistence runs
    saveState(newState);
    setState(newState);
  }, []);

  const loadDemo = useCallback(() => {
    const demoState = { ...DEMO_STATE, lastUpdated: new Date().toISOString() };
    // Write directly to localStorage FIRST so the dashboard reads fresh demo data
    // even if navigation happens before the async useEffect fires
    saveState(demoState);
    setState(demoState);
  }, []);

  const resetAll = useCallback(() => {
    clearState();
    setState(DEFAULT_STATE);
  }, []);

  /**
   * Replace the entire state with a cloud-loaded version.
   * Used by useCloudSync when the cloud has a newer plan.
   */
  const replaceState = useCallback((newState: AppState) => {
    saveState(newState);
    setState(newState);
  }, []);

  // ── Income Actions ─────────────────────────────────────────────────────────

  const updateSavingsGoal = useCallback((newGoal: number) => {
    update((prev) => ({
      ...prev,
      profile: prev.profile ? { ...prev.profile, savingsGoal: newGoal } : prev.profile,
    }));
  }, [update]);

  const updatePrimaryIncome = useCallback((income: number, payFrequency: UserProfile["payFrequency"]) => {
    update((prev) => ({
      ...prev,
      profile: prev.profile ? { ...prev.profile, income, payFrequency } : prev.profile,
    }));
  }, [update]);

  const addAdditionalIncome = useCallback((source: AdditionalIncome) => {
    update((prev) => ({
      ...prev,
      additionalIncome: [...(prev.additionalIncome || []), source],
    }));
  }, [update]);

  const removeAdditionalIncome = useCallback((id: string) => {
    update((prev) => ({
      ...prev,
      additionalIncome: (prev.additionalIncome || []).filter((s) => s.id !== id),
    }));
  }, [update]);

  const updateAdditionalIncome = useCallback((id: string, fields: Partial<AdditionalIncome>) => {
    update((prev) => ({
      ...prev,
      additionalIncome: (prev.additionalIncome || []).map((s) =>
        s.id === id ? { ...s, ...fields } : s
      ),
    }));
  }, [update]);

  // ── Debt Actions ───────────────────────────────────────────────────────────

  const makePayment = useCallback((debtId: string, amount: number) => {
    update((prev) => ({
      ...prev,
      debts: prev.debts.map((d) =>
        d.id === debtId
          ? { ...d, balance: Math.max(0, d.balance - amount), paid: d.paid + amount }
          : d
      ),
      debtPayments: {
        ...prev.debtPayments,
        [debtId]: (prev.debtPayments[debtId] || 0) + amount,
      },
    }));
  }, [update]);

  const updateDebt = useCallback((debtId: string, fields: Partial<Debt>) => {
    update((prev) => ({
      ...prev,
      debts: prev.debts.map((d) => d.id === debtId ? { ...d, ...fields } : d),
    }));
  }, [update]);

  const addDebt = useCallback((debt: Debt) => {
    update((prev) => ({ ...prev, debts: [...prev.debts, debt] }));
  }, [update]);

  const removeDebt = useCallback((debtId: string) => {
    update((prev) => ({
      ...prev,
      debts: prev.debts.filter((d) => d.id !== debtId),
      debtPayments: Object.fromEntries(Object.entries(prev.debtPayments).filter(([k]) => k !== debtId)),
    }));
  }, [update]);

  const addExpense = useCallback((expense: Expense) => {
    update((prev) => ({ ...prev, expenses: [...prev.expenses, expense] }));
  }, [update]);

  const removeExpense = useCallback((expenseId: string) => {
    update((prev) => ({ ...prev, expenses: prev.expenses.filter((e) => e.id !== expenseId) }));
  }, [update]);

  const updateExpense = useCallback((expenseId: string, fields: Partial<Expense>) => {
    update((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) => e.id === expenseId ? { ...e, ...fields } : e),
    }));
  }, [update]);

  // ── Savings Actions ────────────────────────────────────────────────────────

  const addSavings = useCallback((amount: number) => {
    update((prev) => ({ ...prev, totalSaved: prev.totalSaved + amount }));
  }, [update]);

  // ── Investment Actions ─────────────────────────────────────────────────────

  const updateInvestment = useCallback((investId: string, fields: Partial<Investment>) => {
    update((prev) => ({
      ...prev,
      investments: prev.investments.map((i) => i.id === investId ? { ...i, ...fields } : i),
    }));
  }, [update]);

  const addInvestment = useCallback((investment: Investment) => {
    update((prev) => ({ ...prev, investments: [...prev.investments, investment] }));
  }, [update]);

  const removeInvestment = useCallback((investId: string) => {
    update((prev) => ({
      ...prev,
      investments: prev.investments.filter((i) => i.id !== investId),
    }));
  }, [update]);

  // ── Strategy ───────────────────────────────────────────────────────────────

  const setStrategy = useCallback((strategy: DebtStrategy) => {
    update((prev) => ({ ...prev, strategy }));
  }, [update]);

  // ── Computed Values ────────────────────────────────────────────────────────

  const computed = {
    monthlyIncome: monthlyIncome(state),
    additionalMonthlyIncome: additionalMonthlyIncome(state),
    totalMonthlyIncome: totalMonthlyIncome(state),
    totalExpenses: totalExpenses(state),
    totalDebt: totalDebt(state),
    totalPaid: totalPaid(state),
    totalMonthlyInterest: totalMonthlyInterest(state),
    monthlyLeftover: monthlyLeftover(state),
    totalInvestmentValue: totalInvestmentValue(state),
    totalInvestmentGain: totalInvestmentGain(state),
    totalMonthlyInvestContrib: totalMonthlyInvestContrib(state),
    netWorth: netWorth(state),
    debtProgress: totalDebt(state) > 0
      ? Math.min(100, (totalPaid(state) / (totalDebt(state) + totalPaid(state))) * 100)
      : 100,
  };

  return {
    state,
    computed,
    completeSetup,
    loadDemo,
    resetAll,
    updatePrimaryIncome,
    addAdditionalIncome,
    removeAdditionalIncome,
    updateAdditionalIncome,
    makePayment,
    updateDebt,
    addDebt,
    removeDebt,
    addExpense,
    removeExpense,
    updateExpense,
    addSavings,
    updateInvestment,
    addInvestment,
    removeInvestment,
    setStrategy,
    replaceState,
    updateSavingsGoal,
  };
}
