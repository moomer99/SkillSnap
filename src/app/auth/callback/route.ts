import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
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
    const supabase = await createClient();
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("[auth/callback] exchangeCodeForSession failed:", exchangeError.message);
      return NextResponse.redirect(
        `${origin}/?auth_error=1&reason=${encodeURIComponent(exchangeError.message)}`
      );
    }

    // Handle password recovery redirect
    if (data.session && data.user?.recovery_sent_at != null) {
      return NextResponse.redirect(new URL("/reset-password", origin));
    }

    console.log("[auth/callback] PKCE exchange succeeded, redirecting to", next);
    return NextResponse.redirect(new URL(next, origin));
  }

  return NextResponse.redirect(new URL("/", origin));
}