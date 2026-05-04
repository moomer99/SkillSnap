"use client";
// ─────────────────────────────────────────────
// SkillSnap — App Shell & Screen Router
// Navigation is driven by AppState.screen
// All screens receive onNavigate from here
// ─────────────────────────────────────────────
import { lazy, Suspense } from "react";
import { AppProvider, useAppState } from "@/state/AppState";
import type { Screen } from "@/types";

// Landing + Auth load eagerly — they're the first thing every visitor sees
import LandingPage from "@/components/skillsnap/LandingPage";
import AuthScreen from "@/components/skillsnap/AuthScreen";

// Everything else is lazy — only downloaded when the user actually navigates there
const OnboardingScreen  = lazy(() => import("@/components/skillsnap/OnboardingScreen"));
const SearchScreen      = lazy(() => import("@/components/skillsnap/SearchScreen"));
const HomeFeed          = lazy(() => import("@/components/skillsnap/HomeFeed"));
const DiscoverScreen    = lazy(() => import("@/components/skillsnap/DiscoverScreen"));
const ProfileScreen     = lazy(() => import("@/components/skillsnap/ProfileScreen"));
const UploadScreen      = lazy(() => import("@/components/skillsnap/UploadScreen"));
const MessagesScreen    = lazy(() => import("@/components/skillsnap/MessagesScreen"));
const ChatScreen        = lazy(() => import("@/components/skillsnap/ChatScreen"));
const EditProfileScreen = lazy(() => import("@/components/skillsnap/EditProfileScreen"));
const SettingsScreen    = lazy(() => import("@/components/skillsnap/SettingsScreen"));
const ProScreen         = lazy(() => import("@/components/skillsnap/ProScreen"));
const BottomNav         = lazy(() => import("@/components/skillsnap/BottomNav"));

import { ToastProvider } from "@/components/skillsnap/shared/Toast";
import AuthPromptModal from "@/components/skillsnap/shared/AuthPromptModal";

// Screens that show the bottom nav
const NAV_SCREENS: Screen[] = ["home", "discover", "upload", "messages", "own-profile"];

// Only show dev tools on the Orchids sandbox preview, never on the real domain
const isOrchidsPreview =
  typeof window !== "undefined" &&
  window.location.hostname.includes("orchids.cloud");

