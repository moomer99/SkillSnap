-- SkillSnap — Migration 014: reconcile the ratings table, and make
-- happy_percent read from it
--
-- Run in Supabase SQL Editor AFTER 013_jobs_done_delete_policy.sql.
--
-- WHY
-- Two halves of the same half-finished feature.
--
-- 1. ChatScreen.handleSubmitFeedback inserts into `ratings`. A table by that
--    name was created by hand at some point — it holds three real rows dated
--    13 May 2026 — but nothing in either repo ever defined it, so its shape,
--    constraints, RLS and grants are whatever was typed into the SQL editor
--    that day. Its column list does not match what the app sends: it has
--    client_id where the app now sends rater_id, and an is_happy column the
--    app no longer sends at all.
--
-- 2. profiles.happy_percent has existed since 003:9 and is read in six places
--    across the web and mobile apps. Nothing has ever written it. It is 0 for
--    everyone, so every profile renders "New" while ChatScreen's skiller-side
--    card promises "Your happy % will update once they rate."
--
-- THIS MIGRATION RECONCILES, IT DOES NOT CREATE
-- An earlier draft of this file assumed a fresh CREATE TABLE. Run against the
-- live database that would have been a no-op — `create table if not exists`
-- silently skips — leaving the old shape in place, the app still writing
-- rater_id into a table that has no such column, and the three historical
-- ratings excluded from a happy_percent that appeared to be working. Every
-- statement below therefore either targets the existing table or is guarded so
-- that a database which has never had one ends up in exactly the same state.
--
-- NOTHING HERE IS UNCONDITIONALLY DESTRUCTIVE
-- The three existing rows are real ratings from real clients. Before any
-- constraint is added or any column is dropped, the data is checked against
-- what the constraint would require, and a disagreement RAISES rather than
-- forcing. The SQL editor submits this file as one implicit transaction, so an
-- abort anywhere rolls the whole thing back — including the rename and the
-- is_happy snapshot. There is no half-applied state to clean up.
--
-- WHAT "HAPPY" MEANS HERE
-- The feedback modal (ChatScreen.tsx:22-26) is not stars and not thumbs. It is
-- three mutually exclusive choices, plus an optional 200-char note:
--
--   very_happy    😊  "Yes, Very Happy"
--   okay          😐  "It was okay"
--   not_satisfied 😔  "Not satisfied"
--
-- happy_percent is the weighted average of those, on a 0/50/100 scale:
-- very_happy 100, okay 50, not_satisfied 0. Ten delighted clients read 100%,
-- ten lukewarm ones read 50%, a five/five split reads 75%.
--
-- Counting "okay" as simply happy and dividing — which is what the legacy
-- is_happy column did — was rejected deliberately. Under it a pro whose every
-- client said "It was okay" displays 100%, indistinguishable from one whose
-- every client was delighted. The number saturates for everyone who has never
-- had an outright complaint, and a trust signal that reads 100% on almost every
-- profile carries no information.
--
-- LOW SAMPLE SIZES
-- One rating and forty ratings produced the same 100%. profiles.rating_count is
-- added here alongside, maintained by the same trigger, so the UI can withhold
-- the percentage below three ratings. types/index.ts:28 anticipated exactly
-- this; the field it reads was never populated.
--
-- ON THE PUBLIC READ OF `comment`
-- The SELECT policy below is `using (true)`: the trust number is public and the
-- rows behind it are readable by anyone. That also makes each client's
-- free-text note world-readable, and the modal's "Share your experience…"
-- placeholder does not say so. Nothing renders notes today. If they are ever
-- surfaced, either say so in the modal or drop `comment` from the public grant
-- first — a column-level grant naming every column except `comment` keeps the
-- number public and the note between the parties.


