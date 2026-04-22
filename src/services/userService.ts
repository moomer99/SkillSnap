// ─────────────────────────────────────────────
// SkillSnap — User Service (Supabase)
// ─────────────────────────────────────────────
import { getSupabase } from "@/lib/supabase";
import { mapProfile } from "./authService";
import type { User } from "@/types";

export const userService = {
  async getUser(id: string): Promise<User | null> {
    const { data, error } = await getSupabase()
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return mapProfile(data as Record<string, unknown>);
  },

  async getCurrentUser(): Promise<User | null> {
    const sb = getSupabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session?.user) return null;
    const { data, error } = await sb
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    if (error || !data) return null;
    return mapProfile(data as Record<string, unknown>);
  },

  async searchUsers(query: string): Promise<User[]> {
    if (!query.trim()) return [];
    const { data } = await getSupabase()
      .from("profiles")
      .select("*")
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%,skill.ilike.%${query}%,location.ilike.%${query}%`)
      .limit(20);
    return (data ?? []).map((row) => mapProfile(row as Record<string, unknown>));
  },

  async followUser(targetId: string): Promise<void> {
    const sb = getSupabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return;
    await sb.from("follows").insert({ follower_id: session.user.id, following_id: targetId });
  },

  async unfollowUser(targetId: string): Promise<void> {
    const sb = getSupabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return;
    await sb.from("follows")
      .delete()
      .eq("follower_id", session.user.id)
      .eq("following_id", targetId);
  },

  async isFollowing(targetId: string): Promise<boolean> {
    const sb = getSupabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return false;
    const { data } = await sb
      .from("follows")
      .select("follower_id")
      .eq("follower_id", session.user.id)
      .eq("following_id", targetId)
      .maybeSingle();
    return !!data;
  },

  async updateProfile(patch: Partial<User>): Promise<User | null> {
    const sb = getSupabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return null;

    const dbPatch: Record<string, unknown> = {};
    if (patch.displayName !== undefined) dbPatch.display_name = patch.displayName;
    if (patch.username !== undefined) dbPatch.username = patch.username;
    if (patch.bio !== undefined) dbPatch.bio = patch.bio;
    if (patch.location !== undefined) dbPatch.location = patch.location;
    if (patch.skill !== undefined) dbPatch.skill = patch.skill;
    if (patch.avatarUrl !== undefined) dbPatch.avatar_url = patch.avatarUrl;
    if (patch.avatarGradient !== undefined) dbPatch.avatar_gradient = patch.avatarGradient;

    const { data, error } = await sb
      .from("profiles")
      .update(dbPatch)
      .eq("id", session.user.id)
      .select()
      .single();
    if (error || !data) return null;
    return mapProfile(data as Record<string, unknown>);
  },
};
