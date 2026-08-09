// ─────────────────────────────────────────────
// SkillSnap — Post / Feed Service (Supabase)
// ─────────────────────────────────────────────
import { getSupabase } from "@/lib/supabase";
import { mapProfile } from "./authService";
import type { Post } from "@/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

// Rewrite Supabase storage URLs to go through our local proxy in the browser,
// since the sandbox blocks direct browser requests to external domains.
function proxyMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (typeof window !== "undefined" && url.startsWith(SUPABASE_URL)) {
    return url.replace(SUPABASE_URL, `${window.location.origin}/supabase`);
  }
  return url;
}

const FALLBACK_PROFILE: Record<string, unknown> = {
  id: "",
  username: "unknown",
  display_name: "Unknown User",
  avatar_initial: "?",
  avatar_gradient: "linear-gradient(135deg, #6c47ff, #a78bfa)",
  location: "",
  bio: "",
  skill: null,
  is_verified: false,
  jobs_done: 0,
  followers_count: 0,
  following_count: 0,
  post_count: 0,
  is_client: false,
};

function mapPost(row: Record<string, unknown>, likedIds: Set<string>, savedIds: Set<string>): Post {
  const author = mapProfile((row.profiles as Record<string, unknown>) ?? FALLBACK_PROFILE);

  // Map post_media rows if present
  const rawMedia = row.post_media as Array<Record<string, unknown>> | null;
  const mediaItems = rawMedia && rawMedia.length > 0
    ? rawMedia
        .sort((a, b) => Number(a.order_index ?? 0) - Number(b.order_index ?? 0))
        .map((m) => ({
          url: proxyMediaUrl(m.url as string) ?? "",
          type: (m.type as "video" | "photo") ?? "photo",
          orderIndex: Number(m.order_index ?? 0),
        }))
    : undefined;

  return {
    id: row.id as string,
    authorId: row.author_id as string,
    author,
    type: (row.type as Post["type"]) ?? "video",
    mediaUrl: proxyMediaUrl(row.media_url as string | null),
    thumbnailUrl: proxyMediaUrl(row.thumbnail_url as string | null),
    thumbnailGradient: (row.thumbnail_gradient as string) || "linear-gradient(135deg, #6c47ff, #a78bfa)",
    mediaItems,
    caption: (row.caption as string) ?? "",
    skill: (row.skill as Post["skill"]) ?? null,
    location: (row.location as string | null) ?? null,
    likes: Number(row.likes_count ?? 0),
    commentsCount: Number(row.comments_count ?? 0),
    recommendCount: Number(row.recommend_count ?? 0),
    likedByMe: likedIds.has(row.id as string),
    savedByMe: savedIds.has(row.id as string),
    viewCount: Number(row.view_count ?? 0) || undefined,
    createdAt: row.created_at as string,
  };
}

async function getUserInteractionSets(postIds: string[]): Promise<{ likedIds: Set<string>; savedIds: Set<string> }> {
  const sb = getSupabase();
  const { data: { user: _authUser } } = await sb.auth.getUser(); const session = _authUser ? { user: _authUser } : null;
  if (!session || postIds.length === 0) return { likedIds: new Set(), savedIds: new Set() };

  const [likesRes, savedRes] = await Promise.all([
    sb.from("likes").select("post_id").eq("user_id", session.user.id).in("post_id", postIds),
    sb.from("saved_posts").select("post_id").eq("user_id", session.user.id).in("post_id", postIds),
  ]);

  return {
    likedIds: new Set((likesRes.data ?? []).map((r) => r.post_id)),
    savedIds: new Set((savedRes.data ?? []).map((r) => r.post_id)),
  };
}

