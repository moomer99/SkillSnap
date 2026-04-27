"use client";
// ─────────────────────────────────────────────
// SkillSnap — App Shell & Screen Router
// Navigation is driven by AppState.screen
// All screens receive onNavigate from here
// ─────────────────────────────────────────────
import { AppProvider, useAppState } from "@/state/AppState";
import type { Screen } from "@/types";

import OnboardingScreen from "@/components/skillsnap/OnboardingScreen";
import SearchScreen from "@/components/skillsnap/SearchScreen";
import AuthScreen from "@/components/skillsnap/AuthScreen";
import HomeFeed from "@/components/skillsnap/HomeFeed";
import DiscoverScreen from "@/components/skillsnap/DiscoverScreen";
import ProfileScreen from "@/components/skillsnap/ProfileScreen";
import UploadScreen from "@/components/skillsnap/UploadScreen";
import MessagesScreen from "@/components/skillsnap/MessagesScreen";
import ChatScreen from "@/components/skillsnap/ChatScreen";
import EditProfileScreen from "@/components/skillsnap/EditProfileScreen";
import BottomNav from "@/components/skillsnap/BottomNav";
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

        {/* Clean white base */}
        <div style={{ position: "absolute", inset: 0, background: "#fafafa" }} />

        {/* Single soft lavender glow — bottom-right corner only */}
        <div style={{
          position: "absolute", bottom: "-10%", right: "-6%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(196,181,253,0.35) 0%, rgba(221,214,254,0.15) 50%, transparent 72%)",
        }}/>

        {/* Faint arc rings — bottom-right corner, partially visible */}
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

      </div>

      {/* App shell — full width on mobile, capped at 430px on larger screens */}
      <div
        className="relative w-full bg-[#f8f7f5] overflow-hidden"
        style={{ maxWidth: "min(100vw, 430px)", minHeight: "100dvh", boxShadow: "0 4px 40px rgba(0,0,0,0.10), 0 1px 8px rgba(0,0,0,0.06)" }}
      >
        {/* Auth loading splash — shown while session resolves (not on onboarding) */}
        {authLoading && screen !== "auth" && (
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
        {/* Screen renderer */}
        {screen === "onboarding"     && <OnboardingScreen onNavigate={navigate} />}
        {screen === "search"          && <SearchScreen      onNavigate={navigate} />}
        {screen === "auth"           && <AuthScreen       onNavigate={navigate} />}
        {screen === "home"           && <HomeFeed         onNavigate={navigate} />}
        {screen === "discover"       && <DiscoverScreen   onNavigate={navigate} />}
        {screen === "own-profile"    && <ProfileScreen    variant="own"    onNavigate={navigate} />}
        {screen === "client-profile" && <ProfileScreen    variant="client" onNavigate={navigate} />}
        {screen === "upload"         && <UploadScreen     onNavigate={navigate} />}
        {screen === "messages"       && <MessagesScreen   onNavigate={navigate} />}
        {screen === "chat"           && <ChatScreen       onNavigate={navigate} />}
        {screen === "edit-profile"   && <EditProfileScreen onNavigate={navigate} />}

        {showBottomNav && <BottomNav active={screen} onNavigate={navigate} />}
        <AuthPromptModal />
      </div>

      {/* Dev screen switcher — Orchids preview only, never shown on real domain */}
      {isOrchidsPreview && (
        <div
          className="hidden sm:flex fixed top-3 left-1/2 -translate-x-1/2 z-50 items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1.5 shadow-lg border border-[#e8e4df] flex-wrap justify-center"
          style={{ maxWidth: "calc(100vw - 2rem)" }}
        >
          {(
            [
              ["onboarding",     "Onboarding"],
              ["auth",           "Auth"],
              ["home",           "Feed"],
              ["search",         "Search"],
              ["discover",       "Discover"],
              ["own-profile",    "My Profile"],
              ["client-profile", "Client Profile"],
              ["upload",         "Upload"],
              ["messages",       "Messages"],
              ["chat",           "Chat"],
              ["edit-profile",   "Edit Profile"],
            ] as [Screen, string][]
          ).map(([s, label]) => (
            <button
              key={s}
              onClick={() => navigate(s)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                screen === s ? "bg-[#6c47ff] text-white" : "text-[#7a7570] hover:text-[#1a1a1a]"
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
