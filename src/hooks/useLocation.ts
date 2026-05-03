"use client";
// ─────────────────────────────────────────────
// useLocation — manages the viewer's current location.
// Supports GPS detection and manual suburb/address entry.
// Persists to localStorage so it survives page reloads.
// ─────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";

export interface UserLocation {
  lat: number;
  lng: number;
  label: string; // suburb name shown in UI
}

const STORAGE_KEY = "skillsnap_location";
const DEFAULT_RADIUS_KM = 15;
const STORAGE_RADIUS_KEY = "skillsnap_radius";

// Free geocoding via Nominatim (OpenStreetMap) — no API key needed
async function geocodeAddress(query: string): Promise<UserLocation | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=au`;
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.length) return null;
    const { lat, lon, display_name } = data[0];
    // Extract suburb from the full address (first part before first comma)
    const suburb = display_name.split(",")[0].trim();
    return { lat: parseFloat(lat), lng: parseFloat(lon), label: suburb };
  } catch {
    return null;
  }
}

// Reverse geocode lat/lng → suburb label
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    if (!res.ok) return "My Location";
    const data = await res.json();
    const addr = data.address ?? {};
    return addr.suburb ?? addr.town ?? addr.city ?? addr.county ?? "My Location";
  } catch {
    return "My Location";
  }
}

// Haversine distance between two coords (km)
export function distanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export type LocationStatus = "idle" | "requesting" | "resolving" | "set" | "error";

export function useLocation() {
  const [location, setLocationState] = useState<UserLocation | null>(null);
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [radiusKm, setRadiusKmState] = useState<number>(DEFAULT_RADIUS_KM);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setLocationState(JSON.parse(stored));
        setStatus("set");
      }
      const storedRadius = localStorage.getItem(STORAGE_RADIUS_KEY);
      if (storedRadius) setRadiusKmState(parseInt(storedRadius, 10));
    } catch {}
  }, []);

  function persist(loc: UserLocation) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(loc)); } catch {}
    setLocationState(loc);
    setStatus("set");
    setError(null);
  }

  // Request GPS from browser
  const requestGPS = useCallback(async () => {
    if (!navigator.geolocation) {
      setError("GPS not supported on this device");
      setStatus("error");
      return;
    }
    setStatus("requesting");
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setStatus("resolving");
        const { latitude: lat, longitude: lng } = pos.coords;
        const label = await reverseGeocode(lat, lng);
        persist({ lat, lng, label });
      },
      (err) => {
        const msg =
          err.code === 1
            ? "Location permission denied. Please enter manually."
            : "Couldn't get GPS location. Please enter manually.";
        setError(msg);
        setStatus("error");
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  // Set location from a manual address / suburb string
  const setManualLocation = useCallback(async (query: string): Promise<boolean> => {
    if (!query.trim()) return false;
    setStatus("resolving");
    setError(null);
    const result = await geocodeAddress(query);
    if (!result) {
      setError("Location not found. Try a suburb or postcode.");
      setStatus("error");
      return false;
    }
    persist(result);
    return true;
  }, []);

  const clearLocation = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setLocationState(null);
    setStatus("idle");
    setError(null);
  }, []);

  const setRadiusKm = useCallback((r: number) => {
    setRadiusKmState(r);
    try { localStorage.setItem(STORAGE_RADIUS_KEY, String(r)); } catch {}
  }, []);

  return {
    location,
    status,
    error,
    radiusKm,
    requestGPS,
    setManualLocation,
    clearLocation,
    setRadiusKm,
  };
}
