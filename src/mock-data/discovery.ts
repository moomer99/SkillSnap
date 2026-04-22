// ─────────────────────────────────────────────
// SkillSnap — Mock Discovery / Map Data
// Replace with discoveryService.getNearbyUsers()
// ─────────────────────────────────────────────
import type { DiscoveryPin } from "@/types";

export const MOCK_DISCOVERY_PINS: DiscoveryPin[] = [
  { id: "pin_1", userId: "user_me",     name: "Marcus T.", skill: "Barber",       color: "#6c47ff", rating: 4.9, jobsDone: 47, x: "22%", y: "28%" },
  { id: "pin_2", userId: "user_priya",  name: "Priya K.",  skill: "Makeup Artist",color: "#f5576c", rating: 5.0, jobsDone: 83, x: "55%", y: "18%" },
  { id: "pin_3", userId: "user_jake",   name: "Jake R.",   skill: "Tiler",        color: "#4facfe", rating: 4.7, jobsDone: 29, x: "70%", y: "42%" },
  { id: "pin_4", userId: "user_sam",    name: "Sam W.",    skill: "Fitness / PT", color: "#00b894", rating: 4.8, jobsDone: 61, x: "38%", y: "52%" },
  { id: "pin_5", userId: "user_ana",    name: "Ana M.",    skill: "Cleaning",     color: "#fdcb6e", rating: 4.6, jobsDone: 38, x: "18%", y: "60%" },
  { id: "pin_6", userId: "user_leo",    name: "Leo P.",    skill: "Barber",       color: "#6c47ff", rating: 4.5, jobsDone: 12, x: "62%", y: "68%" },
];

export const DISCOVERY_FILTER_CHIPS = ["All", "Nearby", "Top Rated", "Barber", "Cleaning", "Fitness", "Tiler", "Beauty"] as const;
export type DiscoveryFilter = (typeof DISCOVERY_FILTER_CHIPS)[number];
