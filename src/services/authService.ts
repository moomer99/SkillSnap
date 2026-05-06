// ─────────────────────────────────────────────
// SkillSnap — Auth Service (Supabase Auth)
// ─────────────────────────────────────────────
import { getSupabase, getAuthSupabase } from "@/lib/supabase";
import type { User } from "@/types";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

function mapProfile(profile: Record<string, unknown>): User {
  return {
    id: profile.id as string,
    username: profile.username as string,
    displayName: profile.display_name as string,
    avatarUrl: (profile.avatar_url as string | null) ?? undefined,
    avatarGradient: profile.avatar_gradient as string,
    avatarInitial: profile.avatar_initial as string,
    location: (profile.location as string) ?? "",
    lat: (profile.lat as number | null) ?? undefined,
    lng: (profile.lng as number | null) ?? undefined,
    locationPrivate: Boolean(profile.location_private ?? false),
    bio: (profile.bio as string) ?? "",
    skill: (profile.skill as User["skill"]) ?? null,
    isVerified: Boolean(profile.is_verified),
    jobsDone: Number(profile.jobs_done ?? 0),
    happyPercent: Number(profile.happy_percent ?? 0),
    followers: Number(profile.followers_count ?? 0),
    following: Number(profile.following_count ?? 0),
    postCount: Number(profile.post_count ?? 0),
    isClient: Boolean(profile.is_client),
  };
}

async function fetchProfile(userId: string): Promise<User | null> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return mapProfile(data as Record<string, unknown>);
}

// Upserts a profile row from Supabase auth user data.
// Safe to call on every login — uses ON CONFLICT to prevent duplicates.
async function ensureProfile(authUser: SupabaseUser): Promise<User | null> {
  const sb = getSupabase();
  const meta = authUser.user_metadata ?? {};

  const displayName: string =
    (meta.full_name as string) ||
    (meta.name as string) ||
    (meta.display_name as string) ||
    (authUser.email?.split("@")[0] ?? "User");

  const rawUsername =
    (meta.username as string) ||
    displayName.toLowerCase().replace(/[^a-z0-9_]/g, "_");
  // Make username unique by appending first 4 chars of the user id
  const username = rawUsername.slice(0, 26) + "_" + authUser.id.replace(/-/g, "").slice(0, 4);

  const avatarUrl: string | null =
    (meta.avatar_url as string) || (meta.picture as string) || null;

  const avatarInitial = displayName.charAt(0).toUpperCase();

  const { data, error } = await sb
    .from("profiles")
    .upsert(
      {
        id: authUser.id,
        username,
        display_name: displayName,
        email: authUser.email ?? null,
        avatar_url: avatarUrl,
        avatar_initial: avatarInitial,
        avatar_gradient: "linear-gradient(135deg, #6c47ff, #a78bfa)",
      },
      {
        onConflict: "id",
        // For returning users: refresh avatar and name from the provider
        ignoreDuplicates: false,
      }
    )
    .select("*")
    .single();

  if (error || !data) {
    // Upsert failed — try plain fetch in case the row exists
    return fetchProfile(authUser.id);
  }
  return mapProfile(data as Record<string, unknown>);
}

export const authService = {
  // ── Google OAuth ────────────────────────────────────────────────────────
  // Starts the Google OAuth flow. Supabase redirects back to /auth/callback,
  // which exchanges the code for a session and redirects into the app.
  async signInWithGoogle(): Promise<{ error?: string }> {
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/auth/callback`;

    const { error } = await getAuthSupabase().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "select_account",
        },
      },
    });
    if (error) return { error: error.message };
    return {};
  },

  async signUp(email: string, password: string, displayName?: string): Promise<AuthResult> {
    const sb = getSupabase();
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName ?? email.split("@")[0],
          username: email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_"),
        },
      },
    });
    if (error) return { success: false, error: error.message };
    if (!data.user) return { success: false, error: "No user returned" };

    // Ensure profile exists — DB trigger may not fire immediately for email signups
    const user = await ensureProfile(data.user);
    return { success: true, user: user ?? undefined };
  },

  async logIn(email: string, password: string): Promise<AuthResult> {
    const sb = getSupabase();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    if (!data.user) return { success: false, error: "No user returned" };
    // Ensure profile row exists (handles users created before migration or via admin)
    const user = await ensureProfile(data.user);
    return { success: true, user: user ?? undefined };
  },

  async logOut(): Promise<void> {
    await getSupabase().auth.signOut();
  },

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await getAuthSupabase().auth.getUser();
    if (!user) return null;
    return fetchProfile(user.id);
  },

  async getSession() {
    const { data: { user } } = await getAuthSupabase().auth.getUser();
    return user ? { user } : null;
  },

  isAuthenticated(): boolean {
    // Synchronous check not reliable with async Supabase; use getCurrentUser() instead
    return false;
  },
};

// Re-export helpers for use in other services and AppState
export { mapProfile, ensureProfile };
