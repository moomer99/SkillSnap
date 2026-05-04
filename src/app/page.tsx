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
      {/* Desktop background — only visible on sm+ screens, fixed so it doesn't scroll */}
      <div className="hidden sm:block fixed inset-0 overflow-hidden pointer-events-none">

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

        {/* 4. Wrench — top-right (Lucide-style, viewBox 24x24 scaled to 72px) */}
        <svg style={{ position:"absolute", top:"9%", right:"5%", animation:"floatD 7s ease-in-out infinite", opacity:0.5 }}
          width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>

        {/* 5. Paintbrush — right side upper-middle (Lucide-style) */}
        <svg style={{ position:"absolute", top:"32%", right:"4%", animation:"floatA 6.5s ease-in-out infinite 0.8s", opacity:0.5 }}
          width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3z"/>
          <path d="M9 8c-2 3-4 3.5-7 4l8 8c1-.5 3.5-2 4-7"/>
          <path d="M14.5 17.5 4.5 15"/>
        </svg>

        {/* 6. Hammer — bottom-right upper (Lucide-style) */}
        <svg style={{ position:"absolute", bottom:"28%", right:"3.5%", animation:"floatE 8s ease-in-out infinite", opacity:0.5 }}
          width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9"/>
          <path d="M17.64 15 22 10.64"/>
          <path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91"/>
        </svg>

        {/* 7. Guitar — bottom-right lower (clean guitar silhouette) */}
        <svg style={{ position:"absolute", bottom:"6%", right:"5%", animation:"floatB 7s ease-in-out infinite 1.4s", opacity:0.5 }}
          width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          {/* Neck + headstock */}
          <line x1="12" y1="2" x2="12" y2="10"/>
          <rect x="10" y="2" width="4" height="3" rx="1"/>
          {/* Tuning pegs */}
          <circle cx="10" cy="3" r="0.8" fill="#1a1a2e"/>
          <circle cx="14" cy="3" r="0.8" fill="#1a1a2e"/>
          {/* Frets */}
          <line x1="11" y1="5.5" x2="13" y2="5.5"/>
          <line x1="11" y1="7.5" x2="13" y2="7.5"/>
          {/* Body — upper bout */}
          <path d="M12 10 C8 10 5 12 5 14.5 C5 16.5 6.5 17.5 8 17.5 C9 17.5 9.5 17 10 16.5"/>
          <path d="M12 10 C16 10 19 12 19 14.5 C19 16.5 17.5 17.5 16 17.5 C15 17.5 14.5 17 14 16.5"/>
          {/* Waist */}
          <path d="M10 16.5 C9.5 17.5 9.5 18.5 10 19.5"/>
          <path d="M14 16.5 C14.5 17.5 14.5 18.5 14 19.5"/>
          {/* Body — lower bout */}
          <path d="M10 19.5 C8.5 19.5 5 20.5 5 22 C5 23 6.5 24 9 24"/>
          <path d="M14 19.5 C15.5 19.5 19 20.5 19 22 C19 23 17.5 24 15 24"/>
          <path d="M9 24 Q12 25 15 24"/>
          {/* Sound hole */}
          <circle cx="12" cy="21" r="1.5"/>
          {/* String */}
          <line x1="12" y1="10" x2="12" y2="22.5" strokeWidth="0.8"/>
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
