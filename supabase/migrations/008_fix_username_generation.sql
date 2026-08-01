-- SkillSnap — Migration 008: stop handle_new_user mangling usernames
-- Run in Supabase SQL Editor AFTER 007_profiles_email_privileges.sql
--
-- WHY
-- 002 generated the handle with:
--
--   lower(regexp_replace(_display_name, '[^a-z0-9_]', '_', 'g'))
--
-- The character class is lower-case only, and the regex runs BEFORE lower(),
-- so every capital letter is replaced with an underscore before anything is
-- lower-cased. A display name in title case loses its first letter of every
-- word, and one in caps loses everything:
--
--   'Kito'                    -> '_ito_183d'
--   'Vadim Manuilov'          -> '_adim__anuilov_76e4'
--   'FIVE GUYS CLEANING TEAM' -> '________________________56b5'
--
-- WHAT THIS DOES
-- Lower-cases first, then sanitises, then collapses runs of underscores and
-- trims them off both ends so the result reads as a handle rather than a
-- redaction. Same inputs now give:
--
--   'Kito'                    -> 'kito_183d'
--   'Vadim Manuilov'          -> 'vadim_manuilov_76e4'
--   'FIVE GUYS CLEANING TEAM' -> 'five_guys_cleaning_team_56b5'
--
-- Nothing else about the trigger changes: same metadata precedence, same
-- avatar handling, same `on conflict (id) do nothing`.
--
-- The output stays compatible with profiles_username_normalised
-- (20260801110000_normalise_usernames.sql in the app repo): no '@', no
-- surrounding whitespace, never empty - hence the 'user' fallback for a display
-- name that sanitises away to nothing, and the second trim after truncation,
-- which would otherwise be able to leave a trailing underscore.
--
-- DELIBERATELY NOT BACKFILLED
-- Existing handles are left exactly as they are. A username is part of the
-- profile URL and of every QR code already printed, shared or stuck on a
-- window; rewriting one silently breaks every copy of it that is already out
-- in the world. The reporting block below counts who is affected so that can be
-- decided per account, with the people involved.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  _display_name text;
  _username     text;
  _avatar_url   text;
  _avatar_init  text;
begin
  -- Google OAuth uses 'full_name'; email signups use 'display_name'
  _display_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'display_name',
    split_part(new.email, '@', 1)
  );

  -- Lower-case FIRST: the character class below is lower-case only, so doing
  -- this the other way round turns every capital into an underscore.
  _username := lower(coalesce(_display_name, ''));
  _username := regexp_replace(_username, '[^a-z0-9_]', '_', 'g');
  -- 'aziz care ' has become 'aziz_care_' by here; collapse and trim so it
  -- reads cleanly.
  _username := regexp_replace(_username, '_+', '_', 'g');
  _username := btrim(_username, '_');

  if _username = '' then
    _username := 'user';
  end if;

  -- Truncate, then trim again: the cut can land mid-underscore.
  _username := btrim(left(_username, 26), '_');

  if _username = '' then
    _username := 'user';
  end if;

  -- Made unique with the first 4 hex characters of the user id.
  _username := _username || '_' || left(replace(new.id::text, '-', ''), 4);

  -- Google OAuth provides 'avatar_url' or 'picture'
  _avatar_url := coalesce(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture'
  );

  _avatar_init := upper(left(_display_name, 1));

  insert into public.profiles (
    id, username, display_name, avatar_url, avatar_initial, avatar_gradient
  ) values (
    new.id,
    _username,
    _display_name,
    _avatar_url,
    _avatar_init,
    'linear-gradient(135deg, #6c47ff, #a78bfa)'
  )
  on conflict (id) do nothing;  -- idempotent: never overwrite existing profile

  return new;
end;
$$;

-- ------------------------------------------------- report, do not change

-- Read-only. Counts the handles that carry the old mangling so the backfill
-- can be decided separately, per account.
do $$
declare
  affected integer;
  total    integer;
  row_rec  record;
begin
  select count(*) into total from public.profiles;

  select count(*) into affected
    from public.profiles
   where btrim(regexp_replace(username, '^@+', '')) ~ '__'
      or btrim(regexp_replace(username, '^@+', '')) ~ '^_'
      or btrim(regexp_replace(username, '^@+', '')) ~ '_$';

  raise notice '% of % existing profiles have a mangled handle. Not changed - see the note at the top of this migration.', affected, total;

  for row_rec in
    select username, display_name
      from public.profiles
     where btrim(regexp_replace(username, '^@+', '')) ~ '__'
        or btrim(regexp_replace(username, '^@+', '')) ~ '^_'
        or btrim(regexp_replace(username, '^@+', '')) ~ '_$'
     order by username
  loop
    raise notice '  % (display name: %)', row_rec.username, row_rec.display_name;
  end loop;
end $$;
