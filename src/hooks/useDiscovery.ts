"use client";
// ─────────────────────────────────────────────
// useDiscovery — loads nearby pins via discoveryService,
// exposes filter selection that re-fetches filtered results
// ─────────────────────────────────────────────
import { useEffect, useState, useCallback } from "react";
import { useAppState } from "@/state/AppState";
import { discoveryService } from "@/services/discoveryService";
import type { DiscoveryPin } from "@/types";
import type { DiscoveryFilter } from "@/mock-data/discovery";

export function useDiscovery() {
  const { state, dispatch } = useAppState();
  const [pins, setPins] = useState<DiscoveryPin[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    discoveryService.getNearbyUsers({ lat: -33.9214, lng: 150.9224 }).then((results) => {
      setPins(results);
      setLoading(false);
    });
  }, []);

  const setFilter = useCallback(
    async (filter: DiscoveryFilter) => {
      dispatch({ type: "SET_DISCOVERY_FILTER", filter });
      setLoading(true);
      const results = await discoveryService.filterUsers(filter);
      setPins(results);
      setLoading(false);
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
