import { describe, it, expect } from "vitest";
import { STRIPE_PRODUCTS } from "./stripeProducts";

describe("stripeProducts config", () => {
  it("has valid monthly plan configuration", () => {
    const plan = STRIPE_PRODUCTS.pro_monthly;
    expect(plan.amount).toBe(999);
    expect(plan.currency).toBe("usd");
    expect(plan.interval).toBe("month");
    expect(plan.name).toContain("Monthly");
  });

  it("has valid yearly plan configuration", () => {
    const plan = STRIPE_PRODUCTS.pro_yearly;
    expect(plan.amount).toBe(7999);
    expect(plan.currency).toBe("usd");
    expect(plan.interval).toBe("year");
    expect(plan.name).toContain("Yearly");
  });

  it("yearly plan saves at least 30% vs monthly", () => {
    const monthlyAnnual = STRIPE_PRODUCTS.pro_monthly.amount * 12;
    const yearlyTotal = STRIPE_PRODUCTS.pro_yearly.amount;
    const savingsPct = Math.round(100 - (yearlyTotal / monthlyAnnual) * 100);
    expect(savingsPct).toBeGreaterThanOrEqual(30);
  });

  it("all plan amounts are positive integers", () => {
    for (const plan of Object.values(STRIPE_PRODUCTS)) {
      expect(Number.isInteger(plan.amount)).toBe(true);
      expect(plan.amount).toBeGreaterThan(0);
    }
  });
});
