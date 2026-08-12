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
import PasswordRequirements from "./shared/PasswordRequirements";
import { checkPassword, PASSWORD_ERROR } from "@/lib/password";
import { isResetEmailLikelySent, RESET_EMAIL_SENT_MESSAGE } from "@/lib/authErrors";
import { useAppState } from "@/state/AppState";
import { useToast } from "./shared/Toast";

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
      className="w-full h-14 rounded-2xl font-semibold text-sm text-[#ffffff] border border-[#26203f] bg-[#16122a] flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-60 shadow-sm hover:border-[#d0ccc8] hover:shadow-md"
    >
      {loading ? <Loader2 size={18} className="animate-spin text-[#9d97b5]" /> : <GoogleIcon />}
      Continue with Google
    </button>
  );
}

// Trade chips shown in the hero marquee (kept from the web set).
const SKILL_PILLS = [
  { label: "✂️ Barbers" },
  { label: "🔧 Tradies" },
  { label: "💄 Makeup" },
  { label: "🧹 Cleaning" },
  { label: "💅 Nails" },
  { label: "💪 Fitness" },
];

// Content column width. The mobile is phone-width (no max-width); on web we cap
// the centred content here so it stays full-width on phones but stops stretching
// on desktop. Shared by the chip marquee and the button group.
const AUTH_CONTENT_MAX = 400;

// Mobile marquee speed: 1px every 32ms ≈ 31.25 px/s.
const MARQUEE_PX_PER_SEC = 31.25;

// ── "or" divider ─────────────────────────────
function OrDivider() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-[#26203f]" />
      <span className="text-xs text-[#6f6889] font-medium">or</span>
      <div className="flex-1 h-px bg-[#26203f]" />
    </div>
  );
}

