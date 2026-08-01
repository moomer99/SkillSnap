import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { publicLocationLabel } from "@/lib/publicLocation";
import { displayUsername } from "@/lib/username";
import SkillSnapLogo from "@/components/skillsnap/shared/SkillSnapLogo";

// ─────────────────────────────────────────────
// Public profile — skillsnap.com.au/@username
//
// This is the address the mobile app puts in Share Profile and encodes into
// every profile QR code (see profileUrl.ts in the app repo), so it has to work
// for someone with no account who has just pointed their camera at a sticker.
// Server-rendered, no sign-in, no client JS to wait on.
//
// Reads go through visible_profiles / visible_posts rather than the base
// tables: those views apply block filtering and, being security_invoker, are
// subject to the column-level grants that migration 007 put on profiles. Every
// column named below was verified readable with the anon key alone — adding an
// ungranted one takes the whole query down with "permission denied", not a
// null field.
// ─────────────────────────────────────────────

const PROFILE_COLUMNS =
  "id, username, display_name, avatar_url, bio, skill, location, location_private, availability, jobs_done, happy_percent, followers_count, post_count, role, is_verified, is_early_bird";

const POST_COLUMNS =
  "id, type, media_url, thumbnail_url, thumbnail_gradient, caption, likes_count, created_at";

const MAX_POSTS = 24;

/** Matches the app's scanner: usernames are letters, digits, dot, underscore, dash. */
const HANDLE_PATTERN = /^[A-Za-z0-9._-]+$/;

const AVAILABILITY_LABELS: Record<string, string> = {
  available_today: "Available today",
  on_request: "On request",
  prebook: "Pre-book",
};

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  skill: string | null;
  location: string | null;
  location_private: boolean | null;
  availability: string | null;
  jobs_done: number | null;
  happy_percent: number | null;
  followers_count: number | null;
  post_count: number | null;
  role: string | null;
  is_verified: boolean | null;
  is_early_bird: boolean | null;
};

type Post = {
  id: string;
  type: "video" | "photo";
  media_url: string | null;
  thumbnail_url: string | null;
  thumbnail_gradient: string | null;
  caption: string | null;
  likes_count: number | null;
  created_at: string;
};

/**
 * The handle from the URL, without its leading @.
 *
 * The @ is required. Without it this route would answer for every unmatched
 * path on the site and render a profile page for typos.
 */
function bareHandle(raw: string): string | null {
  let value: string;
  try {
    value = decodeURIComponent(raw).trim();
  } catch {
    return null;
  }
  if (!value.startsWith("@")) return null;

  const bare = value.slice(1);
  return HANDLE_PATTERN.test(bare) ? bare : null;
}

/**
 * Deduped so generateMetadata and the page itself share one round trip.
 *
 * A plain case-insensitive match. Usernames are stored bare and constrained to
 * that shape by 20260801110000_normalise_usernames.sql in the app repo, so
 * there is nothing left to be tolerant of — this route depends on that
 * migration having been applied.
 */
const getProfile = cache(async (bare: string): Promise<Profile | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("visible_profiles")
    .select(PROFILE_COLUMNS)
    .ilike("username", bare)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("public profile lookup failed:", error.message);
    return null;
  }

  return (data as unknown as Profile | null) ?? null;
});

