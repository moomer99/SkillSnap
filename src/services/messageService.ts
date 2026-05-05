// ─────────────────────────────────────────────
// SkillSnap — Message Service (Supabase + Realtime)
// Connect flow: Connect button → getOrCreateConversation()
// Realtime: subscribeToMessages() returns an unsubscribe fn.
// ─────────────────────────────────────────────
import { getSupabase, getAuthSupabase, getRealtimeSupabase } from "@/lib/supabase";
import { mapProfile } from "./authService";
import type { MessageThread, Message } from "@/types";

function mapThread(
  conv: Record<string, unknown>,
  currentUserId: string,
  members: Record<string, unknown>[]
): MessageThread {
  const otherMember = members.find((m) => m.user_id !== currentUserId);
  const participant = otherMember?.profiles
    ? mapProfile(otherMember.profiles as Record<string, unknown>)
    : null;

  return {
    id: conv.id as string,
    participant: participant!,
    lastMessage: (conv.last_message_text as string) ?? "",
    lastMessageTime: conv.last_message_at
      ? new Date(conv.last_message_at as string).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "",
    unreadCount: Number(
      (members.find((m) => m.user_id === currentUserId) as Record<string, unknown>)?.unread_count ?? 0
    ),
  };
}

function mapMessage(row: Record<string, unknown>, currentUserId: string): Message {
  const profile = row.profiles as Record<string, unknown> | undefined;
  return {
    id: row.id as string,
    threadId: row.conversation_id as string,
    from: row.sender_id === currentUserId ? "me" : "them",
    text: row.text as string,
    time: new Date(row.created_at as string).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    senderName: profile?.display_name as string | undefined,
  };
}

// Uses getSession() (localStorage — instant, no network) first, falls back to
// getUser() (live network call). This prevents getThreads/getMessages from
// returning empty just because the auth server is momentarily slow.
async function getCurrentUserId(): Promise<string | null> {
  const sb = getAuthSupabase();
  const { data: { session } } = await sb.auth.getSession();
  if (session?.user?.id) return session.user.id;
  // Session not in localStorage yet (e.g. first load after OAuth) — try live call
  const { data: { user } } = await sb.auth.getUser();
  return user?.id ?? null;
}

async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await getAuthSupabase().auth.getSession();
  return session?.access_token ?? null;
}

