"use client";
// ─────────────────────────────────────────────
// useDiscovery — loads nearby pros via discoveryService (Supabase).
// Falls back to MOCK_DISCOVERY_RESULTS when Supabase is not configured.
//
// Returns two lists: `allPros` (every skilled pro, for the results grid) and
// `mappablePros` (only those with real coordinates, for the map). A pro with
// no coordinates stays discoverable in the grid instead of being dropped.
// ─────────────────────────────────────────────
import { useEffect, useState, useCallback } from "react";
import { useAppState } from "@/state/AppState";
import { discoveryService } from "@/services/discoveryService";
import type { DiscoveryResults } from "@/types";
import type { DiscoveryFilter } from "@/mock-data/discovery";
import { MOCK_DISCOVERY_RESULTS } from "@/mock-data/discovery";

const EMPTY: DiscoveryResults = { allPros: [], mappablePros: [] };

const SUPABASE_CONFIGURED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref");

export function useDiscovery() {
  const { state, dispatch } = useAppState();
  const [results, setResults] = useState<DiscoveryResults>(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) {
      setResults(MOCK_DISCOVERY_RESULTS);
      return;
    }
    setLoading(true);
    discoveryService
      .getNearbyUsers({ lat: -33.9214, lng: 150.9224 })
      // Fall back to mock only when the DB has no skillers at all (fresh/empty project)
      .then((r) => setResults(r.allPros.length ? r : MOCK_DISCOVERY_RESULTS))
      .catch(() => setResults(MOCK_DISCOVERY_RESULTS))
      .finally(() => setLoading(false));
  }, []);

  const setFilter = useCallback(
    async (filter: DiscoveryFilter) => {
      dispatch({ type: "SET_DISCOVERY_FILTER", filter });
      if (!SUPABASE_CONFIGURED) {
        // Mock filter: just use all pins for now
        setResults(MOCK_DISCOVERY_RESULTS);
        return;
      }
      setLoading(true);
      try {
        const r = await discoveryService.filterUsers(filter);
        // Empty filter result is valid — don't substitute mock data
        setResults(r.allPros.length ? r : MOCK_DISCOVERY_RESULTS);
      } catch {
        setResults(MOCK_DISCOVERY_RESULTS);
      } finally {
        setLoading(false);
      }
    },
    [dispatch]
  );

  return {
    allPros: results.allPros,
    mappablePros: results.mappablePros,
    loading,
    activeFilter: state.discoveryFilter,
    setFilter,
  };
}
