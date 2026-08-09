"use client";
// ─────────────────────────────────────────────
// SkillSnap — Discover map (Leaflet + CARTO dark tiles)
//
// No API key: CARTO's dark basemap is served straight from their CDN over
// OpenStreetMap data. Loaded client-side only, since Leaflet touches `window`
// and `document` as soon as a map is constructed.
// ─────────────────────────────────────────────
import { useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MappableDiscoveryPin } from "@/types";
import ConnectButton from "./shared/ConnectButton";

interface DiscoverMapProps {
  pins: MappableDiscoveryPin[];
  connectingUserId: string | null;
  onConnect: (userId: string) => void;
  onProfile: (userId: string) => void;
}

// Liverpool NSW — the middle of SkillSnap's patch
const INITIAL_CENTER: [number, number] = [-33.9175, 150.9215];
const INITIAL_ZOOM = 11;

const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

/**
 * Builds the pin as a real DOM node rather than an HTML string. Names, avatar
 * URLs and gradients come from user-editable profile fields, so they are set
 * as properties (textContent / src / style.background) where the browser
 * treats them as data — an innerHTML template would make them injectable.
 */
function avatarPin(pin: MappableDiscoveryPin): L.DivIcon {
  const ring = document.createElement("div");
  Object.assign(ring.style, {
    width: "42px",
    height: "42px",
    padding: "2px",
    borderRadius: "9999px",
    background: "#6c47ff",
    boxShadow: "0 2px 10px rgba(0,0,0,0.45)",
    boxSizing: "border-box",
  } satisfies Partial<CSSStyleDeclaration>);

  if (pin.avatarUrl) {
    const img = document.createElement("img");
    img.src = pin.avatarUrl;
    img.alt = "";
    Object.assign(img.style, {
      width: "100%",
      height: "100%",
      borderRadius: "9999px",
      objectFit: "cover",
      display: "block",
    } satisfies Partial<CSSStyleDeclaration>);
    ring.appendChild(img);
  } else {
    const initial = document.createElement("span");
    initial.textContent = pin.avatarInitial ?? pin.name?.charAt(0) ?? "?";
    Object.assign(initial.style, {
      width: "100%",
      height: "100%",
      borderRadius: "9999px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#ffffff",
      fontWeight: "700",
      fontSize: "14px",
    } satisfies Partial<CSSStyleDeclaration>);
    // Assigned separately so an invalid value from the DB is dropped by the
    // CSSOM instead of being concatenated into a style string
    initial.style.background = pin.avatarGradient ?? pin.color ?? "#6c47ff";
    ring.appendChild(initial);
  }

  return L.divIcon({
    html: ring,
    className: "ss-map-pin",
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -22],
  });
}

export default function DiscoverMap({ pins, connectingUserId, onConnect, onProfile }: DiscoverMapProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const icons = useMemo(() => new Map(pins.map((p) => [p.id, avatarPin(p)])), [pins]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl"
      style={{ height: "clamp(260px, 42vh, 460px)", border: "1px solid var(--ss-line)" }}
    >
      <MapContainer
        center={INITIAL_CENTER}
        zoom={INITIAL_ZOOM}
        scrollWheelZoom={false}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />

        {pins.map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.lat, pin.lng]}
            icon={icons.get(pin.id)}
            eventHandlers={{
              popupopen: () => setOpenId(pin.id),
              popupclose: () => setOpenId((id) => (id === pin.id ? null : id)),
            }}
          >
            <Popup className="ss-map-popup" closeButton={false}>
              <div className="w-[190px]">
                <button onClick={() => onProfile(pin.userId)} className="block text-left w-full">
                  <p className="text-[14px] font-bold text-white truncate">{pin.name}</p>
                  <p className="text-[12px] mt-0.5 truncate" style={{ color: "var(--ss-purple-light)" }}>
                    {pin.skill}
                  </p>
                </button>
                <p className="text-[12px] mt-1.5 mb-2.5" style={{ color: "var(--ss-text-muted)" }}>
                  <strong className="text-white font-bold">{pin.jobsDone}</strong>{" "}
                  {pin.jobsDone === 1 ? "job" : "jobs"} done
                </p>
                <ConnectButton
                  onClick={() => onConnect(pin.userId)}
                  fullWidth
                  size="sm"
                  loading={connectingUserId === pin.userId && openId === pin.id}
                />
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
