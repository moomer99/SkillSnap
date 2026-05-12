"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Screen } from "@/types";
import SkillSnapLogo from "./shared/SkillSnapLogo";
import { getAuthSupabase } from "@/lib/supabase";

interface LandingPageProps {
  onNavigate: (s: Screen) => void;
}

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

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
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

// Lazy video mock card — uses CSS gradient as placeholder (no real image needed)
function VideoCard({ gradient, name, skill, jobs, delay }: {
  gradient: string; name: string; skill: string; jobs: number; delay?: number;
}) {
  const { ref, visible } = useFadeIn();
  return (
    <div
      ref={ref}
      className="relative flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl"
      style={{
        width: 136, height: 196,
        background: gradient,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.96)",
        transition: `opacity 0.6s ease ${delay ?? 0}ms, transform 0.6s ease ${delay ?? 0}ms`,
        contentVisibility: "auto",
      } as React.CSSProperties}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-11 h-11 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.22)", backdropFilter: "blur(6px)", border: "1.5px solid rgba(255,255,255,0.35)" }}>
          <svg width="14" height="16" viewBox="0 0 14 16" fill="white"><path d="M1 1l12 7-12 7V1z"/></svg>
        </div>
      </div>
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.78) 100%)" }} />
      <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
        <p className="text-white font-bold text-[12px] leading-tight">{name}</p>
        <p className="text-white/65 text-[10px] mt-0.5">{skill}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-white/60 text-[9px] font-semibold">{jobs} jobs</span>
        </div>
      </div>
    </div>
  );
}

const MOCK_CARDS = [
  { gradient: "linear-gradient(160deg,#667eea,#764ba2)", name: "Marcus T.", skill: "✂️ Barber", jobs: 142 },
  { gradient: "linear-gradient(160deg,#f093fb,#f5576c)", name: "Priya K.", skill: "💄 Makeup", jobs: 89 },
  { gradient: "linear-gradient(160deg,#4facfe,#00c6ff)", name: "Jake M.", skill: "🧱 Tiler", jobs: 211 },
];

const CARD_GRADIENTS = [
  "linear-gradient(160deg,#667eea,#764ba2)",
  "linear-gradient(160deg,#f093fb,#f5576c)",
  "linear-gradient(160deg,#4facfe,#00c6ff)",
];

