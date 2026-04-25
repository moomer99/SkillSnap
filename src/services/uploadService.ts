import { getSupabase } from "@/lib/supabase";
import type { Post, SkillCategory } from "@/types";

export interface UploadPayload {
  file?: File;
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

    const { data: urlData } = sb.storage.from("post-media").getPublicUrl(path);
    return urlData.publicUrl;
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

    const { data: urlData } = sb.storage.from("avatars").getPublicUrl(path);
    return urlData.publicUrl;
  },

  async createPost(payload: UploadPayload): Promise<Post | null> {
    const sb = getSupabase();
    const userId = await getCurrentUserId();

    let mediaUrl: string | undefined;
    let thumbnailUrl: string | undefined;

    if (payload.file) {
      mediaUrl = await uploadService.uploadMedia(payload.file);
      if (payload.file.type.startsWith("image/")) thumbnailUrl = mediaUrl;
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
      .select("id, author_id, type, media_url, thumbnail_url, thumbnail_gradient, caption, skill, location, likes_count, created_at, profiles(*)")
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
