// Personal Economy Pro — ProGate Component
// Wraps any feature that requires a Pro subscription.
// Shows a blurred/locked overlay with an upgrade CTA when isPro is false.

import { Lock, Zap } from "lucide-react";
import { useLocation } from "wouter";

interface ProGateProps {
  isPro: boolean;
  /** Short label shown in the lock overlay, e.g. "Avalanche Strategy" */
  featureName: string;
  /** Optional: extra description shown under the feature name */
  description?: string;
  /** Content to render (blurred) when locked */
  children: React.ReactNode;
  /** If true, render as an inline badge instead of a full overlay */
  inline?: boolean;
}

export function ProGate({ isPro, featureName, description, children, inline = false }: ProGateProps) {
  const [, navigate] = useLocation();

  if (isPro) return <>{children}</>;

  if (inline) {
    return (
      <button
        onClick={() => navigate("/pro/pricing")}
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-all cursor-pointer"
        title={`Upgrade to Pro to unlock ${featureName}`}
      >
        <Lock size={10} />
        Pro
      </button>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Blurred content preview */}
      <div className="pointer-events-none select-none blur-sm opacity-40">
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d1117]/80 backdrop-blur-[2px] rounded-2xl z-10 px-6 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-3">
          <Lock size={20} className="text-amber-400" />
        </div>
        <h3 className="text-sm font-bold text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
          {featureName}
        </h3>
        {description && (
          <p className="text-xs text-slate-400 mb-4 max-w-xs leading-relaxed">{description}</p>
        )}
        <button
          onClick={() => navigate("/pro/pricing")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-black transition-all hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}
        >
          <Zap size={14} />
          Upgrade to Pro
        </button>
        <p className="text-xs text-slate-500 mt-2">Starting at $9/mo · Cancel anytime</p>
      </div>
    </div>
  );
}

/** Small Pro badge for tab labels */
export function ProBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 ml-1.5 leading-none">
      <Lock size={8} />
      PRO
    </span>
  );
}
