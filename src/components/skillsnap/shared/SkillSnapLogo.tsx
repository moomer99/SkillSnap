"use client";

interface LogoProps {
  variant?: "full" | "icon";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  dark?: boolean;
}

// App design-system colours
const BRAND   = "#6c47ff"; // app purple (replaces original #5b72fe blue)
const SLASH   = "#1a1a2e"; // dark diagonal slash (was #302929)
const SLASH_DARK = "rgba(255,255,255,0.25)"; // slash on dark bg

// Full wordmark heights → width derived from 160:47 aspect ratio ≈ 3.4:1
const FULL_HEIGHTS = { xs: 16, sm: 20, md: 26, lg: 36, xl: 50 };
// Icon sizes
const ICON_SIZES   = { xs: 28, sm: 36, md: 44, lg: 64, xl: 88 };

/**
 * Full wordmark — uses the exact paths from the original SVG (viewBox 0 0 160 47),
 * with brand purple substituted for the original blue and app dark for the slash.
 * Transparent background — works on any surface.
 */
function Wordmark({ height, dark: onDark }: { height: number; dark: boolean }) {
  const fill  = onDark ? "#ffffff" : BRAND;
  const slash = onDark ? SLASH_DARK : SLASH;
  const w = Math.round((height / 47) * 160);
  return (
    <svg
      width={w}
      height={height}
      viewBox="0 0 160 47"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SkillSnap"
      style={{ display: "block", flexShrink: 0 }}
    >
      {/* S */}
      <path fill={fill} d="M5.64,30.93c-3.29-1.08-4.94-3.26-5.64-6.77h5.03c.66,2.73,3.12,3.54,7.07,3.54,3.62,0,5.25-.69,5.25-2.32,0-.64-.22-1.1-.64-1.35-.88-.58-2.9-.72-6.93-.94-1.99-.11-3.65-.36-4.97-.77-2.62-.77-3.87-2.35-3.87-5.11,0-3.81,3.23-6.24,9.67-6.24,6.85,0,10.5,1.91,11.41,6.88h-4.94c-.55-2.51-2.82-3.01-6.55-3.01s-4.89.83-4.89,2.24c0,.69.19,1.16,1.08,1.49.86.33,2.46.55,5.22.66,2.38.11,4.28.36,5.77.77,3.01.8,4.31,2.35,4.31,5.06,0,4.23-3.09,6.68-10.03,6.68-2.6,0-4.7-.25-6.35-.8Z"/>
      {/* K left upstroke */}
      <polygon fill={fill} points="29.25 11.1 24.66 11.1 24.66 18.83 24.66 21.16 24.66 21.59 29.25 16.87 29.25 11.1"/>
      {/* K right lower */}
      <polygon fill={fill} points="34.24 24.39 38.78 31.15 43.37 31.15 36.87 21.52 34.24 24.39"/>
      {/* K diagonal slash — kept dark */}
      <polygon fill={slash} points="37.43 11.1 24.66 25.39 24.66 31.95 32.53 23.38 35.17 20.51 43.81 11.1 37.43 11.1"/>
      {/* i dot */}
      <path fill={fill} d="M49.39,15.79c2.04,0,3.04-.86,3.04-2.85s-1.08-2.79-3.04-2.79-3.04.72-3.04,2.79.88,2.85,3.04,2.85Z"/>
      {/* i stem */}
      <rect fill={fill} x="46.88" y="18.59" width="4.83" height="12.56"/>
      {/* l */}
      <path fill={fill} d="M55.47,10.16h4.72v20.99h-4.72V10.16Z"/>
      {/* l */}
      <path fill={fill} d="M63.95,10.16h4.72v20.99h-4.72V10.16Z"/>
      {/* S */}
      <path fill={fill} d="M71.08,25.9h5.39c.52,1.55,1.88,2.18,5.55,2.18,3.45,0,4.45-.69,4.45-1.8,0-.52-.22-.83-1.02-1.02-.8-.22-2.38-.33-5.03-.41-6.3-.19-8.76-1.49-8.76-4.64,0-1.08.3-2.02.97-2.82,1.3-1.66,3.87-2.68,7.9-2.68,5.97,0,9.2,1.69,10.36,5.52h-5.08c-.44-1.63-2.38-2.13-5.33-2.13-1.16,0-2.02.06-2.65.25-1.22.33-1.63.88-1.63,1.46,0,.47.14.8.91,1.05.77.22,2.27.36,4.92.47,3.62.14,5.91.52,7.24,1.3,1.38.75,1.85,1.88,1.85,3.54,0,3.18-3.15,5.5-9.34,5.5-6.52,0-9.89-1.85-10.69-5.77Z"/>
      {/* n */}
      <path fill={fill} d="M93.7,31.15v-15.86h4.09l.39,3.45c1.27-2.49,3.65-4.03,7.13-4.03,1.66,0,3.07.3,4.25.97,2.32,1.27,3.59,3.62,3.59,6.8v8.67h-4.75v-7.54c0-3.23-1.16-5.11-4.67-5.11s-5.25,1.91-5.25,5.64v7.02h-4.78Z"/>
      {/* a */}
      <path fill={fill} d="M122.62,31.68c-4.36,0-6.77-1.46-6.77-4.5v-.03c0-1.85.77-3.23,2.51-4.03.52-.25,1.1-.44,1.74-.64,1.3-.33,3.18-.55,6.57-.75,1.19-.08,2.1-.14,2.73-.25,1.3-.19,1.74-.55,1.74-1.24v-.03c0-.36-.11-.69-.41-1.02-.52-.64-1.77-1.08-4.06-1.08-1.38,0-2.43.08-3.2.3-1.6.36-2.27,1.13-2.4,2.4h-4.83c.52-4.23,3.92-6.08,10.03-6.08,2.07,0,3.76.19,5.17.55,2.79.77,4.23,2.54,4.23,5.99v9.86h-3.81l-.41-3.76c-1.3,2.51-4.23,4.28-8.81,4.28ZM127.74,27.64c2.18-.94,3.48-2.49,3.48-4.09v-.11c-.41.55-1.52.94-4.12,1.08-3.04.14-4.42.36-5.28.77-.66.33-.99.8-.99,1.44v.03c0,1.05.88,1.6,3.2,1.6,1.41,0,2.62-.25,3.7-.72Z"/>
      {/* p */}
      <path fill={fill} d="M143.78,28.78v8.07h-4.59V15.3h4.03l.33,2.9c1.49-2.29,4.14-3.43,7.49-3.43,5.55,0,8.95,2.93,8.95,8.56,0,2.82-1.02,4.83-2.76,6.24-1.71,1.38-3.92,2.04-6.33,2.04-3.56,0-5.83-.97-7.13-2.85ZM155.22,23.33c0-3.18-1.69-4.83-5.72-4.83-3.7,0-5.8,1.71-5.8,4.83s1.82,4.5,5.75,4.5c4.23,0,5.77-1.57,5.77-4.5Z"/>
    </svg>
  );
}

