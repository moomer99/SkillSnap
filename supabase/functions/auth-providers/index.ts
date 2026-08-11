import { createClient } from 'jsr:@supabase/supabase-js@2'

/**
 * Which sign-in providers own an email address.
 *
 * Called by SignUpScreen after Supabase rejects a signup with "User already
 * registered", so the app can say "this is a Google account, use the Google
 * button" instead of repeating an error the user cannot act on.
 *
 * Runs without a JWT: the caller is by definition signed out. That makes the
 * response worth keeping thin - provider names and nothing else. It does not
 * widen what an attacker can learn by much, because the /signup response the
 * app has just received already told them the address is registered, but it is
 * the reason there is no user id, name, or timestamp in the payload.
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    const body = await req.json().catch(() => null)
    const email = typeof body?.email === 'string' ? body.email.trim() : ''

    if (!email) return json({ error: 'email is required' }, 400)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data, error } = await admin.rpc('auth_providers_for_email', {
      target_email: email,
    })

    if (error) {
      console.error('auth-providers: lookup failed:', error.message)
      return json({ error: 'Could not look up that address.' }, 500)
    }

    // An unknown address and an address with no identities both come back
    // empty; the caller treats both as "no advice to give" and falls back to
    // its generic copy.
    return json({ providers: (data as string[] | null) ?? [] })
  } catch (err) {
    console.error('auth-providers: unhandled error:', err)
    return json({ error: 'Something went wrong.' }, 500)
  }
})
