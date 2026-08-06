"use client";
// ─────────────────────────────────────────────
// SkillSnap — ConnectButton (STRICT RULE)
// Label: always "Connect"
// Icon: MessageSquare bubble beside the word
// Never rename to "Chat" or "Message"
// ─────────────────────────────────────────────
import { MessageSquare, Loader2 } from "lucide-react";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";

interface ConnectButtonProps {
  onClick: () => void;
  fullWidth?: boolean;
  size?: "sm" | "md";
  loading?: boolean;
  className?: string;
  /** Which screen the tap came from — reported as a "Connect Tapped" property. */
  source?: "feed" | "discover" | "profile";
  /** The pro being connected to, if the call site knows it. */
  targetUserId?: string;
}

export default function ConnectButton({
  onClick,
  fullWidth = false,
  size = "md",
  loading = false,
  className = "",
  source,
  targetUserId,
}: ConnectButtonProps) {
  const height = size === "sm" ? "h-8 text-xs" : "h-9 text-sm";
  const iconSize = size === "sm" ? 13 : 16;

  // Tracked here rather than at each call site so every Connect entry point is
  // covered by construction — this button is the only way to start a connect.
  function handleClick() {
    track(ANALYTICS_EVENTS.CONNECT_TAPPED, { source, targetUserId });
    onClick();
  }

  return (
    <button
      onClick={handleClick}
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
