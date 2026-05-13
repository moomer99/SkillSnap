"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import { ArrowLeft, MoreVertical, Send, Paperclip, CheckCircle, Loader2, X, Clock, Flag, Bell, ChevronDown, Trash2, Copy } from "lucide-react";
import type { Screen, User, JobDoneStatus, JobRating } from "@/types";
import { MOCK_USERS } from "@/mock-data/users";
import { useAppState } from "@/state/AppState";
import { useChat } from "@/hooks/useChat";
import { JOBS_DONE_CONFIG } from "@/constants/config";
import UserAvatar from "./shared/UserAvatar";

interface ChatScreenProps {
  onNavigate: (s: Screen) => void;
}

const SUPABASE_CONFIGURED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref");

const RATINGS: { key: JobRating; emoji: string; label: string; happy: boolean }[] = [
  { key: "very_happy",    emoji: "😊", label: "Yes, Very\nHappy",    happy: true  },
  { key: "okay",          emoji: "😐", label: "It was okay",         happy: true  },
  { key: "not_satisfied", emoji: "😔", label: "Not satisfied",       happy: false },
];

const QUICK_REPLIES_PRO = [
  "Hi! I'm available 👋",
  "What date works for you?",
  "I can come to you",
  "Done! Let me know 😊",
];

const QUICK_REPLIES_CLIENT = [
  "Hi, are you available?",
  "How much do you charge?",
  "Can you come to me?",
  "Sounds good!",
  "Thanks! 🙌",
];


function QuickReplies({ onSelect, hasMessages, isSkiller }: {
  onSelect: (text: string) => void;
  hasMessages: boolean;
  isSkiller: boolean;
}) {
  const replies = isSkiller ? QUICK_REPLIES_PRO : QUICK_REPLIES_CLIENT;
  return (
    <div className="bg-white border-t border-[#f0eeea] px-3 py-2 flex gap-2 overflow-x-auto no-scrollbar">
      {replies.map((r) => (
        <button
          key={r}
          onClick={() => onSelect(r)}
          className="flex-shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full border border-[#e8e4df] bg-[#f8f7f5] text-[#4a4a4a] active:bg-[#ede9fe] active:border-[#c4b5fd] active:text-[#6c47ff] transition-all whitespace-nowrap"
        >
          {r}
        </button>
      ))}
    </div>
  );
}

function hoursElapsed(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 3_600_000;
}

function recalcHappy(prev: number, prevJobs: number, isHappy: boolean): number {
  if (prevJobs <= 0) return isHappy ? 100 : 0;
  const prevHappyCount = Math.round((prev / 100) * prevJobs);
  const newHappy = prevHappyCount + (isHappy ? 1 : 0);
  return Math.round((newHappy / (prevJobs + 1)) * 100);
}