function useRealUsers() {
  const [cards, setCards] = useState(MOCK_CARDS);
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes("your-project-ref")) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await getAuthSupabase()
        .from("profiles")
        .select("display_name, skill, jobs_done")
        .not("skill", "is", null)
        .gt("jobs_done", 0)
        .order("created_at", { ascending: false })
        .limit(3);
      if (cancelled) return;
      if (error) {
        console.error("[LandingPage] featured profiles query failed:", error.message, error.code);
        return;
      }
      if (!data || data.length === 0) return;
      setCards(data.map((u, i) => ({
        gradient: CARD_GRADIENTS[i % CARD_GRADIENTS.length],
        name: u.display_name ?? "Pro",
        skill: u.skill ?? "Skilled Pro",
        jobs: u.jobs_done ?? 0,
      })));
    })();
    return () => { cancelled = true; };
  }, []);
  return cards;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {

  const proCards = useRealUsers();
  function goToAuth() { onNavigate("auth"); }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#0d0a1a", color: "white" }}>

      {/* ── NAV — same bg as page ───────────── */}
      <nav className="sticky top-0 z-50 px-5 h-14 flex items-center justify-between"
        style={{ background: "#0d0a1a", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <SkillSnapLogo variant="full" size="sm" dark />
        <div className="flex items-center gap-3">
          <button
            onClick={goToAuth}
            className="text-xs font-bold px-4 py-2 rounded-full transition-all active:scale-95"
            style={{ background: "rgba(108,71,255,0.18)", border: "1px solid rgba(108,71,255,0.45)", color: "#a78bfa" }}
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────── */}
      <section className="relative overflow-hidden px-5 pt-12 pb-16 flex flex-col items-center text-center">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div style={{ position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(108,71,255,0.28) 0%, transparent 65%)" }} />
          <div style={{ position: "absolute", top: "30%", left: "-10%", width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)" }} />
          <div style={{ position: "absolute", top: "20%", right: "-10%", width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(108,71,255,0.10) 0%, transparent 70%)" }} />
        </div>

        <FadeIn delay={0}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
            style={{ background: "rgba(108,71,255,0.15)", border: "1px solid rgba(108,71,255,0.35)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] animate-pulse" />
            <span className="text-[11px] font-bold text-[#a78bfa] tracking-wider uppercase">Show Your Work. Get Discovered.</span>
          </div>
        </FadeIn>

        <FadeIn delay={80}>
          <h1 className="text-[38px] font-extrabold leading-[1.08] tracking-tight mb-5 max-w-[320px]">
            Don't read reviews.{" "}
            <span style={{ background: "linear-gradient(90deg, #a78bfa, #6c47ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Watch the work.
            </span>
          </h1>
        </FadeIn>

        <FadeIn delay={160}>
          <p className="text-[15px] leading-relaxed max-w-[280px] mb-8" style={{ color: "rgba(255,255,255,0.55)" }}>
            Discover talented people near you — through real video portfolios. No reviews, no guessing. Just real work.
          </p>
        </FadeIn>

        <FadeIn delay={240}>
          <div className="flex flex-col gap-3 w-full max-w-[300px]">
            <button
              onClick={goToAuth}
              className="w-full h-14 rounded-2xl font-extrabold text-base text-white flex items-center justify-center gap-2.5 transition-all active:scale-[0.97]"
              style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)", boxShadow: "0 4px 32px rgba(108,71,255,0.5)" }}
            >
              Join Free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
            <button
              onClick={goToAuth}
              className="w-full h-12 rounded-2xl font-semibold text-sm transition-all active:scale-[0.97]"
              style={{ color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              Already have an account? Log in
            </button>
          </div>
        </FadeIn>

        {/* Video cards — lazy rendered via FadeIn + contentVisibility */}
        <FadeIn delay={320} className="w-full mt-10">
          <div className="flex gap-3 justify-center overflow-x-auto no-scrollbar pb-2 px-2">
            {proCards.map((c, i) => (
              <VideoCard key={i} gradient={c.gradient} name={c.name} skill={c.skill} jobs={c.jobs} delay={i * 80} />
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={400}>
          <div className="flex items-center gap-3 mt-6">
            <div className="flex -space-x-2">
              {["#667eea","#f093fb","#4facfe","#43e97b","#fa709a"].map((c, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-white text-[9px] font-bold"
                  style={{ background: c, borderColor: "#0d0a1a" }}>
                  {["M","P","J","S","A"][i]}
                </div>
              ))}
            </div>
            <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.45)" }}>
              <span className="text-white font-bold">Be one of the first</span> pros on{" "}
              <span className="font-bold text-white">SkillSnap</span>
            </p>
          </div>
        </FadeIn>
      </section>

      {/* ── HOW IT WORKS ────────────────────── */}
      <section className="px-5 py-14">
        <FadeIn>
          <div className="text-center mb-8">
            <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#6c47ff" }}>How it works</span>
            <h2 className="text-[26px] font-extrabold mt-2 leading-tight">Simple. Visual. Local.</h2>
          </div>
        </FadeIn>

        <div className="flex flex-col gap-4">
          {[
            {
              step: "01",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M15 10l4.553-2.277A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
                </svg>
              ),
              color: "#6c47ff",
              title: "Post your work",
              desc: "Upload a short video or photo showing your latest job. No reviews — just real results.",
            },
            {
              step: "02",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              ),
              color: "#8b6af5",
              title: "Discover nearby",
              desc: "Clients set their suburb and scroll through skilled pros in their area — sorted by distance.",
            },
            {
              step: "03",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
              ),
              color: "#a78bfa",
              title: "Connect directly",
              desc: "Message pros in-app, no middleman, no booking fee. Straight to the person doing the work.",
            },
          ].map(({ step, icon, color, title, desc }, i) => (
            <FadeIn key={i} delay={i * 100}>
              <div className="flex gap-4 p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
                  {icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold tracking-widest" style={{ color }}>{step}</span>
                    <span className="text-[15px] font-bold text-white">{title}</span>
                  </div>
                  <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{desc}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── WHO IT'S FOR ────────────────────── */}
      <section className="px-5 py-14" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <FadeIn>
          <div className="text-center mb-8">
            <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#6c47ff" }}>Who it's for</span>
            <h2 className="text-[26px] font-extrabold mt-2 leading-tight">Built for both sides</h2>
          </div>
        </FadeIn>

        <div className="flex flex-col gap-4">
          <FadeIn delay={60}>
            <div className="rounded-3xl overflow-hidden p-5 relative"
              style={{ background: "linear-gradient(135deg, #1a0f3c, #2d1b69)", border: "1px solid rgba(108,71,255,0.3)" }}>
              <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none" style={{ background: "radial-gradient(circle at 100% 0%, rgba(108,71,255,0.25) 0%, transparent 65%)" }} />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: "linear-gradient(135deg, #6c47ff, #a78bfa)" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                  </svg>
                </div>
                <h3 className="text-[18px] font-extrabold text-white mb-2">I'm a Creator or Pro</h3>
                <p className="text-[13px] leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Show your work, build your reputation, and get discovered by people near you — without paying for ads.
                </p>
                <ul className="flex flex-col gap-2">
                  {["Upload video portfolios", "Appear in local discovery", "Get direct client messages", "Track jobs done & happy %"].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(108,71,255,0.35)" }}>
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3l2 2 4-4" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <span className="text-[12px] font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={goToAuth}
                  className="mt-5 w-full h-12 rounded-2xl font-extrabold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                  style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)", boxShadow: "0 4px 20px rgba(108,71,255,0.4)" }}
                >
                  Join as a Pro →
                </button>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={120}>
            <div className="rounded-3xl overflow-hidden p-5 relative"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)" }}>
              <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none" style={{ background: "radial-gradient(circle at 100% 0%, rgba(255,255,255,0.04) 0%, transparent 65%)" }} />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </div>
                <h3 className="text-[18px] font-extrabold text-white mb-2">I'm Looking to Discover</h3>
                <p className="text-[13px] leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Watch real work before you reach out. Find talented people near you with verified track records.
                </p>
                <ul className="flex flex-col gap-2">
                  {["Browse video work samples", "Filter by your suburb", "See jobs done & ratings", "Message pros directly"].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.1)" }}>
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3l2 2 4-4" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <span className="text-[12px] font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={goToAuth}
                  className="mt-5 w-full h-12 rounded-2xl font-extrabold text-sm transition-all active:scale-[0.97]"
                  style={{ color: "white", border: "1.5px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.07)" }}
                >
                  Find Local Pros →
                </button>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FINAL CTA — no SK icon ───────────── */}
      <section className="px-5 py-16 flex flex-col items-center text-center relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0f0820, #1a0f3c)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(108,71,255,0.22) 0%, transparent 65%)" }} />
        </div>

        <FadeIn className="relative w-full flex flex-col items-center">
          <h2 className="text-[30px] font-extrabold leading-tight mb-3 max-w-[280px]">
            Ready to join{" "}
            <span style={{ background: "linear-gradient(90deg, #a78bfa, #6c47ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              SkillSnap?
            </span>
          </h2>
          <p className="text-[14px] mb-8 max-w-[240px]" style={{ color: "rgba(255,255,255,0.45)" }}>
            Free to join. No subscription. Australia's skills community.
          </p>
          <button
            onClick={goToAuth}
            className="w-full max-w-[300px] h-14 rounded-2xl font-extrabold text-base text-white flex items-center justify-center gap-2.5 transition-all active:scale-[0.97]"
            style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)", boxShadow: "0 6px 40px rgba(108,71,255,0.55)" }}
          >
            Join <span className="font-extrabold">SkillSnap</span> Free
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
          <p className="text-[11px] mt-3" style={{ color: "rgba(255,255,255,0.25)" }}>No credit card required · Takes 30 seconds</p>
        </FadeIn>
      </section>

      {/* ── FOOTER — 2026 ────────────────────── */}
      <footer className="px-5 py-6 flex flex-col items-center gap-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <SkillSnapLogo variant="full" size="xs" dark />
        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
          © 2026 SkillSnap · Sydney
        </p>
      </footer>
    </div>
  );
}
