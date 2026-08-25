import type { Metadata } from "next";
import SkillSnapLogo from "@/components/skillsnap/shared/SkillSnapLogo";
import UnsubscribeForm from "./UnsubscribeForm";

// ─────────────────────────────────────────────
// /unsubscribe — opt-out page for hand-sent outreach email
//
// This is for the cold outreach Mo sends from mo@skillsnap.com.au, not for the
// app's notification preferences — it must never touch notify_prefs or any
// profile column. Most recipients have no SkillSnap account at all.
//
// Link-only, same as /delete-account: no header nav, disallowed in robots.ts,
// noindex below. Deliberately not wrapped in LegalPage — someone arriving from
// an email footer has one job, and site nav invites wandering.
// ─────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Unsubscribe | SkillSnap",
  description: "Stop receiving outreach emails from SkillSnap.",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const { e } = await searchParams;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-10"
      style={{ background: "var(--ss-bg)" }}
    >
      <div className="mb-8">
        <SkillSnapLogo variant="full" size="lg" dark />
      </div>
      <UnsubscribeForm initialEmail={e} />
    </div>
  );
}
