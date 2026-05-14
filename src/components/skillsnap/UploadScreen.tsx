"use client";
// ─────────────────────────────────────────────
// SkillSnap — Upload / Showcase Screen
// Wired to uploadService.createPost() + Supabase Storage
// ─────────────────────────────────────────────
import { useState, useRef } from "react";
import { Video, Image as ImageIcon, ChevronDown, ArrowLeft, Loader2, CheckCircle, Download } from "lucide-react";
import type { Screen } from "@/types";
import { uploadService } from "@/services/uploadService";
import { useAppState } from "@/state/AppState";

interface UploadScreenProps {
  onNavigate: (s: Screen) => void;
}

type ContentType = "video" | "photo" | "social";

export default function UploadScreen({ onNavigate }: UploadScreenProps) {
  const { state, dispatch } = useAppState();
  const [contentType, setContentType] = useState<ContentType>("video");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [showFullscreen, setShowFullscreen] = useState(false);
  const profileLocation = state.currentUser?.location ?? "";
  const [location, setLocation] = useState(profileLocation);
  const [locationEditing, setLocationEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [posted, setPosted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowed = ["video/mp4", "video/quicktime", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Unsupported file type. Use MP4 or MOV for video, JPG/PNG/WebP for photos.");
      e.target.value = "";
      return;
    }

    // Validate file size
    const maxMB = file.type.startsWith("video/") ? 60 : 10;
    if (file.size > maxMB * 1024 * 1024) {
      setError(`File too large. Maximum size is ${maxMB}MB.`);
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
  }

  function handleTypeSelect(type: ContentType) {
    setContentType(type);
    setSelectedFile(null);
    setPreviewUrl(null);
    // Always reset the input value so re-selecting the same type re-opens the picker
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function openPicker(type: ContentType) {
    // Set the correct accept attribute synchronously by writing it directly on the element
    // before calling click(), because React state updates are async
    if (fileInputRef.current) {
      fileInputRef.current.accept =
        type === "video" ? "video/mp4,video/quicktime" : "image/jpeg,image/png,image/webp";
      fileInputRef.current.value = "";
    }
    handleTypeSelect(type);
    // Defer the click so the input is reset first
    setTimeout(() => fileInputRef.current?.click(), 0);
  }

  // Convert file to a data URL so it works in any sandbox/iframe context
  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target!.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Capture a JPEG thumbnail from the already-rendered preview video element
  function capturePreviewThumbnail(): string | null {
    const vid = videoPreviewRef.current;
    if (!vid || vid.readyState < 2) return null;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = vid.videoWidth || 390;
      canvas.height = vid.videoHeight || 520;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.85);
    } catch {
      return null;
    }
  }

  async function handlePublish() {
    if (!caption.trim() && !selectedFile) {
      setError("Add a caption or select a file before publishing.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // Capture thumbnail from the preview video BEFORE createPost so it can be uploaded
      let thumbnailDataUrl: string | undefined;
      if (selectedFile?.type.startsWith("video/")) {
        thumbnailDataUrl = capturePreviewThumbnail() ?? undefined;
      }

      // Convert file to data URL before passing to service so it's sandbox-safe
      let dataUrl: string | undefined;
      if (selectedFile) {
        dataUrl = await fileToDataUrl(selectedFile);
      }

      const newPost = await uploadService.createPost({
        file: selectedFile ?? undefined,
        dataUrl,
        thumbnailDataUrl,
        caption: caption.trim(),
        skill: state.currentUser?.skill ?? "",
        location,
      });

      if (newPost) {
        // If thumbnail wasn't uploaded to Storage, use the local data URL for immediate display
        if (thumbnailDataUrl && !newPost.thumbnailUrl) {
          newPost.thumbnailUrl = thumbnailDataUrl;
        }
        dispatch({ type: "PREPEND_POST", post: newPost });
      }
      dispatch({ type: "REFRESH_FEED" });
      setPosted(true);
      setTimeout(() => onNavigate("own-profile"), 1400);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to publish. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (posted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8f7f5] gap-4 px-6">
        <div className="w-16 h-16 rounded-full bg-[#ede9fe] flex items-center justify-center">
          <CheckCircle size={32} className="text-[#6c47ff]" />
        </div>
        <p className="text-base font-bold text-[#1a1a1a]">Published!</p>
        <p className="text-sm text-[#7a7570]">Your work is now live on the feed</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#f8f7f5] overflow-hidden" style={{ height: "100dvh" }}>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e8e4df] flex items-center gap-3 px-4 h-14">
        <button onClick={() => onNavigate("home")} className="text-[#7a7570]">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-base text-[#1a1a1a] flex-1">Showcase Your Work</h1>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 pt-5 pb-10 flex flex-col gap-5">
        {/* Upload type */}
        <div>
          <label className="text-xs font-bold text-[#7a7570] uppercase tracking-wider mb-3 block">
            Choose content
          </label>
          <div className="flex flex-col gap-3">
            <UploadButton
              icon={<Video size={22} className="text-[#6c47ff]" />}
              title="Upload Video"
              subtitle="MP4 or MOV, up to 60MB"
              active={contentType === "video"}
              onClick={() => openPicker("video")}
            />
            <UploadButton
              icon={<ImageIcon size={22} className="text-[#6c47ff]" />}
              title="Upload Photo"
              subtitle="JPG, PNG or WebP, up to 10MB"
              active={contentType === "photo"}
              onClick={() => openPicker("photo")}
            />
            <SocialImportTip />
          </div>
          {/* Hidden file input — accept attribute set dynamically in openPicker() */}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Preview */}
        {previewUrl ? (
          <div className="rounded-2xl overflow-hidden border border-[#e8e4df] bg-white relative">
            {contentType === "video" ? (
              <video
                ref={videoPreviewRef}
                src={previewUrl}
                className="w-full max-h-[280px] object-cover"
                controls
                playsInline
                muted
              />
            ) : (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full max-h-[280px] object-cover cursor-pointer"
                onClick={() => setShowFullscreen(true)}
              />
            )}
            <button
              onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => contentType !== "social" && openPicker(contentType as "video" | "photo")}
            className="bg-white rounded-2xl border border-dashed border-[#c4b5fd] p-6 flex flex-col items-center gap-3 w-full"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#ede9fe] flex items-center justify-center">
              <Video size={26} className="text-[#6c47ff]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[#1a1a1a] mb-0.5">No content selected</p>
              <p className="text-xs text-[#7a7570]">Tap to choose a video or photo</p>
            </div>
          </button>
        )}

        {/* Caption */}
        <div>
          <label className="text-xs font-bold text-[#7a7570] uppercase tracking-wider mb-2 block">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, 150))}
            placeholder="Describe your work — what skill, what service, what result..."
            rows={3}
            className="w-full bg-white rounded-2xl border border-[#e8e4df] p-4 text-sm text-[#1a1a1a] placeholder-[#b0aaa5] resize-none outline-none focus:border-[#6c47ff] transition-colors leading-relaxed"
          />
          <p className="text-right text-xs text-[#b0aaa5] mt-1">{caption.length} / 150</p>
        </div>

        {/* Location */}
        <div>
          <label className="text-xs font-bold text-[#7a7570] uppercase tracking-wider mb-2 block">Location</label>
          {locationEditing ? (
            <div className="flex items-center bg-white rounded-2xl border-2 border-[#6c47ff] px-4 h-12 gap-2.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6c47ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onBlur={() => setLocationEditing(false)}
                autoFocus
                placeholder="e.g. Liverpool, NSW"
                className="flex-1 bg-transparent text-sm text-[#1a1a1a] placeholder-[#b0aaa5] outline-none"
              />
              {location && (
                <button onClick={() => { setLocation(""); }} className="text-[#b0aaa5] flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => setLocationEditing(true)}
              className="w-full bg-white rounded-2xl border border-[#e8e4df] px-4 h-12 flex items-center gap-2.5 active:bg-[#f8f7f5] transition-colors text-left"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6c47ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              <span className={`flex-1 text-sm font-medium ${location ? "text-[#1a1a1a]" : "text-[#b0aaa5]"}`}>
                {location || "Enter location…"}
              </span>
              {location && location === profileLocation ? (
                <span className="flex-shrink-0 text-[10px] text-[#6c47ff] font-semibold bg-[#ede9fe] px-2 py-0.5 rounded-full">Auto</span>
              ) : location ? (
                <button
                  onClick={(e) => { e.stopPropagation(); setLocation(profileLocation); }}
                  className="flex-shrink-0 text-[10px] text-[#b0aaa5] font-semibold bg-[#f0eeea] px-2 py-0.5 rounded-full active:bg-[#e8e4df]"
                >
                  Reset
                </button>
              ) : null}
            </button>
          )}
          <p className="text-xs text-[#b0aaa5] mt-1.5 px-1">Auto-filled from your profile · tap to edit</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Publish button — inside scroll so it's never hidden */}
        <div className="mt-2">
          <button
            onClick={handlePublish}
            disabled={loading || (!caption.trim() && !selectedFile)}
            className="w-full h-14 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2.5"
            style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)", boxShadow: "0 4px 20px rgba(108,71,255,0.35)" }}
          >
            {loading ? (
              <><Loader2 size={20} className="animate-spin" /> Publishing…</>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                Publish to Feed
              </>
            )}
          </button>
          <p className="text-center text-xs text-[#b0aaa5] mt-2">
            Your work will appear on the public feed
          </p>
        </div>
      </div>
      {showFullscreen && previewUrl && contentType === "photo" && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setShowFullscreen(false)}
        >
          <img
            src={previewUrl}
            alt="Full preview"
            className="w-full h-full object-contain"
          />
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 flex items-center justify-center text-white"
            onClick={() => setShowFullscreen(false)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

function SocialImportTip() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-[#e8e4df] bg-white overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-4 p-4 text-left active:bg-[#f8f7f5] transition-colors"
      >
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#f0eeea]">
          {/* Stacked platform mini-icons */}
          <div className="flex items-center gap-[-4px]">
            {/* TikTok */}
            <span className="w-6 h-6 rounded-full bg-black flex items-center justify-center text-[10px] leading-none -mr-1 z-30 shadow-sm">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.2 8.2 0 004.79 1.54V6.83a4.85 4.85 0 01-1.02-.14z"/>
              </svg>
            </span>
            {/* Instagram */}
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] z-20 shadow-sm" style={{ background: "linear-gradient(135deg,#f09433,#dc2743,#bc1888)" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                <rect x="2" y="2" width="20" height="20" rx="5"/>
                <circle cx="12" cy="12" r="4.5"/>
                <circle cx="17.5" cy="6.5" r="1.2" fill="white" stroke="none"/>
              </svg>
            </span>
          </div>
        </div>

        <div className="flex-1">
          <p className="text-sm font-semibold text-[#1a1a1a]">Import from TikTok or Instagram?</p>
          <p className="text-xs text-[#7a7570] mt-0.5">Quick 2-step guide to upload it here</p>
        </div>

        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#f0eeea] flex items-center justify-center transition-transform duration-200" style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
          <ChevronDown size={14} className="text-[#7a7570]" />
        </div>
      </button>

      {/* Expandable steps */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[#f0eeea]">
          <p className="text-[11px] font-bold text-[#b0aaa5] uppercase tracking-wider mt-3 mb-3">How to import</p>

          <div className="flex flex-col gap-3">
            {/* Step 1 */}
            <div className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-full bg-[#ede9fe] flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[11px] font-extrabold text-[#6c47ff]">1</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#1a1a1a]">Open TikTok or Instagram</p>
                <p className="text-xs text-[#7a7570] mt-0.5 leading-relaxed">Find the video or reel you want to share on SkillSnap.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-full bg-[#ede9fe] flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[11px] font-extrabold text-[#6c47ff]">2</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#1a1a1a]">Save to your camera roll</p>
                <p className="text-xs text-[#7a7570] mt-0.5 leading-relaxed">
                  Tap <span className="font-semibold text-[#1a1a1a]">Share → Save video</span> (TikTok) or <span className="font-semibold text-[#1a1a1a]">⋯ → Download</span> (Instagram).
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-full bg-[#6c47ff] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Download size={12} color="white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#6c47ff]">Upload Video above</p>
                <p className="text-xs text-[#7a7570] mt-0.5 leading-relaxed">Tap <span className="font-semibold text-[#1a1a1a]">Upload Video</span> above and choose it from your gallery.</p>
              </div>
            </div>
          </div>

          {/* Tip pill */}
          <div className="mt-4 flex items-center gap-2 bg-[#faf8ff] border border-[#e9e3ff] rounded-xl px-3 py-2.5">
            <span className="text-base leading-none">💡</span>
            <p className="text-xs text-[#6c47ff] font-medium leading-snug">
              Tip: TikTok watermarks are fine — clients love seeing your real content.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function UploadButton({
  icon, title, subtitle, active, onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${active ? "border-[#c4b5fd] bg-[#faf8ff]" : "border-[#e8e4df] bg-white"}`}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: active ? "#ede9fe" : "#f0eeea" }}
      >
        {icon}
      </div>
      <div>
        <p className={`text-sm font-semibold ${active ? "text-[#6c47ff]" : "text-[#1a1a1a]"}`}>{title}</p>
        <p className="text-xs text-[#7a7570] mt-0.5">{subtitle}</p>
      </div>
      {active && (
        <div className="ml-auto w-5 h-5 rounded-full bg-[#6c47ff] flex items-center justify-center flex-shrink-0">
          <svg width="10" height="8" viewBox="0 0 10 8" fill="white">
            <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </button>
  );
}
