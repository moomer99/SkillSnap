import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Emails a user about activity, if they have that category switched on.
 *
 * Rewritten to match send-push-notification. The previous version took
 * `to_email`, `to_name` and `from_name` straight from the request body with no
 * Authorization check of any kind, which made it an open relay: anyone who knew
 * the URL could send SkillSnap-branded mail to any address, with attacker-chosen
 * text interpolated unescaped into the HTML. Nothing ever called it, so it was
 * never exploited — wiring it up without fixing that first would have shipped
 * the hole.
 *
 * Now: the caller is identified from their JWT, the recipient is named by id
 * and their address is looked up server-side, both display names come from the
 * database, and the recipient's notify_email_* preference is honoured the same
 * way the push function honours notify_*.
 */

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "SkillSnap <mo@skillsnap.com.au>";
const APP_URL = "https://skillsnap.com.au";

/** Maps a logical type to the recipient's email preference column. */
const PREFERENCE_COLUMN: Record<string, string> = {
  message: "notify_email_messages",
  follow: "notify_email_follows",
};

type EmailRequest = {
  to_user_id: string;
  type: keyof typeof PREFERENCE_COLUMN | string;
  /** Required for type 'message': proves the caller is in the conversation. */
  conversation_id?: string;
};

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

/**
 * Display names reach the recipient's inbox inside HTML. They come from the
 * database rather than the request now, but they are still user-controlled -
 * someone can call themselves `<img src=x onerror=...>` - so they are escaped.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Confirms the caller is entitled to trigger this email. Mirrors
 * callerMayNotify in send-push-notification; without it any signed-in user
 * could mail any other user arbitrarily.
 */
async function callerMayEmail(
  admin: ReturnType<typeof createClient>,
  callerId: string,
  req: EmailRequest
): Promise<boolean> {
  if (callerId === req.to_user_id) return false; // never email yourself

  if (req.type === "message") {
    if (!req.conversation_id) return false;
    const { data } = await admin
      .from("conversation_members")
      .select("user_id")
      .eq("conversation_id", req.conversation_id)
      .in("user_id", [callerId, req.to_user_id]);
    return (data?.length ?? 0) === 2;
  }

  if (req.type === "follow") {
    const { data } = await admin
      .from("follows")
      .select("follower_id")
      .eq("follower_id", callerId)
      .eq("following_id", req.to_user_id)
      .maybeSingle();
    return !!data;
  }

  return false;
}

/** Shared chrome, so the two templates cannot drift apart or skip escaping. */
function renderEmail(opts: {
  badge: string;
  heading: string;
  intro: string;
  toName: string;
  body: string;
  ctaLabel: string;
}): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(opts.heading)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f1f8;font-family:Arial,Helvetica,sans-serif;color:#2c2942;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f1f8;">
<tr><td align="center" style="padding:22px 10px;">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:600px;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 8px 28px rgba(34,19,95,.10);">

<tr><td align="center" style="padding:20px 24px 18px;border-bottom:1px solid #eeeafc;background:#ffffff;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
<tr>
<td style="font-family:Arial,sans-serif;font-size:22px;font-weight:900;letter-spacing:-0.5px;color:#6847f5;">SK</td>
<td style="font-family:Arial,sans-serif;font-size:22px;font-weight:900;letter-spacing:-0.5px;color:#21135f;">illSnap</td>
</tr>
</table>
</td></tr>

<tr><td align="center" style="background:#f1edff;padding:32px 42px 28px;">
<div style="display:inline-block;padding:7px 16px;border-radius:999px;background:#6847f5;color:#fff;font-size:11px;font-weight:800;letter-spacing:.8px;margin-bottom:16px;">${escapeHtml(opts.badge)}</div>
<h1 style="margin:0 0 12px;font-size:32px;line-height:40px;color:#21135f;font-weight:900;">${escapeHtml(opts.heading)}</h1>
<p style="margin:0;font-size:16px;line-height:26px;color:#655f7a;">${escapeHtml(opts.intro)}</p>
</td></tr>

