import { createClient } from 'jsr:@supabase/supabase-js@2'

/**
 * Sign in with a username instead of an email address.
 *
 * The login form takes either, and a username has to become an email before
 * GoTrue will look at it. The lookup cannot happen in the app: profiles.email
 * is revoked from anon (20260801020000_revoke_anon_email_harden_visible_posts)
 * precisely so that a publishable key cannot read addresses, and every caller
 * of this endpoint is by definition signed out.
 *
 * So the whole exchange happens here, and the email never leaves the function.
 * An RPC that handed the address back to the client would undo that migration
 * in one line - usernames are public, so anyone could walk the directory and
 * collect the address behind every handle. What comes back instead is a
 * session, and only for someone who already knew the password.
 *
 * The password check is a normal signInWithPassword issued with the anon key,
 * so it goes through GoTrue exactly as the email form does - same hashing, same
 * lockout, same audit trail. What it loses is the caller's IP: every attempt
 * arrives from this function, so anything GoTrue does per-IP now sees one
 * client. Supabase does not rate-limit password grants by IP today, but that is
 * the assumption this rests on, and the reason to keep the response identical
 * for a wrong password whether the account exists or not.
 */

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

/**
 * A username is matched case-insensitively, so `ilike` rather than `eq` - which
 * makes the caller's `_` and `%` wildcards. Escaped, because `_` is a legal
 * character in a handle and an unescaped one would match a different profile's.
 */
function likePattern(username: string): string {
  return username.replace(/[\\%_]/g, '\\$&')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    const body = await req.json().catch(() => null)
    // The '@' is presentation - it is not stored on the row, and someone typing
    // their handle the way the app displays it is not making a mistake.
    const username = typeof body?.username === 'string' ? body.username.trim().replace(/^@+/, '') : ''
    const password = typeof body?.password === 'string' ? body.password : ''

    if (!username || !password) {
      return json({ error: 'username and password are required' }, 400)
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: matches, error: lookupError } = await admin
      .from('profiles')
      .select('id, username')
      .ilike('username', likePattern(username))
      .limit(2)

    if (lookupError) {
      console.error('username-login: profile lookup failed:', lookupError.message)
      return json({ error: 'Could not look up that username.' }, 500)
    }

    // ilike is case-insensitive but not accent- or width-insensitive, and the
    // limit(2) is there so a pattern that somehow matched more than one row is
    // visible rather than silently resolving to whichever came back first.
    const profile = (matches ?? []).find(
      (row) => row.username?.toLowerCase() === username.toLowerCase()
    )

    if (!profile) {
      return json({ ok: false, reason: 'username_not_found' })
    }

    // auth.users, not profiles.email: the profile column is a copy written at
    // signup, and an account that has since changed its address would otherwise
    // be sent to sign in as an email it no longer has.
    const { data: found, error: userError } = await admin.auth.admin.getUserById(profile.id)

    if (userError) {
      console.error('username-login: user lookup failed:', userError.message)
      return json({ error: 'Could not look up that username.' }, 500)
    }

    const email = found?.user?.email

    // A profile with no address behind it is a real state - an account can be
    // deleted from auth and leave its row - and it is not a wrong password.
    if (!email) {
      return json({ ok: false, reason: 'username_not_found' })
    }

    const anon = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )

    const { data: signIn, error: signInError } = await anon.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError || !signIn.session) {
      // Deliberately unspecific, and deliberately not the raw message: "Email
      // not confirmed" would confirm the account exists to anyone guessing
      // handles. The app shows its own credentials copy for this.
      return json({ ok: false, reason: 'invalid_credentials' })
    }

    // The tokens, and nothing else. The client feeds them to setSession, which
    // is what actually signs the app in; the user object it needs comes back
    // from that, so there is no reason to ship a second copy of it here.
    return json({
      ok: true,
      session: {
        access_token: signIn.session.access_token,
        refresh_token: signIn.session.refresh_token,
      },
    })
  } catch (err) {
    console.error('username-login: unhandled error:', err)
    return json({ error: 'Something went wrong.' }, 500)
  }
})
