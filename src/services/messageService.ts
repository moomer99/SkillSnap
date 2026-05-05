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

async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await getAuthSupabase().auth.getUser();
  return user?.id ?? null;
}

// Retrieves the current JWT access token for authenticating Realtime channels.
// Supabase Realtime with RLS requires the token to be passed via setAuth()
// so the server can verify the subscriber's identity before delivering rows.
async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await getAuthSupabase().auth.getSession();
  return session?.access_token ?? null;
}

export const messageService = {
  async getThreads(): Promise<MessageThread[]> {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const sb = getSupabase();
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

    // Use proxy-aware client (getSupabase) for reads so this works on both
    // the Orchids sandbox (proxied) and the real domain (direct).
    const { data, error } = await getSupabase()
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
    const sb = getSupabase();
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
    await getSupabase()
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

    return conv.id;
  },

  // Per-conversation Realtime subscription (used inside ChatScreen while chat is open).
  // Authenticates the WS channel with the user's JWT so RLS delivers rows correctly.
  subscribeToMessages(conversationId: string, onMessage: (msg: Message) => void): () => void {
    let channel: ReturnType<ReturnType<typeof getRealtimeSupabase>["channel"]> | null = null;
    let cancelled = false;

    Promise.all([getCurrentUserId(), getAccessToken()]).then(([currentUserId, token]) => {
      if (cancelled) return;
      const resolvedId = currentUserId ?? "";
      const rt = getRealtimeSupabase();

      // Authenticate the Realtime connection with the user's JWT.
      // Required for postgres_changes with RLS — without this, the server
      // treats the subscriber as anon and RLS blocks all row delivery.
      if (token) {
        rt.realtime.setAuth(token);
      }

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
          console.log(`[Realtime] subscribeToMessages status: ${status}`, err ?? "");
          if (status === "CHANNEL_ERROR") {
            console.error("[Realtime] Channel error for conversation", conversationId, err);
          }
        });
    });

    return () => {
      cancelled = true;
      if (channel) getRealtimeSupabase().removeChannel(channel);
    };
  },

  // Global subscription — receives all INSERT events for conversations the user
  // is a member of. Authenticated via JWT so RLS delivers the correct rows.
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

      if (token) {
        rt.realtime.setAuth(token);
      }

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

      if (token) {
        rt.realtime.setAuth(token);
      }

      channel = rt
        .channel("conversations:updates")
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "conversations" },
          (payload) => {
            const updatedId = (payload.new as Record<string, unknown>).id as string;
            console.log("[Realtime] conversation UPDATE:", updatedId);
            if (idsRef.current.includes(updatedId)) {
              onUpdate();
            }
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
