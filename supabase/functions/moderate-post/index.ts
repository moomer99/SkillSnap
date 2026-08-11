import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

const VISION_URL = 'https://vision.googleapis.com/v1/images:annotate'

/**
 * Same reasoning as send-push-notification: functions.invoke sends
 * Authorization and x-client-info, which makes the request non-simple, so a
 * browser preflights it. Without an OPTIONS branch the actual POST is never
 * sent.
 */
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function log(...parts: unknown[]) {
  console.log('[moderate]', ...parts)
}

/**
 * SafeSearch likelihoods that hold a post. LIKELY rather than POSSIBLE: every
 * false positive is manual review time for one person, and POSSIBLE fires on a
 * great deal of ordinary skin.
 */
const HOLD_LIKELIHOODS = new Set(['LIKELY', 'VERY_LIKELY'])

/**
 * Where a hold notification goes.
 *
 * Both addresses are real recipients rather than one plus a CC. A CC says "this
 * is mainly someone else's" and a queue with an implied owner is a queue nobody
 * clears; either of these should be able to pick a hold up without wondering
 * whose it was.
 *
 * Still a constant rather than configuration. Two known inboxes is a list, not
 * a settings surface.
 */
const MODERATOR_EMAILS = ['mo@skillsnap.com.au', 'reviewer@skillsnap.com.au']
/** Same verified sender the send-notification-email function uses. */
const FROM_EMAIL = 'SkillSnap <mo@skillsnap.com.au>'

/** Only nudity and explicit content are in scope. Violence and medical are not. */
type SafeSearch = {
  adult?: string
  racy?: string
  spoof?: string
  medical?: string
  violence?: string
}

type ModerateRequest = {
  post_id: string
  // Deliberately nothing else. The media to scan is read from the post row
  // under the service role, never taken from the request body: a caller who
  // could name the URLs could point the scanner at any clean image and publish
  // explicit content behind it.
}

