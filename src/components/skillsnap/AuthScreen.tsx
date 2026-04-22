"use client";
// ─────────────────────────────────────────────
// SkillSnap — Auth / Onboarding Screen
// Supabase Auth: signUp / logIn → dispatch SET_AUTH → navigate "home"
// ─────────────────────────────────────────────
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import type { Screen } from "@/types";
import { APP_CONFIG } from "@/constants/config";
import { authService } from "@/services/authService";
import { useAppState } from "@/state/AppState";

interface AuthScreenProps {
  onNavigate: (s: Screen) => void;
}

type AuthMode = "landing" | "signup" | "login";

export default function AuthScreen({ onNavigate }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>("landing");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { dispatch } = useAppState();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result =
        mode === "signup"
          ? await authService.signUp(email, password, displayName)
          : await authService.logIn(email, password);

      if (!result.success) {
        setError(result.error ?? "Something went wrong. Please try again.");
      } else {
        if (result.user) {
          dispatch({ type: "SET_AUTH", user: result.user });
        }
        onNavigate("home");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (mode !== "landing") {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-2">
          <button
            onClick={() => { setMode("landing"); setError(null); }}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#f0eeea] text-[#7a7570]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <h2 className="font-bold text-lg text-[#1a1a1a]">
            {mode === "signup" ? "Create account" : "Welcome back"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col px-6 pt-6 gap-4">
          {/* Display name — sign up only */}
          {mode === "signup" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#7a7570] uppercase tracking-wider">Your name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Marcus Thompson"
                autoComplete="name"
                className="h-12 rounded-xl border border-[#e8e4df] px-4 text-sm text-[#1a1a1a] bg-white outline-none focus:border-[#6c47ff] transition-colors placeholder-[#b0aaa5]"
              />
            </div>
          )}

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#7a7570] uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete={mode === "signup" ? "email" : "username"}
              required
              className="h-12 rounded-xl border border-[#e8e4df] px-4 text-sm text-[#1a1a1a] bg-white outline-none focus:border-[#6c47ff] transition-colors placeholder-[#b0aaa5]"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#7a7570] uppercase tracking-wider">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "Min 6 characters" : "Your password"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                minLength={6}
                className="w-full h-12 rounded-xl border border-[#e8e4df] px-4 pr-12 text-sm text-[#1a1a1a] bg-white outline-none focus:border-[#6c47ff] transition-colors placeholder-[#b0aaa5]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b0aaa5] hover:text-[#7a7570]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex-1" />

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full h-14 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 mb-6"
            style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              mode === "signup" ? "Create account" : "Log in"
            )}
          </button>

          {/* Toggle mode */}
          <p className="text-center text-sm text-[#7a7570] pb-8">
            {mode === "signup" ? "Already have an account? " : "Don't have an account? "}
            <button
              type="button"
              onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(null); }}
              className="text-[#6c47ff] font-semibold"
            >
              {mode === "signup" ? "Log in" : "Sign up"}
            </button>
          </p>
        </form>
      </div>
    );
  }

  // ── Landing view ──────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero */}
      <div
        className="relative flex-1 flex flex-col items-center justify-center overflow-hidden"
        style={{ background: "linear-gradient(160deg, #ede9fe 0%, #f8f7f5 50%, #fff 100%)" }}
      >
        {/* Floating skill bubbles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Bubble text="Barber"        top="12%" left="8%"  rotate="-8deg" />
          <Bubble text="Tiler"         top="20%" left="72%" rotate="6deg" />
          <Bubble text="Makeup Artist" top="38%" left="4%"  rotate="-4deg" />
          <Bubble text="Fitness"       top="55%" left="68%" rotate="10deg" />
          <Bubble text="Cleaning"      top="68%" left="12%" rotate="-6deg" />
          <Bubble text="Plumber"       top="75%" left="58%" rotate="3deg" />
        </div>

        {/* Brand */}
        <div className="relative z-10 flex flex-col items-center text-center px-8 mt-12">
          <div
            className="flex items-center justify-center w-20 h-20 rounded-3xl mb-6"
            style={{ background: "linear-gradient(135deg, #6c47ff, #a78bfa)" }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M20 6L34 14V26L20 34L6 26V14L20 6Z" stroke="white" strokeWidth="2.5" fill="none" />
              <circle cx="20" cy="20" r="5" fill="white" />
              <circle cx="20" cy="10" r="2" fill="white" opacity="0.8" />
              <circle cx="28.7" cy="25" r="2" fill="white" opacity="0.8" />
              <circle cx="11.3" cy="25" r="2" fill="white" opacity="0.8" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#1a1a1a] tracking-tight mb-2">{APP_CONFIG.name}</h1>
          <p className="text-xl font-semibold text-[#6c47ff] mt-2 mb-1">{APP_CONFIG.tagline}</p>
          <p className="text-sm text-[#7a7570] leading-relaxed max-w-[260px]">{APP_CONFIG.subtitle}</p>
        </div>

        {/* Mini preview cards */}
        <div className="relative z-10 mt-10 flex gap-3 px-6">
          <MiniCard gradient="linear-gradient(135deg, #667eea, #764ba2)" skill="Barber"  name="Marcus T." />
          <MiniCard gradient="linear-gradient(135deg, #f093fb, #f5576c)" skill="Makeup"  name="Priya K."  offset />
          <MiniCard gradient="linear-gradient(135deg, #4facfe, #00f2fe)" skill="Tiler"   name="Jake R."  />
        </div>
      </div>

      {/* CTA buttons */}
      <div className="px-6 pt-8 pb-12 flex flex-col gap-3 bg-white">
        <button
          onClick={() => setMode("signup")}
          className="w-full h-14 rounded-2xl font-semibold text-base text-white transition-all active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
        >
          Sign up
        </button>
        <button
          onClick={() => setMode("login")}
          className="w-full h-14 rounded-2xl font-semibold text-base text-[#6c47ff] border border-[#e8e4df] bg-white transition-all active:scale-[0.98]"
        >
          Log in
        </button>
        <p className="text-center text-xs text-[#b0aaa5] mt-1">
          By continuing, you agree to our Terms &amp; Privacy Policy
        </p>
      </div>
    </div>
  );
}

function Bubble({ text, top, left, rotate }: { text: string; top: string; left: string; rotate: string }) {
  return (
    <div
      className="absolute text-xs font-semibold px-3 py-1.5 rounded-full bg-white shadow-sm border border-[#e8e4df] text-[#6c47ff] whitespace-nowrap"
      style={{ top, left, transform: `rotate(${rotate})`, opacity: 0.85 }}
    >
      {text}
    </div>
  );
}

function MiniCard({ gradient, skill, name, offset }: { gradient: string; skill: string; name: string; offset?: boolean }) {
  return (
    <div
      className={`relative w-[100px] h-[130px] rounded-2xl overflow-hidden shadow-lg flex-shrink-0 ${offset ? "-mt-4" : ""}`}
      style={{ background: gradient }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-9 h-9 rounded-full bg-white/30 flex items-center justify-center backdrop-blur-sm">
          <svg width="14" height="16" viewBox="0 0 14 16" fill="white">
            <path d="M1 1l12 7-12 7V1z" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-2.5" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }}>
        <p className="text-white text-[10px] font-bold leading-tight">{skill}</p>
        <p className="text-white/80 text-[9px] leading-tight">{name}</p>
      </div>
    </div>
  );
}
