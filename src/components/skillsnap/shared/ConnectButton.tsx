"use client";
// ─────────────────────────────────────────────
// SkillSnap — ConnectButton (STRICT RULE)
// Label: always "Connect"
// Icon: MessageSquare bubble beside the word
// Never rename to "Chat" or "Message"
// ─────────────────────────────────────────────
import { MessageSquare } from "lucide-react";

interface ConnectButtonProps {
  onClick: () => void;
  fullWidth?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export default function ConnectButton({
  onClick,
  fullWidth = false,
  size = "md",
  className = "",
}: ConnectButtonProps) {
  const height = size === "sm" ? "h-9 text-xs" : "h-11 text-sm";
  const iconSize = size === "sm" ? 13 : 16;

  return (
    <button
      onClick={onClick}
      className={`${fullWidth ? "w-full" : "px-5"} ${height} rounded-2xl font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${className}`}
      style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
    >
      <MessageSquare size={iconSize} strokeWidth={2.5} />
      Connect
    </button>
  );
}
