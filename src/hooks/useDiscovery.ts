"use client";
// ─────────────────────────────────────────────
// useDiscovery — loads nearby pros via discoveryService (Supabase).
// Never substitutes sample data: no rows means an empty result, a failed
// request means `error` is set and the result stays empty.
//
// Returns two lists: `allPros` (every skilled pro, for the results grid) and
// `mappablePros` (only those with real coordinates, for the map). A pro with
// no coordinates stays discoverable in the grid instead of being dropped.
// ─────────────────────────────────────────────
import { useEffect, useState, useCallback } from "react";
import { useAppState } from "@/state/AppState";
import { discoveryService } from "@/services/discoveryService";
import type { DiscoveryResults } from "@/types";
import type { DiscoveryFilter } from "@/constants/skillLookup";

const EMPTY: DiscoveryResults = { allPros: [], mappablePros: [] };

const SUPABASE_CONFIGURED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref");

const LOAD_ERROR = "Couldn't load pros. Please try again.";

export function useDiscovery() {
  const { state, dispatch } = useAppState();
  const [results, setResults] = useState<DiscoveryResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) {
      setResults(EMPTY);
      setError(LOAD_ERROR);
      return;
    }
    setLoading(true);
    setError(null);
    discoveryService
      .getNearbyUsers({ lat: -33.9214, lng: 150.9224 })
      .then(setResults)
      .catch(() => { setResults(EMPTY); setError(LOAD_ERROR); })
      .finally(() => setLoading(false));
  }, []);

  const setFilter = useCallback(
    async (filter: DiscoveryFilter) => {
      dispatch({ type: "SET_DISCOVERY_FILTER", filter });
      if (!SUPABASE_CONFIGURED) {
        setResults(EMPTY);
        setError(LOAD_ERROR);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // An empty filter result is valid and is shown as empty.
        setResults(await discoveryService.filterUsers(filter));
      } catch {
        setResults(EMPTY);
        setError(LOAD_ERROR);
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
    error,
    activeFilter: state.discoveryFilter,
    setFilter,
  };
}