const getPosts = cache(async (authorId: string): Promise<Post[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("visible_posts")
    .select(POST_COLUMNS)
    .eq("author_id", authorId)
    .order("created_at", { ascending: false })
    .limit(MAX_POSTS);

  if (error) {
    // A profile with no grid still beats a 500.
    console.error("public profile posts failed:", error.message);
    return [];
  }

  return (data ?? []) as unknown as Post[];
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const bare = bareHandle(username);
  if (!bare) return { title: "Profile not found | SkillSnap" };

  const profile = await getProfile(bare);
  if (!profile) return { title: "Profile not found | SkillSnap" };

  const name = profile.display_name?.trim() || bare;
  const handle = displayUsername(profile.username) || `@${bare}`;
  const title = `${name} (${handle}) | SkillSnap`;

  const location = publicLocationLabel(profile.location, profile.location_private);
  const descriptionParts = [profile.skill, location ? `in ${location}` : null].filter(
    Boolean
  );
  const description =
    profile.bio?.trim() ||
    (descriptionParts.length > 0
      ? `${name} — ${descriptionParts.join(" ")}. Watch their work on SkillSnap.`
      : `Watch ${name}'s work on SkillSnap.`);

  const posts = await getPosts(profile.id);
  const image =
    profile.avatar_url ||
    posts.find((p) => p.thumbnail_url || p.media_url)?.thumbnail_url ||
    posts.find((p) => p.media_url)?.media_url ||
    "https://skillsnap.com.au/og-image.png";

  const url = `https://skillsnap.com.au/${handle}`;

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
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex-1 px-2 text-center">
      <p className="text-[17px] font-extrabold text-[#1a1a1a] truncate">{value}</p>
      <p className="text-[11px] text-[#7a7570] mt-0.5">{label}</p>
    </div>
  );
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const bare = bareHandle(username);
  if (!bare) notFound();

  const profile = await getProfile(bare);
  if (!profile) notFound();

  const posts = await getPosts(profile.id);

  const name = profile.display_name?.trim() || bare;
  const handle = displayUsername(profile.username) || `@${bare}`;
  const availability = profile.availability
    ? AVAILABILITY_LABELS[profile.availability]
    : null;
  const initial = (name || handle).charAt(0).toUpperCase();
  // Every viewer of this page is "other people", so the suburb-only form
  // applies unconditionally when its owner asked for it.
  const location = publicLocationLabel(profile.location, profile.location_private);

  return (
    <div className="min-h-screen bg-[#f8f7f5]">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e8e4df]">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
          <Link href="/" aria-label="SkillSnap home" className="flex items-center">
            <SkillSnapLogo variant="full" size="xs" />
          </Link>
          <Link
            href="/"
            className="text-[13px] font-bold text-white px-4 py-2 rounded-xl"
            style={{ background: "linear-gradient(135deg,#6c47ff,#8b6af5)" }}
          >
            Open SkillSnap
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto pb-14">
        {/* Header block — the same brand surface the app uses on a profile. */}
        <section
          className="px-6 pt-9 pb-16 flex flex-col items-center text-center"
          style={{ background: "linear-gradient(135deg,#2a1a63,#5b38d6)" }}
        >
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={name}
              className="w-24 h-24 rounded-full object-cover"
              style={{ border: "3px solid rgba(255,255,255,0.85)" }}
            />
          ) : (
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-[32px] font-extrabold text-white"
              style={{
                background: "#6c47ff",
                border: "3px solid rgba(255,255,255,0.85)",
              }}
            >
              {initial}
            </div>
          )}

          <div className="flex items-center justify-center flex-wrap gap-2 mt-3">
            <h1 className="text-[20px] font-extrabold text-white">{name}</h1>
            {profile.is_verified && (
              <span
                className="text-[11px] font-bold text-white px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.2)" }}
              >
                Verified
              </span>
            )}
            {profile.role && (
              <span
                className="text-[11px] font-bold text-white px-2.5 py-0.5 rounded-full capitalize"
                style={{ background: "rgba(255,255,255,0.2)" }}
              >
                {profile.role}
              </span>
            )}
            {availability && (
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white px-2.5 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.2)" }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full inline-block"
                  style={{
                    background:
                      profile.availability === "available_today"
                        ? "#2ecc71"
                        : "rgba(255,255,255,0.6)",
                  }}
                />
                {availability}
              </span>
            )}
          </div>

          <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
            {handle}
          </p>

          <p className="text-[13px] mt-2" style={{ color: "rgba(255,255,255,0.75)" }}>
            {location || "No location set"}
            {profile.skill ? ` · ${profile.skill}` : ""}
          </p>

          {profile.bio && (
            <p
              className="text-[13px] leading-relaxed mt-3 max-w-[320px]"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              {profile.bio}
            </p>
          )}

          {profile.is_early_bird && (
            <span className="mt-3 text-[12px] font-bold px-3 py-1 rounded-full bg-[#fff4d6] text-[#8a6100]">
              🔥 Early Bird
            </span>
          )}
        </section>

        {/* Stats — lifted over the gradient's edge, as in the app. */}
        <div className="px-5">
          <div className="flex bg-white rounded-[18px] border border-[#e8e4df] py-3.5 -mt-11 relative">
            <Stat label="Jobs" value={profile.jobs_done ?? 0} />
            <div className="w-px bg-[#f0eeea] my-1" />
            <Stat
              label="Happy"
              value={(profile.happy_percent ?? 0) > 0 ? `${profile.happy_percent}%` : "New"}
            />
            <div className="w-px bg-[#f0eeea] my-1" />
            <Stat label="Connections" value={profile.followers_count ?? 0} />
            <div className="w-px bg-[#f0eeea] my-1" />
            <Stat label="Based" value={location || "—"} />
          </div>
        </div>

        {/* Call to action — the only way to actually reach this person. */}
        <div className="px-5 mt-5">
          <div
            className="rounded-2xl p-5 text-center"
            style={{
              background: "linear-gradient(135deg,#ede9fe,#f5f3ff)",
              border: "1.5px solid rgba(108,71,255,0.15)",
            }}
          >
            <p className="text-[15px] font-bold text-[#1a1a1a]">
              Want to work with {name}?
            </p>
            <p className="text-[13px] text-[#7a7570] mt-1 leading-relaxed">
              Open SkillSnap to message {name} directly. Free to join, no booking fees.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center w-full max-w-[280px] h-12 rounded-2xl font-extrabold text-[15px] text-white mt-4"
              style={{
                background: "linear-gradient(135deg,#6c47ff,#8b6af5)",
                boxShadow: "0 4px 20px rgba(108,71,255,0.35)",
              }}
            >
              Connect on SkillSnap →
            </Link>
          </div>
        </div>

        {/* Work grid */}
        <section className="mt-8">
          <h2 className="px-5 text-[15px] font-bold text-[#1a1a1a] mb-3">
            Work{posts.length > 0 ? ` (${profile.post_count ?? posts.length})` : ""}
          </h2>

          {posts.length === 0 ? (
            <p className="px-5 text-[14px] text-[#7a7570]">
              {name} hasn&rsquo;t posted any work yet.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-0.5">
              {posts.map((post) => {
                const image = post.thumbnail_url || (post.type === "photo" ? post.media_url : null);
                return (
                  <div
                    key={post.id}
                    className="relative aspect-square overflow-hidden"
                    style={{
                      background:
                        post.thumbnail_gradient ||
                        "linear-gradient(135deg, #6c47ff, #a78bfa)",
                    }}
                  >
                    {image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image}
                        alt={post.caption?.trim() || `Work by ${name}`}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    )}
                    {post.type === "video" && (
                      <span
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(0,0,0,0.45)" }}
                        aria-label="Video"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <footer className="px-5 mt-12 pt-6 border-t border-[#e8e4df] flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href="/privacy" className="text-[13px] font-semibold text-[#6c47ff]">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-[13px] font-semibold text-[#6c47ff]">
            Terms of Service
          </Link>
          <Link href="/help" className="text-[13px] font-semibold text-[#6c47ff]">
            Help
          </Link>
        </footer>
        <p className="px-5 text-[12px] text-[#b0aaa5] mt-4">© 2026 SkillSnap · Sydney</p>
      </main>
    </div>
  );
}
