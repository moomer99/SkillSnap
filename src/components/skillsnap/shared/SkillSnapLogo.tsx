"use client";

interface LogoProps {
  variant?: "full" | "icon";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  dark?: boolean; // true = on dark bg (no invert needed, logo is already dark-friendly)
}

const ICON_SIZES = { xs: 28, sm: 36, md: 44, lg: 64, xl: 88 };
const FULL_HEIGHTS = { xs: 18, sm: 22, md: 28, lg: 38, xl: 52 };

// Font sizes mapped to size tokens (px)
const TEXT_SIZES = { xs: 14, sm: 17, md: 22, lg: 30, xl: 42 };

export default function SkillSnapLogo({ variant = "full", size = "md", dark = false }: LogoProps) {
  if (variant === "icon") {
    const px = ICON_SIZES[size];
    // On dark backgrounds render a styled mark instead of the white-bg PNG
    if (dark) {
      const fs = Math.round(px * 0.42);
      return (
        <div
          aria-label="SkillSnap"
          style={{
            width: px, height: px,
            borderRadius: Math.round(px * 0.26),
            background: "linear-gradient(135deg, #4f46e5, #6c7fff)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{
            fontSize: fs, fontWeight: 900, color: "white", letterSpacing: "-0.03em",
            fontFamily: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
            lineHeight: 1,
          }}>
            SK
          </span>
        </div>
      );
    }
    return (
      <img
        src="/skillsnap-icon.png"
        alt="SkillSnap"
        width={px}
        height={px}
        style={{ objectFit: "contain", display: "block" }}
      />
    );
  }

  // On dark backgrounds the PNG has a white bg that shows as a rectangle.
  // Render as styled text instead — matches the brand font and colour.
  if (dark) {
    const fs = TEXT_SIZES[size];
    return (
      <span
        aria-label="SkillSnap"
        style={{
          fontSize: fs,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          display: "inline-block",
          color: "white",
          fontFamily: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <span style={{ color: "#6c7fff" }}>SK</span>illSnap
      </span>
    );
  }

  const h = FULL_HEIGHTS[size];
  return (
    <img
      src="/skillsnap-logo.png"
      alt="SkillSnap"
      height={h}
      style={{ height: h, width: "auto", objectFit: "contain", display: "block" }}
    />
  );
}
