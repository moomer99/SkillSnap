"use client";
// ─────────────────────────────────────────────
// SkillSnap — Right rail (desktop ≥1200px)
// Suggested pros, trending skills and the app download nudge.
// ─────────────────────────────────────────────
import { useEffect, useState } from "react";
import { Edit3, MapPin } from "lucide-react";
import type { Screen } from "@/types";
import { useAppState } from "@/state/AppState";
import { getSupabase } from "@/lib/supabase";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/constants/config";

interface RightSidebarProps {
  onNavigate: (s: Screen) => void;
}

interface SuggestedPro {
  id: string;
  username: string | null;
  displayName: string;
  skill: string;
  location: string | null;
  jobsDone: number;
  avatarUrl: string | null;
  avatarGradient: string;
  avatarInitial: string;
}

/** Top pros by jobs done, excluding the signed-in user. */
function useSuggestedPros(excludeId?: string): SuggestedPro[] {
  const [pros, setPros] = useState<SuggestedPro[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const sb = getSupabase();
        const { data } = await sb
          .from("profiles")
          .select("id, username, display_name, skill, location, jobs_done, avatar_url, avatar_gradient, avatar_initial")
          .not("skill", "is", null)
          .order("jobs_done", { ascending: false })
          .limit(8);
        if (!data) return;

        type Row = {
          id: string; username: string | null; display_name: string | null; skill: string | null;
          location: string | null; jobs_done: number | null; avatar_url: string | null;
          avatar_gradient: string | null; avatar_initial: string | null;
        };

        setPros(
          (data as Row[])
            .filter((p) => p.id !== excludeId)
            .slice(0, 4)
            .map((p) => {
              const displayName = p.display_name || p.username || "SkillSnap Pro";
              return {
                id: p.id,
                username: p.username,
                displayName,
                skill: p.skill ?? "Skilled Pro",
                location: p.location,
                jobsDone: p.jobs_done ?? 0,
                avatarUrl: p.avatar_url,
                avatarGradient: p.avatar_gradient ?? "linear-gradient(135deg,#6c47ff,#a78bfa)",
                avatarInitial: p.avatar_initial ?? displayName.charAt(0).toUpperCase(),
              };
            })
        );
      } catch {
        // the rail is non-critical
      }
    })();
  }, [excludeId]);

  return pros;
}

