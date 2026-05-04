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

        {/* Floating blob keyframes */}
        <style>{`
          @keyframes floatA { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-18px) rotate(3deg)} }
          @keyframes floatB { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-24px) rotate(-4deg)} }
          @keyframes floatC { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-14px) rotate(5deg)} }
          @keyframes floatD { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-20px) rotate(-3deg)} }
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

        {/* ── Floating blobs — desktop only ───────────────────────────── */}

        {/* Top-left large blob */}
        <svg style={{ position:"absolute", top:"6%", left:"4%", animation:"floatA 6s ease-in-out infinite", opacity:0.55 }}
          width="90" height="90" viewBox="0 0 90 90" fill="none">
          <path d="M45 8 C62 5, 82 18, 84 38 C86 58, 70 80, 50 83 C30 86, 10 72, 8 52 C6 32, 22 12, 45 8 Z"
            stroke="#1a1a2e" strokeWidth="2.2" fill="none"/>
        </svg>

        {/* Bottom-left medium blob */}
        <svg style={{ position:"absolute", bottom:"10%", left:"3%", animation:"floatB 7.5s ease-in-out infinite", opacity:0.45 }}
          width="68" height="72" viewBox="0 0 68 72" fill="none">
          <path d="M34 6 C48 4, 64 16, 63 32 C62 48, 48 66, 32 66 C16 66, 4 52, 5 36 C6 20, 18 8, 34 6 Z"
            stroke="#1a1a2e" strokeWidth="2" fill="none"/>
        </svg>

        {/* Top-right small blob */}
        <svg style={{ position:"absolute", top:"8%", right:"5%", animation:"floatC 5.5s ease-in-out infinite", opacity:0.40 }}
          width="48" height="50" viewBox="0 0 48 50" fill="none">
          <path d="M24 4 C34 3, 45 12, 44 24 C43 36, 33 46, 22 46 C11 46, 3 36, 4 24 C5 12, 14 5, 24 4 Z"
            stroke="#1a1a2e" strokeWidth="2" fill="none"/>
        </svg>

        {/* Bottom-right two small blobs */}
        <svg style={{ position:"absolute", bottom:"18%", right:"3.5%", animation:"floatD 8s ease-in-out infinite", opacity:0.45 }}
          width="52" height="56" viewBox="0 0 52 56" fill="none">
          <path d="M26 4 C38 3, 50 14, 49 28 C48 42, 36 54, 22 53 C8 52, 2 40, 3 26 C4 12, 14 5, 26 4 Z"
            stroke="#1a1a2e" strokeWidth="2" fill="none"/>
        </svg>

        <svg style={{ position:"absolute", bottom:"8%", right:"6%", animation:"floatA 6.8s ease-in-out infinite 1.2s", opacity:0.35 }}
          width="36" height="38" viewBox="0 0 36 38" fill="none">
          <path d="M18 3 C27 2, 34 10, 34 20 C34 30, 26 36, 16 36 C6 36, 2 28, 3 18 C4 8, 10 4, 18 3 Z"
            stroke="#1a1a2e" strokeWidth="1.8" fill="none"/>
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
