// ─────────────────────────────────────────────
// SkillSnap — Public (anonymous) Supabase client
//
// Used by server-rendered public surfaces (/@username, sitemap) that must work
// for logged-out visitors. Deliberately does NOT read cookies, so pages using it
// stay statically renderable / cacheable instead of being forced dynamic.
//
// NOTE: the `profiles` table has column-level grants for the anon role —
// `select("*")` is rejected with "permission denied for table profiles".
// Always select an explicit column list.
// ─────────────────────────────────────────────
import { createClient } from "@supabase/supabase-js";

export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

// Columns the anon role is allowed to read from `profiles`.
export const PUBLIC_PROFILE_COLUMNS =
  "id, username, display_name, avatar_url, avatar_gradient, avatar_initial, " +
  "location, bio, skill, is_verified, jobs_done, happy_percent, " +
  "followers_count, post_count, role, created_at";

export const PUBLIC_POST_COLUMNS =
  "id, author_id, type, media_url, thumbnail_url, thumbnail_gradient, caption, " +
  "likes_count, comments_count, recommend_count, skill, location, created_at";

export interface PublicProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  avatar_gradient: string | null;
  avatar_initial: string | null;
  location: string | null;
  bio: string | null;
  skill: string | null;
  is_verified: boolean | null;
  jobs_done: number | null;
  happy_percent: number | null;
  followers_count: number | null;
  post_count: number | null;
  role: "client" | "pro" | null;
  created_at: string;
}

export interface PublicPost {
  id: string;
  author_id: string;
  type: "video" | "photo";
  media_url: string | null;
  thumbnail_url: string | null;
  thumbnail_gradient: string | null;
  caption: string | null;
  likes_count: number | null;
  comments_count: number | null;
  recommend_count: number | null;
  skill: string | null;
  location: string | null;
  created_at: string;
}
