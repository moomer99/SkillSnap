// ─────────────────────────────────────────────
// SkillSnap — Message Service (Supabase + Realtime)
// Connect flow: Connect button → getOrCreateConversation()
// Realtime: subscribeToMessages() returns an unsubscribe fn.
//
// Supabase migration required:
//   ALTER TABLE conversation_members
//   ADD COLUMN IF NOT EXISTS hidden boolean DEFAULT false;
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
    lastMessage: (conv.last_message_text as string) || "New conversation",
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
  const text = row.text as string;
  const isSystem = typeof text === "string" && text.includes("requested a Jobs Done confirmation");
  return {
    id: row.id as string,
    threadId: row.conversation_id as string,
    from: row.sender_id === currentUserId ? "me" : "them",
    text,
    imageUrl: row.image_url as string | undefined,
    time: new Date(row.created_at as string).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    createdAt: row.created_at as string,
    senderName: profile?.display_name as string | undefined,
    isSystem,
  };
}

let cachedUserId: string | null = null;
let cacheTime = 0;

// Module-level channel registry — prevents reusing a channel that is already subscribed.
// keyed by conversationId so cleanup is O(1) and synchronous.
const perConvChannels = new Map<string, ReturnType<ReturnType<typeof getRealtimeSupabase>["channel"]>>();

