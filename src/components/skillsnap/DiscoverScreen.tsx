"use client";
import { MapPin, ChevronUp, Compass } from "lucide-react";
import type { Screen } from "@/types";
import { DISCOVERY_FILTER_CHIPS } from "@/mock-data/discovery";
import { useDiscovery } from "@/hooks/useDiscovery";
import { useAppState } from "@/state/AppState";
import { useMessages } from "@/hooks/useMessages";
import SearchBar from "./shared/SearchBar";
import FilterChips from "./shared/FilterChips";
import UserPreviewCard from "./shared/UserPreviewCard";
import ConnectButton from "./shared/ConnectButton";

interface DiscoverScreenProps {
  onNavigate: (s: Screen) => void;
}

export default function DiscoverScreen({ onNavigate }: DiscoverScreenProps) {
  const { pins, activeFilter, setFilter } = useDiscovery();
  const { state, dispatch } = useAppState();
  const { connectTo, connecting } = useMessages();

  function requireAuth(action: () => void) {
    if (state.isGuest) { dispatch({ type: "SHOW_AUTH_PROMPT" }); return; }
    action();
  }

  function handleProfileClick(userId: string) {
    dispatch({ type: "SET_VIEWING_USER", userId });
    onNavigate("client-profile");
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

      {/* Map area with Coming Soon overlay */}
      <div className="relative flex-1 overflow-hidden" style={{ minHeight: "60vh" }}>
        {/* Blurred map background */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, #e8f4f8 0%, #d4e9f0 40%, #e8f0d4 100%)", filter: "blur(2px)" }}
        >
          <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 390 500" preserveAspectRatio="xMidYMid slice">
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

        {/* Faint pins (decorative) */}
        {pins.map((pin) => (
          <div
            key={pin.id}
            className="absolute flex flex-col items-center opacity-20 pointer-events-none"
            style={{ left: pin.x, top: pin.y, transform: "translate(-50%,-100%)" }}
          >
            <div className="px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 text-white text-xs font-bold mb-0.5"
              style={{ background: pin.color }}>
              {pin.skill}
            </div>
            <div className="w-2 h-2 rotate-45 -mt-1" style={{ background: pin.color }} />
          </div>
        ))}

        {/* Coming Soon overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-8">
          <div
            className="w-full rounded-3xl px-6 py-8 flex flex-col items-center text-center shadow-xl"
            style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(16px)" }}
          >
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4"
              style={{ background: "linear-gradient(135deg, #6c47ff, #a78bfa)" }}
            >
              <Compass size={32} className="text-white" />
            </div>
            <h2 className="font-bold text-[#1a1a1a] text-xl mb-2">Map Discovery</h2>
            <p className="text-sm text-[#7a7570] leading-relaxed mb-4">
              Find skilled pros near you on a live map. Real-time location-based discovery is coming soon!
            </p>
            <div className="flex items-center gap-2 bg-[#ede9fe] rounded-full px-4 py-2">
              <span className="w-2 h-2 rounded-full bg-[#6c47ff] animate-pulse" />
              <span className="text-xs font-bold text-[#6c47ff]">Coming Soon</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom preview tray — still shows real user cards */}
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
              <ConnectButton
                onClick={() => requireAuth(() => connectTo(pin.userId))}
                size="sm"
                loading={connecting}
              />
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
