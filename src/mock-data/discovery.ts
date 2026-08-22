// ─────────────────────────────────────────────
// SkillSnap — Mock Discovery / Map Data
// Replace with discoveryService.getNearbyUsers()
// ─────────────────────────────────────────────
import type { DiscoveryPin, DiscoveryResults, MappableDiscoveryPin } from "@/types";

// Coordinates are real Western Sydney suburbs so the fallback behaves like live
// data (a map can plot it, distances compute) rather than needing special cases.
export const MOCK_DISCOVERY_PINS: DiscoveryPin[] = [
  { id: "pin_1", userId: "user_me",     name: "Marcus T.", skill: "Barber",       color: "#6c47ff", rating: 4.9, jobsDone: 47, lat: -33.9203, lng: 150.9236 }, // Liverpool
  { id: "pin_2", userId: "user_priya",  name: "Priya K.",  skill: "Makeup Artist",color: "#f5576c", rating: 5.0, jobsDone: 83, lat: -33.9169, lng: 150.9350 }, // Casula
  { id: "pin_3", userId: "user_jake",   name: "Jake R.",   skill: "Tiler",        color: "#4facfe", rating: 4.7, jobsDone: 29, lat: -33.8688, lng: 150.9330 }, // Fairfield
  { id: "pin_4", userId: "user_sam",    name: "Sam W.",    skill: "Fitness / PT", color: "#00b894", rating: 4.8, jobsDone: 61, lat: -33.9475, lng: 150.8931 }, // Ingleburn
  { id: "pin_5", userId: "user_ana",    name: "Ana M.",    skill: "Cleaning",     color: "#fdcb6e", rating: 4.6, jobsDone: 38, lat: -33.8983, lng: 150.8600 }, // Cecil Hills
  { id: "pin_6", userId: "user_leo",    name: "Leo P.",    skill: "Barber",       color: "#6c47ff", rating: 4.5, jobsDone: 12, lat: -33.9600, lng: 150.9700 }, // Glenfield
];

// Every mock pin has coordinates, so the offline fallback maps one-to-one.
export const MOCK_DISCOVERY_RESULTS: DiscoveryResults = {
  allPros: MOCK_DISCOVERY_PINS,
  mappablePros: MOCK_DISCOVERY_PINS as MappableDiscoveryPin[],
};

// The filter chips used to be a copy of the old config.ts skill list kept
// here; they are now derived from the shared vocabulary in
// constants/skillLookup.ts (DISCOVERY_FILTER_CHIPS / DiscoveryFilter).
