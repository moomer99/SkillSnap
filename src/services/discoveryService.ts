// ─────────────────────────────────────────────
// SkillSnap — Discovery / Map Service
// Integration point: swap for location-based API
// (PostGIS / Mapbox / Google Maps Places)
// ─────────────────────────────────────────────
import type { DiscoveryPin, SkillCategory } from "@/types";
import type { DiscoveryFilter } from "@/mock-data/discovery";
import { MOCK_DISCOVERY_PINS } from "@/mock-data/discovery";

export interface LocationCoords {
  lat: number;
  lng: number;
}

export const discoveryService = {
  async getNearbyUsers(_coords: LocationCoords, _radiusKm = 10): Promise<DiscoveryPin[]> {
    // TODO: GET /discovery/nearby?lat=&lng=&radius=
    return MOCK_DISCOVERY_PINS;
  },

  async filterUsers(filter: DiscoveryFilter): Promise<DiscoveryPin[]> {
    // TODO: GET /discovery/nearby?skill=filter
    if (filter === "All") return MOCK_DISCOVERY_PINS;
    if (filter === "Nearby") return MOCK_DISCOVERY_PINS.slice(0, 4);
    if (filter === "Top Rated") return [...MOCK_DISCOVERY_PINS].sort((a, b) => b.rating - a.rating);
    return MOCK_DISCOVERY_PINS.filter((p) =>
      p.skill.toLowerCase().includes(filter.toLowerCase())
    );
  },

  async searchBySkillAndLocation(
    _skill: SkillCategory | "",
    _location: string
  ): Promise<DiscoveryPin[]> {
    // TODO: GET /discovery/search?skill=&location=
    return MOCK_DISCOVERY_PINS;
  },

  async getUserLocation(): Promise<LocationCoords | null> {
    // TODO: browser Geolocation API + reverse geocode
    return { lat: -33.9214, lng: 150.9224 };
  },
};
