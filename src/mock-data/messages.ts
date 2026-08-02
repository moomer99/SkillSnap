// ─────────────────────────────────────────────
// SkillSnap — Mock Messages & Threads
// Replace with messageService.getThreads() / getMessages()
// ─────────────────────────────────────────────
import type { MessageThread, Message } from "@/types";
import { MOCK_USERS } from "./users";

const [marcus, priya, jake, sam, ana] = MOCK_USERS;

// thread_1 started 25+ hours ago so "Mark Job as Done" is unlocked in demo
const NOW = Date.now();
const hoursAgo = (h: number) => new Date(NOW - h * 60 * 60 * 1000).toISOString();

export const MOCK_THREADS: MessageThread[] = [
  {
    id: "thread_1",
    participant: marcus,
    lastMessage: "Sure! I have a slot this Saturday at 2pm, does that work?",
    lastMessageTime: "2m",
    unreadCount: 2,
    startedAt: hoursAgo(26), // 26h ago — unlocked
  },
  {
    id: "thread_2",
    participant: priya,
    lastMessage: "Here are some looks from my recent bridal session ✨",
    lastMessageTime: "14m",
    unreadCount: 0,
    startedAt: hoursAgo(30),
  },
  {
    id: "thread_3",
    participant: jake,
    lastMessage: "I can come do a free quote on Thursday if you're around",
    lastMessageTime: "1h",
    unreadCount: 1,
    startedAt: hoursAgo(2), // 2h ago — locked (< MIN_CONVERSATION_HOURS)
  },
  {
    id: "thread_4",
    participant: sam,
    lastMessage: "Just posted my new 6-week transformation! Check it out",
    lastMessageTime: "3h",
    unreadCount: 0,
    startedAt: hoursAgo(48),
  },
  {
    id: "thread_5",
    participant: ana,
    lastMessage: "Thank you! Glad you were happy with the service 😊",
    lastMessageTime: "1d",
    unreadCount: 0,
    startedAt: hoursAgo(72),
  },
];

export const MOCK_MESSAGES: Message[] = [
  { id: "msg_1", threadId: "thread_1", from: "them", text: "Hey! Saw your profile on SkillSnap — love your work 🔥", time: "10:02 AM" },
  { id: "msg_2", threadId: "thread_1", from: "me", text: "Hey thanks! Really appreciate that 😊", time: "10:04 AM" },
  { id: "msg_3", threadId: "thread_1", from: "them", text: "I'm looking for a skin fade + beard shape. Are you taking bookings this week?", time: "10:05 AM" },
  { id: "msg_4", threadId: "thread_1", from: "me", text: "Yes for sure! I have a slot Thursday at 3pm or Saturday at 11am — which works better for you?", time: "10:07 AM" },
  { id: "msg_5", threadId: "thread_1", from: "them", text: "Saturday at 11am would be perfect 👌", time: "10:09 AM" },
  { id: "msg_6", threadId: "thread_1", from: "me", text: "Locked in! Saturday 11am. I'll send you my location closer to the day. Any specific style inspo I should know about?", time: "10:10 AM" },
  { id: "msg_7", threadId: "thread_1", from: "them", text: "I'll send a photo. Something similar to what you posted last week actually", time: "10:12 AM" },
  { id: "msg_8", threadId: "thread_1", from: "me", text: "Perfect, that cut was a banger. See you Saturday 💪", time: "10:13 AM" },
];

export function getThreadMessages(threadId: string): Message[] {
  return MOCK_MESSAGES.filter((m) => m.threadId === threadId);
}
