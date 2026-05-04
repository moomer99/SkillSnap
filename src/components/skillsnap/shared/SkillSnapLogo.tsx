"use client";

interface LogoProps {
  variant?: "full" | "icon";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  dark?: boolean; // true = on dark bg (no invert needed, logo is already dark-friendly)
}

const ICON_SIZES = { xs: 28, sm: 36, md: 44, lg: 64, xl: 88 };
const FULL_HEIGHTS = { xs: 18, sm: 22, md: 28, lg: 38, xl: 52 };

export default function SkillSnapLogo({ variant = "full", size = "md", dark = false }: LogoProps) {
  if (variant === "icon") {
    const px = ICON_SIZES[size];
    return (
      <img
        src="/skillsnap-icon.png"
        alt="SkillSnap"
        width={px}
        height={px}
        style={{ objectFit: "contain", display: "block", filter: dark ? "brightness(0) invert(1)" : "none" }}
      />
    );
  }

  const h = FULL_HEIGHTS[size];
  return (
    <img
      src="/skillsnap-logo.png"
      alt="SkillSnap"
      height={h}
      style={{ height: h, width: "auto", objectFit: "contain", display: "block", filter: dark ? "brightness(0) invert(1)" : "none" }}
    />
  );
}
