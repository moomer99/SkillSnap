"use client";
import { useState, useRef } from "react";
import type { Screen } from "@/types";
import { useAppState } from "@/state/AppState";

interface OnboardingScreenProps {
  onNavigate: (s: Screen) => void;
}

const slides = [
  {
    illustration: (
      <svg width="220" height="200" viewBox="0 0 220 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Camera on tripod with person */}
        <ellipse cx="110" cy="185" rx="70" ry="8" fill="#e8e4df" />
        {/* Tripod legs */}
        <line x1="110" y1="130" x2="75" y2="183" stroke="#9b8faa" strokeWidth="4" strokeLinecap="round"/>
        <line x1="110" y1="130" x2="145" y2="183" stroke="#9b8faa" strokeWidth="4" strokeLinecap="round"/>
        <line x1="110" y1="130" x2="110" y2="183" stroke="#9b8faa" strokeWidth="4" strokeLinecap="round"/>
        {/* Tripod stem */}
        <rect x="107" y="88" width="6" height="44" rx="3" fill="#9b8faa"/>
        {/* Camera body */}
        <rect x="78" y="68" width="64" height="42" rx="8" fill="#6c47ff"/>
        <rect x="83" y="73" width="54" height="32" rx="5" fill="#5b3dd8"/>
        {/* Lens */}
        <circle cx="110" cy="89" r="13" fill="#3d2a99"/>
        <circle cx="110" cy="89" r="9" fill="#2d1f6e"/>
        <circle cx="106" cy="85" r="3" fill="white" opacity="0.3"/>
        {/* Camera top button */}
        <rect x="122" y="63" width="10" height="8" rx="3" fill="#8b6af5"/>
        {/* Person silhouette */}
        <circle cx="155" cy="110" r="14" fill="#6c47ff"/>
        <rect x="143" y="122" width="24" height="38" rx="8" fill="#6c47ff"/>
        {/* Person arms */}
        <path d="M143 130 Q128 128 82 89" stroke="#6c47ff" strokeWidth="8" strokeLinecap="round"/>
        {/* Person legs */}
        <path d="M148 158 Q145 175 140 183" stroke="#6c47ff" strokeWidth="7" strokeLinecap="round"/>
        <path d="M162 158 Q162 175 158 183" stroke="#6c47ff" strokeWidth="7" strokeLinecap="round"/>
        {/* Knee on ground */}
        <ellipse cx="148" cy="160" rx="8" ry="6" fill="#5b3dd8"/>
        {/* Recording dot */}
        <circle cx="170" cy="72" r="7" fill="#ff4444"/>
        <circle cx="170" cy="72" r="4" fill="#ff6666"/>
      </svg>
    ),
    title: "Watch Real Skills\nin Action",
    subtitle: "Discover local tradies and service providers through short videos of their actual work — no guessing, just proof.",
  },
  {
    illustration: (
      <svg width="220" height="200" viewBox="0 0 220 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Phone with upload */}
        <ellipse cx="110" cy="185" rx="65" ry="7" fill="#e8e4df" />
        {/* Phone body */}
        <rect x="65" y="30" width="90" height="155" rx="16" fill="#6c47ff"/>
        <rect x="70" y="38" width="80" height="139" rx="12" fill="#f8f7f5"/>
        {/* Screen content - video thumbnails */}
        <rect x="76" y="46" width="36" height="40" rx="6" fill="linear-gradient(135deg,#667eea,#764ba2)"/>
        <rect x="76" y="46" width="36" height="40" rx="6" fill="#8b6af5"/>
        <circle cx="94" cy="66" r="8" fill="white" opacity="0.25"/>
        <polygon points="91,62 91,70 99,66" fill="white" opacity="0.9"/>

        <rect x="118" y="46" width="26" height="40" rx="6" fill="#a78bfa"/>
        <circle cx="131" cy="66" r="6" fill="white" opacity="0.25"/>
        <polygon points="128,62 128,70 136,66" fill="white" opacity="0.9"/>

        <rect x="76" y="93" width="68" height="36" rx="6" fill="#ede9fe"/>
        <rect x="82" y="99" width="40" height="5" rx="2.5" fill="#6c47ff" opacity="0.5"/>
        <rect x="82" y="110" width="56" height="4" rx="2" fill="#b0aaa5"/>
        <rect x="82" y="119" width="44" height="4" rx="2" fill="#b0aaa5"/>

        {/* Upload arrow */}
        <circle cx="148" cy="148" r="22" fill="#6c47ff"/>
        <path d="M148 158 L148 140" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        <path d="M140 147 L148 139 L156 147" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>

        {/* Star badge */}
        <circle cx="76" cy="157" r="14" fill="#fbbf24"/>
        <text x="76" y="162" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">★</text>

        {/* Phone notch */}
        <rect x="95" y="35" width="30" height="6" rx="3" fill="#6c47ff"/>
      </svg>
    ),
    title: "Showcase Your\nBest Work",
    subtitle: "Upload short clips or photos of jobs you've completed. Let your work speak for itself and attract more clients.",
  },
  {
    illustration: (
      <svg width="220" height="200" viewBox="0 0 220 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Two people connecting */}
        <ellipse cx="110" cy="187" rx="75" ry="7" fill="#e8e4df" />
        {/* Left person */}
        <circle cx="68" cy="70" r="20" fill="#8b6af5"/>
        <rect x="48" y="90" width="40" height="50" rx="12" fill="#8b6af5"/>
        {/* Right person */}
        <circle cx="152" cy="70" r="20" fill="#6c47ff"/>
        <rect x="132" y="90" width="40" height="50" rx="12" fill="#6c47ff"/>
        {/* Handshake area */}
        <path d="M88 115 Q110 108 132 115" stroke="#ede9fe" strokeWidth="3" strokeDasharray="4 3"/>
        {/* Handshake icon */}
        <circle cx="110" cy="113" r="22" fill="white" opacity="0.9"/>
        <circle cx="110" cy="113" r="22" stroke="#6c47ff" strokeWidth="2.5"/>
        {/* Handshake SVG inside */}
        <path d="M101 116 Q105 110 110 113 Q115 116 119 110" stroke="#6c47ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M98 119 L101 116" stroke="#6c47ff" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M122 107 L119 110" stroke="#6c47ff" strokeWidth="2.5" strokeLinecap="round"/>
        {/* Chat bubbles */}
        <rect x="22" y="38" width="60" height="24" rx="10" fill="white"/>
        <rect x="22" y="38" width="60" height="24" rx="10" stroke="#e8e4df" strokeWidth="1.5"/>
        <polygon points="30,62 22,68 38,62" fill="white"/>
        <polygon points="30,62 22,68 38,62" fill="white" stroke="#e8e4df" strokeWidth="1"/>
        <rect x="30" y="46" width="44" height="4" rx="2" fill="#6c47ff" opacity="0.4"/>
        <rect x="30" y="54" width="32" height="4" rx="2" fill="#b0aaa5"/>

        <rect x="138" y="28" width="60" height="24" rx="10" fill="#6c47ff"/>
        <polygon points="190,52 198,58 182,52" fill="#6c47ff"/>
        <rect x="146" y="36" width="44" height="4" rx="2" fill="white" opacity="0.7"/>
        <rect x="146" y="44" width="30" height="4" rx="2" fill="white" opacity="0.5"/>
        {/* Stars below persons */}
        <text x="68" y="158" textAnchor="middle" fill="#fbbf24" fontSize="11">★★★★★</text>
        <text x="152" y="158" textAnchor="middle" fill="#fbbf24" fontSize="11">★★★★★</text>
      </svg>
    ),
    title: "Connect & Get\nthe Job Done",
    subtitle: "Message directly, confirm the job, and build your reputation. Every completed job boosts your profile.",
  },
];

