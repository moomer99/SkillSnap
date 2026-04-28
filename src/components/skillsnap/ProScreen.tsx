"use client";
import { useState } from "react";
import { ArrowLeft, Zap, Star, TrendingUp, Video, Shield, Gift, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import type { Screen } from "@/types";

interface ProScreenProps {
  onNavigate: (s: Screen) => void;
}

const FEATURES = [
  {
    icon: <Video size={20} />,
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.12)",
    title: "In-App Video Editing",
    desc: "Smart filters, branding overlays, and pro-grade edits directly in the app — no third-party tools needed.",
  },
  {
    icon: <TrendingUp size={20} />,
    color: "#34d399",
    bg: "rgba(52,211,153,0.12)",
    title: "Local Discovery Boosts",
    desc: "Get pinned to the top of local search results and map discovery so more clients find you first.",
  },
  {
    icon: <Shield size={20} />,
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.12)",
    title: "Verified Pro Badge",
    desc: "Stand out with a blue verified checkmark that builds instant trust with new clients.",
  },
  {
    icon: <Star size={20} />,
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.12)",
    title: "Sponsored Content & Brand Partnerships",
    desc: "Connect with brands looking for skilled creators. Earn from sponsored posts and collaborations. (Later Stage)",
    later: true,
  },
];

export default function ProScreen({ onNavigate }: ProScreenProps) {
  const [expanded, setExpanded] = useState(false);
  const [notified, setNotified] = useState(false);

  const visibleFeatures = expanded ? FEATURES : FEATURES.slice(0, 2);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#0d0a1a" }}>
      {/* Header */}
      <header className="flex items-center gap-3 px-4 h-14 z-10 relative">
        <button onClick={() => onNavigate("home")} className="text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <span className="text-white/80 text-sm font-semibold flex-1">SkillSnap Pro</span>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(108,71,255,0.25)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.3)" }}>
          Coming Soon
        </span>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">

        {/* Hero */}
        <div className="relative px-5 pt-4 pb-10 overflow-hidden">
          {/* Glow blobs */}
          <div style={{ position: "absolute", top: -60, left: -60, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(108,71,255,0.35) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 20, right: -80, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />

          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div style={{ position: "relative", display: "inline-flex" }}>
              <div style={{ width: 80, height: 80, borderRadius: 24, background: "linear-gradient(135deg, #6c47ff 0%, #a78bfa 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px rgba(108,71,255,0.5)" }}>
                <Zap size={36} fill="white" color="white" />
              </div>
              <div style={{ position: "absolute", top: -6, right: -6, width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg, #fbbf24, #f59e0b)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #0d0a1a" }}>
                <Star size={11} fill="white" color="white" />
              </div>
            </div>
          </div>

          <h1 className="text-white text-center font-extrabold text-3xl mb-3 tracking-tight">
            Go <span style={{ background: "linear-gradient(90deg, #a78bfa, #6c47ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Pro</span>
          </h1>
          <p className="text-white/50 text-center text-sm leading-relaxed max-w-xs mx-auto">
            Supercharge your profile, land more clients, and grow your trade business with professional tools built for skilled workers.
          </p>

          {/* Pulse dot */}
          <div className="flex items-center justify-center gap-2 mt-5">
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#6c47ff", animation: "pulse 1.5s infinite" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa", letterSpacing: 1 }}>LAUNCHING SOON</span>
          </div>
        </div>

        {/* Early Bird Banner */}
        <div className="mx-4 mb-5 rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #1a0f3c 0%, #2d1b69 100%)", border: "1px solid rgba(167,139,250,0.25)" }}>
          <div className="px-4 py-4">
            <div className="flex items-start gap-3">
              <div style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg, #f59e0b, #fbbf24)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Gift size={22} color="white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>Free 3-Month Pro Access</span>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 99, background: "rgba(251,191,36,0.2)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}>EXCLUSIVE</span>
                </div>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
                  Be one of the <span style={{ color: "#fbbf24", fontWeight: 700 }}>first 100 users</span> to sign up and upload a video — get <span style={{ color: "#fbbf24", fontWeight: 700 }}>3 months of Pro free</span>, no credit card needed.
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="flex justify-between mb-1.5">
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Early spots claimed</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fbbf24" }}>47 / 100</span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: "47%", borderRadius: 99, background: "linear-gradient(90deg, #f59e0b, #fbbf24)" }} />
              </div>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 5, textAlign: "center" }}>
                53 spots remaining — sign up and upload your first video to claim yours
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="px-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} color="#a78bfa" />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: 1.2 }}>What's included</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {visibleFeatures.map((f, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 18,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                }}
              >
                <div style={{ width: 42, height: 42, borderRadius: 13, background: f.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: f.color }}>
                  {f.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{f.title}</span>
                    {f.later && (
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 99, background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)", flexShrink: 0 }}>
                        Later
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Read more / less */}
          {!expanded && (
            <button
              onClick={() => setExpanded(true)}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", marginTop: 10, padding: "10px 0", color: "#a78bfa", fontSize: 13, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
            >
              Read more <ChevronDown size={15} />
            </button>
          )}
          {expanded && (
            <button
              onClick={() => setExpanded(false)}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", marginTop: 10, padding: "10px 0", color: "#a78bfa", fontSize: 13, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
            >
              Show less <ChevronUp size={15} />
            </button>
          )}
        </div>

        {/* Pricing teaser */}
        <div className="mx-4 mt-5 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="px-4 py-5">
            <p style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>Pricing</p>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "14px 12px", textAlign: "center" }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>Monthly</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>$9<span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.4)" }}>/mo</span></p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>Cancel anytime</p>
              </div>
              <div style={{ flex: 1, background: "linear-gradient(135deg, rgba(108,71,255,0.2), rgba(167,139,250,0.1))", border: "1px solid rgba(108,71,255,0.4)", borderRadius: 16, padding: "14px 12px", textAlign: "center", position: "relative" }}>
                <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(90deg, #6c47ff, #a78bfa)", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 10px", borderRadius: 99 }}>
                  BEST VALUE
                </div>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>Yearly</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>$7<span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.4)" }}>/mo</span></p>
                <p style={{ fontSize: 10, color: "#a78bfa", marginTop: 4 }}>Save $24/year</p>
              </div>
            </div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: 10 }}>
              * Pricing is indicative and subject to change at launch
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="px-4 mt-6">
          {notified ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "18px 0" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(52,211,153,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 22 }}>✓</span>
              </div>
              <p style={{ color: "#34d399", fontWeight: 700, fontSize: 15 }}>You're on the list!</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, textAlign: "center" }}>We'll notify you the moment Pro launches. You're in the early bird window.</p>
            </div>
          ) : (
            <>
              <button
                onClick={() => setNotified(true)}
                style={{ width: "100%", height: 54, borderRadius: 16, background: "linear-gradient(135deg, #6c47ff, #8b6af5)", color: "#fff", fontWeight: 800, fontSize: 16, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 24px rgba(108,71,255,0.4)" }}
              >
                <Zap size={18} fill="white" color="white" />
                Notify Me at Launch
              </button>
              <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 10 }}>
                No spam. One email when Pro goes live.
              </p>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
