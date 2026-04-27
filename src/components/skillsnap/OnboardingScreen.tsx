"use client";
import { useState, useRef } from "react";
import type { Screen } from "@/types";

interface OnboardingScreenProps {
  onNavigate: (s: Screen) => void;
}

// ── Illustrations ─────────────────────────────

function IllustrationPhone() {
  return (
    <svg width="180" height="200" viewBox="0 0 180 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="phone-shadow">
          <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="#6c47ff" floodOpacity="0.18"/>
        </filter>
      </defs>
      {/* Phone body */}
      <rect x="28" y="6" width="124" height="188" rx="22" fill="white" filter="url(#phone-shadow)"/>
      <rect x="28" y="6" width="124" height="188" rx="22" fill="#f0ecff" stroke="#ddd6fe" strokeWidth="1.5"/>
      {/* Screen */}
      <rect x="36" y="20" width="108" height="160" rx="14" fill="white"/>
      {/* SkillSnap wordmark */}
      <text x="90" y="46" textAnchor="middle" fontFamily="-apple-system,sans-serif" fontSize="12" fontWeight="800" fill="#6c47ff">Sk<tspan fill="#1a1a1a">ill</tspan>Snap</text>
      {/* Cameraman silhouette */}
      <g transform="translate(50,52)">
        {/* Tripod */}
        <line x1="36" y1="38" x2="12" y2="72" stroke="#4a4a4a" strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="36" y1="38" x2="60" y2="72" stroke="#4a4a4a" strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="36" y1="38" x2="36" y2="72" stroke="#4a4a4a" strokeWidth="3.5" strokeLinecap="round"/>
        <rect x="34" y="16" width="4" height="24" rx="2" fill="#4a4a4a"/>
        {/* Camera body */}
        <rect x="19" y="6" width="34" height="20" rx="5" fill="#3a3a3a"/>
        <circle cx="36" cy="16" r="6.5" fill="#252525"/>
        <circle cx="36" cy="16" r="3.5" fill="#555"/>
        <circle cx="34" cy="14" r="1.5" fill="white" opacity="0.4"/>
        {/* Person */}
        <circle cx="62" cy="36" r="8.5" fill="#4a4a4a"/>
        <rect x="54" y="44" width="16" height="22" rx="6" fill="#4a4a4a"/>
        <path d="M54 50 Q43 46 30 16" stroke="#4a4a4a" strokeWidth="5.5" strokeLinecap="round"/>
        <path d="M58 64 Q55 73 50 77" stroke="#4a4a4a" strokeWidth="5" strokeLinecap="round"/>
        <path d="M66 64 Q66 73 62 77" stroke="#4a4a4a" strokeWidth="5" strokeLinecap="round"/>
        <ellipse cx="54" cy="65" rx="5" ry="4" fill="#3a3a3a"/>
      </g>
      {/* Caption lines */}
      <text x="90" y="148" textAnchor="middle" fontFamily="-apple-system,sans-serif" fontSize="6.5" fill="#9a9490">Connect with local skilled talents through</text>
      <text x="90" y="157" textAnchor="middle" fontFamily="-apple-system,sans-serif" fontSize="6.5" fill="#9a9490">videos and visual skill moments</text>
      {/* Bottom strip */}
      <rect x="36" y="162" width="108" height="13" fill="#f8f7f5"/>
      <text x="90" y="171" textAnchor="middle" fontFamily="-apple-system,sans-serif" fontSize="6.2" fontWeight="700" fill="#1a1a1a">Welcome to SkillSnap</text>
      <rect x="56" y="173" width="68" height="10" rx="5" fill="#6c47ff"/>
      <text x="90" y="180" textAnchor="middle" fontFamily="-apple-system,sans-serif" fontSize="6" fontWeight="700" fill="white">Get Started</text>
      {/* Notch */}
      <rect x="70" y="17" width="40" height="5" rx="2.5" fill="#e8e4df"/>
    </svg>
  );
}

function IllustrationMagnify() {
  return (
    <svg width="170" height="170" viewBox="0 0 170 170" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="lens-g" cx="38%" cy="30%" r="68%">
          <stop offset="0%" stopColor="#93c5fd"/>
          <stop offset="55%" stopColor="#38bdf8"/>
          <stop offset="100%" stopColor="#0284c7"/>
        </radialGradient>
        <radialGradient id="lens-shine" cx="28%" cy="22%" r="55%">
          <stop offset="0%" stopColor="white" stopOpacity="0.65"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="handle-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c084fc"/>
          <stop offset="100%" stopColor="#7c3aed"/>
        </linearGradient>
        <filter id="mag-drop">
          <feDropShadow dx="3" dy="8" stdDeviation="14" floodColor="#6c47ff" floodOpacity="0.28"/>
        </filter>
      </defs>
      <ellipse cx="82" cy="156" rx="44" ry="8" fill="#6c47ff" opacity="0.1"/>
      {/* Handle */}
      <rect x="100" y="108" width="48" height="22" rx="11" fill="url(#handle-g)" filter="url(#mag-drop)"
        transform="rotate(45 100 108)"/>
      {/* Outer ring */}
      <circle cx="68" cy="74" r="56" fill="#7c3aed" filter="url(#mag-drop)"/>
      <circle cx="68" cy="74" r="51" fill="#6d28d9"/>
      {/* Lens */}
      <circle cx="68" cy="74" r="46" fill="url(#lens-g)"/>
      <circle cx="68" cy="74" r="46" fill="url(#lens-shine)"/>
      {/* Highlight arc */}
      <path d="M46 54 Q68 38 90 54" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.55" fill="none"/>
      {/* Shine */}
      <circle cx="51" cy="56" r="6" fill="white" opacity="0.32"/>
    </svg>
  );
}

