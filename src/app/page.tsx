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
        background: "#f0eff7",
      }}
    >
      {/* Desktop background — only visible on sm+ screens */}
      <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none">

        {/* Base warm-white gradient */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, #fafafa 0%, #f3f1fb 55%, #ede9f9 100%)" }} />

        {/* Large lavender glow — right side, matching reference */}
        <div style={{
          position: "absolute", top: "50%", right: "-8%",
          transform: "translateY(-50%)",
          width: 680, height: 680, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(180,160,255,0.28) 0%, rgba(196,181,253,0.12) 45%, transparent 72%)",
        }}/>

        {/* Softer secondary glow — upper right */}
        <div style={{
          position: "absolute", top: "-5%", right: "8%",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(216,207,255,0.22) 0%, transparent 65%)",
        }}/>

        {/* Very faint glow — lower left */}
        <div style={{
          position: "absolute", bottom: "-8%", left: "-4%",
          width: 360, height: 360, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(196,181,253,0.14) 0%, transparent 65%)",
        }}/>

        {/* Decorative arc rings — right side, like reference */}
        <svg
          style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", opacity: 0.55 }}
          width="340" height="700" viewBox="0 0 340 700" fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="340" cy="350" r="180" stroke="#c4b5fd" strokeWidth="1" fill="none" opacity="0.5"/>
          <circle cx="340" cy="350" r="240" stroke="#ddd6fe" strokeWidth="1" fill="none" opacity="0.4"/>
          <circle cx="340" cy="350" r="300" stroke="#ede9fe" strokeWidth="1" fill="none" opacity="0.3"/>
        </svg>

        {/* Subtle left arc */}
        <svg
          style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", opacity: 0.3 }}
          width="120" height="500" viewBox="0 0 120 500" fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="0" cy="250" r="160" stroke="#c4b5fd" strokeWidth="1" fill="none"/>
          <circle cx="0" cy="250" r="210" stroke="#ddd6fe" strokeWidth="1" fill="none"/>
        </svg>

      </div>

      {/* App shell — full width on mobile, capped at 430px on larger screens */}
      <div
        className="relative w-full bg-[#f8f7f5] overflow-hidden"
        style={{ maxWidth: "min(100vw, 430px)", minHeight: "100dvh", boxShadow: "0 8px 60px rgba(108,71,255,0.12), 0 2px 20px rgba(0,0,0,0.08)" }}
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
