"use client";
// ─────────────────────────────────────────────
// SkillSnap — User Avatar
// Integration point: replace gradient with real
// image using next/image when media URLs exist
// ─────────────────────────────────────────────
import type { User } from "@/types";

interface UserAvatarProps {
  user: Pick<User, "avatarInitial" | "avatarGradient" | "isVerified">;
  size?: "xs" | "sm" | "md" | "lg";
  showVerified?: boolean;
  onClick?: () => void;
  ring?: boolean;
}

const SIZE_MAP = {
  xs: "w-7 h-7 text-xs",
  sm: "w-9 h-9 text-sm",
  md: "w-12 h-12 text-base",
  lg: "w-20 h-20 text-2xl",
};

const BADGE_SIZE_MAP = {
  xs: "w-4 h-4 -bottom-0.5 -right-0.5",
  sm: "w-4 h-4 -bottom-0.5 -right-0.5",
  md: "w-5 h-5 -bottom-0.5 -right-0.5",
  lg: "w-6 h-6 -bottom-1 -right-1",
};

export default function UserAvatar({
  user,
  size = "md",
  showVerified = false,
  onClick,
  ring = false,
}: UserAvatarProps) {
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      onClick={onClick}
      className={`relative flex-shrink-0 ${SIZE_MAP[size]} rounded-full flex items-center justify-center text-white font-bold ${ring ? "ring-2 ring-white/40" : ""}`}
      style={{ background: user.avatarGradient }}
    >
      {user.avatarInitial}
      {showVerified && user.isVerified && (
        <span className={`absolute ${BADGE_SIZE_MAP[size]} rounded-full bg-[#6c47ff] flex items-center justify-center ring-2 ring-white`}>
          <svg width="8" height="6" viewBox="0 0 8 6" fill="white">
            <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </Tag>
  );
}
