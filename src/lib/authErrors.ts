// ─────────────────────────────────────────────
// SkillSnap — Auth error interpretation
// ─────────────────────────────────────────────

export const RESET_EMAIL_SENT_MESSAGE = "Password reset email sent. Check your inbox.";

interface MaybeAuthError {
  status?: number;
  code?: string;
  message?: string;
}

/**
 * Whether a `resetPasswordForEmail` error should still be treated as success.
 *
 * GoTrue reports a 500 / `unexpected_failure` when its mail transport errors
 * *after* the message has already been handed off, so the user gets the email
 * and an error screen at the same time and stops trusting the working flow.
 *
 * Only a genuine 4xx tells us the request itself was rejected — a bad address,
 * or 429 for rate limiting, both of which the user can act on. Anything else
 * (5xx, or a network failure with no status at all) is treated as sent.
 */
export function isResetEmailLikelySent(error: unknown): boolean {
  const err = (error ?? {}) as MaybeAuthError;
  const status = typeof err.status === "number" ? err.status : 0;

  if (err.code === "unexpected_failure") return true;
  if (status >= 400 && status < 500) return false;
  return true;
}
