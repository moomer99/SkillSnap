import { createClient } from 'jsr:@supabase/supabase-js@2'

/**
 * Permanently deletes the calling user's account.
 *
 * Self-service only: the target is taken from the caller's JWT and there is no
 * request parameter to name someone else. The body is ignored entirely.
 *
 * Order is deliberate - rows, then files, then the auth user:
 *  - Removing auth.users first would orphan every row behind an id that no
 *    longer resolves to anyone if a later step failed.
 *  - Storage sits in the middle because an orphaned object is untidy but
 *    harmless, while an orphaned row is user data that survived an erasure
 *    request.
 */

const AVATAR_BUCKET = 'avatars'
const MEDIA_BUCKET = 'post-media'
const CHAT_BUCKET = 'chat-images'

/** Storage `remove()` takes at most 100 paths per call in practice. */
const REMOVE_CHUNK = 100
const LIST_PAGE = 100

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
 * Turns a public storage URL back into the object path `remove()` expects.
 * Anything that isn't a URL for this bucket is skipped rather than guessed at.
 *
 * The query string is dropped: EditProfileScreen stores avatar_url with a
 * `?t=<timestamp>` cache-buster, which is not part of the object's name.
 */
function storagePathFromUrl(url: string, bucket: string): string | null {
  const prefix = `/storage/v1/object/public/${bucket}/`
  const index = url.indexOf(prefix)
  if (index === -1) return null
  const path = url.slice(index + prefix.length).split('?')[0]
  return path ? decodeURIComponent(path) : null
}

/**
 * Every object directly under `prefix`.
 *
 * Both buckets are flat below the user's folder - `avatars/<uid>/…` and
 * `post-media/posts/<uid>/…` - so a single non-recursive listing covers them.
 * Paged because list() returns 100 rows at a time and a prolific user can
 * exceed that.
 */
async function listPathsUnder(
  admin: ReturnType<typeof createClient>,
  bucket: string,
  prefix: string
): Promise<string[]> {
  const paths: string[] = []

  for (let offset = 0; ; offset += LIST_PAGE) {
    const { data, error } = await admin.storage
      .from(bucket)
      .list(prefix, { limit: LIST_PAGE, offset })

    if (error) {
      console.error(`listPathsUnder(${bucket}/${prefix}) failed:`, error.message)
      break
    }
    if (!data || data.length === 0) break

    for (const item of data) {
      // Folder placeholders come back with a null id and no object behind them.
      if (item.id === null) continue
      paths.push(`${prefix}/${item.name}`)
    }

    if (data.length < LIST_PAGE) break
  }

  return paths
}

async function removeAll(
  admin: ReturnType<typeof createClient>,
  bucket: string,
  paths: string[]
) {
  const unique = [...new Set(paths)]

  for (let i = 0; i < unique.length; i += REMOVE_CHUNK) {
    const chunk = unique.slice(i, i + REMOVE_CHUNK)
    const { error } = await admin.storage.from(bucket).remove(chunk)
    if (error) {
      // Non-fatal: the rows are already gone, and reporting a failed delete
      // here would tell the user their account survived when it did not.
      console.error(`removeAll(${bucket}) failed for ${chunk.length} paths:`, error.message)
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401)

    // Identify the caller from their JWT. Nothing about the target comes from
    // the request body.
    const caller = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const {
      data: { user },
    } = await caller.auth.getUser()
    if (!user) return json({ error: 'Unauthorized' }, 401)

    const userId = user.id

    // Service role is required throughout: the sweep function is granted to
    // service_role only, and auth.admin is service-role territory by design.
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Stop notifications first. If any later step fails, the device has at
    // least already gone quiet rather than continuing to buzz for an account
    // the user believes they deleted.
    const { error: tokenError } = await admin
      .from('profiles')
      .update({ expo_push_token: null })
      .eq('id', userId)

    if (tokenError) {
      console.error('delete-account: could not clear push token:', tokenError.message)
    }

    // 2. Every row, in foreign-key order, in one transaction.
    const { data: mediaUrls, error: sweepError } = await admin.rpc('delete_user_account', {
      target_user_id: userId,
    })

    if (sweepError) {
      return json({ error: `Could not delete your data: ${sweepError.message}` }, 500)
    }

    // 3. Files. Exact URLs from the sweep, plus a listing of each bucket's
    // user folder to catch objects no surviving row pointed at - replaced
    // avatars and media uploaded by a publish that failed after the upload.
    const urls = (mediaUrls as string[] | null) ?? []

    const avatarPaths = [
      ...urls
        .map((url) => storagePathFromUrl(url, AVATAR_BUCKET))
        .filter((path): path is string => !!path),
      ...(await listPathsUnder(admin, AVATAR_BUCKET, userId)),
    ]
    // Three prefixes. The first two exist because the two apps disagree about
    // where post media goes: the mobile app uploads to post-media/posts/<uid>/,
    // the web app to post-media/<uid>/. Files still referenced by a row are
    // removed either way via the URLs above; listing only one prefix left the
    // other app's orphans behind. banners/<uid>/ holds profile banners, which
    // the sweep's URL list never includes - delete_user_account predates
    // banner_url - so the listing is the only thing that removes them, replaced
    // banners included.
    const mediaPaths = [
      ...urls
        .map((url) => storagePathFromUrl(url, MEDIA_BUCKET))
        .filter((path): path is string => !!path),
      ...(await listPathsUnder(admin, MEDIA_BUCKET, `posts/${userId}`)),
      ...(await listPathsUnder(admin, MEDIA_BUCKET, userId)),
      ...(await listPathsUnder(admin, MEDIA_BUCKET, `banners/${userId}`)),
    ]

    // Two layouts, and both have to be swept.
    //
    // The native app writes chat-images/<conversation_id>/<message_id>.<ext>,
    // which no per-user prefix can find - so delete_user_account now returns
    // those URLs, collected from chat_media before it deletes the rows, and
    // they are turned back into paths here like every other bucket. The listing
    // stays for the web app's chat-images/<uid>/ layout, which predates the
    // table and is not reachable from any URL the RPC knows about.
    const chatPaths = [
      ...urls
        .map((url) => storagePathFromUrl(url, CHAT_BUCKET))
        .filter((path): path is string => !!path),
      ...(await listPathsUnder(admin, CHAT_BUCKET, userId)),
    ]

    await removeAll(admin, AVATAR_BUCKET, avatarPaths)
    await removeAll(admin, MEDIA_BUCKET, mediaPaths)
    await removeAll(admin, CHAT_BUCKET, chatPaths)

    // 4. The login itself.
    const { error: authError } = await admin.auth.admin.deleteUser(userId)

    if (authError) {
      // The data is gone but the credential is not, so the user could sign in
      // again and land in onboarding. Reported rather than swallowed - a
      // half-deleted account is exactly the state this whole change exists to
      // stop being invisible.
      console.error('delete-account: auth.users delete failed:', authError.message)
      return json(
        {
          error:
            'Your data was deleted, but your sign-in could not be removed. Please contact hello@skillsnap.com.au so we can finish this off.',
        },
        500
      )
    }

    return json({ success: true })
  } catch (err) {
    console.error('delete-account: unhandled error:', err)
    return json({ error: 'Something went wrong deleting your account.' }, 500)
  }
})
