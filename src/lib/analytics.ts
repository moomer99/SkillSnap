// ─────────────────────────────────────────────
// SkillSnap — Amplitude analytics
//
// Every call here is a no-op unless ANALYTICS_CONFIG.ENABLED is true (production
// builds only, by default), so instrumented components can call these freely
// without guarding at the call site. Nothing in this module ever throws: a
// broken analytics pipe must not break a Connect tap or a post upload.
// ─────────────────────────────────────────────
import * as amplitude from "@amplitude/analytics-browser";
import { ANALYTICS_CONFIG } from "@/constants/config";

// The five funnel events. Import these rather than retyping the strings —
// Amplitude treats "Post Created" and "Post created" as two different events.
export const ANALYTICS_EVENTS = {
  APP_OPENED: "App Opened",
  VIDEO_WATCHED: "Video Watched",
  CONNECT_TAPPED: "Connect Tapped",
  POST_CREATED: "Post Created",
  SIGN_UP_COMPLETED: "Sign Up Completed",
} as const;

export type AnalyticsEvent =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

type EventProps = Record<string, string | number | boolean | undefined | null>;

let initialized = false;

function enabled(): boolean {
  return (
    typeof window !== "undefined" &&
    ANALYTICS_CONFIG.ENABLED &&
    !!ANALYTICS_CONFIG.AMPLITUDE_API_KEY
  );
}

/** Boot the SDK. Safe to call more than once — only the first call does work. */
export function initAnalytics(): void {
  if (initialized || !enabled()) return;
  initialized = true;
  try {
    amplitude.init(ANALYTICS_CONFIG.AMPLITUDE_API_KEY, {
      autocapture: {
        // Page views and sessions are cheap and useful. Element interactions
        // are not: this UI is gradient buttons and emoji chips, so autocapture
        // would fill the project with unnamed click events that no one reads.
        pageViews: true,
        sessions: true,
        formInteractions: false,
        fileDownloads: false,
        elementInteractions: false,
      },
    });
  } catch (e) {
    console.warn("[analytics] init failed:", e);
  }
}

/** Fire an event. Drops undefined/null props so they don't show as "null" in Amplitude. */
export function track(event: AnalyticsEvent, props?: EventProps): void {
  if (!enabled()) return;
  try {
    const clean = props
      ? Object.fromEntries(
          Object.entries(props).filter(([, v]) => v !== undefined && v !== null),
        )
      : undefined;
    amplitude.track(event, clean);
  } catch (e) {
    console.warn("[analytics] track failed:", event, e);
  }
}

/** Shape of the user properties Amplitude carries on every subsequent event. */
export interface AnalyticsUser {
  id: string;
  /** Pro's skill category, or "client" for viewers. */
  skill?: string | null;
  role?: "client" | "pro" | null;
  /** Suburb, e.g. "Liverpool, NSW". */
  location?: string | null;
}

// Identify is called from a React effect that re-runs on every currentUser
// change, but the values below change rarely — this keeps us from sending an
// identical identify payload on every profile refresh.
let lastIdentity = "";

/** Attach the Supabase user id and their user properties to the analytics session. */
export function identifyUser(user: AnalyticsUser): void {
  if (!enabled() || !user.id) return;

  const userType = user.skill ?? user.role ?? "client";
  const signature = `${user.id}|${userType}|${user.location ?? ""}`;
  if (signature === lastIdentity) return;
  lastIdentity = signature;

  try {
    amplitude.setUserId(user.id);
    const identity = new amplitude.Identify();
    identity.set("userId", user.id);
    identity.set("userType", userType);
    if (user.location) identity.set("location", user.location);
    amplitude.identify(identity);
  } catch (e) {
    console.warn("[analytics] identify failed:", e);
  }
}

/** Detach the user on sign-out so the next session isn't attributed to them. */
export function resetAnalyticsUser(): void {
  if (!enabled()) return;
  lastIdentity = "";
  try {
    amplitude.reset();
  } catch (e) {
    console.warn("[analytics] reset failed:", e);
  }
}
