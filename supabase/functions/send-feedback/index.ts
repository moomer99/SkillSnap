/*
 * In-app feedback, delivered by email.
 *
 * Replaces a mailto: link. The link only ever worked on a device with a mail
 * client configured, sent from whatever address that client happened to use,
 * and left the app - so a good half of the feedback it was meant to collect
 * never arrived. This takes the message in the app and sends it here.
 *
 * WHY verify_jwt = false
 * Same reason send-push-notification carries it, plus one of its own. The
 * gateway's JWT check runs before the function boots and rejects a CORS
 * preflight, which carries no Authorization header. And feedback has to work
 * for someone browsing as a guest, who has no session at all - a feedback form
 * that requires an account cannot hear from the people who did not make one.
 *
 * That makes this reachable by anyone holding the anon key, so the things that
 * keep it from being a mail relay are inside the function rather than in front
 * of it: the recipient is a constant and cannot be named by the caller, the
 * fields are length-capped, and the body is escaped rather than interpolated.
 * The worst a caller can do is send this one inbox a bounded message, which is
 * what the endpoint is for.
 *
 * When a JWT is present it is read for the sender's identity and stamped on the
 * mail, so a signed-in report can be tied to an account without trusting the
 * name and email the form sent.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/**
 * Where feedback goes. Deliberately hello@ and not mo@: mo@ is the moderation
 * inbox, wired into moderate-post and moderate-chat-media as both sender and
 * recipient, and a feedback message landing in the middle of a review queue is
 * how it gets missed.
 */
const FEEDBACK_EMAIL = 'hello@skillsnap.com.au'
const FROM_EMAIL = 'SkillSnap <hello@skillsnap.com.au>'

/** Caps, so one request cannot post a novel into the inbox. */
const MAX_NAME = 80
const MAX_EMAIL = 160
const MAX_MESSAGE = 4000

function log(...parts: unknown[]) {
  console.log('[feedback]', ...parts)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

/**
 * Deliberately loose. This is a reply-to hint, not an identity check - the
 * account behind the message is established from the JWT, and rejecting an
 * unusual but valid address would lose the feedback over a formatting opinion.
 */
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let payload: { name?: unknown; email?: unknown; message?: unknown }
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Expected a JSON body' }, 400)
  }

  const name = typeof payload.name === 'string' ? payload.name.trim().slice(0, MAX_NAME) : ''
  const email = typeof payload.email === 'string' ? payload.email.trim().slice(0, MAX_EMAIL) : ''
  const message =
    typeof payload.message === 'string' ? payload.message.trim().slice(0, MAX_MESSAGE) : ''

  if (!message) return json({ error: 'Please write a message.' }, 400)
  if (!email || !looksLikeEmail(email)) {
    return json({ error: 'Please enter an email address we can reply to.' }, 400)
  }

  // Best effort, and never a reason to refuse the message: feedback from a
  // guest is still feedback. It only decides whether the mail can say which
  // account this came from.
  let accountLine = 'Not signed in'
  const authHeader = req.headers.get('Authorization')
  if (authHeader) {
    try {
      const client = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      )
      const { data } = await client.auth.getUser()
      if (data.user) {
        accountLine = `${data.user.email ?? 'no email'} (${data.user.id})`
      }
    } catch (e) {
      log('could not resolve caller', e)
    }
  }

  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) {
    log('RESEND_API_KEY is not set')
    return json({ error: 'Feedback is temporarily unavailable. Please try again later.' }, 503)
  }

  const subject = `SkillSnap Feedback — ${name || email}`

  const text = [
    `From:    ${name || '(no name given)'} <${email}>`,
    `Account: ${accountLine}`,
    ``,
    message,
  ].join('\n')

  const html = `<!doctype html>
<html lang="en"><body style="font-family:Arial,Helvetica,sans-serif;color:#2c2942;font-size:14px;line-height:22px;">
<table cellpadding="4" cellspacing="0" border="0">
<tr><td style="color:#655f7a;">From</td><td>${escapeHtml(name || '(no name given)')} &lt;${escapeHtml(email)}&gt;</td></tr>
<tr><td style="color:#655f7a;">Account</td><td>${escapeHtml(accountLine)}</td></tr>
</table>
<hr style="border:none;border-top:1px solid #e6e3ef;margin:16px 0;" />
<p style="white-space:pre-wrap;">${escapeHtml(message)}</p>
</body></html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [FEEDBACK_EMAIL],
      // So hitting reply in the inbox goes to the person who wrote in, rather
      // than to the address the app sends from.
      reply_to: email,
      subject,
      html,
      text,
    }),
  })

  if (!res.ok) {
    log('rejected by Resend', res.status, (await res.text()).slice(0, 300))
    return json({ error: 'We could not send that just now. Please try again.' }, 502)
  }

  log('sent', email)
  return json({ ok: true }, 200)
})
