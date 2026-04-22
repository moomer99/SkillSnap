-- SkillSnap — Fix all broken RLS policies
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- ─────────────────────────────────────────────────────────

-- ── 1. Fix "column .id does not exist" on composite-PK tables ────────────────
-- These tables (likes, saved_posts, follows, conversation_members) have no "id"
-- column — their primary key is composite. The SELECT * .limit(1) probe was fine
-- but any policy using auth.uid() needs to select an actual column, not id.
-- The real fix: drop and recreate the policies so they reference valid columns.

-- likes
drop policy if exists "Likes are publicly readable" on public.likes;
drop policy if exists "Users can like posts" on public.likes;
drop policy if exists "Users can unlike posts" on public.likes;
drop policy if exists "Users can upsert likes" on public.likes;

create policy "Likes are publicly readable" on public.likes for select using (true);
create policy "Users can like posts" on public.likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike posts" on public.likes for delete using (auth.uid() = user_id);
create policy "Users can upsert likes" on public.likes for update using (auth.uid() = user_id);

-- saved_posts
drop policy if exists "Users can read own saved posts" on public.saved_posts;
drop policy if exists "Users can save posts" on public.saved_posts;
drop policy if exists "Users can unsave posts" on public.saved_posts;
drop policy if exists "Users can upsert saves" on public.saved_posts;

create policy "Users can read own saved posts" on public.saved_posts for select using (auth.uid() = user_id);
create policy "Users can save posts" on public.saved_posts for insert with check (auth.uid() = user_id);
create policy "Users can unsave posts" on public.saved_posts for delete using (auth.uid() = user_id);
create policy "Users can upsert saves" on public.saved_posts for update using (auth.uid() = user_id);

-- follows
drop policy if exists "Follows are publicly readable" on public.follows;
drop policy if exists "Users can follow others" on public.follows;
drop policy if exists "Users can unfollow" on public.follows;

create policy "Follows are publicly readable" on public.follows for select using (true);
create policy "Users can follow others" on public.follows for insert with check (auth.uid() = follower_id);
create policy "Users can unfollow" on public.follows for delete using (auth.uid() = follower_id);

-- ── 2. Fix infinite recursion in conversation / messages policies ─────────────
-- Drop the recursive policies
drop policy if exists "Members can read their conversations" on public.conversations;
drop policy if exists "Members can update conversation" on public.conversations;
drop policy if exists "Members can read conversation membership" on public.conversation_members;
drop policy if exists "Members can update their row" on public.conversation_members;
drop policy if exists "System can insert members" on public.conversation_members;
drop policy if exists "Authenticated users can insert members" on public.conversation_members;
drop policy if exists "Members can update their own row" on public.conversation_members;
drop policy if exists "Members can read messages" on public.messages;
drop policy if exists "Members can send messages" on public.messages;

-- Security-definer helper breaks the self-reference recursion
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

-- Recreate all conversation-related policies using the helper
create policy "Members can read their conversations" on public.conversations
  for select using (public.is_conversation_member(id));

create policy "Members can update conversation" on public.conversations
  for update using (public.is_conversation_member(id));

create policy "Members can read conversation membership" on public.conversation_members
  for select using (public.is_conversation_member(conversation_id));

create policy "Authenticated users can insert members" on public.conversation_members
  for insert with check (auth.uid() is not null);

create policy "Members can update their own row" on public.conversation_members
  for update using (auth.uid() = user_id);

create policy "Members can read messages" on public.messages
  for select using (public.is_conversation_member(conversation_id));

create policy "Members can send messages" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and public.is_conversation_member(conversation_id)
  );
