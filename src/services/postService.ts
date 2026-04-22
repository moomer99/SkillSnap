// ─────────────────────────────────────────────
// SkillSnap — Post / Feed Service (Supabase)
// ─────────────────────────────────────────────
import { getSupabase } from "@/lib/supabase";
import { mapProfile } from "./authService";
import type { Post } from "@/types";

function mapPost(row: Record<string, unknown>, likedIds: Set<string>, savedIds: Set<string>): Post {
  const author = mapProfile(row.profiles as Record<string, unknown>);
  return {
    id: row.id as string,
    authorId: row.author_id as string,
    author,
    type: (row.type as Post["type"]) ?? "video",
    mediaUrl: (row.media_url as string | null) ?? undefined,
    thumbnailUrl: (row.thumbnail_url as string | null) ?? undefined,
    thumbnailGradient: (row.thumbnail_gradient as string) || "linear-gradient(135deg, #6c47ff, #a78bfa)",
    caption: (row.caption as string) ?? "",
    skill: (row.skill as Post["skill"]) ?? null,
    location: (row.location as string | null) ?? null,
    likes: Number(row.likes_count ?? 0),
    likedByMe: likedIds.has(row.id as string),
    savedByMe: savedIds.has(row.id as string),
    createdAt: row.created_at as string,
  };
}

async function getUserInteractionSets(postIds: string[]): Promise<{ likedIds: Set<string>; savedIds: Set<string> }> {
  const sb = getSupabase();
  const { data: { session } } = await sb.auth.getSession();
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
  async getFeed(limit = 20, offset = 0): Promise<{ posts: Post[]; likedIds: Set<string>; savedIds: Set<string> }> {
    const { data, error } = await getSupabase()
      .from("posts")
      .select("id, author_id, type, media_url, thumbnail_url, thumbnail_gradient, caption, skill, location, likes_count, created_at, profiles(*)")
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
      .from("posts")
      .select("id, author_id, type, media_url, thumbnail_url, thumbnail_gradient, caption, skill, location, likes_count, created_at, profiles(*)")
      .eq("author_id", userId)
      .order("created_at", { ascending: false });

    if (!data?.length) return [];
    const postIds = data.map((p) => p.id as string);
    const { likedIds, savedIds } = await getUserInteractionSets(postIds);
    return data.map((row) => mapPost(row as Record<string, unknown>, likedIds, savedIds));
  },

  async likePost(postId: string): Promise<void> {
    const sb = getSupabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return;
    await sb.from("likes").insert({ user_id: session.user.id, post_id: postId });
  },

  async unlikePost(postId: string): Promise<void> {
    const sb = getSupabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return;
    await sb.from("likes").delete()
      .eq("user_id", session.user.id)
      .eq("post_id", postId);
  },

  async savePost(postId: string): Promise<void> {
    const sb = getSupabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return;
    await sb.from("saved_posts").insert({ user_id: session.user.id, post_id: postId });
  },

  async unsavePost(postId: string): Promise<void> {
    const sb = getSupabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return;
    await sb.from("saved_posts").delete()
      .eq("user_id", session.user.id)
      .eq("post_id", postId);
  },

  async getSavedPosts(userId: string): Promise<Post[]> {
    const { data } = await getSupabase()
      .from("saved_posts")
      .select("posts(*, profiles(*))")
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
};

export { mapPost };
