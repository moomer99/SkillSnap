"use client";
// ─────────────────────────────────────────────
// SkillSnap — Live password requirement checklist
//
// Shown as the user types. Stays hidden until the field has something in
// it, so an untouched sign-up form isn't already showing three red crosses.
// ─────────────────────────────────────────────
import { Check, X } from "lucide-react";
import { checkPassword, PASSWORD_RULE_LABELS } from "@/lib/password";

export default function PasswordRequirements({
  password,
  dark = false,
}: {
  password: string;
  /** `dark` styles for the purple-gradient reset page; default suits the auth sheet. */
  dark?: boolean;
}) {
  if (!password) return null;

  const checks = checkPassword(password);
  const pendingColor = dark ? "rgba(255,255,255,0.45)" : "#6f6889";

  return (
    <ul className="flex flex-col gap-1" aria-live="polite">
      {PASSWORD_RULE_LABELS.map(({ key, label }) => {
        const met = checks[key];
        return (
          <li key={key} className="flex items-center gap-1.5 text-[12px] font-medium">
            {met
              ? <Check size={13} className="flex-shrink-0" style={{ color: "#22c55e" }} />
              : <X size={13} className="flex-shrink-0" style={{ color: pendingColor }} />}
            <span style={{ color: met ? "#22c55e" : pendingColor }}>{label}</span>
          </li>
        );
      })}
    </ul>
  );
}
