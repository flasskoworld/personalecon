// Personal Economy Pro — Stripe Webhook Handler
// Registered BEFORE express.json() so raw body is available for signature verification
import express, { type Express, type Request, type Response } from "express";
import Stripe from "stripe";

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
          console.log("[Webhook] checkout.session.completed", {
            sessionId: session.id,
            customerId: session.customer,
            userId: session.metadata?.user_id,
            plan: session.metadata?.plan,
            email: session.metadata?.customer_email,
          });
          // TODO: Persist subscription status to DB when user accounts are added
          break;
        }

        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const sub = event.data.object as Stripe.Subscription;
          console.log(`[Webhook] ${event.type}`, {
            subscriptionId: sub.id,
            customerId: sub.customer,
            status: sub.status,
          });
          break;
        }

        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          console.log("[Webhook] Subscription cancelled", {
            subscriptionId: sub.id,
            customerId: sub.customer,
          });
          break;
        }

        case "invoice.paid": {
          const invoice = event.data.object as Stripe.Invoice;
          console.log("[Webhook] Invoice paid", {
            invoiceId: invoice.id,
            customerId: invoice.customer,
            amount: invoice.amount_paid,
          });
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          console.log("[Webhook] Invoice payment failed", {
            invoiceId: invoice.id,
            customerId: invoice.customer,
          });
          break;
        }

        default:
          console.log(`[Webhook] Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    }
  );
}
