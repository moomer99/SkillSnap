// ─────────────────────────────────────────────
// SkillSnap — Supabase OAuth Callback Route
// Handles the redirect after Google (or any OAuth) login.
// Exchanges the auth code for a session, then redirects into the app.
// Supabase's onAuthStateChange in AppState picks up the new session automatically.
// ─────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Ensure the profile row exists — handles first-time Google login.
      // The DB trigger should have created it, but we upsert as a safety net,
      // pre-filling name and avatar from Google's OAuth metadata.
      const meta = data.user.user_metadata ?? {};
      const displayName: string =
        (meta.full_name as string) ||
        (meta.name as string) ||
        (data.user.email?.split("@")[0] ?? "User");
      const avatarUrl: string | null = (meta.avatar_url as string) || (meta.picture as string) || null;
      const username = displayName.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 30);

      await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          username,
          display_name: displayName,
          avatar_url: avatarUrl,
          avatar_initial: displayName.charAt(0).toUpperCase(),
          avatar_gradient: "linear-gradient(135deg, #6c47ff, #a78bfa)",
        },
        {
          onConflict: "id",
          ignoreDuplicates: false, // update avatar/name if returning user
        }
      );

      // Redirect into the app — client AppState will hydrate the session
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth failed or no code — redirect back to auth screen with error param
  return NextResponse.redirect(`${origin}/?auth_error=1`);
}
