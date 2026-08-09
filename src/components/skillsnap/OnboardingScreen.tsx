"use client";
import { useState, useRef } from "react";
import type { Screen } from "@/types";
import SkillSnapLogo from "./shared/SkillSnapLogo";

interface OnboardingScreenProps {
  onNavigate: (s: Screen) => void;
}

function SlideWelcome() {
  return (
    <div className="flex flex-col items-center justify-center gap-5" style={{ width: 200, height: 200 }}>
      <SkillSnapLogo variant="icon" size="xl" />
      <SkillSnapLogo variant="full" size="md" />
    </div>
  );
}

function SlideDiscover() {
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="d-lens" cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#7dd3fc"/>
          <stop offset="55%" stopColor="#38bdf8"/>
          <stop offset="100%" stopColor="#0369a1"/>
        </radialGradient>
        <radialGradient id="d-shine" cx="28%" cy="22%" r="52%">
          <stop offset="0%" stopColor="white" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="d-handle" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c084fc"/>
          <stop offset="100%" stopColor="#7c3aed"/>
        </linearGradient>
        <filter id="d-drop" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="3" dy="10" stdDeviation="16" floodColor="#6c47ff" floodOpacity="0.25"/>
        </filter>
      </defs>
      <ellipse cx="90" cy="186" rx="50" ry="8" fill="#6c47ff" opacity="0.08"/>
      <rect x="118" y="126" width="52" height="22" rx="11" fill="url(#d-handle)" filter="url(#d-drop)" transform="rotate(45 118 126)"/>
      <circle cx="80" cy="88" r="62" fill="#7c3aed" filter="url(#d-drop)"/>
      <circle cx="80" cy="88" r="56" fill="#6d28d9"/>
      <circle cx="80" cy="88" r="50" fill="url(#d-lens)"/>
      <circle cx="80" cy="88" r="50" fill="url(#d-shine)"/>
      <path d="M56 66 Q80 48 104 66" stroke="white" strokeWidth="3.5" strokeLinecap="round" opacity="0.55" fill="none"/>
      <circle cx="60" cy="68" r="7" fill="white" opacity="0.3"/>
    </svg>
  );
}

function SlideSkills() {
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sk-main" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fcd34d"/>
          <stop offset="48%" stopColor="#f97316"/>
          <stop offset="100%" stopColor="#ef4444"/>
        </linearGradient>
        <linearGradient id="sk-s1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(251,191,36,0.14)"/>
          <stop offset="100%" stopColor="#fbbf24"/>
        </linearGradient>
        <linearGradient id="sk-s2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffedd5"/>
          <stop offset="100%" stopColor="#fb923c"/>
        </linearGradient>
        <filter id="sk-drop" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation="16" floodColor="#f97316" floodOpacity="0.25"/>
        </filter>
      </defs>
      <ellipse cx="100" cy="186" rx="50" ry="8" fill="#f97316" opacity="0.08"/>
      <path d="M42 58 L46 76 L42 94 L38 76 Z" fill="url(#sk-s1)" filter="url(#sk-drop)"/>
      <path d="M24 76 L42 72 L60 76 L42 80 Z" fill="url(#sk-s1)"/>
      <path d="M138 110 L141 122 L138 134 L135 122 Z" fill="url(#sk-s2)" filter="url(#sk-drop)"/>
      <path d="M126 122 L138 119 L150 122 L138 125 Z" fill="url(#sk-s2)"/>
      <path d="M100 18 L112 82 L100 146 L88 82 Z" fill="url(#sk-main)" filter="url(#sk-drop)"/>
      <path d="M36 82 L100 70 L164 82 L100 94 Z" fill="url(#sk-main)"/>
      <circle cx="100" cy="82" r="11" fill="white" opacity="0.45"/>
      <circle cx="100" cy="82" r="5" fill="white" opacity="0.65"/>
    </svg>
  );
}

