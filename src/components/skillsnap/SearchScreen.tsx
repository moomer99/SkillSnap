"use client";
import { useState, useEffect, useRef } from "react";
import { Search, ArrowLeft, X, MapPin, Briefcase, Users } from "lucide-react";
import type { Screen, User, SkillCategory } from "@/types";
import { SKILL_CATEGORIES } from "@/constants/config";
import { useAppState } from "@/state/AppState";
import UserAvatar from "./shared/UserAvatar";
import { MOCK_USERS } from "@/mock-data/users";

const SUPABASE_CONFIGURED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref");

const SKILL_META: Record<string, { emoji: string; color: string; bg: string }> = {
  "Barber":           { emoji: "✂️",  color: "#6c47ff", bg: "#ede9fe" },
  "Makeup Artist":    { emoji: "💄",  color: "#db2777", bg: "#fce7f3" },
  "Tiler":            { emoji: "🧱",  color: "#0284c7", bg: "#e0f2fe" },
  "Cleaning":         { emoji: "🧹",  color: "#d97706", bg: "#fef3c7" },
  "Cleaner":          { emoji: "🧹",  color: "#d97706", bg: "#fef3c7" },
  "Fitness / PT":     { emoji: "💪",  color: "#059669", bg: "#d1fae5" },
  "Plumber":          { emoji: "🔧",  color: "#0369a1", bg: "#dbeafe" },
  "Electrician":      { emoji: "⚡",  color: "#b45309", bg: "#fef9c3" },
  "Landscaping":      { emoji: "🌿",  color: "#15803d", bg: "#dcfce7" },
  "Landscaper":       { emoji: "🌿",  color: "#15803d", bg: "#dcfce7" },
  "Nails":            { emoji: "💅",  color: "#be185d", bg: "#fce7f3" },
  "Driver":           { emoji: "🚗",  color: "#0ea5e9", bg: "#e0f2fe" },
  "Cook":             { emoji: "👨‍🍳", color: "#ef4444", bg: "#fee2e2" },
  "Chef":             { emoji: "👨‍🍳", color: "#ef4444", bg: "#fee2e2" },
  "Carpenter":        { emoji: "🪚",  color: "#92400e", bg: "#fef3c7" },
  "Mechanic":         { emoji: "🔩",  color: "#374151", bg: "#f3f4f6" },
  "Painter":          { emoji: "🖌️",  color: "#7c3aed", bg: "#ede9fe" },
  "Mover":            { emoji: "📦",  color: "#d97706", bg: "#fef3c7" },
  "Photographer":     { emoji: "📷",  color: "#0f766e", bg: "#ccfbf1" },
  "Videographer":     { emoji: "🎥",  color: "#1d4ed8", bg: "#dbeafe" },
  "Personal Trainer": { emoji: "🏋️",  color: "#059669", bg: "#d1fae5" },
  "Nail Tech":        { emoji: "💅",  color: "#be185d", bg: "#fce7f3" },
  "Singer":           { emoji: "🎤",  color: "#7c3aed", bg: "#ede9fe" },
  "Musician":         { emoji: "🎸",  color: "#1d4ed8", bg: "#dbeafe" },
  "DJ":               { emoji: "🎧",  color: "#6c47ff", bg: "#ede9fe" },
  "Restaurant":       { emoji: "🍽️",  color: "#dc2626", bg: "#fee2e2" },
  "Tattoo Artist":    { emoji: "🖊️",  color: "#374151", bg: "#f3f4f6" },
  "Other":            { emoji: "⭐",  color: "#6b7280", bg: "#f3f4f6" },
};

type FilterTab = "all" | "pros" | "with_posts";

interface SearchScreenProps {
  onNavigate: (s: Screen) => void;
}

const MAX_RECENT = 6;
const STORAGE_KEY = "skillsnap_recent_searches";

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch { return []; }
}