export const messageService = {
  async getThreads(): Promise<MessageThread[]> {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.warn("[messageService] getThreads: no userId — user not authenticated");
      return [];
    }

    // Use getAuthSupabase() for all thread queries so RLS auth.uid() always
    // resolves correctly regardless of environment (sandbox proxy vs real domain).
    const sb = getAuthSupabase();

    const { data: memberRows, error: memberErr } = await sb
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", userId);

    if (memberErr) {
      console.error("[messageService] getThreads memberRows error:", memberErr.message);
      return [];
    }
    if (!memberRows?.length) {
      console.log("[messageService] getThreads: no conversations for user", userId);
      return [];
    }

    const conversationIds = memberRows.map((r) => r.conversation_id);

    const { data: conversations, error: convErr } = await sb
      .from("conversations")
      .select("*")
      .in("id", conversationIds)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (convErr) {
      console.error("[messageService] getThreads conversations error:", convErr.message);
      return [];
    }
    if (!conversations?.length) return [];

    const { data: members, error: membersErr } = await sb
      .from("conversation_members")
      .select("*, profiles(*)")
      .in("conversation_id", conversationIds);

    if (membersErr) {
      console.error("[messageService] getThreads members error:", membersErr.message);
    }

    const result = conversations
      .map((conv) => {
        const convMembers = (members ?? []).filter(
          (m) => m.conversation_id === conv.id
        );
        return mapThread(
          conv as Record<string, unknown>,
          userId,
          convMembers as Record<string, unknown>[]
        );
      })
      .filter((t) => t.participant != null);

    console.log(`[messageService] getThreads: loaded ${result.length} threads for user ${userId}`);
    return result;
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await getAuthSupabase()
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[messageService] getMessages error:", error.message);
      return [];
    }

    return (data ?? []).map((row) => mapMessage(row as Record<string, unknown>, userId));
  },

  async sendMessage(conversationId: string, text: string): Promise<Message> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");
    const sb = getAuthSupabase();

    const { data, error } = await sb
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: userId, text })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error("No data returned from insert");

    // Keep conversations row fresh (fire-and-forget, non-fatal)
    sb.from("conversations")
      .update({ last_message_text: text, last_message_at: new Date().toISOString() })
      .eq("id", conversationId)
      .then(() => {})
      .catch(() => {});

    messageService.incrementUnreadForOthers(conversationId, userId).catch(() => {});

    return mapMessage(data as Record<string, unknown>, userId);
  },

  async incrementUnreadForOthers(conversationId: string, senderId: string): Promise<void> {
    const sb = getAuthSupabase();
    const { data: members } = await sb
      .from("conversation_members")
      .select("user_id, unread_count")
      .eq("conversation_id", conversationId)
      .neq("user_id", senderId);

    if (!members?.length) return;

    await Promise.all(
      members.map((m) =>
        sb
          .from("conversation_members")
          .update({ unread_count: (m.unread_count ?? 0) + 1 })
          .eq("conversation_id", conversationId)
          .eq("user_id", m.user_id)
      )
    );
  },

  async markThreadRead(conversationId: string): Promise<void> {
    const userId = await getCurrentUserId();
    if (!userId) return;
    await getAuthSupabase()
      .from("conversation_members")
      .update({ unread_count: 0 })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId);
  },

  async getOrCreateConversation(participantId: string): Promise<string> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");
    const sb = getAuthSupabase();

    const { data: existingMemberships } = await sb
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", userId);

    if (existingMemberships?.length) {
      const ids = existingMemberships.map((m) => m.conversation_id);
      const { data: shared } = await sb
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", participantId)
        .in("conversation_id", ids)
        .maybeSingle();

      if (shared) return shared.conversation_id;
    }

    const { data: conv } = await sb
      .from("conversations")
      .insert({})
      .select()
      .single();

    if (!conv) throw new Error("Failed to create conversation");

    await sb.from("conversation_members").insert([
      { conversation_id: conv.id, user_id: userId },
      { conversation_id: conv.id, user_id: participantId },
    ]);

    console.log("[messageService] getOrCreateConversation: created", conv.id);
    return conv.id;
  },

  // Per-conversation Realtime subscription (used inside ChatScreen while chat is open).
  subscribeToMessages(conversationId: string, onMessage: (msg: Message) => void): () => void {
    let channel: ReturnType<ReturnType<typeof getRealtimeSupabase>["channel"]> | null = null;
    let cancelled = false;

    Promise.all([getCurrentUserId(), getAccessToken()]).then(([currentUserId, token]) => {
      if (cancelled) return;
      const resolvedId = currentUserId ?? "";
      const rt = getRealtimeSupabase();

      if (token) rt.realtime.setAuth(token);

      channel = rt
        .channel(`messages:conv:${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            console.log("[Realtime] subscribeToMessages INSERT:", payload.new);
            const msg = mapMessage(payload.new as Record<string, unknown>, resolvedId);
            onMessage(msg);
          }
        )
        .subscribe((status, err) => {
          console.log(`[Realtime] subscribeToMessages [${conversationId}] status: ${status}`, err ?? "");
        });
    });

    return () => {
      cancelled = true;
      if (channel) getRealtimeSupabase().removeChannel(channel);
    };
  },

  // Global subscription — receives all INSERT events across all the user's conversations.
  // Authenticated via JWT so Supabase RLS delivers only authorized rows.
  subscribeToAllMessages(
    idsRef: { current: string[] },
    onMessage: (msg: Message) => void
  ): () => void {
    let channel: ReturnType<ReturnType<typeof getRealtimeSupabase>["channel"]> | null = null;
    let cancelled = false;

    Promise.all([getCurrentUserId(), getAccessToken()]).then(([currentUserId, token]) => {
      if (cancelled) return;
      const resolvedId = currentUserId ?? "";
      const rt = getRealtimeSupabase();

      if (token) rt.realtime.setAuth(token);

      console.log("[Realtime] subscribeToAllMessages: subscribing for user", resolvedId);

      channel = rt
        .channel("messages:global")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          (payload) => {
            const row = payload.new as Record<string, unknown>;
            console.log("[Realtime] subscribeToAllMessages INSERT:", row);
            const msg = mapMessage(row, resolvedId);
            onMessage(msg);
          }
        )
        .subscribe((status, err) => {
          console.log(`[Realtime] subscribeToAllMessages status: ${status}`, err ?? "");
        });
    });

    return () => {
      cancelled = true;
      if (channel) getRealtimeSupabase().removeChannel(channel);
    };
  },

  subscribeToConversationUpdates(
    idsRef: { current: string[] },
    onUpdate: () => void
  ): () => void {
    let channel: ReturnType<ReturnType<typeof getRealtimeSupabase>["channel"]> | null = null;
    let cancelled = false;

    getAccessToken().then((token) => {
      if (cancelled) return;
      const rt = getRealtimeSupabase();

      if (token) rt.realtime.setAuth(token);

      channel = rt
        .channel("conversations:updates")
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "conversations" },
          (payload) => {
            const updatedId = (payload.new as Record<string, unknown>).id as string;
            console.log("[Realtime] conversation UPDATE:", updatedId);
            if (idsRef.current.includes(updatedId)) onUpdate();
          }
        )
        .subscribe((status, err) => {
          console.log(`[Realtime] subscribeToConversationUpdates status: ${status}`, err ?? "");
        });
    });

    return () => {
      cancelled = true;
      if (channel) getRealtimeSupabase().removeChannel(channel);
    };
  },

  async sendJobCompletionRequest(_conversationId: string): Promise<void> {
    // TODO: insert jobs_done record with skiller_confirmed=true
  },

  async startThread(participantId: string): Promise<{ id: string }> {
    const convId = await messageService.getOrCreateConversation(participantId);
    return { id: convId };
  },
};
