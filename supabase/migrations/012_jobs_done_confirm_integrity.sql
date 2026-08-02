-- SkillSnap — Migration 012: close the Jobs Done self-confirmation hole
--
-- Run in Supabase SQL Editor AFTER 011_revoke_push_token_and_notify_prefs.sql.
--
-- WHY
-- 001_initial_schema.sql:398 created the confirm policy with USING and no
-- WITH CHECK:
--
--   create policy "Parties can confirm jobs" on public.jobs_done
--     for update using (auth.uid() = skiller_id or auth.uid() = client_id);
--
-- USING decides which rows a user may target. It says nothing about what the
-- updated row is allowed to look like. So a skiller could take their own
-- pending request and set client_confirmed = true themselves; the BEFORE UPDATE
-- trigger handle_job_confirmed (001:255) then saw both flags true with
-- old.verified_at is null and ran
--
--   update public.profiles set jobs_done = jobs_done + 1 where id = new.skiller_id;
--
-- on that same skiller. JOBS_DONE_CONFIG.TRUST_NOTE in the app promises
-- "Verified by both parties — no self-reporting". Nothing enforced it.
--
-- WHY THIS TAKES TWO LAYERS
-- An RLS WITH CHECK expression can only see the NEW row - there is no OLD in a
-- policy. "A party may not change the other party's confirmation field" is a
-- statement about a transition, so it cannot be written as a policy alone.
--
--   Layer A (policies)  - who may target a row, and what the result may look
--                         like. Split per party so each WITH CHECK can pin the
--                         field that party does not own.
--   Layer B (trigger)   - which transitions are legal, comparing OLD to NEW.
--
-- ORDERING NOTE
-- RLS WITH CHECK is evaluated AFTER BEFORE-ROW triggers have modified the row.
-- handle_job_confirmed stamps verified_at = now() on the confirming update, so
-- "verified_at is null" belongs in USING (which sees the pre-update row) and
-- must never appear in WITH CHECK - there it would reject every legitimate
-- confirmation.

-- ------------------------------------------------- Layer A: update policies

drop policy if exists "Parties can confirm jobs" on public.jobs_done;
-- 006's copy of the same broken policy, in case that file is ever repaired and
-- replayed. It must not come back: permissive policies OR together, so one
-- surviving copy re-opens the hole.
drop policy if exists "Users can update jobs_done" on public.jobs_done;

drop policy if exists "Skiller can update own pending job" on public.jobs_done;
create policy "Skiller can update own pending job" on public.jobs_done
  for update
  using (auth.uid() = skiller_id and verified_at is null)
  with check (auth.uid() = skiller_id and not client_confirmed);

drop policy if exists "Client can confirm own job" on public.jobs_done;
create policy "Client can confirm own job" on public.jobs_done
  for update
  using (auth.uid() = client_id and verified_at is null)
  with check (auth.uid() = client_id and skiller_confirmed);

-- ------------------------------------------------- Layer A: insert policy
--
-- The original insert policy checked only auth.uid() = skiller_id. A skiller
-- could insert a row with client_confirmed = true already set; the increment
-- trigger is UPDATE-only, so nothing fired at insert time, but the next update
-- of any column on that row satisfied "both confirmed, old.verified_at is null"
-- and incremented. Same self-confirmation, one step removed.
--
-- Both callers already comply: ChatScreen.handleRequestJobDone sends
-- client_confirmed: false, jobsDoneService.requestVerification omits it and
-- takes the column default.

drop policy if exists "Skiller can create job record" on public.jobs_done;
drop policy if exists "Users can insert jobs_done" on public.jobs_done;
create policy "Skiller can create job record" on public.jobs_done
  for insert
  with check (
    auth.uid() = skiller_id
    and not client_confirmed
    and verified_at is null
  );

-- ------------------------------------------------- Layer B: transition guard

create or replace function public.enforce_jobs_done_transition()
returns trigger language plpgsql security invoker set search_path = public as $$
declare
  actor uuid := auth.uid();
begin
  -- Request-scoped callers only. service_role and the SQL editor have no JWT,
  -- so auth.uid() is null there and the table stays administrable; those paths
  -- bypass RLS anyway, so nothing is being given away.
  if actor is null then
    return new;
  end if;

  -- A verified job is history. Nothing about it may change - above all
  -- verified_at must not be cleared, or handle_job_confirmed would see
  -- old.verified_at is null on the next update and increment a second time.
  -- One row could otherwise be farmed for an unbounded jobs_done count.
  if old.verified_at is not null then
    raise exception 'jobs_done row % is verified and immutable', old.id
      using errcode = '42501';
  end if;

  -- The two parties are fixed when the request is created.
  if new.skiller_id is distinct from old.skiller_id
     or new.client_id is distinct from old.client_id then
    raise exception 'jobs_done parties cannot be reassigned'
      using errcode = '42501';
  end if;

  -- Each party owns exactly one confirmation flag and may not write the other's.
  if new.skiller_confirmed is distinct from old.skiller_confirmed
     and actor <> old.skiller_id then
    raise exception 'only the skiller may change skiller_confirmed'
      using errcode = '42501';
  end if;

  if new.client_confirmed is distinct from old.client_confirmed
     and actor <> old.client_id then
    raise exception 'only the client may change client_confirmed'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

-- Named to sort before on_job_confirmed: BEFORE ROW triggers fire in
-- alphabetical order, so an illegal transition is rejected before
-- handle_job_confirmed can touch profiles.jobs_done.
drop trigger if exists enforce_jobs_done_transition on public.jobs_done;
create trigger enforce_jobs_done_transition
  before update on public.jobs_done
  for each row execute procedure public.enforce_jobs_done_transition();

-- ------------------------------------------------- verification
--
-- Expect exactly three policies here after this runs - one insert, two update -
-- and no policy whose qual permits both parties on UPDATE:
--
--   select policyname, cmd, qual, with_check
--     from pg_policies
--    where schemaname = 'public' and tablename = 'jobs_done'
--    order by cmd, policyname;
--
-- Expect two BEFORE UPDATE triggers, enforce_jobs_done_transition first:
--
--   select tgname from pg_trigger
--    where tgrelid = 'public.jobs_done'::regclass and not tgisinternal
--    order by tgname;
--
-- NOTE ON EXISTING DATA
-- jobs_done has no audit trail of which party wrote which flag, so rows that
-- were self-confirmed before this migration cannot be distinguished from
-- genuine ones. No counts are corrected here; doing so would be guesswork.