function SlideLocal() {
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="lc-pin" cx="35%" cy="20%" r="75%">
          <stop offset="0%" stopColor="#a78bfa"/>
          <stop offset="100%" stopColor="#6c47ff"/>
        </radialGradient>
        <radialGradient id="lc-map" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="#241d40"/>
          <stop offset="100%" stopColor="#2e2550"/>
        </radialGradient>
        <filter id="lc-drop" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#6c47ff" floodOpacity="0.28"/>
        </filter>
      </defs>
      <ellipse cx="100" cy="186" rx="52" ry="8" fill="#6c47ff" opacity="0.08"/>
      <circle cx="100" cy="94" r="76" fill="url(#lc-map)"/>
      <line x1="26" y1="70" x2="174" y2="70" stroke="#c4b5fd" strokeWidth="1" strokeDasharray="5 4" opacity="0.5"/>
      <line x1="26" y1="94" x2="174" y2="94" stroke="#c4b5fd" strokeWidth="1" strokeDasharray="5 4" opacity="0.5"/>
      <line x1="26" y1="118" x2="174" y2="118" stroke="#c4b5fd" strokeWidth="1" strokeDasharray="5 4" opacity="0.5"/>
      <line x1="60" y1="20" x2="60" y2="168" stroke="#c4b5fd" strokeWidth="1" strokeDasharray="5 4" opacity="0.5"/>
      <line x1="100" y1="20" x2="100" y2="168" stroke="#c4b5fd" strokeWidth="1" strokeDasharray="5 4" opacity="0.5"/>
      <line x1="140" y1="20" x2="140" y2="168" stroke="#c4b5fd" strokeWidth="1" strokeDasharray="5 4" opacity="0.5"/>
      <g filter="url(#lc-drop)">
        <circle cx="58" cy="112" r="11" fill="#a78bfa"/>
        <path d="M58 123 L58 136" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="58" cy="137" r="2.5" fill="#a78bfa" opacity="0.3"/>
        <text x="58" y="117" textAnchor="middle" fill="white" fontSize="11">★</text>
      </g>
      <g filter="url(#lc-drop)">
        <circle cx="144" cy="82" r="11" fill="#a78bfa"/>
        <path d="M144 93 L144 106" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="144" cy="107" r="2.5" fill="#a78bfa" opacity="0.3"/>
        <text x="144" y="87" textAnchor="middle" fill="white" fontSize="11">★</text>
      </g>
      <g filter="url(#lc-drop)">
        <circle cx="76" cy="62" r="8" fill="#c4b5fd"/>
        <path d="M76 70 L76 80" stroke="#c4b5fd" strokeWidth="2.5" strokeLinecap="round"/>
        <text x="76" y="67" textAnchor="middle" fill="white" fontSize="8">★</text>
      </g>
      <g filter="url(#lc-drop)">
        <circle cx="100" cy="84" r="24" fill="url(#lc-pin)"/>
        <path d="M100 108 L100 140" stroke="#6c47ff" strokeWidth="6" strokeLinecap="round"/>
        <circle cx="100" cy="142" r="4" fill="#6c47ff" opacity="0.3"/>
        <text x="100" y="91" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">★</text>
      </g>
      <circle cx="100" cy="84" r="34" stroke="#6c47ff" strokeWidth="2" opacity="0.15" strokeDasharray="6 4"/>
      <circle cx="100" cy="84" r="46" stroke="#6c47ff" strokeWidth="1.5" opacity="0.08" strokeDasharray="5 5"/>
    </svg>
  );
}

const slides = [
  {
    illustration: <SlideWelcome />,
    title: "Welcome to SkillSnap",
    subtitle: "Connect with local skilled talents through videos and visual skill moments",
  },
  {
    illustration: <SlideDiscover />,
    title: "Discover Talent",
    subtitle: "Browse portfolios showcasing real work from talented professionals in your area",
  },
  {
    illustration: <SlideSkills />,
    title: "Share Your Skills",
    subtitle: "Create stunning video portfolios to showcase your expertise and attract clients",
  },
  {
    illustration: <SlideLocal />,
    title: "Attract Local Clients",
    subtitle: "Get discovered by clients nearby. Build your reputation and grow your local business",
  },
];