async function getCurrentUserId(): Promise<string | null> {
  if (cachedUserId && Date.now() - cacheTime < 30000) return cachedUserId;
  const { data: { session } } = await getAuthSupabase().auth.getSession();
  cachedUserId = session?.user?.id ?? null;
  cacheTime = Date.now();
  return cachedUserId;
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

    const { data: memberships, error } = await sb
      .rpc("get_my_threads");

    if (error) {
      console.error("[messageService] getThreads error:", error.message);
      return [];
    }

    if (!memberships?.length) {
      console.log("[messageService] getThreads: no conversations for user", userId);
      return [];
    }

    // Filter out threads hidden by the current user (soft delete for me only)
    const visibleMemberships = (memberships as Record<string, unknown>[]).filter((m) => !m.hidden);

    if (!visibleMemberships.length) return [];

    const conversationIds = visibleMemberships.map((m: Record<string, unknown>) => m.conversation_id);

    // Get other members with their profiles
    const { data: otherMembers, error: membersErr } = await sb
      .rpc("get_thread_participants", { p_conversation_ids: conversationIds });

    if (membersErr) {
      console.error("[messageService] getThreads otherMembers error:", membersErr.message);
    }

    const result = visibleMemberships
      .map((membership) => {
        const otherMember = (otherMembers ?? []).find(
          (m: Record<string, unknown>) => m.conversation_id === membership.conversation_id
        );
        if (!otherMember) return null;

        // Normalize the RPC row: get_thread_participants returns `user_id` not `id`.
        // mapProfile expects `id`, so alias it here if missing.
        const raw = otherMember as Record<string, unknown>;
        const normalized: Record<string, unknown> = {
          ...raw,
          id: raw.id || raw.user_id,
        };
        console.log("[messageService] getThreads participant row:", { user_id: raw.user_id, id: raw.id, resolved_id: normalized.id });
        const participant = mapProfile(normalized);

        return {
          id: membership.conversation_id as string,
          participant,
          lastMessage: (membership.last_message_text as string) || "New conversation",
          lastMessageTime: membership.last_message_at
            ? new Date(membership.last_message_at as string).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
          unreadCount: (membership.unread_count as number) ?? 0,
        } as MessageThread;
      })
      .filter(Boolean) as MessageThread[];

    // Fetch confirmed jobs for these conversations and stamp jobConfirmed on each thread
    if (result.length > 0) {
      const { data: confirmedJobs } = await sb
        .from("jobs_done")
        .select("conversation_id")
        .in("conversation_id", result.map((t) => t.id))
        .eq("client_confirmed", true);

      const confirmedSet = new Set(
        (confirmedJobs ?? []).map((j: Record<string, unknown>) => j.conversation_id as string)
      );
      for (const thread of result) {
        thread.jobConfirmed = confirmedSet.has(thread.id);
      }
    }

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

  async sendMessage(conversationId: string, text: string, imageUrl?: string): Promise<Message> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");
    const sb = getAuthSupabase();

    const row: Record<string, unknown> = { conversation_id: conversationId, sender_id: userId, text };
    if (imageUrl) row.image_url = imageUrl;

    const { data, error } = await sb
      .from("messages")
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error("No data returned from insert");

    // Keep conversations row fresh (fire-and-forget, non-fatal)
    const lastText = imageUrl && !text ? "📷 Image" : text;
    sb.from("conversations")
      .update({ last_message_text: lastText, last_message_at: new Date().toISOString() })
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

  async uploadChatImage(file: File, userId: string): Promise<string> {
    const sb = getAuthSupabase();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await sb.storage.from("chat-images").upload(path, file, { upsert: false });
    if (error) throw error;
    const { data } = sb.storage.from("chat-images").getPublicUrl(path);
    return data.publicUrl;
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

    // Use security definer RPC to find existing conversation
    // Direct queries on conversation_members can't see other user's rows
    const { data: existingId } = await sb
      .rpc("find_existing_conversation", { p_participant_id: participantId });

    if (existingId) {
      console.log("[messageService] getOrCreateConversation: found existing", existingId);
      return existingId;
    }

    // Create new conversation
    const { data: convId, error: convError } = await sb
      .rpc("create_conversation");

    if (convError || !convId) throw new Error("Failed to create conversation");

    const { error: senderErr } = await sb.rpc("add_conversation_member", {
      p_conversation_id: convId,
      p_user_id: userId,
    });

    if (senderErr) throw new Error("Failed to join conversation");

    await sb.rpc("add_conversation_member", {
      p_conversation_id: convId,
      p_user_id: participantId,
    });

    console.log("[messageService] getOrCreateConversation: created", convId);
    return convId as string;
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
    let cancelled = false;
    let channel: ReturnType<ReturnType<typeof getRealtimeSupabase>["channel"]> | null = null;

    const channelName = `messages:conv:${conversationId}`;

    async function setup() {
      const rt = getRealtimeSupabase();

      // Remove any channel with the same topic from both our registry and Supabase's internal
      // registry before creating a new one — prevents "cannot add callbacks after subscribe()".
      const staleLocal = perConvChannels.get(conversationId);
      if (staleLocal) {
        await rt.removeChannel(staleLocal);
        perConvChannels.delete(conversationId);
      }

      // Also sweep Supabase's own channel list (topic is prefixed with "realtime:" internally)
      const existing = rt.getChannels().find(
        (c) => c.topic === channelName || c.topic === `realtime:${channelName}`
      );
      if (existing) {
        await rt.removeChannel(existing);
      }

      if (cancelled) return;

      const [currentUserId, token] = await Promise.all([getCurrentUserId(), getAccessToken()]);
      if (cancelled) return;

      const resolvedId = currentUserId ?? "";
      if (token) rt.realtime.setAuth(token);

      channel = rt
        .channel(channelName)
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

      perConvChannels.set(conversationId, channel);
    }

    setup();

    return () => {
      cancelled = true;
      if (channel) {
        getRealtimeSupabase().removeChannel(channel);
        perConvChannels.delete(conversationId);
        channel = null;
      } else {
        // channel not yet assigned (setup still in-flight) — clean up via registry
        const rt = getRealtimeSupabase();
        const stale = perConvChannels.get(conversationId);
        if (stale) {
          rt.removeChannel(stale);
          perConvChannels.delete(conversationId);
        }
      }
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

  // Inserts a system message — same minimal payload as sendMessage.
  async sendSystemMessage(conversationId: string, text: string): Promise<void> {
    const userId = await getCurrentUserId();
    if (!userId) return;
    const { error } = await getAuthSupabase()
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: userId, text });
    if (error) console.error("[messageService] sendSystemMessage failed:", error.message, error.details, error.hint);
  },

  async startThread(participantId: string): Promise<{ id: string }> {
    const convId = await messageService.getOrCreateConversation(participantId);
    return { id: convId };
  },
};
