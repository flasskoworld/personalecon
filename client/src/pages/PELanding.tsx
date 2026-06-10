// Personal Economy Pro — Landing Page
// Design: SE HQ Dark Sovereign Theme
// Type:   Playfair Display (hero h1 + CTA h2) · Syne (section heads + stats)
//         Space Mono (eyebrows, labels, buttons) · Inter (body copy)
// Accent: Burnished Gold #C9A84C replacing emerald
// Sig:    Ticker tape · Ledger grid bg · Animated counters · Typewriter headline

import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { PoweredByBadge } from "@/components/PoweredByFooter";
import { useStore } from "@/hooks/usePEStore";

// ── Ticker data ────────────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  { sym: "NET WORTH",      val: "$13,880",  note: "▲ +2.4%",       up: true  },
  { sym: "DEBT REMAINING", val: "$10,070",  note: "▼ ATTACK MODE", up: false },
  { sym: "SAVINGS STACK",  val: "$2,100",   note: "▲ ON PACE",     up: true  },
  { sym: "PORTFOLIO",      val: "$11,780",  note: "▲ +14.2%",      up: true  },
  { sym: "MONTHLY INCOME", val: "$5,417",   note: "BIWEEKLY",      up: true  },
  { sym: "DEBT FREE DATE", val: "MAR 2027", note: "▲ AVALANCHE",   up: true  },
  { sym: "EMERGENCY FUND", val: "3.2 MO",   note: "▲ BUILDING",    up: true  },
  { sym: "MONTHLY COST",   val: "$89.40",   note: "COST TO WAIT",  up: false },
];

// ── Animated counter hook ──────────────────────────────────────────────────────
function useAnimatedCount(target: number, duration = 1200, delay = 600) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setDisplay(Math.round(ease * target));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, duration, delay]);
  return display;
}

// ── Typewriter hook ────────────────────────────────────────────────────────────
const CYCLE_WORDS = ["economy.", "future.", "freedom.", "sovereignty."];

