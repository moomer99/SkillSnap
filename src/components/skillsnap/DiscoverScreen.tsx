"use client";
// ─────────────────────────────────────────────
// SkillSnap — Discover / Map Screen
// Data: discoveryService.getNearbyUsers() via useDiscovery hook
// Integration: replace SVG map with Mapbox/Google
// ─────────────────────────────────────────────
import { MapPin, ChevronUp } from "lucide-react";
import type { Screen } from "@/types";
import { DISCOVERY_FILTER_CHIPS } from "@/mock-data/discovery";
import { useDiscovery } from "@/hooks/useDiscovery";
import { useAppState } from "@/state/AppState";
import SearchBar from "./shared/SearchBar";
import FilterChips from "./shared/FilterChips";
import UserPreviewCard from "./shared/UserPreviewCard";
import ConnectButton from "./shared/ConnectButton";

interface DiscoverScreenProps {
  onNavigate: (s: Screen) => void;
}

export default function DiscoverScreen({ onNavigate }: DiscoverScreenProps) {
  const { pins, activeFilter, setFilter } = useDiscovery();
  const { dispatch } = useAppState();

  function handleProfileClick(userId: string) {
    dispatch({ type: "SET_VIEWING_USER", userId });
    onNavigate("profile");
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f7f5]">
      {/* Sticky top: search + filters */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm px-4 pt-4 pb-3 border-b border-[#e8e4df]">
        <SearchBar className="mb-3" />
        <FilterChips
          chips={DISCOVERY_FILTER_CHIPS}
          active={activeFilter}
          onSelect={setFilter}
        />
      </div>

      {/* Map area — replace with real map SDK */}
      <div className="relative flex-1 overflow-hidden" style={{ minHeight: "60vh" }}>
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, #e8f4f8 0%, #d4e9f0 40%, #e8f0d4 100%)" }}>
          <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 390 500" preserveAspectRatio="xMidYMid slice">
            {[60, 120, 180, 240, 300, 360, 420].map(y => <line key={`h${y}`} x1="0" y1={y} x2="390" y2={y} stroke="#90aab8" strokeWidth="4" />)}
            {[55, 130, 200, 270, 335].map(x => <line key={`v${x}`} x1={x} y1="0" x2={x} y2="500" stroke="#90aab8" strokeWidth="4" />)}
            <line x1="0" y1="400" x2="390" y2="80" stroke="#90aab8" strokeWidth="5" />
            <rect x="60" y="60" width="65" height="55" fill="#cde0e8" rx="2" />
            <rect x="140" y="60" width="55" height="55" fill="#d8e8c8" rx="2" />
            <rect x="210" y="60" width="60" height="55" fill="#cde0e8" rx="2" />
            <rect x="285" y="60" width="45" height="55" fill="#d8e8c8" rx="2" />
            <rect x="60" y="125" width="65" height="50" fill="#d8e8c8" rx="2" />
            <rect x="140" y="125" width="55" height="50" fill="#cde0e8" rx="2" />
            <rect x="210" y="125" width="120" height="50" fill="#d8e8c8" rx="2" />
            <rect x="60" y="185" width="65" height="50" fill="#cde0e8" rx="2" />
            <rect x="140" y="185" width="120" height="50" fill="#d8e8c8" rx="2" />
            <rect x="275" y="185" width="55" height="50" fill="#cde0e8" rx="2" />
            <rect x="60" y="245" width="65" height="50" fill="#d8e8c8" rx="2" />
            <rect x="140" y="245" width="55" height="50" fill="#cde0e8" rx="2" />
            <rect x="210" y="245" width="60" height="50" fill="#d8e8c8" rx="2" />
            <rect x="285" y="245" width="45" height="50" fill="#cde0e8" rx="2" />
          </svg>
        </div>

        {/* Map pins */}
        {pins.map((pin) => (
          <button
            key={pin.id}
            className="absolute flex flex-col items-center"
            style={{ left: pin.x, top: pin.y, transform: "translate(-50%,-100%)" }}
            onClick={() => handleProfileClick(pin.userId)}
          >
            <div className="px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 text-white text-xs font-bold mb-0.5"
              style={{ background: pin.color }}>
              {pin.skill}
            </div>
            <div className="w-2 h-2 rotate-45 -mt-1" style={{ background: pin.color }} />
          </button>
        ))}

        {/* Current location dot */}
        <div className="absolute" style={{ left: "46%", top: "48%" }}>
          <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-md">
            <div className="w-3 h-3 rounded-full bg-[#6c47ff]" />
          </div>
          <div className="absolute inset-0 rounded-full bg-[#6c47ff]/20 scale-[2.5] animate-pulse" />
        </div>

        {/* Location label */}
        <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1 shadow-sm">
          <MapPin size={12} className="text-[#6c47ff]" />
          <span className="text-xs font-medium text-[#7a7570]">Liverpool, NSW</span>
        </div>

        {/* Zoom controls */}
        <div className="absolute right-3 top-14 flex flex-col bg-white rounded-xl shadow-sm overflow-hidden">
          <button className="w-9 h-9 flex items-center justify-center text-[#1a1a1a] border-b border-[#e8e4df] text-lg font-light">+</button>
          <button className="w-9 h-9 flex items-center justify-center text-[#1a1a1a] text-lg font-light">−</button>
        </div>
      </div>

      {/* Bottom preview tray */}
      <div className="bg-white rounded-t-3xl shadow-xl border-t border-[#e8e4df] px-4 pt-3 pb-24">
        <div className="w-10 h-1 bg-[#e8e4df] rounded-full mx-auto mb-4" />
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-[#1a1a1a]">{pins.length} skilled pros nearby</p>
          <button className="text-xs text-[#6c47ff] font-semibold">See all</button>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {pins.map((pin) => (
            <div key={pin.id} className="flex flex-col gap-1.5 flex-shrink-0">
              <UserPreviewCard pin={pin} onClick={() => handleProfileClick(pin.userId)} />
              <ConnectButton onClick={() => onNavigate("chat")} size="sm" />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center mt-3 gap-1 text-[#b0aaa5]">
          <ChevronUp size={14} />
          <span className="text-xs">Pull up for full list</span>
        </div>
      </div>
    </div>
  );
}
