-- SkillSnap — Migration 003: Location coords, privacy flag, happy_percent
-- Run this in Supabase SQL Editor AFTER 001_initial_schema.sql

-- Add GPS coordinates and privacy flag to profiles
alter table public.profiles
  add column if not exists lat              double precision,
  add column if not exists lng              double precision,
  add column if not exists location_private boolean not null default false,
  add column if not exists happy_percent    integer not null default 0
    check (happy_percent >= 0 and happy_percent <= 100);

-- Allow members to update their own unread_count (needed for markThreadRead)
create policy if not exists "Members can update own membership" on public.conversation_members
  for update using (auth.uid() = user_id);

-- Allow members to update conversations (last_message_text etc via trigger)
-- The trigger runs as security definer so this may not be needed, but it's safe:
create policy if not exists "Members can update own conversations" on public.conversations
  for update using (
    exists (
      select 1 from public.conversation_members
      where conversation_id = conversations.id and user_id = auth.uid()
    )
  );

-- Enable Supabase Realtime on messages table (required for live chat)
-- NOTE: This must also be enabled in the Supabase Dashboard:
--   Database → Replication → Tables → enable "messages"
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