function json(payload: unknown, status = 200) {
  if (status >= 400) log('responding', status, JSON.stringify(payload))
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

/** The only bucket posts upload to; anything outside it is not ours to scan. */
const STORAGE_BUCKET = 'post-media'

/**
 * Derives the storage object path from one of this project's public URLs.
 * Returns null for anything else - a caller can only point the scanner at
 * this project's own bucket, never at an arbitrary host.
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

/**
 * Downloads one image with the service role and returns it base64-encoded for
 * Vision. Sent as content rather than imageUri: Vision's own URL fetching is
 * best-effort and a per-image fetch failure there fails the whole scan closed,
 * whereas a storage download from inside the project's own infrastructure is
 * the reliable path.
 */
async function fetchImageBase64(
  // deno-lint-ignore no-explicit-any -- the untyped client this function receives
  admin: SupabaseClient<any, 'public', 'public', any, any>,
  url: string,
  supabaseUrl: string
): Promise<string> {
  const path = storagePathFromUrl(url, supabaseUrl)
  if (!path) throw new Error(`Not a ${STORAGE_BUCKET} storage URL: ${url.slice(0, 120)}`)

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

/**
 * One annotate call for every image. Vision accepts up to 16 requests per
 * batch and we send at most 10 images, so a single round trip covers a post.
 */
async function scan(apiKey: string, contents: string[]): Promise<SafeSearch[]> {
  const requests = contents.map((content) => ({
    image: { content },
    features: [{ type: 'SAFE_SEARCH_DETECTION' }],
  }))

  if (requests.length === 0) return []

  const res = await fetch(`${VISION_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests }),
  })

  if (!res.ok) {
    throw new Error(`Vision returned ${res.status}: ${(await res.text()).slice(0, 300)}`)
  }

  const body = await res.json()
  const responses: Record<string, unknown>[] = body.responses ?? []

  // A per-image error (bytes Vision would not decode, say) is not a clean
  // result. Surfaced as a thrown error so the post fails closed rather than
  // passing on the strength of the images that did come back.
  const failed = responses.find((r) => r.error)
  if (failed) {
    throw new Error(`Vision per-image error: ${JSON.stringify(failed.error).slice(0, 300)}`)
  }

  return responses.map((r) => (r.safeSearchAnnotation ?? {}) as SafeSearch)
}

/** The worst likelihood seen across every frame decides the post. */
function worst(results: SafeSearch[], key: 'adult' | 'racy'): string | null {
  const order = ['UNKNOWN', 'VERY_UNLIKELY', 'UNLIKELY', 'POSSIBLE', 'LIKELY', 'VERY_LIKELY']
  let found: string | null = null
  let rank = -1
  for (const r of results) {
    const value = r[key]
    if (!value) continue
    const i = order.indexOf(value)
    if (i > rank) {
      rank = i
      found = value
    }
  }
  return found
}

/**
 * Usernames reach an inbox inside HTML and are user-controlled — same
 * reasoning, and same table, as send-notification-email's escaping.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Emails the moderator that a post was held.
 *
 * Follows send-notification-email's Resend pattern rather than invoking that
 * function: it is strictly user-to-user — the recipient must be a profiles row,
 * the type a user preference, and the caller related to the recipient — so an
 * admin alert to a fixed inbox does not fit its contract, and widening the
 * contract would mean changing the other repo's function.
 *
 * Every hold gets an email, including the fail-closed kind where the scan
 * errored: those land in the queue needing the same human eyes, just with an
 * error where the scores would be. Runs after the decision is already written,
 * and every failure path ends in a log line, never a throw — see the waitUntil
 * call site.
 */
async function sendHoldEmail(
  // deno-lint-ignore no-explicit-any -- the untyped client this function receives
  admin: SupabaseClient<any, 'public', 'public', any, any>,
  postId: string,
  authorId: string,
  adult: string | null,
  racy: string | null,
  framesScanned: number,
  scanError: string | null
): Promise<void> {
  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) {
    log('hold email skipped: RESEND_API_KEY is not set')
    return
  }

  const { data: author } = await admin
    .from('profiles')
    .select('username')
    .eq('id', authorId)
    .maybeSingle<{ username: string | null }>()
  const username = author?.username ?? authorId

  // The dashboard ref is the project URL's subdomain — derived rather than
  // hardcoded, so the function is not lying about where it is deployed.
  const projectRef = new URL(Deno.env.get('SUPABASE_URL') ?? 'https://unknown.supabase.co')
    .hostname.split('.')[0]
  const dashboardUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`
  const lookupSql = `select * from moderation_queue where post_id = '${postId}';`

  const reason = scanError
    ? `Scan failed (held fail-closed): ${scanError}`
    : `adult: ${adult ?? 'n/a'} · racy: ${racy ?? 'n/a'} · frames scanned: ${framesScanned}`

  const subject = `Post held for review — @${username}`

  // An ops alert, so the plain-text body is the primary artifact and the HTML
  // is the same content with a clickable link — not the user-facing template.
  const text = [
    `A post was held for moderation review.`,
    ``,
    `Author:  @${username}`,
    `Post ID: ${postId}`,
    `Reason:  ${reason}`,
    ``,
    `Look it up in moderation_queue (${dashboardUrl}):`,
    lookupSql,
  ].join('\n')

  const html = `<!doctype html>
<html lang="en"><body style="font-family:Arial,Helvetica,sans-serif;color:#2c2942;font-size:14px;line-height:22px;">
<p><strong>A post was held for moderation review.</strong></p>
<table cellpadding="4" cellspacing="0" border="0">
<tr><td style="color:#655f7a;">Author</td><td>@${escapeHtml(username)}</td></tr>
<tr><td style="color:#655f7a;">Post ID</td><td><code>${escapeHtml(postId)}</code></td></tr>
<tr><td style="color:#655f7a;">Reason</td><td>${escapeHtml(reason)}</td></tr>
</table>
<p>Look it up in <a href="${dashboardUrl}">the SQL editor</a>:</p>
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
    log('hold email rejected by Resend', res.status, (await res.text()).slice(0, 300))
    return
  }

  log('hold email sent', postId)
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

  if (!body.post_id) return json({ error: 'post_id is required' }, 400)

  // Service-role client. This is the only identity that can move a post out of
  // 'held' - the DB triggers reject the write for anything carrying a JWT.
  const admin = createClient(supabaseUrl, serviceKey)

  // The caller must own the post. Without this any signed-in user could aim the
  // scanner at someone else's held post and, on a clean result, publish it.
  const authHeader = req.headers.get('Authorization') ?? ''
  const caller = await admin.auth.getUser(authHeader.replace('Bearer ', ''))
  const callerId = caller.data.user?.id
  if (!callerId) return json({ error: 'Not signed in' }, 401)

  const { data: post } = await admin
    .from('posts')
    .select('id, author_id, moderation_status, type, media_url, thumbnail_url')
    .eq('id', body.post_id)
    .maybeSingle()

  if (!post) return json({ error: 'Post not found' }, 404)
  if (post.author_id !== callerId) return json({ error: 'Not your post' }, 403)

  // Re-scanning an already-decided post would let an author who got held retry
  // until the sampler happened to miss.
  if (post.moderation_status !== 'held') {
    return json({ verdict: post.moderation_status, already_decided: true })
  }

  // Scan the post's OWN media, read from the row above under the service role —
  // never URLs from the request body. A photo is scanned as itself; a video as
  // its uploaded poster frame, since Vision cannot decode the video file. An
  // empty list falls through to "Nothing to scan" below and holds the post,
  // keeping the fail-closed guarantee.
  const rowUrls: (string | null)[] =
    post.type === 'video' ? [post.thumbnail_url] : [post.media_url]
  const imageUrls = rowUrls
    .filter((u): u is string => typeof u === 'string' && u.length > 0)
    .slice(0, 10)

  let results: SafeSearch[] = []
  let scanError: string | null = null

  try {
    if (!apiKey) throw new Error('GOOGLE_VISION_API_KEY is not set')
    // Any single failed download fails the whole scan closed - a post must not
    // publish on the strength of only the images that could be fetched.
    const contents = await Promise.all(
      imageUrls.map((url) => fetchImageBase64(admin, url, supabaseUrl))
    )
    results = await scan(apiKey, contents)
    if (results.length === 0) throw new Error('Nothing to scan')
  } catch (e) {
    scanError = e instanceof Error ? e.message : String(e)
    log('scan failed, holding', body.post_id, scanError)
  }

  const adult = worst(results, 'adult')
  const racy = worst(results, 'racy')

  // Fail closed. A scan that did not complete holds the post for a human, which
  // is the same outcome as a positive - the difference is recorded in
  // moderation_scans.error, not in what the user sees.
  const clean =
    scanError === null &&
    !HOLD_LIKELIHOODS.has(adult ?? '') &&
    !HOLD_LIKELIHOODS.has(racy ?? '')

  const verdict = clean ? 'approved' : 'held'

  await admin.from('moderation_scans').insert({
    post_id: body.post_id,
    verdict,
    adult,
    racy,
    frames_scanned: results.length,
    raw: results.length > 0 ? results : null,
    error: scanError,
  })

  if (clean) {
    const { error: promoteError } = await admin
      .from('posts')
      .update({ moderation_status: 'approved' })
      .eq('id', body.post_id)

    if (promoteError) {
      log('promote failed', body.post_id, promoteError.message)
      return json({ error: 'Could not publish the post' }, 500)
    }
  }

  if (!clean) {
    /**
     * Fire-and-forget, structurally: the decision above is already written,
     * the catch turns any failure into a log line, and waitUntil keeps the
     * send alive after the response goes out instead of delaying it. The
     * global is feature-detected because local `functions serve` runtimes
     * have not always provided it.
     */
    const emailWork = sendHoldEmail(
      admin,
      body.post_id,
      post.author_id,
      adult,
      racy,
      results.length,
      scanError
    ).catch((e) => log('hold email failed', body.post_id, e instanceof Error ? e.message : e))

    const runtime = (globalThis as { EdgeRuntime?: { waitUntil(p: Promise<unknown>): void } })
      .EdgeRuntime
    if (runtime?.waitUntil) runtime.waitUntil(emailWork)
    else await emailWork
  }

  log('decided', body.post_id, verdict, { adult, racy, frames: results.length })
  return json({ verdict, adult, racy, frames_scanned: results.length })
})
