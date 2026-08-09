// ─────────────────────────────────────────────
// SkillSnap — Public profile  ( /@username )
//
// The main sharing surface. Server-rendered so links unfurl with the pro's name,
// skill and avatar, and so the page works for logged-out visitors with no JS.
// Data is read with the anonymous client (no cookies) to keep the page cacheable.
// ─────────────────────────────────────────────
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { MapPin, BadgeCheck } from "lucide-react";
import {
  createPublicClient,
  PUBLIC_PROFILE_COLUMNS,
  PUBLIC_POST_COLUMNS,
  type PublicProfile,
  type PublicPost,
} from "@/lib/supabase/public";
import { SITE_URL, profileUrl } from "@/constants/config";
import SkillSnapLogo from "@/components/skillsnap/shared/SkillSnapLogo";
import AppStoreButtons from "@/components/skillsnap/shared/AppStoreButtons";
import ConnectAction from "./ConnectAction";
import WorkGrid from "./WorkGrid";

// Re-render at most every 5 minutes; stats change slowly.
export const revalidate = 300;

interface PageProps {
  params: Promise<{ username: string }>;
}

/** Strips the leading "@" (or "%40") from the route segment. */
function parseHandle(segment: string): string | null {
  const decoded = decodeURIComponent(segment);
  if (!decoded.startsWith("@")) return null;
  const handle = decoded.slice(1).trim().toLowerCase();
  // usernames are [a-z0-9_] in this app
  if (!handle || !/^[a-z0-9_.]+$/.test(handle)) return null;
  return handle;
}

const getProfile = cache(async (handle: string): Promise<PublicProfile | null> => {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("profiles")
    .select(PUBLIC_PROFILE_COLUMNS)
    .ilike("username", handle)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[/@username] profile query failed:", error.message);
    return null;
  }
  return (data as unknown as PublicProfile) ?? null;
});

const getPosts = cache(async (authorId: string): Promise<PublicPost[]> => {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("visible_posts")
    .select(PUBLIC_POST_COLUMNS)
    .eq("author_id", authorId)
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) {
    console.error("[/@username] posts query failed:", error.message);
    return [];
  }
  return (data as unknown as PublicPost[]) ?? [];
});

