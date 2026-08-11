import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

const VISION_URL = 'https://vision.googleapis.com/v1/images:annotate'

/**
 * Screens one photo or video sent inside a conversation, and decides it
 * outright.
 *
 * This is moderate-post's sibling and shares its shape - fetch the bytes
 * server-side with the service role, ask Vision SafeSearch, fail closed - but
 * it differs in the one way that matters: it never holds anything for review.
 *
 * A post held for a human costs that person a review and costs the author a
 * wait, which is the right trade when the alternative is binning real work on a
 * false positive. A chat photo held for a human means someone opening a private
 * one-to-one conversation to look at it, while the recipient sees nothing
 * arrive and the sender is told nothing. So this rejects instead, the sender
 * finds out immediately, and no queue exists to build up.
 *
 * Rejected objects are deleted from storage here rather than left for the
 * expiry sweep: they failed the screen, so nothing should be able to fetch them
 * from a public bucket in the meantime.
 */

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function log(...parts: unknown[]) {
  console.log('[moderate-chat]', ...parts)
}

/** Same threshold as posts: POSSIBLE fires on a great deal of ordinary skin. */
const HOLD_LIKELIHOODS = new Set(['LIKELY', 'VERY_LIKELY'])

const STORAGE_BUCKET = 'chat-images'

/** The same two inboxes moderate-post alerts, for the same reason. */
const MODERATOR_EMAILS = ['mo@skillsnap.com.au', 'reviewer@skillsnap.com.au']
/** Same verified sender the other functions use. */
const FROM_EMAIL = 'SkillSnap <mo@skillsnap.com.au>'

type SafeSearch = {
  adult?: string
  racy?: string
}

type ModerateRequest = {
  media_id: string
}

/** Same escaping, and the same reason for it, as moderate-post's. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Tells the moderators that a chat photo or video was rejected.
 *
 * Note what this is NOT. There is no queue behind it and nothing to action: the
 * media is already rejected, its bytes are already deleted, and the sender has
 * already been told. It is a signal about a person - the same sender turning up
 * here repeatedly is the thing worth acting on - not a task.
 *
 * So it carries ids and scores and nothing else. No URL, no thumbnail, no
 * message text. This function's own header explains that chat media is never
 * held precisely so that no human ends up opening a private conversation to
 * look at it, and an alert that shipped the image would walk straight back
 * through that door.
 *
 * Content rejections only, never a failed scan. A scan that could not run says
 * nothing about the sender, and Vision being down would otherwise put one email
 * in these inboxes for every message anyone tried to send for the duration of
 * the outage.
 */
async function sendRejectionEmail(
  // deno-lint-ignore no-explicit-any -- the untyped client this function receives
  admin: SupabaseClient<any, 'public', 'public', any, any>,
  mediaId: string,
  senderId: string,
  kind: string,
  adult: string | null,
  racy: string | null
): Promise<void> {
  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) {
    log('rejection email skipped: RESEND_API_KEY is not set')
    return
  }

  const { data: sender } = await admin
    .from('profiles')
    .select('username')
    .eq('id', senderId)
    .maybeSingle<{ username: string | null }>()
  const username = sender?.username ?? senderId

  const projectRef = new URL(Deno.env.get('SUPABASE_URL') ?? 'https://unknown.supabase.co')
    .hostname.split('.')[0]
  const dashboardUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`
  // Their history rather than this one row: one rejection is noise, a pattern
  // from the same sender is the reason this email exists.
  const lookupSql =
    `select id, kind, moderation_status, created_at from chat_media ` +
    `where sender_id = '${senderId}' order by created_at desc limit 20;`

  const reason = `adult: ${adult ?? 'n/a'} · racy: ${racy ?? 'n/a'}`
  const subject = `Chat ${kind} rejected — @${username}`

  const text = [
    `A chat ${kind} was rejected by the screen and deleted.`,
    ``,
    `Sender:   @${username}`,
    `Media ID: ${mediaId}`,
    `Scores:   ${reason}`,
    ``,
    `No action is needed - the media is already gone and the sender was told.`,
    `This is here so a repeat sender is visible. Their recent media`,
    `(${dashboardUrl}):`,
    lookupSql,
  ].join('\n')

  const html = `<!doctype html>
