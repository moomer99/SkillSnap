// ─────────────────────────────────────────────
// SkillSnap — Discovery / Map Service (Supabase)
// Pins feed the Leaflet map in DiscoverMap.tsx.
// ─────────────────────────────────────────────
import { getSupabase } from "@/lib/supabase";
import { mapProfile } from "./authService";
import type { DiscoveryPin, DiscoveryResults, MappableDiscoveryPin, SkillCategory } from "@/types";
import type { DiscoveryFilter } from "@/constants/skillLookup";
import { MOCK_DISCOVERY_RESULTS } from "@/mock-data/discovery";

export interface LocationCoords {
  lat: number;
  lng: number;
}

// Pin positions come from profiles.lat_public / lng_public — the coarse,
// anon-readable coordinate pair. (The precise lat/lng columns are granted to
// authenticated roles only, so they are not usable for logged-out discovery.)
//
// Queries return every skilled pro. Those with coordinates are split out as
// `mappablePros` for the map; the rest still come back in `allPros` so they
// remain discoverable in the results grid. A pin is never given a stand-in
// position to get it onto the map.
const PIN_COLORS: Record<string, string> = {
  Barber: "#6c47ff",
  "Makeup Artist": "#f5576c",
  Tiler: "#4facfe",
  Cleaning: "#43e97b",
  "Fitness / PT": "#fa709a",
  Plumber: "#a18cd1",
  default: "#6c47ff",
};

function pinColor(skill: string): string {
  return PIN_COLORS[skill] ?? PIN_COLORS.default;
}

/** Reads a finite number, or null for null/undefined/NaN. */
function coord(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function profileToPin(row: Record<string, unknown>): DiscoveryPin {
  const lat = coord(row.lat_public);
  const lng = coord(row.lng_public);

  return {
    id: row.id as string,
    userId: row.id as string,
    name: row.display_name as string,
    skill: (row.skill as SkillCategory) ?? "Other",
    color: pinColor(row.skill as string ?? ""),
    rating: 5,
    jobsDone: Number(row.jobs_done ?? 0),
    avatarUrl: row.avatar_url as string ?? null,
    avatarInitial: row.avatar_initial as string ?? (row.display_name as string)?.charAt(0) ?? '?',
    avatarGradient: row.avatar_gradient as string ?? null,
    location: (row.location as string) ?? null,
    // Omitted rather than nulled, so `lat`/`lng` are either a real number or absent
    ...(lat !== null && lng !== null ? { lat, lng } : {}),
  };
}

/** Narrows to pins that carry a real position. */
export function isMappable(pin: DiscoveryPin): pin is MappableDiscoveryPin {
  return typeof pin.lat === "number" && typeof pin.lng === "number";
}

function rowsToResults(rows: unknown[]): DiscoveryResults {
  const allPros = rows.map((row) => profileToPin(row as Record<string, unknown>));
  return { allPros, mappablePros: allPros.filter(isMappable) };
}

// `profiles` has column-level grants — the anon role may not read `*` — so
// every query lists its columns explicitly.
const PIN_COLUMNS =
  "id, display_name, skill, jobs_done, is_client, location, " +
  "avatar_url, avatar_initial, avatar_gradient, lat_public, lng_public";

// Every skilled pro is listed, so the cap needs headroom over the roster size
// rather than the 12 that used to silently truncate the grid.
const PIN_LIMIT = 60;

async function queryProfiles(filter: DiscoveryFilter, limit = PIN_LIMIT): Promise<DiscoveryResults> {
  const sb = getSupabase();
  let query = sb
    .from("profiles")
    .select(PIN_COLUMNS)
    .eq("role", "pro")
    .not("skill", "is", null)
    .neq("skill", "")
    .limit(limit);

  if (filter !== "All" && filter !== "Nearby" && filter !== "Top Rated") {
    query = query.ilike("skill", `%${filter}%`);
  } else if (filter === "Top Rated") {
    query = query.order("jobs_done", { ascending: false });
  } else {
    query = query.order("jobs_done", { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;
  // Empty result is valid — callers decide whether to show the mock fallback
  if (!data?.length) return { allPros: [], mappablePros: [] };
  return rowsToResults(data);
}

export const discoveryService = {
  async getNearbyUsers(_coords: LocationCoords, _radiusKm = 10): Promise<DiscoveryResults> {
    return queryProfiles("All");
  },

  async filterUsers(filter: DiscoveryFilter): Promise<DiscoveryResults> {
    return queryProfiles(filter);
  },

  async searchBySkillAndLocation(skill: SkillCategory | "", location: string): Promise<DiscoveryResults> {
    const sb = getSupabase();
    let query = sb
      .from("profiles")
      .select(PIN_COLUMNS)
      .eq("role", "pro")
      .not("skill", "is", null)
      .neq("skill", "")
      .limit(20);
    if (skill) query = query.eq("skill", skill);
    if (location) query = query.ilike("location", `%${location}%`);
    const { data } = await query;
    if (!data?.length) return MOCK_DISCOVERY_RESULTS;
    return rowsToResults(data);
  },

  async getUserLocation(): Promise<LocationCoords | null> {
    return { lat: -33.9214, lng: 150.9224 };
  },
};

export { mapProfile };
