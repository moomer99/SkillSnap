-- SkillSnap — Migration 014: the ratings table, and a happy_percent that reads
-- from it
--
-- Run in Supabase SQL Editor AFTER 013_jobs_done_delete_policy.sql.
--
-- WHY
-- Two halves of the same missing feature.
--
-- 1. ChatScreen.handleSubmitFeedback inserts into `ratings`. No migration ever
--    created that table. supabase-js returns transport and Postgres errors in
--    the resolved `{ data, error }` rather than throwing, so the surrounding
--    try/catch never fired: the insert 404'd, the catch was skipped, and the
--    modal ran straight on to its "Thank you for your feedback!" state. Every
--    rating any client has ever left was discarded, silently, behind a success
--    screen.
--
-- 2. profiles.happy_percent has existed since 003:9 and is read in six places
--    across the web app and the mobile app. Nothing has ever written it. It is
--    `integer not null default 0` for everyone, so every profile renders "New".
--    ChatScreen's skiller-side card promises "Your happy % will update once
--    they rate." Nothing was on the other end of that promise.
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
--
--   very_happy    -> 100
--   okay          ->  50
--   not_satisfied ->   0
--
-- So ten delighted clients read 100%, ten lukewarm ones read 50%, and a
-- five/five split reads 75%.
--
-- The alternative — count okay as simply "happy" and divide, which is what the
-- client-side `happy: true` flag on both very_happy and okay implied — was
-- rejected deliberately. Under it, a pro whose every client said "It was okay"
-- displays 100%, indistinguishable from a pro whose every client was delighted.
-- The number saturates at 100 for everyone who has never had an outright
-- complaint, and a trust signal that reads 100% for almost all profiles carries
-- no information. The weighted form costs the literal reading ("9 in 10 clients
-- were happy" is no longer what 90% means) and buys a number that actually
-- separates one pro from another.
--
-- LOW SAMPLE SIZES
-- One rating and forty ratings produced the same 100%. profiles.rating_count is
-- added here alongside, maintained by the same trigger, so the UI can withhold
-- the percentage until there are at least three. types/index.ts:28 anticipated
-- exactly this ("hide happy% below 3"); the field it reads was never populated.
--
-- ON THE PUBLIC READ OF `comment`
-- The SELECT policy below is `using (true)`, as specified: the trust number is
-- public, and the rows behind it are readable by anyone. That also makes each
-- client's free-text note world-readable, and the modal's "Share your
-- experience…" placeholder does not tell them so. Nothing renders notes today.
-- If they are ever surfaced, either say so in the modal or drop `comment` from
-- the public grant first — a column-level grant naming every column except
-- `comment` would keep the number public and the note between the parties.

-- ------------------------------------------------- 1. the table
--
-- `rating` is text with a check rather than an enum: the three values are UI
-- copy that may well be reworded, and widening a check constraint is a one-line
-- migration where adding to an enum mid-list is not.
--
-- `is_happy` is deliberately NOT stored, though ChatScreen currently sends it.
-- It is a pure function of `rating`, and a stored copy is a second source of
-- truth that can be made to disagree with the first.
--
-- job_id UNIQUE is the duplicate guard. A jobs_done row has exactly one client,
-- so one rating per job is one rating per rater per job — enforced by a unique
-- index, which cannot be raced, rather than by a policy that reads the table it
-- is about to write.

create table if not exists public.ratings (
  id         uuid primary key default uuid_generate_v4(),
  job_id     uuid not null unique references public.jobs_done(id) on delete cascade,
  rater_id   uuid not null references public.profiles(id) on delete cascade,
  skiller_id uuid not null references public.profiles(id) on delete cascade,
  rating     text not null check (rating in ('very_happy', 'okay', 'not_satisfied')),
  comment    text,
  created_at timestamptz not null default now(),
  check (rater_id <> skiller_id)
);

comment on table public.ratings is
  'One client rating per verified jobs_done row. Feeds profiles.happy_percent and profiles.rating_count via on_rating_change. Rows are immutable: there is no UPDATE or DELETE policy.';

create index if not exists ratings_skiller_id_idx on public.ratings (skiller_id);
create index if not exists ratings_rater_id_idx   on public.ratings (rater_id);

-- ------------------------------------------------- 2. grants and RLS
--
-- 013 is the precedent for granting explicitly: a policy without the underlying
-- table grant fails silently, and the live grants cannot be verified from these
-- files.

alter table public.ratings enable row level security;

grant select on public.ratings to anon, authenticated;
grant insert on public.ratings to authenticated;
-- No update or delete grant. A rating is history, the same way 012 made a
-- verified jobs_done row history.

drop policy if exists "Ratings are public" on public.ratings;
create policy "Ratings are public" on public.ratings
  for select using (true);

-- The insert check answers three questions the client cannot be trusted to
-- answer for itself: are you who you say you are, was there a real job, and are
-- you the party who is entitled to rate it.
--
-- `verified_at is not null` is the load-bearing clause. It means a rating can
-- only exist behind a job that both parties confirmed under 012's rules, so
-- happy_percent inherits the same no-self-reporting guarantee as jobs_done. A
-- pro cannot manufacture a 100% by rating themselves, because they cannot get a
-- row to rate without the other party.
--
-- The subquery reads jobs_done under the caller's own RLS, which is what we
-- want: 001's "Parties can read their jobs" already lets the client see this
-- row, and nobody else can use the subquery to probe rows they cannot read.

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

-- ------------------------------------------------- 3. rating_count on profiles
--
-- 010's note applies and is easy to miss: with column-level grants in place on
-- profiles, a column added later is NOT readable by anon or authenticated until
-- it is granted by name. Without the grant below, every `select ... rating_count
-- ...` against profiles fails with "permission denied for table profiles" —
-- taking the whole query down, not just the one field.

alter table public.profiles
  add column if not exists rating_count integer not null default 0
    check (rating_count >= 0);

comment on column public.profiles.rating_count is
  'Number of rows in ratings for this user as skiller. Maintained by on_rating_change. Present so the UI can withhold happy_percent until the sample is large enough to mean anything.';

grant select (rating_count) on public.profiles to anon;
grant select (rating_count) on public.profiles to authenticated;

-- ------------------------------------------------- 4. the recalculation
--
-- security definer for the same reason handle_job_confirmed (001:256) is: the
-- writer is the client, and the row being written is the SKILLER's profile,
-- which the profiles update policy reserves to its owner.
--
-- Recomputed from the full history on every change rather than adjusted
-- incrementally. An incremental update has to be right on every path — insert,
-- delete, a cascade from a deleted account — and is unrecoverable when it
-- drifts. This is a single indexed aggregate over one pro's ratings.
--
-- The aggregate subquery returns exactly one row even when the pro has no
-- ratings at all (count 0, avg null), so the join always matches and a pro whose
-- last rating was cascaded away is correctly reset to 0 rather than left
-- holding a stale percentage.

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
-- to be on the API surface.
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

-- ------------------------------------------------- 5. backfill
--
-- No-op on a database that has never held a rating, which is every database
-- this will first run against — happy_percent is already 0 everywhere. It is
-- here so the migration is correct rather than merely harmless if it is ever
-- replayed onto a database that does have ratings.

select public.recalc_happy_percent(id) from public.profiles;

-- ------------------------------------------------- 6. expose rating_count
--
-- Reads of other people go through visible_profiles, never the table
-- (src/services/profileFields.ts). rating_count has to be in the view or the
-- three-rating floor cannot be applied to anyone but yourself.
--
-- Dropped and recreated rather than replaced, following 010: the grant goes
-- with the view, hence the re-grant below.
--
-- This restates 010's definition verbatim with one column appended. If the
-- mobile repo's 20260801050000_visible_profiles_availability.sql is ever
-- replayed after this, it reverts the view to a narrower column list that also
-- selects the raw lat/lng that 010 revoked — it would take out both this column
-- and the coarsened-coordinate guarantee. 010 is the canonical definition and
-- this is now its latest revision.

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

-- ------------------------------------------------- verification
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
--   select happy_percent, rating_count from public.profiles
--    where id = '<skiller id>';        -- expect 50, 1
--
-- The three rejections that matter, all as the same client:
--
--   -- same job twice -> 23505, duplicate key on ratings_job_id_key
--   -- a job whose verified_at is null -> 42501, violates row-level security
--   -- rater_id set to anyone but yourself -> 42501, violates row-level security
--
-- And as the skiller on their own job -> 42501. There is no path by which a pro
-- writes their own happy_percent.
