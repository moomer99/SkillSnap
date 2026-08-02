-- SkillSnap — Migration 013: give Decline a DELETE policy that actually exists
--
-- Run in Supabase SQL Editor AFTER 012_jobs_done_confirm_integrity.sql.
--
-- WHY — 006 never ran
-- 006_jobs_done_notifications_rls.sql was written with
--
--   CREATE POLICY IF NOT EXISTS "..." ON jobs_done ...
--
-- IF NOT EXISTS is supported for CREATE TABLE and CREATE INDEX, never for
-- CREATE POLICY. The parser rejects the first statement, and because the SQL
-- editor submits the file as a single multi-statement request, the parse error
-- aborts the whole script. None of its seven policies exist. 007's header says
-- "run AFTER 006", so this went unnoticed.
--
-- What 006 intended, and what is being done with each:
--
--   1 Users can insert jobs_done       INSERT, skiller       skip - duplicate of 001,
--                                                            and reissued by 012
--   2 Users can update jobs_done       UPDATE, either party  DELIBERATELY NOT RESTORED
--   3 Users can read own jobs_done     SELECT, either party  skip - duplicate of 001
--   4 Users can delete own jobs_done   DELETE, either party  APPLIED HERE, tightened
--   5 Users can insert notifications   INSERT, from_user_id  skip - see below
--   6 Users can read own notifications SELECT, own           skip - duplicate of 001
--   7 Users can update own notifs      UPDATE, own           skip - duplicate of 001
--
-- On 2: that is the exact policy 012 removed - UPDATE for either party with no
-- WITH CHECK, the self-confirmation hole. RLS permissive policies OR together,
-- so restoring it verbatim would silently undo 012. It is not coming back.
--
-- On 5: 001 already grants notifications INSERT with check (true). Adding a
-- narrower permissive policy alongside it changes nothing, because permissive
-- policies OR. Actually tightening that requires dropping 001's policy, which
-- is a behaviour change to the notifications subsystem rather than to Jobs
-- Done. Left for a separate migration.
--
-- On 4: 006 would have let either party delete a VERIFIED row. The increment
-- has already landed on profiles.jobs_done by then, so that erases the record
-- while the count survives. Decline only ever targets a pending row, so this is
-- restricted to rows that are still pending and loses nothing.
--
-- WHAT WAS BROKEN
-- RLS is enabled on jobs_done (001:303) and 001 created SELECT, INSERT and
-- UPDATE policies only. With no DELETE policy, a delete matches no policy and
-- affects zero rows - without an error. PostgREST returns 204 and supabase-js
-- reports no error, so jobsDoneService.declineJob and MessagesScreen's
-- handleDecline both "succeeded", flipped local state to declined, and left the
-- row in place. ChatScreen's restore effect then re-read it on next open
-- (skiller_confirmed true, verified_at null) and resurrected the card as
-- "requested".

-- A policy without the underlying table grant still fails silently, and the
-- live grants cannot be verified from these files. Supabase's defaults give
-- authenticated DELETE here; this makes the migration self-sufficient either
-- way. RLS still decides which rows.
grant delete on public.jobs_done to authenticated;

drop policy if exists "Users can delete own jobs_done" on public.jobs_done;
drop policy if exists "Parties can delete a pending job" on public.jobs_done;
create policy "Parties can delete a pending job" on public.jobs_done
  for delete
  using (
    (auth.uid() = skiller_id or auth.uid() = client_id)
    and not client_confirmed
    and verified_at is null
  );

-- ------------------------------------------------- verification
--
-- Expect one delete policy:
--
--   select policyname, cmd, qual from pg_policies
--    where schemaname = 'public' and tablename = 'jobs_done' and cmd = 'DELETE';
--
-- End to end, as the client of a pending request: the delete should report one
-- row and the row should be gone, where before it reported success and changed
-- nothing.
--
--   delete from public.jobs_done where id = '<pending job id>';
