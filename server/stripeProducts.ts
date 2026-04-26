// Personal Economy Pro — Stripe Product Definitions

export const STRIPE_PRODUCTS = {
  pro_monthly: {
    name: "Personal Economy Pro — Monthly",
    description: "Full access to Personal Economy Pro, billed monthly.",
    amount: 999, // $9.99 in cents
    currency: "usd",
    interval: "month" as const,
  },
  pro_yearly: {
    name: "Personal Economy Pro — Yearly",
    description: "Full access to Personal Economy Pro, billed yearly. Save 33%.",
    amount: 7999, // $79.99 in cents
    currency: "usd",
    interval: "year" as const,
  },
};

export type StripePlan = keyof typeof STRIPE_PRODUCTS;
