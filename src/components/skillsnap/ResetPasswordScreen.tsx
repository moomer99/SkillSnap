"use client";
import { useState } from "react";
import { CheckCircle, Eye, EyeOff } from "lucide-react";
import type { Screen } from "@/types";
import SkillSnapLogo from "./shared/SkillSnapLogo";

interface ResetPasswordScreenProps {
  onNavigate: (s: Screen) => void;
}

export default function ResetPasswordScreen({ onNavigate }: ResetPasswordScreenProps) {
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [showCf, setShowCf]       = useState(false);
  const [saving, setSaving]       = useState(false);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!password || !confirm) { setError("Please fill in both fields."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setSaving(true);
    try {
      const { getSupabase } = await import("@/lib/supabase");
      const { error: err } = await getSupabase().auth.updateUser({ password });
      if (err) { setError(err.message); return; }
      setDone(true);
      setTimeout(() => onNavigate("home"), 2000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f7f5] items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <SkillSnapLogo size="md" />
        </div>

        {done ? (
          <div className="flex flex-col items-center text-center py-8">
            <div className="w-16 h-16 rounded-full bg-[#dcfce7] flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h2 className="font-bold text-[#1a1a1a] text-lg mb-2">Password updated!</h2>
            <p className="text-sm text-[#7a7570]">Taking you to the app…</p>
          </div>
        ) : (
          <>
            <h1 className="font-extrabold text-[#1a1a1a] text-2xl mb-1 text-center">Set New Password</h1>
            <p className="text-sm text-[#7a7570] text-center mb-8 leading-relaxed">
              Choose a strong password for your account.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-[#7a7570] mb-1.5 block">New Password</label>
                <div className="flex items-center h-12 px-4 rounded-2xl border border-[#e8e4df] bg-white gap-2 focus-within:border-[#6c47ff] transition-colors">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="flex-1 bg-transparent text-sm text-[#1a1a1a] outline-none placeholder-[#b0aaa5]"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPw(s => !s)} className="text-[#b0aaa5] flex-shrink-0">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#7a7570] mb-1.5 block">Confirm Password</label>
                <div className="flex items-center h-12 px-4 rounded-2xl border border-[#e8e4df] bg-white gap-2 focus-within:border-[#6c47ff] transition-colors">
                  <input
                    type={showCf ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat new password"
                    className="flex-1 bg-transparent text-sm text-[#1a1a1a] outline-none placeholder-[#b0aaa5]"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowCf(s => !s)} className="text-[#b0aaa5] flex-shrink-0">
                    {showCf ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && <p className="text-xs text-red-500 text-center">{error}</p>}

              <button
                type="submit"
                disabled={saving}
                className="w-full h-13 rounded-2xl font-bold text-base text-white flex items-center justify-center disabled:opacity-60 mt-2"
                style={{ background: "linear-gradient(135deg,#6c47ff,#8b6af5)", height: 52 }}
              >
                {saving ? "Updating…" : "Update Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
