"use client";
import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Search, Bell, BellOff, CheckCircle, X } from "lucide-react";
import type { Screen } from "@/types";
import { useMessages } from "@/hooks/useMessages";
import MessageThreadItem from "./shared/MessageThreadItem";
import { getNotifPermission, requestNotifPermission, type NotifPermission } from "@/hooks/useNotifications";
import { useAppState } from "@/state/AppState";
import { getAuthSupabase } from "@/lib/supabase";
import { messageService } from "@/services/messageService";

const SUPABASE_CONFIGURED =
  !!(process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref"));

interface JobsRequest {
  notificationId: string;
  jobId: string;
  fromUserId: string;
  fromName: string;
}

interface MessagesScreenProps {
  onNavigate: (s: Screen) => void;
}

export default function MessagesScreen({ onNavigate: _onNavigate }: MessagesScreenProps) {
  const { threads, threadsLoading, openThread } = useMessages();
  const { state, dispatch, onlineUserIds } = useAppState();
  const [query, setQuery] = useState("");
  const [notifPerm, setNotifPerm] = useState<NotifPermission>("default");
  const [notifDismissed, setNotifDismissed] = useState(false);
  const [jobsRequests, setJobsRequests] = useState<JobsRequest[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    setNotifPerm(getNotifPermission());
    try { setNotifDismissed(!!localStorage.getItem("skillsnap_notif_dismissed")); } catch {}
    dispatch({ type: "CLEAR_UNREAD_NOTIF_COUNT" });
    dispatch({ type: "CLEAR_ALL_THREAD_UNREAD" });
    if (state.currentUser?.id) {
      getAuthSupabase()
        .from("notifications")
        .update({ read: true })
        .eq("user_id", state.currentUser.id)
        .eq("read", false)
        .then(() => {});
    }
  }, []);

  // Mark all threads as read in DB so loadThreads can't restore the badge count
  useEffect(() => {
    if (!state.threads.length) return;
    state.threads.forEach(thread => {
      messageService.markThreadRead(thread.id).catch(() => {});
    });
    dispatch({ type: "CLEAR_ALL_THREAD_UNREAD" });
  }, [state.threads.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch unread jobs_done_request notifications on mount, then mark all read
  useEffect(() => {
    if (!state.isAuthenticated || !state.currentUser) return;
    const userId = state.currentUser.id;
    const sb = getAuthSupabase();

    sb.from("notifications")
      .select("id, from_user_id, message")
      .eq("user_id", userId)
      .eq("type", "jobs_done_request")
      .eq("read", false)
      .then(async ({ data }) => {
        if (!data?.length) return;

        // Fetch corresponding pending job IDs
        const requests: JobsRequest[] = [];
        for (const row of data) {
          const { data: jobRow } = await sb
            .from("jobs_done")
            .select("id")
            .eq("client_id", userId)
            .eq("skiller_id", row.from_user_id)
            .eq("skiller_confirmed", true)
            .eq("client_confirmed", false)
            .is("verified_at", null)
            .maybeSingle();
          if (jobRow?.id) {
            requests.push({
              notificationId: row.id,
              jobId: jobRow.id,
              fromUserId: row.from_user_id,
              fromName: (row.message as string) ?? "A pro",
            });
          }
        }
        setJobsRequests(requests);

        // Mark all as read (Fix 1C)
        await sb
          .from("notifications")
          .update({ read: true })
          .eq("user_id", userId)
          .eq("read", false);
        dispatch({ type: "CLEAR_UNREAD_NOTIF_COUNT" });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentUser?.id]);

  const handleConfirm = useCallback(async (req: JobsRequest) => {
    setProcessingId(req.jobId);
    const sb = getAuthSupabase();
    const now = new Date().toISOString();
    // DB trigger handle_job_confirmed fires on this update and increments jobs_done on the profile
    const { error } = await sb
      .from("jobs_done")
      .update({ client_confirmed: true, verified_at: now })
      .eq("id", req.jobId);
    if (error) console.error("[JobsDone] confirm update failed:", error.message);

    // Re-fetch skiller's updated jobs_done count and push it into app state
    const { data: profile } = await sb
      .from("profiles")
      .select("jobs_done")
      .eq("id", req.fromUserId)
      .single();
    if (profile) {
      dispatch({ type: "UPDATE_CURRENT_USER", patch: { jobsDone: Number(profile.jobs_done ?? 0) } });
    }

    setJobsRequests((prev) => prev.filter((r) => r.jobId !== req.jobId));
    setProcessingId(null);
  }, [dispatch]);

  const handleDecline = useCallback(async (req: JobsRequest) => {
    setProcessingId(req.jobId);
    const sb = getAuthSupabase();
    await sb.from("jobs_done").delete().eq("id", req.jobId);
    setJobsRequests((prev) => prev.filter((r) => r.jobId !== req.jobId));
    setProcessingId(null);
  }, []);

  async function handleEnableNotifs() {
    const result = await requestNotifPermission();
    setNotifPerm(result);
  }

  function handleDismissNotifs() {
    setNotifDismissed(true);
    try { localStorage.setItem("skillsnap_notif_dismissed", "1"); } catch {}
  }

  const showNotifBanner = notifPerm === "default" && !notifDismissed;

  const filtered = query.trim()
    ? threads.filter((t) => {
        const q = query.toLowerCase();
        return (
          t.participant.displayName.toLowerCase().includes(q) ||
          t.participant.skill?.toLowerCase().includes(q) ||
          t.participant.location?.toLowerCase().includes(q) ||
          t.lastMessage.toLowerCase().includes(q)
        );
      })
    : threads;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e8e4df] px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-[#1a1a1a]">Messages</h1>
          {threads.reduce((n, t) => n + t.unreadCount, 0) > 0 && (
            <span className="text-xs font-bold bg-[#6c47ff] text-white px-2 py-0.5 rounded-full">
              {threads.reduce((n, t) => n + t.unreadCount, 0)}
            </span>
          )}
        </div>
        {/* Live search input */}
        <div className="flex items-center gap-2.5 bg-[#f0eeea] rounded-2xl px-4 h-10">
          <Search size={15} className="text-[#b0aaa5] flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, skill or location…"
            className="flex-1 bg-transparent text-sm text-[#1a1a1a] placeholder-[#b0aaa5] outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-[#b0aaa5] text-xs font-semibold">
              ✕
            </button>
          )}
        </div>
      </header>

      {/* Notification permission banner */}
      {showNotifBanner && (
        <div className="mx-4 mt-3 mb-1 bg-[#f5f0ff] border border-[#c4b5fd] rounded-2xl px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#6c47ff] flex items-center justify-center flex-shrink-0">
            <Bell size={16} color="white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#1a1a1a] leading-tight">Get message alerts</p>
            <p className="text-xs text-[#7a7570] mt-0.5">Know instantly when someone messages you</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDismissNotifs}
              className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#b0aaa5] active:bg-[#f0eeea]"
            >
              <BellOff size={13} />
            </button>
            <button
              onClick={handleEnableNotifs}
              className="text-xs font-bold text-white px-3 py-1.5 rounded-full"
              style={{ background: "linear-gradient(135deg,#6c47ff,#8b6af5)" }}
            >
              Enable
            </button>
          </div>
        </div>
      )}

      {/* Notification granted confirmation */}
      {notifPerm === "granted" && (
        <div className="mx-4 mt-3 mb-1 bg-[#f0fdf4] border border-green-200 rounded-2xl px-4 py-2.5 flex items-center gap-2.5">
          <Bell size={14} className="text-green-500 flex-shrink-0" />
          <p className="text-xs font-semibold text-green-700">Message notifications are on</p>
        </div>
      )}

      {/* Jobs Done request banners */}
      {jobsRequests.map((req) => (
        <div key={req.jobId} className="mx-4 mt-3 bg-white rounded-2xl border border-[#e8e4df] shadow-sm overflow-hidden">
          <div className="px-4 pt-3 pb-2.5">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-base">✅</span>
              <p className="font-bold text-[#1a1a1a] text-sm">{req.fromName}</p>
            </div>
            <p className="text-xs text-[#7a7570] leading-snug">requested a Jobs Done confirmation. Did they complete the work?</p>
          </div>
          <div className="flex border-t border-[#f0eeea]">
            <button
              disabled={processingId === req.jobId}
              className="flex-1 py-2.5 text-sm font-semibold text-[#7a7570] active:bg-gray-50 flex items-center justify-center gap-1.5 disabled:opacity-40"
              onClick={() => handleDecline(req)}
            >
              <X size={14} /> Decline
            </button>
            <div className="w-px bg-[#f0eeea]" />
            <button
              disabled={processingId === req.jobId}
              className="flex-1 py-2.5 text-sm font-bold text-[#6c47ff] active:bg-[#f5f0ff] flex items-center justify-center gap-1.5 disabled:opacity-40"
              onClick={() => handleConfirm(req)}
            >
              <CheckCircle size={14} /> Confirm ✓
            </button>
          </div>
        </div>
      ))}

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24 divide-y divide-[#f0eeea]">
        {threadsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3.5 px-4 py-3.5">
              <div className="w-11 h-11 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded animate-pulse w-2/5" />
                <div className="h-2.5 bg-gray-100 rounded animate-pulse w-3/4" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 && query ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <p className="text-sm font-semibold text-[#1a1a1a] mb-1">No results for "{query}"</p>
            <p className="text-xs text-[#b0aaa5]">Try searching by name, skill or location</p>
          </div>
        ) : threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[#ede9fe] flex items-center justify-center mb-4">
              <MessageSquare size={28} className="text-[#6c47ff]" />
            </div>
            <p className="text-sm font-semibold text-[#1a1a1a] mb-1">No messages yet</p>
            <p className="text-xs text-[#b0aaa5]">
              Tap Connect on a skiller's profile to start a conversation
            </p>
          </div>
        ) : (
          filtered.map((thread) => (
            <MessageThreadItem
              key={thread.id}
              thread={thread}
              onClick={() => openThread(thread.id)}
              isOnline={onlineUserIds.has(thread.participant?.id ?? "")}
            />
          ))
        )}
      </div>
    </div>
  );
}
