// StrategyInfoModal — Plain-English explanation of Avalanche vs Snowball
// Triggered by the (?) info icon next to the strategy toggle

import { X, Flame, Snowflake, TrendingDown, Zap } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const GOLD = "#C9A84C";
const INDIGO = "#818CF8";
const mono = { fontFamily: "'Space Mono', monospace" };
const syne = { fontFamily: "'Syne', sans-serif" };

export function StrategyInfoModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg border"
        style={{
          background: "#06080E",
          borderColor: "rgba(201,168,76,0.25)",
          boxShadow: "0 0 0 1px rgba(201,168,76,0.1), 0 24px 64px rgba(0,0,0,0.8)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gold top bar */}
        <div style={{ height: "2px", background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div>
            <div className="uppercase font-bold" style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", color: GOLD }}>
              Debt Payoff Methods
            </div>
            <div className="font-black mt-0.5" style={{ ...syne, fontSize: "18px", color: "#F0EDE4" }}>
              Avalanche vs Snowball
            </div>
          </div>
          <button
            onClick={onClose}
            className="border p-1.5 transition-all hover:opacity-80"
            style={{ borderColor: "rgba(255,255,255,0.1)", color: "#4A505E" }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">

          {/* Avalanche */}
          <div className="border p-4" style={{ borderColor: `${GOLD}40`, background: `${GOLD}08` }}>
            <div className="flex items-center gap-2 mb-2">
              <Flame size={14} color={GOLD} />
              <span className="font-bold uppercase" style={{ ...mono, fontSize: "10px", letterSpacing: "0.15em", color: GOLD }}>
                Avalanche Method
              </span>
              <span className="border px-1.5 py-0.5" style={{ ...mono, fontSize: "8px", letterSpacing: "0.1em", color: GOLD, borderColor: `${GOLD}40` }}>
                MATHEMATICALLY OPTIMAL
              </span>
            </div>
            <p style={{ fontSize: "13px", color: "#C8C4BC", lineHeight: "1.6" }}>
              Pay the <strong style={{ color: "#F0EDE4" }}>minimum on everything</strong>, then throw every extra dollar at the debt with the <strong style={{ color: GOLD }}>highest interest rate</strong> first.
            </p>
            <p className="mt-2" style={{ fontSize: "12px", color: "#6B7280", lineHeight: "1.5" }}>
              Think of it like stopping the biggest leak first. High-rate debt is bleeding you the most every month — kill it fast and you save the most money overall.
            </p>
            <div className="flex items-center gap-2 mt-3 border-t pt-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <TrendingDown size={12} color={GOLD} />
              <span style={{ ...mono, fontSize: "9px", color: "#4A505E", letterSpacing: "0.08em" }}>
                BEST FOR: Saving the most money · Paying less interest total
              </span>
            </div>
          </div>

          {/* Snowball */}
          <div className="border p-4" style={{ borderColor: `${INDIGO}40`, background: `${INDIGO}08` }}>
            <div className="flex items-center gap-2 mb-2">
              <Snowflake size={14} color={INDIGO} />
              <span className="font-bold uppercase" style={{ ...mono, fontSize: "10px", letterSpacing: "0.15em", color: INDIGO }}>
                Snowball Method
              </span>
              <span className="border px-1.5 py-0.5" style={{ ...mono, fontSize: "8px", letterSpacing: "0.1em", color: INDIGO, borderColor: `${INDIGO}40` }}>
                MOTIVATION BOOSTER
              </span>
            </div>
            <p style={{ fontSize: "13px", color: "#C8C4BC", lineHeight: "1.6" }}>
              Pay the <strong style={{ color: "#F0EDE4" }}>minimum on everything</strong>, then throw every extra dollar at the debt with the <strong style={{ color: INDIGO }}>smallest balance</strong> first.
            </p>
            <p className="mt-2" style={{ fontSize: "12px", color: "#6B7280", lineHeight: "1.5" }}>
              You knock out small debts quickly and feel wins early. Each paid-off account frees up its minimum payment to roll into the next one — like a snowball getting bigger as it rolls downhill.
            </p>
            <div className="flex items-center gap-2 mt-3 border-t pt-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <Zap size={12} color={INDIGO} />
              <span style={{ ...mono, fontSize: "9px", color: "#4A505E", letterSpacing: "0.08em" }}>
                BEST FOR: Staying motivated · Fewer accounts to manage
              </span>
            </div>
          </div>

          {/* Comparison table */}
          <div className="border" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="grid grid-cols-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="px-3 py-2" style={{ ...mono, fontSize: "8px", letterSpacing: "0.1em", color: "#4A505E" }}></div>
              <div className="px-3 py-2 border-l text-center" style={{ ...mono, fontSize: "8px", letterSpacing: "0.1em", color: GOLD, borderColor: "rgba(255,255,255,0.06)" }}>AVALANCHE</div>
              <div className="px-3 py-2 border-l text-center" style={{ ...mono, fontSize: "8px", letterSpacing: "0.1em", color: INDIGO, borderColor: "rgba(255,255,255,0.06)" }}>SNOWBALL</div>
            </div>
            {[
              { label: "Target", av: "Highest APR first", sn: "Lowest balance first" },
              { label: "Saves money?", av: "✓ More savings", sn: "Costs more interest" },
              { label: "Quick wins?", av: "Takes longer to see", sn: "✓ Fast early wins" },
              { label: "Best if you...", av: "Want to pay least", sn: "Need motivation" },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-3 border-b last:border-b-0" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                <div className="px-3 py-2" style={{ fontSize: "10px", color: "#6B7280" }}>{row.label}</div>
                <div className="px-3 py-2 border-l text-center" style={{ fontSize: "10px", color: "#C8C4BC", borderColor: "rgba(255,255,255,0.04)" }}>{row.av}</div>
                <div className="px-3 py-2 border-l text-center" style={{ fontSize: "10px", color: "#C8C4BC", borderColor: "rgba(255,255,255,0.04)" }}>{row.sn}</div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: "11px", color: "#4A505E", lineHeight: "1.5" }}>
            <strong style={{ color: GOLD }}>Bottom line:</strong> Both methods work. Avalanche saves you more money. Snowball keeps you motivated. Pick the one you'll actually stick to — the best strategy is the one you execute.
          </p>
        </div>
      </div>
    </div>
  );
}
