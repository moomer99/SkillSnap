"use client";
// ─────────────────────────────────────────────
// SkillSnap — Discover
//
// Desktop: sticky filter sidebar beside a full-width map panel + results.
// Mobile: filter pills at the top, map panel filling the width, results below.
//
// The map panel is a placeholder. No map provider is configured — MAP_CONFIG
// .PROVIDER is empty, there is no SDK dependency and no key — and discovery
// pins carry no real coordinates (discoveryService recycles fixed mock x/y
// positions). Drawing pins on a decorative map would be inventing locations,
// so the slot states what it needs instead. Everything around it is the final
// layout: dropping a real map into <MapPanel> is the only remaining step.
// ─────────────────────────────────────────────
import { useEffect, useMemo, useState } from "react";
import { MapPin, ChevronRight, Search, X, SlidersHorizontal } from "lucide-react";
import type { DiscoveryPin, Screen } from "@/types";
import { DISCOVERY_FILTER_CHIPS, type DiscoveryFilter } from "@/mock-data/discovery";
import { useDiscovery } from "@/hooks/useDiscovery";
import { useAppState } from "@/state/AppState";
import { useMessages } from "@/hooks/useMessages";
import SearchBar from "./shared/SearchBar";
import FilterChips from "./shared/FilterChips";
import ConnectButton from "./shared/ConnectButton";

interface DiscoverScreenProps {
  onNavigate: (s: Screen) => void;
}

// "All" / "Nearby" / "Top Rated" are sorts; the rest are skills
const SORT_FILTERS = DISCOVERY_FILTER_CHIPS.slice(0, 3) as readonly DiscoveryFilter[];
const SKILL_FILTERS = DISCOVERY_FILTER_CHIPS.slice(3) as readonly DiscoveryFilter[];

