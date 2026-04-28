"use client";
import { useState, useRef } from "react";
import { ArrowLeft, Camera, Loader2, CheckCircle, MapPin, X } from "lucide-react";
import type { Screen, SkillCategory } from "@/types";
import { SKILL_CATEGORIES } from "@/constants/config";
import { useAppState } from "@/state/AppState";
import { useToast } from "./shared/Toast";

const SUPABASE_CONFIGURED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref");

interface EditProfileScreenProps {
  onNavigate: (s: Screen) => void;
}

export default function EditProfileScreen({ onNavigate }: EditProfileScreenProps) {
  const { state, dispatch } = useAppState();
  const { showToast } = useToast();
  const user = state.currentUser;

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [username, setUsername] = useState(user?.username?.replace("@", "") ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [location, setLocation] = useState(user?.location ?? "");

  const knownSkills = SKILL_CATEGORIES as readonly string[];
  const stored = user?.skill ?? "";
  const isCustom = !!stored && !knownSkills.includes(stored);

  const [skill, setSkill] = useState<string>(isCustom ? "Other" : stored);
  const [customSkill, setCustomSkill] = useState(isCustom ? stored : "");

  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  const resolvedSkill = skill === "Other" ? customSkill.trim() : skill;

  function handleChipPress(cat: string) {
    if (cat === "Other") {
      if (skill === "Other") {
        setSkill("");
        setCustomSkill("");
      } else {
        setSkill("Other");
        setTimeout(() => customInputRef.current?.focus(), 50);
      }
    } else {
      setSkill(skill === cat ? "" : cat);
      setCustomSkill("");
    }
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be under 5MB", "info");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!displayName.trim()) {
      showToast("Display name is required", "info");
      return;
    }
    setSaving(true);
    try {
      const isAuthenticated = SUPABASE_CONFIGURED && !!state.currentUser && !state.isGuest;
      let persistedAvatarUrl: string | undefined = user?.avatarUrl;

      if (isAuthenticated) {
        if (avatarFile) {
          try {
            const { uploadService } = await import("@/services/uploadService");
            persistedAvatarUrl = await uploadService.uploadAvatar(avatarFile);
          } catch (e) {
            console.warn("Avatar upload failed:", e);
          }
        }
        try {
          const { userService } = await import("@/services/userService");
          await userService.updateProfile({
            displayName: displayName.trim(),
            username: `@${username.trim()}`,
            bio: bio.trim(),
            location: location.trim(),
            skill: resolvedSkill || null,
            ...(persistedAvatarUrl ? { avatarUrl: persistedAvatarUrl } : {}),
          });
        } catch (e) {
          console.warn("Profile update failed:", e);
        }
      } else {
        await new Promise((r) => setTimeout(r, 600));
      }

      const inMemoryAvatarUrl: string | undefined =
        persistedAvatarUrl ?? (avatarPreview?.startsWith("blob:") ? undefined : (avatarPreview ?? undefined));

      dispatch({
        type: "UPDATE_CURRENT_USER",
        patch: {
          displayName: displayName.trim(),
          username: `@${username.trim()}`,
          bio: bio.trim(),
          location: location.trim(),
          skill: (resolvedSkill || null) as SkillCategory | null,
          ...(inMemoryAvatarUrl !== undefined ? { avatarUrl: inMemoryAvatarUrl } : {}),
        },
      });

      setSaved(true);
      setTimeout(() => onNavigate("own-profile"), 1200);
    } catch (err) {
      console.error("Save profile error:", err);
      showToast("Failed to save. Please try again.", "info");
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  const initials = displayName.trim() ? displayName.trim()[0].toUpperCase() : "?";

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f7f5]">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e8e4df] flex items-center gap-3 px-4 h-14">
        <button onClick={() => onNavigate("own-profile")} className="text-[#7a7570]">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-base text-[#1a1a1a] flex-1">Edit Profile</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-sm font-bold text-[#6c47ff] disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : "Save"}
        </button>
      </header>

      {saved ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 px-6">
          <div className="w-16 h-16 rounded-full bg-[#dcfce7] flex items-center justify-center">
            <CheckCircle size={30} className="text-green-500" />
          </div>
          <p className="font-bold text-[#1a1a1a] text-lg">Profile updated!</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
          {/* Avatar */}
          <div className="flex flex-col items-center py-8 bg-white border-b border-[#e8e4df]">
            <div className="relative">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
              ) : (
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-3xl border-4 border-white shadow-md" style={{ background: user.avatarGradient }}>
                  {initials}
                </div>
              )}
              <button onClick={() => avatarInputRef.current?.click()} className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-[#6c47ff] flex items-center justify-center text-white shadow-md border-2 border-white">
                <Camera size={16} />
              </button>
            </div>
            <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
            <p className="text-xs text-[#b0aaa5] mt-3">Tap camera to change photo</p>
          </div>

          {/* Form */}
          <div className="px-4 py-5 flex flex-col gap-5">
            <Field label="Display Name">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value.slice(0, 50))}
                placeholder="Your full name"
                className="w-full bg-white rounded-2xl border border-[#e8e4df] px-4 h-12 text-sm text-[#1a1a1a] placeholder-[#b0aaa5] outline-none focus:border-[#6c47ff] transition-colors"
              />
            </Field>

            <Field label="Username">
              <div className="flex items-center bg-white rounded-2xl border border-[#e8e4df] px-4 h-12 gap-1 focus-within:border-[#6c47ff] transition-colors">
                <span className="text-[#b0aaa5] text-sm">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 30))}
                  placeholder="username"
                  className="flex-1 bg-transparent text-sm text-[#1a1a1a] placeholder-[#b0aaa5] outline-none"
                />
              </div>
            </Field>

            <Field label="Bio">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 200))}
                rows={3}
                placeholder="Describe your skills and experience…"
                className="w-full bg-white rounded-2xl border border-[#e8e4df] px-4 py-3 text-sm text-[#1a1a1a] placeholder-[#b0aaa5] resize-none outline-none focus:border-[#6c47ff] transition-colors leading-relaxed"
              />
              <p className="text-right text-xs text-[#b0aaa5] mt-1">{bio.length} / 200</p>
            </Field>

            <Field label="Location">
              <div className="flex items-center bg-white rounded-2xl border border-[#e8e4df] px-4 h-12 gap-2.5 focus-within:border-[#6c47ff] transition-colors">
                <MapPin size={15} className="text-[#6c47ff] flex-shrink-0" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Liverpool, NSW"
                  className="flex-1 bg-transparent text-sm text-[#1a1a1a] placeholder-[#b0aaa5] outline-none"
                />
              </div>
            </Field>

            {/* Skill Category */}
            <Field label="Skill Category">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {(SKILL_CATEGORIES as readonly string[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleChipPress(cat)}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "6px 14px",
                      borderRadius: 999,
                      border: `1.5px solid ${skill === cat ? "#6c47ff" : "#e8e4df"}`,
                      background: skill === cat ? "#6c47ff" : "#fff",
                      color: skill === cat ? "#fff" : "#7a7570",
                      cursor: "pointer",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Custom input — shown when Other is selected */}
              <div style={{ display: skill === "Other" ? "block" : "none", marginTop: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "2px solid #6c47ff", borderRadius: 16, padding: "0 16px", height: 48 }}>
                  <input
                    ref={customInputRef}
                    type="text"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value.slice(0, 40))}
                    placeholder="e.g. Carpenter, Hairdresser, Chef…"
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, color: "#1a1a1a" }}
                  />
                  {customSkill ? (
                    <button type="button" onClick={() => setCustomSkill("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#b0aaa5" }}>
                      <X size={14} />
                    </button>
                  ) : null}
                </div>
                <p style={{ fontSize: 12, color: "#b0aaa5", marginTop: 6, paddingLeft: 4 }}>
                  This is what clients will see on your profile.
                </p>
              </div>

              {/* Live preview */}
              {resolvedSkill ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#b0aaa5", textTransform: "uppercase", letterSpacing: 1 }}>Preview:</span>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: "#ede9fe", color: "#5b3dd8" }}>
                    {resolvedSkill}
                  </span>
                </div>
              ) : null}
            </Field>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-14 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}
            >
              {saving ? <><Loader2 size={20} className="animate-spin" /> Saving…</> : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold text-[#7a7570] uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
