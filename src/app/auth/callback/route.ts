import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  /**
   * Password recovery is forwarded whole, params and all.
   *
   * A recovery link that arrives in the verify form (?token_hash=, or ?token=
   * from an older template) carried nothing this route reads, so it fell
   * through to the redirect at the bottom and was dropped on the home page -
   * or, when it did reach /reset-password, arrived stripped of the one thing
   * that page needed. Hence "No reset token found" on a link that had a
   * perfectly good token in it.
   *
   * Not exchanged here: the token has to be redeemed by the client that will
   * set the password, so that the session it opens is the one the form writes
   * against. This route hands it over untouched instead.
   */
  const isRecovery =
    searchParams.get("type") === "recovery" ||
    searchParams.has("token_hash") ||
    searchParams.has("token");

  if (isRecovery) {
    const target = new URL("/reset-password", origin);
    target.search = searchParams.toString();
    return NextResponse.redirect(target);
  }

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