export default function OnboardingScreen({ onNavigate }: OnboardingScreenProps) {
  const [current, setCurrent] = useState(0);
  const { dispatch } = useAppState();
  const touchStartX = useRef<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  function finish() {
    if (typeof window !== "undefined") {
      localStorage.setItem("skillsnap_onboarded", "1");
    }
    onNavigate("auth");
  }

  function skip() {
    finish();
  }

  function next() {
    if (current < slides.length - 1) {
      setCurrent(current + 1);
    } else {
      finish();
    }
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

  const isLast = current === slides.length - 1;

  return (
    <div
      className="flex flex-col min-h-screen bg-[#f8f7f5] overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Skip button */}
      <div className="flex justify-end px-5 pt-5 pb-2">
        {!isLast ? (
          <button
            onClick={skip}
            className="text-sm font-semibold text-[#7a7570] px-3 py-1.5 rounded-full transition-colors active:text-[#1a1a1a]"
          >
            Skip
          </button>
        ) : (
          <div className="h-8" />
        )}
      </div>

      {/* Slides track */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div
          ref={trackRef}
          className="flex flex-1 transition-transform duration-400 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)`, width: `${slides.length * 100}%` }}
        >
          {slides.map((slide, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center px-8 gap-6"
              style={{ width: `${100 / slides.length}%` }}
            >
              {/* Illustration */}
              <div
                className="flex items-center justify-center rounded-3xl"
                style={{
                  width: 260,
                  height: 240,
                  background: "linear-gradient(145deg, #f0ecff 0%, #f8f7f5 100%)",
                }}
              >
                {slide.illustration}
              </div>

              {/* Text */}
              <div className="text-center">
                <h2 className="text-2xl font-bold text-[#1a1a1a] leading-tight mb-3 whitespace-pre-line">
                  {slide.title}
                </h2>
                <p className="text-sm text-[#7a7570] leading-relaxed max-w-[280px] mx-auto">
                  {slide.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom area */}
      <div className="px-6 pb-10 flex flex-col items-center gap-5">
        {/* Dot indicators */}
        <div className="flex gap-2 items-center">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="transition-all duration-300"
              style={{
                width: i === current ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === current ? "#6c47ff" : "#d4cffe",
              }}
            />
          ))}
        </div>

        {/* CTAs — only on last slide */}
        {isLast ? (
          <div className="w-full flex flex-col gap-2.5">
            <button
              onClick={() => onNavigate("auth")}
              className="w-full h-14 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
            >
              Get Started
            </button>
            <button
              onClick={() => onNavigate("auth")}
              className="w-full h-14 rounded-2xl font-semibold text-base text-[#6c47ff] border border-[#e8e4df] bg-white transition-all active:scale-[0.98]"
            >
              Log In
            </button>
          </div>
        ) : (
          <button
            onClick={next}
            className="w-full h-14 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
