import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
const STORAGE_BUCKET = 'chat-images'

/**
 * The nightly half of chat media's 30-day life: warn at 3 days left, delete at
 * zero.
 *
 * Driven by pg_cron (see 20260806010000_chat_media.sql), which posts here with
 * the service role key read from Vault. There is no user in this request, which
 * is why it talks to Expo directly instead of going through
 * send-push-notification - that function authorises a send by checking the
 * *caller* is in the conversation, and a cron job is not in anything. Rather
 * than widening its contract to accept a caller that has no identity, the small
 * amount of send logic it needs is repeated here.
 *
 * Storage objects are removed through the storage API rather than by deleting
 * from storage.objects, which would drop the row and leave the file.
 */

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function log(...parts: unknown[]) {
  console.log('[expire-chat]', ...parts)
}

function json(payload: unknown, status = 200) {
  if (status >= 400) log('responding', status, JSON.stringify(payload))
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

/** Storage `remove()` takes at most 100 paths per call in practice. */
const REMOVE_CHUNK = 100

/** How long before expiry the warning goes out. */
const WARN_DAYS = 3

/**
 * Turns a public storage URL back into the object path `remove()` expects.
 * Anything that is not a URL for this bucket is skipped rather than guessed at.
 */
function storagePathFromUrl(url: string, supabaseUrl: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.hostname !== new URL(supabaseUrl).hostname) return null
    const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`
    const index = parsed.pathname.indexOf(marker)
    if (index === -1) return null
    return decodeURIComponent(parsed.pathname.slice(index + marker.length))
  } catch {
    return null
  }
}

type MediaRow = {
  id: string
  conversation_id: string
  sender_id: string
  url: string
  thumbnail_url: string | null
  expires_at: string
}

/**
 * Sends one "expiring soon" push.
 *
 * The recipient is warned, not the sender: the sender still has the original in
 * their own camera roll, and the person who stands to lose the picture is the
 * one who has only ever seen it inside the app.
 */
async function warnRecipient(
  // deno-lint-ignore no-explicit-any -- the untyped client this function receives
  admin: SupabaseClient<any, 'public', 'public', any, any>,
  media: MediaRow
): Promise<void> {
  const { data: members } = await admin
    .from('conversation_members')
    .select('user_id')
    .eq('conversation_id', media.conversation_id)
    .neq('user_id', media.sender_id)

  for (const member of (members ?? []) as { user_id: string }[]) {
    const { data: profile } = await admin
      .from('profiles')
      .select('expo_push_token, notify_messages')
      .eq('id', member.user_id)
      .maybeSingle<{ expo_push_token: string | null; notify_messages: boolean | null }>()

    // Same two skips send-push-notification makes: the category is switched
    // off, or the device never registered. Neither is an error.
    if (!profile || profile.notify_messages === false) continue
    if (!profile.expo_push_token) continue

    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: profile.expo_push_token,
        sound: 'default',
        title: 'Photo expiring soon',
        body: `A photo in your chat will be deleted in ${WARN_DAYS} days. Save it if you want to keep it.`,
        data: {
          type: 'message',
          conversationId: media.conversation_id,
          participantId: media.sender_id,
        },
        badge: 1,
        channelId: 'default',
        priority: 'high',
      }),
    })

    if (!res.ok) {
      log('expo rejected warning for', member.user_id, res.status)
    }
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'Function is not configured' }, 500)
  }

  // Only the service role may run the sweep. The cron job presents the key
  // from Vault; if the operator has not created that secret yet the bearer is
  // empty and this is the 401 that says so, in cron.job_run_details, rather
  // than a job that quietly deletes nothing.
  const authHeader = req.headers.get('Authorization') ?? ''
  if (authHeader.replace('Bearer ', '') !== serviceKey) {
    return json({ error: 'Not authorised' }, 401)
  }

  const admin = createClient(supabaseUrl, serviceKey)

  // ------------------------------------------------------------- warnings
  //
  // Everything expiring inside the warning window that has not been warned
  // about. Bounded below by now() so a backlog - the job not having run for a
  // few days - warns about things still in the window rather than things
  // already gone.
  const warnBefore = new Date(Date.now() + WARN_DAYS * 86_400_000).toISOString()

  const { data: expiring, error: expiringError } = await admin
    .from('chat_media')
    .select('id, conversation_id, sender_id, url, thumbnail_url, expires_at')
    .eq('moderation_status', 'approved')
    .is('expiry_notified_at', null)
    .gt('expires_at', new Date().toISOString())
    .lte('expires_at', warnBefore)
    .limit(500)

  if (expiringError) log('expiring lookup failed:', expiringError.message)

  let warned = 0
  for (const media of (expiring ?? []) as MediaRow[]) {
    try {
      await warnRecipient(admin, media)
    } catch (e) {
      // A failed push must not stop the row being stamped, or every subsequent
      // run would retry the same one forever and never reach the rest.
      log('warning failed for', media.id, e instanceof Error ? e.message : e)
    }
    await admin
      .from('chat_media')
      .update({ expiry_notified_at: new Date().toISOString() })
      .eq('id', media.id)
    warned += 1
  }

  // ------------------------------------------------------------- deletions

  const { data: expired, error: expiredError } = await admin
    .from('chat_media')
    .select('id, conversation_id, sender_id, url, thumbnail_url, expires_at')
    .lte('expires_at', new Date().toISOString())
    .limit(500)

  if (expiredError) log('expired lookup failed:', expiredError.message)

  const rows = (expired ?? []) as MediaRow[]

  const paths = rows
    .flatMap((row) => [row.url, row.thumbnail_url])
    .filter((url): url is string => !!url)
    .map((url) => storagePathFromUrl(url, supabaseUrl))
    .filter((path): path is string => !!path)

  // Files first, rows second. An orphaned object with no row pointing at it is
  // untidy; a row promising a picture whose bytes are gone renders as a broken
  // image in someone's conversation.
  for (let i = 0; i < paths.length; i += REMOVE_CHUNK) {
    const chunk = paths.slice(i, i + REMOVE_CHUNK)
    const { error } = await admin.storage.from(STORAGE_BUCKET).remove(chunk)
    if (error) log('remove failed for', chunk.length, 'paths:', error.message)
  }

  if (rows.length > 0) {
    // messages.media_id is ON DELETE SET NULL, so the message itself survives
    // as an empty bubble the client renders as "Photo expired" - the fact that
    // something was sent at that point in the conversation is part of the
    // record, and only the picture was ever promised for 30 days.
    const { error: deleteError } = await admin
      .from('chat_media')
      .delete()
      .in('id', rows.map((row) => row.id))

    if (deleteError) {
      log('row delete failed:', deleteError.message)
      return json({ error: 'Could not delete expired rows', warned }, 500)
    }
  }

  log('swept', { warned, deleted: rows.length, objects: paths.length })
  return json({ warned, deleted: rows.length, objects: paths.length })
})
