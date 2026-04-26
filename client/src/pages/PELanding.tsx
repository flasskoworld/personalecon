// Personal Economy Pro — Landing Page
// Design: Dark Premium Fintech | Syne + Inter | Emerald/Gold accents
// Asymmetric layout, editorial typography, strong CTA

import { useLocation } from "wouter";
import { PoweredByFooter, PoweredByBadge } from "@/components/PoweredByFooter";
import { ArrowRight, TrendingUp, Shield, Target, BarChart3, Zap, CheckCircle2, ChevronRight } from "lucide-react";
import { useStore } from "@/hooks/usePEStore";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663192782655/GXoMctSFQX8j75azAgdFxw/pe-hero-bg-UvQYEo7RGZBMWJNkwoPne6.webp";
const IMG_DEBT = "https://d2xsxph8kpxj0f.cloudfront.net/310519663192782655/GXoMctSFQX8j75azAgdFxw/pe-feature-debt-RxVWADVSDY7HPqzAWo6hDc.webp";
const IMG_SAVINGS = "https://d2xsxph8kpxj0f.cloudfront.net/310519663192782655/GXoMctSFQX8j75azAgdFxw/pe-feature-savings-mDxaDuocMR6n72b6T9zVzX.webp";
const IMG_INVEST = "https://d2xsxph8kpxj0f.cloudfront.net/310519663192782655/GXoMctSFQX8j75azAgdFxw/pe-feature-invest-fLSueNc8fLynqY9pMRSs6q.webp";