<tr><td style="padding:32px 42px 24px;font-size:16px;line-height:26px;color:#403b56;">
<p style="margin:0 0 16px;">Hi ${escapeHtml(opts.toName)} 👋</p>
<p style="margin:0 0 24px;">${escapeHtml(opts.body)}</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
<tr><td align="center">
<a href="${APP_URL}" style="display:inline-block;padding:14px 36px;background:#6847f5;color:#fff;text-decoration:none;border-radius:12px;font-weight:800;font-size:15px;">${escapeHtml(opts.ctaLabel)} →</a>
</td></tr>
</table>
</td></tr>

<tr><td style="background:#21135f;padding:16px 24px;text-align:center;color:#c9c1e7;font-size:11px;line-height:18px;">
Watch. Trust. Connect. · Built in Western Sydney 🇦🇺 · © 2026 SkillSnap Australia<br>
<a href="${APP_URL}/help" style="color:#c9c1e7;">Manage your notification settings in the app</a>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    if (!RESEND_API_KEY) return json({ error: "Email is not configured" }, 500);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    const body: EmailRequest = await req.json();
    if (!body?.to_user_id || !body?.type) {
      return json({ error: "to_user_id and type are required" }, 400);
    }

    const preferenceColumn = PREFERENCE_COLUMN[body.type];
    // Types with no email equivalent (job, connection) are a no-op rather than
    // an error — the client fires one payload at both functions.
    if (!preferenceColumn) {
      return json({ success: true, skipped: "no email for this notification type" });
    }

    // Identify the caller from their JWT rather than trusting the body.
    const caller = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const {
      data: { user },
    } = await caller.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    // Service role: profiles.email is revoked from anon and authenticated.
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (!(await callerMayEmail(admin, user.id, body))) {
      return json({ error: "Not permitted to email this user" }, 403);
    }

    const { data: sender } = await admin
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    const senderName = (sender?.display_name as string | undefined) ?? "Someone";

    const { data: recipient, error } = await admin
      .from("profiles")
      .select(`email, display_name, ${preferenceColumn}`)
      .eq("id", body.to_user_id)
      .single();

    if (error || !recipient) return json({ error: "Recipient not found" }, 404);

    const row = recipient as Record<string, unknown>;

    if (row[preferenceColumn] === false) {
      return json({ success: true, skipped: "recipient disabled this email type" });
    }

    const toEmail = (row.email as string | null) ?? null;
    // Not an error: an account created without an address simply cannot be
    // emailed.
    if (!toEmail) return json({ success: true, skipped: "no email address on file" });

    const toName = (row.display_name as string | undefined) ?? "there";

    const html =
      body.type === "message"
        ? renderEmail({
            badge: "NEW MESSAGE",
            heading: "You have a new message 💬",
            intro: `${senderName} sent you a message on SkillSnap.`,
            toName,
            body: `${senderName} sent you a message on SkillSnap. Tap below to view and reply directly.`,
            ctaLabel: "View Message",
          })
        : renderEmail({
            badge: "NEW FOLLOWER",
            heading: "Your profile is getting noticed 🌟",
            intro: `${senderName} is now following you on SkillSnap.`,
            toName,
            body: `${senderName} started following you on SkillSnap. They'll see your latest work in their feed — keep posting to stay visible to local clients.`,
            ctaLabel: "View Your Profile",
          });

    const subject =
      body.type === "message"
        ? `${senderName} sent you a message on SkillSnap 💬`
        : `${senderName} is now following you on SkillSnap 🌟`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_EMAIL, to: [toEmail], subject, html }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("send-notification-email: Resend rejected the send:", data);
      return json({ error: "Email provider rejected the send" }, 502);
    }

    return json({ success: true, id: data?.id ?? null });
  } catch (err) {
    console.error("send-notification-email: unhandled error:", err);
    return json({ error: "Something went wrong sending the email." }, 500);
  }
});
