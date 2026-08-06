"use client";
// ─────────────────────────────────────────────
// SkillSnap — Amplitude bootstrap
// Mounted once in the root layout. Initialises the SDK and fires "App Opened".
// User identification happens later, in AppProvider, once the Supabase profile
// has hydrated — see src/state/AppState.tsx.
// ─────────────────────────────────────────────
import { useEffect } from "react";
import { ANALYTICS_EVENTS, initAnalytics, track } from "@/lib/analytics";

export default function AnalyticsProvider() {
  useEffect(() => {
    initAnalytics();
    // Strict Mode double-invokes effects in dev, but analytics is off in dev
    // builds and initAnalytics/track are idempotent enough that a duplicate
    // "App Opened" is the worst case if someone flips NEXT_PUBLIC_AMPLITUDE_DEV.
    track(ANALYTICS_EVENTS.APP_OPENED);
  }, []);

  return null;
}
