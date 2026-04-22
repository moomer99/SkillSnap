"use client";
import { Search, MapPin, Star, ChevronUp } from "lucide-react";
import JobsTooltip from "./JobsTooltip";

type Screen = "home" | "discover" | "upload" | "messages" | "profile" | "auth" | "chat" | "client-profile";

interface DiscoverScreenProps {
  onNavigate: (s: Screen) => void;
}

const filters = ["All", "Nearby", "Top Rated", "Barber", "Cleaning", "Fitness", "Tiler", "Beauty"];

const mapPins = [
  { id: 1, skill: "Barber", x: "22%", y: "28%", color: "#6c47ff", rating: 4.9, name: "Marcus T.", jobs: 47 },
  { id: 2, skill: "Makeup", x: "55%", y: "18%", color: "#f5576c", rating: 5.0, name: "Priya K.", jobs: 83 },
  { id: 3, skill: "Tiler", x: "70%", y: "42%", color: "#4facfe", rating: 4.7, name: "Jake R.", jobs: 29 },
  { id: 4, skill: "PT", x: "38%", y: "52%", color: "#00b894", rating: 4.8, name: "Sam W.", jobs: 61 },
  { id: 5, skill: "Cleaner", x: "18%", y: "60%", color: "#fdcb6e", rating: 4.6, name: "Ana M.", jobs: 38 },
  { id: 6, skill: "Barber", x: "62%", y: "68%", color: "#6c47ff", rating: 4.5, name: "Leo P.", jobs: 12 },
];

export default function DiscoverScreen({ onNavigate }: DiscoverScreenProps) {
  return (
    <div className="flex flex-col min-h-screen bg-[#f8f7f5]">
      {/* Top search + filters */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm px-4 pt-4 pb-3 border-b border-[#e8e4df]">
        {/* Search bar */}
        <div className="flex items-center gap-2.5 bg-[#f0eeea] rounded-2xl px-4 h-11 mb-3">
          <Search size={17} className="text-[#b0aaa5] flex-shrink-0" />
          <span className="text-[#b0aaa5] text-sm">Search skills, people, or location</span>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {filters.map((f, i) => (
            <button
              key={f}
              className={`flex-shrink-0 px-3.5 h-8 rounded-full text-xs font-semibold transition-all ${
                i === 0
                  ? "bg-[#6c47ff] text-white"
                  : "bg-[#f0eeea] text-[#7a7570]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Map area */}
      <div className="relative flex-1 overflow-hidden" style={{ minHeight: "60vh" }}>
        {/* Map placeholder with grid */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, #e8f4f8 0%, #d4e9f0 40%, #e8f0d4 100%)" }}>
          {/* Street grid lines */}
          <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 390 500" preserveAspectRatio="xMidYMid slice">
            {/* Horizontal streets */}
            {[60, 120, 180, 240, 300, 360, 420].map(y => (
              <line key={`h${y}`} x1="0" y1={y} x2="390" y2={y} stroke="#90aab8" strokeWidth="4" />
            ))}
            {/* Vertical streets */}
            {[55, 130, 200, 270, 335].map(x => (
              <line key={`v${x}`} x1={x} y1="0" x2={x} y2="500" stroke="#90aab8" strokeWidth="4" />
            ))}
            {/* Diagonal avenue */}
            <line x1="0" y1="400" x2="390" y2="80" stroke="#90aab8" strokeWidth="5" />
            {/* Blocks fill */}
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
        {mapPins.map((pin) => (
          <MapPinIcon key={pin.id} pin={pin} onClick={() => {}} />
        ))}

        {/* Current location dot */}
        <div className="absolute" style={{ left: "46%", top: "48%" }}>
          <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-md">
            <div className="w-3 h-3 rounded-full bg-[#6c47ff]" />
          </div>
          <div className="absolute inset-0 rounded-full bg-[#6c47ff]/20 scale-[2.5] animate-pulse" />
        </div>

        {/* Map attribution pill */}
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

      {/* Bottom preview card */}
      <div className="bg-white rounded-t-3xl shadow-xl border-t border-[#e8e4df] px-4 pt-3 pb-24">
        {/* Handle */}
        <div className="w-10 h-1 bg-[#e8e4df] rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-[#1a1a1a]">6 skilled pros nearby</p>
          <button className="text-xs text-[#6c47ff] font-semibold">See all</button>
        </div>

        {/* Preview cards row */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {mapPins.map((pin) => (
            <button
              key={pin.id}
              onClick={() => {}}
              className="flex-shrink-0 bg-[#f8f7f5] rounded-2xl p-3 flex flex-col items-center gap-1.5 w-[110px] border border-[#e8e4df]"
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-white text-base font-bold"
                style={{ background: pin.color }}
              >
                {pin.name.charAt(0)}
              </div>
              <p className="text-[11px] font-semibold text-[#1a1a1a] text-center leading-tight">{pin.name}</p>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                style={{ background: pin.color }}
              >
                {pin.skill}
              </span>
              <div className="flex items-center gap-0.5">
                <Star size={10} fill="#f59e0b" color="#f59e0b" />
                <span className="text-[10px] text-[#7a7570] font-medium">{pin.rating}</span>
              </div>
              <div className="w-full pt-0.5 border-t border-[#e8e4df]">
                <JobsTooltip count={pin.jobs} size="xs" />
              </div>
            </button>
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

function MapPinIcon({ pin, onClick }: { pin: (typeof mapPins)[0]; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute flex flex-col items-center"
      style={{ left: pin.x, top: pin.y, transform: "translate(-50%,-100%)" }}
    >
      <div
        className="px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 text-white text-xs font-bold mb-0.5"
        style={{ background: pin.color }}
      >
        {pin.skill}
      </div>
      {/* Pin tail */}
      <div className="w-2 h-2 rotate-45 -mt-1" style={{ background: pin.color }} />
    </button>
  );
}
