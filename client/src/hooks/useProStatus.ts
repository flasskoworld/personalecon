// Personal Economy Pro — Pro Status Hook
// Tracks whether the current user has an active Pro subscription.
// Source of truth: localStorage key "pe-pro-status"
// Set to true when Stripe success URL includes ?upgraded=true

import { useState, useEffect, useCallback } from "react";

const PRO_KEY = "pe-pro-status";

export function useProStatus() {
  const [isPro, setIsPro] = useState<boolean>(() => {
    try {
      return localStorage.getItem(PRO_KEY) === "true";
    } catch {
      return false;
    }
  });

  // On mount, check if Stripe redirected back with ?upgraded=true
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "true") {
      localStorage.setItem(PRO_KEY, "true");
      setIsPro(true);
      // Clean the URL so the param doesn't persist on refresh
      const url = new URL(window.location.href);
      url.searchParams.delete("upgraded");
      window.history.replaceState({}, "", url.toString());
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
