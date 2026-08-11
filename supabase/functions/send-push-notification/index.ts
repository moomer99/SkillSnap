import { createClient } from 'jsr:@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

/**
 * Required, and their absence is why push silently did nothing from the web for
 * so long. supabase.functions.invoke sends Authorization and x-client-info,
 * which makes the request non-simple, so a browser preflights it with OPTIONS.
 * With no OPTIONS branch the old version fell through to `await req.json()`,
 * threw on the empty body and returned a 500 with no Access-Control-Allow-Origin
 * — the browser then blocked it and never sent the actual POST. Email worked
 * throughout only because send-notification-email has always had these.
 */
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/**
 * Every log line is prefixed so the Edge Function logs can be filtered to this
 * function alone. The file previously contained no logging of any kind, which
 * made a working invocation and a 403 look identical from the dashboard: both
 * produced nothing but `booted` and `shutdown`.
 */
function log(...parts: unknown[]) {
  console.log('[push]', ...parts)
}

/** Tokens are bearer credentials — never log one in full. */
function maskToken(token: string): string {
  return token.length <= 12 ? '***' : `${token.slice(0, 22)}…${token.slice(-4)}`
}

/**
 * Maps a logical notification type to the recipient's preference column, so a
 * user who has switched a category off in Settings > Notifications does not
 * receive it.
 */
const PREFERENCE_COLUMN: Record<string, string> = {
  message: 'notify_messages',
  follow: 'notify_follows',
  job: 'notify_jobs',
  connection: 'notify_connections',
}

/**
 * Types the database itself sends, carrying the service role key instead of a
 * user's JWT.
 *
 * Skill review is decided in the SQL editor, so there is no signed-in caller to
 * attribute the push to - callerMayNotify has no question it could ask about
 * one. These bypass that check, and only these: the allowlist is what stops the
 * service-role path from becoming a way to send anything to anyone.
 *
 * They have no preference column on purpose. Each one is the outcome of
 * something the recipient did themselves, or (for the reviewer) the queue they
 * asked to watch, so there is no category for them to have switched off.
 */
const SYSTEM_TYPES = new Set(['skill_submitted', 'skill_approved', 'skill_rejected'])

type PushRequest = {
  /** The recipient's user id. Their token is resolved server-side. */
  to_user_id: string
  /** Gates delivery on the recipient's notification settings. */
  type: keyof typeof PREFERENCE_COLUMN | string
  title: string
  body: string
  data?: Record<string, unknown>
  /** Required for type 'message': proves the caller is in the conversation. */
  conversation_id?: string
}