/**
 * Icon mark — just the SK lettermark from the original SVG, scaled to a square.
 * Uses the same viewBox region as the SK portion (x≈24 to x≈44, full height).
 */
function IconMark({ size: px, dark: onDark }: { size: number; dark: boolean }) {
  const fill  = onDark ? "#ffffff" : BRAND;
  const slash = onDark ? SLASH_DARK : SLASH;
  const r = Math.round(px * 0.22);
  const bg     = onDark ? "rgba(255,255,255,0.08)"  : "#eeebff";
  const border = onDark ? "rgba(255,255,255,0.15)"  : "#c4b5fd";
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 20 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SkillSnap"
      style={{ display: "block", flexShrink: 0 }}
    >
      {/* Rounded background tile */}
      <rect width="20" height="22" rx={r * (22 / px)} fill={bg} stroke={border} strokeWidth="0.8"/>
      {/* SK mark — original coords shifted so SK fills the tile */}
      {/* S */}
      <path fill={fill} transform="translate(-1.5, 2) scale(0.135)" d="M5.64,30.93c-3.29-1.08-4.94-3.26-5.64-6.77h5.03c.66,2.73,3.12,3.54,7.07,3.54,3.62,0,5.25-.69,5.25-2.32,0-.64-.22-1.1-.64-1.35-.88-.58-2.9-.72-6.93-.94-1.99-.11-3.65-.36-4.97-.77-2.62-.77-3.87-2.35-3.87-5.11,0-3.81,3.23-6.24,9.67-6.24,6.85,0,10.5,1.91,11.41,6.88h-4.94c-.55-2.51-2.82-3.01-6.55-3.01s-4.89.83-4.89,2.24c0,.69.19,1.16,1.08,1.49.86.33,2.46.55,5.22.66,2.38.11,4.28.36,5.77.77,3.01.8,4.31,2.35,4.31,5.06,0,4.23-3.09,6.68-10.03,6.68-2.6,0-4.7-.25-6.35-.8Z"/>
      {/* K left */}
      <polygon fill={fill} transform="translate(-1.5, 2) scale(0.135)" points="29.25 11.1 24.66 11.1 24.66 18.83 24.66 21.16 24.66 21.59 29.25 16.87 29.25 11.1"/>
      {/* K right lower */}
      <polygon fill={fill} transform="translate(-1.5, 2) scale(0.135)" points="34.24 24.39 38.78 31.15 43.37 31.15 36.87 21.52 34.24 24.39"/>
      {/* K slash */}
      <polygon fill={slash} transform="translate(-1.5, 2) scale(0.135)" points="37.43 11.1 24.66 25.39 24.66 31.95 32.53 23.38 35.17 20.51 43.81 11.1 37.43 11.1"/>
    </svg>
  );
}

export default function SkillSnapLogo({ variant = "full", size = "md", dark = false }: LogoProps) {
  if (variant === "icon") {
    return <IconMark size={ICON_SIZES[size]} dark={dark} />;
  }
  return <Wordmark height={FULL_HEIGHTS[size]} dark={dark} />;
}
