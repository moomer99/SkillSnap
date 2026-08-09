"use client";
// ─────────────────────────────────────────────
// SkillSnap — light/dark toggle
// Shows the theme you'd switch *to*: a sun while dark, a moon while light.
// ─────────────────────────────────────────────
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-white/[0.06] ${className}`}
      style={{ border: "1px solid var(--ss-line)", color: "var(--ss-text-muted)" }}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
