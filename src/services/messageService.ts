// ─────────────────────────────────────────────
// SkillSnap — Message Service (Supabase + Realtime)
// Connect flow: Connect button → getOrCreateConversation()
// Realtime: subscribeToMessages() returns an unsubscribe fn.
// ─────────────────────────────────────────────
import { getSupabase, getRealtimeSupabase } from "@/lib/supabase";
import { mapProfile } from "./authService";
import type { MessageThread, Message } from "@/types";

function mapThread(
  conv: Record<string, unknown>,
  currentUserId: string,
  members: Record<string, unknown>[]
): MessageThread {
  // Find the other participant
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

async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await getSupabase().auth.getUser();
  return user?.id ?? null;
}

export const messageService = {
  async getThreads(): Promise<MessageThread[]> {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const sb = getSupabase();
    // Get all conversations the current user is a member of
    const { data: memberRows } = await sb
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", userId);

    if (!memberRows?.length) return [];
    const conversationIds = memberRows.map((r) => r.conversation_id);

    const { data: conversations } = await sb
      .from("conversations")
      .select("*")
      .in("id", conversationIds)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (!conversations?.length) return [];

    // Load all members (with profiles) for these conversations
    const { data: members } = await sb
      .from("conversation_members")
      .select("*, profiles(*)")
      .in("conversation_id", conversationIds);

    return conversations
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
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const { data } = await getSupabase()
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    return (data ?? []).map((row) => mapMessage(row as Record<string, unknown>, userId));
  },

  async sendMessage(conversationId: string, text: string): Promise<Message> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");
    const sb = getSupabase();

    const { data, error } = await sb
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: userId, text })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error("No data returned from insert");

    // Increment unread_count for the other participant
    messageService.incrementUnreadForOthers(conversationId, userId).catch(() => {});

    return mapMessage(data as Record<string, unknown>, userId);
  },

  async incrementUnreadForOthers(conversationId: string, senderId: string): Promise<void> {
    const sb = getSupabase();
    // Get all members except the sender
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

  // Reset unread count when user opens a conversation
  async markThreadRead(conversationId: string): Promise<void> {
    const userId = await getCurrentUserId();
    if (!userId) return;
    await getSupabase()
      .from("conversation_members")
      .update({ unread_count: 0 })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId);
  },

  // Called when user taps Connect — finds existing or creates new conversation
  async getOrCreateConversation(participantId: string): Promise<string> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");
    const sb = getSupabase();

    // Check if conversation already exists between these two users
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

    // Create new conversation
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

    return conv.id;
  },

  // Supabase Realtime subscription — returns unsubscribe function.
  // Resolves current user ID before subscribing to guarantee correct from/them mapping.
  subscribeToMessages(conversationId: string, onMessage: (msg: Message) => void): () => void {
    let channel: ReturnType<ReturnType<typeof getRealtimeSupabase>["channel"]> | null = null;
    let cancelled = false;

    getCurrentUserId().then((currentUserId) => {
      if (cancelled) return;
      const resolvedId = currentUserId ?? "";
      const rt = getRealtimeSupabase();

      channel = rt
        .channel(`messages:${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const msg = mapMessage(payload.new as Record<string, unknown>, resolvedId);
            onMessage(msg);
          }
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR") {
            console.warn("Realtime subscription error for conversation", conversationId);
          }
        });
    });

    return () => {
      cancelled = true;
      if (channel) getRealtimeSupabase().removeChannel(channel);
    };
  },

  // Subscribes to INSERT events for ALL of the user's conversations.
  // Used in useMessages so recipients get notified even when chat screen is closed.
  subscribeToAllMessages(
    idsRef: { current: string[] },
    onMessage: (msg: Message) => void
  ): () => void {
    let channel: ReturnType<ReturnType<typeof getRealtimeSupabase>["channel"]> | null = null;
    let cancelled = false;

    getCurrentUserId().then((currentUserId) => {
      if (cancelled) return;
      const resolvedId = currentUserId ?? "";
      const rt = getRealtimeSupabase();

      channel = rt
        .channel("messages:all")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          (payload) => {
            const row = payload.new as Record<string, unknown>;
            const convId = row.conversation_id as string;
            if (!idsRef.current.includes(convId)) return;
            const msg = mapMessage(row, resolvedId);
            onMessage(msg);
          }
        )
        .subscribe();
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
    const rt = getRealtimeSupabase();
    const channel = rt
      .channel("conversations:updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        (payload) => {
          const updatedId = (payload.new as Record<string, unknown>).id as string;
          if (idsRef.current.includes(updatedId)) {
            onUpdate();
          }
        }
      )
      .subscribe();

    return () => {
      getRealtimeSupabase().removeChannel(channel);
    };
  },

  // Jobs Done verification request sent via chat
  async sendJobCompletionRequest(_conversationId: string): Promise<void> {
    // TODO: insert jobs_done record with skiller_confirmed=true
    // The client sees a verification prompt in the chat UI
  },

  // Legacy compat alias
  async startThread(participantId: string): Promise<{ id: string }> {
    const convId = await messageService.getOrCreateConversation(participantId);
    return { id: convId };
  },
};
