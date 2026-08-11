// ─────────────────────────────────────────────
// SkillSnap — public contact addresses
//
// Everything a user can see points at hello@. Internal senders (the Resend
// transactional "from" address in supabase/functions) keep their own mailbox.
// ─────────────────────────────────────────────

export const SUPPORT_EMAIL = "hello@skillsnap.com.au";

/** Prefilled feedback mailto, used by Help, Settings → Support and About. */
export const FEEDBACK_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=SkillSnap%20Feedback`;
