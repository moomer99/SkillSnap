"use client";
import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";

// This page deliberately has no token, signature, or account lookup. It takes
// a bare email address because the unsubscribe link lives in a saved Gmail
// template that cannot carry per-recipient parameters, and most recipients
// have no SkillSnap account to authenticate against. The worst an attacker
// can do with someone else's address is stop us emailing that person — which
// is exactly what the page does anyway. Do not "fix" this by requiring a
// signed link: an unsubscribe that needs state the recipient was never given
// is an unsubscribe that fails, and recipients have a legal right to opt out.

const FUNCTION_URL =
  "https://dnraeyxjzdmpdvrkzyfd.supabase.co/functions/v1/unsubscribe";

const REASONS = [
  "Not interested in SkillSnap",
  "I didn't ask for this",
  "Too many emails",
  "I'm not a tradesperson",
  "Something else",
] as const;

export default function UnsubscribeForm({ initialEmail }: { initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [reason, setReason] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const address = email.trim();
    if (!address || !address.includes("@")) {
      setError("Please enter your email address.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: address, reason }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (res.ok && payload.ok) {
        setDone(true);
      } else {
        setError(payload.error ?? "Something went wrong on our end.");
      }
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div
        className="w-full max-w-[460px] rounded-2xl border border-[color:var(--ss-line)] p-8 flex flex-col items-center text-center"
        style={{ background: "var(--ss-surface)" }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
          style={{ background: "rgba(16,185,129,0.14)" }}
        >
          <CheckCircle size={28} className="text-green-500" />
        </div>
        <h1 className="text-xl font-bold text-[color:var(--ss-text)] mb-1">
          You&apos;re unsubscribed
        </h1>
        <p className="text-sm text-[color:var(--ss-text-soft)] mb-4 break-all">
          {email.trim()}
        </p>
        <p className="text-sm text-[color:var(--ss-text-muted)]">
          Changed your mind? Just reply to any earlier email.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-[460px] rounded-2xl border border-[color:var(--ss-line)] p-8"
      style={{ background: "var(--ss-surface)" }}
    >
      <h1 className="text-xl font-bold text-[color:var(--ss-text)] mb-2">
        Unsubscribe from these emails?
      </h1>

      {initialEmail ? (
        <p className="text-sm text-[color:var(--ss-text-soft)] mb-6">
          We&apos;ll stop emailing{" "}
          <span className="font-semibold text-[color:var(--ss-text)] break-all">
            {initialEmail}
          </span>
          .
        </p>
      ) : (
        <div className="mb-6">
          <label
            htmlFor="unsubscribe-email"
            className="text-xs font-semibold text-[color:var(--ss-text-muted)] mb-1.5 block"
          >
            Your email address
          </label>
          <input
            id="unsubscribe-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full h-12 px-4 rounded-2xl border border-[#26203f] bg-[var(--ss-surface-2)] text-sm text-[color:var(--ss-text)] placeholder-[#6f6889] outline-none focus:border-[var(--ss-purple)] transition-colors"
          />
        </div>
      )}

      <fieldset className="mb-6">
        <legend className="text-xs font-semibold text-[color:var(--ss-text-muted)] mb-2">
          Mind telling us why? (optional)
        </legend>
        <div className="flex flex-col gap-1">
          {REASONS.map((r) => (
            <label
              key={r}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm text-[color:var(--ss-text-soft)] hover:bg-[var(--ss-surface-2)] transition-colors"
            >
              <input
                type="radio"
                name="reason"
                value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
                className="accent-[#6c47ff] w-4 h-4 flex-shrink-0"
              />
              {r}
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <div className="mb-4">
          <p className="text-sm text-red-500 font-medium">{error}</p>
          {/* Never a dead end: they have a legal right to opt out, and a broken
              form cannot be the reason they can't. */}
          <p className="text-xs text-[color:var(--ss-text-muted)] mt-1">
            If this keeps failing, just reply to the email and say
            &quot;unsubscribe&quot; — that works too.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full h-13 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ss-purple-light)]"
        style={{
          background: "linear-gradient(135deg, var(--ss-purple), var(--ss-purple-light))",
          height: 52,
        }}
      >
        {submitting ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Unsubscribing…
          </>
        ) : (
          "Unsubscribe"
        )}
      </button>
    </form>
  );
}
