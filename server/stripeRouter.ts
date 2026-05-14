// Personal Economy Pro — Stripe Router
// Handles checkout session creation, subscription management, and Stripe Customer Portal

import Stripe from "stripe";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { STRIPE_PRODUCTS, type StripePlan } from "./stripeProducts";
import { getUserById, updateUserStripeInfo } from "./db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-04-22.dahlia",
});

export const stripeRouter = router({
  /**
   * Create a Stripe Checkout Session.
   * If the user is authenticated, we create/retrieve their Stripe customer
   * and attach it to the session so the webhook can link the subscription back.
   */
  createCheckoutSession: publicProcedure
    .input(
      z.object({
        plan: z.enum(["monthly", "yearly"]),
        returnUrl: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const planKey: StripePlan = input.plan === "monthly" ? "pro_monthly" : "pro_yearly";
      const product = STRIPE_PRODUCTS[planKey];
      const origin = (ctx.req.headers.origin as string) || input.returnUrl.split("/pro")[0];

      // For authenticated users: create or retrieve their Stripe customer
      let stripeCustomerId: string | undefined;
      if (ctx.user?.id) {
        const dbUser = await getUserById(ctx.user.id);
        if (dbUser?.stripeCustomerId) {
          stripeCustomerId = dbUser.stripeCustomerId;
        } else {
          // Create a new Stripe customer and persist the ID
          const customer = await stripe.customers.create({
            email: ctx.user.email || undefined,
            name: ctx.user.name || undefined,
            metadata: {
              user_id: ctx.user.id.toString(),
              open_id: ctx.user.openId || "",
            },
          });
          stripeCustomerId = customer.id;
          await updateUserStripeInfo(ctx.user.id, { stripeCustomerId: customer.id });
        }
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        allow_promotion_codes: true,
        ...(stripeCustomerId
          ? { customer: stripeCustomerId }
          : ctx.user?.email
          ? { customer_email: ctx.user.email }
          : {}),
        line_items: [
          {
            price_data: {
              currency: product.currency,
              product_data: {
                name: product.name,
                description: product.description,
              },
              unit_amount: product.amount,
              recurring: {
                interval: product.interval,
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/pro/dashboard?upgraded=true`,
        cancel_url: `${origin}/pro/pricing?cancelled=true`,
        client_reference_id: ctx.user?.id?.toString() || "guest",
        metadata: {
          plan: planKey,
          user_id: ctx.user?.id?.toString() || "guest",
          customer_email: ctx.user?.email || "",
          customer_name: ctx.user?.name || "",
        },
      });

      return { url: session.url };
    }),

  /**
   * Get the current user's Pro subscription status from the database.
   * Returns isProSubscriber, subscriptionId, and customerId.
   */
  getSubscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
    const dbUser = await getUserById(ctx.user.id);
    return {
      isProSubscriber: dbUser?.isProSubscriber ?? false,
      stripeSubscriptionId: dbUser?.stripeSubscriptionId ?? null,
      stripeCustomerId: dbUser?.stripeCustomerId ?? null,
      proActivatedAt: dbUser?.proActivatedAt ?? null,
    };
  }),

  /**
   * Cancel the user's active Stripe subscription immediately.
   * Sets cancel_at_period_end = false for immediate cancellation.
   */
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const dbUser = await getUserById(ctx.user.id);
    if (!dbUser?.stripeSubscriptionId) {
      throw new Error("No active subscription found for this account.");
    }

    // Cancel immediately
    await stripe.subscriptions.cancel(dbUser.stripeSubscriptionId);

    // Update DB: clear subscription ID and mark as non-Pro
    await updateUserStripeInfo(ctx.user.id, {
      stripeSubscriptionId: null,
      isProSubscriber: false,
    });

    return { cancelled: true };
  }),

  /**
   * Create a Stripe Customer Portal session so the user can manage
   * their billing, update payment methods, or cancel from Stripe directly.
   */
  getPortalUrl: protectedProcedure
    .input(z.object({ returnUrl: z.string().url() }))
    .mutation(async ({ input, ctx }) => {
      const dbUser = await getUserById(ctx.user.id);
      if (!dbUser?.stripeCustomerId) {
        throw new Error("No Stripe customer found for this account. Please make a purchase first.");
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: dbUser.stripeCustomerId,
        return_url: input.returnUrl,
      });

      return { url: session.url };
    }),
});
