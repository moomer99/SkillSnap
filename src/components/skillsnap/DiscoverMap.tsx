"use client";
// ─────────────────────────────────────────────
// SkillSnap — Discover map (Mapbox)
//
// Renders the pros that have real coordinates. Loaded only when
// NEXT_PUBLIC_MAPBOX_TOKEN is set — DiscoverScreen shows a placeholder
// otherwise — and only on the client, since mapbox-gl touches `window` at
// import time.
// ─────────────────────────────────────────────
import { useMemo, useState } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { MappableDiscoveryPin } from "@/types";
import ConnectButton from "./shared/ConnectButton";

interface DiscoverMapProps {
  pins: MappableDiscoveryPin[];
  connectingUserId: string | null;
  onConnect: (userId: string) => void;
  onProfile: (userId: string) => void;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAP_STYLE = "mapbox://styles/mapbox/dark-v11";

// Western Sydney — the fallback view when there is nothing to fit to
const FALLBACK_CENTER = { longitude: 150.9224, latitude: -33.9214, zoom: 10 };

type ViewState =
  | { longitude: number; latitude: number; zoom: number }
  | { bounds: [number, number, number, number]; fitBoundsOptions: { padding: number; maxZoom: number } };

/** Frames the map on the pins: a fitted box for several, a fixed zoom for one. */
function initialView(pins: MappableDiscoveryPin[]): ViewState {
  if (pins.length === 0) return FALLBACK_CENTER;
  if (pins.length === 1) {
    return { longitude: pins[0].lng, latitude: pins[0].lat, zoom: 12 };
  }
  const lngs = pins.map((p) => p.lng);
  const lats = pins.map((p) => p.lat);
  return {
    bounds: [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)],
    fitBoundsOptions: { padding: 64, maxZoom: 13 },
  };
}

export default function DiscoverMap({ pins, connectingUserId, onConnect, onProfile }: DiscoverMapProps) {
  const [active, setActive] = useState<MappableDiscoveryPin | null>(null);
  const view = useMemo(() => initialView(pins), [pins]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl"
      style={{ height: "clamp(260px, 42vh, 460px)", border: "1px solid var(--ss-line)" }}
    >
      <Map
        key={pins.length}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={view as React.ComponentProps<typeof Map>["initialViewState"]}
        mapStyle={MAP_STYLE}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
        onClick={() => setActive(null)}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {pins.map((pin) => (
          <Marker
            key={pin.id}
            longitude={pin.lng}
            latitude={pin.lat}
            anchor="center"
            onClick={(e) => {
              // Keep the map's own click handler from immediately closing the popup
              e.originalEvent.stopPropagation();
              setActive(pin);
            }}
          >
            <button
              aria-label={`${pin.name} — ${pin.skill}`}
              className="block rounded-full transition-transform hover:scale-110"
              style={{
                width: 42,
                height: 42,
                padding: 2,
                background: "#6c47ff",
                boxShadow: "0 2px 10px rgba(0,0,0,0.45)",
              }}
            >
              {pin.avatarUrl ? (
                <img
                  src={pin.avatarUrl}
                  alt=""
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span
                  className="w-full h-full rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: pin.avatarGradient ?? pin.color ?? "#6c47ff" }}
                >
                  {pin.avatarInitial ?? pin.name?.charAt(0) ?? "?"}
                </span>
              )}
            </button>
          </Marker>
        ))}

        {active && (
          <Popup
            longitude={active.lng}
            latitude={active.lat}
            anchor="bottom"
            offset={26}
            closeButton={false}
            closeOnClick={false}
            onClose={() => setActive(null)}
            maxWidth="240px"
            className="ss-map-popup"
          >
            <div className="w-[200px] p-1">
              <button onClick={() => onProfile(active.userId)} className="block text-left w-full">
                <p className="text-[14px] font-bold text-white truncate">{active.name}</p>
                <p className="text-[12px] mt-0.5 truncate" style={{ color: "var(--ss-purple-light)" }}>
                  {active.skill}
                </p>
              </button>
              <p className="text-[12px] mt-1.5 mb-2.5" style={{ color: "var(--ss-text-muted)" }}>
                <strong className="text-white font-bold">{active.jobsDone}</strong>{" "}
                {active.jobsDone === 1 ? "job" : "jobs"} done
              </p>
              <ConnectButton
                onClick={() => onConnect(active.userId)}
                fullWidth
                size="sm"
                loading={connectingUserId === active.userId}
              />
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
