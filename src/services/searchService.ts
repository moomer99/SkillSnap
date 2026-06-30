// ─────────────────────────────────────────────
// SkillSnap — Search Service (Supabase)
// Uses pg_trgm ILIKE for people, skills, locations.
// ─────────────────────────────────────────────
import { getSupabase } from "@/lib/supabase";
import { mapProfile } from "./authService";
import { mapPost } from "./postService";
import type { User, Post } from "@/types";

export interface SearchResults {
  users: User[];
  posts: Post[];
}

export const searchService = {
  async search(query: string): Promise<SearchResults> {
    const q = query.trim();
    if (!q) return { users: [], posts: [] };

    const sb = getSupabase();

    const [usersRes, postsRes] = await Promise.all([
      sb
        .from("profiles")
        .select("*")
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%,skill.ilike.%${q}%,location.ilike.%${q}%`)
        .limit(10),
      sb
        .from("posts")
        .select("*, profiles(*)")
        .or(`caption.ilike.%${q}%,skill.ilike.%${q}%,location.ilike.%${q}%`)
        .limit(10),
    ]);

    const users: User[] = (usersRes.data ?? []).map((row) =>
      mapProfile(row as Record<string, unknown>)
    );
    const posts: Post[] = (postsRes.data ?? []).map((row) =>
      mapPost(row as Record<string, unknown>, new Set(), new Set())
    );

    return { users, posts };
  },
};
