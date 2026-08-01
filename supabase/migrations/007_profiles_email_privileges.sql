-- SkillSnap — Migration 007: stop serving profiles.email to clients
-- Run in Supabase SQL Editor AFTER 006_jobs_done_notifications_rls.sql
--
-- WHY
-- `profiles` is world-readable on purpose — the select policy is `using (true)`
-- so anyone can browse pro profiles without signing in. RLS is row-level, and
-- Postgres has no row-scoped column privileges, so that policy was handing every
-- column to the anon key, `email` included. Any `select *` or `profiles(*)`
-- embed put every user's address in the HTTP response body.
--
-- WHAT THIS DOES
-- Drops `email` from the columns anon/authenticated may select at all, and adds
-- a security-definer RPC as the one sanctioned way to read your OWN address.
-- After this runs, `select *` on profiles is rejected outright rather than
-- silently over-sharing — the client-side column lists in src/services are
-- required, not merely preferable.

begin;

-- ── 1. Replace table-wide SELECT with per-column SELECT ──────────────
-- A bare `revoke select (email)` is a no-op while the role still holds
-- table-level SELECT (Postgres warns and does nothing), so the table-level
-- grant has to go first and be reissued column by column.
--
-- The column list is derived from information_schema rather than hardcoded, so
-- this migration stays correct against whatever columns profiles actually has.
-- NOTE: with column-level grants in place, columns added to profiles LATER are
-- not readable by anon/authenticated until explicitly granted. That is
-- fail-closed by design — grant new columns deliberately.
do $$
declare
  readable_cols text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into readable_cols
  from information_schema.columns
  where table_schema = 'public'
    and table_name   = 'profiles'
    and column_name <> 'email';

  execute 'revoke select on public.profiles from anon, authenticated';
  execute format(
    'grant select (%s) on public.profiles to anon, authenticated',
    readable_cols
  );
end $$;

-- service_role and postgres are untouched: server-side code and the dashboard
-- still read email normally.

-- ── 2. Grant own-email access back, scoped to auth.uid() ─────────────
-- Column privileges cannot be conditioned on the row, so the scoping lives in a
-- security-definer function whose body is hard-wired to auth.uid(). There is no
-- parameter, so there is nothing for a caller to point at another user's row.
create or replace function public.get_own_email()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select email from public.profiles where id = auth.uid();
$$;

revoke execute on function public.get_own_email() from public, anon;
grant execute on function public.get_own_email() to authenticated;

commit;
