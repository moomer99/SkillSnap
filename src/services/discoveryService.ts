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

// Map pin positions are UI-only for now (no PostGIS yet).
// We keep stable positions from mock data and hydrate with real profile data.
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

function profileToPin(row: Record<string, unknown>, index: number): DiscoveryPin {
  const mockPin = MOCK_DISCOVERY_PINS[index % MOCK_DISCOVERY_PINS.length];
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
    x: mockPin.x,
    y: mockPin.y,
  };
}

async function queryProfiles(filter: DiscoveryFilter, limit = 12): Promise<DiscoveryPin[]> {
  const sb = getSupabase();
  let query = sb
    .from("profiles")
    .select("id, display_name, skill, jobs_done, is_client, location, avatar_url, avatar_initial, avatar_gradient")
    .eq("role", "pro")
    .not("skill", "is", null)
    .not("skill", "eq", "")
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
  return data.map((row, i) => profileToPin(row as Record<string, unknown>, i));
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
    let query = sb.from("profiles").select("*, ratings(count)").eq("role", "pro").not("skill", "is", null).not("skill", "eq", "").limit(20);
    if (skill) query = query.eq("skill", skill);
    if (location) query = query.ilike("location", `%${location}%`);
    const { data } = await query;
    if (!data?.length) return MOCK_DISCOVERY_PINS;
    return data.map((row, i) => profileToPin(row as Record<string, unknown>, i));
  },

  async getUserLocation(): Promise<LocationCoords | null> {
    return { lat: -33.9214, lng: 150.9224 };
  },
};

export { mapProfile };