export default function ChatScreen({ onNavigate }: ChatScreenProps) {
  const { state, dispatch, onlineUserIds } = useAppState();
  const { messages, inputText, setInputText, sending, loading, sendMessage, sendImageMessage, bottomRef, threadId } = useChat();
  const [participant, setParticipant] = useState<User | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const jobCardRef = useRef<HTMLDivElement>(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showDeleteConvConfirm, setShowDeleteConvConfirm] = useState(false);
  const [pressedMsgId, setPressedMsgId] = useState<string | null>(null);
  const [msgMenuPos, setMsgMenuPos] = useState<"left" | "right">("left");
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Job-done flow
  const [jobStatus, setJobStatus] = useState<JobDoneStatus>("idle");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobVerifiedAt, setJobVerifiedAt] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState<JobRating | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(false);

  const participantId = state.activeThreadParticipantId ?? state.viewingUserId;
  const currentUser = state.currentUser;
  const isSkiller = !!(currentUser?.skill);

  // Incoming realtime jobs_done_request — received via useGlobalMessages subscription
  const pendingRequest = state.pendingJobsRequest;

  // When a realtime jobs_done_request arrives for this client, pre-populate activeJobId
  // and set jobStatus so the confirm/decline card appears automatically
  useEffect(() => {
    if (!pendingRequest || isSkiller) return;
    if (jobStatus !== "idle" && jobStatus !== "requested") return;
    setActiveJobId(pendingRequest.jobId);
    setJobStatus("requested");
  }, [pendingRequest, isSkiller]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch conversation created_at from DB and set threadStartedAt if not already present.
  // This ensures the Jobs Done unlock timer reflects the actual conversation age, not just
  // the moment the first message was sent in the current session.
  useEffect(() => {
    if (!SUPABASE_CONFIGURED || !threadId) return;
    if (activeThread?.startedAt) return; // already set

    import("@/lib/supabase").then(({ getAuthSupabase }) => {
      getAuthSupabase()
        .from("conversations")
        .select("created_at")
        .eq("id", threadId)
        .single()
        .then(({ data }) => {
          if (data?.created_at) {
            dispatch({
              type: "SET_THREAD_STARTED_AT",
              threadId,
              startedAt: data.created_at as string,
            });
          }
        });
    });
  }, [threadId]); // eslint-disable-line react-hooks/exhaustive-deps

  // On every chat open, fetch the most recent jobs_done row for this conversation and
  // restore the correct card state. Priority: completed > pending > idle.
  useEffect(() => {
    if (!SUPABASE_CONFIGURED || !threadId || !currentUser?.id) return;

    import("@/lib/supabase").then(({ getAuthSupabase }) => {
      getAuthSupabase()
        .from("jobs_done")
        .select("id, skiller_id, client_id, skiller_confirmed, client_confirmed, verified_at")
        .eq("conversation_id", threadId)
        .eq("skiller_confirmed", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (!data) return;
          setActiveJobId(data.id);
          if (data.client_confirmed && data.verified_at) {
            // Completed — show the confirmation card for both parties
            setJobStatus("confirmed");
            setJobVerifiedAt(data.verified_at as string);
            console.log("[JobsDone] restored completed card");
          } else {
            // Pending — skiller waiting for client to confirm/decline
            setJobStatus("requested");
            console.log("[JobsDone] restored pending card");
          }
        });
    });
  }, [threadId, currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeThread = useMemo(
    () => state.threads.find((t) => t.id === state.activeThreadId),
    [state.threads, state.activeThreadId]
  );

  const hasMessages = messages.length > 0;

  // Split messages around the Jobs Done confirmation timestamp so messages sent
  // after the job was confirmed appear BELOW the card, not above it.
  const cardActive = jobStatus !== "idle" && jobStatus !== "declined";
  const { messagesBeforeCard, messagesAfterCard } = useMemo(() => {
    if (!cardActive || !jobVerifiedAt) return { messagesBeforeCard: messages, messagesAfterCard: [] };
    const cutoff = new Date(jobVerifiedAt).getTime();
    const before: typeof messages = [];
    const after: typeof messages = [];
    for (const m of messages) {
      // optimistic messages have no ISO timestamp — put them after the card
      const ts = m.createdAt ? new Date(m.createdAt).getTime() : cutoff + 1;
      if (ts <= cutoff) before.push(m);
      else after.push(m);
    }
    return { messagesBeforeCard: before, messagesAfterCard: after };
  }, [messages, cardActive, jobVerifiedAt]);
  const threadStartedAt = activeThread?.startedAt;
  const hoursIn = threadStartedAt ? hoursElapsed(threadStartedAt) : 0;
  const minHours = JOBS_DONE_CONFIG.MIN_CONVERSATION_HOURS;
  const hoursRemaining = Math.max(0, Math.ceil(minHours - hoursIn));

  const canRequestJobDone = hasMessages && hoursIn >= minHours;
  const lockedLabel = `Available in ~${hoursRemaining}h · conversation must be 24h old`;

  // Scroll job card into view whenever it appears
  useEffect(() => {
    if (jobStatus === "idle") return;
    setTimeout(() => {
      jobCardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
  }, [jobStatus]);

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

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (showFeedback) { setShowFeedback(false); return; }
      if (showChatMenu) { setShowChatMenu(false); return; }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showFeedback, showChatMenu]);

  async function handleRequestJobDone() {
    const conversationId = threadId || activeThread?.id || null;
    // Get the other participant's ID directly from the thread object — never rely on
    // displayParticipant which may be a mock fallback, or activeThreadParticipantId which can be null.
    const thread = state.threads.find((t) => t.id === (conversationId ?? state.activeThreadId));
    console.log("[ChatScreen] active thread:", thread);
    const clientId = thread?.participant?.id ?? null;
    console.log("[JobsDone] fixed values:", {
      skiller_id: currentUser?.id,
      client_id: clientId,
      conversation_id: conversationId,
      thread_participant: thread?.participant?.id,
      activeThreadId: state.activeThreadId,
    });
    setJobStatus("requested");
    if (!SUPABASE_CONFIGURED || !currentUser || !clientId || !conversationId) {
      console.warn("[ChatScreen] handleRequestJobDone: missing required values", {
        SUPABASE_CONFIGURED,
        currentUser: !!currentUser,
        clientId,
        conversationId,
      });
      return;
    }
    try {
      const { getAuthSupabase } = await import("@/lib/supabase");
      const sb = getAuthSupabase();

      // Insert jobs_done record
      const { data: jobData, error: jobError } = await sb
        .from("jobs_done")
        .insert({
          skiller_id: currentUser.id,
          client_id: clientId,
          conversation_id: conversationId,
          skiller_confirmed: true,
          client_confirmed: false,
        })
        .select()
        .single();

      console.log("[JobsDone] insert result — data:", JSON.stringify(jobData), "error:", jobError ? JSON.stringify({ message: jobError.message, code: jobError.code, details: jobError.details, hint: jobError.hint }) : null);
      if (jobError) {
        console.error("[JobsDone] insert failed:", jobError.message, "code:", jobError.code, "details:", jobError.details, "hint:", jobError.hint);
        return;
      }
      if (!jobData) {
        console.error("[JobsDone] insert returned null data with no error — likely blocked by RLS policy. Check that the authenticated user has INSERT permission on jobs_done.");
        return;
      }

      const jobId = jobData?.id as string | null;
      if (jobId) setActiveJobId(jobId);

      // Insert notification for the client
      const { error: notifError } = await sb
        .from("notifications")
        .insert({
          user_id: clientId,
          type: "jobs_done_request",
          from_user_id: currentUser.id,
          message: `${currentUser.displayName} requested a Jobs Done confirmation`,
          read: false,
        });
      if (notifError) console.error("[JobsDone] notification insert failed:", notifError.message, notifError.code);

    } catch (e) {
      console.error("[ChatScreen] handleRequestJobDone failed:", e);
    }
  }

  async function handleClientConfirm() {
    setJobStatus("confirmed");
    setJobVerifiedAt(new Date().toISOString());
    setShowFeedback(true);
    dispatch({ type: "SET_PENDING_JOBS_REQUEST", request: null });
    if (!SUPABASE_CONFIGURED || !activeJobId) return;
    try {
      const { jobsDoneService } = await import("@/services/jobsDoneService");
      await jobsDoneService.confirmJob(activeJobId);
      if (pendingRequest?.notificationId) {
        await jobsDoneService.markNotificationRead(pendingRequest.notificationId);
      }
      // Re-fetch the skiller's profile so the jobs_done count reflects the DB trigger increment.
      // The skiller is the other participant in this conversation (client is confirming).
      const skillerId = displayParticipant?.id;
      if (skillerId) {
        const { getAuthSupabase } = await import("@/lib/supabase");
        const { data } = await getAuthSupabase()
          .from("profiles")
          .select("jobs_done")
          .eq("id", skillerId)
          .single();
        if (data) {
          const newCount = Number(data.jobs_done ?? 0);
          // Update participant display in the thread list
          setParticipant((prev) => prev ? { ...prev, jobsDone: newCount } : prev);
          // If the skiller is the current user (shouldn't be on client side, but guard anyway)
          if (currentUser?.id === skillerId) {
            dispatch({ type: "UPDATE_CURRENT_USER", patch: { jobsDone: newCount } });
          }
        }
      }
    } catch (e) {
      console.warn("[ChatScreen] handleClientConfirm failed:", e);
    }
  }

  async function handleClientDecline() {
    setJobStatus("declined");
    dispatch({ type: "SET_PENDING_JOBS_REQUEST", request: null });
    if (!SUPABASE_CONFIGURED || !activeJobId) return;
    try {
      const { jobsDoneService } = await import("@/services/jobsDoneService");
      await jobsDoneService.declineJob(activeJobId);
      if (pendingRequest?.notificationId) {
        await jobsDoneService.markNotificationRead(pendingRequest.notificationId);
      }
      setActiveJobId(null);
    } catch (e) {
      console.warn("[ChatScreen] handleClientDecline failed:", e);
    }
  }

  function sendMessageWithTracking() {
    if (activeThread && !activeThread.startedAt) {
      dispatch({
        type: "SET_THREAD_STARTED_AT",
        threadId: activeThread.id,
        startedAt: new Date().toISOString(),
      });
    }
    sendMessage();
  }

  async function confirmDeleteConversation() {
    setShowDeleteConvConfirm(false);

    const threadId = state.activeThreadId;
    const userId = currentUser?.id;

    console.log("[DeleteConv] attempting delete:", { threadId, userId });

    if (!threadId) {
      console.warn("[DeleteConv] no activeThreadId — cannot delete");
      onNavigate("messages");
      return;
    }

    if (SUPABASE_CONFIGURED && userId) {
      try {
        const { getAuthSupabase } = await import("@/lib/supabase");
        const { data, error } = await getAuthSupabase()
          .from("conversation_members")
          .update({ hidden: true })
          .eq("conversation_id", threadId)
          .eq("user_id", userId)
          .select();

        console.log("[DeleteConv] result:", { data, error });

        if (error) {
          console.error("[DeleteConv] Supabase error:", error.message, error.code);
        }
      } catch (e) {
        console.warn("[ChatScreen] delete conversation failed:", e);
      }
    } else {
      console.warn("[DeleteConv] skipping Supabase — configured:", SUPABASE_CONFIGURED, "userId:", userId);
    }

    dispatch({ type: "REMOVE_THREAD", threadId });
    onNavigate("messages");
  }

  async function handleDeleteMessage(msgId: string) {
    if (SUPABASE_CONFIGURED) {
      try {
        const { getAuthSupabase } = await import("@/lib/supabase");
        await getAuthSupabase()
          .from("messages")
          .update({ deleted_for_sender: true })
          .eq("id", msgId)
          .eq("sender_id", currentUser?.id);
      } catch (e) {
        console.warn("[ChatScreen] delete message failed:", e);
      }
    }
    dispatch({ type: "DELETE_MESSAGE", msgId });
  }

  const displayParticipant = participant ?? MOCK_USERS[0];
  const inputRef = useRef<HTMLInputElement>(null);
  const attachRef = useRef<HTMLInputElement>(null);

  async function handleSubmitFeedback() {
    if (!rating) return;
    setSubmitting(true);
    const ratingData = RATINGS.find((r) => r.key === rating)!;

    // Persist rating to Supabase — triggers DB recalc of happy_percent
    if (SUPABASE_CONFIGURED && activeJobId) {
      try {
        const { getAuthSupabase } = await import("@/lib/supabase");
        await getAuthSupabase()
          .from("ratings")
          .insert({
            job_id: activeJobId,
            skiller_id: displayParticipant.id,
            client_id: currentUser?.id,
            rating: ratingData.key,
            is_happy: ratingData.happy,
            comment: comment.trim() || null,
          });

        // Re-fetch the DB-calculated happy_percent so local state reflects reality
        const { data: profile } = await getAuthSupabase()
          .from("profiles")
          .select("happy_percent")
          .eq("id", displayParticipant.id)
          .single();
        if (profile) {
          dispatch({
            type: "UPDATE_PARTICIPANT_HAPPY",
            userId: displayParticipant.id,
            happyPercent: Number(profile.happy_percent ?? 0),
          });
        }
      } catch (e) {
        console.warn("[ChatScreen] rating insert failed:", e);
        // Fall back to local calculation if DB write fails
        dispatch({
          type: "UPDATE_PARTICIPANT_HAPPY",
          userId: displayParticipant.id,
          happyPercent: recalcHappy(displayParticipant.happyPercent, displayParticipant.jobsDone, ratingData.happy),
        });
      }
    } else {
      // Supabase not configured — local calculation only
      dispatch({
        type: "UPDATE_PARTICIPANT_HAPPY",
        userId: displayParticipant.id,
        happyPercent: recalcHappy(displayParticipant.happyPercent, displayParticipant.jobsDone, ratingData.happy),
      });
    }

    setSubmitting(false);
    setFeedbackDone(true);
    setTimeout(() => {
      setShowFeedback(false);
      setJobStatus("feedback_done");
    }, 1600);
  }

  return (
    <div className="flex flex-col bg-[#f8f7f5] relative overflow-hidden" style={{ height: "100dvh" }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e8e4df] flex items-center gap-3 px-4 h-14 flex-shrink-0">
        <button onClick={() => onNavigate("messages")} className="text-[#7a7570]">
          <ArrowLeft size={20} />
        </button>
        <button onClick={() => onNavigate("client-profile")} className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <UserAvatar user={displayParticipant} size="sm" />
            {onlineUserIds.has(displayParticipant.id) && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="text-sm font-bold text-[#1a1a1a] leading-tight truncate">{displayParticipant.displayName}</p>
              {!isSkiller && (jobStatus === "confirmed" || jobStatus === "feedback_done") && (
                <span className="flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded-full bg-[#f0fdf4] text-green-600 font-semibold border border-green-200">
                  Hired ✓
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#6c47ff] font-medium truncate">
              {[
                displayParticipant.role === "client" ? "Client"
                  : displayParticipant.skill ?? null,
                displayParticipant.location,
              ].filter(Boolean).join(" · ")}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowChatMenu(true)}
            className="w-9 h-9 flex items-center justify-center text-[#7a7570] active:text-[#6c47ff] transition-colors"
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </header>

      {/* ── Messages ── */}
      <div
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 py-4 pb-2 flex flex-col gap-2.5"
        onScroll={(e) => {
          const el = e.currentTarget;
          const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
          setShowScrollBtn(distFromBottom > 120);
        }}
      >
        <div className="flex items-center gap-2 my-2">
          <div className="flex-1 h-px bg-[#e8e4df]" />
          <span className="text-[11px] text-[#b0aaa5] font-medium px-2">Today</span>
          <div className="flex-1 h-px bg-[#e8e4df]" />
        </div>

        {loading ? (
          <div className="flex flex-col gap-3 mt-2 px-2">
            {[false, true, false, true, false, false, true].map((isMe, i) => (
              <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`h-9 rounded-2xl animate-pulse ${isMe ? "bg-[#d4c9ff]" : "bg-[#ede9de]"}`}
                  style={{ width: `${38 + (i * 17) % 40}%` }}
                />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center py-8">
            <p className="text-sm font-semibold text-[#1a1a1a] mb-1">Start the conversation</p>
            <p className="text-xs text-[#b0aaa5]">Say hello to {displayParticipant.displayName} 👋</p>
          </div>
        ) : (
          messagesBeforeCard.map((msg) => {
            if (msg.isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-1">
                  <span className="text-[11px] font-semibold text-[#6c47ff] bg-[#f0ecff] px-3 py-1.5 rounded-full border border-[#ddd5ff]">
                    {msg.text}
                  </span>
                </div>
              );
            }
            return (
            <div key={msg.id} className={`flex flex-col ${msg.from === "me" ? "items-end" : "items-start"}`}>
              {pressedMsgId === msg.id && (
                <div
                  className={`flex items-center gap-1 mb-1 ${msgMenuPos === "right" ? "justify-end pr-2" : "justify-start pl-2"}`}
                  onClick={() => setPressedMsgId(null)}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(msg.text ?? ""); setPressedMsgId(null); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white shadow-md border border-[#e8e4df] text-xs font-semibold text-[#1a1a1a] z-20 relative"
                  >
                    <Copy size={13} /> Copy
                  </button>
                  {msg.from === "me" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id); setPressedMsgId(null); }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white shadow-md border border-[#e8e4df] text-xs font-semibold text-red-500 z-20 relative"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  )}
                </div>
              )}
              <div className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"} w-full`}>
              <div className="max-w-[78%] flex flex-col gap-0.5"
                onMouseDown={(e) => { e.preventDefault(); setMsgMenuPos(msg.from === "me" ? "right" : "left"); pressTimerRef.current = setTimeout(() => setPressedMsgId(msg.id), 500); }}
                onMouseUp={() => { if (pressTimerRef.current) clearTimeout(pressTimerRef.current); }}
                onMouseLeave={() => { if (pressTimerRef.current) clearTimeout(pressTimerRef.current); }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  setMsgMenuPos(msg.from === "me" ? "right" : "left");
                  pressTimerRef.current = setTimeout(() => setPressedMsgId(msg.id), 500);
                }}
                onTouchMove={() => {
                  if (pressTimerRef.current) {
                    clearTimeout(pressTimerRef.current);
                    pressTimerRef.current = null;
                  }
                }}
                onTouchEnd={() => { if (pressTimerRef.current) clearTimeout(pressTimerRef.current); }}
              >
                {msg.imageUrl ? (
                  <a href={msg.uploading ? undefined : msg.imageUrl} target="_blank" rel="noopener noreferrer" className={`relative rounded-2xl overflow-hidden shadow-sm block ${msg.from === "me" ? "rounded-br-sm" : "rounded-bl-sm"}`}>
                    <img src={msg.imageUrl} alt={msg.text} className="w-full max-w-[220px] object-cover rounded-2xl" style={{ maxHeight: 260 }} />
                    {msg.uploading && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-2xl">
                        <Loader2 size={24} className="text-white animate-spin" />
                      </div>
                    )}
                  </a>
                ) : (
                  <>
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.from === "me"
                          ? "text-white rounded-br-sm"
                          : "bg-white text-[#1a1a1a] rounded-bl-sm shadow-sm border border-[#e8e4df]"
                      } ${msg.failed ? "opacity-60" : ""}`}
                      style={msg.from === "me" ? { background: msg.failed ? "#a0a0a0" : "linear-gradient(135deg, #6c47ff, #8b6af5)", userSelect: "none" } : { userSelect: "none" }}
                    >
                      {msg.text}
                    </div>
                    {msg.failed && (
                      <span className="text-[10px] text-red-400 font-medium px-1">Not delivered · check connection</span>
                    )}
                  </>
                )}
                <span className={`text-[10px] text-[#b0aaa5] flex items-center gap-0.5 ${msg.from === "me" ? "justify-end" : "justify-start"} px-1`}>
                  {msg.time}
                  {msg.from === "me" && !msg.failed && (
                    <svg width="14" height="8" viewBox="0 0 14 8" fill="none" className="ml-0.5 flex-shrink-0">
                      <path d="M1 4l2.5 2.5L8 1" stroke="#6c47ff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M5.5 4l2.5 2.5L13 1" stroke="#6c47ff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </span>
              </div>
              </div>
            </div>
            );
          })
        )}

        <div ref={bottomRef} />
      </div>

      {/* Backdrop to dismiss message action menu */}
      {pressedMsgId && (
        <div className="fixed inset-0 z-10" onClick={() => setPressedMsgId(null)} />
      )}

      {/* ── Fixed bottom section: job cards, after-card messages, input ── */}
      <div className="flex-shrink-0 flex flex-col">

      {/* ── Job done status cards — always above input bar, after all messages ── */}
      <div ref={jobCardRef}>
      {isSkiller && jobStatus === "requested" && (
        <div className="mx-2 mt-2 bg-[#f5f0ff] rounded-2xl border border-[#6c47ff]/20 px-4 py-3 flex items-center gap-3">
          <Loader2 size={18} className="text-[#6c47ff] flex-shrink-0 animate-spin" />
          <div>
            <p className="text-sm font-bold text-[#1a1a1a]">Job done request sent</p>
            <p className="text-xs text-[#7a7570]">Waiting for {displayParticipant.displayName} to confirm…</p>
          </div>
        </div>
      )}

      {!isSkiller && jobStatus === "requested" && (
        <div className="mx-2 mt-2 bg-white rounded-2xl border border-[#e8e4df] shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">✅</span>
              <p className="font-bold text-[#1a1a1a] text-sm">{displayParticipant.displayName} marked the job as done</p>
            </div>
            <p className="text-xs text-[#7a7570] leading-snug">Did they complete the work to your satisfaction? Confirm to leave feedback.</p>
          </div>
          <div className="flex border-t border-[#e8e4df]">
            <button className="flex-1 py-3 text-sm font-semibold text-[#7a7570] active:bg-gray-50 transition-colors" onClick={handleClientDecline}>Decline</button>
            <div className="w-px bg-[#e8e4df]" />
            <button className="flex-1 py-3 text-sm font-bold text-[#6c47ff] active:bg-[#f5f0ff] transition-colors" onClick={handleClientConfirm}>Yes, Confirm ✓</button>
          </div>
        </div>
      )}

      {!isSkiller && jobStatus === "declined" && (
        <div className="mx-2 mt-2 bg-[#fff7ed] rounded-2xl border border-orange-200 px-4 py-3 flex items-center gap-2">
          <X size={16} className="text-orange-400 flex-shrink-0" />
          <p className="text-sm font-semibold text-[#1a1a1a]">Job completion declined.</p>
        </div>
      )}

      {isSkiller && jobStatus === "confirmed" && (
        <div className="mx-2 mt-2 bg-[#f0fdf4] rounded-2xl border border-green-200 px-4 py-3 flex items-center gap-3">
          <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-[#1a1a1a]">Job confirmed by client!</p>
            <p className="text-xs text-[#7a7570]">Your happy % will update once they rate.</p>
          </div>
        </div>
      )}

      {!isSkiller && jobStatus === "confirmed" && !showFeedback && !feedbackDone && (
        <div className="mx-2 mt-2 bg-[#f0fdf4] rounded-2xl border border-green-200 px-4 py-3 flex items-center gap-3">
          <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#1a1a1a]">Job confirmed!</p>
            <p className="text-xs text-[#7a7570]">Share your experience with the community.</p>
          </div>
          <button className="flex-shrink-0 text-xs font-bold text-white px-3 py-1.5 rounded-xl" style={{ background: "linear-gradient(135deg,#6c47ff,#8b6af5)" }} onClick={() => setShowFeedback(true)}>Rate</button>
        </div>
      )}

      {jobStatus === "feedback_done" && (
        <div className="mx-2 mt-2 bg-[#f0fdf4] rounded-2xl border border-green-200 px-4 py-3 flex items-center gap-3">
          <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
          <p className="text-sm font-semibold text-[#1a1a1a]">Thanks for your feedback! 🎉</p>
        </div>
      )}
      </div>{/* end jobCardRef wrapper */}

      {/* Messages sent after the Jobs Done confirmation — always below the card */}
      {messagesAfterCard.length > 0 && (
        <div className="px-4 flex flex-col gap-2.5 pt-2">
          {messagesAfterCard.map((msg) => {
            if (msg.isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-1">
                  <span className="text-[11px] font-semibold text-[#6c47ff] bg-[#f0ecff] px-3 py-1.5 rounded-full border border-[#ddd5ff]">
                    {msg.text}
                  </span>
                </div>
              );
            }
            return (
              <div key={msg.id} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[78%] flex flex-col gap-0.5"
                  onMouseDown={(e) => { e.preventDefault(); setMsgMenuPos(msg.from === "me" ? "right" : "left"); pressTimerRef.current = setTimeout(() => setPressedMsgId(msg.id), 500); }}
                  onMouseUp={() => { if (pressTimerRef.current) clearTimeout(pressTimerRef.current); }}
                  onMouseLeave={() => { if (pressTimerRef.current) clearTimeout(pressTimerRef.current); }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    setMsgMenuPos(msg.from === "me" ? "right" : "left");
                    pressTimerRef.current = setTimeout(() => setPressedMsgId(msg.id), 500);
                  }}
                  onTouchMove={() => {
                    if (pressTimerRef.current) {
                      clearTimeout(pressTimerRef.current);
                      pressTimerRef.current = null;
                    }
                  }}
                  onTouchEnd={() => { if (pressTimerRef.current) clearTimeout(pressTimerRef.current); }}
                >
                  {msg.imageUrl ? (
                    <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer" className={`rounded-2xl overflow-hidden shadow-sm block ${msg.from === "me" ? "rounded-br-sm" : "rounded-bl-sm"}`}>
                      <img src={msg.imageUrl} alt={msg.text} className="w-full max-w-[220px] object-cover rounded-2xl" style={{ maxHeight: 260 }} />
                    </a>
                  ) : (
                    <>
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.from === "me"
                            ? "text-white rounded-br-sm"
                            : "bg-white text-[#1a1a1a] rounded-bl-sm shadow-sm border border-[#e8e4df]"
                        } ${msg.failed ? "opacity-60" : ""}`}
                        style={msg.from === "me" ? { background: msg.failed ? "#a0a0a0" : "linear-gradient(135deg, #6c47ff, #8b6af5)", userSelect: "none" } : { userSelect: "none" }}
                      >
                        {msg.text}
                      </div>
                      {msg.failed && (
                        <span className="text-[10px] text-red-400 font-medium px-1">Not delivered · check connection</span>
                      )}
                    </>
                  )}
                  <span className={`text-[10px] text-[#b0aaa5] flex items-center gap-0.5 ${msg.from === "me" ? "justify-end" : "justify-start"} px-1`}>
                    {msg.time}
                    {msg.from === "me" && !msg.failed && (
                      <svg width="14" height="8" viewBox="0 0 14 8" fill="none" className="ml-0.5 flex-shrink-0">
                        <path d="M1 4l2.5 2.5L8 1" stroke="#6c47ff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M5.5 4l2.5 2.5L13 1" stroke="#6c47ff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scroll-to-bottom button */}
      {showScrollBtn && (
        <button
          onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
          className="absolute bottom-[160px] right-4 z-30 w-9 h-9 rounded-full bg-white shadow-lg border border-[#e8e4df] flex items-center justify-center text-[#6c47ff] active:scale-95 transition-transform"
        >
          <ChevronDown size={18} />
        </button>
      )}

      {/* ── Mark Job as Done button ── */}
      {isSkiller && jobStatus === "idle" && (
        <div className="px-4 pb-2">
          {canRequestJobDone ? (
            <button
              onClick={handleRequestJobDone}
              className="w-full h-10 rounded-2xl font-semibold text-xs border-2 border-[#6c47ff]/30 text-[#6c47ff] flex items-center justify-center gap-2 bg-[#f5f0ff] transition-all active:scale-[0.98]"
            >
              <CheckCircle size={14} />
              Mark Job as Done
            </button>
          ) : (
            <div className="w-full h-10 rounded-2xl flex items-center justify-center gap-2 bg-[#f0eeea] border border-[#e8e4df]">
              <Clock size={13} className="text-[#b0aaa5]" />
              <span className="text-xs text-[#b0aaa5] font-medium">{lockedLabel}</span>
            </div>
          )}
        </div>
      )}

      {/* Quick replies */}
      <QuickReplies onSelect={(text) => { setInputText(text); inputRef.current?.focus(); }} hasMessages={hasMessages} isSkiller={isSkiller} />

      {/* Input bar */}
      <div
        className="flex-shrink-0 bg-white border-t border-[#e8e4df] px-4 py-3 flex items-center gap-3"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        <input ref={attachRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            sendImageMessage(file);
            e.target.value = "";
          }}
        />
        <button type="button" onClick={() => attachRef.current?.click()} className="text-[#7a7570] flex-shrink-0 active:text-[#6c47ff] transition-colors">
          <Paperclip size={20} />
        </button>
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessageWithTracking(); } }}
          placeholder="Message..."
          autoComplete="off"
          className="flex-1 bg-[#f0eeea] rounded-2xl px-4 py-2.5 min-h-[40px] text-sm text-[#1a1a1a] placeholder-[#b0aaa5] focus:outline-none focus:ring-2 focus:ring-[#6c47ff]/30"
        />
        <button type="button" onClick={sendMessageWithTracking}
          disabled={!inputText.trim() || sending}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 transition-opacity disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #6c47ff, #8b6af5)" }}>
          <Send size={16} />
        </button>
      </div>

      </div>{/* end flex-shrink-0 bottom section */}

      {/* ── Chat options menu ── */}
      {showChatMenu && (
        <div className="fixed inset-0 z-[200] flex items-end" onClick={() => setShowChatMenu(false)}>
          <div className="w-full bg-white rounded-t-3xl pb-8 pt-2 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-[#e8e4df] mx-auto mb-4" />
            <div className="px-4 pb-2">
              <p className="text-xs font-bold text-[#b0aaa5] uppercase tracking-wider mb-1">{displayParticipant.displayName}</p>
            </div>
            <button className="w-full flex items-center gap-4 px-5 py-4 text-[#1a1a1a] text-sm font-medium active:bg-[#f8f7f5]" onClick={() => { setShowChatMenu(false); onNavigate("client-profile"); }}>
              <div className="w-9 h-9 rounded-full bg-[#ede9fe] flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6c47ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" /></svg>
              </div>
              View Profile
            </button>
            <div className="h-px bg-[#f0eeea] mx-5" />
            <button className="w-full flex items-center gap-4 px-5 py-4 text-[#1a1a1a] text-sm font-medium active:bg-[#f8f7f5]" onClick={() => setShowChatMenu(false)}>
              <div className="w-9 h-9 rounded-full bg-[#f0eeea] flex items-center justify-center flex-shrink-0"><Bell size={16} className="text-[#7a7570]" /></div>
              Mute Notifications
              <span className="ml-auto text-[10px] font-bold text-white bg-[#6c47ff] px-2 py-0.5 rounded-full">Soon</span>
            </button>
            <div className="h-px bg-[#f0eeea] mx-5" />
            <button className="w-full flex items-center gap-4 px-5 py-4 text-red-500 text-sm font-medium active:bg-red-50" onClick={() => setShowChatMenu(false)}>
              <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0"><Flag size={16} className="text-red-400" /></div>
              Report Conversation
              <span className="ml-auto text-[10px] font-bold text-white bg-[#6c47ff] px-2 py-0.5 rounded-full">Soon</span>
            </button>
            <div className="h-px bg-[#f0eeea] mx-5" />
            <button
              className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-[#f8f7f5] transition-colors"
              onClick={() => { setShowChatMenu(false); setShowDeleteConvConfirm(true); }}
            >
              <Trash2 size={16} className="text-red-500 flex-shrink-0" />
              <span className="text-sm font-semibold text-red-500">Delete conversation</span>
            </button>
            <div className="h-px bg-[#f0eeea] mx-5" />
            <button className="w-full flex items-center gap-4 px-5 py-4 text-[#7a7570] text-sm font-medium active:bg-[#f8f7f5]" onClick={() => setShowChatMenu(false)}>
              <div className="w-9 h-9 rounded-full bg-[#f0eeea] flex items-center justify-center flex-shrink-0"><X size={16} className="text-[#7a7570]" /></div>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Delete conversation confirmation sheet ── */}
      {showDeleteConvConfirm && (
        <div className="fixed inset-0 z-[200] flex items-end" onClick={() => setShowDeleteConvConfirm(false)}>
          <div className="w-full bg-white rounded-t-3xl px-5 pt-3 pb-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-[#e8e4df] mx-auto mb-5" />
            <div className="flex flex-col items-center text-center px-2 pb-2">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h3 className="font-bold text-[#1a1a1a] text-lg mb-1">Delete conversation?</h3>
              <p className="text-sm text-[#7a7570] mb-6 leading-relaxed">
                This removes the chat from your list only. The other person won't be notified.
              </p>
              <button
                onClick={confirmDeleteConversation}
                className="w-full rounded-2xl font-bold text-base text-white mb-3 bg-red-500 flex items-center justify-center"
                style={{ height: 52 }}
              >
                Delete for me
              </button>
              <button
                onClick={() => setShowDeleteConvConfirm(false)}
                className="w-full h-12 rounded-2xl font-semibold text-sm text-[#7a7570] bg-[#f0eeea]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Feedback modal ── */}
      {showFeedback && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-[#f5f5f5]">
          <div className="bg-white border-b border-[#ebebeb] px-4 py-3 flex items-center gap-3">
            <button onClick={() => setShowFeedback(false)} className="w-8 h-8 flex items-center justify-center text-[#7a7570]"><X size={20} /></button>
            {displayParticipant.avatarUrl ? (
              <img src={displayParticipant.avatarUrl} className="w-10 h-10 rounded-full object-cover" alt="" />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0" style={{ background: displayParticipant.avatarGradient }}>
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

          <div className="flex-1 overflow-y-auto bg-white">
            {feedbackDone ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
                <div className="w-16 h-16 rounded-full bg-[#dcfce7] flex items-center justify-center"><CheckCircle size={30} className="text-green-500" /></div>
                <p className="font-bold text-[#1a1a1a] text-lg text-center">Thank you for your feedback!</p>
                <p className="text-sm text-[#7a7570] text-center">Your review helps build trust in the community.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-start px-4 pt-4 pb-2">
                  <button onClick={() => setShowFeedback(false)} className="w-8 h-8 rounded-full bg-[#e8e4df] flex items-center justify-center text-[#7a7570]"><X size={15} /></button>
                </div>
                <div className="px-5 pb-5 text-center">
                  <h2 className="font-bold text-[#1a1a1a] text-[18px] leading-tight mb-1">Were You Happy With the Work?</h2>
                  <p className="text-sm text-[#7a7570]">Your feedback helps {displayParticipant.displayName} improve!</p>
                </div>
                <div className="flex gap-3 px-5 mb-5">
                  {RATINGS.map(({ key, emoji, label }) => (
                    <button key={key} onClick={() => setRating(key)}
                      className={`flex-1 flex flex-col items-center gap-2 py-4 px-1 rounded-2xl border-2 transition-all ${
                        rating === key
                          ? key === "not_satisfied" ? "border-red-300 bg-red-50" : "border-[#6c47ff] bg-[#f5f0ff]"
                          : "border-[#e8e4df] bg-white"
                      }`}>
                      <span className="text-3xl leading-none">{emoji}</span>
                      <span className={`text-[11px] font-semibold text-center leading-tight whitespace-pre-line ${rating === key ? key === "not_satisfied" ? "text-red-500" : "text-[#6c47ff]" : "text-[#4a4a4a]"}`}>{label}</span>
                    </button>
                  ))}
                </div>
                <div className="mx-5 mb-5 border border-[#e8e4df] rounded-2xl overflow-hidden bg-[#fafafa]">
                  <div className="px-4 pt-4 pb-1"><span className="text-sm font-semibold text-[#1a1a1a]">Leave a note: </span></div>
                  <textarea value={comment} onChange={(e) => setComment(e.target.value.slice(0, 200))} rows={3} className="w-full px-4 pb-4 text-sm text-[#4a4a4a] bg-transparent resize-none outline-none leading-relaxed" placeholder="Share your experience…" />
                </div>
                <div className="px-5 pb-8">
                  <button onClick={handleSubmitFeedback} disabled={rating === null || submitting}
                    className="w-full h-14 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg, #6c47ff, #7c5ce7)" }}>
                    {submitting ? <><Loader2 size={18} className="animate-spin" /> Submitting…</> : "Submit Feedback"}
                  </button>
                  {rating === null && <p className="text-center text-xs text-[#b0aaa5] mt-2">Select an option above to continue</p>}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
