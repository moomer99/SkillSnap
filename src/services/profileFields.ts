// ─────────────────────────────────────────────
// SkillSnap — Public profile column list
// ─────────────────────────────────────────────
// The explicit set of `profiles` columns safe to send to any client.
//
// Never add `email` here. Column-level SELECT on profiles.email is revoked from
// anon and authenticated (supabase/migrations/007_profiles_email_privileges.sql),
// so a `select("*")` on profiles now FAILS outright rather than merely
// over-exposing. Every public read of the table must name its columns.
//
// Callers that genuinely need the signed-in user's own email should use the
// `get_own_email()` RPC, which is scoped to auth.uid().
export const PROFILE_COLUMNS = [
  "id",
  "username",
  "display_name",
  "avatar_url",
  "avatar_gradient",
  "avatar_initial",
  "bio",
  "skill",
  "location",
  "lat",
  "lng",
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
].join(", ");

// Same set, embedded under the posts → profiles author foreign key.
export const POST_AUTHOR_COLUMNS = `profiles!posts_author_id_fkey(${PROFILE_COLUMNS})`;
