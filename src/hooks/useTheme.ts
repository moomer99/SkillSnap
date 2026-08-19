"use client";
// ─────────────────────────────────────────────
// SkillSnap — theme preference
//
// Dark is the default. The chosen theme is applied as a class on <html> and
// persisted to localStorage, and layout.tsx replays it before first paint so
// there is no flash of the wrong theme on load.
//
// State lives in a module-level store rather than per-component useState:
// several components read the theme (the toggle, the nav logo), and they all
// have to re-render together when it flips.
// ─────────────────────────────────────────────
import { useCallback, useEffect, useSyncExternalStore } from "react";

export type Theme = "dark" | "light";

/** Shared with the pre-paint script in layout.tsx — keep the two in sync. */
export const THEME_STORAGE_KEY = "skillsnap-theme";

/** Light mode is unfinished — see docs/light-theme-debt.md.
    Flip to true to bring it back; nothing else needs changing.
    While false: the store reports "dark", the stored preference is neither
    adopted nor touched, and setTheme/toggleTheme are inert. The pre-paint
    script in layout.tsx and ThemeToggle both key off this flag. */
export const LIGHT_THEME_ENABLED = false;

let currentTheme: Theme = "dark";
let hydrated = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

const getSnapshot = (): Theme => (LIGHT_THEME_ENABLED ? currentTheme : "dark");
// Server and first client render must agree, so both start on the default.
// The stored preference is adopted in the effect below.
const getServerSnapshot = (): Theme => "dark";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(theme);
}

function commit(theme: Theme) {
  if (theme === currentTheme) return;
  currentTheme = theme;
  applyTheme(theme);
  listeners.forEach((l) => l());
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Adopt the stored preference once, after the first render has matched the server
  useEffect(() => {
    if (!LIGHT_THEME_ENABLED) return; // dark-only for launch; leave storage alone
    if (hydrated) return;
    hydrated = true;
    let stored: Theme = "dark";
    try {
      stored = localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
    } catch {
      // private mode / storage disabled — stay on the default
    }
    commit(stored);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    if (!LIGHT_THEME_ENABLED) return; // inert: no class change, no re-render, storage untouched
    commit(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // the theme still applies for this session
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(currentTheme === "dark" ? "light" : "dark");
  }, [setTheme]);

  return { theme, setTheme, toggleTheme };
}
