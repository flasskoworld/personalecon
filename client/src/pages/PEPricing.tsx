// Personal Economy Pro — Pricing Page
// Free tier + Pro tier with Stripe checkout

import { useState } from "react";
import { PoweredByFooter, PoweredByBadge } from "@/components/PoweredByFooter";
import { useLocation } from "wouter";
import { CheckCircle2, ArrowRight, Zap, Shield, TrendingUp, BarChart3, Target, Star, Lock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const FREE_FEATURES = [
  "Full debt tracker (up to 3 debts)",
  "Budget breakdown & pie chart",
  "Savings goal tracker",
  "Snowball vs. Avalanche toggle",
  "Live payday countdown",
  "Monthly game plan",
  "Data stored locally on your device",
];

const PRO_FEATURES = [
  "Everything in Free",
  "Unlimited debts",
  "Investment portfolio tracker",
  "PDF export of your full plan",
  "Advanced payoff simulations",
  "Multi-currency support",
  "Priority support",
  "Early access to new features",
];

export default function PEPricing() {
  const [, navigate] = useLocation();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);

  const monthlyPrice = 9.99;
  const yearlyPrice = 79.99;
  const yearlyMonthly = (yearlyPrice / 12).toFixed(2);
  const yearlySavings = Math.round(100 - (yearlyPrice / (monthlyPrice * 12)) * 100);

  const checkoutMutation = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to start checkout. Please try again.");
      setLoading(false);
    },
  });

  const handleProCheckout = () => {
    setLoading(true);
    checkoutMutation.mutate({
      plan: billing,
      returnUrl: window.location.origin + "/pro/dashboard",
    });
  };

  return (
    <div className="min-h-screen bg-[#080a0f] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/6" style={{ background: "rgba(8,10,15,0.92)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/pro")}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-black"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff" }}
            >
              £
            </div>
            <span className="text-base font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
              Personal Economy
            </span>
          </button>
          <button
            onClick={() => navigate("/pro/onboarding")}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg text-black transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
          >
            Start Free <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-16 sm:pb-24">

        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest text-emerald-400 uppercase bg-emerald-400/10 border border-emerald-400/20 px-3 py-1.5 rounded-full mb-6">
            <Zap size={11} />
            Simple, transparent pricing
          </div>
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-black mb-4"
            style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "-0.03em" }}
          >
            Start free. Upgrade when{" "}
            <span style={{ background: "linear-gradient(135deg, #10b981, #d4af37)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              you're ready.
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            The free plan gives you everything you need to get started. Pro unlocks advanced features for serious financial growth.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-1 rounded-xl border border-white/10 p-1 w-full sm:w-auto" style={{ background: "rgba(255,255,255,0.04)" }}>
            <button
              onClick={() => setBilling("monthly")}
              className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                billing === "monthly" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                billing === "yearly" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Yearly
              <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: "#10b98122", color: "#10b981" }}>
                Save {yearlySavings}%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">

          {/* Free Tier */}
          <div className="rounded-2xl border border-white/10 p-5 sm:p-8" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#64748b22", color: "#64748b" }}>
                  <BarChart3 size={16} />
                </div>
                <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Free</span>
              </div>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-4xl sm:text-5xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>$0</span>
                <span className="text-slate-500 mb-2">/forever</span>
              </div>
              <p className="text-sm text-slate-400">Everything you need to start taking control of your finances.</p>
            </div>

            <button
              onClick={() => navigate("/pro/onboarding")}
              className="w-full py-3 rounded-xl text-sm font-bold border border-white/15 text-white hover:border-white/30 hover:bg-white/5 transition-all mb-8"
            >
              Get Started Free
            </button>

            <div className="space-y-3">
              {FREE_FEATURES.map((f) => (
                <div key={f} className="flex items-start gap-2.5">
                  <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-slate-300">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pro Tier */}
          <div
            className="rounded-2xl border p-5 sm:p-8 relative overflow-hidden"
            style={{
              borderColor: "#10b98144",
              background: "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(8,10,15,0.95) 100%)",
              boxShadow: "0 0 0 1px rgba(16,185,129,0.15), 0 24px 64px rgba(16,185,129,0.08)",
            }}
          >
            {/* Popular badge */}
            <div className="absolute top-5 right-5 flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff" }}>
              <Star size={10} fill="currentColor" />
              Most Popular
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#10b98122", color: "#10b981" }}>
                  <Zap size={16} />
                </div>
                <span className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Pro</span>
              </div>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-4xl sm:text-5xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                  ${billing === "monthly" ? monthlyPrice : yearlyMonthly}
                </span>
                <span className="text-slate-500 mb-2">/month</span>
              </div>
              {billing === "yearly" && (
                <p className="text-xs text-emerald-400 mb-1">Billed ${yearlyPrice}/year — save ${(monthlyPrice * 12 - yearlyPrice).toFixed(2)}</p>
              )}
              <p className="text-sm text-slate-400">Unlock the full power of Personal Economy for serious financial growth.</p>
            </div>

            <button
              onClick={handleProCheckout}
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold text-black transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed mb-8 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 8px 24px rgba(16,185,129,0.25)" }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Redirecting to checkout...
                </>
              ) : (
                <>
                  Upgrade to Pro <ArrowRight size={14} />
                </>
              )}
            </button>

            <div className="space-y-3">
              {PRO_FEATURES.map((f) => (
                <div key={f} className="flex items-start gap-2.5">
                  <CheckCircle2 size={15} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span className="text-sm text-slate-200">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mt-8 sm:mt-14">
          {[
            { icon: <Shield size={16} />, text: "Secure checkout via Stripe" },
            { icon: <Lock size={16} />, text: "Cancel anytime" },
            { icon: <TrendingUp size={16} />, text: "30-day money-back guarantee" },
            { icon: <Target size={16} />, text: "No hidden fees" },
          ].map((b) => (
            <div key={b.text} className="flex items-center gap-2 text-sm text-slate-500">
              <span className="text-emerald-500">{b.icon}</span>
              {b.text}
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="text-2xl font-black text-center mb-8" style={{ fontFamily: "'Syne', sans-serif" }}>
            Common Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Is my financial data safe?",
                a: "Yes. All your data is stored locally on your device — we never send your personal financial information to any server. Your numbers stay yours.",
              },
              {
                q: "Can I cancel my Pro subscription?",
                a: "Absolutely. Cancel anytime from your account settings. You'll keep Pro access until the end of your billing period.",
              },
              {
                q: "What happens to my data if I cancel?",
                a: "Your data stays in your browser. You'll just lose access to Pro features — your free tier data and settings remain untouched.",
              },
              {
                q: "Is there a free trial for Pro?",
                a: "We offer a 30-day money-back guarantee instead of a trial. Try Pro risk-free — if it's not right for you, we'll refund you no questions asked.",
              },
            ].map((faq) => (
              <div key={faq.q} className="rounded-xl border border-white/8 p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
                <h3 className="text-sm font-bold text-white mb-2">{faq.q}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-slate-400 mb-4">Still not sure? Try the free plan first — no credit card required.</p>
          <button
            onClick={() => navigate("/pro/onboarding")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold border border-white/15 text-white hover:border-white/30 hover:bg-white/5 transition-all"
          >
            Start for Free <ArrowRight size={14} />
          </button>
        </div>
      </div>
      {/* BOTTOM FOOTER BAR */}
      <footer className="border-t border-white/6 py-4 mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-2 text-center">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-black" style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff" }}>£</div>
            <span className="text-xs font-semibold text-slate-500" style={{ fontFamily: "'Syne', sans-serif" }}>Personal Economy</span>
          </div>
          <PoweredByBadge />
          <p className="text-xs text-slate-600">All data is stored locally on your device. Nothing is sent to any server.</p>
        </div>
      </footer>
    </div>
  );
}
