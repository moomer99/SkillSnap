-- Fix infinite recursion in conversation RLS policies
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run

-- ── Step 1: Drop the recursive policies ──────────────────────────────────────

drop policy if exists "Members can read their conversations" on public.conversations;
drop policy if exists "Members can update conversation" on public.conversations;
drop policy if exists "Members can read conversation membership" on public.conversation_members;
drop policy if exists "Members can update their row" on public.conversation_members;
drop policy if exists "System can insert members" on public.conversation_members;
drop policy if exists "Members can read messages" on public.messages;
drop policy if exists "Members can send messages" on public.messages;

-- ── Step 2: Create a security-definer helper that bypasses RLS ────────────────
-- This breaks the recursion: the function checks membership using elevated
-- privileges, so the RLS policies don't need to query themselves.

create or replace function public.is_conversation_member(conv_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = conv_id
      and user_id = auth.uid()
  );
$$;

-- ── Step 3: Re-create all policies using the helper ──────────────────────────

-- Conversations: read and update
create policy "Members can read their conversations" on public.conversations
  for select using (public.is_conversation_member(id));

create policy "Members can update conversation" on public.conversations
  for update using (public.is_conversation_member(id));

-- Conversation members: read own memberships
create policy "Members can read conversation membership" on public.conversation_members
  for select using (public.is_conversation_member(conversation_id));

-- Conversation members: insert (anyone authed can add members when creating a conversation)
create policy "Authenticated users can insert members" on public.conversation_members
  for insert with check (auth.uid() is not null);

-- Conversation members: update own row (for unread count reset)
create policy "Members can update their own row" on public.conversation_members
  for update using (auth.uid() = user_id);

-- Messages: read and send
create policy "Members can read messages" on public.messages
  for select using (public.is_conversation_member(conversation_id));

create policy "Members can send messages" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and public.is_conversation_member(conversation_id)
  );
