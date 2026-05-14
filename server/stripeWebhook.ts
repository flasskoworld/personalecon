// Personal Economy Pro — Stripe Webhook Handler
// Registered BEFORE express.json() so raw body is available for signature verification
import express, { type Express, type Request, type Response } from "express";
import Stripe from "stripe";
import { getUserByStripeCustomerId, updateUserStripeInfo } from "./db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-04-22.dahlia",
});

export function registerStripeWebhook(app: Express) {
  // CRITICAL: Must use express.raw() before express.json() for signature verification
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      const sig = req.headers["stripe-signature"] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[Webhook] Signature verification failed:", message);
        res.status(400).send(`Webhook Error: ${message}`);
        return;
      }

      // ⚠️ REQUIRED: Test events must return verified:true to pass webhook verification
      if (event.id.startsWith("evt_test_")) {
        console.log("[Webhook] Test event detected, returning verification response");
        res.json({ verified: true });
        return;
      }

      console.log(`[Webhook] Received event: ${event.type} | id: ${event.id}`);

      // Handle relevant events
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const customerId = session.customer as string | null;
          const subscriptionId = session.subscription as string | null;
          const userId = session.metadata?.user_id;

          console.log("[Webhook] checkout.session.completed", {
            sessionId: session.id,
            customerId,
            subscriptionId,
            userId,
            plan: session.metadata?.plan,
          });

          // Persist Pro status to DB if we can identify the user
          if (customerId && subscriptionId) {
            try {
              const dbUser = await getUserByStripeCustomerId(customerId);
              if (dbUser) {
                await updateUserStripeInfo(dbUser.id, {
                  stripeCustomerId: customerId,
                  stripeSubscriptionId: subscriptionId,
                  isProSubscriber: true,
                  proActivatedAt: new Date(),
                });
                console.log(`[Webhook] Pro activated for user ${dbUser.id}`);
              } else {
                console.warn(`[Webhook] No user found for Stripe customer ${customerId}. Pro status not persisted.`);
              }
            } catch (err) {
              console.error("[Webhook] Failed to persist Pro status:", err);
            }
          }
          break;
        }

        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const sub = event.data.object as Stripe.Subscription;
          const customerId = sub.customer as string;
          const isActive = sub.status === "active" || sub.status === "trialing";

          console.log(`[Webhook] ${event.type}`, {
            subscriptionId: sub.id,
            customerId,
            status: sub.status,
            isActive,
          });

          try {
            const dbUser = await getUserByStripeCustomerId(customerId);
            if (dbUser) {
              await updateUserStripeInfo(dbUser.id, {
                stripeSubscriptionId: isActive ? sub.id : null,
                isProSubscriber: isActive,
                ...(isActive && !dbUser.proActivatedAt ? { proActivatedAt: new Date() } : {}),
              });
              console.log(`[Webhook] Subscription status updated for user ${dbUser.id}: isProSubscriber=${isActive}`);
            }
          } catch (err) {
            console.error("[Webhook] Failed to update subscription status:", err);
          }
          break;
        }

        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          const customerId = sub.customer as string;

          console.log("[Webhook] Subscription cancelled", {
            subscriptionId: sub.id,
            customerId,
          });

          try {
            const dbUser = await getUserByStripeCustomerId(customerId);
            if (dbUser) {
              await updateUserStripeInfo(dbUser.id, {
                stripeSubscriptionId: null,
                isProSubscriber: false,
              });
              console.log(`[Webhook] Pro deactivated for user ${dbUser.id}`);
            }
          } catch (err) {
            console.error("[Webhook] Failed to deactivate Pro on subscription deletion:", err);
          }
          break;
        }

        case "invoice.paid": {
          const invoice = event.data.object as Stripe.Invoice;
          const customerId = invoice.customer as string;

          console.log("[Webhook] Invoice paid", {
            invoiceId: invoice.id,
            customerId,
            amount: invoice.amount_paid,
          });

          // Ensure Pro stays active on renewal payments
          try {
            const dbUser = await getUserByStripeCustomerId(customerId);
            if (dbUser && !dbUser.isProSubscriber) {
              await updateUserStripeInfo(dbUser.id, {
                isProSubscriber: true,
                proActivatedAt: dbUser.proActivatedAt ?? new Date(),
              });
            }
          } catch (err) {
            console.error("[Webhook] Failed to reactivate Pro on invoice.paid:", err);
          }
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          console.log("[Webhook] Invoice payment failed", {
            invoiceId: invoice.id,
            customerId: invoice.customer,
          });
          // Don't immediately revoke Pro on payment failure — Stripe will retry
          // and send customer.subscription.updated with status "past_due" if needed
          break;
        }

        default:
          console.log(`[Webhook] Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    }
  );
}
