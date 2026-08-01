// ─────────────────────────────────────────────
// SkillSnap — Public profile column list
// ─────────────────────────────────────────────
// The explicit set of profile columns safe to send to any client.
//
// Never add `email` here. Column-level SELECT on profiles.email is revoked from
// anon and authenticated (supabase/migrations/007_profiles_email_privileges.sql),
// so a `select("*")` on profiles now FAILS outright rather than merely
// over-exposing. Every public read of the table must name its columns.
//
// Callers that genuinely need the signed-in user's own email should use the
// `get_own_email()` RPC, which is scoped to auth.uid().
//
// ── Read profiles through the view, not the table ──
//
// Everything public reads PUBLIC_PROFILE_TABLE (visible_profiles), never
// `profiles`. The view applies the block filter and coarsens lat/lng to a ~2km
// grid cell for anyone who set location_private; the base table does neither.
// Migration 010 revokes lat/lng on the table, at which point a select naming
// them against `profiles` fails outright — the same fail-closed shape as email.
//
// Reading your OWN row is the one exception: it comes from `profiles` with
// OWN_PROFILE_COLUMNS, which omits lat/lng, and the exact pair is fetched
// separately through the get_own_coordinates() RPC. EditProfile seeds its
// lat/lng state from the loaded profile and writes it back on save, so handing
// it the coarsened value would round the user's real location down a little
// further every time they saved.

/** The only profile relation public reads may touch. */
export const PUBLIC_PROFILE_TABLE = "visible_profiles";

const SHARED_COLUMNS = [
  "id",
  "username",
  "display_name",
  "avatar_url",
  "avatar_gradient",
  "avatar_initial",
  "bio",
  "skill",
  "location",
  "location_private",
  "jobs_done",
  "happy_percent",
  "followers_count",
  "following_count",
  "post_count",
  "is_client",
  "is_verified",
  "role",
  "created_at",
];

/**
 * For reads of OTHER people, from visible_profiles. lat/lng here are already
 * coarsened for private profiles, which is what the feed's distance sort should
 * be working from.
 */
export const PROFILE_COLUMNS = [...SHARED_COLUMNS, "lat", "lng"].join(", ");

/**
 * For reads of your OWN row, from `profiles`. No lat/lng — those come from
 * get_own_coordinates(). Also used for insert/update RETURNING, which cannot
 * come back through a view.
 */
export const OWN_PROFILE_COLUMNS = SHARED_COLUMNS.join(", ");

/**
 * The post author, embedded under posts.
 *
 * Aliased back to `profiles` so the response shape is unchanged and callers
 * keep reading `row.profiles`. The `!posts_author_id_fkey` hint is required:
 * without it PostgREST finds two candidate relationships between posts and
 * visible_profiles and returns PGRST201 rather than choosing one.
 */
export const POST_AUTHOR_COLUMNS = `profiles:${PUBLIC_PROFILE_TABLE}!posts_author_id_fkey(${PROFILE_COLUMNS})`;
