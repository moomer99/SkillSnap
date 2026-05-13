"use client";
import type { MessageThread } from "@/types";
import UserAvatar from "./UserAvatar";

interface MessageThreadItemProps {
  thread: MessageThread;
  onClick: () => void;
  isOnline?: boolean;
}

export default function MessageThreadItem({ thread, onClick, isOnline = false }: MessageThreadItemProps) {
  const { participant, lastMessage, lastMessageTime, unreadCount } = thread;
  const hasUnread = unreadCount > 0;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3.5 px-4 py-3.5 active:bg-[#f8f7f5] transition-colors text-left"
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
  );
}