export default function DiscoverScreen({ onNavigate }: DiscoverScreenProps) {
  const { pins, loading, activeFilter, setFilter } = useDiscovery();
  const { state, dispatch } = useAppState();
  const { connectTo, connecting } = useMessages();
  const [skillQuery, setSkillQuery] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    document.title = "Discover Local Skilled Pros | SkillSnap";
  }, []);

  function requireFullAuth(action: () => void) {
    if (!state.isAuthenticated) { dispatch({ type: "SHOW_AUTH_PROMPT" }); return; }
    action();
  }

  function handleProfileClick(userId: string) {
    dispatch({ type: "SET_VIEWING_USER", userId });
    onNavigate("client-profile");
  }

  function choose(filter: DiscoveryFilter) {
    setFilter(filter);
    setMobileFiltersOpen(false);
  }

  const visibleSkills = useMemo(() => {
    const q = skillQuery.trim().toLowerCase();
    if (!q) return SKILL_FILTERS;
    return SKILL_FILTERS.filter((s) => s.toLowerCase().includes(q));
  }, [skillQuery]);

  const filteredLabel = activeFilter === "All" ? "All skills" : activeFilter;

  const filterPanel = (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider mb-2.5" style={{ color: "var(--ss-text-dim)" }}>
          Sort
        </p>
        <div className="flex flex-wrap gap-2">
          {SORT_FILTERS.map((chip) => (
            <FilterPill key={chip} label={chip} active={activeFilter === chip} onClick={() => choose(chip)} />
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider mb-2.5" style={{ color: "var(--ss-text-dim)" }}>
          Skill
        </p>
        <div
          className="flex items-center gap-2 rounded-xl px-3 h-9 mb-3"
          style={{ background: "var(--ss-surface-2)", border: "1px solid var(--ss-line)" }}
        >
          <Search size={14} style={{ color: "var(--ss-text-dim)" }} />
          <input
            value={skillQuery}
            onChange={(e) => setSkillQuery(e.target.value)}
            placeholder="Filter skills"
            className="flex-1 bg-transparent outline-none text-[13px] text-white placeholder:text-[rgba(255,255,255,0.35)]"
          />
          {skillQuery && (
            <button onClick={() => setSkillQuery("")} aria-label="Clear">
              <X size={14} style={{ color: "var(--ss-text-dim)" }} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 lg:max-h-[420px] lg:overflow-y-auto no-scrollbar">
          {visibleSkills.map((chip) => (
            <FilterPill key={chip} label={chip} active={activeFilter === chip} onClick={() => choose(chip)} />
          ))}
          {visibleSkills.length === 0 && (
            <p className="text-[12px]" style={{ color: "var(--ss-text-dim)" }}>No skills match “{skillQuery}”</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--ss-bg)" }}>

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-40 px-4 lg:px-6 pt-4 pb-3"
        style={{ background: "rgba(13,10,26,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--ss-line)" }}
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <h1 className="text-xl font-bold text-white">Discover</h1>
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "var(--ss-surface-2)", color: "var(--ss-text-muted)" }}
            >
              {pins.length} {state.currentUser?.location ? "nearby" : "pros"}
            </span>
            {/* Filters live in the sidebar from lg up */}
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full"
              style={{ background: "var(--ss-purple-soft)", border: "1px solid var(--ss-purple-border)", color: "var(--ss-purple-light)" }}
            >
              <SlidersHorizontal size={12} />
              Filters
            </button>
          </div>
        </div>

        <div className="max-w-[600px]">
          <SearchBar onFocus={() => onNavigate("search")} />
        </div>

        {/* Filter pills — phones and tablets */}
        <div className="lg:hidden mt-3">
          <FilterChips
            chips={DISCOVERY_FILTER_CHIPS}
            active={activeFilter}
            onSelect={setFilter}
          />
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 px-4 lg:px-6 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-6 lg:gap-8">

          {/* Sidebar filters — desktop only */}
          <aside className="hidden lg:block">
            <div className="sticky top-[132px]">{filterPanel}</div>
          </aside>

          <div className="min-w-0">
            <MapPanel count={pins.length} />

            <div className="flex items-end justify-between mt-6 mb-3">
              <div>
                <p className="text-[15px] font-bold text-white">{filteredLabel}</p>
                <p className="text-[12px] mt-0.5" style={{ color: "var(--ss-text-muted)" }}>
                  {pins.length} skilled pro{pins.length !== 1 ? "s" : ""}
                  {state.currentUser?.location ? " near you" : ""}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded-2xl h-[230px] animate-pulse"
                    style={{ background: "var(--ss-surface)", border: "1px solid var(--ss-line)" }}
                  />
                ))}
              </div>
            ) : pins.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
                <div
                  className="w-16 h-16 rounded-3xl mb-4 flex items-center justify-center"
                  style={{ background: "var(--ss-purple-soft)", border: "1px solid var(--ss-purple-border)" }}
                >
                  <MapPin size={28} style={{ color: "var(--ss-purple-light)" }} />
                </div>
                <p className="font-bold text-white text-base mb-2">No pros found</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ss-text-muted)" }}>
                  Try a different filter or check back soon as more skilled workers join.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {pins.map((pin) => (
                    <ProCard
                      key={pin.id}
                      pin={pin}
                      connecting={connecting === pin.userId}
                      onProfile={() => handleProfileClick(pin.userId)}
                      onConnect={() => requireFullAuth(() => connectTo(pin.userId))}
                    />
                  ))}
                </div>

                {!state.currentUser?.location && (
                  <div
                    className="mt-6 rounded-2xl px-4 py-4 flex items-center gap-3"
                    style={{ background: "var(--ss-surface)", border: "1px solid var(--ss-purple-border)" }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
                    >
                      <MapPin size={18} color="white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-white">Set your location</p>
                      <p className="text-[12px] leading-snug" style={{ color: "var(--ss-text-muted)" }}>
                        See pros sorted by distance from you
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigate("edit-profile")}
                      className="flex items-center gap-1 text-[12px] font-bold text-white px-3 py-1.5 rounded-full flex-shrink-0"
                      style={{ background: "var(--ss-purple)" }}
                    >
                      Set
                      <ChevronRight size={12} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter sheet */}
      {mobileFiltersOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[120] flex items-end bg-black/60"
          onClick={(e) => { if (e.target === e.currentTarget) setMobileFiltersOpen(false); }}
        >
          <div
            className="w-full max-h-[80vh] overflow-y-auto rounded-t-3xl p-5 pb-10"
            style={{ background: "var(--ss-surface)", border: "1px solid var(--ss-line)" }}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "var(--ss-line-strong)" }} />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[17px] font-bold text-white">Filters</h2>
              <button onClick={() => setMobileFiltersOpen(false)} aria-label="Close" className="p-1 text-white">
                <X size={20} />
              </button>
            </div>
            {filterPanel}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 h-8 rounded-full text-[12px] font-semibold transition-colors"
      style={
        active
          ? { background: "var(--ss-purple)", color: "white" }
          : { background: "var(--ss-surface-2)", color: "var(--ss-text-muted)", border: "1px solid var(--ss-line)" }
      }
    >
      {label}
    </button>
  );
}

/**
 * Map slot. Renders the frame the real map will live in and says plainly that
 * a provider still has to be wired up — see the note at the top of this file.
 */
