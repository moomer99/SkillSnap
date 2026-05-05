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
      console.warn("[messageService] getThreads: no userId");
      return [];
    }

    const sb = getAuthSupabase();

    // Query conversation_members with joined conversation and profile data
    // Never query conversations table directly — RLS blocks it
    const { data: memberships, error } = await sb
      .from("conversation_members")
      .select(`
        conversation_id,
        unread_count,
        conversations (
          id,
          last_message_text,
          last_message_at
        )
      `)
      .eq("user_id", userId)
      .order("conversation_id", { ascending: false });

    if (error) {
      console.error("[messageService] getThreads error:", error.message);
      return [];
    }

    if (!memberships?.length) {
      console.log("[messageService] getThreads: no conversations for user", userId);
      return [];
    }

    const conversationIds = memberships.map((m) => m.conversation_id);

    // Get other members with their profiles
    const { data: otherMembers, error: membersErr } = await sb
      .from("conversation_members")
      .select("*, profiles(*)")
      .in("conversation_id", conversationIds)
      .neq("user_id", userId);

    if (membersErr) {
      console.error("[messageService] getThreads otherMembers error:", membersErr.message);
    }

    const result = memberships
      .map((membership) => {
        const conv = membership.conversations as Record<string, unknown>;
        if (!conv) return null;

        const otherMember = (otherMembers ?? []).find(
          (m) => m.conversation_id === membership.conversation_id
        );
        if (!otherMember?.profiles) return null;

        const participant = mapProfile(otherMember.profiles as Record<string, unknown>);

        return {
          id: membership.conversation_id,
          participant,
          lastMessage: (conv.last_message_text as string) ?? "",
          lastMessageTime: conv.last_message_at
            ? new Date(conv.last_message_at as string).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
          unreadCount: membership.unread_count ?? 0,
        } as MessageThread;
      })
      .filter(Boolean) as MessageThread[];

    console.log(`[messageService] getThreads: loaded ${result.length} threads`);
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

    // Find existing conversation by checking conversation_members only
    // Never query conversations table directly — RLS blocks it before membership exists
    const { data: myMemberships } = await sb
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", userId);

    if (myMemberships?.length) {
      const myIds = myMemberships.map((m) => m.conversation_id);
      const { data: shared } = await sb
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", participantId)
        .in("conversation_id", myIds)
        .maybeSingle();

      if (shared) return shared.conversation_id;
    }

    // Create new conversation via SECURITY DEFINER RPC — direct INSERT is RLS-blocked
    const { data: newConvId, error: convError } = await sb.rpc("create_conversation");

    if (convError || !newConvId) throw new Error("Failed to create conversation");

    const conv = { id: newConvId as string };

    const { error: senderErr } = await sb.rpc("add_conversation_member", {
      p_conversation_id: conv.id,
      p_user_id: userId,
    });

    if (senderErr) throw new Error("Failed to join conversation");

    const { error: participantErr } = await sb.rpc("add_conversation_member", {
      p_conversation_id: conv.id,
      p_user_id: participantId,
    });

    if (participantErr) {
      console.warn("[messageService] failed to add participant:", participantErr.message);
    }

    console.log("[messageService] getOrCreateConversation: created", conv.id);
    return conv.id;
  },

  // Called by the recipient when they receive a Realtime message for a conversation
  // they are not yet a member of. Uses the SECURITY DEFINER RPC which only succeeds
  // if the caller was legitimately added to the conversation by the sender.
  async joinConversation(conversationId: string): Promise<boolean> {
    const userId = await getCurrentUserId();
    if (!userId) return false;
    const sb = getAuthSupabase();

    const { error } = await sb.rpc("add_conversation_member", {
      p_conversation_id: conversationId,
      p_user_id: userId,
    });

    if (error) {
      console.error("[messageService] joinConversation error:", error.message);
      return false;
    }

    console.log("[messageService] joinConversation: joined", conversationId);
    return true;
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
            const convId = row.conversation_id as string;
            const senderId = row.sender_id as string;
            // Ignore messages sent by the current user (already handled optimistically)
            // and messages for conversations the user has no relationship with.
            // idsRef may be empty for brand-new conversations — let those through for auto-join.
            if (senderId === resolvedId) return;
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