export default function AuthScreen({ onNavigate }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>("landing");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (mode === "signup") {
      document.title = "Join SkillSnap Free | Show Your Work, Get Hired Locally";
    }
  }, [mode]);
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
  const [showGoogleSuggestion, setShowGoogleSuggestion] = useState(false);

  const { dispatch, state } = useAppState();
  const { showToast } = useToast();

  // Chip marquee: measure one copy's width once and derive the animation
  // duration so the CSS scroll runs at the mobile's ~31px/s. A one-time read,
  // not an interval — the animation itself is pure CSS.
  const pillsTrackRef = useRef<HTMLDivElement>(null);
  const [pillsDur, setPillsDur] = useState(0);
  useEffect(() => {
    const el = pillsTrackRef.current;
    if (!el) return;
    const oneCopy = el.scrollWidth / 2; // two copies rendered end to end
    if (oneCopy > 0) setPillsDur(oneCopy / MARQUEE_PX_PER_SEC);
  }, []);

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
    if (state.isReviewMode) { showToast("Writes are disabled in review mode"); return; }
    setForgotError(null);
    if (!forgotEmail.trim()) { setForgotError("Please enter your email."); return; }
    setForgotLoading(true);
    try {
      // resetPasswordForEmail uses the shared singleton. Supabase sends the token in the
      // URL hash (#access_token=...&type=recovery) via implicit flow configured on the project.
      const { getSupabase } = await import("@/lib/supabase");
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error: err } = await getSupabase().auth.resetPasswordForEmail(forgotEmail.trim(), { redirectTo });
      // A 5xx here usually means the mail already went out and GoTrue tripped
      // afterwards — showing an error would tell the user the opposite of what
      // just landed in their inbox.
      if (err && !isResetEmailLikelySent(err)) { setForgotError(err.message); return; }
      setForgotSent(true);
    } catch {
      setForgotError("Something went wrong. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    if (state.isReviewMode) { showToast("Writes are disabled in review mode"); return; }
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
    if (state.isReviewMode) { showToast("Writes are disabled in review mode"); return; }
    setError(null);
    if (mode === "signup" && !displayName.trim()) {
      setError("Full name is required.");
      return;
    }
    // Belt-and-braces: the submit button is already disabled below, but a
    // form can still be submitted by pressing Enter in a text field.
    if (mode === "signup" && !checkPassword(password).valid) {
      setError(PASSWORD_ERROR);
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
        // The provider notice is only for errors Supabase actually attributes
        // to a provider. A wrong password is not one of those — see
        // PROVIDER_ERROR_CODES — so it now gets the plain credential error.
        if (mode === "login" && result.providerMismatch) {
          setShowGoogleHint(true);
        }
        // Offered as a question rather than a diagnosis: a failed password
        // login genuinely might be a Google-only account, and nothing in the
        // response can tell us either way.
        if (mode === "login" && result.invalidCredentials) {
          setShowGoogleSuggestion(true);
        }
        setError(result.error ?? "Something went wrong. Please try again.");
      } else {
        if (rememberMe) {
          localStorage.setItem(SAVED_EMAIL_KEY, email);
        } else {
          localStorage.removeItem(SAVED_EMAIL_KEY);
        }
        if (result.user) {
          dispatch({ type: "SET_AUTH", user: result.user });
          // Let AppState reducer handle routing — it checks needsUsernameSetup and needsRoleSetup
          // Do not navigate manually here
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
  // ── Sign-up / Login form view ─────────────────
  if (mode !== "landing") {
    return (
      <div className="flex flex-col min-h-screen bg-[#16122a]">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-2">
          <button
            onClick={() => { setMode("landing"); setError(null); setShowGoogleHint(false); setShowGoogleSuggestion(false); }}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#1c1733] text-[#9d97b5]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <h2 className="font-bold text-lg text-[#ffffff]">
            {mode === "signup" ? "Create account" : "Welcome back"}
          </h2>
        </div>

        <div className="flex-1 flex flex-col px-6 pt-4 gap-4">
          {/* Google button — top of form */}
          <GoogleButton onClick={handleGoogleSignIn} loading={googleLoading} />
          <OrDivider />

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Full Name — sign up only, required */}
            {mode === "signup" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#9d97b5] uppercase tracking-wider">Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Name, business name or nickname"
                  autoComplete="name"
                  required
                  className="h-12 rounded-xl border border-[#26203f] px-4 text-sm text-[#ffffff] bg-[#16122a] outline-none focus:border-[#6c47ff] transition-colors placeholder-[#6f6889]"
                />
              </div>
            )}

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#9d97b5] uppercase tracking-wider">
                {mode === "login" ? "Email or Username" : "Email"}
              </label>
              <input
                type={mode === "login" ? "text" : "email"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={mode === "login" ? "Email or username" : "you@email.com"}
                autoComplete={mode === "signup" ? "email" : "username"}
                required
                className="h-12 rounded-xl border border-[#26203f] px-4 text-sm text-[#ffffff] bg-[#16122a] outline-none focus:border-[#6c47ff] transition-colors placeholder-[#6f6889]"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#9d97b5] uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "Min 8 characters" : "Your password"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  required
                  minLength={8}
                  className="w-full h-12 rounded-xl border border-[#26203f] px-4 pr-12 text-sm text-[#ffffff] bg-[#16122a] outline-none focus:border-[#6c47ff] transition-colors placeholder-[#6f6889]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6f6889] hover:text-[#9d97b5]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {/* Requirements only apply when choosing a password, not when
                  typing an existing one at login */}
              {mode === "signup" && <PasswordRequirements password={password} />}
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
                    rememberMe ? "bg-[#6c47ff] border-[#6c47ff]" : "bg-[#16122a] border-[#d0ccc8]"
                  }`}
                >
                  {rememberMe && (
                    <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                      <path d="M1 4l3 3 6-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-[#b8b2cc] font-medium">Remember my email</span>
              </label>
            )}

            {/* Google OAuth hint */}
            {showGoogleHint && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3">
                <p className="text-sm text-blue-300 leading-snug">
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

            {/* Error — always shown. It used to be suppressed whenever the
                Google notice appeared, so a mistyped password reported only
                the Google message and never what had actually gone wrong. */}
            {error && !showGoogleHint && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <p className="text-sm text-red-400">{error}</p>
                {showGoogleSuggestion && (
                  <p className="text-xs mt-1.5" style={{ color: "var(--ss-text-muted)" }}>
                    Signed up with Google? Use <strong>Continue with Google</strong> above.
                  </p>
                )}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={
                loading || !email || !password ||
                (mode === "signup" && !checkPassword(password).valid)
              }
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
            <p className="text-center text-sm text-[#9d97b5]">
              {mode === "signup" ? "Already have an account? " : "Don't have an account? "}
              <button
                type="button"
                onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(null); setShowGoogleHint(false); setShowGoogleSuggestion(false); }}
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
            <div className="w-full bg-[#16122a] rounded-t-3xl px-6 pt-6 pb-10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="w-10 h-1 rounded-full bg-[#26203f] mx-auto mb-5" />
              <h3 className="font-bold text-[#ffffff] text-lg mb-1">Reset your password</h3>
              <p className="text-sm text-[#9d97b5] mb-5">We&apos;ll send a reset link to your email.</p>

              {forgotSent ? (
                <div className="flex flex-col items-center text-center py-4 gap-3">
                  <div className="w-12 h-12 rounded-full bg-[rgba(16,185,129,0.14)] flex items-center justify-center">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <p className="text-sm font-semibold text-[#ffffff]">{RESET_EMAIL_SENT_MESSAGE}</p>
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
                    <label className="text-xs font-bold text-[#9d97b5] uppercase tracking-wider">Email</label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@email.com"
                      autoComplete="email"
                      required
                      className="h-12 rounded-xl border border-[#26203f] px-4 text-sm text-[#ffffff] bg-[#16122a] outline-none focus:border-[#6c47ff] transition-colors placeholder-[#6f6889]"
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
                    className="text-sm text-[#9d97b5] font-medium text-center"
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
    <div className="flex flex-col min-h-screen bg-[#16122a]">
      {/* Hero */}
      <div
        className="relative flex flex-col items-center justify-center text-center overflow-hidden px-8 pt-16 pb-14"
        style={{ background: "linear-gradient(175deg, #0f0a1e 0%, #1a1040 50%, #2d1b69 100%)" }}
      >
        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(108,71,255,0.30) 0%, transparent 70%)" }} />
        </div>

        {/* Brand — icon above wordmark, ported from mobile (mark 108px, 14px gap) */}
        <div className="relative z-10 flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/skillsnap-icon.svg"
            alt=""
            aria-hidden="true"
            style={{ height: 108, width: "auto", display: "block" }}
          />
          <div style={{ marginTop: 14 }}>
            <SkillSnapLogo variant="full" size="xl" dark />
          </div>
        </div>

        {/* Headline — ported from mobile: 22px / 800 / #ffffff */}
        <p className="relative z-10" style={{ color: "#ffffff", fontSize: 22, fontWeight: 800, marginTop: 16 }}>
          {APP_CONFIG.tagline}
        </p>
        {/* Subtitle — ported from mobile: 13px / rgba(255,255,255,0.5) */}
        <p className="relative z-10 max-w-[260px]" style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 6 }}>
          {APP_CONFIG.subtitle}
        </p>

        {/* Skill pills — single-row marquee, ported from mobile. Centred and
            capped to the shared content width; two duplicated copies scrolled
            with a CSS animation at ~31px/s (see <style jsx> below). */}
        <div
          className="relative z-10 w-full mx-auto overflow-hidden"
          style={{
            maxWidth: AUTH_CONTENT_MAX,
            marginTop: 24,
            // Soft edges so chips fade out at both ends instead of hard-clipping
            // mid-chip. Web-only; the mobile row is untouched.
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%)",
            maskImage:
              "linear-gradient(to right, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%)",
          }}
        >
          <div
            ref={pillsTrackRef}
            className="ss-auth-marquee flex items-center w-max"
            style={{ gap: 8, ...(pillsDur ? { ["--marquee-dur" as string]: `${pillsDur}s` } : {}) }}
          >
            {["a", "b"].map((copy) =>
              SKILL_PILLS.map(({ label }) => (
                <span
                  key={`${label}-${copy}`}
                  className="whitespace-nowrap text-white"
                  style={{
                    fontSize: 12,
                    padding: "8px 16px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "rgba(255,255,255,0.08)",
                  }}
                >
                  {label}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="px-5 pt-5 pb-10 bg-[#16122a]">
        {/* Button group + CTA text capped to the shared content width and centred
            — full-width on phones, no longer stretching on desktop. */}
        <div className="w-full mx-auto flex flex-col gap-3" style={{ maxWidth: AUTH_CONTENT_MAX }}>
        {/* Google — primary */}
        <GoogleButton onClick={handleGoogleSignIn} loading={googleLoading} />
        <OrDivider />

        <button
          onClick={() => setMode("signup")}
          className="w-full h-14 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] shadow-sm"
          style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)", boxShadow: "0 4px 16px rgba(108,71,255,0.30)" }}
        >
          Create Free Account
        </button>
        <button
          onClick={() => setMode("login")}
          className="w-full h-14 rounded-2xl font-semibold text-base text-[#6c47ff] border-2 border-[#6c47ff]/30 bg-[#16122a] transition-all active:scale-[0.98]"
        >
          Log in with email
        </button>

        <p className="text-center text-[12px] text-[#9d97b5] leading-relaxed -mt-1">
          Be among the first 1,000 local professionals and clients.
        </p>

        <button
          onClick={() => {
            dispatch({ type: "CONTINUE_AS_GUEST" });
            onNavigate("home");
          }}
          className="text-center text-xs text-[#6f6889] py-1"
        >
          Browse without signing up
        </button>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <p className="text-sm text-red-400 text-center">{error}</p>
          </div>
        )}

        <p className="text-center text-[11px] text-[#6f6889]">
          By continuing, you agree to our Terms &amp; Privacy Policy
        </p>
        <button
          onClick={() => onNavigate("contact")}
          className="text-center text-[11px] text-[#6c47ff] font-semibold"
        >
          Need help? Contact us
        </button>
        </div>
      </div>

      <style jsx>{`
        .ss-auth-marquee {
          animation: ss-auth-marquee var(--marquee-dur, 20s) linear infinite;
          will-change: transform;
        }
        @keyframes ss-auth-marquee {
          to {
            transform: translateX(-50%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .ss-auth-marquee {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

