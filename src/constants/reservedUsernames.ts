// ─────────────────────────────────────────────
// SkillSnap — Reserved usernames
//
// Handles that must never be claimed by a user. Most collide with real
// top-level routes (/privacy, /terms, /discover, …) that would otherwise be
// shadowed or made ambiguous by a public profile at the same path; the rest
// are reserved for the platform (admin, api, support …).
//
// Enforced at username selection only — validation going forward. No existing
// user holds any of these, so no data migration is required.
// ─────────────────────────────────────────────

/** Lower-cased, without a leading "@". */
export const RESERVED_USERNAMES: readonly string[] = [
  "privacy",
  "terms",
  "help",
  "delete-account",
  "discover",
  "review",
  "reset-password",
  "auth",
  "api",
  "admin",
  "settings",
  "about",
  "contact",
  "login",
  "signup",
  "support",
] as const;

const RESERVED_SET = new Set(RESERVED_USERNAMES);

/** True if `handle` is reserved. Tolerates a leading "@" and surrounding case. */
export function isReservedUsername(handle: string): boolean {
  return RESERVED_SET.has(handle.trim().toLowerCase().replace(/^@/, ""));
}
