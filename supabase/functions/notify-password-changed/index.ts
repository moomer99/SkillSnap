import { PASSWORD_CHANGED } from '../_shared/securityEmails.ts'
import { sendSecurityNotice } from '../_shared/securityNotice.ts'

/**
 * "Your SkillSnap password was changed", to the account it happened to.
 *
 * Called by changePassword() in src/services/accountService.ts once the update
 * has already succeeded. It reports a change rather than authorising one, so
 * there is nothing here that can fail in a way the user needs to hear about -
 * the caller does not wait for it and does not surface its errors.
 *
 * A password changed by someone else is otherwise completely silent. This mail
 * is the only thing that reaches the real owner while the account is still
 * theirs to get back.
 *
 * Everything about who gets mailed lives in _shared/securityNotice.ts, and it
 * is the caller's JWT rather than anything in the body.
 */

Deno.serve((req) => sendSecurityNotice(req, PASSWORD_CHANGED, 'notify-password-changed'))
