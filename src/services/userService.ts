// ─────────────────────────────────────────────
// SkillSnap — User Service (Supabase)
// ─────────────────────────────────────────────
import { getSupabase, getAuthSupabase } from "@/lib/supabase";
import { mapProfile } from "./authService";
import { OWN_PROFILE_COLUMNS, PROFILE_COLUMNS, PUBLIC_PROFILE_TABLE } from "./profileFields";
import { withOwnCoordinates } from "./ownCoordinates";
import { notifyUser } from "./notifyService";
import type { User } from "@/types";

// Shared helper — always uses the auth client (real URL) so the session
// token is found regardless of sandbox proxy URL mismatch
async function getAuthUserId(): Promise<string | null> {
  const { data: { user } } = await getAuthSupabase().auth.getUser();
  return user?.id ?? null;
}

export const userService = {
  async getUser(id: string): Promise<User | null> {
    console.log("[userService.getUser] fetching profile for id:", id);
    const { data, error } = await getSupabase()
      .from(PUBLIC_PROFILE_TABLE)
      .select(PROFILE_COLUMNS)
      .eq("id", id)
      .single();
    console.log("[userService.getUser] result:", { data, error });
    if (error || !data) {
      console.warn("[userService.getUser] query failed or returned null:", error?.message ?? "no data");
      return null;
    }
    return mapProfile(data as Record<string, unknown>);
  },

  async getCurrentUser(): Promise<User | null> {
    const userId = await getAuthUserId();
    if (!userId) return null;
    // Own row: base table without lat/lng, exact pair from the RPC.
    const { data, error } = await getSupabase()
      .from("profiles")
      .select(OWN_PROFILE_COLUMNS)
      .eq("id", userId)
      .single();
    if (error || !data) return null;
    return withOwnCoordinates(mapProfile(data as Record<string, unknown>));
  },

  async searchUsers(query: string): Promise<User[]> {
    if (!query.trim()) return [];
    const { data } = await getSupabase()
      .from(PUBLIC_PROFILE_TABLE)
      .select(PROFILE_COLUMNS)
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%,skill.ilike.%${query}%,location.ilike.%${query}%`)
      .limit(20);
    return (data ?? []).map((row) => mapProfile(row as Record<string, unknown>));
  },

  async getFollowedUserIds(): Promise<Set<string>> {
    const userId = await getAuthUserId();
    if (!userId) return new Set();
    const { data } = await getSupabase()
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId);
    return new Set((data ?? []).map((r) => r.following_id as string));
  },

  async followUser(targetId: string): Promise<void> {
    const userId = await getAuthUserId();
    if (!userId) return;
    const { error } = await getAuthSupabase().from("follows").upsert(
      { follower_id: userId, following_id: targetId },
      { onConflict: "follower_id,following_id", ignoreDuplicates: true }
    );

    // Only after the row lands: the Edge Functions verify the follow exists
    // before they will send anything, so notifying first would be rejected.
    if (error) return;
    notifyUser({
      toUserId: targetId,
      type: "follow",
      data: { type: "follow", userId },
    }).catch(() => {});
  },

  async unfollowUser(targetId: string): Promise<void> {
    const userId = await getAuthUserId();
    if (!userId) return;
    await getAuthSupabase()
      .from("follows")
      .delete()
      .eq("follower_id", userId)
      .eq("following_id", targetId);
  },

  async isFollowing(targetId: string): Promise<boolean> {
    const userId = await getAuthUserId();
    if (!userId) return false;
    const { data } = await getSupabase()
      .from("follows")
      .select("follower_id")
      .eq("follower_id", userId)
      .eq("following_id", targetId)
      .maybeSingle();
    return !!data;
  },

  async updateProfile(patch: Partial<User>): Promise<User | null> {
    const userId = await getAuthUserId();
    if (!userId) return null;

    const dbPatch: Record<string, unknown> = {};
    if (patch.displayName !== undefined) dbPatch.display_name = patch.displayName;
    if (patch.username !== undefined) dbPatch.username = patch.username;
    if (patch.bio !== undefined) dbPatch.bio = patch.bio;
    if (patch.location !== undefined) dbPatch.location = patch.location;
    if (patch.lat !== undefined) dbPatch.lat = patch.lat;
    if (patch.lng !== undefined) dbPatch.lng = patch.lng;
    if (patch.locationPrivate !== undefined) dbPatch.location_private = patch.locationPrivate;
    if (patch.skill !== undefined) dbPatch.skill = patch.skill;
    if (patch.avatarUrl !== undefined) dbPatch.avatar_url = patch.avatarUrl;
    if (patch.avatarGradient !== undefined) dbPatch.avatar_gradient = patch.avatarGradient;
    if (patch.role !== undefined) dbPatch.role = patch.role;

    const { data, error } = await getAuthSupabase()
      .from("profiles")
      .update(dbPatch)
      .eq("id", userId)
      // RETURNING comes from the base table, so it uses the own-row list; the
      // exact coordinates are re-read through the RPC.
      .select(OWN_PROFILE_COLUMNS)
      .single();
    if (error || !data) return null;
    return withOwnCoordinates(mapProfile(data as Record<string, unknown>));
  },
};
