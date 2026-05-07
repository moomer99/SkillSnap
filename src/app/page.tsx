"use client";
// ─────────────────────────────────────────────
// SkillSnap — App Shell & Screen Router
// Navigation is driven by AppState.screen
// All screens receive onNavigate from here
// ─────────────────────────────────────────────
import { lazy, Suspense, useMemo, useRef, useState, useEffect } from "react";
import { Home, Compass, PlusCircle, MessageCircle, User, Settings, MoreHorizontal, HelpCircle, LogOut } from "lucide-react";
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

  // More popover state
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!moreOpen) return;
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [moreOpen]);

  async function handleLogOut() {
    setMoreOpen(false);
    try {
      const { getSupabase } = await import("@/lib/supabase");
      await getSupabase().auth.signOut();
    } catch { /* ignore */ }
    navigate("landing");
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f0eff7", fontFamily: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif" }}>

      {/* ── LEFT SIDEBAR — three fixed floating cards, desktop only ── */}
      <style>{`
        @media (min-width: 768px) {
          .ss-sidebar-card { display: flex; }
        }
        @media (max-width: 767px) {
          .ss-sidebar-card { display: none !important; }
        }
        .ss-nav-btn { position: relative; }
        .ss-nav-btn::after {
          content: attr(data-tooltip);
          position: absolute;
          left: calc(100% + 8px);
          top: 50%;
          transform: translateY(-50%);
          background: #1a1a1a;
          color: white;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.12s;
          z-index: 300;
        }
        .ss-nav-btn:hover::after { opacity: 1; }
      `}</style>

      {/* Card 1 — Logo, fixed top-left */}
      <div className="ss-sidebar-card" style={{
        position: "fixed", top: "16px", left: "16px", zIndex: 100,
        background: "white", border: "1px solid #e8e4df", borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        width: "52px", height: "52px",
        alignItems: "center", justifyContent: "center",
      }}>
        <img src="/skillsnap-icon.svg" alt="SkillSnap" width={34} height={34} />
      </div>

      {/* Card 2 — Nav icons, fixed vertically centred */}
      <div className="ss-sidebar-card" style={{
        position: "fixed", top: "50%", left: "16px", transform: "translateY(-50%)", zIndex: 100,
        background: "white", border: "1px solid #e8e4df", borderRadius: "14px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        flexDirection: "column", alignItems: "center",
        padding: "8px 6px", gap: "6px",
      }}>
        {(
          [
            { icon: Home,          label: "Feed",     s: "home"        },
            { icon: Compass,       label: "Discover", s: "discover"    },
            { icon: PlusCircle,    label: "Post",     s: "upload"      },
            { icon: MessageCircle, label: "Messages", s: "messages"    },
            { icon: User,          label: "Profile",  s: "own-profile" },
          ] as { icon: React.ElementType; label: string; s: Screen }[]
        ).map(({ icon: Icon, label, s }) => {
          const active = screen === s;
          const isPost = s === "upload";
          return (
            <button
              key={s}
              data-tooltip={label}
              className="ss-nav-btn"
              onClick={() => navigate(s)}
              style={{
                width: "40px", height: "40px", borderRadius: "10px",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: isPost ? "#6c47ff" : active ? "#eef0ff" : "transparent",
                color: isPost ? "white" : active ? "#6c47ff" : "#7a7570",
                border: "none", cursor: "pointer", transition: "background 0.15s",
                flexShrink: 0,
              }}
              onMouseEnter={e => { if (!isPost && !active) (e.currentTarget as HTMLButtonElement).style.background = "#f5f3ff"; }}
              onMouseLeave={e => { if (!isPost && !active) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <Icon size={22} strokeWidth={isPost ? 2.2 : active ? 2.4 : 1.8} />
            </button>
          );
        })}
      </div>

      {/* Card 3 — Utility icons, fixed bottom-left */}
      <div className="ss-sidebar-card" style={{
        position: "fixed", bottom: "16px", left: "16px", zIndex: 100,
        background: "white", border: "1px solid #e8e4df", borderRadius: "14px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        flexDirection: "column", alignItems: "center",
        padding: "8px 6px", gap: "6px",
        width: "52px",
      }}>
        <button
          data-tooltip="Settings"
          className="ss-nav-btn"
          onClick={() => { setMoreOpen(false); navigate("settings"); }}
          style={{
            width: "40px", height: "40px", borderRadius: "10px",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: screen === "settings" ? "#eef0ff" : "transparent",
            color: screen === "settings" ? "#6c47ff" : "#b0aaa5",
            border: "none", cursor: "pointer", transition: "background 0.15s",
          }}
          onMouseEnter={e => { if (screen !== "settings") (e.currentTarget as HTMLButtonElement).style.background = "#f5f3ff"; }}
          onMouseLeave={e => { if (screen !== "settings") (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
        >
          <Settings size={20} strokeWidth={1.8} />
        </button>

        {/* 3-dots + popover */}
        <div ref={moreRef} style={{ position: "relative" }}>
          <button
            data-tooltip="More"
            className="ss-nav-btn"
            onClick={() => setMoreOpen(o => !o)}
            style={{
              width: "40px", height: "40px", borderRadius: "10px",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: moreOpen ? "#eef0ff" : "transparent",
              color: moreOpen ? "#6c47ff" : "#b0aaa5",
              border: "none", cursor: "pointer", transition: "background 0.15s",
            }}
          >
            <MoreHorizontal size={20} strokeWidth={1.8} />
          </button>
          {moreOpen && (
            <div style={{
              position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
              background: "white", border: "1px solid #e8e4df", borderRadius: "12px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.10)", padding: "6px", minWidth: "160px", zIndex: 300,
            }}>
              <button onClick={() => { setMoreOpen(false); navigate("settings"); }}
                style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "9px 12px", borderRadius: "8px", background: "none", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "#1a1a1a" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f5f3ff")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              ><Settings size={15} /> Settings</button>
              <button onClick={() => { setMoreOpen(false); navigate("help"); }}
                style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "9px 12px", borderRadius: "8px", background: "none", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "#1a1a1a" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f5f3ff")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              ><HelpCircle size={15} /> Help &amp; Support</button>
              {(state.isAuthenticated && !state.isGuest) && (
                <button onClick={handleLogOut}
                  style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "9px 12px", borderRadius: "8px", background: "none", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "#e53e3e" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fff5f5")}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}
                ><LogOut size={15} /> Log Out</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Centred 3-column wrapper (no left sidebar slot — it's fixed) ── */}
      <div className="hidden lg:flex" style={{ maxWidth: "1100px", margin: "0 auto", alignItems: "flex-start" }}>

        {/* CENTRE — app shell */}
        <div style={{ flex: "0 0 auto" }}>
          <div
            className="relative bg-[#f8f7f5] overflow-hidden"
            style={{ width: "600px", minHeight: "100dvh", boxShadow: "0 4px 40px rgba(0,0,0,0.10), 0 1px 8px rgba(0,0,0,0.06)" }}
          >
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

        {/* RIGHT SIDEBAR — immediately beside centre, 280px, content-height cards */}
        <div style={{ width: "280px", flexShrink: 0, padding: "20px 0 20px 22px" }}>
          <Suspense fallback={null}>
            <RightSidebar onNavigate={navigate} />
          </Suspense>
        </div>

      </div>

      {/* ── Mobile / tablet fallback (< lg) — single column ─────── */}
      <div className="lg:hidden relative w-full bg-[#f8f7f5] overflow-hidden" style={{ minHeight: "100dvh" }}>
        {authLoading && (
          <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-white">
            <div className="flex items-center justify-center w-16 h-16 rounded-3xl mb-4" style={{ background: "linear-gradient(135deg, #6c47ff, #a78bfa)" }}>
              <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                <path d="M20 6L34 14V26L20 34L6 26V14L20 6Z" stroke="white" strokeWidth="2.5" fill="none" />
                <circle cx="20" cy="20" r="5" fill="white" />
              </svg>
            </div>
            <div className="w-6 h-6 rounded-full border-2 border-[#6c47ff] border-t-transparent animate-spin" />
          </div>
        )}
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
