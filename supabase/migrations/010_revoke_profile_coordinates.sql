-- SkillSnap — Migration 010: stop serving profiles.lat / profiles.lng to clients
--
-- ###########################################################################
-- ##  DO NOT APPLY THIS UNTIL STEP 1 IS DEPLOYED TO PRODUCTION AND VERIFIED  #
-- ###########################################################################
--
-- This migration is FAIL-CLOSED. The moment it runs, every select that names
-- lat or lng against `profiles` starts returning "permission denied for table
-- profiles" — not a null column, the whole query. If the running web app still
-- reads coordinates from the base table, the feed, search, discovery and the
-- profile screen break at once, for everybody, immediately.
--
-- Required order:
--
--   1. Apply 009_visible_profiles_web_columns.sql            (additive, safe)
--   2. Deploy the step 1 web app                              (commit bc1b93a)
--   3. Verify in production:
--        - the feed loads and its distance sort still orders correctly
--        - search returns people
--        - /discover loads
--        - a /@username page loads
--        - Edit Profile opens with the location field populated, and saving
--          without touching location leaves profiles.lat/lng unchanged
--   4. Only then apply this file.
--
-- If anything in step 3 fails, fix it before running this. There is no hurry:
-- until this runs, the coarsening in visible_profiles is what the app shows,
-- and this closes the raw API behind it.
--
-- WHY
-- profiles is world-readable by design — the select policy is `using (true)` so
-- anyone can browse pro profiles without signing in. RLS is row-level, and
-- Postgres has no row-scoped column privileges, so lat and lng went to the anon
-- key along with everything else. Verified against production before writing
-- this:
--
--   GET /rest/v1/profiles?select=username,lat,lng&location_private=eq.true
--     -> {"username":"wizz55","lat":-33.9166667,"lng":150.9333333}
--
--   GET /rest/v1/visible_profiles?select=username,lat,lng&location_private=eq.true
--     -> {"username":"wizz55","lat":-33.91,"lng":150.93}
--
-- The same account, one relation coarsened and one not. The switch a user
-- flipped to keep their location approximate only holds if the precise pair is
-- unreachable, so the base table's columns have to go.
--
-- UPDATE is untouched throughout — a user can still set their own coordinates,
-- which is what EditProfile does. Only SELECT is withdrawn.

begin;

-- ------------------------------------------------- 1. public coordinates
--
-- visible_profiles is security_invoker, so the caller needs SELECT on every
-- column the view's body touches. Its body currently reads p.lat and p.lng in
-- order to coarsen them, which means revoking those columns from the caller
-- would take the view down along with the table. That is not hypothetical:
-- 20260801010000_fix_visible_profiles_columns.sql in the app repo exists
-- because exactly this happened when email got column-level grants.
--
-- Turning the view into security_definer would work around it and is the wrong
-- trade: the view would stop enforcing the caller's RLS on profiles. That is
-- harmless today, when the policy is `using (true)`, and a silent hole the
-- moment anyone tightens it.
--
-- Instead the coarsening moves into the table as generated columns. Postgres
-- keeps them in step with lat/lng/location_private automatically, the view
-- reads only these, and the raw pair never needs to be readable by anyone.
alter table public.profiles
  add column if not exists lat_public double precision
    generated always as (
      case when location_private then public.coarsen_coord(lat) else lat end
    ) stored,
  add column if not exists lng_public double precision
    generated always as (
      case when location_private then public.coarsen_coord(lng) else lng end
    ) stored;

comment on column public.profiles.lat_public is
  'lat, coarsened to a ~2km grid cell when location_private is set. The only latitude clients may read; raw lat is revoked.';
comment on column public.profiles.lng_public is
  'lng, coarsened to a ~2km grid cell when location_private is set. The only longitude clients may read; raw lng is revoked.';

-- ------------------------------------------------- 2. view reads only those
--
-- Identical output to 009 — same column names, same values — so the step 1 app
-- needs no change. The difference is that the body no longer touches the raw
-- columns, so it survives the revoke below.
--
-- Recreated rather than replaced because the underlying expressions change;
-- dropping the view drops its grant, hence the re-grant.

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

-- ------------------------------------------------- 3. revoke the raw pair
--
-- A bare `revoke select (lat) ...` is a no-op while the role still holds
-- table-level SELECT (Postgres warns and does nothing), so the table-level
-- grant has to go first and be reissued column by column. Same dance as 007.
--
-- The column list is derived from information_schema rather than hardcoded, so
-- this stays correct against whatever columns profiles actually has. email
-- stays excluded to preserve 007; lat and lng are excluded by this migration;
-- lat_public and lng_public are picked up automatically.
--
-- NOTE: with column-level grants in place, columns added to profiles LATER are
-- not readable by anon/authenticated until explicitly granted. Fail-closed by
-- design — grant new columns deliberately.
do $$
declare
  readable_cols text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into readable_cols
  from information_schema.columns
  where table_schema = 'public'
    and table_name   = 'profiles'
    and column_name not in ('email', 'lat', 'lng');

  revoke select on public.profiles from anon;
  revoke select on public.profiles from authenticated;

  execute format('grant select (%s) on public.profiles to anon', readable_cols);
  execute format('grant select (%s) on public.profiles to authenticated', readable_cols);

  raise notice 'profiles SELECT re-granted on: %', readable_cols;
end $$;

commit;

-- ---------------------------------------------------------------- verify
--
-- After applying, with the anon key:
--
--   GET /rest/v1/profiles?select=lat,lng&limit=1
--     -> 403, "permission denied for table profiles"
--
--   GET /rest/v1/visible_profiles?select=username,lat,lng&location_private=eq.true
--     -> 200, coarsened pair
--
--   GET /rest/v1/profiles?select=id,username,display_name&limit=1
--     -> 200, still works
--
-- Signed in, as a user who has set coordinates:
--
--   POST /rest/v1/rpc/get_own_coordinates
--     -> 200, that user's exact pair
--
-- Rollback, if step 1 turns out to be incomplete:
--
--   grant select on public.profiles to anon, authenticated;
--
-- which restores table-wide SELECT — note that this also re-exposes email, so
-- follow it by re-applying 007.