-- ═══════════════════════════════════════════════════════════════════════════
-- PREFLIGHT — read these before running the file
-- ═══════════════════════════════════════════════════════════════════════════
--
-- None of the following changes anything. Run them first and look at the three
-- rows with your own eyes; the guards below will catch the same problems, but
-- reading an exception is a worse way to find out what your data looks like.
--
--   -- the shape as it actually is
--   select column_name, data_type, is_nullable, column_default
--     from information_schema.columns
--    where table_schema = 'public' and table_name = 'ratings'
--    order by ordinal_position;
--
--   -- constraints, if any were ever added
--   select conname, contype, pg_get_constraintdef(oid)
--     from pg_constraint where conrelid = 'public.ratings'::regclass;
--
--   -- RLS state and any policies already on it
--   select relrowsecurity from pg_class where oid = 'public.ratings'::regclass;
--   select policyname, cmd, qual, with_check from pg_policies
--    where schemaname = 'public' and tablename = 'ratings';
--
--   -- the three rows themselves
--   select * from public.ratings order by created_at;
--
--   -- is_happy against rating, which is the question this migration has to
--   -- answer before it may drop the column
--   select rating, is_happy, count(*)
--     from public.ratings group by rating, is_happy order by rating;
--
--   -- do these ratings sit behind jobs that were actually confirmed?
--   select r.id, r.rating, j.verified_at
--     from public.ratings r
--     left join public.jobs_done j on j.id = r.job_id
--    order by r.created_at;


-- ═══════════════════════════════════════════════════════════════════════════
-- 1. THE TABLE, IF THERE IS NOT ONE
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Columns and primary key only. Every constraint, default, foreign key and
-- index is applied in section 5, guarded, so a fresh database and the live one
-- converge on one shape by one code path — rather than the fresh path getting
-- inline constraints that the live path then has to be separately taught to
-- match.
--
-- `rating` is text with a check rather than an enum: the three values are UI
-- copy that may be reworded, and widening a check constraint is a one-line
-- migration where adding to an enum mid-list is not.

create table if not exists public.ratings (
  id         uuid primary key default uuid_generate_v4(),
  job_id     uuid,
  rater_id   uuid,
  skiller_id uuid,
  rating     text not null,
  comment    text,
  created_at timestamptz not null default now()
);

comment on table public.ratings is
  'One client rating per verified jobs_done row. Feeds profiles.happy_percent and profiles.rating_count via on_rating_change. Rows are immutable: there is no UPDATE or DELETE policy.';


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. client_id → rater_id
-- ═══════════════════════════════════════════════════════════════════════════
--
-- A rename, not an add-and-copy-and-drop: the values are already the right
-- values under the wrong name, and renaming carries the data, the type, the
-- nullability and any foreign key with it. Nothing is written and nothing can
-- be lost.
--
-- The app sends rater_id (ChatScreen.handleSubmitFeedback). "rater" rather than
-- "client" because it names the row's role in this table — the person who wrote
-- the rating — where client_id named their role in a different table.

do $$
begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'ratings'
       and column_name = 'client_id'
  ) then
    raise notice 'ratings.client_id not present — rename already done, or this is a fresh table';
    return;
  end if;

  -- Both columns at once means someone has already started this by hand and
  -- there are two candidate sources of truth. Refusing is the only safe move:
  -- picking one could discard live data.
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'ratings'
       and column_name = 'rater_id'
  ) then
    raise exception 'ratings has BOTH client_id and rater_id. Reconcile them by hand and re-run: select id, client_id, rater_id from public.ratings;';
  end if;

  alter table public.ratings rename column client_id to rater_id;
  raise notice 'renamed ratings.client_id to ratings.rater_id';

  -- Constraint names do not follow a renamed column, so an existing foreign key
  -- would keep advertising the old name. Cosmetic, but the name is what shows
  -- up in error messages and in PostgREST embed hints.
  if exists (
    select 1 from pg_constraint
     where conrelid = 'public.ratings'::regclass and conname = 'ratings_client_id_fkey'
  ) then
    alter table public.ratings rename constraint ratings_client_id_fkey to ratings_rater_id_fkey;
    raise notice 'renamed constraint ratings_client_id_fkey to ratings_rater_id_fkey';
  end if;
