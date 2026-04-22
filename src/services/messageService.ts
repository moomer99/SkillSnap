// ─────────────────────────────────────────────
// SkillSnap — Message Service
// Integration point: swap for real-time chat API
// (Supabase Realtime / Socket.io / Ably)
// ─────────────────────────────────────────────
import type { MessageThread, Message } from "@/types";
import { MOCK_THREADS, MOCK_MESSAGES, getThreadMessages } from "@/mock-data/messages";

export const messageService = {
  async getThreads(): Promise<MessageThread[]> {
    // TODO: GET /messages/threads
    return MOCK_THREADS;
  },

  async getMessages(threadId: string): Promise<Message[]> {
    // TODO: GET /messages/threads/:id/messages
    return getThreadMessages(threadId);
  },

  async sendMessage(_threadId: string, _text: string): Promise<Message> {
    // TODO: POST /messages/threads/:id/messages
    // TODO: trigger real-time broadcast
    const msg: Message = {
      id: `msg_${Date.now()}`,
      threadId: _threadId,
      from: "me",
      text: _text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    return msg;
  },

  async markThreadRead(_threadId: string): Promise<void> {
    // TODO: PATCH /messages/threads/:id/read
  },

  async startThread(_participantId: string): Promise<MessageThread> {
    // TODO: POST /messages/threads { participantId }
    return MOCK_THREADS[0];
  },

  // Jobs Done verification request — sent via chat
  async sendJobCompletionRequest(_threadId: string): Promise<void> {
    // TODO: POST /jobs/request { threadId }
    // Both parties must confirm → increments jobsDone
  },
};
