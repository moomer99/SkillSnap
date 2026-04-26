"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Phone, MoreVertical, Send, Paperclip, CheckCircle, Loader2, X } from "lucide-react";
import type { Screen, User } from "@/types";
import { MOCK_USERS } from "@/mock-data/users";
import { useAppState } from "@/state/AppState";
import { useChat } from "@/hooks/useChat";
import UserAvatar from "./shared/UserAvatar";

interface ChatScreenProps {
  onNavigate: (s: Screen) => void;
}

const SUPABASE_CONFIGURED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref");

// ── Job-done flow states ──────────────────────
type JobStatus = "idle" | "requested" | "confirmed" | "feedback_done";
type Rating = "very_happy" | "okay" | "not_satisfied";

const RATINGS: { key: Rating; emoji: string; label: string }[] = [
  { key: "very_happy",    emoji: "😊", label: "Yes, Very\nHappy" },
  { key: "okay",          emoji: "😐", label: "It was okay" },
  { key: "not_satisfied", emoji: "😔", label: "Not satisfied" },
];

export default function ChatScreen({ onNavigate }: ChatScreenProps) {
  const { state } = useAppState();
  const { messages, inputText, setInputText, sending, loading, sendMessage, bottomRef } = useChat();
  const [participant, setParticipant] = useState<User | null>(null);

  // Job-done flow
  const [jobStatus, setJobStatus] = useState<JobStatus>("idle");
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState<Rating | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(false);

  const participantId = state.activeThreadParticipantId ?? state.viewingUserId;
  const isSkiller = !!(participant?.skill); // skiller = has a skill set

  useEffect(() => {
    const threadParticipant = state.threads.find((t) => t.id === state.activeThreadId)?.participant;
    if (threadParticipant) { setParticipant(threadParticipant); return; }
    if (!participantId) { setParticipant(MOCK_USERS[0]); return; }
    const mockUser = MOCK_USERS.find((u) => u.id === participantId);
    if (mockUser || !SUPABASE_CONFIGURED) { setParticipant(mockUser ?? MOCK_USERS[0]); return; }
    import("@/services/userService").then(({ userService }) => {
      userService.getUser(participantId).then((u) => setParticipant(u ?? MOCK_USERS[0]));
    });
  }, [participantId, state.threads, state.activeThreadId]);

  const displayParticipant = participant ?? MOCK_USERS[0];
  const inputRef = useRef<HTMLInputElement>(null);
  const attachRef = useRef<HTMLInputElement>(null);

  async function handleSubmitFeedback() {
    if (!rating) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));
    setSubmitting(false);
    setFeedbackDone(true);
    setTimeout(() => {
      setShowFeedback(false);
      setJobStatus("feedback_done");
    }, 1600);
  }

  return (
    <div className="flex flex-col h-screen bg-[#f8f7f5]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e8e4df] flex items-center gap-3 px-4 h-14 flex-shrink-0">
        <button onClick={() => onNavigate("messages")} className="text-[#7a7570]">
          <ArrowLeft size={20} />
        </button>
        <button onClick={() => onNavigate("client-profile")} className="flex items-center gap-2.5 flex-1">
          <UserAvatar user={displayParticipant} size="sm" />
          <div>
            <p className="text-sm font-bold text-[#1a1a1a] leading-tight">{displayParticipant.displayName}</p>
            <p className="text-[11px] text-[#6c47ff] font-medium">
              {[displayParticipant.skill, displayParticipant.location].filter(Boolean).join(" · ")}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-1">
          <button className="w-9 h-9 flex items-center justify-center text-[#7a7570]"><Phone size={18} /></button>
          <button className="w-9 h-9 flex items-center justify-center text-[#7a7570]"><MoreVertical size={18} /></button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 pb-2 flex flex-col gap-2.5">
        <div className="flex items-center gap-2 my-2">
          <div className="flex-1 h-px bg-[#e8e4df]" />
          <span className="text-[11px] text-[#b0aaa5] font-medium px-2">Today</span>
          <div className="flex-1 h-px bg-[#e8e4df]" />
        </div>

        {loading ? (
          <div className="flex flex-col gap-3 mt-2">
            {[false, true, false, true, false].map((isMe, i) => (
              <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`h-9 rounded-2xl animate-pulse ${isMe ? "bg-[#d4c9ff]" : "bg-gray-200"}`}
                  style={{ width: `${40 + (i * 13) % 35}%` }} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center py-8">
            <p className="text-sm font-semibold text-[#1a1a1a] mb-1">Start the conversation</p>
            <p className="text-xs text-[#b0aaa5]">Say hello to {displayParticipant.displayName} 👋</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[78%] flex flex-col gap-0.5">
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.from === "me"
                      ? "text-white rounded-br-sm"
                      : "bg-white text-[#1a1a1a] rounded-bl-sm shadow-sm border border-[#e8e4df]"
                  }`}
                  style={msg.from === "me" ? { background: "linear-gradient(135deg, #6c47ff, #8b6af5)" } : {}}
                >
                  {msg.text}
                </div>
                <span className={`text-[10px] text-[#b0aaa5] ${msg.from === "me" ? "text-right" : "text-left"} px-1`}>
                  {msg.time}
                </span>
              </div>
            </div>
          ))
        )}

        {/* ── Job-done request card (visible to client after skiller sends request) ── */}
        {jobStatus === "requested" && (
          <div className="mx-2 mt-2 bg-white rounded-2xl border border-[#e8e4df] shadow-sm overflow-hidden">
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">✅</span>
                <p className="font-bold text-[#1a1a1a] text-sm">{displayParticipant.displayName} marked the job as done</p>
              </div>
              <p className="text-xs text-[#7a7570] leading-snug">
                Did they complete the work to your satisfaction? Confirm to unlock the feedback form.
              </p>
            </div>
            <div className="flex border-t border-[#e8e4df]">
              <button
                className="flex-1 py-3 text-sm font-semibold text-[#7a7570] active:bg-gray-50 transition-colors"
                onClick={() => setJobStatus("idle")}
              >
                Decline
              </button>
              <div className="w-px bg-[#e8e4df]" />
              <button
                className="flex-1 py-3 text-sm font-bold text-[#6c47ff] active:bg-[#f5f0ff] transition-colors"
                onClick={() => { setJobStatus("confirmed"); setShowFeedback(true); }}
              >
                Yes, Confirm ✓
              </button>
            </div>
          </div>
        )}

        {/* ── Confirmed + Leave Feedback button ── */}
        {jobStatus === "confirmed" && !showFeedback && (
          <div className="mx-2 mt-2 bg-[#f0fdf4] rounded-2xl border border-green-200 px-4 py-3 flex items-center gap-3">
            <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#1a1a1a]">Job confirmed!</p>
              <p className="text-xs text-[#7a7570]">Share your experience with the community.</p>
            </div>
            <button
              className="flex-shrink-0 text-xs font-bold text-white px-3 py-1.5 rounded-xl"
              style={{ background: "linear-gradient(135deg,#6c47ff,#8b6af5)" }}
              onClick={() => setShowFeedback(true)}
            >
              Rate
            </button>
          </div>
        )}

        {/* ── Feedback done confirmation ── */}
        {jobStatus === "feedback_done" && (
          <div className="mx-2 mt-2 bg-[#f0fdf4] rounded-2xl border border-green-200 px-4 py-3 flex items-center gap-3">
            <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
            <p className="text-sm font-semibold text-[#1a1a1a]">Thanks for your feedback! 🎉</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Send Job Completion Request (skiller side) / spacer (client side) ── */}
      {jobStatus === "idle" && (
        <div className="px-4 pb-2">
          <button
            onClick={() => setJobStatus("requested")}
            className="w-full h-10 rounded-2xl font-semibold text-xs border-2 border-[#6c47ff]/30 text-[#6c47ff] flex items-center justify-center gap-2 bg-[#f5f0ff] transition-all active:scale-[0.98]"
          >
            <CheckCircle size={14} />
            Mark Job as Done
          </button>
        </div>
      )}

      {/* Input bar */}
      <div
        className="flex-shrink-0 bg-white border-t border-[#e8e4df] px-4 py-3 flex items-center gap-3"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        <input ref={attachRef} type="file" accept="image/*,video/*" className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) { setInputText(file.name); inputRef.current?.focus(); }
            e.target.value = "";
          }}
        />
        <button type="button" onClick={() => attachRef.current?.click()}
          className="text-[#7a7570] flex-shrink-0 active:text-[#6c47ff] transition-colors">
          <Paperclip size={20} />
        </button>
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Message..."
          autoComplete="off"
          className="flex-1 bg-[#f0eeea] rounded-2xl px-4 py-2.5 min-h-[40px] text-sm text-[#1a1a1a] placeholder-[#b0aaa5] focus:outline-none focus:ring-2 focus:ring-[#6c47ff]/30"
        />
        <button type="button" onClick={sendMessage}
          disabled={!inputText.trim() || sending}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 transition-opacity disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}>
          <Send size={16} />
        </button>
      </div>

      {/* ── Feedback modal ── */}
      {showFeedback && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-[#f5f5f5]">
          {/* Header */}
          <div className="bg-white border-b border-[#ebebeb] px-4 py-3 flex items-center gap-3">
            <button onClick={() => setShowFeedback(false)}
              className="w-8 h-8 flex items-center justify-center text-[#7a7570]">
              <X size={20} />
            </button>
            {displayParticipant.avatarUrl ? (
              <img src={displayParticipant.avatarUrl} className="w-10 h-10 rounded-full object-cover" alt="" />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                style={{ background: displayParticipant.avatarGradient }}>
                {displayParticipant.avatarInitial}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#1a1a1a] text-[15px]">{displayParticipant.displayName}</span>
                <span className="text-green-500">★</span>
              </div>
              {displayParticipant.skill && <p className="text-xs text-[#7a7570]">{displayParticipant.skill}</p>}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto bg-white">
            {feedbackDone ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
                <div className="w-16 h-16 rounded-full bg-[#dcfce7] flex items-center justify-center">
                  <CheckCircle size={30} className="text-green-500" />
                </div>
                <p className="font-bold text-[#1a1a1a] text-lg text-center">Thank you for your feedback!</p>
                <p className="text-sm text-[#7a7570] text-center">Your review helps build trust in the community.</p>
              </div>
            ) : (
              <>
                {/* Dismiss handle */}
                <div className="flex justify-start px-4 pt-4 pb-2">
                  <button onClick={() => setShowFeedback(false)}
                    className="w-8 h-8 rounded-full bg-[#e8e4df] flex items-center justify-center text-[#7a7570]">
                    <X size={15} />
                  </button>
                </div>

                {/* Title */}
                <div className="px-5 pb-5 text-center">
                  <h2 className="font-bold text-[#1a1a1a] text-[18px] leading-tight mb-1">
                    Were You Happy With the Work?
                  </h2>
                  <p className="text-sm text-[#7a7570]">Your feedback helps us improve the community!</p>
                </div>

                {/* Rating cards */}
                <div className="flex gap-3 px-5 mb-5">
                  {RATINGS.map(({ key, emoji, label }) => (
                    <button
                      key={key}
                      onClick={() => setRating(key)}
                      className={`flex-1 flex flex-col items-center gap-2 py-4 px-1 rounded-2xl border-2 transition-all ${
                        rating === key
                          ? key === "not_satisfied"
                            ? "border-red-300 bg-red-50"
                            : "border-[#6c47ff] bg-[#f5f0ff]"
                          : "border-[#e8e4df] bg-white"
                      }`}
                    >
                      <span className="text-3xl leading-none">{emoji}</span>
                      <span className={`text-[11px] font-semibold text-center leading-tight whitespace-pre-line ${
                        rating === key
                          ? key === "not_satisfied" ? "text-red-500" : "text-[#6c47ff]"
                          : "text-[#4a4a4a]"
                      }`}>
                        {label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Note field */}
                <div className="mx-5 mb-5 border border-[#e8e4df] rounded-2xl overflow-hidden bg-[#fafafa]">
                  <div className="px-4 pt-4 pb-1">
                    <span className="text-sm font-semibold text-[#1a1a1a]">Leave a note: </span>
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value.slice(0, 200))}
                    rows={3}
                    className="w-full px-4 pb-4 text-sm text-[#4a4a4a] bg-transparent resize-none outline-none leading-relaxed"
                    placeholder="Share your experience…"
                  />
                </div>

                {/* Submit */}
                <div className="px-5 pb-8">
                  <button
                    onClick={handleSubmitFeedback}
                    disabled={rating === null || submitting}
                    className="w-full h-14 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg, #6c47ff, #7c5ce7)" }}
                  >
                    {submitting
                      ? <><Loader2 size={18} className="animate-spin" /> Submitting…</>
                      : "Submit"}
                  </button>
                  {rating === null && (
                    <p className="text-center text-xs text-[#b0aaa5] mt-2">Select an option above to continue</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
