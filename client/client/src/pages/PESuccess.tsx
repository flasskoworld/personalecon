// Personal Economy Pro — Payment Success Page
// This is the Stripe success_url target. It:
// 1. Immediately activates Pro in localStorage (before any routing guards run)
// 2. Shows a confirmation screen with a celebration UI
// 3. Redirects to /pro/dashboard after a short delay
// Using a dedicated page avoids race conditions between the dashboard's
// setupComplete guard and the Pro activation from ?upgraded=true.

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useProStatus } from "@/hooks/useProStatus";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { CheckCircle2, Zap, ArrowRight, Star } from "lucide-react";

export default function PESuccess() {
  const [, navigate] = useLocation();
  const { activatePro } = useProStatus();
  const { isAuthenticated } = useAuth();
  const [countdown, setCountdown] = useState(5);
  const utils = trpc.useUtils();

  // Step 1: Activate Pro immediately on mount
  useEffect(() => {
    activatePro();
  }, []);

  // Step 2: Invalidate server-side subscription status cache so dashboard
  // picks up the new Pro status from the DB (populated by webhook)
  useEffect(() => {
    if (isAuthenticated) {
      utils.stripe.getSubscriptionStatus.invalidate();
    }
  }, [isAuthenticated]);

  // Step 3: Countdown then redirect to dashboard
  useEffect(() => {
    if (countdown <= 0) {
      navigate("/pro/dashboard");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
      style={{
        background: "radial-gradient(ellipse at 50% 30%, rgba(16,185,129,0.12) 0%, rgba(8,10,15,1) 60%)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Glow ring */}
      <div className="relative mb-8">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.3))",
            boxShadow: "0 0 60px rgba(16,185,129,0.4), 0 0 120px rgba(16,185,129,0.15)",
            border: "2px solid rgba(16,185,129,0.4)",
          }}
        >
          <CheckCircle2 size={44} className="text-emerald-400" />
        </div>
        {/* Floating stars */}
        <Star
          size={16}
          className="text-amber-400 absolute -top-2 -right-2 animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <Star
          size={12}
          className="text-emerald-400 absolute -bottom-1 -left-3 animate-bounce"
          style={{ animationDelay: "200ms" }}
        />
        <Zap
          size={14}
          className="text-amber-300 absolute top-0 -left-4 animate-bounce"
          style={{ animationDelay: "400ms" }}
        />
      </div>

      {/* Heading */}
      <h1
        className="text-4xl sm:text-5xl font-black text-white mb-3 leading-tight"
        style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "-0.03em" }}
      >
        You're{" "}
        <span
          style={{
            background: "linear-gradient(90deg, #10b981, #34d399)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Pro
        </span>{" "}
        now! 🎉
      </h1>

      <p className="text-slate-400 text-base sm:text-lg mb-2 max-w-sm">
        Your payment was successful. All Pro features are now unlocked.
      </p>

      {/* Pro features unlocked list */}
      <div className="mt-6 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md w-full text-left">
        {[
          "Unlimited debt tracking",
          "Log payments & edit debts",
          "Avalanche strategy + debt-free date",
          "Month-by-month Game Plan",
          "Monthly cash flow breakdown",
          "Multi-currency support",
        ].map((feature) => (
          <div key={feature} className="flex items-center gap-2 text-sm text-slate-300">
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
            {feature}
          </div>
        ))}
      </div>

      {/* Auto-redirect button */}
      <button
        onClick={() => navigate("/pro/dashboard")}
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #10b981, #059669)",
          boxShadow: "0 4px 20px rgba(16,185,129,0.35)",
        }}
      >
        Go to My Dashboard
        <ArrowRight size={16} />
      </button>

      <p className="mt-4 text-xs text-slate-600">
        Redirecting automatically in{" "}
        <span className="text-slate-400 font-mono">{countdown}s</span>…
      </p>

      {/* Powered by footer */}
      <p className="mt-12 text-xs text-slate-700">
        Personal Economy by{" "}
        <a
          href="https://streeteconomics.co"
          className="hover:text-slate-500 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          StreetEconomics
        </a>
      </p>
    </div>
  );
}