export const postService = {
  async getFeed(limit = 10, offset = 0): Promise<{ posts: Post[]; likedIds: Set<string>; savedIds: Set<string> }> {
    // visible_posts is the moderated view over posts; it also carries the
    // comments_count / recommend_count counters the feed cards display.
    const { data, error } = await getSupabase()
      .from("visible_posts")
      .select("id, author_id, type, media_url, thumbnail_url, thumbnail_gradient, caption, skill, location, likes_count, comments_count, recommend_count, created_at, profiles!posts_author_id_fkey(*), post_media(url, type, order_index)")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    if (!data?.length) return { posts: [], likedIds: new Set(), savedIds: new Set() };

    const postIds = data.map((p) => p.id as string);
    const { likedIds, savedIds } = await getUserInteractionSets(postIds);
    const posts = data.map((row) => mapPost(row as Record<string, unknown>, likedIds, savedIds));
    return { posts, likedIds, savedIds };
  },

  async getUserPosts(userId: string): Promise<Post[]> {
    const { data } = await getSupabase()
      .from("visible_posts")
      .select("id, author_id, type, media_url, thumbnail_url, thumbnail_gradient, caption, skill, location, likes_count, comments_count, recommend_count, created_at, profiles!posts_author_id_fkey(*), post_media(url, type, order_index)")
      .eq("author_id", userId)
      .order("created_at", { ascending: false });

    if (!data?.length) return [];
    const postIds = data.map((p) => p.id as string);
    const { likedIds, savedIds } = await getUserInteractionSets(postIds);
    return data.map((row) => mapPost(row as Record<string, unknown>, likedIds, savedIds));
  },

  async likePost(postId: string): Promise<void> {
    const sb = getSupabase();
    const { data: { user: _authUser } } = await sb.auth.getUser(); const session = _authUser ? { user: _authUser } : null;
    if (!session) return;
    // upsert avoids duplicate-key error on double-tap
    await sb.from("likes").upsert(
      { user_id: session.user.id, post_id: postId },
      { onConflict: "user_id,post_id", ignoreDuplicates: true }
    );
  },

  async unlikePost(postId: string): Promise<void> {
    const sb = getSupabase();
    const { data: { user: _authUser } } = await sb.auth.getUser(); const session = _authUser ? { user: _authUser } : null;
    if (!session) return;
    await sb.from("likes").delete()
      .eq("user_id", session.user.id)
      .eq("post_id", postId);
  },

  async savePost(postId: string): Promise<void> {
    const sb = getSupabase();
    const { data: { user: _authUser } } = await sb.auth.getUser(); const session = _authUser ? { user: _authUser } : null;
    if (!session) return;
    await sb.from("saved_posts").upsert(
      { user_id: session.user.id, post_id: postId },
      { onConflict: "user_id,post_id", ignoreDuplicates: true }
    );
  },

  async unsavePost(postId: string): Promise<void> {
    const sb = getSupabase();
    const { data: { user: _authUser } } = await sb.auth.getUser(); const session = _authUser ? { user: _authUser } : null;
    if (!session) return;
    await sb.from("saved_posts").delete()
      .eq("user_id", session.user.id)
      .eq("post_id", postId);
  },

  async getSavedPosts(userId: string): Promise<Post[]> {
    const { data } = await getSupabase()
      .from("saved_posts")
      .select("posts(*, profiles!posts_author_id_fkey(*))")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!data?.length) return [];
    const posts = data.map((row) => (row as Record<string, unknown>).posts as Record<string, unknown>).filter(Boolean);
    const postIds = posts.map((p) => p.id as string);
    const { likedIds, savedIds } = await getUserInteractionSets(postIds);
    return posts.map((row) => mapPost(row, likedIds, savedIds));
  },

  async sharePost(_postId: string): Promise<string> {
    return "";
  },

  async updatePost(postId: string, patch: { caption?: string; skill?: string | null; location?: string }): Promise<void> {
    const sb = getSupabase();
    const { data: { user: authUser } } = await sb.auth.getUser();
    if (!authUser) return;
    await sb.from("posts").update(patch).eq("id", postId).eq("author_id", authUser.id);
  },

  async deletePost(postId: string): Promise<void> {
    const sb = getSupabase();
    const { data: { user: authUser } } = await sb.auth.getUser();
    if (!authUser) return;
    await sb.from("posts").delete().eq("id", postId).eq("author_id", authUser.id);
  },
};

export { mapPost };
