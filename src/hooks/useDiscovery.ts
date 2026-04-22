"use client";
// ─────────────────────────────────────────────
// useDiscovery — loads nearby pins via discoveryService (Supabase).
// Falls back to MOCK_DISCOVERY_PINS when Supabase is not configured.
// ─────────────────────────────────────────────
import { useEffect, useState, useCallback } from "react";
import { useAppState } from "@/state/AppState";
import { discoveryService } from "@/services/discoveryService";
import type { DiscoveryPin } from "@/types";
import type { DiscoveryFilter } from "@/mock-data/discovery";
import { MOCK_DISCOVERY_PINS } from "@/mock-data/discovery";

const SUPABASE_CONFIGURED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref");

export function useDiscovery() {
  const { state, dispatch } = useAppState();
  const [pins, setPins] = useState<DiscoveryPin[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) {
      setPins(MOCK_DISCOVERY_PINS);
      return;
    }
    setLoading(true);
    discoveryService
      .getNearbyUsers({ lat: -33.9214, lng: 150.9224 })
      .then((results) => setPins(results.length ? results : MOCK_DISCOVERY_PINS))
      .catch(() => setPins(MOCK_DISCOVERY_PINS))
      .finally(() => setLoading(false));
  }, []);

  const setFilter = useCallback(
    async (filter: DiscoveryFilter) => {
      dispatch({ type: "SET_DISCOVERY_FILTER", filter });
      if (!SUPABASE_CONFIGURED) {
        // Mock filter: just use all pins for now
        setPins(MOCK_DISCOVERY_PINS);
        return;
      }
      setLoading(true);
      try {
        const results = await discoveryService.filterUsers(filter);
        setPins(results.length ? results : MOCK_DISCOVERY_PINS);
      } catch {
        setPins(MOCK_DISCOVERY_PINS);
      } finally {
        setLoading(false);
      }
    },
    [dispatch]
  );

  return {
    pins,
    loading,
    activeFilter: state.discoveryFilter,
    setFilter,
  };
}