export default function OnboardingScreen({ onNavigate }: OnboardingScreenProps) {
  const [current, setCurrent] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

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
    setIsDragging(true);
    setDragOffset(0);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.touches[0].clientX - touchStartX.current;
    const trackWidth = trackRef.current?.offsetWidth ?? 390;
    let offset = delta;
    if ((current === 0 && delta > 0) || (current === slides.length - 1 && delta < 0)) {
      offset = delta * 0.2;
    }
    const max = trackWidth;
    offset = Math.max(-max, Math.min(max, offset));
    setDragOffset(offset);
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    const trackWidth = trackRef.current?.offsetWidth ?? 390;
    const threshold = trackWidth * 0.25;
    if (diff > threshold && current < slides.length - 1) {
      setCurrent(c => c + 1);
    } else if (diff < -threshold && current > 0) {
      setCurrent(c => c - 1);
    }
    setDragOffset(0);
    setIsDragging(false);
    touchStartX.current = null;
  }

  const isFirst = current === 0;
  const isLast = current === slides.length - 1;
  const pctBase = -((current * 100) / slides.length);
  const translateValue = `calc(${pctBase}% + ${dragOffset}px)`;

  return (
    <div
      className="relative flex flex-col select-none overflow-hidden"
      style={{
        minHeight: "100dvh",
        background: "linear-gradient(150deg, #edeaff 0%, #f4f2ff 50%, #eef1ff 100%)",
      }}
    >
      <div
        ref={trackRef}
        className="flex-1 overflow-hidden"
        style={{ position: "relative", display: "flex", flexDirection: "column" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            flex: 1,
            width: `${slides.length * 100}%`,
            transform: `translateX(${translateValue})`,
            transition: isDragging ? "none" : "transform 0.38s cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "transform",
          }}
        >
          {slides.map((s, i) => (
            <div
              key={i}
              style={{ width: `${100 / slides.length}%` }}
              className="flex flex-col items-center justify-center px-8 gap-6"
            >
              <div
                className="flex items-center justify-center rounded-3xl"
                style={{
                  width: 240,
                  height: 240,
                  background: "rgba(255,255,255,0.55)",
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 8px 32px rgba(108,71,255,0.10)",
                }}
              >
                {s.illustration}
              </div>
              <div className="text-center">
                <h2 className="text-[26px] font-extrabold text-[#ffffff] leading-tight mb-3 tracking-tight">
                  {s.title}
                </h2>
                <p className="text-[15px] text-[#9d97b5] leading-relaxed max-w-[280px] mx-auto">
                  {s.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          className="absolute bottom-5 left-0 right-0 flex justify-center items-center gap-2"
          style={{ pointerEvents: "none" }}
        >
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                width: i === current ? 28 : 8,
                height: 8,
                borderRadius: 4,
                background: i === current ? "#6c47ff" : "rgba(108,71,255,0.35)",
                transition: "width 0.3s ease, background 0.3s ease",
                border: "none",
                padding: 0,
                cursor: "pointer",
                pointerEvents: "auto",
              }}
            />
          ))}
        </div>
      </div>

      {/* FIX UX2 — Skip shown on ALL slides except the last one (was slides 2 & 3 only) */}
      <div className="absolute top-5 right-5" style={{ zIndex: 10 }}>
        {!isLast && (
          <button
            onClick={finish}
            className="text-sm font-semibold text-[#6c47ff] px-3 py-1 rounded-full active:opacity-60 transition-opacity"
            style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(4px)" }}
          >
            Skip
          </button>
        )}
      </div>

      {/* Bottom controls */}
      <div className="px-6 pb-10 pt-2 flex flex-col items-center gap-3">
        {isLast ? (
          <div className="w-full flex gap-3">
            <button
              onClick={back}
              className="flex-1 h-14 rounded-2xl font-semibold text-base text-[#ffffff] bg-[#16122a] border border-[#2e2550] active:scale-[0.98] transition-transform"
            >
              Back
            </button>
            <button
              onClick={finish}
              className="flex-[2] h-14 rounded-2xl font-bold text-base text-white active:scale-[0.98] transition-transform"
              style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
            >
              Get Started
            </button>
          </div>
        ) : isFirst ? (
          <button
            onClick={next}
            className="w-full h-14 rounded-2xl font-bold text-base text-white active:scale-[0.98] transition-transform"
            style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
          >
            Next
          </button>
        ) : (
          <div className="w-full flex gap-3">
            <button
              onClick={back}
              className="flex-1 h-14 rounded-2xl font-semibold text-base text-[#ffffff] bg-[#16122a] border border-[#2e2550] active:scale-[0.98] transition-transform"
            >
              Back
            </button>
            <button
              onClick={next}
              className="flex-1 h-14 rounded-2xl font-bold text-base text-white active:scale-[0.98] transition-transform"
              style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
            >
              Next
            </button>
          </div>
        )}
        <p className="text-[13px] text-[#6f6889] font-medium tabular-nums">
          {current + 1} of {slides.length}
        </p>
      </div>
    </div>
  );
}
