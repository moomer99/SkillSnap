import { getSupabase, getAuthSupabase } from "@/lib/supabase";
import { OWN_PROFILE_COLUMNS, POST_AUTHOR_COLUMNS } from "./profileFields";
import type { Post, SkillCategory } from "@/types";

const REAL_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

const SUPABASE_CONFIGURED =
  !!REAL_SUPABASE_URL && !REAL_SUPABASE_URL.includes("your-project-ref");

function getPublicUrl(bucket: string, path: string): string {
  // Use the SDK — works for both public and signed URL buckets,
  // and avoids hand-rolled strings that silently 403 on private buckets.
  const { data } = getAuthSupabase().storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export interface UploadPayload {
  files?: File[];           // replaces single file
  file?: File;              // keep for backward compat
  dataUrls?: string[];      // replaces single dataUrl
  dataUrl?: string;         // keep for backward compat
  thumbnailDataUrl?: string; // JPEG thumbnail captured from video preview
  caption: string;
  skill: SkillCategory | "";
  location: string;
}

async function getCurrentUserId(): Promise<string> {
  // Always use the auth client (real URL) — proxy client has different storage key
  const { data: { user }, error } = await getAuthSupabase().auth.getUser();
  if (error || !user) throw new Error("Not authenticated");
  return user.id;
}

export const uploadService = {
  async uploadMedia(file: File): Promise<string> {
    const sb = getAuthSupabase();
    const userId = await getCurrentUserId();

    const ext = file.name.split(".").pop() ?? "mp4";
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error } = await sb.storage.from("post-media").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;

    return getPublicUrl("post-media", path);
  },

  async uploadAvatar(file: File): Promise<string> {
    // Use the auth/real-URL client for storage — proxy rewrites can drop
    // multipart bodies or auth headers on file uploads
    const sb = getAuthSupabase();
    const userId = await getCurrentUserId();

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/avatar.${ext}`;

    const { error } = await sb.storage.from("avatars").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });
    if (error) throw error;

    // Append cache-buster so browsers/CDN don't serve a stale version
    return `${getPublicUrl("avatars", path)}?t=${Date.now()}`;
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
      // Use pre-converted data URLs (sandbox-safe) or fall back to object URL
      const firstFile = (payload.files ?? (payload.file ? [payload.file] : []))[0];
      const isVideo = firstFile ? firstFile.type.startsWith("video/") : false;
      const mediaUrl = payload.dataUrls?.[0] ?? payload.dataUrl ?? (firstFile ? URL.createObjectURL(firstFile) : undefined);
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

    const allFiles = payload.files ?? (payload.file ? [payload.file] : []);
    const mediaUrls: string[] = [];
    let thumbnailUrl: string | undefined;

    for (let i = 0; i < allFiles.length; i++) {
      const file = allFiles[i];
      const url = await uploadService.uploadMedia(file);
      mediaUrls.push(url);
      if (i === 0) {
        if (file.type.startsWith("image/")) {
          thumbnailUrl = url;
        } else if (payload.thumbnailDataUrl) {
          try {
            const blob = await fetch(payload.thumbnailDataUrl).then((r) => r.blob());
            const thumbFile = new File([blob], "thumbnail.jpg", { type: "image/jpeg" });
            thumbnailUrl = await uploadService.uploadMedia(thumbFile);
          } catch { /* non-fatal */ }
        }
      }
    }

    const mediaUrl = mediaUrls[0];
    const isVideo = allFiles[0]?.type.startsWith("video/") ?? false;
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

    if (mediaUrls.length > 0) {
      for (let i = 0; i < mediaUrls.length; i++) {
        const file = allFiles[i];
        try {
          await sb.from("post_media").insert({
            post_id: inserted.id,
            url: mediaUrls[i],
            type: file?.type.startsWith("video/") ? "video" : "photo",
            order_index: i,
          });
        } catch { /* non-fatal */ }
      }
    }

    const { data: fullPost } = await sb
      .from("posts")
      .select(`id, author_id, type, media_url, thumbnail_url, thumbnail_gradient, caption, skill, location, likes_count, created_at, ${POST_AUTHOR_COLUMNS}`)
      .eq("id", inserted.id)
      .single();

    if (!fullPost) return null;

    const postRow = fullPost as Record<string, unknown>;
    if (!postRow.profiles) {
      const { data: profileRow } = await sb.from("profiles").select(OWN_PROFILE_COLUMNS).eq("id", userId).single();
      if (profileRow) postRow.profiles = profileRow;
    }

    const { mapPost } = await import("./postService");
    const post = mapPost(postRow, new Set(), new Set());

    // Claim early bird if this is the user's first post
    try {
      const { getAuthSupabase } = await import('@/lib/supabase');
      const authSb = getAuthSupabase();
      const { data: { user } } = await authSb.auth.getUser();
      if (user) {
        const { count } = await authSb
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', user.id);
        if (count === 1) {
          await authSb.rpc('claim_early_bird', { user_id: user.id });
        }
      }
    } catch (e) {
      console.warn('[UploadService] early bird claim failed:', e);
    }

    return post;
  },

  async importFromSocial(_platform: "instagram" | "tiktok" | "facebook"): Promise<void> {
    // TODO: OAuth flow
  },
};
