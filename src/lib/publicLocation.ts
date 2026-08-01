/**
 * The location text it is safe to show other people.
 *
 * Mirrors src/utils/publicLocation.ts in the mobile repo. The two apps are
 * separate codebases against one database, so this is duplicated rather than
 * shared — keep them in step.
 *
 * The map pin is coarsened in SQL (20260801100000_private_location.sql in the
 * app repo), but `profiles.location` is free text and users type whatever they
 * like into it — live data includes "Casula", "Liverpool, NSW" and "Speed st,
 * Liverpool". A pro who switched on "Only suburb is visible to others" and
 * typed a street name is still publishing it until something strips it.
 */

/**
 * Segments that read as part of a street address rather than a locality.
 * Word-bounded so "Broadway" is not mistaken for a street called "way".
 */
const STREET_TOKEN =
  /\b(st|street|rd|road|ave|avenue|dr|drive|ln|lane|ct|court|pl|place|cres|crescent|pde|parade|hwy|highway|way|tce|terrace|cl|close|blvd|boulevard|unit|apt|apartment|level|suite|shop)\b/i;

function looksLikeStreet(segment: string): boolean {
  return /\d/.test(segment) || STREET_TOKEN.test(segment);
}

/**
 * Reduces a location to its locality part when the owner has asked for that.
 *
 *   publicLocationLabel("Liverpool, NSW", true)       -> "Liverpool, NSW"
 *   publicLocationLabel("Speed st, Liverpool", true)  -> "Liverpool"
 *   publicLocationLabel("12 Smith St, Casula", true)  -> "Casula"
 *   publicLocationLabel("Speed st", true)             -> null
 *   publicLocationLabel("Speed st, Liverpool", false) -> "Speed st, Liverpool"
 *
 * Returns null when nothing safe is left, rather than falling back to the raw
 * string: a value we cannot classify is exactly the case where guessing wrong
 * publishes an address.
 */
export function publicLocationLabel(
  location: string | null | undefined,
  locationPrivate: boolean | null | undefined
): string | null {
  const value = (location ?? "").trim();
  if (!value) return null;
  if (!locationPrivate) return value;

  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return null;

  // Nothing to fall back to, so a street-looking value is withheld entirely.
  if (parts.length === 1) return looksLikeStreet(parts[0]) ? null : parts[0];

  // Drop leading street-looking segments, always keeping the last one.
  let start = 0;
  while (start < parts.length - 1 && looksLikeStreet(parts[start])) start++;

  return parts.slice(start).join(", ");
}
