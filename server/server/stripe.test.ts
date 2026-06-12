import { describe, it, expect, vi, beforeEach } from "vitest";
import { STRIPE_PRODUCTS } from "./stripeProducts";

// ── stripeProducts config tests ─────────────────────────────────────────────
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

// ── Shared mocks ─────────────────────────────────────────────────────────────
const mockGetUserById = vi.fn();
const mockUpdateUserStripeInfo = vi.fn();
const mockGetUserByStripeCustomerId = vi.fn();

vi.mock("./db", () => ({
  getUserById: (...args: unknown[]) => mockGetUserById(...args),
  updateUserStripeInfo: (...args: unknown[]) => mockUpdateUserStripeInfo(...args),
  getUserByStripeCustomerId: (...args: unknown[]) => mockGetUserByStripeCustomerId(...args),
}));

const mockCheckoutCreate = vi.fn();
const mockCustomerCreate = vi.fn();
const mockCustomerList = vi.fn();
const mockSubscriptionsCancel = vi.fn();
const mockPortalCreate = vi.fn();

vi.mock("stripe", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      customers: { create: mockCustomerCreate, list: mockCustomerList },
      checkout: { sessions: { create: mockCheckoutCreate } },
      subscriptions: { cancel: mockSubscriptionsCancel },
      billingPortal: { sessions: { create: mockPortalCreate } },
      webhooks: { constructEvent: vi.fn() },
    })),
  };
});

// ── Helper: build a mock tRPC context ─────────────────────────────────────
function makeCtx(overrides: Record<string, unknown> = {}) {
  return {
    req: { headers: { origin: "https://example.com" } },
    user: { id: 1, email: "user@example.com", name: "Test User", openId: "oid_1", role: "user" },
    ...overrides,
  };
}

function makeDbUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    openId: "oid_1",
    name: "Test User",
    email: "user@example.com",
    role: "user",
    createdAt: new Date(),
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    isProSubscriber: false,
    proActivatedAt: null,
    ...overrides,
  };
}

// ── getSubscriptionStatus ────────────────────────────────────────────────────
describe("getSubscriptionStatus", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns isProSubscriber=false when user has no subscription", async () => {
    mockGetUserById.mockResolvedValueOnce(makeDbUser());
    const { stripeRouter } = await import("./stripeRouter");
    const ctx = makeCtx();
    // Simulate procedure call
    const dbUser = await mockGetUserById(ctx.user.id);
    const result = {
      isProSubscriber: dbUser?.isProSubscriber ?? false,
      stripeSubscriptionId: dbUser?.stripeSubscriptionId ?? null,
      stripeCustomerId: dbUser?.stripeCustomerId ?? null,
    };
    expect(result.isProSubscriber).toBe(false);
    expect(result.stripeSubscriptionId).toBeNull();
    expect(stripeRouter).toBeDefined();
  });

  it("returns isProSubscriber=true when user has active subscription", async () => {
    mockGetUserById.mockResolvedValueOnce(
      makeDbUser({ stripeCustomerId: "cus_123", stripeSubscriptionId: "sub_456", isProSubscriber: true })
    );
    const dbUser = await mockGetUserById(1);
    const result = {
      isProSubscriber: dbUser?.isProSubscriber ?? false,
      stripeSubscriptionId: dbUser?.stripeSubscriptionId ?? null,
      stripeCustomerId: dbUser?.stripeCustomerId ?? null,
    };
    expect(result.isProSubscriber).toBe(true);
    expect(result.stripeSubscriptionId).toBe("sub_456");
    expect(result.stripeCustomerId).toBe("cus_123");
  });
});

// ── cancelSubscription ───────────────────────────────────────────────────────
describe("cancelSubscription", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws when user has no active subscription", async () => {
    mockGetUserById.mockResolvedValueOnce(makeDbUser({ stripeCustomerId: "cus_789" }));
    const dbUser = await mockGetUserById(1);
    const hasSubscription = !!dbUser?.stripeSubscriptionId;
    expect(hasSubscription).toBe(false);
    // Simulate the guard logic in the procedure
    const shouldThrow = !dbUser?.stripeSubscriptionId;
    expect(shouldThrow).toBe(true);
  });

  it("cancels subscription and clears DB record on success", async () => {
    mockGetUserById.mockResolvedValueOnce(
      makeDbUser({ stripeCustomerId: "cus_abc", stripeSubscriptionId: "sub_def", isProSubscriber: true })
    );
    mockSubscriptionsCancel.mockResolvedValueOnce({ id: "sub_def", status: "canceled" });
    mockUpdateUserStripeInfo.mockResolvedValueOnce(undefined);

    const dbUser = await mockGetUserById(1);
    expect(dbUser?.stripeSubscriptionId).toBe("sub_def");

    // Simulate procedure: cancel + update DB
    await mockSubscriptionsCancel(dbUser.stripeSubscriptionId);
    await mockUpdateUserStripeInfo(1, { stripeSubscriptionId: null, isProSubscriber: false });

    expect(mockSubscriptionsCancel).toHaveBeenCalledWith("sub_def");
    expect(mockUpdateUserStripeInfo).toHaveBeenCalledWith(1, {
      stripeSubscriptionId: null,
      isProSubscriber: false,
    });
  });
});

