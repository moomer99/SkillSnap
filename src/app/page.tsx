"use client";
// ─────────────────────────────────────────────
// SkillSnap — App Shell & Screen Router
// Navigation is driven by AppState.screen
// All screens receive onNavigate from here
// ─────────────────────────────────────────────
import { lazy, Suspense, useMemo, useRef, useState, useEffect } from "react";
import { Home, Compass, PlusCircle, MessageCircle, User, Settings, MoreHorizontal } from "lucide-react";
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
const ContactScreen     = lazy(() => import("@/components/skillsnap/ContactScreen"));
const HelpScreen        = lazy(() => import("@/components/skillsnap/HelpScreen"));
const AboutScreen       = lazy(() => import("@/components/skillsnap/AboutScreen"));
const TermsScreen            = lazy(() => import("@/components/skillsnap/TermsScreen"));
const ResetPasswordScreen    = lazy(() => import("@/components/skillsnap/ResetPasswordScreen"));
const BottomNav         = lazy(() => import("@/components/skillsnap/BottomNav"));
const RightSidebar      = lazy(() => import("@/components/skillsnap/RightSidebar"));

import { ToastProvider } from "@/components/skillsnap/shared/Toast";
import AuthPromptModal from "@/components/skillsnap/shared/AuthPromptModal";
import { useGlobalMessages } from "@/hooks/useGlobalMessages";

// Screens that show the bottom nav
const NAV_SCREENS: Screen[] = ["home", "discover", "upload", "messages", "own-profile"];

// Only show dev tools on the Orchids sandbox preview, never on the real domain
const isOrchidsPreview =
  typeof window !== "undefined" &&
  window.location.hostname.includes("orchids.cloud");

function SkillSnapRouter() {
  const { state, navigate } = useAppState();
  const { screen, authLoading } = state;

  // Persistent background subscription — lives for the entire app session.
  // Receives messages and thread updates regardless of which screen is active.
  useGlobalMessages();

  const showBottomNav = NAV_SCREENS.includes(screen);

  // Opacity fade between screen changes
  const [opacity, setOpacity] = useState(1);
  const prevScreen = useRef(screen);
  useEffect(() => {
    if (prevScreen.current === screen) return;
    prevScreen.current = screen;
    setOpacity(0);
    const t = setTimeout(() => setOpacity(1), 50);
    return () => clearTimeout(t);
  }, [screen]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f0eff7", fontFamily: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif" }}>

      {/* Left column — 72px icon-only (logged in) or 240px (logged out), desktop only */}
      <div
        className="hidden lg:flex flex-col"
        style={{
          width: state.isAuthenticated && !state.isGuest ? "72px" : "240px",
          flexShrink: 0,
          padding: "20px 12px",
        }}
      >
        {/* Logged-out: logo card only */}
        {(!state.isAuthenticated || state.isGuest) && (
          <div className="rounded-2xl bg-white shadow-sm" style={{ padding: "18px" }}>
            <img src="/skillsnap-icon.svg" alt="SkillSnap" width={54} height={54} />
            <p className="text-xs font-bold text-[#1a1a1a] mt-2 leading-tight">SkillSnap</p>
          </div>
        )}

        {/* Logged-in: Threads-style icon-only sidebar */}
        {state.isAuthenticated && !state.isGuest && (
          <div className="rounded-2xl bg-white shadow-sm flex flex-col items-center py-4 gap-0" style={{ minHeight: "420px" }}>
            {/* Logo at top */}
            <div style={{ padding: "0 11px 12px" }}>
              <img src="/skillsnap-icon.svg" alt="SkillSnap" width={38} height={38} />
            </div>

            <div className="w-8 h-px bg-[#f0eeea] mx-auto mb-2" />

            {/* Main nav icons — vertically centred */}
            <div className="flex flex-col items-center gap-1 flex-1 justify-center">
              {(
                [
                  { icon: Home,          label: "Feed",     screen: "home",        activeIcon: Home          },
                  { icon: Compass,       label: "Discover", screen: "discover",    activeIcon: Compass       },
                  { icon: PlusCircle,    label: "Post",     screen: "upload",      activeIcon: PlusCircle    },
                  { icon: MessageCircle, label: "Messages", screen: "messages",    activeIcon: MessageCircle },
                  { icon: User,          label: "Profile",  screen: "own-profile", activeIcon: User          },
                ] as { icon: React.ElementType; label: string; screen: Screen; activeIcon: React.ElementType }[]
              ).map(({ icon: Icon, label, screen: s }) => {
                const active = screen === s;
                return (
                  <button
                    key={s}
                    onClick={() => navigate(s)}
                    title={label}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                      active
                        ? "bg-[#f0ebff] text-[#6c47ff]"
                        : "text-[#7a7570] hover:bg-[#f5f3ff] hover:text-[#1a1a1a]"
                    }`}
                  >
                    <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                  </button>
                );
              })}
            </div>

            {/* Bottom utility icons */}
            <div className="flex flex-col items-center gap-1 mt-2 pt-2 border-t border-[#f0eeea] w-full">
              <button
                title="Settings"
                onClick={() => navigate("settings")}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                  screen === "settings" ? "bg-[#f0ebff] text-[#6c47ff]" : "text-[#b0aaa5] hover:bg-[#f5f3ff] hover:text-[#1a1a1a]"
                }`}
              >
                <Settings size={20} strokeWidth={1.8} />
              </button>
              <button
                title="More"
                className="w-11 h-11 rounded-xl flex items-center justify-center text-[#b0aaa5] hover:bg-[#f5f3ff] hover:text-[#1a1a1a] transition-all"
              >
                <MoreHorizontal size={20} strokeWidth={1.8} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Centre — fills remaining space and centres the app shell */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
        {/* App shell — full width on mobile, 430px on tablet, 600px on desktop */}
        <div
          className="relative w-full bg-[#f8f7f5] overflow-hidden max-w-[430px] lg:max-w-[600px] lg:w-[600px]"
          style={{ minHeight: "100dvh", boxShadow: "0 4px 40px rgba(0,0,0,0.10), 0 1px 8px rgba(0,0,0,0.06)" }}
        >
        {/* Auth loading splash — shown for ALL screens while session resolves.
            Covers the landing/auth flash that occurs after Google OAuth redirects back. */}
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
        {/* Screen renderer — eager screens first, rest wrapped in Suspense */}
        <div style={{ opacity, transition: "opacity 150ms ease" }}>
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
            {screen === "contact"        && <ContactScreen     onNavigate={navigate} />}
            {screen === "help"           && <HelpScreen        onNavigate={navigate} />}
            {screen === "about"          && <AboutScreen       onNavigate={navigate} />}
            {screen === "terms"          && <TermsScreen          onNavigate={navigate} />}
            {screen === "reset-password" && <ResetPasswordScreen onNavigate={navigate} />}
            {showBottomNav               && <BottomNav active={screen} onNavigate={navigate} />}
          </Suspense>
        </div>
        <AuthPromptModal />
        </div>
      </div>

      {/* Right column — 320px, desktop only, tighter gap to centre */}
      <div className="hidden lg:flex flex-col" style={{ width: "320px", flexShrink: 0, padding: "20px 16px 20px 6px" }}>
        <Suspense fallback={null}>
          <RightSidebar onNavigate={navigate} />
        </Suspense>
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
