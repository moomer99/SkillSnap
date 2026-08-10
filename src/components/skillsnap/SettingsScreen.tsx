"use client";
import { useState, useEffect } from "react";
import { ArrowLeft, ChevronRight, User, Lock, Bell, Shield, HelpCircle, FileText, LogOut, Trash2, Loader2, CheckCircle, Zap, Info, Mail, MessageSquare } from "lucide-react";
import type { Screen } from "@/types";
import { FEEDBACK_MAILTO } from "@/constants/contact";
import { useAppState } from "@/state/AppState";
import { getNotifPermission, requestNotifPermission } from "@/hooks/useNotifications";
import UserAvatar from "./shared/UserAvatar";
import { useToast } from "./shared/Toast";
import { isResetEmailLikelySent, RESET_EMAIL_SENT_MESSAGE } from "@/lib/authErrors";

const SUPABASE_CONFIGURED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref");

interface SettingsScreenProps {
  onNavigate: (s: Screen) => void;
}

export default function SettingsScreen({ onNavigate }: SettingsScreenProps) {
  const { state, dispatch } = useAppState();
  const { showToast } = useToast();
  const user = state.currentUser;

  const [showLogoutConfirm, setShowLogoutConfirm]         = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm]         = useState(false);
  const [showChangePassword, setShowChangePassword]   = useState(false);
  const [loggingOut, setLoggingOut]                   = useState(false);
  const [isOAuthUser, setIsOAuthUser]                 = useState(false);
  const [notifPerm, setNotifPerm]                     = useState(() =>
    typeof window !== "undefined" ? getNotifPermission() : "default"
  );

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return;
    import("@/lib/supabase").then(({ getAuthSupabase }) => {
      getAuthSupabase().auth.getSession().then(({ data }) => {
        const provider = data.session?.user?.app_metadata?.provider;
        setIsOAuthUser(provider === "google");
      });
    });
  }, []);


  async function handleLogout() {
    if (state.isReviewMode) { showToast("Writes are disabled in review mode"); return; }
    setLoggingOut(true);
    if (SUPABASE_CONFIGURED) {
      const { getSupabase } = await import("@/lib/supabase");
      await getSupabase().auth.signOut().catch(() => {});
    }
    dispatch({ type: "CLEAR_AUTH" });
  }

  async function handleEnableNotifs() {
    const result = await requestNotifPermission();
    setNotifPerm(result);
  }

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f7f5]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e8e4df] flex items-center gap-3 px-4 h-14">
        <button onClick={() => onNavigate("own-profile")} className="text-[#7a7570]">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-base text-[#1a1a1a] flex-1">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">

        {/* Pro upgrade banner */}
        <button
          onClick={() => onNavigate("pro")}
          className="w-full mx-4 mt-5 mb-4 rounded-2xl overflow-hidden active:scale-[0.98] transition-transform"
          style={{
            background: "linear-gradient(135deg, #0d0a1a, #1a0f3c, #2d1b69)",
            border: "1px solid rgba(167,139,250,0.25)",
            width: "calc(100% - 2rem)"
          }}
        >
          <div className="px-4 py-4 flex items-center gap-3">
            <div style={{
              width: 44, height: 44, borderRadius: 13,
              background: "linear-gradient(135deg, #6c47ff, #a78bfa)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 0 20px rgba(108,71,255,0.5)"
            }}>
              <Zap size={22} fill="white" color="white" />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-white font-bold text-base leading-tight">
                  SkillSnap Pro Plus
                </p>
                <span style={{
                  fontSize: 9, fontWeight: 700,
                  padding: "2px 7px", borderRadius: 99,
                  background: "rgba(251,191,36,0.2)",
                  color: "#fbbf24",
                  border: "1px solid rgba(251,191,36,0.3)"
                }}>
                  COMING SOON
                </span>
              </div>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                Get discovered and hired faster ⚡
              </p>
            </div>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 18 }}>›</div>
          </div>
          <div style={{
            height: 3,
            background: "linear-gradient(90deg, #6c47ff, #a78bfa, #f472b6, #6c47ff)",
            backgroundSize: "200% 100%",
          }} />
        </button>

        {/* Profile summary card */}
        <div
          className="mx-4 mb-2 bg-white rounded-2xl border border-[#e8e4df] p-4 flex items-center gap-3 active:bg-[#f8f7f5] transition-colors cursor-pointer"
          onClick={() => onNavigate("edit-profile")}
        >
          <UserAvatar user={user} size="md" showVerified={user.isVerified} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#1a1a1a] text-sm truncate">{user.displayName}</p>
            <p className="text-xs text-[#7a7570] truncate">{user.username}</p>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-[#6c47ff]">
            Edit <ChevronRight size={14} />
          </div>
        </div>

        {/* Account */}
        {!isOAuthUser && (
          <>
            <SectionHeader title="Account" />
            <SettingsGroup>
              <SettingsRow
                icon={<Lock size={16} className="text-[#0284c7]" />}
                iconBg="#e0f2fe"
                label="Change Password"
                onPress={() => setShowChangePassword(true)}
              />
            </SettingsGroup>
          </>
        )}

        {/* Notifications */}
        <SectionHeader title="Notifications" />
        <SettingsGroup>
          <SettingsRow
            icon={<Bell size={16} className="text-[#d97706]" />}
            iconBg="#fef3c7"
            label="Message Notifications"
            value={
              notifPerm === "granted" ? "On" :
              notifPerm === "denied"  ? "Blocked" : "Off"
            }
            valueColor={notifPerm === "granted" ? "#059669" : notifPerm === "denied" ? "#dc2626" : "#b0aaa5"}
            onPress={notifPerm !== "denied" ? handleEnableNotifs : undefined}
            hint={notifPerm === "denied" ? "Allow in browser settings" : undefined}
          />
        </SettingsGroup>

        {/* Privacy & Security */}
        <SectionHeader title="Privacy & Security" />
        <SettingsGroup>
          <SettingsRow
            icon={<Shield size={16} className="text-[#059669]" />}
            iconBg="#dcfce7"
            label="Profile Visibility"
            value="Public"
            valueColor="#b0aaa5"
            onPress={() => {}}
            badge="Soon"
          />
        </SettingsGroup>

        {/* Support */}
        <SectionHeader title="Support" />
        <SettingsGroup>
          <SettingsRow
            icon={<HelpCircle size={16} className="text-[#6c47ff]" />}
            iconBg="#ede9fe"
            label="Help & FAQ"
            onPress={() => onNavigate("help")}
          />
          <Divider />
          <SettingsRow
            icon={<Mail size={16} className="text-[#0284c7]" />}
            iconBg="#e0f2fe"
            label="Contact Us"
            onPress={() => onNavigate("contact")}
          />
          <Divider />
          <SettingsRow
            icon={<MessageSquare size={16} className="text-[#6c47ff]" />}
            iconBg="#ede9fe"
            label="Feedback"
            hint="Tell us what to build next"
            onPress={() => { window.location.href = FEEDBACK_MAILTO; }}
          />
          <Divider />
          <SettingsRow
            icon={<Info size={16} className="text-[#7a7570]" />}
            iconBg="#f0eeea"
            label="About SkillSnap"
            onPress={() => onNavigate("about")}
          />
          <Divider />
          <SettingsRow
            icon={<FileText size={16} className="text-[#7a7570]" />}
            iconBg="#f0eeea"
            label="Terms & Privacy Policy"
            onPress={() => onNavigate("terms")}
          />
        </SettingsGroup>

        {/* Danger zone */}
        <SectionHeader title="Account Actions" />
        <SettingsGroup>
          <SettingsRow
            icon={<LogOut size={16} className="text-[#6c47ff]" />}
            iconBg="#ede9fe"
            label="Log Out"
            onPress={() => setShowLogoutConfirm(true)}
            labelColor="#6c47ff"
          />
          <Divider />
          <SettingsRow
            icon={<Trash2 size={16} className="text-red-500" />}
            iconBg="#fee2e2"
            label="Delete Account"
            onPress={() => setShowDeleteConfirm(true)}
            labelColor="#ef4444"
          />
        </SettingsGroup>

        <p className="text-center text-xs text-[#b0aaa5] mt-6 mb-2">SkillSnap v1.0</p>
      </div>

      {/* ── Log out confirm sheet ── */}
      {showLogoutConfirm && (
        <BottomSheet onClose={() => setShowLogoutConfirm(false)}>
          <div className="flex flex-col items-center text-center px-2 pb-2">
            <div className="w-14 h-14 rounded-full bg-[#ede9fe] flex items-center justify-center mb-4">
              <LogOut size={24} className="text-[#6c47ff]" />
            </div>
            <h3 className="font-bold text-[#1a1a1a] text-lg mb-1">Log out?</h3>
            <p className="text-sm text-[#7a7570] mb-6 leading-relaxed">
              You'll need to sign in again to access your account.
            </p>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full h-13 rounded-2xl font-bold text-base text-white mb-3 flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#6c47ff,#8b6af5)", height: 52 }}
            >
              {loggingOut ? <><Loader2 size={18} className="animate-spin" /> Logging out…</> : "Log Out"}
            </button>
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="w-full h-12 rounded-2xl font-semibold text-sm text-[#7a7570] bg-[#f0eeea]"
            >
              Cancel
            </button>
          </div>
        </BottomSheet>
      )}

      {/* ── Delete account confirm sheet ── */}
      {showDeleteConfirm && (
        <BottomSheet onClose={() => setShowDeleteConfirm(false)}>
          <div className="flex flex-col items-center text-center px-2 pb-2">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h3 className="font-bold text-[#1a1a1a] text-lg mb-1">Delete account?</h3>
            <p className="text-sm text-[#7a7570] mb-2 leading-relaxed">
              This will permanently delete your profile, posts, and all messages.
            </p>
            <p className="text-xs font-semibold text-red-500 mb-6">This action cannot be undone.</p>
            <button
              className="w-full h-13 rounded-2xl font-bold text-base text-white mb-3 bg-red-500 flex items-center justify-center"
              style={{ height: 52 }}
              onClick={() => {
                // TODO: call userService.deleteAccount() then CLEAR_AUTH
                setShowDeleteConfirm(false);
              }}
            >
              Yes, Delete My Account
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="w-full h-12 rounded-2xl font-semibold text-sm text-[#7a7570] bg-[#f0eeea]"
            >
              Cancel
            </button>
          </div>
        </BottomSheet>
      )}


      {/* ── Change password sheet ── */}
      {showChangePassword && (
        <ChangePasswordSheet onClose={() => setShowChangePassword(false)} userEmail={user.email ?? ""} />
      )}
    </div>
  );
}

