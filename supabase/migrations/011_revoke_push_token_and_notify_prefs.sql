-- SkillSnap — Migration 011: stop serving expo_push_token and the notify_*
-- preferences to clients.
--
-- Run in Supabase SQL Editor AFTER 010_revoke_profile_coordinates.sql, and
-- AFTER the Android build carrying the get_own_notification_prefs() change is
-- installed. See ORDERING below.
--
-- WHY — this is a regression, not a new hardening
-- profiles has used column-level SELECT grants since before 007, and
-- expo_push_token was deliberately excluded from them (the comment in
-- 20260801010000 in the app repo says so outright). 007 then rebuilt the grant
-- list from information_schema excluding only 'email' — which silently handed
-- expo_push_token, and every notify_* column, back to anon.
--
-- Confirmed against production:
--   GET /rest/v1/profiles?select=username,expo_push_token   -> 200
--   GET /rest/v1/profiles?select=username,notify_messages   -> 200
--
-- An Expo push token is a bearer credential. Anyone holding one can POST to
-- exp.host and put an arbitrary notification on that device, rendered as if it
-- came from SkillSnap — exactly the phishing vector callerMayNotify() in the
-- send-push-notification function was written to prevent. Nothing leaks today
-- only because push registration has never succeeded and every token is null.
-- The moment FCM is configured, every user's token becomes world-readable.
--
-- Doing this now means there is no window where real tokens are exposed.
--
-- WRITES ARE UNAFFECTED
-- UPDATE is a separate privilege from SELECT. pushService writes the token with
-- a bare `.update({ expo_push_token })` and no `.select()`, so PostgREST sends
-- `Prefer: return=minimal` and never needs to read the column back. A user can
-- still register their own device; nobody can read anyone's.
--
-- Per-row read scoping is not something column grants can express — they are
-- table-wide. Reading your OWN preferences therefore goes through an RPC, the
-- same shape as get_own_email() (007) and get_own_coordinates() (009).
--
-- ORDERING
-- The token revoke is safe immediately: nothing in either app reads it.
-- The notify_* revoke is FAIL-CLOSED: NotificationSettingsScreen currently
-- selects those columns directly, and will show defaults and silently fail to
-- save until it is updated to call get_own_notification_prefs().
--
-- Step 2 of this work requires a new EAS dev build for FCM anyway, and the
-- updated screen ships in it. Install that build, confirm the notification
-- settings screen still loads and saves, then apply this file.

begin;

-- ------------------------------------------------- 1. own preferences RPC

create or replace function public.get_own_notification_prefs()
returns table (
  notify_messages boolean,
  notify_follows boolean,
  notify_jobs boolean,
  notify_connections boolean,
  notify_email_messages boolean,
  notify_email_follows boolean,
  notify_email_weekly boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.notify_messages,
    p.notify_follows,
    p.notify_jobs,
    p.notify_connections,
    p.notify_email_messages,
    p.notify_email_follows,
    p.notify_email_weekly
  from public.profiles p
  where p.id = (select auth.uid());
$$;

revoke execute on function public.get_own_notification_prefs() from public, anon;
grant execute on function public.get_own_notification_prefs() to authenticated;

comment on function public.get_own_notification_prefs() is
  'The calling user''s own notification preferences. The sanctioned read path once the notify_* columns are revoked; there is no parameter, so a caller can only ever get their own row.';

-- ------------------------------------------------- 2. revoke

-- Same dance as 007 and 010: a bare `revoke select (col)` is a no-op while the
-- role still holds table-level SELECT, so the table-level grant goes first and
-- is reissued column by column.
--
-- The exclusion list here is the CANONICAL one and matches 010 exactly. That
-- duplication is deliberate: each of these migrations rebuilds the whole grant
-- from information_schema, so a list that is missing an entry silently
-- re-grants it — which is precisely the bug 007 introduced and this file
-- exists to undo. Applying 010 and 011 in either order now yields the same
-- result. Any FUTURE migration that rebuilds this grant must carry the same
-- list.
--
-- notify_% is matched by pattern rather than named, so a preference column
-- added later is excluded by default rather than exposed by omission.
do $$
declare
  readable_cols text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into readable_cols
  from information_schema.columns
  where table_schema = 'public'
    and table_name   = 'profiles'
    and column_name not in ('email', 'lat', 'lng', 'expo_push_token')
    and column_name not like 'notify\_%';

  revoke select on public.profiles from anon;
  revoke select on public.profiles from authenticated;

  execute format('grant select (%s) on public.profiles to anon', readable_cols);
  execute format('grant select (%s) on public.profiles to authenticated', readable_cols);

  raise notice 'profiles SELECT re-granted on: %', readable_cols;
end $$;

commit;

-- ---------------------------------------------------------------- verify
--
-- With the anon key:
--
--   GET /rest/v1/profiles?select=expo_push_token&limit=1
--     -> 403, "permission denied for table profiles"
--   GET /rest/v1/profiles?select=notify_messages&limit=1
--     -> 403
--   GET /rest/v1/profiles?select=id,username,display_name&limit=1
--     -> 200, still works
--
-- Signed in:
--
--   POST /rest/v1/rpc/get_own_notification_prefs
--     -> 200, that user's seven preferences
--
-- And in the app: register a device, then confirm profiles.expo_push_token is
-- populated when queried with the SERVICE ROLE key (it will be invisible to the
-- publishable key, which is the point).
--
-- Rollback:
--   grant select on public.profiles to anon, authenticated;
-- which also re-exposes email, lat and lng — follow it by re-applying 010.
