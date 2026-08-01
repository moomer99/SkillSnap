"use client";
import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useAppState } from "@/state/AppState";
import { normaliseUsername } from "@/lib/username";

const SUPABASE_CONFIGURED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref");

export default function UsernameSetupScreen({ onDone }: { onDone: () => void }) {
  const { state, dispatch } = useAppState();
  const user = state.currentUser;
  const suggested = (user?.displayName ?? "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  const [value, setValue] = useState(suggested);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Stored bare - the @ is added at render time. See @/lib/username.
    const username = normaliseUsername(value).toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      setError("3–20 characters: letters, numbers, underscores only.");
      return;
    }
    setError(null);
    setChecking(true);
    try {
      if (SUPABASE_CONFIGURED && user) {
        const { getAuthSupabase } = await import("@/lib/supabase");
        const { data: existing } = await getAuthSupabase()
          .from("profiles")
          .select("id")
          .eq("username", username)
          .neq("id", user.id)
          .maybeSingle();
        if (existing) {
          setError("That username is already taken. Try another.");
          setChecking(false);
          return;
        }
        const { error: updateError } = await getAuthSupabase()
          .from("profiles")
          .update({ username })
          .eq("id", user.id);
        if (updateError) {
          setError("Failed to save. Please try again.");
          setChecking(false);
          return;
        }
        dispatch({ type: "UPDATE_CURRENT_USER", patch: { username } });
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setChecking(false);
      return;
    }
    setChecking(false);
    onDone();
  }

  return (
    <div className="flex flex-col min-h-screen bg-white px-5 pt-14 pb-10">
      <div className="mb-8">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: "linear-gradient(135deg, #6c47ff, #a78bfa)" }}>
          <span className="text-2xl">✦</span>
        </div>
        <h1 className="text-2xl font-extrabold text-[#1a1a1a] mb-2">Choose your username</h1>
        <p className="text-[#7a7570] text-sm leading-relaxed">
          This is how people find and mention you on SkillSnap.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-center gap-2 border-2 border-[#e8e4df] rounded-2xl px-4 h-14 focus-within:border-[#6c47ff] transition-colors bg-[#fafafa]">
          <span className="text-[#b0aaa5] font-semibold text-base select-none">@</span>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
              setError(null);
            }}
            placeholder="your_username"
            maxLength={20}
            autoComplete="off"
            autoCapitalize="none"
            className="flex-1 bg-transparent text-[#1a1a1a] text-base font-semibold placeholder-[#c0bcb8] outline-none"
          />
        </div>
        {error && <p className="text-xs text-red-500 font-medium px-1">{error}</p>}
        <p className="text-[11px] text-[#b0aaa5] px-1">
          3–20 characters · letters, numbers, underscores only
        </p>
        <button
          type="submit"
          disabled={checking || value.length < 3}
          className="w-full h-14 rounded-2xl font-bold text-base text-white mt-2 flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
          style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
        >
          {checking ? <><Loader2 size={18} className="animate-spin" /> Checking…</> : "Continue →"}
        </button>
      </form>
    </div>
  );
}