function SkillSnapRouter() {
  const { state, navigate } = useAppState();
  const { screen, authLoading } = state;

  const showBottomNav = NAV_SCREENS.includes(screen);

  return (
    <div
      className="relative w-full min-h-screen flex justify-center"
      style={{
        fontFamily: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
        background: "#f0eff7",
      }}
    >
      {/* Desktop background — only visible on sm+ screens */}
      <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none">

        {/* Floating icon keyframes */}
        <style>{`
          @keyframes floatA { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-18px) rotate(3deg)} }
          @keyframes floatB { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-24px) rotate(-4deg)} }
          @keyframes floatC { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-14px) rotate(5deg)} }
          @keyframes floatD { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-20px) rotate(-3deg)} }
          @keyframes floatE { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-20px) rotate(2deg)} }
        `}</style>

        {/* Clean white base */}
        <div style={{ position: "absolute", inset: 0, background: "#fafafa" }} />

        {/* Soft lavender glow — bottom-right */}
        <div style={{
          position: "absolute", bottom: "-10%", right: "-6%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(196,181,253,0.35) 0%, rgba(221,214,254,0.15) 50%, transparent 72%)",
        }}/>

        {/* Faint arc rings — bottom-right corner */}
        <svg
          style={{ position: "absolute", bottom: -60, right: -60, opacity: 0.45 }}
          width="380" height="380" viewBox="0 0 380 380" fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="380" cy="380" r="160" stroke="#c4b5fd" strokeWidth="1" fill="none"/>
          <circle cx="380" cy="380" r="220" stroke="#ddd6fe" strokeWidth="1.5" fill="none"/>
          <circle cx="380" cy="380" r="280" stroke="#ede9fe" strokeWidth="1" fill="none"/>
        </svg>

        {/* Tiny dot accent — top-left */}
        <div style={{
          position: "absolute", top: "12%", left: "6%",
          width: 120, height: 120, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(196,181,253,0.18) 0%, transparent 70%)",
        }}/>

        {/* ── Floating skill-pro tool icons — desktop only ───────────────────────────── */}

        {/* 1. Clapperboard — top-left */}
        <svg style={{ position:"absolute", top:"7%", left:"5%", animation:"floatA 6s ease-in-out infinite", opacity:0.5 }}
          width="80" height="80" viewBox="0 0 80 80" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Board body */}
          <rect x="10" y="28" width="60" height="42" rx="4" stroke="#1a1a2e" strokeWidth="2.5" fill="none"/>
          {/* Clapper bar */}
          <rect x="10" y="16" width="60" height="14" rx="3" stroke="#1a1a2e" strokeWidth="2.5" fill="none"/>
          {/* Clapper diagonal stripes */}
          <line x1="22" y1="16" x2="18" y2="30" stroke="#1a1a2e" strokeWidth="2.2"/>
          <line x1="34" y1="16" x2="30" y2="30" stroke="#1a1a2e" strokeWidth="2.2"/>
          <line x1="46" y1="16" x2="42" y2="30" stroke="#1a1a2e" strokeWidth="2.2"/>
          <line x1="58" y1="16" x2="54" y2="30" stroke="#1a1a2e" strokeWidth="2.2"/>
          {/* Play triangle on body */}
          <path d="M32 42 L32 60 L52 51 Z" stroke="#1a1a2e" strokeWidth="2.2" fill="none"/>
        </svg>

        {/* 2. Mobile camera (phone) — left side middle-upper */}
        <svg style={{ position:"absolute", top:"30%", left:"3.5%", animation:"floatB 7.5s ease-in-out infinite", opacity:0.5 }}
          width="60" height="80" viewBox="0 0 60 80" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Phone outline */}
          <rect x="8" y="4" width="44" height="72" rx="7" stroke="#1a1a2e" strokeWidth="2.5" fill="none"/>
          {/* Screen area */}
          <rect x="13" y="12" width="34" height="46" rx="3" stroke="#1a1a2e" strokeWidth="1.8" fill="none"/>
          {/* Camera lens circle */}
          <circle cx="30" cy="35" r="9" stroke="#1a1a2e" strokeWidth="2.2" fill="none"/>
          <circle cx="30" cy="35" r="4" stroke="#1a1a2e" strokeWidth="1.5" fill="none"/>
          {/* Flash dot */}
          <circle cx="42" cy="18" r="2.5" stroke="#1a1a2e" strokeWidth="1.8" fill="none"/>
          {/* Home button */}
          <circle cx="30" cy="68" r="3" stroke="#1a1a2e" strokeWidth="1.8" fill="none"/>
        </svg>

        {/* 3. DSLR / Pro Camera — bottom-left */}
        <svg style={{ position:"absolute", bottom:"12%", left:"4%", animation:"floatC 5.8s ease-in-out infinite", opacity:0.5 }}
          width="84" height="68" viewBox="0 0 84 68" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Camera body */}
          <rect x="8" y="20" width="68" height="42" rx="5" stroke="#1a1a2e" strokeWidth="2.5" fill="none"/>
          {/* Top hump (viewfinder/pentaprism) */}
          <path d="M26 20 L26 10 L42 6 L58 10 L58 20" stroke="#1a1a2e" strokeWidth="2.5" fill="none"/>
          {/* Lens barrel */}
          <circle cx="36" cy="41" r="14" stroke="#1a1a2e" strokeWidth="2.5" fill="none"/>
          <circle cx="36" cy="41" r="8" stroke="#1a1a2e" strokeWidth="1.8" fill="none"/>
          <circle cx="36" cy="41" r="3" stroke="#1a1a2e" strokeWidth="1.5" fill="none"/>
          {/* Shutter button */}
          <circle cx="58" cy="12" r="4" stroke="#1a1a2e" strokeWidth="2" fill="none"/>
          {/* Mode dial */}
          <circle cx="62" cy="30" r="5" stroke="#1a1a2e" strokeWidth="1.8" fill="none"/>
          {/* LCD screen area */}
          <rect x="52" y="36" width="16" height="12" rx="2" stroke="#1a1a2e" strokeWidth="1.8" fill="none"/>
        </svg>

        {/* 4. Wrench — top-right */}
        <svg style={{ position:"absolute", top:"9%", right:"5%", animation:"floatD 7s ease-in-out infinite", opacity:0.5 }}
          width="68" height="68" viewBox="0 0 68 68" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Wrench handle shaft */}
          <line x1="50" y1="18" x2="18" y2="50" stroke="#1a1a2e" strokeWidth="2.8"/>
          {/* Wrench head opening */}
          <path d="M44 8 C52 6, 62 12, 60 22 C58 28, 52 30, 46 28 L42 32 L36 26 L40 22 C38 16, 40 10, 44 8 Z"
            stroke="#1a1a2e" strokeWidth="2.5" fill="none"/>
          {/* Wrench tail */}
          <path d="M18 50 C14 54, 12 60, 16 64 C20 68, 26 66, 28 62 C30 58, 26 56, 22 54 Z"
            stroke="#1a1a2e" strokeWidth="2.2" fill="none"/>
        </svg>

        {/* 5. Paintbrush — right side upper-middle */}
        <svg style={{ position:"absolute", top:"32%", right:"4%", animation:"floatA 6.5s ease-in-out infinite 0.8s", opacity:0.5 }}
          width="60" height="80" viewBox="0 0 60 80" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Handle */}
          <rect x="26" y="4" width="8" height="44" rx="4" stroke="#1a1a2e" strokeWidth="2.2" fill="none"/>
          {/* Ferrule (metal band) */}
          <rect x="24" y="44" width="12" height="8" rx="1" stroke="#1a1a2e" strokeWidth="2.2" fill="none"/>
          {/* Bristle head */}
          <path d="M24 52 C20 56, 18 64, 24 70 C28 74, 32 74, 36 70 C42 64, 40 56, 36 52 Z"
            stroke="#1a1a2e" strokeWidth="2.2" fill="none"/>
          {/* Bristle tip */}
          <line x1="30" y1="70" x2="30" y2="76" stroke="#1a1a2e" strokeWidth="2"/>
        </svg>

        {/* 6. Hammer — bottom-right upper */}
        <svg style={{ position:"absolute", bottom:"28%", right:"3.5%", animation:"floatE 8s ease-in-out infinite", opacity:0.5 }}
          width="72" height="72" viewBox="0 0 72 72" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Handle */}
          <rect x="32" y="32" width="10" height="36" rx="5" stroke="#1a1a2e" strokeWidth="2.5" fill="none" transform="rotate(-45 37 50)"/>
          {/* Hammer head */}
          <rect x="8" y="6" width="38" height="20" rx="4" stroke="#1a1a2e" strokeWidth="2.5" fill="none" transform="rotate(-45 27 16)"/>
          {/* Claw cut */}
          <path d="M40 4 L46 10 L40 16" stroke="#1a1a2e" strokeWidth="2.2" fill="none" transform="rotate(-45 43 10)"/>
        </svg>

        {/* 7. Guitar — bottom-right lower */}
        <svg style={{ position:"absolute", bottom:"6%", right:"5%", animation:"floatB 7s ease-in-out infinite 1.4s", opacity:0.5 }}
          width="56" height="84" viewBox="0 0 56 84" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Neck */}
          <rect x="24" y="4" width="8" height="32" rx="3" stroke="#1a1a2e" strokeWidth="2.2" fill="none"/>
          {/* Headstock */}
          <rect x="20" y="2" width="16" height="8" rx="3" stroke="#1a1a2e" strokeWidth="2" fill="none"/>
          {/* Tuning pegs */}
          <circle cx="20" cy="5" r="2.5" stroke="#1a1a2e" strokeWidth="1.8" fill="none"/>
          <circle cx="36" cy="5" r="2.5" stroke="#1a1a2e" strokeWidth="1.8" fill="none"/>
          {/* Fret lines */}
          <line x1="24" y1="14" x2="32" y2="14" stroke="#1a1a2e" strokeWidth="1.6"/>
          <line x1="24" y1="22" x2="32" y2="22" stroke="#1a1a2e" strokeWidth="1.6"/>
          <line x1="24" y1="30" x2="32" y2="30" stroke="#1a1a2e" strokeWidth="1.6"/>
          {/* Body — figure-8 */}
          <path d="M28 36 C16 36, 6 44, 6 54 C6 62, 12 68, 20 68 C22 68, 24 67, 26 66 C28 70, 28 74, 28 76 C28 80, 30 82, 28 82 C26 82, 26 80, 28 78"
            stroke="#1a1a2e" strokeWidth="2.2" fill="none"/>
          <path d="M28 36 C40 36, 50 44, 50 54 C50 62, 44 68, 36 68 C34 68, 32 67, 30 66 C28 70, 28 74, 28 76"
            stroke="#1a1a2e" strokeWidth="2.2" fill="none"/>
          {/* Sound hole */}
          <circle cx="28" cy="56" r="7" stroke="#1a1a2e" strokeWidth="1.8" fill="none"/>
          {/* String */}
          <line x1="28" y1="36" x2="28" y2="66" stroke="#1a1a2e" strokeWidth="1.2"/>
        </svg>

      </div>

      {/* App shell — full width on mobile, capped at 430px on larger screens */}
      <div
        className="relative w-full bg-[#f8f7f5] overflow-hidden"
        style={{ maxWidth: "min(100vw, 430px)", minHeight: "100dvh", boxShadow: "0 4px 40px rgba(0,0,0,0.10), 0 1px 8px rgba(0,0,0,0.06)" }}
      >
        {/* Auth loading splash — shown while session resolves.
            Excluded: landing (public, no auth needed — show immediately),
            auth (has its own UI), home (has its own skeleton) */}
        {authLoading && screen !== "landing" && screen !== "auth" && screen !== "home" && (
          <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-white">
            <div
              className="flex items-center justify-center w-16 h-16 rounded-3xl mb-4"
              style={{ background: "linear-gradient(135deg, #6c47ff, #a78bfa)" }}
            >
              <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                <path d="M20 6L34 14V26L20 34L6 26V14L20 6Z" stroke="white" strokeWidth="2.5" fill="none" />
                <circle cx="20" cy="20" r="5" fill="white" />
              </svg>
            </div>
            <div className="w-6 h-6 rounded-full border-2 border-[#6c47ff] border-t-transparent animate-spin" />
          </div>
        )}
        {/* Screen renderer — eager screens first, rest wrapped in Suspense */}
        {screen === "landing" && <LandingPage onNavigate={navigate} />}
        {screen === "auth"    && <AuthScreen  onNavigate={navigate} />}

        <Suspense fallback={<div className="flex-1 bg-[#f8f7f5]" />}>
          {screen === "onboarding"     && <OnboardingScreen onNavigate={navigate} />}
          {screen === "search"         && <SearchScreen      onNavigate={navigate} />}
          {screen === "home"           && <HomeFeed          onNavigate={navigate} />}
          {screen === "discover"       && <DiscoverScreen    onNavigate={navigate} />}
          {screen === "own-profile"    && <ProfileScreen     variant="own"    onNavigate={navigate} />}
          {screen === "client-profile" && <ProfileScreen     variant="client" onNavigate={navigate} />}
          {screen === "upload"         && <UploadScreen      onNavigate={navigate} />}
          {screen === "messages"       && <MessagesScreen    onNavigate={navigate} />}
          {screen === "chat"           && <ChatScreen        onNavigate={navigate} />}
          {screen === "edit-profile"   && <EditProfileScreen onNavigate={navigate} />}
          {screen === "settings"       && <SettingsScreen    onNavigate={navigate} />}
          {screen === "pro"            && <ProScreen         onNavigate={navigate} />}
          {showBottomNav               && <BottomNav active={screen} onNavigate={navigate} />}
        </Suspense>
        <AuthPromptModal />
      </div>

      {/* Dev screen switcher — Orchids preview only, never shown on real domain */}
      {isOrchidsPreview && (
        <div
          className="hidden sm:flex fixed right-0 top-1/2 z-50 flex-col items-stretch gap-1 bg-white/90 backdrop-blur-sm rounded-l-2xl px-2 py-3 shadow-lg border border-r-0 border-[#e8e4df]"
          style={{ transform: "translateY(-50%)" }}
        >
          {(
            [
              ["landing",        "Landing"],
              ["onboarding",     "Onboarding"],
              ["auth",           "Auth"],
              ["home",           "Feed"],
              ["search",         "Search"],
              ["discover",       "Discover"],
              ["own-profile",    "My Profile"],
              ["client-profile", "Client"],
              ["upload",         "Upload"],
              ["messages",       "Messages"],
              ["chat",           "Chat"],
              ["edit-profile",   "Edit Profile"],
              ["settings",       "Settings"],
              ["pro",            "Pro"],
            ] as [Screen, string][]
          ).map(([s, label]) => (
            <button
              key={s}
              onClick={() => navigate(s)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all text-left whitespace-nowrap ${
                screen === s
                  ? "bg-[#6c47ff] text-white"
                  : "text-[#7a7570] hover:bg-[#f0eeea] hover:text-[#1a1a1a]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

    </div>
  );
}

export default function SkillSnapApp() {
  return (
    <AppProvider>
      <ToastProvider>
        <SkillSnapRouter />
      </ToastProvider>
    </AppProvider>
  );
}
