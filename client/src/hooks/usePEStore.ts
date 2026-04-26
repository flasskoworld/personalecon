// Personal Economy Pro — App Store Hook
// Manages all state, persistence, and actions

import { useState, useEffect, useCallback } from "react";
import {
  AppState,
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
  const [state, setState] = useState<AppState>(() => loadState());

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
    setState({
      profile,
      expenses,
      debts,
      investments,
      totalSaved,
      debtPayments: {},
      investmentLogs: {},
      strategy: "avalanche",
      setupComplete: true,
      isDemo: false,
      lastUpdated: new Date().toISOString(),
    });
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
    makePayment,
    updateDebt,
    addSavings,
    updateInvestment,
    addInvestment,
    removeInvestment,
    setStrategy,
  };
}
