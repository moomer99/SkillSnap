"use client";
import { Home, MapPin, Plus, MessageCircle, User } from "lucide-react";
import type { Screen } from "@/types";
import { useAppState } from "@/state/AppState";
import SkillSnapLogo from "./shared/SkillSnapLogo";

interface LeftSidebarProps {
  onNavigate: (s: Screen) => void;
}

const NAV_ITEMS: { screen: Screen; label: string; icon: React.ReactNode }[] = [
  { screen: "home",        label: "Home",     icon: <Home size={20} /> },
  { screen: "discover",    label: "Discover", icon: <MapPin size={20} /> },
  { screen: "messages",    label: "Messages", icon: <MessageCircle size={20} /> },
  { screen: "own-profile", label: "Profile",  icon: <User size={20} /> },
];

export default function LeftSidebar({ onNavigate }: LeftSidebarProps) {
  const { state, dispatch } = useAppState();
  const { screen } = state;

  function guardedNavigate(s: Screen) {
    if (state.isGuest && (s === "upload" || s === "messages" || s === "own-profile")) {
      dispatch({ type: "SHOW_AUTH_PROMPT" });
      return;
    }
    onNavigate(s);
  }

  return (
    <div className="hidden lg:flex flex-col w-[240px] sticky top-0 h-screen border-r border-[#e8e4df] bg-white overflow-y-auto">
      <div className="px-5 pt-6 pb-4">
        <SkillSnapLogo size="sm" />
      </div>

      <nav className="flex flex-col gap-1 px-3 flex-1">
        {NAV_ITEMS.map(({ screen: s, label, icon }) => {
          const active = screen === s;
          return (
            <button
              key={s}
              onClick={() => guardedNavigate(s)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left w-full ${
                active
                  ? "bg-[#f0ebff] text-[#6c47ff]"
                  : "text-[#4a4540] hover:bg-[#f5f3ff] hover:text-[#6c47ff]"
              }`}
            >
              <span className={active ? "text-[#6c47ff]" : "text-[#7a7570]"}>{icon}</span>
              {label}
            </button>
          );
        })}

        {/* Post — purple filled button */}
        <button
          onClick={() => guardedNavigate("upload")}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all text-left w-full mt-1 ${
            screen === "upload"
              ? "bg-[#5b3dd8] text-white"
              : "bg-[#6c47ff] text-white hover:bg-[#5b3dd8]"
          }`}
        >
          <Plus size={20} />
          Post
        </button>
      </nav>
    </div>
  );
}