function MapPanel({ count }: { count: number }) {
  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden flex items-center justify-center text-center px-6"
      style={{
        height: "clamp(220px, 34vh, 380px)",
        background: "linear-gradient(150deg, #16122a, #1c1733)",
        border: "1px dashed var(--ss-purple-border)",
      }}
    >
      {/* Faint grid so the slot reads as a map frame rather than an empty box */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.35] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{ width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(108,71,255,0.22) 0%, transparent 68%)" }}
      />
      <div className="relative flex flex-col items-center">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
          style={{ background: "var(--ss-purple-soft)", border: "1px solid var(--ss-purple-border)" }}
        >
          <MapPin size={22} style={{ color: "var(--ss-purple-light)" }} />
        </div>
        <p className="text-[15px] font-bold text-white">Map view</p>
        <p className="text-[13px] leading-relaxed mt-1.5 max-w-[420px]" style={{ color: "var(--ss-text-muted)" }}>
          Plotting {count} pro{count !== 1 ? "s" : ""} on a map needs a map provider — no Mapbox or
          Google Maps key is configured yet. Browse the list below in the meantime.
        </p>
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

// ── Pro card ───────────────────────────────────────────────────────
// discoveryService hydrates pins with profile fields beyond DiscoveryPin, and
// which ones are present depends on the query — hence the optional extras.
type DiscoveryPinLike = DiscoveryPin & {
  avatarUrl?: string | null;
  avatarInitial?: string | null;
  avatarGradient?: string | null;
  location?: string | null;
  distanceKm?: number;
  happyPct?: number;
};

function ProCard({
  pin, connecting, onProfile, onConnect,
}: {
  pin: DiscoveryPinLike;
  connecting: boolean;
  onProfile: () => void;
  onConnect: () => void;
}) {
  const initial = pin.name?.charAt(0) ?? "?";

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col transition-transform hover:-translate-y-0.5"
      style={{ background: "var(--ss-surface)", border: "1px solid var(--ss-line)" }}
    >
      <button
        onClick={onProfile}
        className="relative flex flex-col items-center pt-5 pb-3 px-3 transition-opacity hover:opacity-90"
      >
        {pin.avatarUrl ? (
          <img
            src={pin.avatarUrl}
            alt={pin.name}
            className="w-14 h-14 rounded-full object-cover mb-2"
          />
        ) : (
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl mb-2"
            style={{ background: pin.avatarGradient ?? pin.color ?? "#6c47ff" }}
          >
            {pin.avatarInitial ?? initial}
          </div>
        )}

        <p className="text-[13px] font-bold text-white leading-tight text-center truncate w-full">
          {pin.name}
        </p>

        {pin.skill && pin.skill !== "Other" && (
          <span
            className="mt-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full text-white"
            style={{ background: skillColor(pin.skill) }}
          >
            {pin.skill}
          </span>
        )}

        {pin.location && (
          <p className="text-[11px] mt-1 flex items-center gap-1 justify-center" style={{ color: "var(--ss-text-dim)" }}>
            <MapPin size={10} />
            {pin.location}
          </p>
        )}

        {pin.distanceKm !== undefined && (
          <span className="text-[10px] font-medium mt-1.5" style={{ color: "var(--ss-text-muted)" }}>
            {pin.distanceKm < 1 ? "<1" : pin.distanceKm} km away
          </span>
        )}
      </button>

      {(pin.jobsDone !== undefined || pin.happyPct !== undefined) && (
        <div className="flex items-center justify-around px-2 py-2" style={{ borderTop: "1px solid var(--ss-line)" }}>
          {pin.jobsDone !== undefined && (
            <>
              <div className="flex flex-col items-center">
                <span className="text-[12px] font-extrabold text-white">{pin.jobsDone}</span>
                <span className="text-[9px] font-medium" style={{ color: "var(--ss-text-dim)" }}>Jobs</span>
              </div>
              {pin.happyPct !== undefined && <div className="w-px h-5" style={{ background: "var(--ss-line)" }} />}
            </>
          )}
          {pin.happyPct !== undefined && (
            <div className="flex flex-col items-center">
              <span className="text-[12px] font-extrabold text-[#4ade80]">{pin.happyPct}%</span>
              <span className="text-[9px] font-medium" style={{ color: "var(--ss-text-dim)" }}>Happy</span>
            </div>
          )}
        </div>
      )}

      <div className="px-3 pb-3 mt-auto pt-2">
        <ConnectButton onClick={onConnect} fullWidth size="sm" loading={connecting} />
      </div>
    </div>
  );
}
