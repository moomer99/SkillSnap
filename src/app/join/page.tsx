// ─────────────────────────────────────────────
// SkillSnap — /join  (invite page for the first skilled pros)
//
// The link Mo sends in DMs and outreach. One job: get a pro to create a
// profile and post their first piece of work.
//
// Signup: the single CTA goes to /get, the existing app-download redirect
// (iOS → App Store, Android → Google Play). Posting is mobile-only — the web
// app is browse-only — so the app is the real signup flow for a pro.
//
// Server component, read with the anonymous client like /@username, so it
// renders with no client JS and stays cacheable.
//
// Copy rules: every claim here is already made elsewhere in the product
// (layout.tsx, /help, /terms, LandingPage). No customer, job or lead
// promises. Change the offer here only after it changes there.
// ─────────────────────────────────────────────
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin, Play, Video, UserRound, Sparkles, HandHelping } from "lucide-react";
import SkillSnapLogo from "@/components/skillsnap/shared/SkillSnapLogo";
import {
  createPublicClient,
  PUBLIC_PROFILE_COLUMNS,
  PUBLIC_POST_COLUMNS,
  type PublicProfile,
  type PublicPost,
} from "@/lib/supabase/public";
import { SUPPORT_EMAIL } from "@/constants/contact";

// Re-read the featured profile at most every 5 minutes (same as /@username).
export const revalidate = 300;

/**
 * Pin a specific pro for the preview card — use someone who has agreed to be
 * featured on a recruiting page. null = pick automatically (most jobs done,
 * with at least one post), the same rule the landing page hero uses.
 */
const FEATURED_USERNAME: string | null = "adams"; // Adam S, Barber

const SIGNUP_HREF = "/get";

/** Prefilled email for "help me set up my first post". */
const SETUP_HELP_MAILTO =
  `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Help me set up my first SkillSnap post")}` +
  `&body=${encodeURIComponent("Hi Mo,\n\nName:\nWhat I do:\nArea:\nLink to my work (optional):\n")}`;

const TITLE = "Join SkillSnap — Show your work. Get discovered.";
const DESCRIPTION =
  "Barbers, tattoo artists and skilled pros in Sydney: create a free SkillSnap profile and post short videos of your real work so locals can find you.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://skillsnap.com.au/join" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://skillsnap.com.au/join",
    siteName: "SkillSnap",
    images: [{ url: "https://skillsnap.com.au/og-image.png", width: 1200, height: 630 }],
    locale: "en_AU",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

// ── Data: one real public profile + its latest post ─────────────────────────
type Featured = { profile: PublicProfile; post: PublicPost };

