"use client";
// ─────────────────────────────────────────────
// SkillSnap — Message Thread List Item
// Used in MessagesScreen
// ─────────────────────────────────────────────
import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { MessageThread } from "@/types";
import UserAvatar from "./UserAvatar";

interface MessageThreadItemProps {
  thread: MessageThread;
  onClick: () => void;
  isOnline?: boolean;
  onDelete?: (threadId: string) => void;
}

export default function MessageThreadItem({ thread, onClick, isOnline = false, onDelete }: MessageThreadItemProps) {
  const { participant, lastMessage, lastMessageTime, unreadCount } = thread;
  const hasUnread = unreadCount > 0;
  const [pressTimer, setPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);

  return (
    <>
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3.5 px-4 py-3.5 active:bg-[#f8f7f5] transition-colors text-left"
        onMouseDown={() => {
          const t = setTimeout(() => setShowDeleteSheet(true), 500);
          setPressTimer(t);
        }}
        onMouseUp={() => { if (pressTimer) clearTimeout(pressTimer); }}
        onMouseLeave={() => { if (pressTimer) clearTimeout(pressTimer); }}
        onTouchStart={() => {
          const t = setTimeout(() => setShowDeleteSheet(true), 500);
          setPressTimer(t);
        }}
        onTouchEnd={() => { if (pressTimer) clearTimeout(pressTimer); }}
      >
        <div className="relative flex-shrink-0">
          <UserAvatar user={participant} size="md" />
          {hasUnread ? (
            <div className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#6c47ff] flex items-center justify-center">
              <span className="text-[9px] text-white font-bold">{unreadCount}</span>
            </div>
          ) : isOnline ? (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
          ) : null}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className={`text-sm font-semibold text-[#1a1a1a] ${hasUnread ? "font-bold" : ""}`}>
              {participant.displayName}
            </span>
            <span className={`text-[11px] flex-shrink-0 ml-2 ${hasUnread ? "text-[#6c47ff] font-semibold" : "text-[#b0aaa5]"}`}>
              {lastMessageTime}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            {participant.skill && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#f0eeea] text-[#7a7570] font-medium">
                {participant.skill}
              </span>
            )}
            {thread.jobConfirmed && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#f0fdf4] text-green-600 font-semibold border border-green-200">
                Hired ✓
              </span>
            )}
          </div>
          <p className={`text-xs mt-0.5 truncate ${hasUnread ? "text-[#1a1a1a] font-medium" : "text-[#7a7570]"}`}>
            {lastMessage}
          </p>
        </div>
      </button>

      {showDeleteSheet && (
        <div className="fixed inset-0 z-[200] flex items-end"
          onClick={() => setShowDeleteSheet(false)}>
          <div className="w-full bg-white rounded-t-3xl px-5 pt-3 pb-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-[#e8e4df] mx-auto mb-5" />
            <div className="flex flex-col items-center text-center px-2 pb-2">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h3 className="font-bold text-[#1a1a1a] text-lg mb-1">
                Delete conversation?
              </h3>
              <p className="text-sm text-[#7a7570] mb-6 leading-relaxed">
                This removes the chat from your list only.
                The other person won't be notified.
              </p>
              <button
                onClick={() => { onDelete?.(thread.id); setShowDeleteSheet(false); }}
                className="w-full rounded-2xl font-bold text-base text-white mb-3 bg-red-500"
                style={{ height: 52 }}
              >
                Delete for me
              </button>
              <button
                onClick={() => setShowDeleteSheet(false)}
                className="w-full h-12 rounded-2xl font-semibold text-sm text-[#7a7570] bg-[#f0eeea]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