end $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. is_happy — prove it is redundant, keep a copy, then drop it
-- ═══════════════════════════════════════════════════════════════════════════
--
-- is_happy is a stored boolean the old client sent alongside rating. It is a
-- second source of truth about the same answer, and the two can disagree; that
-- is the reason to be rid of it. But "can disagree" is exactly why it cannot be
-- dropped on the assumption that it does not — if any of the three historical
-- rows has an is_happy that its rating does not imply, then the column is
-- carrying information and dropping it destroys a real client's real answer.
--
-- The legacy mapping, from the RATINGS table in ChatScreen before this change:
-- very_happy → true, okay → true, not_satisfied → false. So is_happy is
-- redundant exactly when it equals (rating <> 'not_satisfied') on every row.
--
-- Three outcomes:
--   redundant on every row  → snapshot, drop, continue
--   disagrees on any row    → RAISE, whole migration rolls back, nothing lost
--   column already gone     → nothing to do
--
-- The snapshot is kept even in the clean case. It costs three rows and it means
-- the drop is reversible for as long as anyone might want it back.

do $$
declare
  total       integer;
  disagreeing integer;
begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'ratings'
       and column_name = 'is_happy'
  ) then
    raise notice 'ratings.is_happy not present — nothing to reconcile';
    return;
  end if;

  select count(*) into total from public.ratings;

  -- `is distinct from` rather than <>: a NULL is_happy is a disagreement, not
  -- an unknown that quietly passes.
  select count(*) into disagreeing
    from public.ratings
   where is_happy is distinct from (rating <> 'not_satisfied');

  if disagreeing > 0 then
    raise exception
      'ratings.is_happy disagrees with rating on % of % row(s) — refusing to drop it. Inspect with: select id, rating, is_happy, created_at from public.ratings where is_happy is distinct from (rating <> ''not_satisfied''); Decide which column is right, correct the data, then re-run this migration.',
      disagreeing, total;
  end if;

  -- Snapshot before the drop. `if not exists` so a re-run does not overwrite
  -- the original snapshot with a post-drop one.
  if not exists (
    select 1 from information_schema.tables
     where table_schema = 'public' and table_name = 'ratings_is_happy_backup'
  ) then
    create table public.ratings_is_happy_backup as
      select id, job_id, rater_id, skiller_id, rating, is_happy, comment, created_at
        from public.ratings;

    -- A bare new table in `public` picks up Supabase's default grants and would
    -- otherwise be readable by anon. This is a backup, not an API surface: RLS
    -- on with no policies means nothing but service_role and the SQL editor can
    -- read it.
    alter table public.ratings_is_happy_backup enable row level security;
    revoke all on public.ratings_is_happy_backup from anon;
    revoke all on public.ratings_is_happy_backup from authenticated;

    comment on table public.ratings_is_happy_backup is
      'Pre-drop snapshot of ratings including the is_happy column, taken by migration 014 after verifying is_happy = (rating <> ''not_satisfied'') on every row. Safe to drop once 014 has been in production long enough to trust.';

    raise notice 'snapshotted % row(s) into public.ratings_is_happy_backup', total;
  end if;

  alter table public.ratings drop column is_happy;
  raise notice 'is_happy agreed with rating on all % row(s); column dropped', total;
end $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- 4. WILL THE CONSTRAINTS FIT THE DATA THAT IS ALREADY THERE?
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Section 5 adds NOT NULLs, a check, two foreign keys and a unique index. Any
-- of those can fail against existing rows, and a failure in the middle of a
-- DDL run is a worse place to learn about your data than a message that says
-- which row is the problem. So each requirement is asserted here first, with
-- the query to inspect it.
--
-- These also carry information the constraints themselves cannot: the last
-- block reports, without failing, how many historical ratings sit behind jobs
-- that were never confirmed. New rows cannot do that — the insert policy in
-- section 6 requires verified_at is not null — but the trigger counts every row
-- it finds, so a legacy rating on an unconfirmed job will move a real pro's
-- public number. That is a judgement call about historical data, not a
-- correctness bug, so it is surfaced rather than decided here.

do $$
declare
  bad      integer;
  detail   text;
