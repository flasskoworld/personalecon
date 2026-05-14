// Personal Economy Pro — Pro Status Hook
// Tracks whether the current user has an active Pro subscription.
// Source of truth: localStorage key "pe-pro-status"
// Set to true when Stripe success URL includes ?upgraded=true

import { useState, useEffect, useCallback } from "react";

const PRO_KEY = "pe-pro-status";

/**
 * Eagerly check for ?upgraded=true at module-load time — before any React
 * rendering or routing guards run. This ensures Pro status is persisted in
 * localStorage even if the dashboard's no-plan guard redirects the user away
 * before a useEffect could fire.
 */
function checkAndPersistUpgradeParam(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "true") {
      localStorage.setItem(PRO_KEY, "true");
      // Clean the URL immediately so the param doesn't persist on refresh
      const url = new URL(window.location.href);
      url.searchParams.delete("upgraded");
      window.history.replaceState({}, "", url.toString());
      return true;
    }
  } catch {
    // ignore in SSR or restricted environments
  }
  return false;
}

// Run eagerly at import time so Pro status is set before the first render
checkAndPersistUpgradeParam();

export function useProStatus() {
  const [isPro, setIsPro] = useState<boolean>(() => {
    try {
      return localStorage.getItem(PRO_KEY) === "true";
    } catch {
      return false;
    }
  });

  // Secondary check in useEffect as a safety net (handles edge cases where
  // the module-level call may not have run, e.g. lazy-loaded chunks)
  useEffect(() => {
    if (checkAndPersistUpgradeParam()) {
      setIsPro(true);
    }
  }, []);

  const activatePro = useCallback(() => {
    localStorage.setItem(PRO_KEY, "true");
    setIsPro(true);
  }, []);

  const deactivatePro = useCallback(() => {
    localStorage.removeItem(PRO_KEY);
    setIsPro(false);
  }, []);

  return { isPro, activatePro, deactivatePro };
}
