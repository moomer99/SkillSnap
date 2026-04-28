import { getSupabase } from "@/lib/supabase";
import type { Post, SkillCategory } from "@/types";

const REAL_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

const SUPABASE_CONFIGURED =
  !!REAL_SUPABASE_URL && !REAL_SUPABASE_URL.includes("your-project-ref");

function getRealPublicUrl(bucket: string, path: string): string {
  return `${REAL_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

export interface UploadPayload {
  file?: File;
  dataUrl?: string;        // pre-converted data URL for sandbox-safe demo mode
  thumbnailDataUrl?: string; // JPEG thumbnail captured from video preview
  caption: string;
  skill: SkillCategory | "";
  location: string;
}

async function getCurrentUserId(): Promise<string> {
  const sb = getSupabase();
  // getUser() makes a live API call — works regardless of localStorage session key
  const { data: { user }, error } = await sb.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");
  return user.id;
}

export const uploadService = {
  async uploadMedia(file: File): Promise<string> {
    const sb = getSupabase();
    const userId = await getCurrentUserId();

    const ext = file.name.split(".").pop() ?? "mp4";
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error } = await sb.storage.from("post-media").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;

    return getRealPublicUrl("post-media", path);
  },

  async uploadAvatar(file: File): Promise<string> {
    const sb = getSupabase();
    const userId = await getCurrentUserId();

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/avatar.${ext}`;

    const { error } = await sb.storage.from("avatars").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });
    if (error) throw error;

    // Append cache-buster so browsers/CDN don't serve a stale version of the previous avatar
    return `${getRealPublicUrl("avatars", path)}?t=${Date.now()}`;
  },

  async createPost(payload: UploadPayload): Promise<Post | null> {
    // ── Check auth first; fall back to mock if not logged in ─────────
    const sb = getSupabase();
    let userId: string | null = null;
    if (SUPABASE_CONFIGURED) {
      try { userId = await getCurrentUserId(); } catch { userId = null; }
    }

    if (!userId) {
      // Demo / unauthenticated — create a local mock post
      // Use pre-converted data URL (sandbox-safe) or fall back to object URL
      const isVideo = payload.file ? payload.file.type.startsWith("video/") : false;
      const mediaUrl = payload.dataUrl ?? (payload.file ? URL.createObjectURL(payload.file) : undefined);
      await new Promise((r) => setTimeout(r, 600));

      const { MOCK_CURRENT_USER } = await import("@/mock-data/users");
      const { randomGradient } = await import("@/mock-data/posts");

      const mockPost: Post = {
        id: `mock_post_${Date.now()}`,
        authorId: MOCK_CURRENT_USER.id,
        author: MOCK_CURRENT_USER,
        type: isVideo ? "video" : "photo",
        mediaUrl,
        thumbnailUrl: !isVideo ? mediaUrl : undefined,
        thumbnailGradient: randomGradient(`mock_${Date.now()}`),
        caption: payload.caption,
        skill: (payload.skill as SkillCategory) || undefined,
        location: payload.location || undefined,
        likes: 0,
        likedByMe: false,
        savedByMe: false,
        createdAt: new Date().toISOString(),
      };

      return mockPost;
    }

    // ── Authenticated Supabase path ───────────────────────────────────

    let mediaUrl: string | undefined;
    let thumbnailUrl: string | undefined;

    if (payload.file) {
      mediaUrl = await uploadService.uploadMedia(payload.file);
      if (payload.file.type.startsWith("image/")) {
        thumbnailUrl = mediaUrl;
      } else if (payload.thumbnailDataUrl) {
        // Upload the captured video thumbnail to Storage
        try {
          const blob = await fetch(payload.thumbnailDataUrl).then((r) => r.blob());
          const thumbFile = new File([blob], "thumbnail.jpg", { type: "image/jpeg" });
          thumbnailUrl = await uploadService.uploadMedia(thumbFile);
        } catch {
          // non-fatal — post saves without thumbnail, grid shows gradient
        }
      }
    }

    const isVideo = payload.file ? payload.file.type.startsWith("video/") : false;
    const postType: "video" | "photo" = isVideo ? "video" : "photo";

    const { data: inserted, error: insertError } = await sb
      .from("posts")
      .insert({
        author_id: userId,
        type: postType,
        media_url: mediaUrl ?? null,
        thumbnail_url: thumbnailUrl ?? null,
        thumbnail_gradient: "linear-gradient(135deg, #6c47ff, #a78bfa)",
        caption: payload.caption,
        skill: payload.skill || null,
        location: payload.location || null,
      })
      .select("id")
      .single();

    if (insertError || !inserted) throw insertError ?? new Error("Insert failed");

    if (mediaUrl) {
      try {
        await sb.from("post_media").insert({
          post_id: inserted.id,
          url: mediaUrl,
          type: postType,
          order_index: 0,
        });
      } catch {
        // non-fatal
      }
    }

    const { data: fullPost } = await sb
      .from("posts")
      .select("id, author_id, type, media_url, thumbnail_url, thumbnail_gradient, caption, skill, location, likes_count, created_at, profiles!posts_author_id_fkey(*)")
      .eq("id", inserted.id)
      .single();

    if (!fullPost) return null;

    const postRow = fullPost as Record<string, unknown>;
    if (!postRow.profiles) {
      const { data: profileRow } = await sb.from("profiles").select("*").eq("id", userId).single();
      if (profileRow) postRow.profiles = profileRow;
    }

    const { mapPost } = await import("./postService");
    return mapPost(postRow, new Set(), new Set());
  },

  async importFromSocial(_platform: "instagram" | "tiktok" | "facebook"): Promise<void> {
    // TODO: OAuth flow
  },
};