function json(payload: unknown, status = 200) {
  if (status >= 400) log('responding', status, JSON.stringify(payload))
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

/**
 * Confirms the caller is actually entitled to trigger this notification.
 * Without this, any signed-in user could push arbitrary text to any other
 * user — a phishing vector, since notifications render as if from SkillSnap.
 */
async function callerMayNotify(
  admin: ReturnType<typeof createClient>,
  callerId: string,
  req: PushRequest
): Promise<boolean> {
  if (callerId === req.to_user_id) return false // never notify yourself

  if (req.type === 'message') {
    if (!req.conversation_id) return false
    // Both caller and recipient must belong to the conversation.
    const { data } = await admin
      .from('conversation_members')
      .select('user_id')
      .eq('conversation_id', req.conversation_id)
      .in('user_id', [callerId, req.to_user_id])
    return (data?.length ?? 0) === 2
  }

  if (req.type === 'follow') {
    // The follow row must already exist, so this can only fire for a real follow.
    const { data } = await admin
      .from('follows')
      .select('follower_id')
      .eq('follower_id', callerId)
      .eq('following_id', req.to_user_id)
      .maybeSingle()
    return !!data
  }

  return false
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    log('preflight OPTIONS')
    return new Response('ok', { headers: CORS_HEADERS })
  }
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    log('request received from origin', req.headers.get('Origin') ?? '(none)')

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401)

    const body: PushRequest = await req.json()
    log('payload', {
      to_user_id: body?.to_user_id,
      type: body?.type,
      has_conversation_id: !!body?.conversation_id,
    })

    if (!body?.to_user_id || !body?.type) {
      return json({ error: 'to_user_id and type are required' }, 400)
    }

    // Service role is required to read expo_push_token, which is not exposed
    // to the anon/authenticated roles.
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    /**
     * The database calling on its own behalf, for a system type.
     *
     * Compared against the service role key rather than decoded, because that
     * key is the credential - anything presenting it can already read and write
     * every table directly, so there is nothing further to verify. Narrowed to
     * SYSTEM_TYPES so this cannot become a general "send anything" bypass.
     */
    const isSystemSend =
      authHeader === `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` &&
      SYSTEM_TYPES.has(body.type)

    if (isSystemSend) {
      log('system send for type', body.type, '-> to', body.to_user_id)
    }

    // Identify the caller from their JWT rather than trusting the request body.
    // Skipped for a system send, which has no user behind it to identify.
    let callerId: string | null = null

    if (!isSystemSend) {
      const caller = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      )
      const {
        data: { user },
      } = await caller.auth.getUser()
      if (!user) return json({ error: 'Unauthorized' }, 401)
      callerId = user.id
      log('caller resolved', user.id)
    }

    if (!isSystemSend && !(await callerMayNotify(admin, callerId!, body))) {
      // Distinguishes "the authorisation check rejected this" from "the token
      // was missing" — from the outside both used to be a silent non-delivery.
      log('authorisation FAILED for', body.type, 'caller', callerId, '-> to', body.to_user_id)
      return json({ error: 'Not permitted to notify this user' }, 403)
    }
    log('authorisation ok for type', body.type)

    // Derive the sender's name server-side. The client neither has to know its
    // own display name, nor gets to spoof it (e.g. "SkillSnap Support").
    // A system send has no sender; its title and body are used verbatim.
    const { data: sender } = callerId
      ? await admin.from('profiles').select('display_name').eq('id', callerId).single()
      : { data: null }
    const senderName = (sender?.display_name as string | undefined) ?? 'Someone'
    const title =
      body.type === 'message'
        ? senderName
        : body.type === 'follow'
          ? 'New follower'
          : body.title
    const messageBody = body.type === 'follow' ? `${senderName} started following you` : body.body

    const preferenceColumn = PREFERENCE_COLUMN[body.type]
    const columns = preferenceColumn ? `expo_push_token, ${preferenceColumn}` : 'expo_push_token'

    const { data: profile, error } = await admin
      .from('profiles')
      .select(columns)
      .eq('id', body.to_user_id)
      .single()

    if (error || !profile) {
      log('recipient lookup failed:', error?.message ?? 'no row')
      return json({ error: 'Recipient not found' }, 404)
    }

    const row = profile as Record<string, unknown>

    if (preferenceColumn) {
      log(`recipient ${preferenceColumn} =`, row[preferenceColumn])
    }
    if (preferenceColumn && row[preferenceColumn] === false) {
      return json({ success: true, skipped: 'recipient disabled this notification type' })
    }

    const token = (row.expo_push_token as string | null) ?? null
    // Not an error: the recipient simply has no registered device yet.
    if (!token) {
      log('recipient has no push token')
      return json({ success: true, skipped: 'no push token' })
    }

    // A native FCM/APNs token here instead of an ExponentPushToken means the
    // device registered against Firebase directly and exp.host will reject it.
    const looksLikeExpoToken = /^Expo(nent)?PushToken\[.+\]$/.test(token)
    log('token', maskToken(token), 'length', token.length, 'valid format:', looksLikeExpoToken)

    const message = {
      to: token,
      sound: 'default',
      title,
      body: messageBody,
      data: body.data ?? {},
      badge: 1,
      // Android: without these the OS may batch or delay delivery. 'default'
      // is the channel pushService.ts creates at registration time.
      channelId: 'default',
      priority: 'high',
    }
    log('POSTing to exp.host:', JSON.stringify({ ...message, to: maskToken(token) }))

    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    })

    const result = await res.json().catch(() => null)
    log('exp.host responded', res.status, JSON.stringify(result))

    if (!res.ok) {
      return json({ error: 'Expo rejected the request', status: res.status, result }, 502)
    }

    // Expo answers 200 even when the individual message failed; the real
    // outcome is the per-ticket status. DeviceNotRegistered means the token is
    // stale, MismatchSenderId means the FCM sender does not match the one the
    // app registered with, InvalidCredentials means no FCM V1 key on EAS.
    const tickets = Array.isArray(result?.data) ? result.data : result?.data ? [result.data] : []
    const failed = tickets.filter((t: Record<string, unknown>) => t?.status === 'error')
    if (failed.length > 0) {
      log('EXPO TICKET ERROR:', JSON.stringify(failed))
      return json({ success: false, expo_errors: failed }, 502)
    }

    log('accepted by Expo, ticket', JSON.stringify(tickets))
    return json({ success: true, result })
  } catch (err) {
    console.error('[push] unhandled error:', err)
    return json({ error: String(err) }, 500)
  }
})
