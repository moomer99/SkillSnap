"use client";
// ─────────────────────────────────────────────
// Contact / Feedback modal for the landing-page footer.
//
// Both the "Contact" and "Feedback" footer links open this; they differ only
// in title and an optional subject prefixed to the message. Submits to the
// send-feedback edge function via the anon Supabase client (works logged-out).
// ─────────────────────────────────────────────
import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

type Status = "idle" | "sending" | "sent" | "error";

export default function ContactModal({
  open,
  onClose,
  title,
  subject,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subject?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  // Reset each time the modal is opened, so switching Contact/Feedback or
  // reopening after a send starts clean.
  useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setMessage("");
      setStatus("idle");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const canSubmit = email.trim() !== "" && message.trim() !== "" && status !== "sending";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("sending");
    try {
      const body = {
        name: name.trim(),
        email: email.trim(),
        message: subject ? `${subject}\n\n${message.trim()}` : message.trim(),
      };
      const { error } = await getSupabase().functions.invoke("send-feedback", { body });
      setStatus(error ? "error" : "sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-full max-w-[440px] animate-slide-up"
        style={{ background: "#16122a", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.08)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[#9d97b5]"
          style={{ background: "#1c1733" }}
        >
          <X size={16} />
        </button>

        <div className="p-6 sm:p-7">
          <h3 className="text-[20px] font-extrabold text-white mb-5">{title}</h3>

          {status === "sent" ? (
            <p className="text-[15px] leading-relaxed text-white py-4">
              Message sent! We&apos;ll get back to you at{" "}
              <span style={{ color: "#a78bfa", fontWeight: 600 }}>hello@skillsnap.com.au</span>
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <Field label="Name">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className="ss-modal-input"
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="ss-modal-input"
                />
              </Field>
              <Field label="Message">
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="ss-modal-input resize-none"
                />
              </Field>

              {status === "error" && (
                <p className="text-[13px] leading-snug" style={{ color: "#f87171" }}>
                  Something went wrong. Please email us at hello@skillsnap.com.au
                </p>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full h-12 rounded-2xl font-bold text-[15px] text-white mt-1 flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
                style={{ background: "#6c47ff" }}
              >
                {status === "sending" ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Sending…
                  </>
                ) : (
                  "Send Message"
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      <style jsx>{`
        :global(.ss-modal-input) {
          width: 100%;
          background: #0f0c1f;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 11px 14px;
          font-size: 14px;
          color: #ffffff;
          outline: none;
          transition: border-color 120ms ease;
        }
        :global(.ss-modal-input:focus) {
          border-color: #6c47ff;
        }
        :global(.ss-modal-input::placeholder) {
          color: rgba(255, 255, 255, 0.35);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}