begin
  -- 4a. rating values must be ones the check constraint will accept
  select count(*), string_agg(distinct coalesce(rating, '<null>'), ', ')
    into bad, detail
    from public.ratings
   where rating is null or rating not in ('very_happy', 'okay', 'not_satisfied');
  if bad > 0 then
    raise exception
      'ratings.rating holds % row(s) with values outside (very_happy, okay, not_satisfied): %. The check constraint would reject them. Inspect: select id, rating from public.ratings where rating is null or rating not in (''very_happy'',''okay'',''not_satisfied'');',
      bad, detail;
  end if;

  -- 4b. every column section 5 marks NOT NULL must already be populated, and
  -- id must be too or the primary key cannot be added
  select count(*) into bad from public.ratings
   where id is null or job_id is null or rater_id is null
      or skiller_id is null or created_at is null;
  if bad > 0 then
    raise exception
      'ratings has % row(s) with a null in id, job_id, rater_id, skiller_id or created_at. All five are required. Inspect: select * from public.ratings where id is null or job_id is null or rater_id is null or skiller_id is null or created_at is null;',
      bad;
  end if;

  -- 4c. one rating per job — the unique index is the duplicate guard, and it
  -- cannot be created over existing duplicates
  select count(*) into bad from (
    select job_id from public.ratings group by job_id having count(*) > 1
  ) dupes;
  if bad > 0 then
    raise exception
      'ratings has % job_id(s) rated more than once. Decide which row survives, delete the rest, then re-run. Inspect: select job_id, count(*) from public.ratings group by job_id having count(*) > 1;',
      bad;
  end if;

  -- 4d. every job_id must point at a jobs_done row, or the foreign key fails
  select count(*) into bad
    from public.ratings r
   where not exists (select 1 from public.jobs_done j where j.id = r.job_id);
  if bad > 0 then
    raise exception
      'ratings has % row(s) whose job_id has no jobs_done row — the foreign key would reject them. A declined job deletes its row (migration 013), which may be how these arose. Inspect: select r.* from public.ratings r left join public.jobs_done j on j.id = r.job_id where j.id is null;',
      bad;
  end if;

  -- 4e. same for the two profile references
  select count(*) into bad
    from public.ratings r
   where not exists (select 1 from public.profiles p where p.id = r.rater_id)
      or not exists (select 1 from public.profiles p where p.id = r.skiller_id);
  if bad > 0 then
    raise exception
      'ratings has % row(s) whose rater_id or skiller_id has no profile. Inspect: select r.id, r.rater_id, r.skiller_id from public.ratings r where not exists (select 1 from public.profiles p where p.id = r.rater_id) or not exists (select 1 from public.profiles p where p.id = r.skiller_id);',
      bad;
  end if;

  -- 4f. nobody may have rated themselves
  select count(*) into bad from public.ratings where rater_id = skiller_id;
  if bad > 0 then
    raise exception
      'ratings has % self-rating row(s) where rater_id = skiller_id. Inspect: select * from public.ratings where rater_id = skiller_id;',
      bad;
  end if;

  raise notice 'preflight passed on % existing rating row(s)', (select count(*) from public.ratings);
end $$;

-- Reported, not enforced: ratings attached to jobs that were never confirmed.
do $$
declare
  unverified integer;
begin
  select count(*) into unverified
    from public.ratings r
    join public.jobs_done j on j.id = r.job_id
   where j.verified_at is null;

  if unverified > 0 then
    raise warning
      '% existing rating(s) sit behind a jobs_done row with verified_at null. New ratings cannot do this — the insert policy forbids it — but the trigger counts every row, so these WILL move a pro''s public happy_percent. Review before trusting the number: select r.id, r.rating, r.skiller_id, j.verified_at from public.ratings r join public.jobs_done j on j.id = r.job_id where j.verified_at is null;',
      unverified;
  end if;
end $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- 5. BRING THE SHAPE UP TO SPEC
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Everything here is idempotent and applies equally to the live table and to a
-- table this file has just created. `set not null` and `set default` on a column
-- that already has them are no-ops rather than errors, so those run unguarded;
-- named constraints and indexes are guarded by name, and foreign keys by the
-- column they sit on, since a legacy key may carry any name at all.

alter table public.ratings add column if not exists comment text;

alter table public.ratings alter column id         set default uuid_generate_v4();
alter table public.ratings alter column created_at set default now();

