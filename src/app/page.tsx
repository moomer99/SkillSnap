"use client";
import { useState } from "react";
import AuthScreen from "@/components/skillsnap/AuthScreen";
import HomeFeed from "@/components/skillsnap/HomeFeed";
import DiscoverScreen from "@/components/skillsnap/DiscoverScreen";
import ProfileScreen from "@/components/skillsnap/ProfileScreen";
import UploadScreen from "@/components/skillsnap/UploadScreen";
import MessagesScreen from "@/components/skillsnap/MessagesScreen";
import ChatScreen from "@/components/skillsnap/ChatScreen";
import BottomNav from "@/components/skillsnap/BottomNav";

type Screen =
  | "home"
  | "discover"
  | "upload"
  | "messages"
  | "profile"
  | "auth"
  | "chat"
  | "client-profile";

const NAV_SCREENS: Screen[] = ["home", "discover", "upload", "messages", "profile"];

export default function SkillSnapApp() {
  const [screen, setScreen] = useState<Screen>("auth");

  const showBottomNav = NAV_SCREENS.includes(screen);

  function navigate(s: Screen) {
    setScreen(s);
  }

  return (
    <div
      className="relative w-full min-h-screen flex justify-center bg-[#f0eeea]"
      style={{ fontFamily: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* Phone shell on desktop */}
      <div
        className="relative w-full bg-[#f8f7f5] overflow-hidden"
        style={{
          maxWidth: 390,
          minHeight: "100dvh",
          boxShadow: "0 0 80px rgba(0,0,0,0.12)",
        }}
      >
        {/* Screen content */}
        {screen === "auth" && <AuthScreen onNavigate={navigate} />}
        {screen === "home" && <HomeFeed onNavigate={navigate} />}
        {screen === "discover" && <DiscoverScreen onNavigate={navigate} />}
        {screen === "profile" && <ProfileScreen onNavigate={navigate} />}
        {screen === "client-profile" && <ProfileScreen isClient onNavigate={navigate} />}
        {screen === "upload" && <UploadScreen onNavigate={navigate} />}
        {screen === "messages" && <MessagesScreen onNavigate={navigate} />}
        {screen === "chat" && <ChatScreen onNavigate={navigate} />}

        {/* Bottom Nav */}
        {showBottomNav && (
          <BottomNav active={screen} onNavigate={navigate} />
        )}
      </div>

      {/* Screen switcher — desktop helper bar */}
      <div className="hidden sm:flex fixed top-4 left-1/2 -translate-x-1/2 z-50 items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg border border-[#e8e4df]"
        style={{ maxWidth: "calc(100vw - 2rem)" }}>
        {(
          [
            ["auth", "Auth"],
            ["home", "Feed"],
            ["discover", "Discover"],
            ["profile", "Profile"],
            ["client-profile", "Client"],
            ["upload", "Upload"],
            ["messages", "Messages"],
            ["chat", "Chat"],
          ] as [Screen, string][]
        ).map(([s, label]) => (
          <button
            key={s}
            onClick={() => navigate(s)}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
              screen === s
                ? "bg-[#6c47ff] text-white"
                : "text-[#7a7570] hover:text-[#1a1a1a]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
