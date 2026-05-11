-- SkillSnap — Add INSERT policy on profiles for authenticated users
-- Required for Google OAuth first-login: ensureProfile() upserts a row on behalf
-- of the newly authenticated user. Without this policy, Supabase RLS rejects the
-- insert even though the user's session is valid (auth.uid() = id check fails when
-- no INSERT policy exists).
-- Run after 001_initial_schema.sql

-- Idempotent: drop first in case it was partially applied before
drop policy if exists "Users can insert own profile" on public.profiles;

create policy "Users can insert own profile" on public.profiles
  for insert
  with check (auth.uid() = id);
