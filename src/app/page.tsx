"use client";
// ─────────────────────────────────────────────
// SkillSnap — App Shell & Screen Router
// Navigation is driven by AppState.screen
// All screens receive onNavigate from here
// ─────────────────────────────────────────────
import { lazy, Suspense, useMemo, useRef, useState, useEffect } from "react";
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

        {/* LEFT COLUMN — top / middle / bottom */}

        {/* 1. Clapperboard — left top */}
        <svg style={{ position:"absolute", top:"8%", left:"5%", animation:"floatA 6s ease-in-out infinite", opacity:0.1 }}
          width="72" height="72" viewBox="0 0 80 80" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="10" y="28" width="60" height="42" rx="4" stroke="#1a1a2e" strokeWidth="2.5" fill="none"/>
          <rect x="10" y="16" width="60" height="14" rx="3" stroke="#1a1a2e" strokeWidth="2.5" fill="none"/>
          <line x1="22" y1="16" x2="18" y2="30" stroke="#1a1a2e" strokeWidth="2.2"/>
          <line x1="34" y1="16" x2="30" y2="30" stroke="#1a1a2e" strokeWidth="2.2"/>
          <line x1="46" y1="16" x2="42" y2="30" stroke="#1a1a2e" strokeWidth="2.2"/>
          <line x1="58" y1="16" x2="54" y2="30" stroke="#1a1a2e" strokeWidth="2.2"/>
          <path d="M32 42 L32 60 L52 51 Z" stroke="#1a1a2e" strokeWidth="2.2" fill="none"/>
        </svg>

        {/* 2. Skates / Sport — left middle */}
        <svg style={{ position:"absolute", top:"50%", left:"4%", transform:"translateY(-50%)", animation:"floatC 5.8s ease-in-out infinite", opacity:0.1 }}
          width="72" height="72" viewBox="0 0 48 48" fill="none">
          <path d="M41.8527 18.2199L33.2024 11.0077L27.9877 15.3043L22.773 11.0077L29.7055 5.17647C30.1963 4.76726 30.7485 4.46922 31.362 4.28235C31.9754 4.09548 32.5889 4.00136 33.2024 4C33.8568 4 34.481 4.09412 35.0748 4.28235C35.6687 4.47059 36.1898 4.76863 36.638 5.17647L41.8527 9.5243C42.5889 10.104 43.1313 10.7778 43.4797 11.5458C43.8282 12.3137 44.0016 13.0892 44 13.8721C43.9983 14.6551 43.8249 15.4223 43.4797 16.1739C43.1345 16.9255 42.5922 17.6075 41.8527 18.2199ZM8.04908 27.6317C7.31288 27.0179 6.94478 26.2936 6.94478 25.4588C6.94478 24.624 7.31288 23.8991 8.04908 23.2839L14.0613 18.2199L19.2761 22.5678L13.2025 27.6317C12.5072 28.2455 11.6589 28.5524 10.6577 28.5524C9.65644 28.5524 8.78691 28.2455 8.04908 27.6317ZM5.41104 42.8235C4.96115 42.4143 4.6135 41.9628 4.3681 41.469C4.1227 40.9753 4 40.4549 4 39.9079C4 39.3609 4.11288 38.8412 4.33865 38.3488C4.56442 37.8564 4.92188 37.4043 5.41104 36.9923L22.773 22.5678L14.9816 16.0205C14.2454 15.4407 13.8773 14.7335 13.8773 13.8987C13.8773 13.0639 14.2454 12.339 14.9816 11.7238C15.6769 11.11 16.5358 10.8031 17.5583 10.8031C18.5808 10.8031 19.4601 11.11 20.1963 11.7238L27.9877 18.2199L31.4847 15.3043L38.3558 21.1355C38.8466 21.5448 39.092 22.0222 39.092 22.5678C39.092 23.1134 38.8466 23.5908 38.3558 24C37.865 24.4092 37.2924 24.6138 36.638 24.6138C35.9836 24.6138 35.411 24.4092 34.9202 24L12.3436 42.8235C11.8528 43.2327 11.3104 43.5314 10.7166 43.7197C10.1227 43.9079 9.51983 44.0013 8.90797 44C8.29611 43.9986 7.68262 43.8963 7.06748 43.6931C6.45235 43.4898 5.9002 43.2 5.41104 42.8235Z" fill="#1a1a2e"/>
        </svg>

        {/* 3. Fitness / Dumbbell — left bottom */}
        <svg style={{ position:"absolute", bottom:"8%", left:"5%", animation:"floatD 7s ease-in-out infinite", opacity:0.1 }}
          width="72" height="72" viewBox="0 0 48 48" fill="none">
          <path d="M41.14 29.72L44 26.86L41.14 24L34 31.14L16.86 14L24 6.86L21.14 4L18.28 6.86L15.42 4L11.14 8.28L8.28 5.42L5.42 8.28L8.28 11.14L4 15.42L6.86 18.28L4 21.14L6.86 24L14 16.86L31.14 34L24 41.14L26.86 44L29.72 41.14L32.58 44L36.86 39.72L39.72 42.58L42.58 39.72L39.72 36.86L44 32.58L41.14 29.72Z" fill="#1a1a2e"/>
        </svg>

        {/* RIGHT COLUMN — top / middle / bottom */}

        {/* 4. Music stage — right top */}
        <svg style={{ position:"absolute", top:"8%", right:"5%", animation:"floatA 6.5s ease-in-out infinite 0.8s", opacity:0.1 }}
          width="72" height="72" viewBox="0 0 35 35" fill="none">
          <path d="M27.9078 23.0262H7.6262L7.58936 3.06606C7.58936 1.07378 9.4683 0.00292969 11.5867 0.00292969C19.4157 0.00292969 27.9078 7.53623 27.9078 11.7574V23.0262Z" fill="#1a1a2e"/>
          <path d="M26.7159 13.7758C29.409 12.1073 27.6148 7.8214 22.7093 4.20043C17.8019 0.579462 11.6401 -1.0044 8.94877 0.664134C6.25377 2.33267 8.04798 6.61856 12.9554 10.2395C17.8627 13.8605 24.0227 15.4444 26.7159 13.7758Z" fill="#1a1a2e" fillOpacity="0.4"/>
          <path d="M3.68433 27.7283V23.8931C3.68433 23.1585 4.56854 22.5483 5.6738 22.5483H29.3264C30.4133 22.5483 31.3159 23.146 31.3159 23.8931V27.7283H3.68433Z" fill="#1a1a2e"/>
          <path d="M0 34.9999V29.3717C0 28.3631 1.23421 27.5288 2.72631 27.5288H32.2737C33.7658 27.5288 35 28.3631 35 29.3717V34.9999H0Z" fill="#1a1a2e"/>
        </svg>

        {/* 5. Paintbrush / Art — right middle */}
        <svg style={{ position:"absolute", top:"50%", right:"4%", transform:"translateY(-50%)", animation:"floatE 8s ease-in-out infinite", opacity:0.1 }}
          width="72" height="72" viewBox="0 0 48 48" fill="none">
          <path d="M10.8636 19.7747C10.9725 19.6915 11.0982 19.6288 11.2335 19.5901C11.3688 19.5515 11.5111 19.5377 11.6523 19.5495C11.7934 19.5613 11.9307 19.5985 12.0561 19.659C12.1816 19.7194 12.2929 19.802 12.3836 19.9018C12.4743 20.0017 12.5426 20.117 12.5848 20.2412C12.6269 20.3653 12.6419 20.4958 12.6291 20.6253C12.6162 20.7547 12.5756 20.8806 12.5097 20.9957C12.4438 21.1108 12.3538 21.2128 12.2449 21.296L12.2438 21.297L12.2417 21.299L12.2384 21.301L12.2276 21.3089L12.1953 21.3337L12.0841 21.4118C11.9899 21.4778 11.8578 21.5636 11.6881 21.6692C11.3481 21.8771 10.8571 22.1483 10.2376 22.4195C8.62732 23.1281 6.86522 23.499 5.07918 23.5054C4.79296 23.5054 4.51847 23.4011 4.31608 23.2154C4.1137 23.0298 4 22.778 4 22.5155C4 22.253 4.1137 22.0012 4.31608 21.8156C4.51847 21.63 4.79296 21.5257 5.07918 21.5257C6.54413 21.5193 7.98917 21.2139 9.30955 20.6319C9.71811 20.4537 10.1126 20.2497 10.4902 20.0211C10.6143 19.9458 10.7356 19.8666 10.8538 19.7836L10.8646 19.7737L10.8636 19.7747ZM14.3115 26.3086C14.5497 26.1629 14.7149 25.9364 14.771 25.6789C14.8271 25.4215 14.7693 25.1541 14.6105 24.9357C14.4516 24.7173 14.2047 24.5657 13.924 24.5142C13.6433 24.4628 13.3518 24.5158 13.1136 24.6615L13.1115 24.6635L13.0899 24.6754L12.9971 24.7298C12.9115 24.7793 12.7859 24.8476 12.6205 24.9347C12.1757 25.1677 11.7182 25.3798 11.2499 25.5702C10.0973 26.0403 8.63938 26.4749 7.23753 26.4749C6.95131 26.4749 6.67682 26.5792 6.47444 26.7648C6.27205 26.9504 6.15835 27.2022 6.15835 27.4647C6.15835 27.7272 6.27205 27.979 6.47444 28.1646C6.67682 28.3503 6.95131 28.4546 7.23753 28.4546C9.07429 28.4546 10.8528 27.8993 12.1273 27.3796C12.8199 27.0974 13.4915 26.7737 14.1378 26.4105L14.2608 26.3393L14.2953 26.3185L14.3061 26.3125L14.3115 26.3086ZM26.5 25.4355L14.9183 5.45463C14.8518 5.33985 14.8105 5.21418 14.797 5.08478C14.7834 4.95538 14.7977 4.8248 14.8392 4.70048C14.9228 4.44942 15.1118 4.23913 15.3646 4.11587C15.6173 3.99262 15.913 3.9665 16.1868 4.04326C16.3223 4.08126 16.4484 4.14338 16.5577 4.22607C16.6671 4.30876 16.7576 4.41039 16.8241 4.52517L28.4069 24.5061L30.0495 23.7043C30.5501 23.4602 31.0982 23.3089 31.6626 23.2592C32.2269 23.2094 32.7964 23.262 33.3386 23.4142C33.8807 23.5663 34.3849 23.8149 34.8223 24.1458C35.2597 24.4766 35.6218 24.8833 35.8878 25.3425L36.5871 26.5481L44 36.501L28.6228 44L23.7719 32.797L23.0737 31.5914C22.8075 31.1323 22.6425 30.6295 22.5881 30.112C22.5338 29.5944 22.5911 29.072 22.7569 28.5747C22.9226 28.0775 23.1935 27.615 23.5542 27.2138C23.9148 26.8126 24.358 26.4804 24.8586 26.2363L26.5 25.4355ZM25.8709 27.9844L31.0617 25.4534C31.312 25.3313 31.586 25.2556 31.8682 25.2307C32.1503 25.2058 32.4351 25.2321 32.7062 25.3081C32.9772 25.3841 33.2293 25.5083 33.4481 25.6737C33.6668 25.8391 33.8478 26.0424 33.9809 26.272L34.6802 27.4766L25.6766 31.8675L24.9784 30.6619C24.8453 30.4323 24.7628 30.181 24.7356 29.9222C24.7085 29.6634 24.7371 29.4022 24.82 29.1536C24.9029 28.905 25.0383 28.6737 25.2187 28.4731C25.399 28.2725 25.6206 28.1064 25.8709 27.9844ZM26.7666 34.351L29.7376 41.2136L31.7168 40.2485L29.3804 36.0763L31.3013 35.1716L33.6237 39.319L40.8563 35.7913L36.3152 29.6938L26.7666 34.351Z" fill="#1a1a2e"/>
        </svg>

        {/* 6. Music instrument — right bottom */}
        <svg style={{ position:"absolute", bottom:"8%", right:"5%", animation:"floatB 7s ease-in-out infinite 1.4s", opacity:0.1 }}
          width="72" height="72" viewBox="0 0 48 48" fill="none">
          <path d="M32.1211 12.6674V15.2562L40.8748 13.3587V10.4712M32.1711 20.3462L32.1523 18.3812L40.8748 19.7287V22.5412" fill="#1a1a2e" stroke="#1a1a2e" strokeLinejoin="round"/>
          <path d="M40.875 8.36865V10.8687L19.6625 15.8812V18.3812C19.6625 18.3812 40.6725 22.0937 40.8663 22.0937V24.5937L16.4988 20.2562C14.795 19.9537 13.3738 18.8624 13.3738 17.1312C13.3738 15.3999 14.8125 14.3974 16.4988 14.0062L40.875 8.36865Z" fill="#1a1a2e" stroke="#1a1a2e" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M17.45 37.1313H35.575C37.4787 37.1313 39.0125 35.5488 39.0125 33.5838C39.0125 31.6176 37.4787 30.0351 35.575 30.0351H12.1375C8.67495 30.0351 5.88745 27.1576 5.88745 23.5838C5.88745 20.0088 8.67495 17.1313 12.1375 17.1313H13.3075" stroke="#1a1a2e" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M13.3875 35.2563L17.1375 35.8813V38.3813L13.3875 39.0063V35.2563Z" fill="#1a1a2e" stroke="#1a1a2e" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M13.3675 34.0063V40.2563M12.7625 35.8813H10.2625M12.7625 38.3788H10.2625" stroke="#1a1a2e"/>
        </svg>

      </div>

      {/* App shell — full width on mobile, capped at 430px on larger screens */}
      <div
        className="relative w-full bg-[#f8f7f5] overflow-hidden"
        style={{ maxWidth: "min(100vw, 430px)", minHeight: "100dvh", boxShadow: "0 4px 40px rgba(0,0,0,0.10), 0 1px 8px rgba(0,0,0,0.06)" }}
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
