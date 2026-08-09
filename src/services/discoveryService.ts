// ─────────────────────────────────────────────
// SkillSnap — Discovery / Map Service (Supabase)
// Map integration: replace SVG with Mapbox/Google
// when NEXT_PUBLIC_MAP_KEY is set.
// ─────────────────────────────────────────────
import { getSupabase } from "@/lib/supabase";
import { mapProfile } from "./authService";
import type { DiscoveryPin, SkillCategory } from "@/types";
import type { DiscoveryFilter } from "@/mock-data/discovery";
import { MOCK_DISCOVERY_PINS } from "@/mock-data/discovery";

export interface LocationCoords {
  lat: number;
  lng: number;
}

// Pin positions come from profiles.lat_public / lng_public — the coarse,
// anon-readable coordinate pair. (The precise lat/lng columns are granted to
// authenticated roles only, so they are not usable for logged-out discovery.)
// A profile without both values has no known position and is left out of the
// results entirely; it is never given a stand-in position.
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

/** Returns null when the profile has no usable coordinates — see note above. */
function profileToPin(row: Record<string, unknown>): DiscoveryPin | null {
  const lat = coord(row.lat_public);
  const lng = coord(row.lng_public);
  if (lat === null || lng === null) return null;

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
    lat,
    lng,
  };
}

/** Maps rows to pins, dropping any profile that has no coordinates. */
function rowsToPins(rows: unknown[]): DiscoveryPin[] {
  return rows
    .map((row) => profileToPin(row as Record<string, unknown>))
    .filter((pin): pin is DiscoveryPin => pin !== null);
}

// `profiles` has column-level grants — the anon role may not read `*` — so
// every query lists its columns explicitly.
const PIN_COLUMNS =
  "id, display_name, skill, jobs_done, is_client, location, " +
  "avatar_url, avatar_initial, avatar_gradient, lat_public, lng_public";

async function queryProfiles(filter: DiscoveryFilter, limit = 12): Promise<DiscoveryPin[]> {
  const sb = getSupabase();
  let query = sb
    .from("profiles")
    .select(PIN_COLUMNS)
    .eq("role", "pro")
    .not("skill", "is", null)
    .neq("skill", "")
    // Only profiles with a known position can appear on the map
    .not("lat_public", "is", null)
    .not("lng_public", "is", null)
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
  // Return empty array if no results — callers decide whether to show mock fallback
  if (!data?.length) return [];
  return rowsToPins(data);
}

export const discoveryService = {
  async getNearbyUsers(_coords: LocationCoords, _radiusKm = 10): Promise<DiscoveryPin[]> {
    return queryProfiles("All");
  },

  async filterUsers(filter: DiscoveryFilter): Promise<DiscoveryPin[]> {
    return queryProfiles(filter);
  },

  async searchBySkillAndLocation(skill: SkillCategory | "", location: string): Promise<DiscoveryPin[]> {
    const sb = getSupabase();
    let query = sb
      .from("profiles")
      .select(PIN_COLUMNS)
      .eq("role", "pro")
      .not("skill", "is", null)
      .neq("skill", "")
      .not("lat_public", "is", null)
      .not("lng_public", "is", null)
      .limit(20);
    if (skill) query = query.eq("skill", skill);
    if (location) query = query.ilike("location", `%${location}%`);
    const { data } = await query;
    if (!data?.length) return MOCK_DISCOVERY_PINS;
    return rowsToPins(data);
  },

  async getUserLocation(): Promise<LocationCoords | null> {
    return { lat: -33.9214, lng: 150.9224 };
  },
};

export { mapProfile };
