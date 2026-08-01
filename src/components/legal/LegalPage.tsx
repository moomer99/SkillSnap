import Link from "next/link";
import SkillSnapLogo from "@/components/skillsnap/shared/SkillSnapLogo";

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

export const SUPPORT_EMAIL = "hello@skillsnap.com.au";

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-9">
      <h2 className="font-bold text-[#1a1a1a] text-lg mb-3 scroll-mt-20">{title}</h2>
      <div className="text-[15px] text-[#57534e] leading-relaxed space-y-3">{children}</div>
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
      <h3 className="font-semibold text-[#1a1a1a] text-[15px] mb-1.5">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5 marker:text-[#b0aaa5]">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl px-4 py-3.5 text-[14px] leading-relaxed text-[#4c3a8f]"
      style={{
        background: "linear-gradient(135deg,#ede9fe,#f5f3ff)",
        border: "1.5px solid rgba(108,71,255,0.15)",
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
    <div className="min-h-screen bg-[#f8f7f5]">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e8e4df]">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
          <Link href="/" aria-label="SkillSnap home" className="flex items-center">
            <SkillSnapLogo variant="full" size="xs" />
          </Link>
          <nav className="flex items-center gap-4">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[13px] font-semibold text-[#7a7570] hover:text-[#6c47ff] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-10">
        <h1 className="font-extrabold text-[#1a1a1a] text-[28px] leading-tight mb-2">{title}</h1>
        {lastUpdated && (
          <p className="text-[13px] text-[#b0aaa5] mb-5">Last updated: {lastUpdated}</p>
        )}
        {intro && (
          <p className="text-[15px] text-[#57534e] leading-relaxed mb-9">{intro}</p>
        )}

        {children}

        <div className="mt-12 pt-6 border-t border-[#e8e4df] flex flex-wrap items-center gap-x-5 gap-y-2">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] font-semibold text-[#6c47ff]"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-[13px] font-semibold text-[#6c47ff]"
          >
            {SUPPORT_EMAIL}
          </a>
        </div>
        <p className="text-[12px] text-[#b0aaa5] mt-4">© 2026 SkillSnap · Sydney, NSW, Australia</p>
      </main>
    </div>
  );
}