function saveRecent(term: string) {
  const prev = loadRecent().filter(t => t !== term);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([term, ...prev].slice(0, MAX_RECENT)));
}

function clearRecent() {
  localStorage.removeItem(STORAGE_KEY);
}

export default function SearchScreen({ onNavigate }: SearchScreenProps) {
  const { state, dispatch, navigate } = useAppState();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeSkill, setActiveSkill] = useState<SkillCategory | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus + load recents on mount; pre-fill from app state if a query was pushed
  useEffect(() => {
    if (state.searchQuery) {
      setQuery(state.searchQuery);
      dispatch({ type: "SET_SEARCH_QUERY", query: "" });
    }
    setTimeout(() => inputRef.current?.focus(), 80);
    setRecentSearches(loadRecent());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search
  useEffect(() => {
    const q = activeSkill ?? query.trim();
    if (!q) { setResults([]); setLoading(false); return; }
    setLoading(true);
    const timer = setTimeout(() => runSearch(q), 280);
    return () => clearTimeout(timer);
  }, [query, filter, activeSkill]);

  async function runSearch(q: string) {
    const ql = q.toLowerCase();
    const mockResults = MOCK_USERS.filter(u =>
      u.displayName.toLowerCase().includes(ql) ||
      u.username.toLowerCase().includes(ql) ||
      (u.skill?.toLowerCase().includes(ql) ?? false) ||
      u.location.toLowerCase().includes(ql)
    );

    try {
      let users: User[] = [];
      if (SUPABASE_CONFIGURED) {
        // Race Supabase against a 4s timeout — fall back to mock if slow/empty
        const timeoutPromise = new Promise<User[]>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 4000)
        );
        const supabasePromise = import("@/services/searchService").then(({ searchService }) =>
          searchService.search(q).then((res) => res.users)
        );
        const sbUsers = await Promise.race([supabasePromise, timeoutPromise]).catch(() => [] as User[]);
        // Use Supabase results if non-empty, otherwise show mock data
        users = sbUsers;
      } else {
        users = mockResults;
      }
      if (filter === "pros")    users = users.filter(u => !u.isClient && u.skill);
      if (filter === "with_posts") users = users.filter(u => (u.postCount ?? 0) > 0);
      setResults(users);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    saveRecent(query.trim());
    setRecentSearches(loadRecent());
    runSearch(query.trim());
  }

  function applyRecent(term: string) {
    setActiveSkill(null);
    setQuery(term);
  }

  function applySkill(skill: SkillCategory) {
    setQuery("");
    setActiveSkill(skill === activeSkill ? null : skill);
  }

  function clearSearch() {
    setQuery("");
    setActiveSkill(null);
    setResults([]);
    inputRef.current?.focus();
  }

  function openUserProfile(user: User) {
    dispatch({ type: "SET_VIEWING_USER", userId: user.id });
    navigate(user.id === state.currentUser?.id ? "own-profile" : "client-profile");
  }

  const [liveSkills, setLiveSkills] = useState<string[]>([]);
  useEffect(() => {
    if (!SUPABASE_CONFIGURED) { setLiveSkills(SKILL_CATEGORIES.filter(s => s !== "Other")); return; }
    import("@/lib/supabase").then(({ getSupabase }) => {
      getSupabase()
        .from("profiles")
        .select("skill")
        .eq("role", "pro")
        .not("skill", "is", null)
        .then(({ data }) => {
          if (data) {
            const unique = [...new Set(data.map(r => r.skill).filter(Boolean))] as string[];
            setLiveSkills(unique.length > 0 ? unique : SKILL_CATEGORIES.filter(s => s !== "Other"));
          }
        });
    });
  }, []);

  const hasQuery = query.trim() !== "" || activeSkill !== null;
  const showEmpty = !hasQuery;
  const showResults = hasQuery && !loading;

  // Suggested pros for empty state
  const [suggestedPros, setSuggestedPros] = useState<User[]>([]);
  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return;
    import("@/lib/supabase").then(({ getSupabase }) => {
      getSupabase()
        .from("profiles")
        .select("*, ratings(count)")
        .eq("role", "pro")
        .not("skill", "is", null)
        .limit(6)
        .then(({ data }) => {
          if (data && data.length > 0) {
            import("@/services/authService").then(({ mapProfile }) => {
              setSuggestedPros(data.map(row => mapProfile(row as Record<string, unknown>)));
            });
          }
        });
    });
  }, []);

  return (
    <div className="flex flex-col bg-[#f8f7f5] min-h-screen">

      {/* ── Header ── */}
      <div className="sticky top-0 z-40 bg-white border-b border-[#e8e4df] px-3 pt-3 pb-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate(state.previousScreen ?? "home")}
            className="w-9 h-9 flex items-center justify-center text-[#7a7570] flex-shrink-0 active:text-[#1a1a1a] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex-1 flex items-center gap-2.5 bg-[#f0eeea] rounded-2xl px-3.5 h-10">
            <Search size={14} className="text-[#b0aaa5] flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setActiveSkill(null); }}
              placeholder="Search skills, people, location…"
              className="flex-1 bg-transparent text-sm text-[#1a1a1a] placeholder-[#b0aaa5] outline-none"
            />
            {(query || activeSkill) && (
              <button type="button" onClick={clearSearch} className="text-[#b0aaa5] active:text-[#1a1a1a]">
                <X size={14} />
              </button>
            )}
          </div>
        </form>

        {/* Filter tabs */}
        <div className="flex gap-2 mt-3">
          {(["all", "pros", "with_posts"] as FilterTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setFilter(tab);
                const q = activeSkill ?? query.trim();
                if (q) {
                  setLoading(true);
                  setTimeout(() => runSearch(q), 100);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
              style={
                filter === tab
                  ? { background: "#6c47ff", color: "white" }
                  : { background: "#f0eeea", color: "#7a7570" }
              }
            >
              {tab === "all"     && <Users size={11} />}
              {tab === "pros"    && <Briefcase size={11} />}
              {tab === "with_posts" && <Briefcase size={11} />}
              {tab === "all" ? "Everyone" : tab === "pros" ? "Pros" : "With Posts"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-8">

        {/* ── Loading skeletons ── */}
        {loading && (
          <div className="px-4 pt-4 space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-[#f0eeea] animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-[#f0eeea] rounded-full w-2/5 animate-pulse" />
                  <div className="h-3 bg-[#f0eeea] rounded-full w-1/3 animate-pulse" />
                  <div className="h-3 bg-[#f0eeea] rounded-full w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Empty / Browse state ── */}
        {showEmpty && !loading && (
          <>
            {/* Recent searches */}
            {recentSearches.length > 0 && (
              <div className="px-4 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-[#1a1a1a]">Recent</h3>
                  <button
                    onClick={() => { clearRecent(); setRecentSearches([]); }}
                    className="text-xs font-semibold text-[#6c47ff] active:opacity-70"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map(term => (
                    <button
                      key={term}
                      onClick={() => applyRecent(term)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e8e4df] rounded-full text-sm text-[#4a4a4a] font-medium active:bg-[#f0eeea] transition-colors"
                    >
                      <Search size={11} className="text-[#b0aaa5]" />
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Browse by skill */}
            <div className="px-4 pt-5">
              <h3 className="text-sm font-bold text-[#1a1a1a] mb-3">Browse by Skill</h3>
              <div className="grid grid-cols-2 gap-2">
                {liveSkills.map(skill => {
                  const meta = SKILL_META[skill] ?? SKILL_META["Other"];
                  const isActive = activeSkill === skill;
                  return (
                    <button
                      key={skill}
                      onClick={() => applySkill(skill as SkillCategory)}
                      className="flex items-center gap-2.5 p-3.5 rounded-2xl border transition-all active:scale-[0.98] text-left"
                      style={{
                        background: isActive ? meta.color : "white",
                        borderColor: isActive ? meta.color : "#e8e4df",
                      }}
                    >
                      <span className="text-xl leading-none">{meta.emoji}</span>
                      <span
                        className="text-sm font-semibold leading-tight"
                        style={{ color: isActive ? "white" : "#1a1a1a" }}
                      >
                        {skill}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Suggested pros */}
            <div className="px-4 pt-6">
              <h3 className="text-sm font-bold text-[#1a1a1a] mb-3">Nearby Pros</h3>
              <div className="space-y-2">
                {suggestedPros.map(user => (
                  <UserCard key={user.id} user={user} onPress={() => openUserProfile(user)} />
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Search results ── */}
        {showResults && !loading && (
          <div className="px-4 pt-4">
            {results.length > 0 ? (
              <>
                <p className="text-xs text-[#b0aaa5] font-medium mb-3">
                  {results.length} result{results.length !== 1 ? "s" : ""} for&nbsp;
                  <span className="text-[#6c47ff] font-semibold">
                    "{activeSkill ?? query.trim()}"
                  </span>
                </p>
                <div className="space-y-2">
                  {results.map(user => (
                    <UserCard key={user.id} user={user} onPress={() => openUserProfile(user)} />
                  ))}
                </div>
              </>
            ) : (
              <NoResults query={activeSkill ?? query.trim()} onClear={clearSearch} />
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// ── User Result Card ──────────────────────────────────────────
function UserCard({ user, onPress }: { user: User; onPress: () => void }) {
  const skillMeta = user.skill ? (SKILL_META[user.skill] ?? SKILL_META["Other"]) : null;

  return (
    <button
      onClick={onPress}
      className="w-full flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-[#e8e4df] active:bg-[#f8f7f5] transition-colors text-left"
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <UserAvatar user={user} size="md" showVerified={user.isVerified} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-bold text-[#1a1a1a] truncate">{user.displayName}</span>
          {skillMeta && user.skill && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: skillMeta.bg, color: skillMeta.color }}
            >
              {user.skill}
            </span>
          )}
          {user.isClient && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 bg-[#d1fae5] text-[#065f46]">
              Client
            </span>
          )}
        </div>

        <p className="text-xs text-[#b0aaa5] mb-1">{user.username}</p>

        <div className="flex items-center gap-3 text-[11px] text-[#7a7570]">
          <span className="flex items-center gap-0.5">
            <MapPin size={10} className="text-[#b0aaa5]" />
            {user.location}
          </span>
          {user.distanceKm !== undefined && (
            <span className="text-[#b0aaa5]">· {user.distanceKm}km</span>
          )}
          {user.jobsDone > 0 && (
            <span className="text-[#b0aaa5]">· {user.jobsDone} jobs</span>
          )}
          {user.happyPercent > 0 && (
            <span className="text-[#059669] font-semibold">· {user.happyPercent}% 😊</span>
          )}
        </div>
      </div>

      {/* Arrow hint */}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 text-[#d4cffe]">
        <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

// ── No Results ────────────────────────────────────────────────
function NoResults({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center py-16 text-center px-6">
      <div className="w-16 h-16 rounded-full bg-[#ede9fe] flex items-center justify-center mb-4">
        <Search size={24} className="text-[#6c47ff]" />
      </div>
      <p className="text-base font-bold text-[#1a1a1a] mb-1">No results for "{query}"</p>
      <p className="text-sm text-[#7a7570] mb-5 leading-relaxed">
        Try searching by name, skill, or suburb
      </p>
      <button
        onClick={onClear}
        className="px-5 py-2.5 rounded-full text-sm font-semibold text-[#6c47ff] border border-[#6c47ff] active:bg-[#ede9fe] transition-colors"
      >
        Clear search
      </button>
    </div>
  );
}
