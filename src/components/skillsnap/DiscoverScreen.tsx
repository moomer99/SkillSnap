"use client";

import { ChevronRight, SlidersHorizontal, X } from "lucide-react";
import type { Screen } from "@/types";
import { DISCOVERY_FILTER_CHIPS } from "@/mock-data/discovery";
import { useDiscovery } from "@/hooks/useDiscovery";
import { useAppState } from "@/state/AppState";
import { useMessages } from "@/hooks/useMessages";
import SearchBar from "./shared/SearchBar";
import FilterChips from "./shared/FilterChips";
import ConnectButton from "./shared/ConnectButton";

interface DiscoverScreenProps {
  onNavigate: (s: Screen) => void;
}

export default function DiscoverScreen({ onNavigate }: DiscoverScreenProps) {
  const { pins, activeFilter, setFilter } = useDiscovery();
  const { state, dispatch } = useAppState();
  const { connectTo, connecting } = useMessages();

  function requireAuth(action: () => void) {
    if (!state.isAuthenticated) { dispatch({ type: "SHOW_AUTH_PROMPT" }); return; }
    action();
  }

  function handleProfileClick(userId: string) {
    dispatch({ type: "SET_VIEWING_USER", userId });
    onNavigate("client-profile");
  }

  // Group pins by skill for the section headers
  const filteredLabel = activeFilter === "All" ? "All Skills" : activeFilter;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f7f5]">

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm px-4 pt-4 pb-3 border-b border-[#e8e4df]">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-[#1a1a1a]">Discover</h1>
          <span className="text-xs font-semibold text-[#7a7570] bg-[#f0eeea] px-2.5 py-1 rounded-full">
            {pins.length} {state.currentUser?.location ? "nearby" : "pros"}
          </span>
        </div>
        <SearchBar className="mb-3" onFocus={() => onNavigate("search")} />
        <FilterChips
          chips={DISCOVERY_FILTER_CHIPS}
          active={activeFilter}
          onSelect={setFilter}
        />
      </div>

      {/* ── Main scrollable content ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-28">


        {/* ── Section label ── */}
        <div className="flex items-center justify-between px-4 mt-5 mb-3">
          <div>
            <p className="text-[13px] font-bold text-[#1a1a1a]">{filteredLabel}</p>
            <p className="text-[11px] text-[#7a7570] mt-0.5">
              {pins.length} skilled pro{pins.length !== 1 ? "s" : ""} near you
            </p>
          </div>
          <button className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6c47ff] bg-[#ede9fe] px-3 py-1.5 rounded-full active:bg-[#ddd6fe] transition-colors">
            <SlidersHorizontal size={11} />
            Filter
          </button>
        </div>

        {/* ── Empty state ── */}
        {pins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div
              className="w-16 h-16 rounded-3xl mb-4 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #ede9fe, #f5f3ff)" }}
            >
              <MapPin size={28} className="text-[#6c47ff]" />
            </div>
            <p className="font-bold text-[#1a1a1a] text-base mb-2">No pros found</p>
            <p className="text-[#7a7570] text-sm leading-relaxed">
              Try a different filter or check back soon as more skilled workers join.
            </p>
          </div>
        ) : (
          <>
            {/* ── 2-column card grid ── */}
            <div className="px-4 grid grid-cols-2 gap-3">
              {pins.map((pin) => (
                <ProCard
                  key={pin.id}
                  pin={pin}
                  connecting={connecting === pin.userId}
                  onProfile={() => handleProfileClick(pin.userId)}
                  onConnect={() => requireAuth(() => connectTo(pin.userId))}
                />
              ))}
            </div>

            {/* ── Location prompt if no location set ── */}
            {!state.currentUser?.location && (
              <div
                className="mx-4 mt-5 rounded-2xl px-4 py-4 flex items-center gap-3"
                style={{
                  background: "linear-gradient(135deg, #ede9fe, #f5f3ff)",
                  border: "1.5px solid rgba(108,71,255,0.18)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
                >
                  <MapPin size={18} color="white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-[#1a1a1a]">Set your location</p>
                  <p className="text-[11px] text-[#7a7570] leading-snug">
                    See pros sorted by distance from you
                  </p>
                </div>
                <button
                  onClick={() => onNavigate("edit-profile")}
                  className="flex items-center gap-1 text-[11px] font-bold text-white px-3 py-1.5 rounded-full flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
                >
                  Set
                  <ChevronRight size={11} />
                </button>
              </div>
            )}

            {/* ── Mini map teaser card ── */}
            <div
              className="mx-4 mt-4 rounded-2xl overflow-hidden relative"
              style={{ height: 120 }}
            >
              {/* Blurred map bg */}
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(135deg, #e8f4f8 0%, #d4e9f0 40%, #e8f0d4 100%)",
                  filter: "blur(1.5px)",
                }}
              >
                <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 390 120" preserveAspectRatio="xMidYMid slice">
                  {[30, 60, 90].map(y => <line key={`h${y}`} x1="0" y1={y} x2="390" y2={y} stroke="#90aab8" strokeWidth="3" />)}
                  {[55, 130, 200, 270, 335].map(x => <line key={`v${x}`} x1={x} y1="0" x2={x} y2="120" stroke="#90aab8" strokeWidth="3" />)}
                  <rect x="60" y="15" width="55" height="30" fill="#cde0e8" rx="2" />
                  <rect x="130" y="15" width="45" height="30" fill="#d8e8c8" rx="2" />
                  <rect x="200" y="15" width="60" height="30" fill="#cde0e8" rx="2" />
                  <rect x="60" y="60" width="55" height="30" fill="#d8e8c8" rx="2" />
                  <rect x="130" y="60" width="100" height="30" fill="#cde0e8" rx="2" />
                  <rect x="250" y="60" width="80" height="30" fill="#d8e8c8" rx="2" />
                </svg>
              </div>

              {/* Decorative pins */}
              {pins.slice(0, 4).map((pin, i) => {
                const positions = [
                  { left: "20%", top: "25%" },
                  { left: "45%", top: "40%" },
                  { left: "65%", top: "20%" },
                  { left: "80%", top: "55%" },
                ];
                const pos = positions[i] || positions[0];
                return (
                  <div
                    key={pin.id}
                    className="absolute flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-[9px] font-bold shadow-sm opacity-70"
                    style={{ ...pos, background: pin.color, transform: "translate(-50%, -50%)" }}
                  >
                    <MapPin size={8} color="white" />
                    {pin.skill && pin.skill !== "Other" ? pin.skill : ""}
                  </div>
                );
              })}

              {/* Overlay */}
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(4px)" }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #6c47ff, #a78bfa)" }}
                  >
                    <Compass size={16} color="white" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[#1a1a1a]">Map view coming soon</p>
                    <p className="text-[11px] text-[#7a7570]">Discover pros on a live local map</p>
                  </div>
                  <span className="ml-1 flex items-center gap-1 bg-[#ede9fe] rounded-full px-2.5 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6c47ff] animate-pulse" />
                    <span className="text-[10px] font-bold text-[#6c47ff]">Soon</span>
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function skillColor(skill: string): string {
  const colors: Record<string, string> = {
    Barber: "#6c47ff",
    Driver: "#0ea5e9",
    Tiler: "#f59e0b",
    Cleaner: "#10b981",
    Plumber: "#3b82f6",
    Electrician: "#f97316",
    Carpenter: "#84cc16",
    "Makeup Artist": "#ec4899",
    "Nail Tech": "#f43f5e",
    Chef: "#ef4444",
    Mover: "#8b5cf6",
    Mechanic: "#64748b",
    "Fitness / PT": "#06b6d4",
    "Homemade Kooking & Baking": "#d97706",
  };
  return colors[skill] ?? "#6c47ff";
}

// ── Pro card — 2-column grid tile ─────────────────────────────────
// Pin shape (from useDiscovery / mock-data/discovery):
//   id, userId, name, skill, color, x, y — confirmed from original DiscoverScreen
// Optional extras (graceful fallback if not present): distanceKm, jobsDone, happyPct
function ProCard({
  pin, connecting, onProfile, onConnect,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pin: any;
  connecting: boolean;
  onProfile: () => void;
  onConnect: () => void;
}) {
  const initial = (pin.name as string)?.charAt(0) ?? "?";

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden border border-[#e8e4df] flex flex-col"
      style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
    >
      {/* Colour header with avatar */}
      <button
        onClick={onProfile}
        className="relative flex flex-col items-center pt-5 pb-3 px-3 active:opacity-80 transition-opacity"
      >
        {/* Avatar */}
        {pin.avatarUrl ? (
          <img
            src={pin.avatarUrl}
            alt={pin.name}
            className="w-14 h-14 rounded-full object-cover mb-2 shadow-sm"
          />
        ) : (
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl mb-2 shadow-sm"
            style={{ background: pin.avatarGradient ?? pin.color ?? "#6c47ff" }}
          >
            {pin.avatarInitial ?? initial}
          </div>
        )}

        {/* Name */}
        <p className="text-[13px] font-bold text-[#1a1a1a] leading-tight text-center truncate w-full">
          {pin.name}
        </p>

        {/* Skill chip */}
        {pin.skill && pin.skill !== "Other" && (
          <span
            className="mt-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full text-white"
            style={{ background: skillColor(pin.skill) }}
          >
            {pin.skill}
          </span>
        )}

        {/* Location */}
        {pin.location && (
          <p className="text-[11px] text-[#b0aaa5] mt-1 flex items-center gap-1 justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
            {pin.location}
          </p>
        )}

        {/* Distance pill — only if available */}
        {pin.distanceKm !== undefined && (
          <div className="flex items-center gap-0.5 mt-1.5">
            <MapPin size={9} className="text-[#b0aaa5]" />
            <span className="text-[10px] text-[#7a7570] font-medium">
              {pin.distanceKm < 1 ? "<1" : pin.distanceKm} km away
            </span>
          </div>
        )}
      </button>

      {/* Stats row — graceful if not available */}
      {(pin.jobsDone !== undefined || pin.happyPct !== undefined) && (
        <div className="flex items-center justify-around px-2 py-2 border-t border-[#f0eeea]">
          {pin.jobsDone !== undefined && (
            <>
              <div className="flex flex-col items-center">
                <span className="text-[12px] font-extrabold text-[#1a1a1a]">{pin.jobsDone}</span>
                <span className="text-[9px] text-[#b0aaa5] font-medium">Jobs</span>
              </div>
              {pin.happyPct !== undefined && <div className="w-px h-5 bg-[#f0eeea]" />}
            </>
          )}
          {pin.happyPct !== undefined && (
            <div className="flex flex-col items-center">
              <span className="text-[12px] font-extrabold text-[#4ade80]">{pin.happyPct}%</span>
              <span className="text-[9px] text-[#b0aaa5] font-medium">Happy</span>
            </div>
          )}
        </div>
      )}

      {/* Connect button */}
      <div className="px-3 pb-3 mt-auto pt-2">
        <ConnectButton
          onClick={onConnect}
          fullWidth
          size="sm"
          loading={connecting}
        />
      </div>
    </div>
  );
}
