-- SkillSnap — Security alerts on password / email change
-- Run this in Supabase SQL Editor after 006_jobs_done_notifications_rls.sql
-- ─────────────────────────────────────────────────────────
--
-- Fires the notify-password-changed / notify-email-changed Edge Functions
-- whenever auth.users records a credential change. Living in the database
-- means both the mobile and web clients are covered without either one
-- shipping a line of code, and admin-initiated changes are caught too.
--
-- pg_net is asynchronous: net.http_post() queues the request and returns a
-- request id immediately, and the queue is only dispatched once the
-- surrounding transaction commits. So the auth write is never held open
-- waiting on HTTP, and a rolled-back write sends nothing.
--
-- BEFORE THIS WORKS you must create two Vault secrets — see the block at the
-- bottom of this file. Until then the triggers are inert by design.
--
-- Run this as the `postgres` role. Creating a trigger on auth.users needs
-- ownership of that table; a session on a lesser role fails with
-- `42501: must be owner of table users`.

-- ── Extension ────────────────────────────────────────────
-- Creates the `net` schema. Also available via Dashboard → Database →
-- Extensions if your role can't create extensions from the SQL editor.
create extension if not exists pg_net;

-- ── Dispatch helper ──────────────────────────────────────
-- Both triggers post the same shape to different endpoints, so the URL
-- building, secret lookup and failure handling live in one place.
--
-- security definer, because the role that writes to auth.users is
-- supabase_auth_admin, which holds only the permissions its own auth duties
-- need — reaching `net` or `vault` as that role fails. A definer function
-- runs with the privileges of its owner (postgres) instead.
--
-- search_path is emptied so a definer function can't be hijacked by a
-- shadowing object; every reference below is therefore schema-qualified.
create or replace function public.notify_auth_change(_endpoint text, _payload jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  _base_url text;
  _key      text;
begin
  select decrypted_secret into _base_url
    from vault.decrypted_secrets where name = 'edge_function_base_url';
  select decrypted_secret into _key
    from vault.decrypted_secrets where name = 'edge_function_service_key';

  -- Unconfigured is a valid state: the migration can land before the secrets
  -- do, and a half-installed alert must not take auth down with it.
  if _base_url is null or _key is null then
    return;
  end if;

  perform net.http_post(
    url     := _base_url || '/' || _endpoint,
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'Authorization', 'Bearer ' || _key
               ),
    body    := _payload,
    timeout_milliseconds := 5000
  );
end;
$$;

comment on function public.notify_auth_change(text, jsonb) is
  'Posts a credential-change payload to a Supabase Edge Function via pg_net. '
  'Silently no-ops when the Vault secrets are absent.';

-- ── Password changed ─────────────────────────────────────
create or replace function public.handle_password_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.notify_auth_change(
    'notify-password-changed',
    jsonb_build_object(
      'event',      'password_changed',
      'user_id',    new.id,
      'email',      new.email,
      'changed_at', now()
    )
  );
  return new;
exception when others then
  -- A failed notification must never cost the user their password reset.
  -- An exception raised here reaches the client as a bare 500 "Database
  -- error", so swallowing is the only safe option; real failures are
  -- visible in net._http_response (see the verification query below).
  return new;
end;
$$;

drop trigger if exists on_auth_password_changed on auth.users;
create trigger on_auth_password_changed
  after update of encrypted_password on auth.users
  for each row
  -- `old.encrypted_password is not null` skips the OAuth-only user who is
  -- setting a password for the first time — that's "password set", not
  -- "password changed", and alerting on it is just confusing.
  when (
    old.encrypted_password is not null
    and new.encrypted_password is distinct from old.encrypted_password
  )
  execute function public.handle_password_changed();

-- ── Email changed ────────────────────────────────────────
-- Supabase stages a pending address in auth.users.email_change and only
-- flips auth.users.email once the user confirms, so watching `email` fires
-- on completion — which is the moment worth alerting about.
create or replace function public.handle_email_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Both addresses ride along: the *old* one is the security-critical
  -- recipient, since it's the only way a user notices an attacker moving
  -- the account away from them. The Edge Function decides who to mail.
  perform public.notify_auth_change(
    'notify-email-changed',
    jsonb_build_object(
      'event',      'email_changed',
      'user_id',    new.id,
      'old_email',  old.email,
      'new_email',  new.email,
      'changed_at', now()
    )
  );
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists on_auth_email_changed on auth.users;
create trigger on_auth_email_changed
  after update of email on auth.users
  for each row
  -- `old.email is not null` skips the anonymous → permanent upgrade, which
  -- is a null → value write rather than a change of address.
  when (
    old.email is not null
    and new.email is distinct from old.email
  )
  execute function public.handle_email_changed();

-- ── Grants ───────────────────────────────────────────────
-- Postgres checks EXECUTE on a trigger function at CREATE TRIGGER time
-- rather than on each fire, so these are defensive rather than strictly
-- required — but they cost nothing and remove a whole class of confusing
-- failure if that ever changes.
grant execute on function public.handle_password_changed() to supabase_auth_admin;
grant execute on function public.handle_email_changed()    to supabase_auth_admin;

-- ─────────────────────────────────────────────────────────
-- REQUIRED MANUAL STEP — run once, with your own credentials.
-- Do not commit these values.
--
--   select vault.create_secret(
--     'https://<project-ref>.supabase.co/functions/v1',
--     'edge_function_base_url'
--   );
--   select vault.create_secret(
--     '<service role key>',
--     'edge_function_service_key'
--   );
--
-- To rotate later, use vault.update_secret() rather than creating a second
-- secret under the same name.
--
-- VERIFY — change a password, then check what pg_net actually got back.
-- Responses are kept ~6 hours in an unlogged table:
--
--   select id, status_code, content, created
--     from net._http_response
--    order by created desc
--    limit 10;
--
-- A 401 means the service key is wrong; a 404 means the Edge Function isn't
-- deployed under that name; no row at all means the trigger never fired.
--
-- ROLLBACK
--
--   drop trigger if exists on_auth_password_changed on auth.users;
--   drop trigger if exists on_auth_email_changed    on auth.users;
--   drop function if exists public.handle_password_changed();
--   drop function if exists public.handle_email_changed();
--   drop function if exists public.notify_auth_change(text, jsonb);
-- ─────────────────────────────────────────────────────────