async function getFeatured(): Promise<Featured | null> {
  try {
    const sb = createPublicClient();
    let query = sb.from("profiles").select(PUBLIC_PROFILE_COLUMNS).not("skill", "is", null);
    query = FEATURED_USERNAME
      ? query.ilike("username", FEATURED_USERNAME)
      : query.neq("role", "client").order("jobs_done", { ascending: false });
    const { data: profiles, error } = await query.limit(12);
    if (error || !profiles?.length) return null;

    const list = profiles as unknown as PublicProfile[];
    const { data: posts, error: postsErr } = await sb
      .from("visible_posts")
      .select(PUBLIC_POST_COLUMNS)
      .in("author_id", list.map((p) => p.id))
      .not("thumbnail_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(60);
    if (postsErr || !posts?.length) return null;

    const rows = posts as unknown as PublicPost[];
    for (const profile of list) {
      const post = rows.find((r) => r.author_id === profile.id);
      if (post && profile.username) return { profile, post };
    }
    return null;
  } catch (e) {
    console.error("[/join] featured profile fetch failed:", e);
    return null;
  }
}

// ── Page ────────────────────────────────────────────────────────────────────
export default async function JoinPage() {
  const featured = await getFeatured();

  return (
    <main
      className="min-h-screen"
      style={{
        background: "var(--ss-bg)",
        color: "var(--ss-text)",
        fontFamily: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* ── Top bar ── */}
      <nav style={{ borderBottom: "1px solid var(--ss-line)" }}>
        <div className="mx-auto w-full max-w-[1040px] px-4 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" aria-label="SkillSnap home">
            <SkillSnapLogo variant="full" size="sm" dark />
          </Link>
          <Link
            href="/discover"
            className="text-sm font-semibold px-3 py-2 rounded-full transition-opacity hover:opacity-70"
            style={{ color: "var(--ss-text-soft)" }}
          >
            Browse Pros
          </Link>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-[1040px] px-4 sm:px-8">
        {/* ── Hero + preview ── */}
        <section className="py-10 sm:py-16 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center">
          <div>
            <p
              className="text-[11px] font-bold tracking-[0.18em] uppercase"
              style={{ color: "var(--ss-purple-light)" }}
            >
              For skilled pros in Sydney
            </p>
            <h1
              className="font-extrabold tracking-tight leading-[1.06] text-[36px] sm:text-[52px] mt-3 mb-5"
              style={{ fontFamily: "var(--font-poppins), var(--font-geist-sans), sans-serif" }}
            >
              Show your work.
              <br />
              <span style={{ color: "var(--ss-purple-light)" }}>Get discovered.</span>
            </h1>
            <p className="text-[16px] sm:text-[18px] leading-relaxed max-w-[520px]" style={{ color: "var(--ss-text-soft)" }}>
              SkillSnap is where skilled people show their work on video. Barbers, tattoo artists,
              tradies, cleaners, photographers, tutors and everyone in between post short videos of
              jobs they have actually done — locals watch the work, then message them directly.
            </p>

            {/* Early-member offer — same terms as /help, /terms and the landing page */}
            <div
              className="mt-6 rounded-2xl p-4 flex gap-3 max-w-[520px]"
              style={{ background: "var(--ss-purple-soft)", border: "1px solid var(--ss-purple-border)" }}
            >
              <Sparkles size={18} aria-hidden className="flex-shrink-0 mt-0.5" style={{ color: "var(--ss-purple-light)" }} />
              <p className="text-[14px] leading-relaxed">
                <strong>Free to join, no booking fees.</strong>{" "}
                <span style={{ color: "var(--ss-text-soft)" }}>
                  Early members get first access to Pro features when we launch them.
                </span>
              </p>
            </div>

            <PrimaryCta />
          </div>

          <ProfilePreview featured={featured} />
        </section>

        {/* ── How it works ── */}
        <section className="py-12 sm:py-16" style={{ borderTop: "1px solid var(--ss-line)" }} aria-labelledby="how">
          <h2 id="how" className="text-[26px] sm:text-[32px] font-extrabold leading-tight mb-8">
            Three steps to your first post
          </h2>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { Icon: UserRound, title: "Create your profile", desc: "Download SkillSnap, sign up and pick your skill — that makes you a Pro." },
              { Icon: MapPin, title: "Add your area", desc: "Set the suburb you work in so people nearby can find you on Discover." },
              { Icon: Video, title: "Post your work", desc: "Record a short video or pick one you already have. Add a caption and post it." },
            ].map(({ Icon, title, desc }, i) => (
              <li
                key={title}
                className="rounded-3xl p-6"
                style={{ background: "var(--ss-card-tint)", border: "1px solid var(--ss-line)" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background: "var(--ss-purple-soft)", color: "var(--ss-purple-light)" }}
                    aria-hidden
                  >
                    <Icon size={20} />
                  </span>
                  <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "var(--ss-text-dim)" }}>
                    Step {i + 1}
                  </span>
                </div>
                <h3 className="text-[18px] font-bold mb-1.5">{title}</h3>
                <p className="text-[14px] leading-relaxed" style={{ color: "var(--ss-text-muted)" }}>{desc}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Setup help ── */}
        <section
          className="mb-12 sm:mb-16 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row gap-5 sm:items-center"
          style={{ background: "var(--ss-card-pro)", border: "1px solid var(--ss-purple-border)" }}
          aria-labelledby="help"
        >
          <span
            className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center"
            style={{ background: "rgba(108,71,255,0.28)", color: "#c4b5fd" }}
            aria-hidden
          >
            <HandHelping size={24} />
          </span>
          <div className="flex-1">
            <h2 id="help" className="text-[20px] sm:text-[22px] font-extrabold mb-1.5">
              Not sure where to start? I&apos;ll help.
            </h2>
            <p className="text-[14px] sm:text-[15px] leading-relaxed" style={{ color: "var(--ss-text-soft)" }}>
              I&apos;m Mo, I built SkillSnap. For early members I&apos;ll help set up your profile and
              first post — send me the videos you already have and I&apos;ll walk you through it.
            </p>
          </div>
          <a
            href={SETUP_HELP_MAILTO}
            className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-2xl text-[14px] font-semibold underline-offset-4 hover:underline"
            style={{ color: "var(--ss-purple-light)", border: "1px solid var(--ss-purple-border)" }}
          >
            Email me for setup help
          </a>
        </section>

        {/* ── Straight answers ── */}
        <section className="pb-12 sm:pb-16" aria-labelledby="faq">
          <h2 id="faq" className="text-[22px] sm:text-[26px] font-extrabold mb-5">Straight answers</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 max-w-[880px]">
            <Faq q="Does it cost anything?">
              No. SkillSnap is free for pros and for clients, and there are no booking fees.
            </Faq>
            <Faq q="Will I get jobs?">
              We can&apos;t promise that. SkillSnap puts your work in front of locals and lets them
              message you directly — any job you agree is between you and them.
            </Faq>
            <Faq q="What should I post?">
              Short videos or photos of work you&apos;ve actually done — a fresh fade, a finished
              tattoo, a job before and after. Clips you already film for Instagram or TikTok are a
              good start.
            </Faq>
            <Faq q="Who can join?">
              Anyone 18 or over with a skill worth watching — individuals and small businesses.
            </Faq>
          </dl>
        </section>

        {/* ── Closing CTA (same single destination) ── */}
        <section className="pb-16 text-center">
          <h2 className="text-[24px] sm:text-[30px] font-extrabold mb-2">Ready to show your work?</h2>
          <div className="flex justify-center">
            <PrimaryCta compact />
          </div>
        </section>
      </div>

      <footer style={{ borderTop: "1px solid var(--ss-line)" }}>
        <div className="mx-auto w-full max-w-[1040px] px-4 sm:px-8 py-6 flex flex-wrap gap-x-5 gap-y-2 text-[13px]" style={{ color: "var(--ss-text-dim)" }}>
          <span>SkillSnap · Sydney, NSW</span>
          <Link href="/help" className="hover:underline">Help</Link>
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          <Link href="/terms" className="hover:underline">Terms</Link>
        </div>
      </footer>
    </main>
  );
}

