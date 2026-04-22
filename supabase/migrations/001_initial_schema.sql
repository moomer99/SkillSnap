-- SkillSnap — Initial Supabase Schema
-- Run this in Supabase SQL Editor or via: supabase db push
-- ─────────────────────────────────────────────────────────

-- ── Extensions ───────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- enables fast ILIKE / full-text search

-- ── Profiles ─────────────────────────────────────────────
-- One row per auth.users entry, created on sign-up via trigger.
create table public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  username          text unique not null,
  display_name      text not null,
  avatar_url        text,
  avatar_gradient   text not null default 'linear-gradient(135deg, #6c47ff, #a78bfa)',
  avatar_initial    text not null default 'U',
  location          text,
  bio               text,
  skill             text,                     -- null = client/viewer
  is_verified       boolean not null default false,
  jobs_done         integer not null default 0 check (jobs_done >= 0),
  followers_count   integer not null default 0 check (followers_count >= 0),
  following_count   integer not null default 0 check (following_count >= 0),
  post_count        integer not null default 0 check (post_count >= 0),
  is_client         boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ── Categories ────────────────────────────────────────────
create table public.categories (
  id         uuid primary key default uuid_generate_v4(),
  name       text unique not null,
  icon       text,
  created_at timestamptz not null default now()
);

insert into public.categories (name) values
  ('Barber'), ('Tiler'), ('Makeup Artist'), ('Cleaning'),
  ('Fitness / PT'), ('Plumber'), ('Electrician'), ('Landscaping'),
  ('Nails'), ('Other');

