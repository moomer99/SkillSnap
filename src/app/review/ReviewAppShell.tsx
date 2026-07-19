"use client";
// ─────────────────────────────────────────────
// SkillSnap — Review Mode App Shell (Client)
// Dispatches SET_REVIEW_MODE on mount to enable
// read-only mode in the AppState reducer.
// ─────────────────────────────────────────────
import { useEffect } from "react";
import SkillSnapApp from "@/app/page";

export default function ReviewAppShell() {
  useEffect(() => {
    // Dispatch SET_REVIEW_MODE to enable read-only guards in AppState
    // We use a custom event because AppProvider is mounted inside SkillSnapApp
    // and may not have rendered yet on first tick
    const timer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent("skillsnap:review-mode", { detail: { active: true } }));
    }, 100);

    return () => {
      clearTimeout(timer);
      window.dispatchEvent(new CustomEvent("skillsnap:review-mode", { detail: { active: false } }));
    };
  }, []);

  return <SkillSnapApp />;
}