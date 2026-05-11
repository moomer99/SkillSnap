// ─────────────────────────────────────────────
// SkillSnap — Supabase OAuth Callback Route
//
// PKCE flow: the code verifier is stored in the *browser's* localStorage by the
// Supabase JS client. A server-side handler can never access it, so calling
// exchangeCodeForSession() here always fails with "Unable to exchange external code".
//
// Instead we forward the raw ?code= param to the app root and let the browser-side
// Supabase client (detectSessionInUrl: true + flowType: 'pkce') complete the exchange.
// onAuthStateChange in AppState then picks up the resulting SIGNED_IN event.
// ─────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
 const next = searchParams.get("next") ?? "/feed";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    console.error("[auth/callback] OAuth error:", error, errorDescription);
    return NextResponse.redirect(
      `${origin}/?auth_error=1&reason=${encodeURIComponent(errorDescription ?? error)}`
    );
  }

  if (code) {
    // Forward the code to the SPA — the browser Supabase client will exchange it
    // using the PKCE verifier it stored in localStorage during signInWithOAuth.
    const redirectUrl = new URL(origin + next);
    redirectUrl.searchParams.set("code", code);
    return NextResponse.redirect(redirectUrl.toString());
  }

  return NextResponse.redirect(`${origin}/?auth_error=1&reason=no_code`);
}
