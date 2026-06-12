// Personal Economy — 404 Not Found
// Design: SE HQ Sovereign Dark Theme
// Type:   Playfair Display (404 number) · Syne (heading) · Space Mono (labels)

import { useLocation } from "wouter";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{ background: "#06080E", fontFamily: "'Inter', sans-serif" }}
    >
      {/* Ledger grid bg */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(201,168,76,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.025) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-md mx-4 text-center">

        {/* Icon ring */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full animate-pulse"
              style={{ background: "rgba(224,82,82,0.08)" }}
            />
            <div
              className="relative w-20 h-20 rounded-full flex items-center justify-center border"
              style={{ borderColor: "rgba(224,82,82,0.20)", background: "rgba(224,82,82,0.05)" }}
            >
              {/* X mark in gold square */}
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  border: "1.5px solid rgba(224,82,82,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "16px",
                  color: "#E05252",
                }}
              >
                ✕
              </div>
            </div>
          </div>
        </div>

        {/* Eyebrow */}
        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "9px",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "#C9A84C",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          <span style={{ width: "40px", height: "1px", background: "rgba(201,168,76,0.4)", display: "inline-block" }} />
          Error
          <span style={{ width: "40px", height: "1px", background: "rgba(201,168,76,0.4)", display: "inline-block" }} />
        </div>

        {/* 404 — Playfair Display */}
        <div
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(72px, 18vw, 110px)",
            fontWeight: "800",
            fontStyle: "italic",
            lineHeight: "0.95",
            color: "#C9A84C",
            marginBottom: "20px",
            letterSpacing: "-0.02em",
          }}
        >
          404
        </div>

        {/* Heading — Syne */}
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "20px",
            fontWeight: "800",
            color: "#F0EDE4",
            marginBottom: "12px",
            letterSpacing: "-0.02em",
          }}
        >
          Page Not Found
        </h2>

        {/* Body — Inter */}
        <p
          style={{
            fontSize: "14px",
            lineHeight: "1.7",
            color: "#7A8090",
            marginBottom: "36px",
            maxWidth: "340px",
            margin: "0 auto 36px",
          }}
        >
          This page doesn't exist or may have been moved. Head back to your
          dashboard to continue building your economy.
        </p>

        {/* Divider */}
        <div
          style={{
            width: "100%",
            height: "1px",
            background: "rgba(201,168,76,0.12)",
            marginBottom: "28px",
          }}
        />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate("/pro/dashboard")}
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "10px",
              fontWeight: "700",
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              background: "#C9A84C",
              color: "#06080E",
              border: "none",
              padding: "13px 24px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.88")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
          >
            <Home size={13} />
            Go to Dashboard
          </button>

          <button
            onClick={() => window.history.back()}
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "10px",
              fontWeight: "400",
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "#7A8090",
              background: "transparent",
              border: "1px solid rgba(201,168,76,0.15)",
              padding: "12px 24px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              transition: "border-color 0.2s, color 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,168,76,0.35)";
              (e.currentTarget as HTMLButtonElement).style.color = "#F0EDE4";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,168,76,0.15)";
              (e.currentTarget as HTMLButtonElement).style.color = "#7A8090";
            }}
          >
            <ArrowLeft size={13} />
            Go Back
          </button>
        </div>

        {/* SE badge */}
        <div
          style={{
            marginTop: "48px",
            fontFamily: "'Space Mono', monospace",
            fontSize: "9px",
            letterSpacing: "0.15em",
            color: "#2E3340",
          }}
        >
          PERSONAL ECONOMY · SE HQ
        </div>
      </div>
    </div>
  );
}
