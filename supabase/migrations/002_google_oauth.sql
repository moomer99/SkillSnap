-- SkillSnap — Google OAuth Profile Trigger Update
-- Updates handle_new_user() to handle Google OAuth metadata fields
-- (full_name, name, avatar_url, picture) in addition to email/password signups.
-- Run after 001_initial_schema.sql

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
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

  _username := lower(regexp_replace(_display_name, '[^a-z0-9_]', '_', 'g'));
  -- Truncate and make unique with last 4 chars of user id
  _username := left(_username, 26) || '_' || left(replace(new.id::text, '-', ''), 4);

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

-- Enable Google provider in Supabase Dashboard:
-- Authentication → Providers → Google → Enable
-- Set Client ID and Client Secret from Google Cloud Console
-- Set Authorized redirect URI in Google Cloud Console to:
--   https://<your-project-ref>.supabase.co/auth/v1/callback
-- Set NEXT_PUBLIC_SITE_URL in .env.local to your app URL (e.g. http://localhost:3000)
