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
  try {
    return {
      id: (profile.id as string) ?? "",
      username: (profile.username as string) ?? "",
      displayName: (profile.display_name as string) ?? "User",
      avatarUrl: (profile.avatar_url as string | null) ?? undefined,
      avatarGradient: (profile.avatar_gradient as string) ?? "linear-gradient(135deg, #6c47ff, #a78bfa)",
      avatarInitial: (profile.avatar_initial as string) ?? "U",
      location: (profile.location as string) ?? "",
      lat: (profile.lat as number | null) ?? undefined,
      lng: (profile.lng as number | null) ?? undefined,
      locationPrivate: Boolean(profile.location_private ?? false),
      bio: (profile.bio as string) ?? "",
      skill: (profile.skill as User["skill"]) ?? null,
      isVerified: Boolean(profile.is_verified ?? false),
      jobsDone: Number(profile.jobs_done ?? 0),
      happyPercent: Number(profile.happy_percent ?? 0),
      ratingCount: Number((profile.ratings as { count: number }[] | null)?.[0]?.count ?? 0),
      followers: Number(profile.followers_count ?? 0),
      following: Number(profile.following_count ?? 0),
      postCount: Number(profile.post_count ?? 0),
      isClient: Boolean(profile.is_client ?? false),
      role: (profile.role as 'client' | 'pro' | null) ?? null,
    };
  } catch (e) {
    console.error("[mapProfile] failed to map profile:", e, profile);
    return {
      id: (profile.id as string) ?? "",
      username: (profile.username as string) ?? "",
      displayName: (profile.display_name as string) ?? "User",
      avatarUrl: undefined,
      avatarGradient: "linear-gradient(135deg, #6c47ff, #a78bfa)",
      avatarInitial: "U",
      location: "",
      lat: undefined,
      lng: undefined,
      locationPrivate: false,
      bio: "",
      skill: null,
      isVerified: false,
      jobsDone: 0,
      happyPercent: 0,
      ratingCount: 0,
      followers: 0,
      following: 0,
      postCount: 0,
      isClient: false,
      role: null,
    };
  }
}

async function fetchProfile(userId: string): Promise<User | null> {
  const sb = getAuthSupabase();
  console.log("[fetchProfile] BEFORE query for", userId);
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  console.log("[fetchProfile] AFTER query — data:", !!data, "error:", error?.message ?? "none", "code:", error?.code ?? "none");
  if (error || !data) {
    console.log("[fetchProfile] returning null");
    return null;
  }
  console.log("[fetchProfile] BEFORE mapProfile");
  const result = mapProfile(data as Record<string, unknown>);
  console.log("[fetchProfile] AFTER mapProfile, returning user");
  return result;
}

// Upserts a profile row from Supabase auth user data.
// Safe to call on every login — inserts on first login, fetches on re-login.
async function ensureProfile(authUser: SupabaseUser): Promise<User | null> {
  const sb = getAuthSupabase();
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

  console.log("[ensureProfile] checking for existing profile:", authUser.id);

  // Check if a profile row already exists.
  try {
    console.log("[ensureProfile] BEFORE profiles query");

    // Check session state before the query
    const { data: sessionCheck } = await sb.auth.getSession();
    console.log("[ensureProfile] session before query:", sessionCheck?.session ? "has session" : "NO SESSION");

    console.time("[ensureProfile] profiles query");
    const { data: existing, error: existingError } = await sb
      .from("profiles")
      .select("id")
      .eq("id", authUser.id)
      .maybeSingle();
    console.timeEnd("[ensureProfile] profiles query");
    console.log("[ensureProfile] profiles query returned. data:", !!existing, "error:", existingError?.message ?? "none");

    console.log("[ensureProfile] existing profile query:", existing ? "found" : "not found", "error:", existingError?.message ?? "none");

    if (existing) {
      console.log("[ensureProfile] profile exists, updating email");
      await sb
        .from("profiles")
        .update({ email: authUser.email ?? null })
        .eq("id", authUser.id);
      console.log("[ensureProfile] email updated, fetching full profile");
      const result = await fetchProfile(authUser.id);
      console.log("[ensureProfile] fetchProfile returned:", result ? "user" : "null");
      return result;
    }

    console.log("[ensureProfile] profile not found, inserting new profile");
    const { data, error } = await sb
      .from("profiles")
      .insert({
        id: authUser.id,
        username,
        email: authUser.email ?? null,
        display_name: displayName,
        avatar_url: avatarUrl,
        avatar_initial: avatarInitial,
        avatar_gradient: "linear-gradient(135deg, #6c47ff, #a78bfa)",
      })
      .select("*")
      .single();
    console.log("[ensureProfile] AFTER insert");

    console.log("[ensureProfile] insert result — data:", !!data, "error:", error?.message, "code:", error?.code);

    if (error || !data) {
      console.error("[ensureProfile] insert failed:", error?.message, error?.code);
      console.log("[ensureProfile] falling back to fetchProfile");
      const result = await fetchProfile(authUser.id);
      console.log("[ensureProfile] fallback fetchProfile returned:", result ? "user" : "null");
      return result;
    }

    console.log("[ensureProfile] new profile created for", authUser.id);
    console.log("[ensureProfile] BEFORE mapProfile");
    const mapped = mapProfile(data as Record<string, unknown>);
    console.log("[ensureProfile] AFTER mapProfile, returning user");
    return mapped;
  } catch (e) {
    console.error("[ensureProfile] CRASHED at line:", (e as Error).stack);
    throw e;
  }
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
        skipBrowserRedirect: false,
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

  async logIn(emailOrUsername: string, password: string): Promise<AuthResult> {
    const sb = getSupabase();
    const loginEmail = emailOrUsername.trim();
    // Require email — username-based login removed for security (exposes emails)
    if (!loginEmail.includes("@") || loginEmail.startsWith("@")) {
      return { success: false, error: "Please use your email address to log in." };
    }
    const { data, error } = await sb.auth.signInWithPassword({ email: loginEmail, password });
    if (error) return { success: false, error: error.message };
    if (!data.user) return { success: false, error: "No user returned" };
    // Fetch existing profile only — never overwrite user-edited fields on login
    const user = await fetchProfile(data.user.id);
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
