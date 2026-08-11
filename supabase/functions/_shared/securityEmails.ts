/**
 * The two security notification mails, as strings the runtime can reach.
 *
 * Copies of supabase/templates/password-changed.html and
 * email-address-changed.html, and they have to stay copies. An Edge Function is
 * bundled from its own directory and its static imports, so a runtime
 * Deno.readTextFile('../../templates/…') names a path that exists in the repo
 * and not in the deployment. A TypeScript module is the one form of this markup
 * guaranteed to ship with the function.
 *
 * EDIT BOTH. The .html files are what someone opens in a browser to look at;
 * these are what actually gets sent. If the two drift, what people receive is
 * this one.
 */

/** One notification: what it says, and what it is called in an inbox. */
export type SecurityNotice = {
  subject: string
  html: string
}

export const PASSWORD_CHANGED: SecurityNotice = {
  subject: 'Your SkillSnap password was changed',
  html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
    <title>Your SkillSnap password was changed</title>
  </head>
  <!-- bgcolor as well as the inline style, on every element that paints the
       dark ground. Outlook ignores background-color on body outright, and
       several clients strip the style attribute off it, which is how a mail
       written entirely in #0d0a1a still arrives white. -->
  <body bgcolor="#0d0a1a" style="margin:0; padding:0; background-color:#0d0a1a; -webkit-text-size-adjust:100%;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0d0a1a" style="background-color:#0d0a1a;">
      <tr>
        <td align="center" bgcolor="#0d0a1a" style="padding:32px 16px; background-color:#0d0a1a;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#1a1035" style="max-width:520px; background-color:#1a1035; border:1px solid #2c1f5c; border-radius:20px;">
            <tr>
              <td align="center" style="padding:36px 32px 4px 32px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                <div style="font-size:28px; font-weight:800; letter-spacing:-0.5px;">
                  <span style="color:#6c47ff;">SK</span><span style="color:#ffffff;">illSnap</span>
                </div>
                <div style="margin-top:8px; font-size:13px; font-weight:600; color:#a78bfa;">Watch. Trust. Connect.</div>
              </td>
            </tr>
            <!-- No button, and no link of any kind in the body.
                 A mail that tells someone their password changed and then hands
                 them something to click is the exact shape of the phishing mail
                 that follows a real account takeover. The only address here is
                 ours, and it is a mailto:. -->
            <tr>
              <td style="padding:28px 32px 0 32px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                <p style="margin:0 0 16px 0; font-size:16px; line-height:24px; color:#ffffff;">
                  Your SkillSnap password was recently changed.
                </p>
                <p style="margin:0 0 16px 0; font-size:16px; line-height:24px; color:#ffffff;">
                  If you made this change, no action is needed.
                </p>
                <p style="margin:0; font-size:16px; line-height:24px; color:#ffffff;">
                  If you didn't change your password, please contact us immediately at
                  <a href="mailto:hello@skillsnap.com.au" style="color:#a78bfa; text-decoration:none; font-weight:600;">hello@skillsnap.com.au</a>.
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:28px 32px 32px 32px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                <div style="height:1px; background-color:#2c1f5c; margin-bottom:20px;"></div>
                <div style="font-size:12px; line-height:18px; color:#6f6892;">&copy; 2026 SkillSnap Australia</div>
                <div style="margin-top:6px; font-size:12px; line-height:18px;">
                  <a href="mailto:hello@skillsnap.com.au" style="color:#a78bfa; text-decoration:none;">hello@skillsnap.com.au</a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
}

export const EMAIL_ADDRESS_CHANGED: SecurityNotice = {
  subject: 'Your SkillSnap email address was changed',
  html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
    <title>Your SkillSnap email address was changed</title>
  </head>
  <!-- bgcolor as well as the inline style, on every element that paints the
       dark ground. Outlook ignores background-color on body outright, and
       several clients strip the style attribute off it, which is how a mail
       written entirely in #0d0a1a still arrives white. -->
  <body bgcolor="#0d0a1a" style="margin:0; padding:0; background-color:#0d0a1a; -webkit-text-size-adjust:100%;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0d0a1a" style="background-color:#0d0a1a;">
      <tr>
        <td align="center" bgcolor="#0d0a1a" style="padding:32px 16px; background-color:#0d0a1a;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#1a1035" style="max-width:520px; background-color:#1a1035; border:1px solid #2c1f5c; border-radius:20px;">
            <tr>
              <td align="center" style="padding:36px 32px 4px 32px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                <div style="font-size:28px; font-weight:800; letter-spacing:-0.5px;">
                  <span style="color:#6c47ff;">SK</span><span style="color:#ffffff;">illSnap</span>
                </div>
                <div style="margin-top:8px; font-size:13px; font-weight:600; color:#a78bfa;">Watch. Trust. Connect.</div>
              </td>
            </tr>
            <!-- No button, and no link of any kind in the body, for the reason
                 in password-changed.html: a mail reporting a credential change
                 and offering something to click is the shape of the phishing
                 that follows a takeover. Worth more here than there - this one
                 is the mail the old address gets, and that reader is the person
                 who has just lost the account if the change was not theirs. -->
            <tr>
              <td style="padding:28px 32px 0 32px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                <p style="margin:0 0 16px 0; font-size:16px; line-height:24px; color:#ffffff;">
                  Your SkillSnap email address was recently updated.
                </p>
                <p style="margin:0 0 16px 0; font-size:16px; line-height:24px; color:#ffffff;">
                  If you made this change, no action is needed.
                </p>
                <p style="margin:0; font-size:16px; line-height:24px; color:#ffffff;">
                  If you didn't make this change, please contact us immediately at
                  <a href="mailto:hello@skillsnap.com.au" style="color:#a78bfa; text-decoration:none; font-weight:600;">hello@skillsnap.com.au</a>.
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:28px 32px 32px 32px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                <div style="height:1px; background-color:#2c1f5c; margin-bottom:20px;"></div>
                <div style="font-size:12px; line-height:18px; color:#6f6892;">&copy; 2026 SkillSnap Australia</div>
                <div style="margin-top:6px; font-size:12px; line-height:18px;">
                  <a href="mailto:hello@skillsnap.com.au" style="color:#a78bfa; text-decoration:none;">hello@skillsnap.com.au</a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
}
