import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
// Sending address, not just a contact address. Resend verifies the DOMAIN, so
// any local part on skillsnap.com.au sends without a DNS or Resend change - but
// replies land in this mailbox, so it has to exist and be read.
const FROM_EMAIL = "SkillSnap <mo@skillsnap.com.au>";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { type, to_email, to_name, from_name } = await req.json();

    let subject = "";
    let html = "";

    if (type === "message") {
      subject = `${from_name} sent you a message on SkillSnap 💬`;
      html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>New message on SkillSnap</title>
</head>
<body style="margin:0;padding:0;background:#f3f1f8;font-family:Arial,Helvetica,sans-serif;color:#2c2942;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f1f8;">
<tr><td align="center" style="padding:22px 10px;">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:600px;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 8px 28px rgba(34,19,95,.10);">

<!-- Logo -->
<tr><td align="center" style="padding:20px 24px 18px;border-bottom:1px solid #eeeafc;background:#ffffff;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
<tr>
<td style="font-family:Arial,sans-serif;font-size:22px;font-weight:900;letter-spacing:-0.5px;color:#6847f5;">SK</td>
<td style="font-family:Arial,sans-serif;font-size:22px;font-weight:900;letter-spacing:-0.5px;color:#21135f;">illSnap</td>
</tr>
</table>
</td></tr>

<!-- Hero -->
<tr><td align="center" style="background:#f1edff;padding:32px 42px 28px;">
<div style="display:inline-block;padding:7px 16px;border-radius:999px;background:#6847f5;color:#fff;font-size:11px;font-weight:800;letter-spacing:.8px;margin-bottom:16px;">NEW MESSAGE</div>
<h1 style="margin:0 0 12px;font-size:32px;line-height:40px;color:#21135f;font-weight:900;">You have a new message 💬</h1>
<p style="margin:0;font-size:16px;line-height:26px;color:#655f7a;">${from_name} sent you a message on SkillSnap.</p>
</td></tr>

<!-- Body -->
<tr><td style="padding:32px 42px 24px;font-size:16px;line-height:26px;color:#403b56;">
<p style="margin:0 0 16px;">Hi ${to_name} 👋</p>
<p style="margin:0 0 16px;"><strong>${from_name}</strong> sent you a message on SkillSnap. Tap below to view and reply directly.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
<tr><td align="center">
<a href="https://skillsnap.com.au" style="display:inline-block;padding:14px 36px;background:#6847f5;color:#fff;text-decoration:none;border-radius:12px;font-weight:800;font-size:15px;">View Message →</a>
</td></tr>
</table>
</td></tr>

<!-- Footer -->
<tr><td style="background:#21135f;padding:16px 24px;text-align:center;color:#c9c1e7;font-size:11px;line-height:18px;">
Watch. Trust. Connect. · Built in Western Sydney 🇦🇺 · © 2026 SkillSnap Australia
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
    } else if (type === "follow") {
      subject = `${from_name} is now following you on SkillSnap 🌟`;
      html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>New follower on SkillSnap</title>
</head>
<body style="margin:0;padding:0;background:#f3f1f8;font-family:Arial,Helvetica,sans-serif;color:#2c2942;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f1f8;">
<tr><td align="center" style="padding:22px 10px;">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:600px;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 8px 28px rgba(34,19,95,.10);">

<!-- Logo -->
<tr><td align="center" style="padding:20px 24px 18px;border-bottom:1px solid #eeeafc;background:#ffffff;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
<tr>
<td style="font-family:Arial,sans-serif;font-size:22px;font-weight:900;letter-spacing:-0.5px;color:#6847f5;">SK</td>
<td style="font-family:Arial,sans-serif;font-size:22px;font-weight:900;letter-spacing:-0.5px;color:#21135f;">illSnap</td>
</tr>
</table>
</td></tr>

<!-- Hero -->
<tr><td align="center" style="background:#f1edff;padding:32px 42px 28px;">
<div style="display:inline-block;padding:7px 16px;border-radius:999px;background:#6847f5;color:#fff;font-size:11px;font-weight:800;letter-spacing:.8px;margin-bottom:16px;">NEW FOLLOWER</div>
<h1 style="margin:0 0 12px;font-size:32px;line-height:40px;color:#21135f;font-weight:900;">Your profile is getting noticed 🌟</h1>
<p style="margin:0;font-size:16px;line-height:26px;color:#655f7a;">${from_name} is now following you on SkillSnap.</p>
</td></tr>

<!-- Body -->
<tr><td style="padding:32px 42px 24px;font-size:16px;line-height:26px;color:#403b56;">
<p style="margin:0 0 16px;">Hi ${to_name} 👋</p>
<p style="margin:0 0 16px;">Great news — <strong>${from_name}</strong> started following you on SkillSnap. They'll see your latest work and updates in their feed.</p>
<p style="margin:0 0 24px;">Keep posting your work to stay visible to local clients near you.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
<tr><td align="center">
<a href="https://skillsnap.com.au" style="display:inline-block;padding:14px 36px;background:#6847f5;color:#fff;text-decoration:none;border-radius:12px;font-weight:800;font-size:15px;">View Your Profile →</a>
</td></tr>
</table>
</td></tr>

<!-- Footer -->
<tr><td style="background:#21135f;padding:16px 24px;text-align:center;color:#c9c1e7;font-size:11px;line-height:18px;">
Watch. Trust. Connect. · Built in Western Sydney 🇦🇺 · © 2026 SkillSnap Australia
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
    }

    if (!subject || !html) {
      return new Response(JSON.stringify({ error: "Unknown notification type" }), { status: 400 });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to_email],
        subject,
        html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(JSON.stringify({ error: data }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, data }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
