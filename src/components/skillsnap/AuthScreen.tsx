"use client";
// ─────────────────────────────────────────────
// SkillSnap — Auth / Onboarding Screen
// Supports: Google OAuth + email/password (Supabase Auth)
// ─────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import type { User } from "@/types";

const SAVED_EMAIL_KEY = "skillsnap_saved_email";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import type { Screen } from "@/types";
import { APP_CONFIG } from "@/constants/config";
import { authService } from "@/services/authService";
import SkillSnapLogo from "./shared/SkillSnapLogo";
import { useAppState } from "@/state/AppState";

interface AuthScreenProps {
  onNavigate: (s: Screen) => void;
}

type AuthMode = "landing" | "signup" | "login";

// ── Google Icon SVG ───────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.859-3.048.859-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

// ── "Continue with Google" button ────────────
function GoogleButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full h-14 rounded-2xl font-semibold text-sm text-[#1a1a1a] border border-[#e8e4df] bg-white flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-60 shadow-sm hover:border-[#d0ccc8] hover:shadow-md"
    >
      {loading ? <Loader2 size={18} className="animate-spin text-[#7a7570]" /> : <GoogleIcon />}
      Continue with Google
    </button>
  );
}

// ── "or" divider ─────────────────────────────
function OrDivider() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-[#e8e4df]" />
      <span className="text-xs text-[#b0aaa5] font-medium">or</span>
      <div className="flex-1 h-px bg-[#e8e4df]" />
    </div>
  );
}