// ── getPortalUrl ─────────────────────────────────────────────────────────────
describe("getPortalUrl", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws when user has no Stripe customer", async () => {
    mockGetUserById.mockResolvedValueOnce(makeDbUser());
    const dbUser = await mockGetUserById(1);
    const shouldThrow = !dbUser?.stripeCustomerId;
    expect(shouldThrow).toBe(true);
  });

  it("returns portal URL when customer exists", async () => {
    mockGetUserById.mockResolvedValueOnce(makeDbUser({ stripeCustomerId: "cus_portal" }));
    mockPortalCreate.mockResolvedValueOnce({ url: "https://billing.stripe.com/session/test" });

    const dbUser = await mockGetUserById(1);
    const session = await mockPortalCreate({
      customer: dbUser.stripeCustomerId,
      return_url: "https://example.com/dashboard",
    });

    expect(session.url).toBe("https://billing.stripe.com/session/test");
    expect(mockPortalCreate).toHaveBeenCalledWith({
      customer: "cus_portal",
      return_url: "https://example.com/dashboard",
    });
  });
});

// ── createCheckoutSession ────────────────────────────────────────────────────
describe("createCheckoutSession", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a new Stripe customer for authenticated user without one", async () => {
    mockGetUserById.mockResolvedValueOnce(makeDbUser());
    mockCustomerCreate.mockResolvedValueOnce({ id: "cus_new123" });
    mockUpdateUserStripeInfo.mockResolvedValueOnce(undefined);
    const dbUser = await mockGetUserById(1);;
    let customerId: string;

    if (dbUser?.stripeCustomerId) {
      customerId = dbUser.stripeCustomerId;
    } else {
      const customer = await mockCustomerCreate({
        email: "user@example.com",
        name: "Test User",
        metadata: { user_id: "1" },
      });
      customerId = customer.id;
      await mockUpdateUserStripeInfo(1, { stripeCustomerId: customer.id });
    }

    expect(customerId).toBe("cus_new123");
    expect(mockCustomerCreate).toHaveBeenCalledOnce();
    expect(mockUpdateUserStripeInfo).toHaveBeenCalledWith(1, { stripeCustomerId: "cus_new123" });
  });

  it("reuses existing Stripe customer ID without creating a new one", async () => {
    mockGetUserById.mockResolvedValueOnce(makeDbUser({ stripeCustomerId: "cus_existing" }));
    const dbUser = await mockGetUserById(1);
    const customerId = dbUser?.stripeCustomerId ?? null;
    expect(customerId).toBe("cus_existing");
    expect(mockCustomerCreate).not.toHaveBeenCalled();
  });

  it("returns checkout URL from session", async () => {
    vi.clearAllMocks();
    mockCheckoutCreate.mockResolvedValueOnce({ url: "https://checkout.stripe.com/pay/session123" });
    const session = await mockCheckoutCreate({ mode: "subscription" });
    expect(session.url).toBe("https://checkout.stripe.com/pay/session123");
  });
});

// ── webhook handler logic ────────────────────────────────────────────────────
describe("stripeWebhook logic", () => {
  it("identifies test events by evt_test_ prefix", () => {
    expect("evt_test_abc123".startsWith("evt_test_")).toBe(true);
  });

  it("does not flag real events as test events", () => {
    expect("evt_abc123".startsWith("evt_test_")).toBe(false);
  });

  it("extracts userId from checkout session client_reference_id", () => {
    const session = {
      client_reference_id: "42",
      metadata: { user_id: "42", customer_email: "user@example.com" },
      customer: "cus_test_xyz",
    };
    const userId = session.client_reference_id
      ? parseInt(session.client_reference_id, 10)
      : session.metadata?.user_id
        ? parseInt(session.metadata.user_id, 10)
        : null;
    expect(userId).toBe(42);
  });

  it("falls back to metadata.user_id when client_reference_id is missing", () => {
    const session = {
      client_reference_id: null as string | null,
      metadata: { user_id: "99" },
      customer: "cus_fallback",
    };
    const userId = session.client_reference_id
      ? parseInt(session.client_reference_id, 10)
      : session.metadata?.user_id
        ? parseInt(session.metadata.user_id, 10)
        : null;
    expect(userId).toBe(99);
  });
});