alter table public.ratings alter column job_id     set not null;
alter table public.ratings alter column rater_id   set not null;
alter table public.ratings alter column skiller_id set not null;
alter table public.ratings alter column rating     set not null;
alter table public.ratings alter column created_at set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.ratings'::regclass and contype = 'p'
  ) then
    alter table public.ratings add primary key (id);
    raise notice 'added primary key on ratings.id';
  end if;

  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.ratings'::regclass and conname = 'ratings_rating_check'
  ) then
    alter table public.ratings add constraint ratings_rating_check
      check (rating in ('very_happy', 'okay', 'not_satisfied'));
  end if;

  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.ratings'::regclass and conname = 'ratings_parties_distinct'
  ) then
    alter table public.ratings add constraint ratings_parties_distinct
      check (rater_id <> skiller_id);
  end if;
end $$;

-- Foreign keys, matched by column rather than by name: whatever the hand-made
-- table called its keys, a second one on the same column would be redundant.
do $$
declare
  spec record;
  has_fk boolean;
begin
  for spec in
    select * from (values
      ('job_id',     'public.jobs_done', 'ratings_job_id_fkey'),
      ('rater_id',   'public.profiles',  'ratings_rater_id_fkey'),
      ('skiller_id', 'public.profiles',  'ratings_skiller_id_fkey')
    ) as t(col, target, fkname)
  loop
    select exists (
      select 1
        from pg_constraint c
        join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
       where c.conrelid = 'public.ratings'::regclass
         and c.contype  = 'f'
         and array_length(c.conkey, 1) = 1
         and a.attname  = spec.col
    ) into has_fk;

    if not has_fk then
      execute format(
        'alter table public.ratings add constraint %I foreign key (%I) references %s(id) on delete cascade',
        spec.fkname, spec.col, spec.target
      );
      raise notice 'added foreign key % on ratings.%', spec.fkname, spec.col;
    end if;
  end loop;
end $$;

-- The one-rating-per-job guard. A jobs_done row has exactly one client, so one
-- rating per job is also one rating per rater per job — enforced by a unique
-- index, which cannot be raced, rather than by a policy that would have to read
-- the table it is about to write.
create unique index if not exists ratings_job_id_key    on public.ratings (job_id);
create index        if not exists ratings_skiller_id_idx on public.ratings (skiller_id);
create index        if not exists ratings_rater_id_idx   on public.ratings (rater_id);


-- ═══════════════════════════════════════════════════════════════════════════
-- 6. GRANTS AND RLS
-- ═══════════════════════════════════════════════════════════════════════════
--
-- The table pre-exists, so it may already carry grants and policies nobody has
-- written down. Both are rebuilt from scratch here rather than added to.
--
-- 013's lesson applies directly: permissive policies OR together, so one
-- forgotten policy defeats every careful one beside it. A leftover
-- `for insert with check (true)` would make section 6's verification pointless
-- while looking perfectly correct in isolation. Anything on this table that
-- this migration did not put there is therefore dropped, and named in the log
-- when it is.

alter table public.ratings enable row level security;

revoke all on public.ratings from anon;
revoke all on public.ratings from authenticated;

grant select on public.ratings to anon, authenticated;
grant insert on public.ratings to authenticated;
-- No update or delete grant. A rating is history, the same way 012 made a
-- verified jobs_done row history.

do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies
     where schemaname = 'public' and tablename = 'ratings'
       and policyname not in ('Ratings are public', 'Client can rate their verified job')
  loop
    execute format('drop policy %I on public.ratings', pol.policyname);
    raise warning 'dropped pre-existing policy on ratings: "%" — it was not created by this migration', pol.policyname;
  end loop;
end $$;

drop policy if exists "Ratings are public" on public.ratings;
create policy "Ratings are public" on public.ratings
  for select using (true);

-- The insert check answers three questions the client cannot be trusted to
-- answer about itself: are you who you say you are, was there a real job, and
-- are you the party entitled to rate it.
--
-- `verified_at is not null` is the load-bearing clause. A rating can only exist
-- behind a job both parties confirmed under 012's rules, so happy_percent
-- inherits the same no-self-reporting guarantee as jobs_done. A pro cannot
-- manufacture a 100% by rating themselves, because they cannot get a row to
-- rate without the other party.
--
-- The subquery reads jobs_done under the caller's own RLS, which is what we
-- want: 001's "Parties can read their jobs" already lets the client see this
-- row, and nobody can use the subquery to probe rows they cannot read.

