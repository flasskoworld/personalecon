// Personal Economy Pro — Stripe Router
// Handles checkout session creation and webhook processing

import Stripe from "stripe";
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { STRIPE_PRODUCTS, type StripePlan } from "./stripeProducts";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-04-22.dahlia",
});

export const stripeRouter = router({
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

      const origin = ctx.req.headers.origin as string || input.returnUrl.split("/pro")[0];

      // Create a one-time price on the fly (no pre-created product needed for MVP)
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        allow_promotion_codes: true,
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
        metadata: {
          plan: planKey,
          customer_email: ctx.user?.email || "",
          customer_name: ctx.user?.name || "",
          user_id: ctx.user?.id?.toString() || "guest",
        },
        ...(ctx.user?.email ? { customer_email: ctx.user.email } : {}),
      });

      return { url: session.url };
    }),
});
