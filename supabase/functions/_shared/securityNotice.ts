import { createClient } from 'jsr:@supabase/supabase-js@2'

import type { SecurityNotice } from './securityEmails.ts'

/**
 * Mails one security notification to the caller's own address.
 *
 * Shared by notify-password-changed and notify-email-changed, which differ only
 * in which notice they pass in. Two copies of the JWT handling and the Resend
 * call would be two places to fix the day one of them is wrong.
 *
 * WHO IT MAILS, and why it is not the caller's decision
 * The address comes from the JWT, never from the body. A function that mailed
 * whatever `to` it was handed would be a branded phishing kit: anyone holding
 * the publishable key could send "your SkillSnap password was changed - contact
 * us at…" to any address in the country, from our domain, with our logo on it.
 * The body's `to` is read and compared, so a mismatch is visible in the logs,
 * and then ignored.
 *
 * That is also why there is no config.toml entry turning verify_jwt off. The
 * gateway's check is the outer half of this, and the getUser() below is the
 * inner half - it is the identity, not a formality.
 *
 * For the email change this has a second effect worth stating: with secure email
 * change on, auth.users.email still holds the OLD address until the new one is
 * confirmed. So the notice reaches the address that is losing the account, which
 * is the only one where it does any good - and it does so because that is what
 * the token says, not because a caller asked nicely.
 */

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const FROM_EMAIL = 'SkillSnap <hello@skillsnap.com.au>'

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

/**
 * A display name safe to put in a To header.
 *
 * Quotes, angle brackets and newlines are the characters that turn one header
 * into two. Resend takes JSON rather than raw headers, so this is belt and
 * braces - but the name arrives from a client, and a display name is exactly
 * the kind of field nobody thinks of as input.
 */
function safeDisplayName(value: unknown): string {
  if (typeof value !== 'string') return ''

  return value
    .replace(/[\r\n<>"@,;:\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
}

export async function sendSecurityNotice(
  req: Request,
  notice: SecurityNotice,
  tag: string
): Promise<Response> {
  const log = (...parts: unknown[]) => console.log(`[${tag}]`, ...parts)

  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Missing Authorization header' }, 401)

  // Advisory only. `to` is compared against the token below; `name` is the
  // only field here that is actually used, and only after being scrubbed.
  const body = (await req.json().catch(() => ({}))) as { to?: unknown; name?: unknown }

  const caller = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data, error: userError } = await caller.auth.getUser()
  const user = data?.user

  if (userError || !user) {
    log('could not resolve caller', userError?.message)
    return json({ error: 'Not signed in' }, 401)
  }

  const address = user.email

  // A social account with no address on it is a real state, and not an error
  // worth retrying: there is simply nowhere to send this.
  if (!address) {
    log('no email on account', user.id)
    return json({ ok: false, reason: 'no_email' })
  }

  const claimed = typeof body.to === 'string' ? body.to.trim().toLowerCase() : ''
  if (claimed && claimed !== address.toLowerCase()) {
    // Not refused: the mail still goes to the right place. Logged because a
    // client asking for a different address is either a bug or an attempt.
    log('body.to did not match the token; using the token', user.id)
  }

  const metadata = (user.user_metadata ?? {}) as { full_name?: unknown; name?: unknown }
  const displayName =
    safeDisplayName(body.name) ||
    safeDisplayName(metadata.full_name) ||
    safeDisplayName(metadata.name)

  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) {
    log('RESEND_API_KEY is not set')
    return json({ error: 'Notification is unavailable' }, 503)
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [displayName ? `${displayName} <${address}>` : address],
      subject: notice.subject,
      html: notice.html,
    }),
  })

  if (!res.ok) {
    log('rejected by Resend', res.status, (await res.text()).slice(0, 300))
    return json({ error: 'Could not send the notification' }, 502)
  }

  log('sent', user.id)
  return json({ ok: true })
}
