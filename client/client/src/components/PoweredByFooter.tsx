// Personal Economy — SE HQ Branding Badge
// Design: SE HQ Sovereign Dark Theme
// Type:   Space Mono (badge text)

const SE_LOGO_URL = "/manus-storage/SEsimplelogo_white_b48ea2d5.png";
const SE_LINK = "https://beacons.ai/streetecon";

export function PoweredByBadge() {
  return (
    <a
      href={SE_LINK}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Powered by Street Economics"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "7px",
        opacity: 0.55,
        transition: "opacity 0.2s",
        textDecoration: "none",
        padding: "4px 10px",
        border: "1px solid rgba(201,168,76,0.12)",
        background: "rgba(201,168,76,0.03)",
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = "1")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = "0.55")}
    >
      <span
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "8px",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "#4A505E",
          whiteSpace: "nowrap",
        }}
      >
        Powered by
      </span>
      <img
        src={SE_LOGO_URL}
        alt="Street Economics"
        style={{ height: "14px", width: "14px", objectFit: "contain", filter: "brightness(0.8)" }}
      />
      <span
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "9px",
          fontWeight: "700",
          letterSpacing: "0.10em",
          textTransform: "uppercase",
          color: "#C9A84C",
          whiteSpace: "nowrap",
        }}
      >
        Street Economics
      </span>
    </a>
  );
}

// Legacy export — no-op, branding embedded per-page
export function PoweredByFooter() {
  return null;
}
