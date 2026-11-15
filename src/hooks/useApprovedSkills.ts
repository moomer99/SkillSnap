"use client";
// ─────────────────────────────────────────────
// useApprovedSkills — the skills that have at least one approved video,
// computed live from `posts`. This is the single source for the skill chips
// on Discover and the "Browse by Skill" grid in Search. The pro skill
// pickers are NOT derived from it; they keep the full static vocabulary.
//
// Cached for the page's lifetime (10 min) and shared between callers, so
// opening Discover and Search costs one query. Failure or an unconfigured
// project yields an empty list — never a stand-in list.
// ─────────────────────────────────────────────
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { skillColor, skillEmoji } from "@/constants/skillColors";
import { sortSkillsByVocabulary } from "@/constants/skillLookup";

export interface DerivedSkill {
  name: string;
  /** From PRO_SKILLS when the skill is listed; null for custom skills. */
  emoji: string | null;
  /** Skill → category → hashed fallback, via skillColor(). */
  color: string;
}

const SUPABASE_CONFIGURED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref");

const TTL_MS = 10 * 60 * 1000;
const PAGE_SIZE = 1000; // PostgREST's default row cap
const MAX_PAGES = 10;   // 10k approved videos; beyond that the list is partial

let cache: { at: number; skills: DerivedSkill[] } | null = null;
let inflight: Promise<DerivedSkill[]> | null = null;

async function fetchApprovedSkills(): Promise<DerivedSkill[]> {
  const sb = getSupabase();
  const raw: string[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await sb
      .from("posts")
      .select("skill")
      .eq("moderation_status", "approved")
      .eq("type", "video")
      .not("skill", "is", null)
      .order("id")
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (error) throw error;
    for (const row of data ?? []) {
      const s = (row.skill ?? "").trim();
      if (s) raw.push(s);
    }
    if ((data?.length ?? 0) < PAGE_SIZE) break;
  }

  // Collapse case variants ("barber" / "Barber") onto one entry, preferring
  // a spelling the vocabulary knows.
  const byKey = new Map<string, string>();
  for (const s of raw) {
    const key = s.toLowerCase();
    const known = skillEmoji(s) !== null;
    const existing = byKey.get(key);
    if (!existing || (known && skillEmoji(existing) === null)) byKey.set(key, s);
  }
  return sortSkillsByVocabulary([...byKey.values()]).map((name) => ({
    name,
    emoji: skillEmoji(name),
    color: skillColor(name),
  }));
}

/** Memoized loader; concurrent callers share one request. */
export function loadApprovedSkills(): Promise<DerivedSkill[]> {
  if (!SUPABASE_CONFIGURED) return Promise.resolve([]);
  if (cache && Date.now() - cache.at < TTL_MS) return Promise.resolve(cache.skills);
  if (!inflight) {
    inflight = fetchApprovedSkills()
      .then((skills) => { cache = { at: Date.now(), skills }; return skills; })
      .finally(() => { inflight = null; });
  }
  return inflight;
}

export function useApprovedSkills() {
  const [skills, setSkills] = useState<DerivedSkill[]>(cache?.skills ?? []);
  const [loading, setLoading] = useState(SUPABASE_CONFIGURED && !cache);
  const [error, setError] = useState(false);

  useEffect(() => {
    let live = true;
    loadApprovedSkills()
      .then((s) => { if (live) { setSkills(s); setError(false); } })
      .catch((err) => { console.warn("[useApprovedSkills] failed:", err); if (live) setError(true); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);

  return { skills, loading, error };
}
