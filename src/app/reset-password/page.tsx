"use client";
import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, CheckCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import SkillSnapLogo from "@/components/skillsnap/shared/SkillSnapLogo";

// Single client instance shared between session setup and updateUser.
// Uses the same storageKey as the main app so any existing session is visible.
function makeClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        storageKey: "sb-skillsnap-auth-token",
        detectSessionInUrl:true,
        flowType: "implicit",
      },
    }
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const sbRef = useRef<SupabaseClient | null>(null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const sb = makeClient();
    sbRef.current = sb;

    async function initSession() {
      // Implicit flow: Supabase puts tokens in the URL hash
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const type = hashParams.get("type");

      if (accessToken && type === "recovery") {
        window.history.replaceState({}, "", window.location.pathname);
        const { error: setErr } = await sb.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken ?? "",
        });
        if (setErr) {
          setError("Invalid or expired reset link. Please request a new one.");
          return;
        }
        setSessionReady(true);
        return;
      }

      // Already have a session (e.g. PKCE exchanged by main app before redirect)
      const { data: { session } } = await sb.auth.getSession();
      if (session) {
        setSessionReady(true);
        return;
      }

      // ?code= landed directly on this page
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        window.history.replaceState({}, "", window.location.pathname);
        const { error: exchErr } = await sb.auth.exchangeCodeForSession(code);
        if (exchErr) {
          setError("Invalid or expired reset link. Please request a new one.");
          return;
        }
        setSessionReady(true);
        return;
      }

      setError("No reset token found. Please use the link from your email.");
    }

    initSession();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!password || !confirm) { setError("Please fill in both fields."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }

    const sb = sbRef.current;
    if (!sb) { setError("Client not ready. Please refresh."); return; }

    setSaving(true);
    try {
      const { error: err } = await sb.auth.updateUser({ password });
      if (err) { setError(err.message); return; }
      setDone(true);
      setTimeout(() => router.push("/"), 2000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "linear-gradient(175deg, #0f0a1e 0%, #1a1040 50%, #2d1b69 100%)" }}
    >
      {/* Radial glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div style={{
          position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(108,71,255,0.25) 0%, transparent 70%)"
        }} />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex justify-center mb-10">
          <SkillSnapLogo variant="full" size="lg" dark />
        </div>

        {done ? (
          <div className="flex flex-col items-center text-center py-8 gap-4">
            <div className="rounded-full flex items-center justify-center"
              style={{ background: "rgba(34,197,94,0.15)", width: 72, height: 72 }}>
              <CheckCircle size={36} className="text-green-400" />
            </div>
            <h2 className="font-bold text-white text-xl">Password updated!</h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
              Taking you back to the app…
            </p>
            <Loader2 size={18} className="animate-spin text-[#a78bfa] mt-2" />
          </div>
        ) : (
          <>
            <h1 className="font-extrabold text-white text-2xl mb-2 text-center">
              Set New Password
            </h1>
            <p className="text-sm text-center mb-8 leading-relaxed"
              style={{ color: "rgba(255,255,255,0.50)" }}>
              Choose a strong password for your account.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: "rgba(255,255,255,0.50)" }}>
                  New Password
                </label>
                <div className="flex items-center h-14 px-4 rounded-2xl gap-2"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="flex-1 bg-transparent text-sm outline-none placeholder-white/30"
                    style={{ color: "white" }}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPw(s => !s)}
                    className="flex-shrink-0" style={{ color: "rgba(255,255,255,0.40)" }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: "rgba(255,255,255,0.50)" }}>
                  Confirm Password
                </label>
                <div className="flex items-center h-14 px-4 rounded-2xl gap-2"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  <input
                    type={showCf ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat new password"
                    className="flex-1 bg-transparent text-sm outline-none placeholder-white/30"
                    style={{ color: "white" }}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowCf(s => !s)}
                    className="flex-shrink-0" style={{ color: "rgba(255,255,255,0.40)" }}>
                    {showCf ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl px-4 py-3"
                  style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.30)" }}>
                  <p className="text-sm text-red-400 text-center">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={saving || !sessionReady}
                className="w-full h-14 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
                style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)", boxShadow: "0 4px 20px rgba(108,71,255,0.40)" }}
              >
                {saving ? <Loader2 size={20} className="animate-spin" /> : "Update Password"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/")}
                className="text-sm text-center font-medium mt-1"
                style={{ color: "rgba(255,255,255,0.40)" }}
              >
                Back to sign in
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
