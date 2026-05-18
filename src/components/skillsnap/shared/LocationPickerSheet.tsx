"use client";
// ─────────────────────────────────────────────
// LocationPickerSheet
// Bottom sheet for setting user location via GPS or manual entry.
// Used in HomeFeed (prompt) and EditProfileScreen.
// ─────────────────────────────────────────────
import { useState, useRef } from "react";
import { MapPin, Navigation, X, Search, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import type { LocationStatus } from "@/hooks/useLocation";

interface LocationPickerSheetProps {
  onClose: () => void;
  onRequestGPS: () => void;
  onManualEntry: (query: string) => Promise<boolean>;
  status: LocationStatus;
  error: string | null;
  currentLabel?: string;
}

const QUICK_SUBURBS = [
  "Sydney CBD", "Parramatta", "Liverpool", "Blacktown",
  "Penrith", "Campbelltown", "Chatswood", "Bondi",
];

export default function LocationPickerSheet({
  onClose,
  onRequestGPS,
  onManualEntry,
  status,
  error,
  currentLabel,
}: LocationPickerSheetProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isLoading = status === "requesting" || status === "resolving";
  const isSet = status === "set";

  async function handleSearch() {
    if (!query.trim() || isLoading) return;
    const ok = await onManualEntry(query.trim());
    if (ok) setTimeout(onClose, 800);
  }

  function handleGPS() {
    onRequestGPS();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full rounded-t-3xl overflow-hidden"
        style={{ background: "#fff", boxShadow: "0 -4px 40px rgba(0,0,0,0.12)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#e8e4df]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <div>
            <h2 className="font-bold text-base text-[#1a1a1a]">Set Your Location</h2>
            <p className="text-xs text-[#7a7570] mt-0.5">
              {currentLabel ? `Currently: ${currentLabel}` : "Find skilled pros near you"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f0eeea] flex items-center justify-center text-[#7a7570] active:opacity-70"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-5 pb-8">
          {/* GPS Button */}
          <button
            onClick={handleGPS}
            disabled={isLoading}
            className="w-full flex items-center gap-3 rounded-2xl border-2 p-4 mb-4 transition-all active:scale-[0.98] disabled:opacity-60"
            style={{
              borderColor: "#6c47ff",
              background: "linear-gradient(135deg, rgba(108,71,255,0.06), rgba(139,106,245,0.04))",
            }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
            >
              {isLoading && status === "requesting" ? (
                <Loader2 size={20} color="white" className="animate-spin" />
              ) : (
                <Navigation size={20} color="white" />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-sm text-[#1a1a1a]">Use My GPS Location</p>
              <p className="text-xs text-[#7a7570] mt-0.5">Automatically detect your suburb</p>
            </div>
            {isSet && status === "set" && (
              <CheckCircle size={18} className="text-[#6c47ff] flex-shrink-0" />
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[#e8e4df]" />
            <span className="text-[11px] font-semibold text-[#b0aaa5] uppercase tracking-wider">or enter manually</span>
            <div className="flex-1 h-px bg-[#e8e4df]" />
          </div>

          {/* Quick picks */}
          <div>
            <p className="text-[10px] font-bold text-[#b0aaa5] uppercase tracking-wider mb-2.5">Quick picks</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_SUBURBS.map((suburb) => (
                <button
                  key={suburb}
                  onClick={async () => {
                    setQuery(suburb);
                    const ok = await onManualEntry(suburb);
                    if (ok) setTimeout(onClose, 800);
                  }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full border border-[#e8e4df] bg-white text-[#7a7570] active:border-[#6c47ff] active:text-[#6c47ff] transition-colors"
                >
                  {suburb}
                </button>
              ))}
            </div>
          </div>

          {/* Manual search */}
          <div
            className="flex items-center gap-2 rounded-2xl border px-4 h-12 mb-3 transition-colors"
            style={{ borderColor: "#e8e4df", background: "#fafaf9" }}
            onClick={() => inputRef.current?.focus()}
          >
            <Search size={16} className="text-[#b0aaa5] flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              placeholder="Suburb, postcode or address…"
              className="flex-1 bg-transparent text-sm text-[#1a1a1a] placeholder-[#b0aaa5] outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-[#b0aaa5] active:text-[#7a7570]">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Search button */}
          <div style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}>
          <button
            onClick={handleSearch}
            disabled={!query.trim() || isLoading}
            className="w-full h-11 rounded-2xl font-bold text-sm text-white mb-4 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
          >
            {status === "resolving" ? (
              <><Loader2 size={16} className="animate-spin" /> Searching…</>
            ) : (
              <><MapPin size={15} /> Confirm Location</>
            )}
          </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-3 py-2.5 mb-4">
              <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Success */}
          {isSet && (
            <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-100 px-3 py-2.5 mb-4">
              <CheckCircle size={15} className="text-green-500 flex-shrink-0" />
              <p className="text-xs text-green-700 font-semibold">Location set! Feed updating…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
