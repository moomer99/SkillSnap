/**
 * Web-side helpers over the shared skills vocabulary.
 *
 * skills.ts and skillColors.ts are byte-identical with the mobile repo and
 * must stay that way, so anything the web needs on top of them lives here.
 *
 * Two tests, deliberately different:
 *   - isKnownSkill()  — PRO_SKILLS, INCLUDING the grandfathered LEGACY_SKILLS
 *                       (Tradie, Driver, Cook). "Is this a skill we resolve?"
 *                       A profile holding a legacy name is known, not custom.
 *   - SELECTABLE_*    — SELECTABLE_SKILLS only. "What can be chosen?"
 *                       Pickers offer these; they never offer a legacy name.
 */

import {
  PRO_SKILLS,
  SELECTABLE_SKILLS,
  type SkillCategory as SkillGroup,
} from "./skills";

/** The 135 names a picker may offer, in the vocabulary's own order. */
export const SELECTABLE_SKILL_NAMES: readonly string[] = SELECTABLE_SKILLS.map(
  (item) => item.name
);

/** True for every listed skill, legacy names included. */
export function isKnownSkill(skill: string | null | undefined): boolean {
  const value = (skill ?? "").trim();
  if (!value) return false;
  return PRO_SKILLS.some((item) => item.name === value);
}

/** The category a listed skill belongs to; null for custom skills. */
export function skillGroup(skill: string | null | undefined): SkillGroup | null {
  const value = (skill ?? "").trim();
  return PRO_SKILLS.find((item) => item.name === value)?.category ?? null;
}

/**
 * Orders live skill values the way the vocabulary does: listed skills first,
 * in PRO_SKILLS order, then custom (unlisted) skills alphabetically. Used
 * wherever a list is derived from profiles.skill so it reads the same as a
 * list derived from the static vocabulary.
 */
export function sortSkillsByVocabulary(names: readonly string[]): string[] {
  const rank = new Map(PRO_SKILLS.map((item, index) => [item.name, index]));
  return [...names].sort((a, b) => {
    const ra = rank.get(a);
    const rb = rank.get(b);
    if (ra !== undefined && rb !== undefined) return ra - rb;
    if (ra !== undefined) return -1;
    if (rb !== undefined) return 1;
    return a.localeCompare(b);
  });
}

/**
 * UI-only pseudo options the role/skill pickers put beside the vocabulary.
 * Neither is ever stored as a skill: "Client" sets role = client with
 * skill = null, and "Other" opens the free-text custom-skill input.
 */
export const CLIENT_OPTION = "Client";
export const OTHER_OPTION = "Other";

// ── Discover filters ──────────────────────────────────────────────────────
// The first three are sorts; everything after is a skill from the vocabulary.
export const DISCOVERY_SORT_FILTERS = ["All", "Nearby", "Top Rated"] as const;
export type DiscoverySort = (typeof DISCOVERY_SORT_FILTERS)[number];
export type DiscoveryFilter = DiscoverySort | (string & {});
export const DISCOVERY_FILTER_CHIPS: readonly DiscoveryFilter[] = [
  ...DISCOVERY_SORT_FILTERS,
  ...SELECTABLE_SKILL_NAMES,
];
export function isDiscoverySort(filter: DiscoveryFilter): filter is DiscoverySort {
  return (DISCOVERY_SORT_FILTERS as readonly string[]).includes(filter);
}