function IllustrationSparkles() {
  return (
    <svg width="168" height="168" viewBox="0 0 168 168" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sp-main" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#fcd34d"/>
          <stop offset="45%" stopColor="#f97316"/>
          <stop offset="100%" stopColor="#ef4444"/>
        </linearGradient>
        <linearGradient id="sp-s1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde68a"/>
          <stop offset="100%" stopColor="#fbbf24"/>
        </linearGradient>
        <linearGradient id="sp-s2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fed7aa"/>
          <stop offset="100%" stopColor="#fb923c"/>
        </linearGradient>
        <filter id="sp-drop">
          <feDropShadow dx="2" dy="8" stdDeviation="14" floodColor="#f97316" floodOpacity="0.28"/>
        </filter>
      </defs>
      <ellipse cx="84" cy="156" rx="42" ry="8" fill="#f97316" opacity="0.1"/>
      {/* Small sparkle top-left */}
      <path d="M38 52 L43 70 L38 88 L33 70 Z" fill="url(#sp-s1)" filter="url(#sp-drop)"/>
      <path d="M20 70 L38 65 L56 70 L38 75 Z" fill="url(#sp-s1)"/>
      {/* Small sparkle bottom-right */}
      <path d="M116 98 L119 110 L116 122 L113 110 Z" fill="url(#sp-s2)" filter="url(#sp-drop)"/>
      <path d="M104 110 L116 107 L128 110 L116 113 Z" fill="url(#sp-s2)"/>
      {/* Main sparkle */}
      <path d="M84 14 L95 72 L84 130 L73 72 Z" fill="url(#sp-main)" filter="url(#sp-drop)"/>
      <path d="M26 72 L84 61 L142 72 L84 83 Z" fill="url(#sp-main)"/>
      {/* Center glow */}
      <circle cx="84" cy="72" r="9" fill="white" opacity="0.5"/>
      <circle cx="84" cy="72" r="4" fill="white" opacity="0.7"/>
    </svg>
  );
}

function IllustrationLocalClients() {
  return (
    <svg width="180" height="168" viewBox="0 0 180 168" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="pin-g" cx="38%" cy="22%" r="72%">
          <stop offset="0%" stopColor="#a78bfa"/>
          <stop offset="100%" stopColor="#6c47ff"/>
        </radialGradient>
        <radialGradient id="map-bg" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#ede9fe"/>
          <stop offset="100%" stopColor="#ddd6fe"/>
        </radialGradient>
        <filter id="pin-drop">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#6c47ff" floodOpacity="0.3"/>
        </filter>
      </defs>
      <ellipse cx="90" cy="156" rx="48" ry="8" fill="#6c47ff" opacity="0.1"/>
      {/* Map bg */}
      <circle cx="90" cy="82" r="70" fill="url(#map-bg)"/>
      {/* Grid */}
      {[58,76,94,112].map(y => (
        <line key={y} x1="22" y1={y} x2="158" y2={y} stroke="#c4b5fd" strokeWidth="1" strokeDasharray="4 4" opacity="0.5"/>
      ))}
      {[52,76,104,128].map(x => (
        <line key={x} x1={x} y1="14" x2={x} y2="150" stroke="#c4b5fd" strokeWidth="1" strokeDasharray="4 4" opacity="0.5"/>
      ))}
      {/* Small pins */}
      <g filter="url(#pin-drop)">
        <circle cx="52" cy="100" r="10" fill="#a78bfa"/>
        <path d="M52 110 L52 122" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="52" cy="122" r="2.5" fill="#a78bfa" opacity="0.3"/>
        <text x="52" y="105" textAnchor="middle" fill="white" fontSize="10">★</text>

        <circle cx="128" cy="74" r="10" fill="#a78bfa"/>
        <path d="M128 84 L128 96" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="128" cy="96" r="2.5" fill="#a78bfa" opacity="0.3"/>
        <text x="128" y="79" textAnchor="middle" fill="white" fontSize="10">★</text>

        <circle cx="72" cy="58" r="8" fill="#c4b5fd"/>
        <path d="M72 66 L72 76" stroke="#c4b5fd" strokeWidth="2.5" strokeLinecap="round"/>
        <text x="72" y="63" textAnchor="middle" fill="white" fontSize="8">★</text>
      </g>
      {/* Main pin */}
      <g filter="url(#pin-drop)">
        <circle cx="90" cy="76" r="22" fill="url(#pin-g)"/>
        <path d="M90 98 L90 126" stroke="#6c47ff" strokeWidth="6" strokeLinecap="round"/>
        <circle cx="90" cy="128" r="4" fill="#6c47ff" opacity="0.35"/>
        <text x="90" y="82" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">★</text>
      </g>
      {/* Pulse rings */}
      <circle cx="90" cy="76" r="32" stroke="#6c47ff" strokeWidth="2" opacity="0.18" strokeDasharray="5 4"/>
      <circle cx="90" cy="76" r="44" stroke="#6c47ff" strokeWidth="1.5" opacity="0.1" strokeDasharray="4 5"/>
    </svg>
  );
}

