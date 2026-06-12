// Personal Economy — Error Boundary
// Design: SE HQ Sovereign Dark Theme
// Type:   Playfair Display (headline) · Space Mono (label/button) · Syne (sub)

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "#06080E",
            backgroundImage:
              "linear-gradient(rgba(201,168,76,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.025) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "32px",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "540px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: "56px",
                height: "56px",
                border: "1.5px solid rgba(224,82,82,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#E05252",
                marginBottom: "28px",
              }}
            >
              <AlertTriangle size={26} />
            </div>

            {/* Eyebrow */}
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "9px",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "#E05252",
                marginBottom: "14px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span style={{ width: "32px", height: "1px", background: "rgba(224,82,82,0.4)", display: "inline-block" }} />
              System Error
              <span style={{ width: "32px", height: "1px", background: "rgba(224,82,82,0.4)", display: "inline-block" }} />
            </div>

            {/* Headline — Playfair */}
            <h2
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "clamp(22px, 4vw, 32px)",
                fontWeight: "800",
                fontStyle: "italic",
                color: "#F0EDE4",
                letterSpacing: "-0.01em",
                marginBottom: "10px",
              }}
            >
              An unexpected error occurred.
            </h2>

            <p
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "14px",
                color: "#7A8090",
                marginBottom: "24px",
              }}
            >
              The page ran into a problem. Reload to try again — your data is safe.
            </p>

            {/* Stack trace */}
            <div
              style={{
                width: "100%",
                background: "#0B0E16",
                border: "1px solid rgba(201,168,76,0.12)",
                padding: "16px",
                marginBottom: "28px",
                textAlign: "left",
                maxHeight: "200px",
                overflow: "auto",
                position: "relative",
              }}
            >
              {/* Gold top bar */}
              <div
                style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0,
                  height: "2px",
                  background: "linear-gradient(90deg, rgba(224,82,82,0.6), transparent 70%)",
                }}
              />
              <pre
                style={{
                  fontFamily: "'JetBrains Mono', 'Space Mono', monospace",
                  fontSize: "11px",
                  color: "#4A505E",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                {this.state.error?.stack}
              </pre>
            </div>

            {/* Divider */}
            <div
              style={{
                width: "100%",
                height: "1px",
                background: "rgba(201,168,76,0.10)",
                marginBottom: "24px",
              }}
            />

            {/* CTA */}
            <button
              onClick={() => window.location.reload()}
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "10px",
                fontWeight: "700",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                background: "#C9A84C",
                color: "#06080E",
                border: "none",
                padding: "12px 28px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                transition: "opacity 0.2s, transform 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = "0.88";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              }}
            >
              <RotateCcw size={13} />
              Reload Page
            </button>

            {/* SE badge */}
            <div
              style={{
                marginTop: "40px",
                fontFamily: "'Space Mono', monospace",
                fontSize: "8px",
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

    return this.props.children;
  }
}

export default ErrorBoundary;
