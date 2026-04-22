"use client";
// ─────────────────────────────────────────────
// SkillSnap — Brand Logo Mark
// ─────────────────────────────────────────────
import { APP_CONFIG } from "@/constants/config";

interface LogoProps {
  showName?: boolean;
  size?: "sm" | "md";
}

export default function Logo({ showName = true, size = "md" }: LogoProps) {
  const boxSize = size === "sm" ? "w-6 h-6 rounded-md" : "w-7 h-7 rounded-lg";
  const iconSize = size === "sm" ? 12 : 14;
  const textSize = size === "sm" ? "text-base" : "text-lg";

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`${boxSize} flex items-center justify-center`}
        style={{ background: "linear-gradient(135deg, #6c47ff, #a78bfa)" }}
      >
        <svg width={iconSize} height={iconSize} viewBox="0 0 40 40" fill="none">
          <path d="M20 6L34 14V26L20 34L6 26V14L20 6Z" stroke="white" strokeWidth="3" fill="none" />
          <circle cx="20" cy="20" r="5" fill="white" />
        </svg>
      </div>
      {showName && (
        <span className={`${textSize} font-bold text-[#1a1a1a] tracking-tight`}>
          {APP_CONFIG.name}
        </span>
      )}
    </div>
  );
}
