"use client";
// ─────────────────────────────────────────────
// SkillSnap — Landing page (logged-out homepage)
//
// Full-bleed and fully responsive: mobile (375px) → tablet (768px) →
// desktop (1280px+). Dark-first, matching the mobile app.
// ─────────────────────────────────────────────
import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, X, ArrowRight, Play } from "lucide-react";
import type { Screen } from "@/types";
import SkillSnapLogo from "./shared/SkillSnapLogo";
import AppStoreButtons from "./shared/AppStoreButtons";
import ThemeToggle from "./shared/ThemeToggle";
import { useTheme } from "@/hooks/useTheme";
import { getSupabase } from "@/lib/supabase";

interface LandingPageProps {
  onNavigate: (s: Screen) => void;
}

// ── Scroll-triggered fade-in ───────────────────────────────────────────────
function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function FadeIn({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const { ref, visible } = useFadeIn();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ── Featured pros — real profiles from Supabase ────────────────────────────
interface FeaturedPro {
  id: string;
  username: string | null;
  name: string;
  skill: string;
  location: string | null;
  jobsDone: number;
  avatarUrl: string | null;
  avatarGradient: string;
  avatarInitial: string;
  thumbnailUrl: string | null;
  cardGradient: string;
  isVideo: boolean;
}

const FALLBACK_GRADIENTS = [
  "linear-gradient(160deg,#667eea,#764ba2)",
  "linear-gradient(160deg,#f093fb,#f5576c)",
  "linear-gradient(160deg,#4facfe,#00c6ff)",
  "linear-gradient(160deg,#43e97b,#38f9d7)",
];

/**
 * Top pros that have at least one post, newest work first. Feeds the hero
 * phone mockup, which shows the first one's work as the on-screen feed card.
 * Two queries (profiles, then their posts) mirroring the shape the rest of
 * the app uses — the anon key can read both under RLS.
 */
function useFeaturedPros(): FeaturedPro[] {
  const [pros, setPros] = useState<FeaturedPro[]>([]);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes("your-project-ref")) return;
    let cancelled = false;

    void (async () => {
      try {
        const sb = getSupabase();

        const { data: profiles, error: profErr } = await sb
          .from("profiles")
          .select("id, username, display_name, skill, location, jobs_done, avatar_url, avatar_gradient, avatar_initial")
          .not("skill", "is", null)
          .order("jobs_done", { ascending: false })
          .limit(24);

        if (cancelled) return;
        if (profErr || !profiles || profiles.length === 0) {
          if (profErr) console.error("[LandingPage] profiles query failed:", profErr.message);
          return;
        }

        const ids = (profiles as { id: string }[]).map((p) => p.id);
        const { data: posts, error: postsErr } = await sb
          .from("posts")
          .select("author_id, type, thumbnail_url, thumbnail_gradient")
          .in("author_id", ids)
          .order("created_at", { ascending: false });

        if (cancelled) return;
        if (postsErr) {
          console.error("[LandingPage] posts query failed:", postsErr.message);
          return;
        }

        type PostRow = { author_id: string; type: string; thumbnail_url: string | null; thumbnail_gradient: string | null };
        const latest: Record<string, PostRow> = {};
        for (const post of (posts ?? []) as PostRow[]) {
          if (!latest[post.author_id]) latest[post.author_id] = post;
        }

        type ProfileRow = {
          id: string; username: string | null; display_name: string | null; skill: string | null;
          location: string | null; jobs_done: number | null; avatar_url: string | null;
          avatar_gradient: string | null; avatar_initial: string | null;
        };

        const featured = (profiles as ProfileRow[])
          .filter((p) => !!latest[p.id])
          .slice(0, 4)
          .map((p, i): FeaturedPro => {
            const post = latest[p.id];
            const fallback = FALLBACK_GRADIENTS[i % FALLBACK_GRADIENTS.length];
            const name = p.display_name || p.username || "SkillSnap Pro";
            return {
              id: p.id,
              username: p.username,
              name,
              skill: p.skill ?? "Skilled Pro",
              location: p.location,
              jobsDone: p.jobs_done ?? 0,
              avatarUrl: p.avatar_url,
              avatarGradient: p.avatar_gradient ?? fallback,
              avatarInitial: p.avatar_initial ?? name.charAt(0).toUpperCase(),
              thumbnailUrl: post.thumbnail_url,
              cardGradient: post.thumbnail_gradient ?? fallback,
              isVideo: post.type !== "photo",
            };
          });

        setPros(featured);
      } catch (e) {
        console.error("[LandingPage] featured pros fetch failed:", e);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return pros;
}

// ── Shared bits ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-bold tracking-[0.18em] uppercase" style={{ color: "var(--ss-purple-light)" }}>
      {children}
    </span>
  );
}

const CONTAINER = "mx-auto w-full max-w-[1200px] px-5 sm:px-8";

// ── Navigation ─────────────────────────────────────────────────────────────
function LandingNav({ onBrowse, onDownload }: { onBrowse: () => void; onDownload: () => void }) {
  const [open, setOpen] = useState(false);
  const { theme } = useTheme();
  const onDark = theme === "dark";

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <>
      <nav
        className="sticky top-0 z-50 w-full"
        style={{
          background: "var(--ss-nav-bg)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--ss-line)",
        }}
      >
        <div className={`${CONTAINER} h-16 flex items-center justify-between`}>
          {/* Already on "/" — scroll to top rather than reload the page */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Back to top"
            className="flex items-center"
          >
            <span className="hidden sm:block"><SkillSnapLogo variant="full" size="md" dark={onDark} /></span>
            <span className="sm:hidden"><SkillSnapLogo variant="full" size="sm" dark={onDark} /></span>
          </button>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-5">
            <button
              onClick={onBrowse}
              className="text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ color: "var(--ss-text-muted)" }}
            >
              Browse Pros
            </button>
            <ThemeToggle />
            <button
              onClick={onDownload}
              className="h-10 px-5 rounded-full text-sm font-bold text-white transition-transform active:scale-95 hover:-translate-y-0.5"
              style={{ background: "var(--ss-purple)", boxShadow: "0 4px 20px rgba(108,71,255,0.40)" }}
            >
              Download App
            </button>
          </div>

          {/* Mobile — the toggle stays reachable without opening the drawer */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "var(--ss-surface-2)", border: "1px solid var(--ss-line)", color: "var(--ss-text)" }}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 z-[100] md:hidden"
          style={{ background: "var(--ss-scrim)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="absolute top-0 right-0 h-full w-[78%] max-w-[320px] flex flex-col p-5"
            style={{ background: "var(--ss-bg)", borderLeft: "1px solid var(--ss-line)" }}
          >
            <div className="flex items-center justify-between mb-8">
              <SkillSnapLogo variant="full" size="sm" dark={onDark} />
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "var(--ss-surface-2)", border: "1px solid var(--ss-line)", color: "var(--ss-text)" }}
              >
                <X size={20} />
              </button>
            </div>

            <button
              onClick={() => { setOpen(false); onBrowse(); }}
              className="w-full py-4 rounded-2xl text-left px-5 text-[15px] font-semibold mb-3"
              style={{ background: "var(--ss-surface)", border: "1px solid var(--ss-line)", color: "var(--ss-text)" }}
            >
              Browse Pros
            </button>
            <button
              onClick={() => { setOpen(false); onDownload(); }}
              className="w-full py-4 rounded-2xl px-5 text-[15px] font-bold text-white text-left"
              style={{ background: "var(--ss-purple)", boxShadow: "0 4px 20px rgba(108,71,255,0.40)" }}
            >
              Download App
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Phone mockup ───────────────────────────────────────────────────────────
// Colours inside the device are hardcoded dark on purpose: this is a picture
// of the mobile app, which is dark-only, so it must not follow the web theme.
function PhoneMockup({ pro }: { pro?: FeaturedPro }) {
  const gradient = pro?.cardGradient ?? "linear-gradient(160deg,#6c47ff,#2d1b69)";

  return (
    <div className="relative flex items-center justify-center w-full">
      {/* Purple glow behind the phone */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          width: "min(120%, 560px)",
          aspectRatio: "1",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(108,71,255,0.38) 0%, rgba(108,71,255,0.10) 45%, transparent 70%)",
        }}
      />

      {/* Device frame */}
      <div
        className="relative w-[236px] sm:w-[272px] lg:w-[300px]"
        style={{
          aspectRatio: "9 / 19",
          borderRadius: 44,
          padding: 10,
          background: "linear-gradient(160deg,#2a2145,#14102a)",
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 30px 90px rgba(0,0,0,0.55), 0 0 0 1px rgba(108,71,255,0.18)",
        }}
      >
        {/* Screen */}
        <div
          className="relative w-full h-full overflow-hidden flex flex-col"
          style={{ borderRadius: 36, background: "#0d0a1a" }}
        >
          {/* Notch */}
          <div
            aria-hidden
            className="absolute top-2 left-1/2 -translate-x-1/2 z-20"
            style={{ width: 76, height: 20, borderRadius: 99, background: "#07040f" }}
          />

          {/* Feed media */}
          <div className="relative flex-1" style={{ background: gradient }}>
            {pro?.thumbnailUrl && (
              <img
                src={pro.thumbnailUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            )}
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 30%, transparent 45%, rgba(0,0,0,0.88) 100%)" }}
            />

            {pro?.isVideo !== false && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="rounded-full flex items-center justify-center"
                  style={{ width: 52, height: 52, background: "rgba(255,255,255,0.20)", backdropFilter: "blur(6px)", border: "1.5px solid rgba(255,255,255,0.35)" }}
                >
                  <Play size={18} fill="white" color="white" />
                </div>
              </div>
            )}

            {/* In-app author row + stats, mirroring the real feed card */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="flex items-center gap-2 mb-2">
                {pro?.avatarUrl ? (
                  <img src={pro.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-white/30" loading="lazy" />
                ) : (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold border border-white/30"
                    style={{ background: pro?.avatarGradient ?? "linear-gradient(160deg,#6c47ff,#a78bfa)" }}
                  >
                    {pro?.avatarInitial ?? "S"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-white text-[11px] font-bold leading-tight truncate">{pro?.name ?? "Marcus T."}</p>
                  <p className="text-white/60 text-[9px] leading-tight truncate">{pro?.skill ?? "Barber"}</p>
                </div>
              </div>

              <div
                className="flex items-stretch rounded-xl overflow-hidden mb-2"
                style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)" }}
              >
                {[
                  { v: String(pro?.jobsDone ?? 12), l: "Jobs" },
                  { v: "98%", l: "Happy" },
                  { v: "2km", l: "Away" },
                ].map(({ v, l }) => (
                  <div key={l} className="flex-1 py-1.5 flex flex-col items-center">
                    <span className="text-white text-[10px] font-extrabold leading-none">{v}</span>
                    <span className="text-white/55 text-[8px] leading-none mt-0.5">{l}</span>
                  </div>
                ))}
              </div>

              <div
                className="h-7 rounded-xl flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: "#6c47ff" }}
              >
                Connect
              </div>
            </div>
          </div>

          {/* Bottom tab bar */}
          <div
            className="flex items-center justify-around py-2"
            style={{ background: "#16122a", borderTop: "1px solid rgba(255,255,255,0.10)" }}
          >
            {["#6c47ff", "rgba(255,255,255,0.28)", "rgba(255,255,255,0.28)", "rgba(255,255,255,0.28)"].map((c, i) => (
              <span key={i} style={{ width: 16, height: 16, borderRadius: 5, background: c }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function LandingPage({ onNavigate }: LandingPageProps) {
  const pros = useFeaturedPros();
  const { theme } = useTheme();

  const goToFeed = useCallback(() => onNavigate("home"), [onNavigate]);
  const goToSignup = useCallback(() => onNavigate("auth"), [onNavigate]);

  const scrollToDownload = useCallback(() => {
    document.getElementById("download")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  return (
    <div className="w-full min-h-screen" style={{ background: "var(--ss-bg)", color: "var(--ss-text)" }}>
      <LandingNav onBrowse={goToFeed} onDownload={scrollToDownload} />

      {/* ── 1B. HERO ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Ambient glows */}
        <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
          <div style={{ position: "absolute", top: "-25%", left: "8%", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, rgba(108,71,255,0.22) 0%, transparent 66%)" }} />
          <div style={{ position: "absolute", bottom: "-20%", right: "-5%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)" }} />
        </div>

        <div className={`${CONTAINER} relative py-14 sm:py-20 lg:py-0 lg:min-h-[calc(100vh-4rem)] flex items-center`}>
          <div className="w-full grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-10 items-center">

            {/* Copy */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <FadeIn>
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
                  style={{ background: "var(--ss-purple-soft)", border: "1px solid var(--ss-purple-border)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--ss-purple-light)" }} />
                  <SectionLabel>Western Sydney&apos;s Skill Marketplace</SectionLabel>
                </div>
              </FadeIn>

              <FadeIn delay={80}>
                <h1 className="font-extrabold tracking-tight leading-[1.04] text-[42px] sm:text-[56px] lg:text-[68px] mb-5">
                  Watch.{" "}
                  <span style={{ background: "linear-gradient(90deg,#a78bfa,#6c47ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    Trust.
                  </span>{" "}
                  Connect.
                </h1>
              </FadeIn>

              <FadeIn delay={140}>
                <p className="text-[16px] sm:text-[18px] leading-relaxed max-w-[520px] mb-8" style={{ color: "var(--ss-text-muted)" }}>
                  Discover real skills near you. Watch work videos from local pros before you connect.
                </p>
              </FadeIn>

              <FadeIn delay={200} className="w-full">
                <div className="flex flex-col items-center lg:items-start gap-4 w-full">
                  <div className="w-full max-w-[420px] lg:max-w-[440px]">
                    <AppStoreButtons variant="black" />
                  </div>

                  <button
                    onClick={goToFeed}
                    className="group inline-flex items-center gap-2 h-12 px-6 rounded-2xl text-[15px] font-bold transition-all active:scale-[0.97] hover:opacity-80"
                    style={{ border: "1px solid var(--ss-line-strong)" }}
                  >
                    Browse Pros
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </FadeIn>
            </div>

            {/* Phone */}
            <FadeIn delay={260} className="flex justify-center lg:justify-end">
              <PhoneMockup pro={pros[0]} />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── 1C. HOW IT WORKS ──────────────────────────────────────── */}
      <section className="py-16 sm:py-24" style={{ background: "var(--ss-bg-alt)", borderTop: "1px solid var(--ss-line)" }}>
        <div className={CONTAINER}>
          <FadeIn>
            <div className="text-center mb-12">
              <SectionLabel>How it works</SectionLabel>
              <h2 className="text-[28px] sm:text-[38px] font-extrabold mt-3 leading-tight">Simple. Visual. Local.</h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                title: "Watch",
                desc: "Short work videos from skilled pros near you",
                color: "#6c47ff",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M15 10l4.553-2.277A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                  </svg>
                ),
              },
              {
                title: "Trust",
                desc: "Jobs Done counts and real client satisfaction scores",
                color: "#8b6af5",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                ),
              },
              {
                title: "Connect",
                desc: "Message directly. No middleman, no platform fees",
                color: "#a78bfa",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                ),
              },
            ].map(({ title, desc, color, icon }, i) => (
              <FadeIn key={title} delay={i * 100}>
                <div
                  className="h-full p-6 sm:p-7 rounded-3xl transition-transform hover:-translate-y-1"
                  style={{ background: "var(--ss-card-tint)", border: "1px solid var(--ss-line)" }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: `${color}26`, border: `1px solid ${color}55`, color }}
                  >
                    {icon}
                  </div>
                  <h3 className="text-[20px] font-bold mb-2">{title}</h3>
                  <p className="text-[14px] leading-relaxed" style={{ color: "var(--ss-text-muted)" }}>{desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── 1D. WHO IT'S FOR ──────────────────────────────────────── */}
      <section className="py-16 sm:py-24" style={{ borderTop: "1px solid var(--ss-line)" }}>
        <div className={CONTAINER}>
          <FadeIn>
            <div className="text-center mb-12">
              <SectionLabel>Who it&apos;s for</SectionLabel>
              <h2 className="text-[28px] sm:text-[38px] font-extrabold mt-3 leading-tight">Built for both sides</h2>
              <p className="text-[15px] sm:text-[17px] mt-3 max-w-[560px] mx-auto" style={{ color: "var(--ss-text-muted)" }}>
                Whether you&apos;re showing your work or finding someone to hire
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
            {/* Pro */}
            <FadeIn delay={60}>
              <div
                className="relative h-full flex flex-col overflow-hidden rounded-3xl p-6 sm:p-8"
                style={{ background: "var(--ss-card-pro)", border: "1px solid var(--ss-purple-border)" }}
              >
                <div
                  aria-hidden
                  className="absolute top-0 right-0 pointer-events-none"
                  style={{ width: 240, height: 240, background: "radial-gradient(circle at 100% 0%, rgba(108,71,255,0.28) 0%, transparent 65%)" }}
                />
                <div className="relative flex flex-col h-full">
                  <span
                    className="self-start text-[10px] font-bold tracking-[0.18em] uppercase px-2.5 py-1 rounded-full mb-4"
                    style={{ background: "rgba(108,71,255,0.28)", color: "#c4b5fd" }}
                  >
                    I&apos;m a
                  </span>
                  <h3 className="text-[24px] sm:text-[28px] font-extrabold mb-3">Creator or Pro</h3>
                  <p className="text-[14px] sm:text-[15px] leading-relaxed mb-6" style={{ color: "var(--ss-text-muted)" }}>
                    Show your work, build your reputation, and get discovered by your local community — without paying for ads.
                  </p>
                  <ul className="flex flex-col gap-3 mb-8">
                    {["Upload video portfolios", "Appear in local discovery", "Get direct client messages", "Track jobs done and happy %"].map((f) => (
                      <li key={f} className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(108,71,255,0.22)", color: "var(--ss-purple-light)" }}>
                          <svg width="10" height="8" viewBox="0 0 8 6" fill="none"><path d="M1 3l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </span>
                        <span className="text-[14px] font-medium" style={{ color: "var(--ss-text)" }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={goToSignup}
                    className="mt-auto w-full py-4 rounded-2xl font-bold text-[15px] text-white flex items-center justify-center gap-2 transition-transform active:scale-[0.97] hover:-translate-y-0.5"
                    style={{ background: "var(--ss-purple)", boxShadow: "0 6px 24px rgba(108,71,255,0.42)" }}
                  >
                    Join as a Pro <ArrowRight size={17} />
                  </button>
                </div>
              </div>
            </FadeIn>

            {/* Client */}
            <FadeIn delay={120}>
              <div
                className="relative h-full flex flex-col overflow-hidden rounded-3xl p-6 sm:p-8"
                style={{ background: "var(--ss-card-tint)", border: "1px solid var(--ss-line)" }}
              >
                <div className="relative flex flex-col h-full">
                  <span
                    className="self-start text-[10px] font-bold tracking-[0.18em] uppercase px-2.5 py-1 rounded-full mb-4"
                    style={{ background: "var(--ss-surface-2)", color: "var(--ss-text-muted)" }}
                  >
                    I&apos;m looking to
                  </span>
                  <h3 className="text-[24px] sm:text-[28px] font-extrabold mb-3">Discover</h3>
                  <p className="text-[14px] sm:text-[15px] leading-relaxed mb-6" style={{ color: "var(--ss-text-muted)" }}>
                    Watch real work before you reach out. Find talented people near you with verified track records.
                  </p>
                  <ul className="flex flex-col gap-3 mb-8">
                    {["Browse video work samples", "Filter by your suburb", "See jobs done and ratings", "Message pros directly"].map((f) => (
                      <li key={f} className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--ss-surface-2)" }}>
                          <svg width="10" height="8" viewBox="0 0 8 6" fill="none" style={{ color: "var(--ss-text-muted)" }}><path d="M1 3l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </span>
                        <span className="text-[14px] font-medium" style={{ color: "var(--ss-text-muted)" }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={goToFeed}
                    className="mt-auto w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.97] hover:opacity-80"
                    style={{ border: "1px solid var(--ss-line-strong)", background: "var(--ss-card-tint)", color: "var(--ss-text)" }}
                  >
                    Find Local Pros <ArrowRight size={17} />
                  </button>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── 1F. FOOTER CTA ────────────────────────────────────────── */}
      <section
        id="download"
        className="relative overflow-hidden py-16 sm:py-20"
        style={{
          background: "linear-gradient(135deg, #1a1035 0%, #2a1060 100%)",
          borderTop: "1px solid rgba(108,71,255,0.3)",
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(circle at 50% 0%, rgba(108,71,255,0.22) 0%, transparent 60%)" }}
        />
        <div className={`${CONTAINER} relative flex flex-col items-center text-center`}>
          <FadeIn className="w-full flex flex-col items-center">
            <h2 className="text-[28px] sm:text-[40px] font-extrabold leading-tight text-white max-w-[620px]">
              Ready to find a skilled pro?
            </h2>
            <p className="text-[15px] sm:text-[17px] mt-4 mb-9 max-w-[480px]" style={{ color: "rgba(255,255,255,0.82)" }}>
              Download SkillSnap — available on iOS and Android
            </p>
            <div className="w-full max-w-[460px]">
              <AppStoreButtons variant="white" />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── 1G. FOOTER ────────────────────────────────────────────── */}
      <footer style={{ background: "var(--ss-bg)", borderTop: "1px solid var(--ss-line)" }}>
        <div className={`${CONTAINER} py-12`}>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
            <div className="flex flex-col items-start gap-3">
              <SkillSnapLogo variant="full" size="md" dark={theme === "dark"} />
              <p className="text-[14px] max-w-[280px]" style={{ color: "var(--ss-text-muted)" }}>
                Watch. Trust. Connect. Western Sydney&apos;s skill marketplace.
              </p>
            </div>

            <nav className="flex flex-wrap gap-x-8 gap-y-3" aria-label="Footer">
              {([
                ["About", "about"],
                ["Terms", "terms"],
                ["Privacy", "terms"],
                ["Help", "help"],
                ["Contact", "contact"],
              ] as [string, Screen][]).map(([label, screen], i) => (
                <button
                  key={`${label}-${i}`}
                  onClick={() => onNavigate(screen)}
                  className="text-[14px] font-medium transition-opacity hover:opacity-70"
                  style={{ color: "var(--ss-text-muted)" }}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-10 pt-6" style={{ borderTop: "1px solid var(--ss-line)" }}>
            <p className="text-[13px]" style={{ color: "var(--ss-text-dim)" }}>
              © 2026 SkillSnap Australia
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