function useTypewriter(words: string[], startDelay = 1800) {
  const [text, setText] = useState(words[0]);
  const wi = useRef(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const typeWord = (word: string, cb: () => void) => {
      setText("");
      let i = 0;
      const iv = setInterval(() => {
        setText(word.slice(0, ++i));
        if (i >= word.length) { clearInterval(iv); setTimeout(cb, 2000); }
      }, 55);
    };
    const eraseWord = (cb: () => void) => {
      let cur = words[wi.current % words.length];
      const iv = setInterval(() => {
        cur = cur.slice(0, -1);
        setText(cur);
        if (!cur.length) { clearInterval(iv); cb(); }
      }, 30);
    };
    const cycle = () => {
      wi.current++;
      typeWord(words[wi.current % words.length], () => eraseWord(cycle));
    };

    const init = setTimeout(() => eraseWord(cycle), startDelay);
    return () => clearTimeout(init);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return text;
}

// ── Animated bar hook ──────────────────────────────────────────────────────────
function useAnimatedBar(target: number, delay = 1000) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(target), delay);
    return () => clearTimeout(t);
  }, [target, delay]);
  return width;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function PELanding() {
  const [, navigate] = useLocation();
  const { loadDemo } = useStore();

  const handleDemo = () => {
    loadDemo();
    setTimeout(() => navigate("/pro/dashboard"), 50);
  };
  const handleGetStarted = () => navigate("/pro/onboarding");

  // Animated counters
  const income  = useAnimatedCount(5417,  1200, 700);
  const debt    = useAnimatedCount(10070, 1400, 800);
  const savings = useAnimatedCount(2100,  1000, 700);
  const invest  = useAnimatedCount(11780, 1600, 900);

  // Progress bars
  const bar1 = useAnimatedBar(68, 1000);
  const bar2 = useAnimatedBar(34, 1200);
  const bar3 = useAnimatedBar(18, 1400);

  // Typewriter
  const accentWord = useTypewriter(CYCLE_WORDS);

  // Duplicate ticker for seamless loop
  const tickerItems = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div
      className="min-h-screen"
      style={{ background: "#06080E", color: "#F0EDE4", fontFamily: "'Inter', sans-serif" }}
    >

      {/* ── TICKER TAPE ──────────────────────────────────────────────────── */}
      <div className="pe-ticker">
        <div className="pe-ticker-track">
          {tickerItems.map((item, i) => (
            <span key={i} className="pe-ticker-item">
              <span className="pe-ticker-sym">{item.sym}</span>
              {item.val}
              <span className={item.up ? "pe-ticker-up" : "pe-ticker-dn"}>
                {item.note}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-[33px] left-0 right-0 z-50 border-b"
        style={{
          borderColor: "rgba(201,168,76,0.15)",
          background: "rgba(6,8,14,0.95)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 md:h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="pe-logo-mark">PE</div>
            <div>
              <div className="pe-logo-name">Personal Economy</div>
              <div className="pe-logo-sub">by Street Economics</div>
            </div>
          </div>

          {/* Nav actions */}
          <div className="flex items-center gap-3">
            <button onClick={handleDemo} className="pe-btn-nav">
              View Demo
            </button>
            <button onClick={handleGetStarted} className="pe-btn-primary" style={{ padding: "9px 20px", fontSize: "10px" }}>
              Build My Plan →
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="relative flex items-center pt-[33px]"
        style={{ minHeight: "100vh" }}
      >
        {/* Diagonal gold bleed */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, transparent 55%, rgba(201,168,76,0.04) 100%)",
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 grid md:grid-cols-2 gap-12 items-center w-full">

          {/* Left — copy */}
          <div>
            <div className="pe-eyebrow animate-fade-up">
              Personal Finance Command Center
            </div>

            {/* PLAYFAIR hero headline */}
            <h1
              className="pe-hero-h1 animate-fade-up delay-100"
            >
              Stop <span className="pe-strike">guessing</span>.<br />
              Build your<br />
              <em>{accentWord}</em>
              <span style={{ color: "var(--gold)", opacity: 0.6 }}>|</span>
            </h1>

            <p
              className="animate-fade-up delay-200"
              style={{
                fontSize: "15px",
                lineHeight: "1.7",
                color: "#7A8090",
                maxWidth: "480px",
                marginBottom: "32px",
              }}
            >
              Enter your real numbers — income, debts, expenses, investments.
              Get a live payoff timeline and a game plan built around where you
              actually are, not where you wish you were.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 animate-fade-up delay-350">
              <button onClick={handleGetStarted} className="pe-btn-primary">
                Build My Plan →
              </button>
              <button onClick={handleDemo} className="pe-btn-ghost">
                See Demo Dashboard
              </button>
            </div>

            {/* Trust pills */}
            <div className="flex flex-wrap gap-5 mt-7 animate-fade-up delay-500">
              {["Free to use", "No account needed", "Data stays on your device"].map((t) => (
                <div key={t} className="pe-trust-pill">{t}</div>
              ))}
            </div>
          </div>

          {/* Right — dashboard preview card */}
          <div className="hidden md:block">
            <div className="pe-dash-card animate-fade-up delay-200">
              {/* Card header */}
              <div className="pe-dash-header">
                <span className="pe-dash-label">Sample Dashboard</span>
                <span className="pe-live-dot">LIVE</span>
              </div>

              {/* 2×2 stat grid */}
              <div
                className="grid grid-cols-2"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                {[
                  { lbl: "Monthly Income",  val: `$${income.toLocaleString()}`,  color: "var(--gold)" },
                  { lbl: "Total Debt",      val: `$${debt.toLocaleString()}`,    color: "#E05252" },
                  { lbl: "Savings Stack",   val: `$${savings.toLocaleString()}`, color: "#2DD4BF" },
                  { lbl: "Portfolio Value", val: `$${invest.toLocaleString()}`,  color: "#818CF8" },
                ].map((s, i) => (
                  <div
                    key={s.lbl}
                    style={{
                      padding: "14px 18px",
                      borderRight: i % 2 === 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
                      borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none",
                    }}
                  >
                    <div className="pe-stat-lbl">{s.lbl}</div>
                    <div className="pe-stat-val" style={{ color: s.color }}>{s.val}</div>
                  </div>
                ))}
              </div>

              {/* Debt progress bars */}
              <div style={{ padding: "14px 18px" }}>
                <div
                  className="pe-stat-lbl"
                  style={{ marginBottom: "10px" }}
                >
                  Debt Payoff — Avalanche Method
                </div>
                {[
                  { name: "Visa Credit Card", tag: "ATTACK",  width: bar1, color: "#E05252" },
                  { name: "Personal Loan",    tag: "QUEUED",  width: bar2, color: "var(--gold)" },
                  { name: "Student Loan",     tag: "QUEUED",  width: bar3, color: "#818CF8" },
                ].map((d) => (
                  <div key={d.name} style={{ marginBottom: "10px" }}>
                    <div
                      style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}
                    >
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", color: "#7A8090" }}>
                        {d.name}
                      </span>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "8px", color: "var(--gold)" }}>
                        {d.tag}
                      </span>
                    </div>
                    <div style={{ height: "3px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${d.width}%`,
                          background: d.color,
                          transition: "width 1.5s cubic-bezier(0.4,0,0.2,1)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Card footer */}
              <div
                style={{
                  padding: "9px 18px",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(201,168,76,0.03)",
                }}
              >
                <p
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "8px",
                    color: "#2E3340",
                    letterSpacing: "0.08em",
                    textAlign: "center",
                  }}
                >
                  Sample data — your plan uses your real numbers
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section
        className="py-20 md:py-28"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Section heading — Syne */}
          <div className="mb-12 md:mb-16">
            <div className="pe-eyebrow">What's inside</div>
            <h2 className="pe-section-h2">Everything in one ledger.</h2>
            <p style={{ fontSize: "14px", color: "#7A8090", maxWidth: "420px", lineHeight: "1.65" }}>
              No spreadsheets. No guessing. A clear picture of where your money
              is — and exactly what to do next.
            </p>
          </div>

          {/* Feature cards */}
          <div
            className="grid md:grid-cols-3"
            style={{ border: "1px solid rgba(201,168,76,0.15)" }}
          >
            {[
              {
                num: "01",
                icon: "⚔",
                iconColor: "#E05252",
                iconBorder: "rgba(224,82,82,0.25)",
                title: "Debt Elimination",
                desc: "Track every debt with APR, interest costs, and a live payoff timeline. Toggle Snowball vs. Avalanche to see which saves you more money.",
                features: ["APR & monthly interest display", "Snowball vs. Avalanche toggle", "Projected debt-free date"],
              },
              {
                num: "02",
                icon: "◎",
                iconColor: "var(--gold)",
                iconBorder: "rgba(201,168,76,0.25)",
                title: "Savings Tracker",
                desc: "Set a savings goal and watch your stack grow. Log deposits, track milestones, and see a projected savings curve month by month.",
                features: ["Goal milestone tracking", "Monthly projection chart", "Emergency fund progress"],
              },
              {
                num: "03",
                icon: "▲",
                iconColor: "#818CF8",
                iconBorder: "rgba(129,140,248,0.25)",
                title: "Investment Portfolio",
                desc: "Track stocks, ETFs, crypto, 401k, and more in one view. See total value, gains/losses, and monthly contribution totals.",
                features: ["Multi-asset tracking", "Gain/loss per holding", "Monthly contribution totals"],
              },
            ].map((f, i) => (
              <div
                key={f.title}
                style={{
                  padding: "28px 24px",
                  borderRight: i < 2 ? "1px solid rgba(201,168,76,0.15)" : "none",
                  transition: "background 0.3s",
                  cursor: "default",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.background = "rgba(201,168,76,0.03)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.background = "transparent")
                }
              >
                {/* Feature num */}
                <div
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "9px",
                    letterSpacing: "0.15em",
                    color: "#2E3340",
                    marginBottom: "14px",
                  }}
                >
                  {f.num}
                </div>

                {/* Icon */}
                <div
                  style={{
                    width: "36px", height: "36px",
                    border: `1px solid ${f.iconBorder}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: f.iconColor, fontSize: "14px",
                    marginBottom: "14px",
                  }}
                >
                  {f.icon}
                </div>

                {/* Title — Syne */}
                <div className="pe-feature-title">{f.title}</div>

                {/* Desc — Inter */}
                <p
                  style={{ fontSize: "13px", lineHeight: "1.65", color: "#7A8090", marginBottom: "14px" }}
                >
                  {f.desc}
                </p>

                {/* Feature bullets */}
                <ul style={{ listStyle: "none" }}>
                  {f.features.map((feat) => (
                    <li
                      key={feat}
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: "9px",
                        letterSpacing: "0.05em",
                        color: "#3D4250",
                        padding: "4px 0",
                        borderTop: "1px solid rgba(255,255,255,0.05)",
                        display: "flex", alignItems: "center", gap: "6px",
                      }}
                    >
                      <span style={{ color: "var(--gold)", fontSize: "10px" }}>›</span>
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="pb-20 md:pb-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <div className="pe-eyebrow">Setup</div>
            {/* Syne heading */}
            <h2 className="pe-section-h2">Live in 3 minutes.</h2>
          </div>

          <div
            className="grid grid-cols-2 md:grid-cols-4"
            style={{ border: "1px solid rgba(201,168,76,0.15)" }}
          >
            {[
              { num: "01", title: "Enter Your Income",    desc: "Pay amount, frequency, and next payday date." },
              { num: "02", title: "List Your Expenses",   desc: "Monthly bills, subscriptions, and spending categories." },
              { num: "03", title: "Add Your Debts",       desc: "Each debt with balance, APR, and minimum payment." },
              { num: "04", title: "Track Investments",    desc: "Optionally add accounts to see your full net worth." },
            ].map((s, i) => (
              <div
                key={s.num}
                className="group relative"
                style={{
                  padding: "24px 20px",
                  borderRight: i < 3 ? "1px solid rgba(201,168,76,0.15)" : "none",
                }}
              >
                {/* Hover gold dot */}
                <div
                  className="absolute top-5 right-5 w-1.5 h-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "var(--gold)" }}
                />

                <div
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "28px",
                    fontWeight: "700",
                    color: "rgba(201,168,76,0.12)",
                    lineHeight: "1",
                    marginBottom: "12px",
                  }}
                >
                  {s.num}
                </div>
                <div
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#F0EDE4",
                    marginBottom: "6px",
                  }}
                >
                  {s.title}
                </div>
                <div style={{ fontSize: "12px", lineHeight: "1.6", color: "#7A8090" }}>
                  {s.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────────────────────── */}
      <div
        style={{
          borderTop: "1px solid rgba(201,168,76,0.15)",
          borderBottom: "1px solid rgba(201,168,76,0.15)",
          background: "#0F1219",
          padding: "40px 24px",
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div
            className="grid grid-cols-2 md:grid-cols-4"
            style={{ border: "1px solid rgba(201,168,76,0.15)" }}
          >
            {[
              { val: "$0",   lbl: "Cost to use" },
              { val: "5",    lbl: "Dashboard tabs" },
              { val: "2",    lbl: "Payoff strategies" },
              { val: "100%", lbl: "Private — data on device" },
            ].map((s, i) => (
              <div
                key={s.lbl}
                style={{
                  padding: "24px",
                  borderRight: i < 3 ? "1px solid rgba(201,168,76,0.15)" : "none",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: "32px",
                    fontWeight: "800",
                    color: "var(--gold)",
                    letterSpacing: "-0.03em",
                    marginBottom: "4px",
                  }}
                >
                  {s.val}
                </div>
                <div
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "9px",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "#3D4250",
                  }}
                >
                  {s.lbl}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA SECTION ──────────────────────────────────────────────────── */}
      <section
        className="relative py-28 text-center overflow-hidden"
      >
        {/* Watermark text */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
          aria-hidden="true"
        >
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "clamp(60px, 12vw, 130px)",
              fontWeight: "800",
              color: "rgba(201,168,76,0.03)",
              whiteSpace: "nowrap",
              letterSpacing: "-0.04em",
            }}
          >
            PERSONAL ECONOMY
          </span>
        </div>

        <div className="relative max-w-2xl mx-auto px-4 sm:px-6">
          <div className="pe-eyebrow" style={{ justifyContent: "center", marginBottom: "16px" }}>
            Final call
          </div>

          {/* PLAYFAIR CTA heading */}
          <h2 className="pe-cta-h2">
            Stop wondering where your money went.
          </h2>

          <p style={{ fontSize: "14px", color: "#7A8090", lineHeight: "1.65", marginBottom: "32px" }}>
            Build your personal economy in minutes. Your numbers, your plan, your path forward.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button onClick={handleGetStarted} className="pe-btn-primary">
              Build My Plan Free →
            </button>
            <button onClick={handleDemo} className="pe-btn-ghost">
              View Sample Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer
        style={{ borderTop: "1px solid rgba(201,168,76,0.15)", padding: "18px 24px" }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="pe-logo-mark" style={{ width: "24px", height: "24px", fontSize: "9px" }}>PE</div>
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "12px",
                fontWeight: "600",
                color: "#4A505E",
              }}
            >
              Personal Economy
            </span>
          </div>

          <PoweredByBadge />

          <p
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "9px",
              letterSpacing: "0.08em",
              color: "#2E3340",
            }}
          >
            All data stored locally. Nothing sent to any server.
          </p>
        </div>
      </footer>
    </div>
  );
}
