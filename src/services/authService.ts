// ─────────────────────────────────────────────
// SkillSnap — Auth Service (Supabase Auth)
// ─────────────────────────────────────────────
import { getSupabase, getAuthSupabase } from "@/lib/supabase";
import { OWN_PROFILE_COLUMNS } from "./profileFields";
import { withOwnCoordinates } from "./ownCoordinates";
import type { User } from "@/types";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  /**
   * Set when the password didn't match. `error` is already a friendly string
   * by then, so callers can't sniff the reason out of the message — the auth
   * screen needs this to decide whether to offer the Google-account hint.
   */
  invalidCredentials?: boolean;
}

export const INVALID_CREDENTIALS_MESSAGE = "Incorrect email or password. Please try again.";

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
      // Was reading profile.ratings[0].count — a PostgREST embedded-count shape
      // that no query ever asked for, so this was 0 for every user ever loaded.
      // Migration 014 maintains the count on the profile itself.
      ratingCount: Number(profile.rating_count ?? 0),
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
  const { data, error } = await sb
    // Own row: base table without lat/lng, exact pair from the RPC.
    .from("profiles")
    .select(OWN_PROFILE_COLUMNS)
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return withOwnCoordinates(mapProfile(data as Record<string, unknown>));
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

  // Check if a profile row already exists.
  const { data: existing, error: existingError } = await sb
    .from("profiles")
    .select("id")
    .eq("id", authUser.id)
    .maybeSingle();

  if (existing) {
    // Profile exists — only update non-user-editable fields (email, username slug).
    // Never touch display_name or avatar_url after first creation.
    await sb
      .from("profiles")
      .update({ email: authUser.email ?? null })
      .eq("id", authUser.id);
    return fetchProfile(authUser.id);
  }

  // First-ever login — create the profile with display_name and avatar_url.
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
    // INSERT ... RETURNING comes from the base table, so it uses the own-row
    // list; a brand-new profile has no coordinates to fetch yet.
    .select(OWN_PROFILE_COLUMNS)
    .single();

  if (error || !data) {
    // Row may have been created by a DB trigger in the meantime — just fetch it.
    return fetchProfile(authUser.id);
  }

  return mapProfile(data as Record<string, unknown>);
}

// ── Username login ────────────────────────────────────────────────────────
// Resolving a username to its email can't happen in the browser: the anon
// role has column-level grants on `profiles` that exclude `email`, so
// select("email") comes back 42501. The username-login Edge Function does the
// resolution server-side and hands back a session, which keeps email
// addresses out of reach of the client — the same model the mobile app uses.
interface UsernameLoginResponse {
  ok?: boolean;
  reason?: string;
  error?: string;
  session?: { access_token?: string; refresh_token?: string };
  access_token?: string;
  refresh_token?: string;
}

async function logInWithUsername(username: string, password: string): Promise<AuthResult> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!baseUrl || !anonKey) {
    return { success: false, error: "Sign-in is unavailable right now. Please try again." };
  }

  let payload: UsernameLoginResponse;
  try {
    const res = await fetch(`${baseUrl}/functions/v1/username-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ username, password }),
    });
    payload = (await res.json().catch(() => ({}))) as UsernameLoginResponse;
    // The function answers 200 with ok:false for a refused login, so a bad
    // status here means the request itself was malformed or the function is
    // down — not that the credentials were wrong.
    if (!res.ok) {
      return { success: false, error: payload.error ?? "Couldn't sign you in. Please try again." };
    }
  } catch {
    return { success: false, error: "Connection error. Please try again." };
  }

  if (!payload.ok) {
    if (payload.reason === "username_not_found") {
      return { success: false, error: "No account found with that username" };
    }
    // Every other refusal means the password didn't match, whatever the
    // function chose to call it. Falling through to this rather than
    // enumerating reason strings keeps us correct if the function adds one.
    return { success: false, error: INVALID_CREDENTIALS_MESSAGE, invalidCredentials: true };
  }

  const accessToken = payload.session?.access_token ?? payload.access_token;
  const refreshToken = payload.session?.refresh_token ?? payload.refresh_token;
  if (!accessToken || !refreshToken) {
    return { success: false, error: "Couldn't sign you in. Please try again." };
  }

  // Adopt the session the function minted, so the rest of the app sees a
  // normal Supabase login from here on.
  const sb = getSupabase();
  const { data, error } = await sb.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error || !data.user) {
    return { success: false, error: "Couldn't sign you in. Please try again." };
  }

  const user = await fetchProfile(data.user.id);
  return { success: true, user: user ?? undefined };
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

  // Accepts an email address or a username, matching the mobile app. A leading
  // "@" is optional and stripped, so the presence of "@" alone can't decide
  // which one it is — "@jo_smith" contains one and is still a username.
  async logIn(emailOrUsername: string, password: string): Promise<AuthResult> {
    const sb = getSupabase();
    const raw = emailOrUsername.trim();
    if (!raw) return { success: false, error: "Please enter your email or username." };

    if (!(raw.includes("@") && !raw.startsWith("@"))) {
      const username = raw.replace(/^@/, "").toLowerCase();
      if (!username) return { success: false, error: "Please enter your email or username." };
      return logInWithUsername(username, password);
    }

    const loginEmail = raw;
    const { data, error } = await sb.auth.signInWithPassword({ email: loginEmail, password });
    if (error) {
      // Supabase says "Invalid login credentials", which reads like a system
      // fault rather than a typo. Translate here rather than at the call site
      // so the raw string can't reach a screen that forgets to map it.
      if ((error.message ?? "").toLowerCase().includes("invalid login credentials")) {
        return { success: false, error: INVALID_CREDENTIALS_MESSAGE, invalidCredentials: true };
      }
      return { success: false, error: error.message };
    }
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
