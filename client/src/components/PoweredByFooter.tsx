// StreetEconomics branding — inline footer badge
// Placed inside existing footer bars across all product pages

const SE_LOGO_URL = "/manus-storage/SEsimplelogo_white_b48ea2d5.png";
const SE_LINK = "https://beacons.ai/streetecon";

export function PoweredByBadge() {
  return (
    <a
      href={SE_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity group"
      aria-label="Powered by StreetEconomics"
    >
      <span className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors whitespace-nowrap">
        Powered by
      </span>
      <img
        src={SE_LOGO_URL}
        alt="StreetEconomics"
        className="h-4 w-4 object-contain"
      />
      <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-200 transition-colors whitespace-nowrap">
        Street Economics
      </span>
    </a>
  );
}

// Legacy export — now a no-op since branding is embedded in each page's footer bar
export function PoweredByFooter() {
  return null;
}