// ── Pieces ──────────────────────────────────────────────────────────────────

/** The one call to action. Phones go straight to their store via /get. */
function PrimaryCta({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "mt-5" : "mt-7"}>
      <a
        href={SIGNUP_HREF}
        className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 min-h-[56px] px-8 rounded-2xl text-[16px] font-bold text-white transition-transform active:scale-[0.97] hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ background: "var(--ss-purple)", boxShadow: "0 6px 24px rgba(108,71,255,0.42)", outlineColor: "var(--ss-purple-light)" }}
      >
        Create your profile
        <ArrowRight size={18} aria-hidden className="transition-transform group-hover:translate-x-1" />
      </a>
      <p className="text-[13px] mt-3" style={{ color: "var(--ss-text-muted)" }}>
        {/* /get is a redirect route, not a page — plain <a>, never <Link>. */}
        {/* eslint-disable @next/next/no-html-link-for-pages */}
        Opens the SkillSnap app in your phone&apos;s app store. On a computer? Get it for{" "}
        <a href="/get?store=ios" className="underline underline-offset-2" style={{ color: "var(--ss-text-soft)" }}>iPhone</a>{" "}
        or{" "}
        <a href="/get?store=android" className="underline underline-offset-2" style={{ color: "var(--ss-text-soft)" }}>Android</a>.
        {/* eslint-enable @next/next/no-html-link-for-pages */}
      </p>
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[15px] font-bold mb-1">{q}</dt>
      <dd className="text-[14px] leading-relaxed" style={{ color: "var(--ss-text-muted)" }}>{children}</dd>
    </div>
  );
}

/**
 * A real public profile when one is available (linked to its /@username page);
 * otherwise a clearly labelled sample with no name or photo of a real person.
 */
function ProfilePreview({ featured }: { featured: Featured | null }) {
  const real = !!featured;
  const name = featured ? featured.profile.display_name || featured.profile.username : "Your name";
  const skill = featured?.profile.skill ?? "Your skill";
  const suburb = featured?.profile.location?.split(",")[0].trim() ?? "Your suburb";
  const gradient = featured?.profile.avatar_gradient ?? "linear-gradient(135deg, #6c47ff, #a78bfa)";
  const thumb = featured?.post.thumbnail_url ?? null;
  const caption = featured?.post.caption ?? "Your work video goes here";
  const isVideo = featured ? featured.post.type === "video" : true;

  const card = (
    <div
      className="w-full max-w-[340px] mx-auto rounded-3xl overflow-hidden"
      style={{ background: "var(--ss-surface)", border: "1px solid var(--ss-line-strong)", boxShadow: "0 24px 60px rgba(0,0,0,0.45)" }}
    >
      <div className="relative aspect-[4/5]" style={{ background: featured?.post.thumbnail_gradient ?? gradient }}>
        {thumb && (
          <img
            src={thumb}
            alt={featured?.post.caption || `Work by ${name}`}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 45%, rgba(13,10,26,0.9))" }} />
        {isVideo && (
          <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
            <span className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <Play size={20} fill="white" color="white" />
            </span>
          </span>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-white text-[13px] leading-snug line-clamp-2">{caption}</p>
        </div>
      </div>
      <div className="p-4 flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-white font-bold"
          style={{ background: gradient }}
          aria-hidden
        >
          {featured?.profile.avatar_url ? (
            <img src={featured.profile.avatar_url} alt="" width={44} height={44} loading="lazy" className="w-full h-full object-cover" />
          ) : (
            <span>{real ? (featured?.profile.avatar_initial ?? name.charAt(0).toUpperCase()) : "?"}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[15px] truncate">{name}</p>
          <p className="text-[13px] truncate" style={{ color: "var(--ss-text-muted)" }}>
            {skill} · {suburb}
          </p>
        </div>
        <span
          className="text-[12px] font-bold px-3 py-1.5 rounded-full text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
        >
          Pro
        </span>
      </div>
    </div>
  );

  return (
    <figure className="w-full">
      <figcaption className="text-center text-[12px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--ss-text-dim)" }}>
        {real ? "A real profile on SkillSnap" : "Sample profile — not a real person"}
      </figcaption>
      {real && featured ? (
        <Link
          href={`/@${featured.profile.username}`}
          className="block rounded-3xl transition-transform hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
          aria-label={`View ${name}'s profile on SkillSnap`}
        >
          {card}
        </Link>
      ) : (
        card
      )}
    </figure>
  );
}