-- ── Posts ─────────────────────────────────────────────────
create table public.posts (
  id                 uuid primary key default uuid_generate_v4(),
  author_id          uuid not null references public.profiles(id) on delete cascade,
  type               text not null check (type in ('video', 'photo')),
  media_url          text,
  thumbnail_url      text,
  thumbnail_gradient text not null default 'linear-gradient(135deg, #6c47ff, #a78bfa)',
  caption            text not null default '',
  likes_count        integer not null default 0 check (likes_count >= 0),
  skill              text,
  location           text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ── Post Media ────────────────────────────────────────────
create table public.post_media (
  id          uuid primary key default uuid_generate_v4(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  url         text not null,
  type        text not null check (type in ('video', 'photo')),
  order_index integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ── Follows ───────────────────────────────────────────────
create table public.follows (
  follower_id  uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

-- ── Likes ─────────────────────────────────────────────────
create table public.likes (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  post_id    uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

-- ── Saved Posts ───────────────────────────────────────────
create table public.saved_posts (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  post_id    uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

-- ── Conversations ─────────────────────────────────────────
create table public.conversations (
  id                uuid primary key default uuid_generate_v4(),
  last_message_text text,
  last_message_at   timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ── Conversation Members ──────────────────────────────────
create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  unread_count    integer not null default 0 check (unread_count >= 0),
  joined_at       timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

-- ── Messages ──────────────────────────────────────────────
create table public.messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  text            text not null,
  created_at      timestamptz not null default now()
);

-- ── Jobs Done ─────────────────────────────────────────────
-- Both parties confirm via chat before count increments.
create table public.jobs_done (
  id                  uuid primary key default uuid_generate_v4(),
  skiller_id          uuid not null references public.profiles(id) on delete cascade,
  client_id           uuid not null references public.profiles(id) on delete cascade,
  conversation_id     uuid references public.conversations(id) on delete set null,
  description         text,
  skiller_confirmed   boolean not null default false,
  client_confirmed    boolean not null default false,
  verified_at         timestamptz,  -- set when both confirm
  created_at          timestamptz not null default now(),
  check (skiller_id <> client_id)
);

-- ── Notifications ─────────────────────────────────────────
create table public.notifications (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  type         text not null check (type in ('like', 'follow', 'message', 'job_verified')),
  from_user_id uuid references public.profiles(id) on delete set null,
  message      text not null,
  read         boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────
create index on public.posts (author_id);
create index on public.posts (created_at desc);
create index on public.posts (skill);
create index on public.messages (conversation_id, created_at);
create index on public.conversation_members (user_id);
create index on public.follows (following_id);
create index on public.notifications (user_id, read, created_at desc);
create index on public.jobs_done (skiller_id);
create index on public.jobs_done (client_id);

-- Full-text search indexes
create index on public.profiles using gin (username gin_trgm_ops);
create index on public.profiles using gin (display_name gin_trgm_ops);
create index on public.profiles using gin (location gin_trgm_ops);

-- ─────────────────────────────────────────────────────────
-- TRIGGERS
-- ─────────────────────────────────────────────────────────

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, display_name, avatar_initial)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    upper(left(coalesce(new.raw_user_meta_data->>'display_name', new.email), 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update updated_at timestamps
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger set_posts_updated_at before update on public.posts
  for each row execute procedure public.set_updated_at();
create trigger set_conversations_updated_at before update on public.conversations
  for each row execute procedure public.set_updated_at();

-- Sync follower/following counts
create or replace function public.sync_follow_counts()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles set followers_count = followers_count + 1 where id = new.following_id;
    update public.profiles set following_count = following_count + 1 where id = new.follower_id;
  elsif tg_op = 'DELETE' then
    update public.profiles set followers_count = greatest(0, followers_count - 1) where id = old.following_id;
    update public.profiles set following_count = greatest(0, following_count - 1) where id = old.follower_id;
  end if;
  return null;
end;
$$;

create trigger sync_follows after insert or delete on public.follows
  for each row execute procedure public.sync_follow_counts();

-- Sync likes count
create or replace function public.sync_likes_count()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set likes_count = likes_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set likes_count = greatest(0, likes_count - 1) where id = old.post_id;
  end if;
  return null;
end;
$$;

create trigger sync_likes after insert or delete on public.likes
  for each row execute procedure public.sync_likes_count();

-- Sync post count on profile
create or replace function public.sync_post_count()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles set post_count = post_count + 1 where id = new.author_id;
  elsif tg_op = 'DELETE' then
    update public.profiles set post_count = greatest(0, post_count - 1) where id = old.author_id;
  end if;
  return null;
end;
$$;

create trigger sync_posts after insert or delete on public.posts
  for each row execute procedure public.sync_post_count();

-- Increment jobs_done on skiller when both parties confirm
create or replace function public.handle_job_confirmed()
returns trigger language plpgsql security definer as $$
begin
  -- If just became fully confirmed, stamp verified_at and increment jobs_done
  if new.skiller_confirmed and new.client_confirmed and old.verified_at is null then
    new.verified_at = now();
    update public.profiles set jobs_done = jobs_done + 1 where id = new.skiller_id;
  end if;
  return new;
end;
$$;

create trigger on_job_confirmed before update on public.jobs_done
  for each row execute procedure public.handle_job_confirmed();

-- Update conversation last_message on new message
create or replace function public.update_conversation_last_message()
returns trigger language plpgsql security definer as $$
begin
  update public.conversations
  set last_message_text = new.text, last_message_at = new.created_at
  where id = new.conversation_id;

  -- Increment unread counts for other members
  update public.conversation_members
  set unread_count = unread_count + 1
  where conversation_id = new.conversation_id and user_id <> new.sender_id;

  return new;
end;
$$;

create trigger on_message_insert after insert on public.messages
  for each row execute procedure public.update_conversation_last_message();

-- ─────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_media enable row level security;
alter table public.follows enable row level security;
alter table public.likes enable row level security;
alter table public.saved_posts enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.jobs_done enable row level security;
alter table public.notifications enable row level security;

-- Profiles: anyone can read public profiles; only owner can update
create policy "Profiles are publicly readable" on public.profiles
  for select using (true);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Posts: public read; owner manages
create policy "Posts are publicly readable" on public.posts
  for select using (true);
create policy "Users can create own posts" on public.posts
  for insert with check (auth.uid() = author_id);
create policy "Users can update own posts" on public.posts
  for update using (auth.uid() = author_id);
create policy "Users can delete own posts" on public.posts
  for delete using (auth.uid() = author_id);

-- Post media: public read; owner manages via post
create policy "Post media is publicly readable" on public.post_media
  for select using (true);
create policy "Post owner can manage media" on public.post_media
  for all using (
    exists (select 1 from public.posts where id = post_media.post_id and author_id = auth.uid())
  );

-- Follows: public read; manage own
create policy "Follows are publicly readable" on public.follows
  for select using (true);
create policy "Users can follow others" on public.follows
  for insert with check (auth.uid() = follower_id);
create policy "Users can unfollow" on public.follows
  for delete using (auth.uid() = follower_id);

-- Likes: public read; manage own
create policy "Likes are publicly readable" on public.likes
  for select using (true);
create policy "Users can like posts" on public.likes
  for insert with check (auth.uid() = user_id);
create policy "Users can unlike posts" on public.likes
  for delete using (auth.uid() = user_id);

-- Saved posts: private to owner
create policy "Users can read own saved posts" on public.saved_posts
  for select using (auth.uid() = user_id);
create policy "Users can save posts" on public.saved_posts
  for insert with check (auth.uid() = user_id);
create policy "Users can unsave posts" on public.saved_posts
  for delete using (auth.uid() = user_id);

-- Conversations: only members can read
create policy "Members can read their conversations" on public.conversations
  for select using (
    exists (
      select 1 from public.conversation_members
      where conversation_id = conversations.id and user_id = auth.uid()
    )
  );
create policy "Authenticated users can create conversations" on public.conversations
  for insert with check (auth.uid() is not null);

-- Conversation members: only members can read membership
create policy "Members can read conversation membership" on public.conversation_members
  for select using (
    exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = conversation_members.conversation_id and cm.user_id = auth.uid()
    )
  );
create policy "System can insert members" on public.conversation_members
  for insert with check (auth.uid() is not null);

-- Messages: only conversation members can read/send
create policy "Members can read messages" on public.messages
  for select using (
    exists (
      select 1 from public.conversation_members
      where conversation_id = messages.conversation_id and user_id = auth.uid()
    )
  );
create policy "Members can send messages" on public.messages
  for insert with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.conversation_members
      where conversation_id = messages.conversation_id and user_id = auth.uid()
    )
  );

-- Jobs Done: skiller and client can read their own jobs; skiller initiates, both confirm
create policy "Parties can read their jobs" on public.jobs_done
  for select using (auth.uid() = skiller_id or auth.uid() = client_id);
create policy "Skiller can create job record" on public.jobs_done
  for insert with check (auth.uid() = skiller_id);
create policy "Parties can confirm jobs" on public.jobs_done
  for update using (auth.uid() = skiller_id or auth.uid() = client_id);

-- Notifications: private to owner
create policy "Users can read own notifications" on public.notifications
  for select using (auth.uid() = user_id);
create policy "System can create notifications" on public.notifications
  for insert with check (true);  -- service role inserts notifications
create policy "Users can mark notifications read" on public.notifications
  for update using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────
-- STORAGE BUCKETS
-- ─────────────────────────────────────────────────────────
-- Run in Supabase Storage UI or via storage API:
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
-- insert into storage.buckets (id, name, public) values ('post-media', 'post-media', true);
-- Storage RLS policies should allow:
--   avatars: public read; owner write (path: {user_id}/*)
--   post-media: public read; authenticated write (path: {user_id}/*)
