// ─────────────────────────────────────────────
// SkillSnap — Supabase OAuth Callback Route
//
// Uses @supabase/ssr createServerClient so the PKCE code verifier is read
// from cookies (where the browser client stored it) and the exchange succeeds
// server-side. After exchange the session cookie is set and the user is
// redirected to the app root where onAuthStateChange fires SIGNED_IN.
// ─────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    console.error("[auth/callback] OAuth error:", error, errorDescription);
    return NextResponse.redirect(
      `${origin}/?auth_error=1&reason=${encodeURIComponent(errorDescription ?? error)}`
    );
  }

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

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      console.error("[auth/callback] exchangeCodeForSession failed:", exchangeError.message);
      return NextResponse.redirect(
        `${origin}/?auth_error=1&reason=${encodeURIComponent(exchangeError.message)}`
      );
    }

    if (data.session) {
      const isRecovery = data.user?.recovery_sent_at != null;
      if (isRecovery) {
        console.log("[auth/callback] recovery session detected, redirecting to /reset-password");
        return NextResponse.redirect(`${origin}/reset-password`);
      }
    }

    console.log("[auth/callback] PKCE exchange succeeded, redirecting to", next);
    return NextResponse.redirect(`${origin}${next}`);
  }

  // No PKCE code — may be implicit flow, let client handle the hash token
  return NextResponse.redirect(`${origin}/`);
}
