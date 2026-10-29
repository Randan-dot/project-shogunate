-- ============================================================================
-- Shogunate — Initial schema
-- Role hierarchy: Shogun (admin) > Samurai (moderator) > Ronin (member)
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Role enum
-- ---------------------------------------------------------------------------
do $$
begin
  create type public.user_role as enum ('shogun', 'samurai', 'ronin');
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Profiles (one row per auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text unique not null,
  display_name text,
  bio         text not null default '',
  avatar_url  text,
  role        public.user_role not null default 'ronin',
  reputation  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Boards (community sections)
-- ---------------------------------------------------------------------------
create table if not exists public.boards (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  description text,
  icon        text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Posts
-- ---------------------------------------------------------------------------
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  board_id    uuid not null references public.boards (id) on delete cascade,
  author_id   uuid not null references public.profiles (id) on delete cascade,
  title       text not null,
  content     text,
  tags        text[] not null default '{}',
  vote_score  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists posts_board_idx on public.posts (board_id, created_at desc);
create index if not exists posts_author_idx on public.posts (author_id);

-- ---------------------------------------------------------------------------
-- Votes (up/down)
-- ---------------------------------------------------------------------------
create table if not exists public.votes (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  value      integer not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Comments
-- ---------------------------------------------------------------------------
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  author_id  uuid not null references public.profiles (id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_post_idx on public.comments (post_id, created_at asc);

-- ---------------------------------------------------------------------------
-- Chat rooms
-- ---------------------------------------------------------------------------
create table if not exists public.chat_rooms (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  description text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Chat messages
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references public.chat_rooms (id) on delete cascade,
  sender_id  uuid not null references public.profiles (id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_room_idx on public.messages (room_id, created_at asc);

-- ---------------------------------------------------------------------------
-- Moderation actions (bans / mutes)
-- ---------------------------------------------------------------------------
create table if not exists public.moderation (
  id         uuid primary key default gen_random_uuid(),
  target_id  uuid not null references public.profiles (id) on delete cascade,
  actor_id   uuid not null references public.profiles (id) on delete cascade,
  action     text not null check (action in ('ban', 'unban', 'mute', 'unmute')),
  reason     text,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists moderation_target_idx on public.moderation (target_id, action);

-- ============================================================================
-- Helper functions
-- ============================================================================

-- True when the given user is a Samurai or Shogun.
create or replace function public.is_moderator(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.role in ('samurai', 'shogun')
  );
$$;

-- True when the given user is a Shogun (admin).
create or replace function public.is_shogun(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.role = 'shogun'
  );
$$;

-- True when an active ban applies to the given user.
create or replace function public.is_user_banned(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.moderation m
    where m.target_id = uid
      and m.action = 'ban'
      and (m.expires_at is null or m.expires_at > now())
  );
$$;

-- True when an active mute applies to the given user.
create or replace function public.is_user_muted(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.moderation m
    where m.target_id = uid
      and m.action = 'mute'
      and (m.expires_at is null or m.expires_at > now())
  );
$$;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Auto-create a profile row when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
  final_display  text;
begin
  base_username := coalesce(
    new.raw_user_meta_data ->> 'username',
    'ronin_' || substr(new.id::text, 1, 8)
  );
  final_display := coalesce(
    new.raw_user_meta_data ->> 'display_name',
    split_part(coalesce(new.email, ''), '@', 1)
  );
  final_username := base_username;

  for attempt in 1..5 loop
    begin
      insert into public.profiles (id, username, display_name, avatar_url)
      values (new.id, final_username, final_display, new.raw_user_meta_data ->> 'avatar_url')
      on conflict (id) do nothing;
      exit;
    exception
      when unique_violation then
        final_username := base_username || '_' || substr(new.id::text, 1, 4);
    end;
  end loop;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Prevent role changes by anyone except a Shogun.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if auth.uid() is not null and not public.is_shogun(auth.uid()) then
      raise exception 'Only a Shogun may change roles';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_role_escalation on public.profiles;
create trigger trg_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- Self edits may change any field (role still guarded above).
-- Non-self edits are restricted to a Shogun changing only the role field.
create or replace function public.restrict_profile_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Direct DB access (SQL editor / migrations) is trusted.
  if auth.uid() is null then
    return new;
  end if;

  if auth.uid() = old.id then
    return new;
  end if;

  if not public.is_shogun(auth.uid()) then
    raise exception 'Not authorized to edit this profile';
  end if;

  if new.display_name is distinct from old.display_name
     or new.bio          is distinct from old.bio
     or new.avatar_url   is distinct from old.avatar_url
     or new.username     is distinct from old.username
     or new.reputation   is distinct from old.reputation then
    raise exception 'A Shogun may only change the role field';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_restrict_profile_updates on public.profiles;
create trigger trg_restrict_profile_updates
  before update on public.profiles
  for each row execute function public.restrict_profile_updates();

-- Keep posts.vote_score in sync with the votes table.
create or replace function public.update_post_vote_score()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_post uuid;
begin
  target_post := coalesce(new.post_id, old.post_id);
  update public.posts
     set vote_score = coalesce(
           (select sum(v.value) from public.votes v where v.post_id = target_post), 0)
   where id = target_post;
  return null;
end;
$$;

drop trigger if exists trg_update_vote_score on public.votes;
create trigger trg_update_vote_score
  after insert or update or delete on public.votes
  for each row execute function public.update_post_vote_score();

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.profiles   enable row level security;
alter table public.boards     enable row level security;
alter table public.posts      enable row level security;
alter table public.votes      enable row level security;
alter table public.comments   enable row level security;
alter table public.chat_rooms enable row level security;
alter table public.messages   enable row level security;
alter table public.moderation enable row level security;

-- profiles ---------------------------------------------------------------
create policy "profiles_public_read"
  on public.profiles for select
  using (true);

create policy "profiles_insert_self"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_self"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_update_shogun"
  on public.profiles for update
  using (public.is_shogun(auth.uid()))
  with check (public.is_shogun(auth.uid()));

-- boards -----------------------------------------------------------------
create policy "boards_public_read"
  on public.boards for select
  using (true);

create policy "boards_moderator_manage"
  on public.boards for all
  using (public.is_moderator(auth.uid()))
  with check (public.is_moderator(auth.uid()));

-- posts ------------------------------------------------------------------
create policy "posts_public_read"
  on public.posts for select
  using (true);

create policy "posts_insert_own"
  on public.posts for insert
  with check (auth.uid() = author_id and not public.is_user_banned(auth.uid()));

create policy "posts_update_own"
  on public.posts for update
  using (auth.uid() = author_id or public.is_moderator(auth.uid()));

create policy "posts_delete_own_or_moderator"
  on public.posts for delete
  using (auth.uid() = author_id or public.is_moderator(auth.uid()));

-- votes ------------------------------------------------------------------
create policy "votes_public_read"
  on public.votes for select
  using (true);

create policy "votes_insert_own"
  on public.votes for insert
  with check (auth.uid() = user_id and not public.is_user_banned(auth.uid()));

create policy "votes_update_own"
  on public.votes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and value in (-1, 1));

create policy "votes_delete_own"
  on public.votes for delete
  using (auth.uid() = user_id);

-- comments ---------------------------------------------------------------
create policy "comments_public_read"
  on public.comments for select
  using (true);

create policy "comments_insert_own"
  on public.comments for insert
  with check (auth.uid() = author_id and not public.is_user_banned(auth.uid()));

create policy "comments_update_own"
  on public.comments for update
  using (auth.uid() = author_id);

create policy "comments_delete_own_or_moderator"
  on public.comments for delete
  using (auth.uid() = author_id or public.is_moderator(auth.uid()));

-- chat_rooms -------------------------------------------------------------
create policy "chat_rooms_public_read"
  on public.chat_rooms for select
  using (true);

create policy "chat_rooms_moderator_manage"
  on public.chat_rooms for all
  using (public.is_moderator(auth.uid()))
  with check (public.is_moderator(auth.uid()));

-- messages ---------------------------------------------------------------
create policy "messages_public_read"
  on public.messages for select
  using (true);

create policy "messages_insert_allowed"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and not public.is_user_banned(auth.uid())
    and not public.is_user_muted(auth.uid())
  );

create policy "messages_delete_own_or_moderator"
  on public.messages for delete
  using (auth.uid() = sender_id or public.is_moderator(auth.uid()));

-- moderation -------------------------------------------------------------
create policy "moderation_public_read"
  on public.moderation for select
  using (true);

create policy "moderation_moderator_insert"
  on public.moderation for insert
  with check (public.is_moderator(auth.uid()) and actor_id = auth.uid());

create policy "moderation_moderator_update"
  on public.moderation for update
  using (public.is_moderator(auth.uid()));

create policy "moderation_moderator_delete"
  on public.moderation for delete
  using (public.is_moderator(auth.uid()));

-- ============================================================================
-- Realtime publication (for live chat + live vote counts)
-- ============================================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.votes;

-- ============================================================================
-- Storage: avatars bucket
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_own_upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_own_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_own_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
