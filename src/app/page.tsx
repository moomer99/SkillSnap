"use client";
// ─────────────────────────────────────────────
// SkillSnap — App Shell & Screen Router
// Navigation is driven by AppState.screen
// All screens receive onNavigate from here
// ─────────────────────────────────────────────
import { AppProvider, useAppState } from "@/state/AppState";
import type { Screen } from "@/types";

import AuthScreen from "@/components/skillsnap/AuthScreen";
import HomeFeed from "@/components/skillsnap/HomeFeed";
import DiscoverScreen from "@/components/skillsnap/DiscoverScreen";
import ProfileScreen from "@/components/skillsnap/ProfileScreen";
import UploadScreen from "@/components/skillsnap/UploadScreen";
import MessagesScreen from "@/components/skillsnap/MessagesScreen";
import ChatScreen from "@/components/skillsnap/ChatScreen";
import BottomNav from "@/components/skillsnap/BottomNav";

// Screens that show the bottom nav
const NAV_SCREENS: Screen[] = ["home", "discover", "upload", "messages", "own-profile"];

function SkillSnapRouter() {
  const { state, navigate } = useAppState();
  const { screen, authLoading } = state;

  const showBottomNav = NAV_SCREENS.includes(screen);

  return (
    <div
      className="relative w-full min-h-screen flex justify-center bg-[#f0eeea]"
      style={{ fontFamily: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* Phone shell */}
      <div
        className="relative w-full bg-[#f8f7f5] overflow-hidden"
        style={{ maxWidth: 390, minHeight: "100dvh", boxShadow: "0 0 80px rgba(0,0,0,0.12)" }}
      >
        {/* Auth loading splash — shown while session resolves */}
        {authLoading && (
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
        {screen === "auth"           && <AuthScreen    onNavigate={navigate} />}
        {screen === "home"           && <HomeFeed      onNavigate={navigate} />}
        {screen === "discover"       && <DiscoverScreen onNavigate={navigate} />}
        {screen === "own-profile"    && <ProfileScreen  variant="own"    onNavigate={navigate} />}
        {screen === "client-profile" && <ProfileScreen  variant="client" onNavigate={navigate} />}
        {screen === "upload"         && <UploadScreen   onNavigate={navigate} />}
        {screen === "messages"       && <MessagesScreen onNavigate={navigate} />}
        {screen === "chat"           && <ChatScreen     onNavigate={navigate} />}

        {showBottomNav && <BottomNav active={screen} onNavigate={navigate} />}
      </div>

      {/* Desktop screen switcher — dev preview only */}
      <div
        className="hidden sm:flex fixed top-4 left-1/2 -translate-x-1/2 z-50 items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg border border-[#e8e4df]"
        style={{ maxWidth: "calc(100vw - 2rem)" }}
      >
        {(
          [
            ["auth",           "Auth"],
            ["home",           "Feed"],
            ["discover",       "Discover"],
            ["own-profile",    "My Profile"],
            ["client-profile", "Client Profile"],
            ["upload",         "Upload"],
            ["messages",       "Messages"],
            ["chat",           "Chat"],
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
    </div>
  );
}

export default function SkillSnapApp() {
  return (
    <AppProvider>
      <SkillSnapRouter />
    </AppProvider>
  );
}
