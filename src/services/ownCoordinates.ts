// ─────────────────────────────────────────────
// SkillSnap — the signed-in user's own exact coordinates
// ─────────────────────────────────────────────
// Every public profile read goes through visible_profiles, which coarsens
// lat/lng for anyone with location_private set, and migration 010 revokes the
// precise columns on `profiles` outright.
//
// Your own row still needs the exact pair: EditProfileScreen seeds its state
// from the loaded profile and writes those values back on save, so a coarsened
// seed would round the user's real location a little further toward the grid
// centre every time they saved — permanently, and even if they later turned the
// setting off.
//
// get_own_coordinates() is the sanctioned path: security definer, scoped to
// auth.uid(), no parameter, granted to authenticated only. Same shape as
// get_own_email() from migration 007.

import { getAuthSupabase } from "@/lib/supabase";
import type { User } from "@/types";

type Coordinates = { lat?: number; lng?: number };

export async function getOwnCoordinates(): Promise<Coordinates> {
  try {
    const { data, error } = await getAuthSupabase().rpc("get_own_coordinates");
    if (error) {
      console.warn("[getOwnCoordinates] failed:", error.message);
      return {};
    }

    // returns table(...) comes back as an array of rows.
    const row = (Array.isArray(data) ? data[0] : data) as Coordinates | null;
    return {
      lat: row?.lat ?? undefined,
      lng: row?.lng ?? undefined,
    };
  } catch (e) {
    console.warn("[getOwnCoordinates] threw:", e);
    return {};
  }
}

/**
 * Fills in a mapped own-profile User with its exact coordinates.
 *
 * Non-fatal: a failed RPC leaves lat/lng undefined rather than failing the
 * profile load. EditProfile then geocodes the location text on save instead of
 * reusing a stale pair, which is the same path a user with no coordinates
 * already takes.
 */
export async function withOwnCoordinates(user: User): Promise<User> {
  const { lat, lng } = await getOwnCoordinates();
  return { ...user, lat, lng };
}
