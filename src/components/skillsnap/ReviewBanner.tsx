"use client";
// ─────────────────────────────────────────────
// SkillSnap — Review Mode Banner
// Fixed amber banner at the top of the screen
// indicating read-only mode.
// ─────────────────────────────────────────────
import { useAppState } from "@/state/AppState";
import { Eye } from "lucide-react";

export default function ReviewBanner() {
  const { state } = useAppState();

  if (!state.isReviewMode) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold"
      style={{
        background: "linear-gradient(135deg, #f59e0b, #d97706)",
        color: "white",
        boxShadow: "0 2px 12px rgba(217,119,6,0.3)",
      }}
    >
      <Eye size={16} />
      Review Mode — Sample data only. Writes are disabled.
    </div>
  );
}