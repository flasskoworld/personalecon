const SE_LOGO_URL = "/manus-storage/SEtypelogo_white_151cb3b4.webp";
const SE_LINK = "https://beacons.ai/streetecon";

export function PoweredByFooter() {
  return (
    <footer className="w-full border-t border-white/10 bg-[#0d1117] py-4 px-6 mt-auto">
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-2">
        <span className="text-xs text-slate-500 tracking-wide">Powered by</span>
        <a
          href={SE_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="StreetEconomics"
        >
          <img
            src={SE_LOGO_URL}
            alt="StreetEconomics"
            className="h-5 w-auto object-contain"
          />
        </a>
      </div>
    </footer>
  );
}
