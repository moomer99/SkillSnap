"use client";
// ─────────────────────────────────────────────
// SkillSnap — App Shell & Screen Router
// Navigation is driven by AppState.screen
// All screens receive onNavigate from here
// ─────────────────────────────────────────────
import { AppProvider, useAppState } from "@/state/AppState";
import type { Screen } from "@/types";

import OnboardingScreen from "@/components/skillsnap/OnboardingScreen";
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

function SkillSnapRouter() {
  const { state, navigate } = useAppState();
  const { screen, authLoading } = state;

  const showBottomNav = NAV_SCREENS.includes(screen);

  return (
    <div
      className="relative w-full min-h-screen flex justify-center"
      style={{
        fontFamily: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
        background: "linear-gradient(135deg, #1a0a3c 0%, #2d1264 30%, #1e1050 60%, #0f0a2e 100%)",
      }}
    >
      {/* Desktop background decoration — only visible on larger screens */}
      <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large soft orbs */}
        <div style={{
          position: "absolute", top: "-10%", left: "5%",
          width: 520, height: 520, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(108,71,255,0.22) 0%, transparent 70%)",
        }}/>
        <div style={{
          position: "absolute", bottom: "-5%", right: "6%",
          width: 440, height: 440, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,106,245,0.18) 0%, transparent 70%)",
        }}/>
        <div style={{
          position: "absolute", top: "40%", left: "2%",
          width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)",
        }}/>
        <div style={{
          position: "absolute", top: "20%", right: "4%",
          width: 260, height: 260, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(196,181,253,0.10) 0%, transparent 70%)",
        }}/>
        {/* Subtle grid overlay */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ opacity: 0.04 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="bg-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#bg-grid)"/>
        </svg>
        {/* SkillSnap wordmark watermark */}
        <div style={{
          position: "absolute", bottom: 32, left: "50%",
          transform: "translateX(-50%)",
          fontSize: 13, fontWeight: 700, letterSpacing: "0.08em",
          color: "rgba(255,255,255,0.18)", whiteSpace: "nowrap",
          userSelect: "none",
        }}>
          SKILLSNAP
        </div>
      </div>

      {/* App shell — full width on mobile, capped at 430px on larger screens */}
      <div
        className="relative w-full bg-[#f8f7f5] overflow-hidden"
        style={{ maxWidth: "min(100vw, 430px)", minHeight: "100dvh", boxShadow: "0 0 120px rgba(108,71,255,0.35), 0 0 40px rgba(0,0,0,0.4)" }}
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
