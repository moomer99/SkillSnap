"use client";
// ─────────────────────────────────────────────
// SkillSnap — ConnectButton (STRICT RULE)
// Label: always "Connect"
// Icon: MessageSquare bubble beside the word
// Never rename to "Chat" or "Message"
// ─────────────────────────────────────────────
import { MessageSquare, Loader2 } from "lucide-react";

interface ConnectButtonProps {
  onClick: () => void;
  fullWidth?: boolean;
  size?: "sm" | "md";
  loading?: boolean;
  className?: string;
}

export default function ConnectButton({
  onClick,
  fullWidth = false,
  size = "md",
  loading = false,
  className = "",
}: ConnectButtonProps) {
  const height = size === "sm" ? "h-8 text-xs" : "h-9 text-sm";
  const iconSize = size === "sm" ? 13 : 16;

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`${fullWidth ? "w-full" : "px-5"} ${height} rounded-2xl font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 ${className}`}
      style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
    >
      {loading
        ? <Loader2 size={iconSize} className="animate-spin" />
        : <MessageSquare size={iconSize} strokeWidth={2.5} />
      }
      Connect
    </button>
  );
}
