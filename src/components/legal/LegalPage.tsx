import Link from "next/link";
import SkillSnapLogo from "@/components/skillsnap/shared/SkillSnapLogo";
import { FEEDBACK_MAILTO, SUPPORT_EMAIL } from "@/constants/contact";

// ─────────────────────────────────────────────
// Shared chrome for /privacy, /terms and /help
//
// Server components on purpose — these are static documents that app store
// reviewers open directly, so they should render without waiting on any
// client-side JavaScript or app state.
// ─────────────────────────────────────────────

const LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/help", label: "Help" },
];

/** Deletion is kept out of the header nav but must stay reachable — Google
 *  Play requires a publicly findable deletion page. */
const FOOTER_LINKS = [...LINKS, { href: "/delete-account", label: "Delete account" }];

// Re-exported so the legal pages can keep importing everything from here.
export { FEEDBACK_MAILTO, SUPPORT_EMAIL };

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-9">
      <h2 className="font-bold text-[color:var(--ss-text)] text-lg mb-3 scroll-mt-20">{title}</h2>
      <div className="text-[15px] text-[color:var(--ss-text-soft)] leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export function SubSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5">
      <h3 className="font-semibold text-[color:var(--ss-text)] text-[15px] mb-1.5">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5 marker:text-[color:var(--ss-text-dim)]">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl px-4 py-3.5 text-[14px] leading-relaxed text-[color:var(--ss-text-soft)]"
      style={{
        background: "var(--ss-purple-soft)",
        border: "1.5px solid var(--ss-purple-border)",
      }}
    >
      {children}
    </div>
  );
}

export default function LegalPage({
  title,
  intro,
  lastUpdated,
  children,
}: {
  title: string;
  intro?: string;
  lastUpdated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--ss-bg)]">
      <header className="sticky top-0 z-40 bg-[var(--ss-nav-bg)] backdrop-blur-sm border-b border-[color:var(--ss-line)]">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
          <Link href="/" aria-label="SkillSnap home" className="flex items-center">
            <SkillSnapLogo variant="full" size="xs" />
          </Link>
          <nav className="flex items-center gap-4">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[13px] font-semibold text-[color:var(--ss-text-muted)] hover:text-[color:var(--ss-purple)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-10">
        <h1 className="font-extrabold text-[color:var(--ss-text)] text-[28px] leading-tight mb-2">{title}</h1>
        {lastUpdated && (
          <p className="text-[13px] text-[color:var(--ss-text-dim)] mb-5">Last updated: {lastUpdated}</p>
        )}
        {intro && (
          <p className="text-[15px] text-[color:var(--ss-text-soft)] leading-relaxed mb-9">{intro}</p>
        )}

        {children}

        <div className="mt-12 pt-6 border-t border-[color:var(--ss-line)] flex flex-wrap items-center gap-x-5 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] font-semibold text-[color:var(--ss-purple)]"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-[13px] font-semibold text-[color:var(--ss-purple)]"
          >
            {SUPPORT_EMAIL}
          </a>
        </div>
        <p className="text-[12px] text-[color:var(--ss-text-dim)] mt-4">© 2026 SkillSnap · Sydney, NSW, Australia</p>
      </main>
    </div>
  );
}
