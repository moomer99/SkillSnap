"use client";
// ─────────────────────────────────────────────
// SkillSnap — Bottom Navigation Bar
// FIX UX1: Added "Post" label under centre upload button
// ─────────────────────────────────────────────
import { Home, MapPin, Plus, MessageCircle, User } from "lucide-react";
import type { Screen } from "@/types";
import { useAppState } from "@/state/AppState";

interface BottomNavProps {
  active: Screen;
  onNavigate: (s: Screen) => void;
}

export default function BottomNav({ active, onNavigate }: BottomNavProps) {
  const { state, dispatch } = useAppState();

  function guardedNavigate(screen: Screen) {
    if (state.isGuest && (screen === "upload" || screen === "messages" || screen === "own-profile")) {
      dispatch({ type: "SHOW_AUTH_PROMPT" });
      return;
    }
    onNavigate(screen);
  }

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-[#e8e4df] flex items-center justify-around px-2 z-50"
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      <NavItem icon={<Home size={22} />} label="Home" active={active === "home"} onClick={() => guardedNavigate("home")} />
      <NavItem icon={<MapPin size={22} />} label="Discover" active={active === "discover"} onClick={() => guardedNavigate("discover")} />

      {/* Centre upload button — FIX: added "Post" label for consistency */}
      <button
        onClick={() => guardedNavigate("upload")}
        className="flex flex-col items-center justify-center gap-0.5 py-2 -mt-3"
      >
        <span
          className={`flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all ${
            active === "upload" ? "bg-[#5b3dd8] scale-110" : "bg-[#6c47ff]"
          }`}
        >
          <Plus size={24} color="white" strokeWidth={2.5} />
        </span>
        <span
          className={`text-[10px] font-medium ${
            active === "upload" ? "text-[#6c47ff]" : "text-[#b0aaa5]"
          }`}
        >
          Post
        </span>
      </button>

      <NavItem icon={<MessageCircle size={22} />} label="Messages" active={active === "messages"} onClick={() => guardedNavigate("messages")} />
      <NavItem icon={<User size={22} />} label="Profile" active={active === "own-profile"} onClick={() => guardedNavigate("own-profile")} />
    </nav>
  );
}

function NavItem({ icon, label, active, onClick }: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-0.5 py-2 px-3 min-w-[52px]">
      <span className={active ? "text-[#6c47ff]" : "text-[#b0aaa5]"}>{icon}</span>
      <span className={`text-[10px] font-medium ${active ? "text-[#6c47ff]" : "text-[#b0aaa5]"}`}>{label}</span>
    </button>
  );
}
