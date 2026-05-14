import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{ background: "#080a0f", fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full max-w-md mx-4 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full animate-pulse" style={{ background: "rgba(239,68,68,0.15)" }} />
            <div className="relative w-20 h-20 rounded-full flex items-center justify-center border border-rose-500/20" style={{ background: "rgba(239,68,68,0.08)" }}>
              <AlertCircle className="w-10 h-10 text-rose-400" />
            </div>
          </div>
        </div>

        {/* 404 */}
        <div
          className="text-7xl font-black mb-3"
          style={{ fontFamily: "'Syne', sans-serif", background: "linear-gradient(135deg, #10b981, #059669)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
        >
          404
        </div>

        <h2 className="text-xl font-bold text-white mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
          Page Not Found
        </h2>

        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          This page doesn't exist or may have been moved. Head back to your dashboard to continue tracking your financial progress.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate("/pro/dashboard")}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-black transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </button>
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-400 border border-white/10 hover:border-white/20 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