export default function AuthScreen({ onNavigate }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>("landing");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [showGoogleHint, setShowGoogleHint] = useState(false);
  const [showUsernameSetup, setShowUsernameSetup] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const { dispatch } = useAppState();

  // Auto-fill saved email on mount
  useEffect(() => {
    const saved = localStorage.getItem(SAVED_EMAIL_KEY);
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setForgotError(null);
    if (!forgotEmail.trim()) { setForgotError("Please enter your email."); return; }
    setForgotLoading(true);
    try {
      // resetPasswordForEmail uses the shared singleton. Supabase sends the token in the
      // URL hash (#access_token=...&type=recovery) via implicit flow configured on the project.
      const { getSupabase } = await import("@/lib/supabase");
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error: err } = await getSupabase().auth.resetPasswordForEmail(forgotEmail.trim(), { redirectTo });
      if (err) { setForgotError(err.message); return; }
      setForgotSent(true);
    } catch {
      setForgotError("Something went wrong. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setGoogleLoading(true);
    try {
      const result = await authService.signInWithGoogle();
      if (result.error) {
        setError(result.error);
        setGoogleLoading(false);
      }
      // On success the browser redirects to /auth/callback — no further action needed here
    } catch {
      setError("Google sign-in failed. Please try again.");
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "signup" && !displayName.trim()) {
      setError("Full name is required.");
      return;
    }
    setLoading(true);

    // Safety net — never leave spinner running forever
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
      setError("Request timed out. Please check your connection and try again.");
    }, 15000);

    try {
      const result =
        mode === "signup"
          ? await authService.signUp(email, password, displayName)
          : await authService.logIn(email, password);

      clearTimeout(loadingTimeout);

      if (!result.success) {
        const msg = result.error ?? "Something went wrong. Please try again.";
        // Detect invalid credentials on login — may be a Google-only account
        if (mode === "login" && msg.toLowerCase().includes("invalid login credentials")) {
          setShowGoogleHint(true);
        }
        setError(msg);
      } else {
        if (rememberMe) {
          localStorage.setItem(SAVED_EMAIL_KEY, email);
        } else {
          localStorage.removeItem(SAVED_EMAIL_KEY);
        }
        if (result.user) {
          dispatch({ type: "SET_AUTH", user: result.user });
          // If username looks auto-generated (ends with _xxxx), ask user to choose one
          if (isAutoGeneratedUsername(result.user.username)) {
            setPendingUser(result.user);
            setShowUsernameSetup(true);
          } else {
            onNavigate("home");
          }
        } else {
          onNavigate("home");
        }
      }
    } catch {
      clearTimeout(loadingTimeout);
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Username setup step ───────────────────────
  if (showUsernameSetup && pendingUser) {
    return (
      <UsernameSetupStep
        user={pendingUser}
        onDone={() => { setShowUsernameSetup(false); onNavigate("home"); }}
      />
    );
  }

  // ── Sign-up / Login form view ─────────────────
  if (mode !== "landing") {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-2">
          <button
            onClick={() => { setMode("landing"); setError(null); setShowGoogleHint(false); }}
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

        <div className="flex-1 flex flex-col px-6 pt-4 gap-4">
          {/* Google button — top of form */}
          {/* <GoogleButton onClick={handleGoogleSignIn} loading={googleLoading} /> */}

          {/* <OrDivider /> */}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Full Name — sign up only, required */}
            {mode === "signup" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#7a7570] uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                  required
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

            {/* Forgot password link — login only */}
            {mode === "login" && (
              <div className="flex justify-end -mt-2">
                <button
                  type="button"
                  onClick={() => { setForgotEmail(email); setForgotSent(false); setForgotError(null); setShowForgotPassword(true); }}
                  className="text-xs font-semibold text-[#6c47ff]"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Remember me — login only */}
            {mode === "login" && (
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div
                  onClick={() => setRememberMe(r => !r)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    rememberMe ? "bg-[#6c47ff] border-[#6c47ff]" : "bg-white border-[#d0ccc8]"
                  }`}
                >
                  {rememberMe && (
                    <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                      <path d="M1 4l3 3 6-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-[#4a4a4a] font-medium">Remember my email</span>
              </label>
            )}

            {/* Google OAuth hint */}
            {showGoogleHint && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <p className="text-sm text-blue-700 leading-snug">
                  Looks like you signed up with Google. Please use{" "}
                  <strong>Continue with Google</strong> to log in, or{" "}
                  <button
                    type="button"
                    className="underline font-semibold"
                    onClick={() => { setForgotEmail(email); setForgotSent(false); setForgotError(null); setShowForgotPassword(true); }}
                  >
                    reset your password
                  </button>{" "}
                  to set one.
                </p>
              </div>
            )}

            {/* Error */}
            {error && !showGoogleHint && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full h-14 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                mode === "signup" ? "Create account" : "Log in"
              )}
            </button>

            {/* Toggle mode */}
            <p className="text-center text-sm text-[#7a7570]">
              {mode === "signup" ? "Already have an account? " : "Don't have an account? "}
              <button
                type="button"
                onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(null); setShowGoogleHint(false); }}
                className="text-[#6c47ff] font-semibold"
              >
                {mode === "signup" ? "Log in" : "Sign up"}
              </button>
            </p>

          </form>
        </div>

        {/* Forgot Password modal */}
        {showForgotPassword && (
          <div className="fixed inset-0 z-[200] flex items-end bg-black/40" onClick={() => setShowForgotPassword(false)}>
            <div className="w-full bg-white rounded-t-3xl px-6 pt-6 pb-10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="w-10 h-1 rounded-full bg-[#e8e4df] mx-auto mb-5" />
              <h3 className="font-bold text-[#1a1a1a] text-lg mb-1">Reset your password</h3>
              <p className="text-sm text-[#7a7570] mb-5">We&apos;ll send a reset link to your email.</p>

              {forgotSent ? (
                <div className="flex flex-col items-center text-center py-4 gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#dcfce7] flex items-center justify-center">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <p className="text-sm font-semibold text-[#1a1a1a]">Check your email for a reset link</p>
                  <button
                    type="button"
                    className="mt-2 text-sm font-semibold text-[#6c47ff]"
                    onClick={() => setShowForgotPassword(false)}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#7a7570] uppercase tracking-wider">Email</label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@email.com"
                      autoComplete="email"
                      required
                      className="h-12 rounded-xl border border-[#e8e4df] px-4 text-sm text-[#1a1a1a] bg-white outline-none focus:border-[#6c47ff] transition-colors placeholder-[#b0aaa5]"
                    />
                  </div>
                  {forgotError && (
                    <p className="text-xs text-red-500">{forgotError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full h-13 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)", height: 52 }}
                  >
                    {forgotLoading ? <Loader2 size={18} className="animate-spin" /> : "Send reset link"}
                  </button>
                  <button
                    type="button"
                    className="text-sm text-[#7a7570] font-medium text-center"
                    onClick={() => setShowForgotPassword(false)}
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Landing view ──────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero */}
      <div
        className="relative flex flex-col items-center justify-center text-center overflow-hidden px-8 pt-16 pb-14"
        style={{ background: "linear-gradient(175deg, #0f0a1e 0%, #1a1040 50%, #2d1b69 100%)" }}
      >
        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(108,71,255,0.30) 0%, transparent 70%)" }} />
        </div>

        {/* Brand */}
        <div className="relative z-10 mb-4">
          <SkillSnapLogo variant="full" size="xl" dark />
        </div>

        <p className="relative z-10 text-base font-semibold mb-2" style={{ color: "#a78bfa" }}>
          {APP_CONFIG.tagline}
        </p>
        <p className="relative z-10 text-sm leading-relaxed max-w-[260px]" style={{ color: "rgba(255,255,255,0.50)" }}>
          {APP_CONFIG.subtitle}
        </p>

        {/* Skill pills — consistent, clean social proof */}
        <div className="relative z-10 mt-8 flex flex-wrap gap-2 justify-center max-w-[300px]">
          {[
            { label: "✂️ Barbers", color: "#667eea" },
            { label: "🔧 Tradies", color: "#4facfe" },
            { label: "💄 Makeup", color: "#f093fb" },
            { label: "🧹 Cleaning", color: "#43e97b" },
            { label: "💅 Nails", color: "#fa709a" },
            { label: "💪 Fitness", color: "#a78bfa" },
          ].map(({ label, color }) => (
            <span
              key={label}
              className="px-3 py-1.5 rounded-full text-[12px] font-semibold text-white"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, white)" }} />
      </div>

      {/* CTA section */}
      <div className="px-5 pt-5 pb-10 flex flex-col gap-3 bg-white">
        {/* Google — primary */}
        {/* <GoogleButton onClick={handleGoogleSignIn} loading={googleLoading} /> */}

        {/* <OrDivider /> */}

        <button
          onClick={() => setMode("signup")}
          className="w-full h-14 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] shadow-sm"
          style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)", boxShadow: "0 4px 16px rgba(108,71,255,0.30)" }}
        >
          Sign up with email
        </button>
        <button
          onClick={() => setMode("login")}
          className="w-full h-14 rounded-2xl font-semibold text-base text-[#6c47ff] border-2 border-[#6c47ff]/30 bg-white transition-all active:scale-[0.98]"
        >
          Log in with email
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-sm text-red-600 text-center">{error}</p>
          </div>
        )}

        <p className="text-center text-[11px] text-[#b0aaa5]">
          By continuing, you agree to our Terms &amp; Privacy Policy
        </p>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────

function isAutoGeneratedUsername(username: string): boolean {
  // Auto-generated usernames end with _xxxx (4 alphanumeric chars from UUID)
  return /@?[a-z0-9_]+_[a-z0-9]{4}$/.test(username.toLowerCase());
}

const SUPABASE_CONFIGURED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref");

function UsernameSetupStep({ user, onDone }: { user: User; onDone: () => void }) {
  const suggested = (user.displayName ?? "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  const [value, setValue] = useState(suggested);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const username = value.trim().toLowerCase();

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      setError("3–20 characters: letters, numbers, underscores only.");
      return;
    }

    setError(null);
    setChecking(true);

    try {
      if (SUPABASE_CONFIGURED) {
        const { getAuthSupabase } = await import("@/lib/supabase");

        const { data: existing } = await getAuthSupabase()
          .from("profiles")
          .select("id")
          .eq("username", "@" + username)
          .neq("id", user.id)
          .maybeSingle();

        if (existing) { setError("That username is already taken."); setChecking(false); return; }

        setSaving(true);
        const { error: updateError } = await getAuthSupabase()
          .from("profiles")
          .update({ username: "@" + username })
          .eq("id", user.id);

        if (updateError) {
          setError("Failed to save username. Please try again.");
          setSaving(false);
          setChecking(false);
          return;
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setChecking(false);
      setSaving(false);
      return;
    }

    setChecking(false);
    setSaving(false);
    onDone();
  }

  return (
    <div className="flex flex-col min-h-screen bg-white px-5 pt-14 pb-10">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-[#1a1a1a] mb-2">Choose your username</h1>
        <p className="text-[#7a7570] text-sm leading-relaxed">This is how people find you on SkillSnap</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-center gap-2 border-2 border-[#e8e4df] rounded-2xl px-4 h-14 focus-within:border-[#6c47ff] transition-colors bg-[#fafafa]">
          <span className="text-[#b0aaa5] font-semibold text-base select-none">@</span>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => { setValue(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")); setError(null); }}
            placeholder="your_username"
            maxLength={20}
            autoComplete="off"
            autoCapitalize="none"
            className="flex-1 bg-transparent text-[#1a1a1a] text-base font-semibold placeholder-[#c0bcb8] outline-none"
          />
        </div>

        {error && <p className="text-xs text-red-500 font-medium px-1">{error}</p>}

        <p className="text-[11px] text-[#b0aaa5] px-1">3–20 characters · letters, numbers, underscores</p>

        <button
          type="submit"
          disabled={checking || saving || value.length < 3}
          className="w-full h-14 rounded-2xl font-bold text-base text-white mt-2 flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
          style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
        >
          {(checking || saving) ? <><Loader2 size={18} className="animate-spin" /> Checking…</> : "Continue →"}
        </button>
      </form>
    </div>
  );
}