<html lang="en"><body style="font-family:Arial,Helvetica,sans-serif;color:#2c2942;font-size:14px;line-height:22px;">
<p><strong>A chat ${escapeHtml(kind)} was rejected by the screen and deleted.</strong></p>
<table cellpadding="4" cellspacing="0" border="0">
<tr><td style="color:#655f7a;">Sender</td><td>@${escapeHtml(username)}</td></tr>
<tr><td style="color:#655f7a;">Media ID</td><td><code>${escapeHtml(mediaId)}</code></td></tr>
<tr><td style="color:#655f7a;">Scores</td><td>${escapeHtml(reason)}</td></tr>
</table>
<p>No action is needed — the media is already gone and the sender was told.
This is here so a repeat sender is visible.</p>
<p>Their recent media in <a href="${dashboardUrl}">the SQL editor</a>:</p>
<p><code>${escapeHtml(lookupSql)}</code></p>
</body></html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: MODERATOR_EMAILS, subject, html, text }),
  })

  if (!res.ok) {
    log('rejection email rejected by Resend', res.status, (await res.text()).slice(0, 300))
    return
  }

  log('rejection email sent', mediaId)
}

function json(payload: unknown, status = 200) {
  if (status >= 400) log('responding', status, JSON.stringify(payload))
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

/**
 * Derives the storage object path from one of this project's public URLs, and
 * only from this bucket. A caller cannot point the scanner at another host, or
 * at post-media.
 */
function storagePathFromUrl(url: string | null, supabaseUrl: string): string | null {
  if (!url) return null
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

async function fetchImageBase64(
  // deno-lint-ignore no-explicit-any -- the untyped client this function receives
  admin: SupabaseClient<any, 'public', 'public', any, any>,
  path: string
): Promise<string> {
  const { data, error } = await admin.storage.from(STORAGE_BUCKET).download(path)
  if (error || !data) {
    throw new Error(`Storage download failed for ${path.slice(0, 120)}: ${error?.message}`)
  }

  const bytes = new Uint8Array(await data.arrayBuffer())
  // Chunked so String.fromCharCode never sees an argument list the size of an
  // image.
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

async function scan(apiKey: string, content: string): Promise<SafeSearch> {
  const res = await fetch(`${VISION_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{ image: { content }, features: [{ type: 'SAFE_SEARCH_DETECTION' }] }],
    }),
  })

  if (!res.ok) {
    throw new Error(`Vision returned ${res.status}: ${(await res.text()).slice(0, 300)}`)
  }

  const body = await res.json()
  const response = (body.responses ?? [])[0]
  if (!response) throw new Error('Vision returned no response')
  if (response.error) {
    throw new Error(`Vision per-image error: ${JSON.stringify(response.error).slice(0, 300)}`)
  }

  return (response.safeSearchAnnotation ?? {}) as SafeSearch
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  const apiKey = Deno.env.get('GOOGLE_VISION_API_KEY')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'Function is not configured' }, 500)
  }

  let body: ModerateRequest
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Body must be JSON' }, 400)
  }

  if (!body.media_id) return json({ error: 'media_id is required' }, 400)

  const admin = createClient(supabaseUrl, serviceKey)

  // The caller must be the sender. Without this, any signed-in user could aim
  // the scanner at someone else's pending media and, on a clean result, publish
  // it into a conversation they are not in.
  const authHeader = req.headers.get('Authorization') ?? ''
  const caller = await admin.auth.getUser(authHeader.replace('Bearer ', ''))
  const callerId = caller.data.user?.id
  if (!callerId) return json({ error: 'Not signed in' }, 401)

  const { data: media } = await admin
    .from('chat_media')
    .select('id, sender_id, kind, url, thumbnail_url, moderation_status')
    .eq('id', body.media_id)
    .maybeSingle()

  if (!media) return json({ error: 'Media not found' }, 404)
  if (media.sender_id !== callerId) return json({ error: 'Not your media' }, 403)

  // Re-screening a decided row would let a sender retry until the scan happened
  // to come back clean.
  if (media.moderation_status !== 'held') {
    return json({ verdict: media.moderation_status, already_decided: true })
  }

  const isVideo = media.kind === 'video'

  /**
   * What Vision is actually shown.
   *
   * Vision SafeSearch takes an image, so a video is screened by its poster
   * frame - the same single-frame coverage post moderation has always had. A
   * clip whose opening half-second is innocuous passes whole. That gap is
   * accepted; what is not accepted is a video with no frame to look at, which
   * throws below and fails closed rather than going out unscreened.
   */
  const scanPath = storagePathFromUrl(
    (isVideo ? media.thumbnail_url : media.url) as string | null,
    supabaseUrl
  )

  // Both objects go on a rejection: leaving the video behind because only its
  // poster frame was named here would keep the actual content fetchable from a
  // public bucket.
  const ownedPaths = [
    storagePathFromUrl(media.url as string | null, supabaseUrl),
    storagePathFromUrl(media.thumbnail_url as string | null, supabaseUrl),
  ].filter((p): p is string => p !== null)

  let result: SafeSearch = {}
  let scanError: string | null = null

  try {
    if (!apiKey) throw new Error('GOOGLE_VISION_API_KEY is not set')
    if (!scanPath) {
      throw new Error(
        isVideo ? 'Video has no poster frame to screen' : 'Not a chat-images storage URL'
      )
    }
    result = await scan(apiKey, await fetchImageBase64(admin, scanPath))
  } catch (e) {
    scanError = e instanceof Error ? e.message : String(e)
    log('scan failed', body.media_id, scanError)
  }

  const adult = result.adult ?? null
  const racy = result.racy ?? null

  /**
   * Fail closed, but note what that means here.
   *
   * A scan that could not run rejects, the same as a positive one. There is no
   * queue to park it in, and delivering an unscreened image because Vision was
   * down is exactly the outcome the screen exists to prevent. The sender is
   * asked to try again, which - unlike a hold - is an action they can actually
   * take.
   */
  const clean =
    scanError === null &&
    !HOLD_LIKELIHOODS.has(adult ?? '') &&
    !HOLD_LIKELIHOODS.has(racy ?? '')

  const verdict = clean ? 'approved' : 'rejected'

  const { error: updateError } = await admin
    .from('chat_media')
    .update({ moderation_status: verdict })
    .eq('id', body.media_id)

  if (updateError) {
    log('status update failed', body.media_id, updateError.message)
    return json({ error: 'Could not record the screening result' }, 500)
  }

  // Rejected bytes do not stay fetchable in a public bucket while they wait for
  // the expiry sweep.
  if (!clean && ownedPaths.length > 0) {
    const { error: removeError } = await admin.storage.from(STORAGE_BUCKET).remove(ownedPaths)
    if (removeError) log('object remove failed', ownedPaths.join(', '), removeError.message)
  }

  log('decided', body.media_id, verdict, { kind: media.kind, adult, racy, scanError })

  // Content rejections only - see sendRejectionEmail on why a failed scan is
  // deliberately silent. Same fire-and-forget shape moderate-post uses: the
  // decision is already written and already returned to the sender, the catch
  // turns any failure into a log line, and waitUntil keeps the send alive after
  // the response rather than delaying it. EdgeRuntime is feature-detected
  // because local `functions serve` has not always provided it.
  if (!clean && scanError === null) {
    const emailWork = sendRejectionEmail(
      admin,
      body.media_id,
      media.sender_id as string,
      (media.kind as string) ?? 'photo',
      adult,
      racy
    ).catch((e) =>
      log('rejection email failed', body.media_id, e instanceof Error ? e.message : e)
    )

    const runtime = (globalThis as { EdgeRuntime?: { waitUntil(p: Promise<unknown>): void } })
      .EdgeRuntime
    if (runtime?.waitUntil) runtime.waitUntil(emailWork)
    else await emailWork
  }

  return json({
    verdict,
    adult,
    racy,
    // Lets the client tell "we could not check this" from "this is not allowed"
    // without the message having to guess from the verdict alone.
    failed_to_scan: scanError !== null,
  })
})
