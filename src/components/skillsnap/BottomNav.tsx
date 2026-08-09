"use client";
// ─────────────────────────────────────────────
// SkillSnap — Bottom Navigation Bar
// Browse-only: Feed, Discover, Messages, Profile. Posting lives in the app.
// ─────────────────────────────────────────────
import { Home, MapPin, MessageCircle, User } from "lucide-react";
import type { Screen } from "@/types";
import { useAppState } from "@/state/AppState";
import { getAuthSupabase } from "@/lib/supabase";

interface BottomNavProps {
  active: Screen;
  onNavigate: (s: Screen) => void;
  onScrollToTop?: () => void;
}

export default function BottomNav({ active, onNavigate, onScrollToTop }: BottomNavProps) {
  const { state, dispatch } = useAppState();

  function guardedNavigate(screen: Screen) {
    if (!state.isAuthenticated && (screen === "messages" || screen === "own-profile")) {
      dispatch({ type: "SHOW_AUTH_PROMPT" });
      return;
    }
    if (screen === "messages") {
      dispatch({ type: "CLEAR_UNREAD_NOTIF_COUNT" });
      const userId = state.currentUser?.id;
      if (userId) {
        getAuthSupabase()
          .from("notifications")
          .update({ read: true })
          .eq("user_id", userId)
          .eq("read", false)
          .then(() => {});
      }
    }
    onNavigate(screen);
  }

  return (
    <nav
      // max-w matches the tablet content column in page.tsx so the two line up
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] bg-white border-t border-[#e8e4df] flex items-center justify-around px-2 z-50 lg:hidden"
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      <NavItem icon={<Home size={22} />} label="Home" active={active === "home"} onClick={() => {
        if (active === "home") { onScrollToTop?.(); } else { guardedNavigate("home"); }
      }} />
      <NavItem icon={<MapPin size={22} />} label="Discover" active={active === "discover"} onClick={() => guardedNavigate("discover")} />

      <NavItem
        icon={
          <span className="relative inline-flex">
            <MessageCircle size={22} />
{(() => { const n = state.threads.reduce((s, t) => s + (t.unreadCount ?? 0), 0); return n > 0 ? (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {n > 9 ? "9+" : n}
              </span>
            ) : null; })()}
          </span>
        }
        label="Messages"
        active={active === "messages"}
        onClick={() => guardedNavigate("messages")}
      />
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
