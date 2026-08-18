// ─────────────────────────────────────────────
// SkillSnap — App Store / Google Play download buttons
// Shared by the landing page, the feed and the public profile page.
//
// Both buttons go through /get (src/app/get/route.ts), which sends iOS to the
// App Store and Android to Google Play once ANDROID_STORE_LIVE is flipped —
// until then Android falls back to the landing page. Linking the Play listing
// directly served a 404 while the app had no production access.
// ─────────────────────────────────────────────

const GET_APP_HREF = "/get";

// 200px at h-14 (56px) is ~3.6:1 — close to the official badges' proportions.
const BUTTON_MAX_W = "max-w-[200px]";

function AppleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 12.54c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.83-.81-3-.79-1.54.02-2.96.9-3.75 2.28-1.6 2.78-.41 6.9 1.15 9.16.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.39 0 1.78.74 3 .72 1.24-.02 2.02-1.12 2.78-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.4-.92-2.42-3.69zM14.79 5.4c.63-.77 1.06-1.83.94-2.9-.91.04-2.01.61-2.67 1.37-.59.68-1.1 1.77-.96 2.81 1.01.08 2.05-.51 2.69-1.28z" />
    </svg>
  );
}

function PlayIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.6 2.2c-.25.26-.4.67-.4 1.2v17.2c0 .53.15.94.4 1.2l.06.06 9.64-9.64v-.23L3.66 2.14l-.06.06z" fill="#00d4ff" />
      <path d="M16.5 15.44l-3.2-3.2v-.23l3.2-3.21.07.04 3.8 2.16c1.09.62 1.09 1.63 0 2.25l-3.8 2.16-.07.03z" fill="#ffce00" />
      <path d="M16.57 15.4L13.3 12.13 3.6 21.8c.36.38.95.43 1.62.05l11.35-6.45z" fill="#ff3a44" />
      <path d="M16.57 8.86L5.22 2.4C4.55 2.03 3.96 2.08 3.6 2.46l9.7 9.67 3.27-3.27z" fill="#00e676" />
    </svg>
  );
}

/**
 * outline — translucent white on a dark surface (default)
 * black   — solid black pill, for light or brand-coloured surfaces
 * white   — solid white pill with dark ink, for the purple CTA band
 */
export type AppStoreButtonVariant = "outline" | "black" | "white";

interface AppStoreButtonsProps {
  variant?: AppStoreButtonVariant;
  /** Stack vertically at every width instead of going side by side from `sm`. */
  stacked?: boolean;
  className?: string;
}

const VARIANT_STYLES: Record<AppStoreButtonVariant, React.CSSProperties> = {
  outline: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.14)",
    color: "#ffffff",
  },
  black: {
    background: "#0b0715",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#ffffff",
  },
  white: {
    background: "#ffffff",
    border: "1px solid rgba(255,255,255,0.9)",
    color: "#12091f",
  },
};

export default function AppStoreButtons({
  variant = "outline",
  stacked = false,
  className = "",
}: AppStoreButtonsProps) {
  const style = VARIANT_STYLES[variant];
  const row = stacked ? "flex-col" : "flex-col sm:flex-row";

  // Sizing only. Each button is capped at BUTTON_MAX_W so a phone-width column
  // doesn't stretch a 56px-tall pill to 340px wide; side by side they share the
  // row equally (flex-1, basis 0) up to the same cap, so the pair always reads
  // as two identical badges, centred in whatever the parent gives them.
  //
  // These are hand-drawn SVG buttons, not Apple's or Google's official badge
  // artwork. Both companies' guidelines require their own assets at fixed
  // proportions; swapping these for the official badges is a follow-up.
  const grow = stacked ? "" : "sm:flex-1 sm:basis-0";
  const button = `w-full ${BUTTON_MAX_W} ${grow} h-14 rounded-2xl flex items-center justify-center gap-2.5 sm:gap-3 px-3 sm:px-5 transition-transform active:scale-[0.97] hover:-translate-y-0.5`;

  return (
    <div className={`flex ${row} items-center justify-center gap-2.5 w-full ${className}`}>
      <a href={GET_APP_HREF} className={button} style={style}>
        <AppleIcon size={24} />
        <span className="flex flex-col items-start leading-none whitespace-nowrap">
          <span className="text-[10px] opacity-70">Download on the</span>
          <span className="text-[15px] font-bold">App Store</span>
        </span>
      </a>

      <a href={GET_APP_HREF} className={button} style={style}>
        <PlayIcon size={22} />
        <span className="flex flex-col items-start leading-none whitespace-nowrap">
          <span className="text-[10px] opacity-70">GET IT ON</span>
          <span className="text-[15px] font-bold">Google Play</span>
        </span>
      </a>
    </div>
  );
}
