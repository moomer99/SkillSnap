"use client";
// ─────────────────────────────────────────────
// SkillSnap — Left navigation rail (tablet + desktop)
//
// Desktop (≥1024px): 240px, icon + label.
// Tablet  (768–1023px): 60px, icons only with hover tooltips.
// Below 768px it is hidden entirely — phones use BottomNav.
// ─────────────────────────────────────────────
import { Home, Compass, MessageCircle, User, Settings, LogOut, LogIn } from "lucide-react";
import type { Screen } from "@/types";
import SkillSnapLogo from "./shared/SkillSnapLogo";

interface AppSidebarProps {
  active: Screen;
  isAuthenticated: boolean;
  unreadCount: number;
  onNavigate: (s: Screen) => void;
  onLogOut: () => void;
}

const NAV_ITEMS: { icon: React.ElementType; label: string; screen: Screen }[] = [
  { icon: Home,          label: "Feed",     screen: "home" },
  { icon: Compass,       label: "Discover", screen: "discover" },
  { icon: MessageCircle, label: "Messages", screen: "messages" },
  { icon: User,          label: "Profile",  screen: "own-profile" },
  { icon: Settings,      label: "Settings", screen: "settings" },
];

export default function AppSidebar({
  active, isAuthenticated, unreadCount, onNavigate, onLogOut,
}: AppSidebarProps) {
  return (
    <aside
      className="hidden md:flex fixed left-0 top-0 bottom-0 z-40 flex-col w-[60px] lg:w-[240px] py-5 px-2 lg:px-4"
      style={{ background: "var(--ss-surface)", borderRight: "1px solid var(--ss-line)" }}
    >
      {/* Logo — wordmark on desktop, mark only on the collapsed tablet rail */}
      <button
        onClick={() => onNavigate("home")}
        aria-label="SkillSnap home"
        className="flex items-center justify-center lg:justify-start h-11 mb-6 lg:px-2"
      >
        <span className="hidden lg:block"><SkillSnapLogo variant="full" size="sm" dark /></span>
        <span className="lg:hidden"><SkillSnapLogo variant="icon" size="sm" dark /></span>
      </button>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ icon: Icon, label, screen }) => {
          const isActive = active === screen;
          return (
            <button
              key={screen}
              onClick={() => onNavigate(screen)}
              title={label}
              aria-current={isActive ? "page" : undefined}
              className="ss-rail-btn group relative flex items-center justify-center lg:justify-start gap-3 h-12 rounded-2xl lg:px-3 transition-colors"
              style={{
                background: isActive ? "var(--ss-purple-soft)" : "transparent",
                color: isActive ? "var(--ss-purple-light)" : "var(--ss-text-muted)",
              }}
            >
              <span className="relative flex items-center justify-center flex-shrink-0">
                <Icon size={22} strokeWidth={isActive ? 2.3 : 1.8} />
                {screen === "messages" && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[17px] h-[17px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </span>
              <span className="hidden lg:block text-[15px] font-semibold">{label}</span>

              {/* Tooltip — collapsed rail only */}
              <span
                className="lg:hidden pointer-events-none absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-[12px] font-semibold whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100 z-50"
                style={{ background: "var(--ss-surface-3)", color: "white", border: "1px solid var(--ss-line)" }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto">
        <button
          onClick={isAuthenticated ? onLogOut : () => onNavigate("auth")}
          title={isAuthenticated ? "Log out" : "Sign in"}
          className="group relative flex items-center justify-center lg:justify-start gap-3 h-12 w-full rounded-2xl lg:px-3 transition-colors hover:bg-white/[0.05]"
          style={{ color: isAuthenticated ? "#f87171" : "var(--ss-purple-light)" }}
        >
          {isAuthenticated ? <LogOut size={20} /> : <LogIn size={20} />}
          <span className="hidden lg:block text-[15px] font-semibold">
            {isAuthenticated ? "Log out" : "Sign in"}
          </span>
          <span
            className="lg:hidden pointer-events-none absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-[12px] font-semibold whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100 z-50"
            style={{ background: "var(--ss-surface-3)", color: "white", border: "1px solid var(--ss-line)" }}
          >
            {isAuthenticated ? "Log out" : "Sign in"}
          </span>
        </button>
      </div>
    </aside>
  );
}