export default function Landing() {
  const [, navigate] = useLocation();
  const { loadDemo } = useStore();

  const handleDemo = () => {
    loadDemo();
    setTimeout(() => navigate("/pro/dashboard"), 50);
  };

  const handleGetStarted = () => {
    navigate("/pro/onboarding");
  };

  return (
    <div className="min-h-screen bg-[#080a0f] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/6" style={{ background: "rgba(8,10,15,0.92)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-black"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff" }}
            >
              £
            </div>
            <span className="text-base font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
              Personal Economy
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDemo}
              className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5"
            >
              View Demo
            </button>
            <button
              onClick={handleGetStarted}
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg text-black transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
            >
              Get Started <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section
        className="relative min-h-screen flex items-center pt-16"
        style={{
          background: `linear-gradient(to bottom, rgba(8,10,15,0.3) 0%, rgba(8,10,15,0.7) 50%, rgba(8,10,15,1) 100%), url(${HERO_BG}) center/cover no-repeat`,
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest text-emerald-400 uppercase bg-emerald-400/10 border border-emerald-400/20 px-3 py-1.5 rounded-full mb-6">
              <Zap size={11} />
              Your Personal Finance Command Center
            </div>
            <h1
              className="text-5xl md:text-6xl font-black leading-[1.05] mb-6"
              style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "-0.03em" }}
            >
              Take Control of Your{" "}
              <span style={{ background: "linear-gradient(135deg, #10b981, #d4af37)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Personal Economy
              </span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed mb-8 max-w-lg">
              Enter your income, expenses, debts, and investments. Get a real game plan — with a live payoff timeline, savings tracker, and strategy built around your actual numbers.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleGetStarted}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-bold text-black transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 8px 32px rgba(16,185,129,0.3)" }}
              >
                Build My Plan <ArrowRight size={16} />
              </button>
              <button
                onClick={handleDemo}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold text-white border border-white/15 hover:border-white/30 transition-all"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                See Demo Dashboard
              </button>
            </div>
            <div className="flex items-center gap-6 mt-8">
              {[
                "Free to use",
                "No account needed",
                "Data stays on your device",
              ].map((t) => (
                <div key={t} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Hero Stats Card */}
          <div className="hidden md:block">
            <div
              className="rounded-2xl border border-white/10 p-6"
              style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">Sample Dashboard</span>
                <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded font-mono">LIVE</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: "Monthly Income", value: "$5,417", color: "text-white" },
                  { label: "Total Debt", value: "$10,070", color: "text-rose-400" },
                  { label: "Savings Stack", value: "$2,100", color: "text-emerald-400" },
                  { label: "Portfolio Value", value: "$11,780", color: "text-indigo-400" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-white/5 border border-white/8 p-3">
                    <div className="text-xs text-slate-500 mb-1">{s.label}</div>
                    <div className={`text-xl font-black ${s.color}`} style={{ fontFamily: "'Syne', sans-serif" }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-white/5 border border-white/8 p-3">
                <div className="text-xs text-slate-500 mb-2">Debt Payoff Progress</div>
                <div className="space-y-2">
                  {[
                    { name: "Visa Credit Card", pct: 0, color: "#10b981" },
                    { name: "Personal Loan", pct: 0, color: "#f59e0b" },
                    { name: "Student Loan", pct: 0, color: "#6366f1" },
                  ].map((d) => (
                    <div key={d.name}>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>{d.name}</span>
                        <span style={{ color: d.color }}>Attack</span>
                      </div>
                      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                        <div className="h-full rounded-full w-0 transition-all" style={{ background: d.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-600 text-center mt-3">This is sample data — your plan uses your real numbers</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2
            className="text-3xl md:text-4xl font-black mb-4"
            style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "-0.02em" }}
          >
            Everything in one place
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            No spreadsheets. No guessing. Just a clear picture of where your money is and exactly what to do next.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              img: IMG_DEBT,
              icon: <Shield size={20} />,
              color: "#10b981",
              title: "Debt Elimination",
              desc: "Track every debt with APR, interest costs, and a live payoff timeline. Toggle between Snowball and Avalanche strategies to see which saves you more money.",
              features: ["APR & monthly interest display", "Snowball vs. Avalanche toggle", "Projected debt-free date"],
            },
            {
              img: IMG_SAVINGS,
              icon: <Target size={20} />,
              color: "#d4af37",
              title: "Savings Tracker",
              desc: "Set a savings goal and watch your stack grow. Log deposits, track milestones, and see a projected savings curve month by month.",
              features: ["Goal milestone tracking", "Monthly projection chart", "Emergency fund progress"],
            },
            {
              img: IMG_INVEST,
              icon: <TrendingUp size={20} />,
              color: "#6366f1",
              title: "Investment Portfolio",
              desc: "Track your stocks, ETFs, crypto, 401k, and more in one view. See total value, gains/losses, and monthly contribution totals.",
              features: ["Multi-asset tracking", "Gain/loss per holding", "Monthly contribution totals"],
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/8 overflow-hidden group hover:border-white/15 transition-all"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <div className="h-40 overflow-hidden">
                <img src={f.img} alt={f.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: f.color + "22", color: f.color }}>
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{f.title}</h3>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">{f.desc}</p>
                <ul className="space-y-1.5">
                  {f.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-xs text-slate-500">
                      <CheckCircle2 size={11} style={{ color: f.color }} className="shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 border-t border-white/6">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl font-black mb-4"
              style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "-0.02em" }}
            >
              Set up in 3 minutes
            </h2>
            <p className="text-slate-400">Answer a few questions and your dashboard is ready.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Enter Your Income", desc: "Add your pay amount, frequency, and next payday date.", color: "#10b981" },
              { step: "02", title: "List Your Expenses", desc: "Add your monthly bills, subscriptions, and spending categories.", color: "#d4af37" },
              { step: "03", title: "Add Your Debts", desc: "Enter each debt with its balance, APR, and minimum payment.", color: "#6366f1" },
              { step: "04", title: "Track Investments", desc: "Optionally add your investment accounts to see your full net worth.", color: "#ec4899" },
            ].map((s, i) => (
              <div key={s.step} className="relative">
                {i < 3 && (
                  <div className="hidden md:block absolute top-6 left-full w-full h-px border-t border-dashed border-white/10 z-0" style={{ width: "calc(100% - 2rem)" }} />
                )}
                <div className="relative z-10">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black mb-4"
                    style={{ background: s.color + "18", color: s.color, border: `1px solid ${s.color}30` }}
                  >
                    {s.step}
                  </div>
                  <h3 className="font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>{s.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="py-16 border-t border-b border-white/6" style={{ background: "rgba(16,185,129,0.04)" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "$0", label: "Cost to use" },
              { value: "5", label: "Dashboard tabs" },
              { value: "2", label: "Payoff strategies" },
              { value: "100%", label: "Private — data on your device" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-black text-emerald-400 mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>{s.value}</div>
                <div className="text-sm text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2
            className="text-4xl md:text-5xl font-black mb-6"
            style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "-0.03em" }}
          >
            Stop wondering where your money went.
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
            Build your personal economy in minutes. Your numbers, your plan, your path out.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={handleGetStarted}
              className="flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-bold text-black transition-all hover:opacity-90 hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 8px 40px rgba(16,185,129,0.35)" }}
            >
              Build My Plan Free <ArrowRight size={18} />
            </button>
            <button
              onClick={handleDemo}
              className="flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-semibold text-white border border-white/15 hover:border-white/30 transition-all"
            >
              View Sample Dashboard <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/6 py-5">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-black"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff" }}
            >
              £
            </div>
            <span className="text-sm font-semibold text-slate-400" style={{ fontFamily: "'Syne', sans-serif" }}>Personal Economy</span>
          </div>
          <PoweredByBadge />
          <p className="text-xs text-slate-600">All data is stored locally on your device. Nothing is sent to any server.</p>
        </div>
      </footer>
    </div>
  );
}