drop policy if exists "Client can rate their verified job" on public.ratings;
create policy "Client can rate their verified job" on public.ratings
  for insert
  with check (
    auth.uid() = rater_id
    and exists (
      select 1 from public.jobs_done j
      where j.id          = ratings.job_id
        and j.client_id   = auth.uid()
        and j.skiller_id  = ratings.skiller_id
        and j.verified_at is not null
    )
  );


-- ═══════════════════════════════════════════════════════════════════════════
-- 7. rating_count ON profiles
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 010's note applies and is easy to miss: with column-level grants on profiles,
-- a column added later is NOT readable by anon or authenticated until granted
-- by name. Without the grant below, every `select ... rating_count ...` against
-- profiles fails with "permission denied for table profiles" — taking the whole
-- query down, not just the one field.

alter table public.profiles
  add column if not exists rating_count integer not null default 0
    check (rating_count >= 0);

comment on column public.profiles.rating_count is
  'Number of rows in ratings for this user as skiller. Maintained by on_rating_change. Present so the UI can withhold happy_percent until the sample is large enough to mean anything.';

grant select (rating_count) on public.profiles to anon;
grant select (rating_count) on public.profiles to authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 8. THE RECALCULATION
-- ═══════════════════════════════════════════════════════════════════════════
--
-- security definer for the same reason handle_job_confirmed (001:256) is: the
-- writer is the client, and the row being written is the SKILLER's profile,
-- which the profiles update policy reserves to its owner.
--
-- Recomputed from the full history on every change rather than adjusted
-- incrementally. An incremental update has to be right on every path — insert,
-- delete, a cascade from a deleted account — and is unrecoverable when it
-- drifts. This is one indexed aggregate over one pro's ratings.
--
-- The aggregate subquery returns exactly one row even when the pro has no
-- ratings at all (count 0, avg null), so the join always matches and a pro whose
-- last rating was cascaded away resets to 0 rather than keeping a stale
-- percentage.

