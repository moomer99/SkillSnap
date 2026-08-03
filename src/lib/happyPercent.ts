// ─────────────────────────────────────────────
// How a happy % is allowed to be shown.
//
// profiles.happy_percent is the weighted average of a pro's ratings —
// very_happy 100, okay 50, not_satisfied 0 — recomputed by the on_rating_change
// trigger in supabase/migrations/014_ratings_and_happy_percent.sql. The scale
// lives in the database; this file only decides when the number is worth
// printing.
//
// The rule is the sample size. One delighted client and forty delighted clients
// both store 100, and rendering them identically overstates the first. Below
// MIN_RATINGS the profile reads "New" — the same thing it read before anyone
// had rated at all, which is honest: there is not yet enough here to say.
//
// Everywhere that prints a happy % goes through this, so the threshold is one
// number in one place rather than a condition copied into five components.
// ─────────────────────────────────────────────

/** Ratings needed before a percentage is shown instead of "New". */
export const MIN_RATINGS = 3;

/**
 * The happy % as it should appear, or "New" when there is not enough behind it.
 *
 * `ratingCount` is undefined on profiles loaded from a query that did not ask
 * for rating_count — treated as not enough, so a forgotten column reads as
 * "New" rather than as an unearned 100%.
 */
export function formatHappyPercent(
  happyPercent: number | null | undefined,
  ratingCount: number | null | undefined
): string {
  if (happyPercent == null) return "New";
  if ((ratingCount ?? 0) < MIN_RATINGS) return "New";
  return `${happyPercent}%`;
}

/** True when the number has enough ratings behind it to be worth a line of UI. */
export function hasHappyPercent(
  happyPercent: number | null | undefined,
  ratingCount: number | null | undefined
): boolean {
  return happyPercent != null && (ratingCount ?? 0) >= MIN_RATINGS;
}
