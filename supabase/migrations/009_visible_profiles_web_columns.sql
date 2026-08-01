-- SkillSnap — Migration 009: make visible_profiles usable as the web app's
-- only profile read path, and give the owner a way back to their own exact
-- coordinates.
--
-- Run in Supabase SQL Editor AFTER 008_fix_username_generation.sql.
--
-- STEP 1 OF 2. Everything here is ADDITIVE — it adds columns to a view and
-- creates a function. Nothing is revoked, nothing that works today stops
-- working. Safe to apply before the web deploy.
--
-- The revoke that actually closes the leak is migration 010, which must not be
-- applied until the web app in step 1 is deployed and verified. See the note at
-- the top of that file.
--
-- WHY
-- The web app reads profiles directly through PROFILE_COLUMNS, which names lat
-- and lng, and embeds the same list under posts → profiles for the feed's
-- distance sort. profiles.lat/lng are granted to anon, so every visitor
-- receives every author's exact coordinates, and
-- `GET /rest/v1/profiles?select=lat,lng` returns them to anyone holding the
-- publishable key — including for profiles whose owner set location_private.
-- visible_profiles already coarsens those to a ~2km grid cell
-- (20260801100000_private_location.sql in the app repo), but the web app never
-- reads it.
--
-- Two things block that switch, both fixed here.

-- ------------------------------------- 1. columns the web app needs
--
-- visible_profiles was built for the mobile app and never carried
-- avatar_gradient, avatar_initial or is_client. mapProfile() in the web app
-- reads all three, so pointing its reads at the view without these would
-- silently swap every custom avatar gradient for the default, every initial for
-- "U", and every isClient for false.
--
-- Recreated rather than replaced because create or replace cannot add columns
-- to the middle of a view's list; dropping it drops the grant, hence the
-- re-grant. The coarsening and the block filter are carried over verbatim from
-- 20260801100000_private_location.sql — this migration must not weaken them.

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
    -- The precise pair never leaves the database for a private profile.
    case when p.location_private then public.coarsen_coord(p.lat) else p.lat end as lat,
    case when p.location_private then public.coarsen_coord(p.lng) else p.lng end as lng,
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

-- ------------------------------------- 2. the owner's own exact coordinates
--
-- Once 010 revokes lat/lng, a user cannot read their own precise pair either.
-- That matters: EditProfileScreen seeds its lat/lng state from the loaded
-- profile and writes it back on save, so feeding it the coarsened value would
-- round the user's real location down to the grid centre a little more on every
-- save, permanently, even if they later turn the setting off.
--
-- Same shape as get_own_email() from 007: security definer, scoped to
-- auth.uid(), granted to authenticated only. There is no parameter — a caller
-- can only ever get their own row.

create or replace function public.get_own_coordinates()
returns table (lat double precision, lng double precision)
language sql
stable
security definer
set search_path = public
as $$
  select p.lat, p.lng
    from public.profiles p
   where p.id = (select auth.uid());
$$;

revoke execute on function public.get_own_coordinates() from public, anon;
grant execute on function public.get_own_coordinates() to authenticated;

comment on function public.get_own_coordinates() is
  'The calling user''s own exact lat/lng. The sanctioned path once profiles.lat/lng are revoked in 010; everyone else reads visible_profiles, which coarsens private profiles.';