function useTrendingSkills() {
  const [skills, setSkills] = useState<string[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const sb = getSupabase();
        const { data: rows } = await sb
          .from("profiles")
          .select("skill")
          .eq("role", "pro")
          .not("skill", "is", null);
        if (!rows) return;
        const counts: Record<string, number> = {};
        (rows as { skill: string | null }[]).forEach((r) => {
          if (r.skill) counts[r.skill] = (counts[r.skill] ?? 0) + 1;
        });
        setSkills(
          Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 12)
            .map(([skill]) => skill)
        );
      } catch {
        // the rail is non-critical
      }
    })();
  }, []);

  return skills;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-4 ${className}`}
      style={{ background: "var(--ss-surface)", border: "1px solid var(--ss-line)" }}
    >
      {children}
    </div>
  );
}

export default function RightSidebar({ onNavigate }: RightSidebarProps) {
  const { state, dispatch } = useAppState();
  const { isAuthenticated, currentUser } = state;
  const suggested = useSuggestedPros(currentUser?.id);
  const trendingSkills = useTrendingSkills();

  function viewProfile(userId: string) {
    dispatch({ type: "SET_VIEWING_USER", userId });
    onNavigate("client-profile");
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Signed out — join prompt */}
      {!isAuthenticated && (
        <Card className="flex flex-col gap-3">
          <div>
            <h3 className="font-bold text-white text-base">Join SkillSnap</h3>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--ss-text-muted)" }}>
              Connect with skilled pros in your area
            </p>
          </div>
          <button
            onClick={() => onNavigate("auth")}
            className="w-full h-10 rounded-xl font-bold text-sm text-white flex items-center justify-center"
            style={{ background: "var(--ss-purple)" }}
          >
            Sign Up Free
          </button>
          <button
            onClick={() => onNavigate("auth")}
            className="w-full h-10 rounded-xl font-bold text-sm flex items-center justify-center transition-colors hover:bg-white/[0.06]"
            style={{ color: "var(--ss-purple-light)", border: "1px solid var(--ss-purple-border)" }}
          >
            Log In
          </button>
        </Card>
      )}

      {/* Signed in — profile card */}
      {isAuthenticated && currentUser && (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.displayName}
                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                style={{ background: currentUser.avatarGradient }}
              >
                {currentUser.avatarInitial}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-bold text-white text-sm truncate">{currentUser.displayName}</p>
              {currentUser.skill && (
                <span
                  className="inline-block text-xs font-semibold rounded-full px-2 py-0.5 mt-0.5"
                  style={{ background: "var(--ss-purple-soft)", color: "var(--ss-purple-light)" }}
                >
                  {currentUser.skill}
                </span>
              )}
              {currentUser.location && (
                <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--ss-text-dim)" }}>
                  <MapPin size={11} />
                  {currentUser.location}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => onNavigate("edit-profile")}
            className="w-full h-9 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-1.5 transition-colors hover:bg-white/[0.06]"
            style={{ border: "1px solid var(--ss-line)" }}
          >
            <Edit3 size={13} /> Edit Profile
          </button>
        </Card>
      )}

      {/* Suggested pros */}
      {suggested.length > 0 && (
        <Card>
          <h3 className="font-bold text-white text-sm mb-3">Suggested pros</h3>
          <div className="flex flex-col gap-1">
            {suggested.map((pro) => (
              <button
                key={pro.id}
                onClick={() => viewProfile(pro.id)}
                className="flex items-center gap-3 w-full text-left p-2 -mx-2 rounded-xl transition-colors hover:bg-white/[0.05]"
              >
                {pro.avatarUrl ? (
                  <img src={pro.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: pro.avatarGradient }}
                  >
                    {pro.avatarInitial}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-white truncate">{pro.displayName}</p>
                  <p className="text-[11px] truncate" style={{ color: "var(--ss-text-dim)" }}>
                    {pro.skill}
                    {pro.location ? ` · ${pro.location.split(",")[0]}` : ""}
                  </p>
                </div>
                <span className="text-[11px] font-semibold flex-shrink-0" style={{ color: "var(--ss-purple-light)" }}>
                  {pro.jobsDone} jobs
                </span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Trending skills */}
      {trendingSkills.length > 0 && (
        <Card>
          <h3 className="font-bold text-white text-sm mb-3">Trending skills</h3>
          <div className="flex flex-wrap gap-1.5">
            {trendingSkills.map((skill) => (
              <button
                key={skill}
                onClick={() => {
                  dispatch({ type: "SET_SEARCH_QUERY", query: skill });
                  onNavigate("search");
                }}
                className="text-xs font-semibold rounded-full px-3 py-1.5 transition-colors hover:bg-white/[0.10]"
                style={{ background: "var(--ss-surface-2)", color: "var(--ss-text-muted)", border: "1px solid var(--ss-line)" }}
              >
                {skill}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Download nudge — the QR scans straight to the App Store listing */}
      <Card className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm font-semibold text-white">📱 Get the app</p>
        <p className="text-xs leading-relaxed" style={{ color: "var(--ss-text-muted)" }}>
          Scan to download SkillSnap and get the full experience on your phone.
        </p>
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(APP_STORE_URL)}`}
          alt="Scan to download SkillSnap from the App Store"
          width={120}
          height={120}
          className="rounded-xl bg-white p-1"
        />
        <div className="flex items-center gap-3 text-[11px] font-semibold">
          <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" style={{ color: "var(--ss-purple-light)" }}>
            App Store
          </a>
          <span style={{ color: "var(--ss-line-strong)" }}>·</span>
          <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" style={{ color: "var(--ss-purple-light)" }}>
            Google Play
          </a>
        </div>
      </Card>

      <p className="text-[11px] px-1" style={{ color: "var(--ss-text-dim)" }}>
        © 2026 SkillSnap Australia · Sydney, NSW
      </p>
    </div>
  );
}