// ── Change Password Sheet ──────────────────────────────────────────────────
function ChangePasswordSheet({ onClose, userEmail }: { onClose: () => void; userEmail: string }) {
  const [email, setEmail]   = useState(userEmail);
  const [sending, setSending] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState("");

  async function handleSend() {
    if (state.isReviewMode) { showToast("Writes are disabled in review mode"); return; }
    setError("");
    if (!email.trim()) { setError("Please enter your email."); return; }
    setSending(true);
    try {
      if (SUPABASE_CONFIGURED) {
        const { getSupabase } = await import("@/lib/supabase");
        const { error: err } = await getSupabase().auth.resetPasswordForEmail(email, {
          redirectTo: "https://skillsnap.com.au",
        });
        // See isResetEmailLikelySent — a 5xx generally means the mail is
        // already on its way and only GoTrue's bookkeeping failed.
        if (err && !isResetEmailLikelySent(err)) { setError(err.message); setSending(false); return; }
      } else {
        await new Promise((r) => setTimeout(r, 800));
      }
      setDone(true);
    } catch {
      setError("Failed to send reset email. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <BottomSheet onClose={onClose}>
      {done ? (
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-14 h-14 rounded-full bg-[#dcfce7] flex items-center justify-center mb-3">
            <CheckCircle size={28} className="text-green-500" />
          </div>
          <p className="font-bold text-[#1a1a1a] text-base mb-1">Reset link sent!</p>
          <p className="text-sm text-[#7a7570]">{RESET_EMAIL_SENT_MESSAGE}</p>
        </div>
      ) : (
        <>
          <h3 className="font-bold text-[#1a1a1a] text-base mb-2">Change Password</h3>
          <p className="text-sm text-[#7a7570] mb-4 leading-relaxed">We'll send a password reset link to your email.</p>
          <div className="mb-4">
            <label className="text-xs font-semibold text-[#7a7570] mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 px-4 rounded-2xl border border-[#e8e4df] bg-[#f8f7f5] text-sm text-[#1a1a1a] outline-none focus:border-[#6c47ff] transition-colors"
            />
          </div>
          {error && <p className="text-xs text-red-500 mb-3 text-center">{error}</p>}
          <button
            onClick={handleSend}
            disabled={sending}
            className="w-full rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#6c47ff,#8b6af5)", height: 52 }}
          >
            {sending ? <><Loader2 size={18} className="animate-spin" /> Sending…</> : "Send Reset Link"}
          </button>
        </>
      )}
    </BottomSheet>
  );
}

// ── Shared primitives ──────────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <p className="text-xs font-bold text-[#b0aaa5] uppercase tracking-wider px-4 mt-6 mb-2">
      {title}
    </p>
  );
}

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-4 bg-white rounded-2xl border border-[#e8e4df] overflow-hidden">
      {children}
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-[#f0eeea] ml-[60px]" />;
}

function SettingsRow({ icon, iconBg, label, value, valueColor, onPress, badge, hint, labelColor }: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value?: string;
  valueColor?: string;
  onPress?: () => void;
  badge?: string;
  hint?: string;
  labelColor?: string;
}) {
  return (
    <button
      onClick={onPress}
      disabled={!onPress}
      className="w-full flex items-center gap-3.5 px-4 py-3.5 active:bg-[#f8f7f5] transition-colors text-left disabled:opacity-100"
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold" style={{ color: labelColor ?? "#1a1a1a" }}>{label}</span>
        {hint && <p className="text-xs text-[#b0aaa5] mt-0.5">{hint}</p>}
      </div>
      {badge && (
        <span className="text-[10px] font-bold text-white bg-[#6c47ff] px-2 py-0.5 rounded-full flex-shrink-0">
          {badge}
        </span>
      )}
      {value && !badge && (
        <span className="text-xs font-semibold flex-shrink-0" style={{ color: valueColor ?? "#b0aaa5" }}>
          {value}
        </span>
      )}
      {onPress && !badge && (
        <ChevronRight size={15} className="text-[#d4cffe] flex-shrink-0" />
      )}
    </button>
  );
}


function BottomSheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-end" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-3xl px-5 pt-3 pb-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-[#e8e4df] mx-auto mb-5" />
        {children}
      </div>
    </div>
  );
}