// ── Metadata — per-profile OpenGraph ───────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const handle = parseHandle(username);
  if (!handle) return { title: "Profile not found | SkillSnap" };

  const profile = await getProfile(handle);
  if (!profile) {
    return {
      title: "Profile not found | SkillSnap",
      robots: { index: false, follow: false },
    };
  }

  const name = profile.display_name || profile.username;
  const skill = profile.skill;
  const title = skill ? `${name} — ${skill} on SkillSnap` : `${name} on SkillSnap`;

  const bits: string[] = [];
  if (profile.bio) bits.push(profile.bio);
  if ((profile.jobs_done ?? 0) > 0) bits.push(`${profile.jobs_done} jobs done`);
  if ((profile.happy_percent ?? 0) > 0) bits.push(`${profile.happy_percent}% happy clients`);
  if (profile.location) bits.push(profile.location);
  const description =
    bits.length > 0
      ? bits.join(" · ")
      : `Watch ${name}'s real work on SkillSnap. Watch. Trust. Connect.`;

  const url = profileUrl(profile.username);
  const image = profile.avatar_url ?? `${SITE_URL}/og-image.png`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "SkillSnap",
      type: "profile",
      locale: "en_AU",
      images: [{ url: image, width: 1200, height: 630, alt: name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

// ── Page ───────────────────────────────────────
export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  const handle = parseHandle(username);
  if (!handle) notFound();

  const profile = await getProfile(handle);
  if (!profile) notFound();

  const posts = await getPosts(profile.id);

  const name = profile.display_name || profile.username;
  const gradient = profile.avatar_gradient ?? "linear-gradient(135deg, #6c47ff, #a78bfa)";
  const isPro = profile.role !== "client" && !!profile.skill;
  const jobsDone = profile.jobs_done ?? 0;
  const happy = profile.happy_percent ?? 0;
  const followers = profile.followers_count ?? 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    alternateName: `@${profile.username}`,
    url: profileUrl(profile.username),
    ...(profile.avatar_url ? { image: profile.avatar_url } : {}),
    ...(profile.bio ? { description: profile.bio } : {}),
    ...(profile.skill ? { jobTitle: profile.skill } : {}),
    ...(profile.location ? { homeLocation: { "@type": "Place", name: profile.location } } : {}),
  };

  return (
    <main
      className="min-h-screen"
      style={{
        background: "#0d0a1a",
        color: "white",
        fontFamily: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Top bar ── */}
      <nav
        className="sticky top-0 z-50 h-14 px-5 flex items-center justify-between"
        style={{ background: "rgba(13,10,26,0.92)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <a href="/" aria-label="SkillSnap home">
          <SkillSnapLogo variant="full" size="sm" dark />
        </a>
        <a
          href="/"
          className="text-xs font-bold px-4 py-2 rounded-full transition-all active:scale-95"
          style={{ background: "rgba(108,71,255,0.18)", border: "1px solid rgba(108,71,255,0.45)", color: "#a78bfa" }}
        >
          Browse SkillSnap
        </a>
      </nav>

      <div className="mx-auto w-full max-w-[720px] px-5 pb-16">

        {/* ── Banner ── */}
        <div
          className="relative h-32 sm:h-40 rounded-b-3xl -mx-5 sm:mx-0 sm:mt-4 sm:rounded-3xl overflow-hidden"
          style={{ background: gradient }}
        >
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(13,10,26,0.05), rgba(13,10,26,0.85))" }}
          />
        </div>

        {/* ── Identity ── */}
        <section className="-mt-12 relative flex flex-col items-center text-center">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-extrabold overflow-hidden"
            style={{ background: gradient, border: "4px solid #0d0a1a" }}
          >
            {profile.avatar_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={profile.avatar_url}
                alt={name}
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{profile.avatar_initial ?? name.charAt(0).toUpperCase()}</span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-4">
            <h1 className="text-[24px] font-extrabold leading-tight">{name}</h1>
            {profile.is_verified && <BadgeCheck size={20} color="#6c47ff" fill="rgba(108,71,255,0.2)" />}
          </div>

          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
            @{profile.username}
          </p>

          <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
            {profile.skill && (
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-full"
                style={{ background: "rgba(108,71,255,0.18)", border: "1px solid rgba(108,71,255,0.45)", color: "#a78bfa" }}
              >
                {profile.skill}
              </span>
            )}
            {isPro && (
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-full text-white"
                style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
              >
                Pro
              </span>
            )}
          </div>

          {profile.bio && (
            <p className="text-sm leading-relaxed mt-4 max-w-[420px]" style={{ color: "rgba(255,255,255,0.72)" }}>
              {profile.bio}
            </p>
          )}

          {profile.location && (
            <p className="flex items-center gap-1.5 text-sm mt-3" style={{ color: "#a78bfa" }}>
              <MapPin size={14} />
              {profile.location}
            </p>
          )}
        </section>

        {/* ── Stats ── */}
        <section
          className="mt-6 rounded-2xl flex items-stretch"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <Stat value={jobsDone >= 1000 ? `${(jobsDone / 1000).toFixed(1)}k` : String(jobsDone)} label="Jobs Done" highlight />
          <Divider />
          <Stat value={happy > 0 ? `${happy}%` : "—"} label="😊 Happy" />
          <Divider />
          <Stat
            value={followers >= 1000 ? `${(followers / 1000).toFixed(1)}k` : String(followers)}
            label="Followers"
          />
        </section>

        {/* ── Connect ── */}
        <section className="mt-4">
          <ConnectAction userId={profile.id} />
          <p className="text-center text-[11px] mt-2" style={{ color: "rgba(255,255,255,0.35)" }}>
            Message {name.split(" ")[0]} directly on SkillSnap — free
          </p>
        </section>

        {/* ── Download CTA ── */}
        <section
          className="mt-7 rounded-3xl p-6 text-center relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(108,71,255,0.22), rgba(167,139,250,0.10))",
            border: "1px solid rgba(108,71,255,0.35)",
          }}
        >
          <div
            className="absolute pointer-events-none"
            style={{ top: "-40%", left: "50%", transform: "translateX(-50%)", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(108,71,255,0.30) 0%, transparent 65%)" }}
          />
          <div className="relative">
            <p className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "#a78bfa" }}>
              Get the app
            </p>
            <h2 className="text-[20px] font-extrabold mt-2 leading-snug">
              Download SkillSnap
            </h2>
            <p className="text-[13px] leading-relaxed mt-2 mb-5 max-w-[340px] mx-auto" style={{ color: "rgba(255,255,255,0.55)" }}>
              Watch {name.split(" ")[0]}&apos;s work, message directly and find more skilled locals near you.
            </p>
            <AppStoreButtons />
          </div>
        </section>

        {/* ── Work grid ── */}
        <section className="mt-8">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[15px] font-bold">Work</h2>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>
              {posts.length} {posts.length === 1 ? "post" : "posts"}
            </span>
          </div>

          {posts.length > 0 ? (
            <WorkGrid posts={posts} />
          ) : (
            <div
              className="rounded-2xl py-12 px-6 text-center"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.12)" }}
            >
              <p className="text-sm font-bold">No work posted yet</p>
              <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                {name.split(" ")[0]} is new to SkillSnap. Connect directly to ask about their work.
              </p>
            </div>
          )}
        </section>

        <footer className="mt-12 text-center">
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.30)" }}>
            © {new Date().getFullYear()} SkillSnap Australia · Sydney, NSW
          </p>
        </footer>
      </div>
    </main>
  );
}

function Stat({ value, label, highlight = false }: { value: string; label: string; highlight?: boolean }) {
  return (
    <div className="flex-1 py-4 flex flex-col items-center gap-0.5">
      <span className="text-[19px] font-extrabold" style={{ color: highlight ? "#a78bfa" : "white" }}>
        {value}
      </span>
      <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
        {label}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="w-px my-4" style={{ background: "rgba(255,255,255,0.10)" }} />;
}