create or replace function public.recalc_happy_percent(target uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.profiles p
     set happy_percent = coalesce(agg.score, 0),
         rating_count  = agg.n
    from (
      select
        count(*) as n,
        round(avg(
          case r.rating
            when 'very_happy'    then 100
            when 'okay'          then  50
            when 'not_satisfied' then   0
          end
        )) as score
      from public.ratings r
      where r.skiller_id = target
    ) agg
   where p.id = target;
end;
$$;

-- Only the trigger needs to call this. It cannot forge a number — it only ever
-- recomputes from rows that are already there — but there is no reason for it
-- to sit on the API surface.
revoke all on function public.recalc_happy_percent(uuid) from public;

create or replace function public.handle_rating_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalc_happy_percent(old.skiller_id);
    return old;
  end if;

  perform public.recalc_happy_percent(new.skiller_id);

  -- No policy permits an update, so this is unreachable from the API. It is
  -- here for the SQL editor and service_role, which bypass RLS: moving a rating
  -- between pros has to leave both of them correct.
  if tg_op = 'UPDATE' and old.skiller_id is distinct from new.skiller_id then
    perform public.recalc_happy_percent(old.skiller_id);
  end if;

  return new;
end;
$$;

-- AFTER, not BEFORE: the recalculation reads public.ratings and must see the
-- row it is reacting to. handle_job_confirmed is BEFORE because it modifies the
-- row it fires on; this one does not.
drop trigger if exists on_rating_change on public.ratings;
create trigger on_rating_change
  after insert or update or delete on public.ratings
  for each row execute procedure public.handle_rating_change();


-- ═══════════════════════════════════════════════════════════════════════════
-- 9. BACKFILL — this is where the three historical ratings finally count
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Not the no-op it would have been against an empty table. Those three rows
-- have been sitting in the database unused since 13 May 2026; this is the
-- statement that turns them into a number on somebody's profile. Every profile
-- is recomputed, not just the rated ones, so anyone carrying a happy_percent
-- that no longer has ratings behind it is reset rather than left stale.

do $$
declare
  rated integer;
begin
  perform public.recalc_happy_percent(id) from public.profiles;

  select count(*) into rated from public.profiles where rating_count > 0;
  raise notice 'happy_percent recalculated for every profile; % now have at least one rating', rated;
end $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- 10. EXPOSE rating_count THROUGH visible_profiles
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Reads of other people go through visible_profiles, never the table
-- (src/services/profileFields.ts). rating_count has to be in the view or the
-- three-rating floor cannot be applied to anybody but yourself.
--
-- Dropped and recreated rather than replaced, following 010: the grant goes
-- with the view, hence the re-grant below.
--
-- This restates 010's definition verbatim with one column appended. If the
-- mobile repo's 20260801050000_visible_profiles_availability.sql is ever
-- replayed after this, it reverts the view to a narrower column list that also
-- selects the raw lat/lng 010 revoked — taking out both this column and the
-- coarsened-coordinate guarantee. 010 is the canonical definition and this is
-- now its latest revision.

drop view if exists public.visible_profiles;

create view public.visible_profiles with (security_invoker = on) as
  select
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.avatar_gradient,
    p.avatar_initial,
    p.bio,
    p.skill,
    p.location,
    p.availability,
    p.lat_public as lat,
    p.lng_public as lng,
    p.location_private,
    p.jobs_done,
    p.happy_percent,
    p.rating_count,
    p.followers_count,
    p.following_count,
    p.post_count,
    p.is_client,
    p.role,
    p.is_verified,
    p.is_early_bird,
    p.created_at,
    p.updated_at
  from public.profiles p
  where not exists (
    select 1 from public.blocked_user_ids() blocked_id
    where blocked_id = p.id
  );

grant select on public.visible_profiles to authenticated, anon;


-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Read the NOTICE and WARNING output of the run itself first — it says whether
-- the rename happened, whether is_happy was dropped, how many rows passed
-- preflight, whether any unexpected policy was removed, and how many profiles
-- came out with ratings.
--
-- The shape:
--
--   select column_name, is_nullable, column_default
--     from information_schema.columns
--    where table_schema = 'public' and table_name = 'ratings'
--    order by ordinal_position;
--   -- expect: id, job_id, rater_id, skiller_id, rating, comment, created_at
--   -- expect: no client_id, no is_happy
--
-- The three historical rows survived intact, and their snapshot exists:
--
--   select count(*) from public.ratings;                    -- expect 3
--   select count(*) from public.ratings_is_happy_backup;    -- expect 3
--
-- They now show up on their pro's profile. With the weighted scale, three
-- very_happy reads 100, three okay reads 50, two very_happy and one okay reads
-- 83:
--
--   select p.username, p.happy_percent, p.rating_count
--     from public.profiles p
--    where p.rating_count > 0;
--
-- Note that a pro with fewer than three ratings still renders "New" in both
-- apps — the number is stored, the UI withholds it (src/lib/happyPercent.ts).
-- So unless all three rows belong to one pro, expect the profiles to keep
-- reading "New" even though happy_percent is now populated. That is the floor
-- working, not the migration failing.
--
-- Two policies, one select and one insert, and no update or delete:
--
--   select policyname, cmd, qual, with_check from pg_policies
--    where schemaname = 'public' and tablename = 'ratings' order by cmd;
--
-- rating_count readable, and the view carrying it:
--
--   select rating_count from public.profiles limit 1;
--   select happy_percent, rating_count from public.visible_profiles limit 1;
--
-- End to end, signed in as the client of a job you have already confirmed:
--
--   insert into public.ratings (job_id, rater_id, skiller_id, rating)
--   values ('<verified job id>', auth.uid(), '<skiller id>', 'okay');
--
-- The three rejections that matter, all as the same client:
--
--   -- same job twice                     -> 23505, ratings_job_id_key
--   -- a job whose verified_at is null    -> 42501, violates row-level security
--   -- rater_id set to anyone but yourself-> 42501, violates row-level security
--
-- And as the skiller on their own job -> 42501. There is no path by which a pro
-- writes their own happy_percent.
--
-- ONCE THIS IS TRUSTED
-- public.ratings_is_happy_backup exists only to make the is_happy drop
-- reversible. Drop it when you no longer want that:
--
--   drop table public.ratings_is_happy_backup;
