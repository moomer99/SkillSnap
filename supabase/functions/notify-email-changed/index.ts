import { EMAIL_ADDRESS_CHANGED } from '../_shared/securityEmails.ts'
import { sendSecurityNotice } from '../_shared/securityNotice.ts'

/**
 * "Your SkillSnap email address was changed", to the address being left behind.
 *
 * Called by changeEmail() in src/services/accountService.ts once updateUser has
 * been accepted - which starts the change rather than finishing it. Supabase
 * mails both addresses a confirmation link and moves nothing until both are
 * clicked, so this arrives alongside that, saying plainly what was asked for.
 *
 * The OLD address is not a parameter. auth.users.email still holds it while the
 * change is pending, so the token the caller sent identifies exactly the inbox
 * that stands to lose the account - see the note in _shared/securityNotice.ts.
 * That is the one worth telling: whoever holds the new address already knows.
 */

Deno.serve((req) => sendSecurityNotice(req, EMAIL_ADDRESS_CHANGED, 'notify-email-changed'))
