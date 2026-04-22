// ─────────────────────────────────────────────
// SkillSnap — Auth Service (Supabase Auth)
// ─────────────────────────────────────────────
import { getSupabase } from "@/lib/supabase";
import type { User } from "@/types";

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
    bio: (profile.bio as string) ?? "",
    skill: (profile.skill as User["skill"]) ?? null,
    isVerified: Boolean(profile.is_verified),
    jobsDone: Number(profile.jobs_done ?? 0),
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

export const authService = {
  // ── Google OAuth ────────────────────────────────────────────────────────
  // Starts the Google OAuth flow. Supabase redirects back to /auth/callback,
  // which exchanges the code for a session and redirects into the app.
  async signInWithGoogle(): Promise<{ error?: string }> {
    const sb = getSupabase();
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/auth/callback`;

    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
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

    // Profile auto-created by DB trigger; fetch it
    const user = await fetchProfile(data.user.id);
    return { success: true, user: user ?? undefined };
  },

  async logIn(email: string, password: string): Promise<AuthResult> {
    const sb = getSupabase();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    if (!data.user) return { success: false, error: "No user returned" };
    const user = await fetchProfile(data.user.id);
    return { success: true, user: user ?? undefined };
  },

  async logOut(): Promise<void> {
    await getSupabase().auth.signOut();
  },

  async getCurrentUser(): Promise<User | null> {
    const sb = getSupabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session?.user) return null;
    return fetchProfile(session.user.id);
  },

  async getSession() {
    const { data: { session } } = await getSupabase().auth.getSession();
    return session;
  },

  isAuthenticated(): boolean {
    // Synchronous check not reliable with async Supabase; use getCurrentUser() instead
    return false;
  },
};

// Re-export mapProfile for use in other services
export { mapProfile };
