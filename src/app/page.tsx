"use client";
// ─────────────────────────────────────────────
// SkillSnap — App Shell & Screen Router
//
// Navigation is driven by AppState.screen. The shell is a single tree at every
// breakpoint: a sticky left rail (240px desktop / 60px tablet / hidden on phones) in one centred row,
// a centred 600px content column, and a 300px right rail above 1200px.
// Phones fall back to the bottom nav.
// ─────────────────────────────────────────────
import React, { lazy, Suspense, useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { AppProvider, useAppState } from "@/state/AppState";
import type { Screen } from "@/types";

// Landing + Auth load eagerly — they're the first thing every visitor sees
import LandingPage from "@/components/skillsnap/LandingPage";
import AuthScreen from "@/components/skillsnap/AuthScreen";
import AppSidebar from "@/components/skillsnap/AppSidebar";

// Redirect to the standalone /reset-password Next.js page
function ResetPasswordRedirect() {
  useEffect(() => { window.location.replace("/reset-password"); }, []);
  return null;
}

// Everything else is lazy — only downloaded when the user actually navigates there
const OnboardingScreen  = lazy(() => import("@/components/skillsnap/OnboardingScreen"));
const SearchScreen      = lazy(() => import("@/components/skillsnap/SearchScreen"));
const HomeFeed          = lazy(() => import("@/components/skillsnap/HomeFeed"));
const DiscoverScreen    = lazy(() => import("@/components/skillsnap/DiscoverScreen"));
const ProfileScreen     = lazy(() => import("@/components/skillsnap/ProfileScreen"));
// No UploadScreen — the web app is browse-only; posting happens in the mobile app.
const MessagesScreen    = lazy(() => import("@/components/skillsnap/MessagesScreen"));
const ChatScreen        = lazy(() => import("@/components/skillsnap/ChatScreen"));
const EditProfileScreen = lazy(() => import("@/components/skillsnap/EditProfileScreen"));
const SettingsScreen    = lazy(() => import("@/components/skillsnap/SettingsScreen"));
const ProScreen         = lazy(() => import("@/components/skillsnap/ProScreen"));
const ContactScreen     = lazy(() => import("@/components/skillsnap/ContactScreen"));
const HelpScreen        = lazy(() => import("@/components/skillsnap/HelpScreen"));
const AboutScreen       = lazy(() => import("@/components/skillsnap/AboutScreen"));
const TermsScreen       = lazy(() => import("@/components/skillsnap/TermsScreen"));
// ResetPasswordScreen removed — handled by the standalone /reset-password Next.js page
const RoleSetupScreen        = lazy(() => import("@/components/skillsnap/RoleSetupScreen"));
const UsernameSetupScreen    = lazy(() => import("@/components/skillsnap/UsernameSetupScreen"));
const BottomNav         = lazy(() => import("@/components/skillsnap/BottomNav"));
const RightSidebar      = lazy(() => import("@/components/skillsnap/RightSidebar"));

// Auth prompt modal — no SSR needed (reads client state only, never shown on server)
const AuthPromptModal = dynamic(
  () => import("@/components/skillsnap/shared/AuthPromptModal"),
  { ssr: false }
);

import { ToastProvider } from "@/components/skillsnap/shared/Toast";
import { useGlobalMessages } from "@/hooks/useGlobalMessages";
import ReviewBanner from "@/components/skillsnap/ReviewBanner";

// Screens that show the bottom nav on phones
const NAV_SCREENS: Screen[] = ["home", "discover", "messages", "own-profile"];

// Screens that own the whole viewport — no rails, no bottom nav
const FULL_BLEED: Screen[] = ["landing", "auth", "onboarding", "role-setup", "username-setup", "reset-password"];

// Screens a signed-out visitor can't reach
const AUTH_REQUIRED: Screen[] = ["messages", "own-profile", "client-profile", "chat", "edit-profile", "settings"];

// Screens that use the full content width (their own internal columns) rather
// than the 600px feed column, and so drop the right rail
const WIDE_SCREENS: Screen[] = ["discover"];

function SkillSnapRouter() {
  const { state, navigate, dispatch } = useAppState();
  const { screen, authLoading } = state;

  // Persistent background subscription — lives for the entire app session.
  // Receives messages and thread updates regardless of which screen is active.
  useGlobalMessages();

  const fullBleed = FULL_BLEED.includes(screen);
  const wide = WIDE_SCREENS.includes(screen);
  const showBottomNav = NAV_SCREENS.includes(screen);
  const unreadCount = state.threads.reduce((sum, t) => sum + (t.unreadCount ?? 0), 0);

  // Feed scroll-to-top — HomeFeed registers its scroll fn on mount
  const scrollToTopRef = useRef<(() => void) | null>(null);
  function registerScrollToTop(fn: () => void) { scrollToTopRef.current = fn; }
  function handleScrollToTop() {
    scrollToTopRef.current?.();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Opacity fade between screen changes
  const [opacity, setOpacity] = useState(1);
  const prevScreen = useRef(screen);
  useEffect(() => {
    if (prevScreen.current === screen) return;
    prevScreen.current = screen;
    setOpacity(0);
    window.scrollTo({ top: 0 });
    const t = setTimeout(() => setOpacity(1), 50);
    return () => clearTimeout(t);
  }, [screen]);

  function handleNavClick(s: Screen) {
    if (!state.isAuthenticated && AUTH_REQUIRED.includes(s)) {
      dispatch({ type: "SHOW_AUTH_PROMPT" });
      return;
    }
    navigate(s);
  }

  async function handleLogOut() {
    try {
      const { getSupabase } = await import("@/lib/supabase");
      await getSupabase().auth.signOut();
    } catch { /* ignore */ }
    dispatch({ type: "CLEAR_AUTH" });
    navigate("landing");
  }

  // Every screen, rendered once. The shell decides where the tree sits.
  const screenContent = (
    <>
      {screen === "landing" && <LandingPage onNavigate={navigate} />}
      {screen === "auth"    && <AuthScreen  onNavigate={navigate} />}
      <Suspense fallback={<div className="flex-1 min-h-[50vh]" style={{ background: "var(--ss-bg)" }} />}>
        {screen === "onboarding"     && <OnboardingScreen onNavigate={navigate} />}
        {screen === "search"         && <SearchScreen      onNavigate={navigate} />}
        {screen === "home"           && <HomeFeed          onNavigate={navigate} registerScrollToTop={registerScrollToTop} />}
        {screen === "discover"       && <DiscoverScreen    onNavigate={navigate} />}
        {screen === "own-profile"    && <ProfileScreen     variant="own"    onNavigate={navigate} />}
        {screen === "client-profile" && <ProfileScreen     variant="client" onNavigate={navigate} />}
        {screen === "messages"       && <MessagesScreen    onNavigate={navigate} />}
        {screen === "chat"           && <ChatScreen        onNavigate={navigate} />}
        {screen === "edit-profile"   && <EditProfileScreen onNavigate={navigate} />}
        {screen === "settings"       && <SettingsScreen    onNavigate={navigate} />}
        {screen === "pro"            && <ProScreen         onNavigate={navigate} />}
        {screen === "contact"        && <ContactScreen     onNavigate={navigate} />}
        {screen === "help"           && <HelpScreen        onNavigate={navigate} />}
        {screen === "about"          && <AboutScreen       onNavigate={navigate} />}
        {screen === "terms"          && <TermsScreen       onNavigate={navigate} />}
        {screen === "reset-password" && <ResetPasswordRedirect />}
        {screen === "role-setup"     && <RoleSetupScreen />}
        {screen === "username-setup" && <UsernameSetupScreen onDone={() => navigate("role-setup")} />}
      </Suspense>
    </>
  );

  const loadingOverlay = authLoading ? (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ background: "var(--ss-bg)" }}
    >
      <img src="/skillsnap-icon.svg" alt="SkillSnap" width={64} height={64} className="mb-4" />
      <div className="w-6 h-6 rounded-full border-2 border-[#6c47ff] border-t-transparent animate-spin" />
    </div>
  ) : null;

  // ── Full-bleed screens: marketing + auth flows own the whole viewport ──
  if (fullBleed) {
    return (
      <div className="min-h-screen" style={{ background: "var(--ss-bg)", fontFamily: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif" }}>
        <ReviewBanner />
        {loadingOverlay}
        <div style={{ opacity, transition: "opacity 150ms ease" }}>{screenContent}</div>
        <AuthPromptModal />
      </div>
    );
  }

  // ── App shell ──
  return (
    <div className="min-h-screen" style={{ background: "var(--ss-bg)", fontFamily: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <ReviewBanner />
      {loadingOverlay}

      {/* One centred row, X-style: rail, centre column, right rail. The rail
          is a sticky flex child (not fixed), so the three centre together as
          a block capped at 1180px of content (240 + 600 + 32 + 300; box-content
          keeps the lg:px-6 gutters outside the cap) when there is a right
          rail; wide screens (Discover) drop the cap and the right rail. */}
      <div className={`mx-auto flex items-start justify-center ${wide ? "" : "max-w-[1180px] box-content lg:px-6"}`}>
        <AppSidebar
          active={screen}
          isAuthenticated={state.isAuthenticated}
          unreadCount={unreadCount}
          onNavigate={handleNavClick}
          onLogOut={handleLogOut}
        />

        {/* Centre column — sits directly against the rail's own padding */}
        <main
          className={`w-full min-h-screen pb-24 md:pb-0 ${wide ? "" : "max-w-[600px]"}`}
          style={{ opacity, transition: "opacity 150ms ease" }}
        >
          {screenContent}
        </main>

        {/* Right rail — suggested pros + download nudge, hidden below 1200px.
            Carries the gap to the centre column itself. The rail is the
            sticky element: a sticky child would be pinned inside a container
            only as tall as its own content. */}
        {!wide && (
          <aside className="ss-right-rail ml-6 xl:ml-8 w-[300px] flex-shrink-0 sticky top-0 h-screen overflow-y-auto no-scrollbar py-6">
            <Suspense fallback={null}>
              <RightSidebar onNavigate={navigate} />
            </Suspense>
          </aside>
        )}
      </div>

      {showBottomNav && (
        <Suspense fallback={null}>
          <BottomNav active={screen} onNavigate={navigate} onScrollToTop={handleScrollToTop} />
        </Suspense>
      )}

      <AuthPromptModal />
    </div>
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: "" };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] caught:", error.message, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100dvh", gap: "16px", padding: "24px", background: "var(--ss-bg)" }}>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "white" }}>Something went wrong</div>
          <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", maxWidth: "400px", textAlign: "center", wordBreak: "break-word" }}>{this.state.error}</div>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: "10px 24px", borderRadius: "10px", background: "#6c47ff", color: "white", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function SkillSnapApp() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <ToastProvider>
          <SkillSnapRouter />
        </ToastProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}
