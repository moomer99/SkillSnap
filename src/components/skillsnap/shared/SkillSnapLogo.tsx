"use client";

interface LogoProps {
  variant?: "full" | "icon";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  dark?: boolean;
}

// Full wordmark heights (px)
const FULL_HEIGHTS = { xs: 18, sm: 22, md: 28, lg: 38, xl: 52 };
// Icon sizes (px)
const ICON_SIZES   = { xs: 28, sm: 36, md: 44, lg: 64, xl: 88 };

// Brand blue — matches the logo provided
const BLUE = "#4f52e8";
// Dark slash inside the K
const SLASH = "#1a1a2e";

/**
 * Full wordmark: "SkillSnap" in brand blue with dark diagonal slash on the K.
 * Built as an inline SVG — no PNG, no white background, works on any surface.
 *
 * Viewbox is hand-tuned to match the proportions of the provided logo image.
 */
function Wordmark({ height, dark: onDark }: { height: number; dark: boolean }) {
  const color = onDark ? "#ffffff" : BLUE;
  const slash  = onDark ? "rgba(255,255,255,0.15)" : SLASH;
  // Aspect ratio of the wordmark ≈ 5.4 : 1
  const width = Math.round(height * 5.4);
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 540 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SkillSnap"
      style={{ display: "block", flexShrink: 0 }}
    >
      {/* ── Text rendered as path-like shapes via SVG text for crispness ── */}
      <text
        x="0"
        y="82"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontSize="95"
        fontWeight="800"
        fill={color}
        letterSpacing="-2"
      >
        SkillSnap
      </text>
      {/*
        Dark diagonal slash over the K.
        The K starts at approx x=57, the slash runs from top-right to bottom-left
        through the centre of the K stroke.
      */}
      <polygon
        points="100,4  116,4  79,96  63,96"
        fill={slash}
      />
    </svg>
  );
}

/**
 * Icon mark: rounded square with "SK" in brand blue and the same dark slash on K.
 */
function IconMark({ size: px, dark: onDark }: { size: number; dark: boolean }) {
  const bg      = onDark ? "rgba(255,255,255,0.1)"  : "#eef0fd";
  const border  = onDark ? "rgba(255,255,255,0.18)" : "#c7cafc";
  const color   = onDark ? "#ffffff"                 : BLUE;
  const slash   = onDark ? "rgba(255,255,255,0.18)"  : SLASH;
  const r       = Math.round(px * 0.22);
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SkillSnap"
      style={{ display: "block", flexShrink: 0 }}
    >
      {/* Background tile */}
      <rect width="100" height="100" rx={r * (100 / px)} fill={bg} stroke={border} strokeWidth="2"/>
      {/* "SK" letters */}
      <text
        x="10"
        y="72"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontSize="64"
        fontWeight="900"
        fill={color}
        letterSpacing="-3"
      >
        SK
      </text>
      {/* Diagonal slash over the K — runs top-right to bottom-left */}
      <polygon
        points="72,10  82,10  52,90  42,90"
        fill={slash}
      />
    </svg>
  );
}

export default function SkillSnapLogo({ variant = "full", size = "md", dark = false }: LogoProps) {
  if (variant === "icon") {
    return <IconMark size={ICON_SIZES[size]} dark={dark} />;
  }
  return <Wordmark height={FULL_HEIGHTS[size]} dark={dark} />;
}