// ── Slides ────────────────────────────────────
const slides = [
  {
    illustration: <IllustrationPhone />,
    title: "Welcome to SkillSnap",
    subtitle: "Connect with local skilled talents through videos and visual skill moments",
  },
  {
    illustration: <IllustrationMagnify />,
    title: "Discover Talent",
    subtitle: "Browse portfolios showcasing real work from talented professionals in your area",
  },
  {
    illustration: <IllustrationSparkles />,
    title: "Share Your Skills",
    subtitle: "Create stunning video portfolios to showcase your expertise and attract clients",
  },
  {
    illustration: <IllustrationLocalClients />,
    title: "Attract Local Clients",
    subtitle: "Get discovered by clients nearby. Build your reputation and grow your local business",
  },
];

export default function OnboardingScreen({ onNavigate }: OnboardingScreenProps) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);

  function finish() {
    if (typeof window !== "undefined") {
      localStorage.setItem("skillsnap_onboarded", "1");
    }
    onNavigate("auth");
  }

  function next() {
    if (current < slides.length - 1) setCurrent(current + 1);
    else finish();
  }

  function back() {
    if (current > 0) setCurrent(current - 1);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0 && current < slides.length - 1) setCurrent(c => c + 1);
      if (diff < 0 && current > 0) setCurrent(c => c - 1);
    }
    touchStartX.current = null;
  }

  const isFirst = current === 0;
  const isLast = current === slides.length - 1;

  return (
    <div
      className="flex flex-col min-h-screen select-none overflow-hidden"
      style={{ background: "linear-gradient(150deg, #edeaff 0%, #f3f1ff 45%, #eef1ff 100%)" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Skip button — slides 2 & 3 (not first, not last) */}
      <div className="flex justify-end px-5 pt-5" style={{ minHeight: 44 }}>
        {!isFirst && !isLast && (
          <button
            onClick={finish}
            className="text-sm font-semibold text-[#6c47ff] px-3 py-1 rounded-full transition-colors active:opacity-70"
          >
            Skip
          </button>
        )}
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center items-center gap-2 pt-2 pb-1">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="transition-all duration-300 rounded-full"
            style={{
              width: i === current ? 28 : 8,
              height: 8,
              background: i === current ? "#6c47ff" : "#c4b5fd",
            }}
          />
        ))}
      </div>

      {/* Slides track */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div
          className="flex flex-1 transition-transform duration-400 ease-in-out"
          style={{
            transform: `translateX(-${current * 100}%)`,
            width: `${slides.length * 100}%`,
          }}
        >
          {slides.map((s, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center px-6 gap-7"
              style={{ width: `${100 / slides.length}%` }}
            >
              <div className="flex items-center justify-center" style={{ minHeight: 178 }}>
                {s.illustration}
              </div>
              <div className="text-center px-2">
                <h2 className="text-[26px] font-extrabold text-[#1a1a1a] leading-tight mb-3 tracking-tight">
                  {s.title}
                </h2>
                <p className="text-[15px] text-[#7a7570] leading-relaxed max-w-[290px] mx-auto">
                  {s.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="px-6 pb-10 flex flex-col items-center gap-3">
        {isLast ? (
          <div className="w-full flex flex-col gap-2.5">
            <button
              onClick={finish}
              className="w-full h-14 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
            >
              Get Started
            </button>
            <button
              onClick={finish}
              className="w-full h-14 rounded-2xl font-semibold text-base text-[#6c47ff] border-2 border-[#6c47ff] bg-white transition-all active:scale-[0.98]"
            >
              Log In
            </button>
          </div>
        ) : isFirst ? (
          <button
            onClick={next}
            className="w-full h-14 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
          >
            Next
          </button>
        ) : (
          <div className="w-full flex gap-3">
            <button
              onClick={back}
              className="flex-1 h-14 rounded-2xl font-semibold text-base text-[#1a1a1a] bg-white border border-[#ddd6fe] transition-all active:scale-[0.98]"
            >
              Back
            </button>
            <button
              onClick={next}
              className="flex-1 h-14 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
            >
              Next
            </button>
          </div>
        )}

        <p className="text-[13px] text-[#b0aaa5] font-medium">
          {current + 1} of {slides.length}
        </p>
      </div>
    </div>
  );
}
