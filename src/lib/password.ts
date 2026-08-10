// ─────────────────────────────────────────────
// SkillSnap — Password strength rules
//
// One definition shared by every screen that sets a password (sign-up and
// the reset-password page), so the rule the user is shown while typing is
// always the same rule the submit button enforces.
// ─────────────────────────────────────────────

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_ERROR =
  "Password must be at least 8 characters and include a letter and a number";

export interface PasswordChecks {
  hasLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  valid: boolean;
}

export function checkPassword(password: string): PasswordChecks {
  const hasLength = password.length >= PASSWORD_MIN_LENGTH;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return { hasLength, hasLetter, hasNumber, valid: hasLength && hasLetter && hasNumber };
}

/** Labels for the live checklist, in the order they're displayed. */
export const PASSWORD_RULE_LABELS: { key: keyof Omit<PasswordChecks, "valid">; label: string }[] = [
  { key: "hasLength", label: "At least 8 characters" },
  { key: "hasLetter", label: "One letter" },
  { key: "hasNumber", label: "One number" },
];
