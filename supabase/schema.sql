-- Extensions
create extension if not exists "pgcrypto";

-- Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  first_name text not null,
  wish text,
  secondary_wish text,
  created_at timestamptz not null default now()
);

-- Entries table
create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  entry_date date not null,
  desired_state text not null,
  intention text not null,
  gratitude text not null,
  reflection text,
  synchronicity text,
  alignment_score int not null check (alignment_score between 1 and 10),
  ai_message text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists entries_user_id_entry_date_key on public.entries (user_id, entry_date);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.entries enable row level security;

-- Profiles RLS policies
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Entries RLS policies
drop policy if exists "entries_select_own" on public.entries;
create policy "entries_select_own"
on public.entries
for select
using (auth.uid() = user_id);

drop policy if exists "entries_insert_own" on public.entries;
create policy "entries_insert_own"
on public.entries
for insert
with check (auth.uid() = user_id);

drop policy if exists "entries_update_own" on public.entries;
create policy "entries_update_own"
on public.entries
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "entries_delete_own" on public.entries;
create policy "entries_delete_own"
on public.entries
for delete
using (auth.uid() = user_id);

-- Trigger function: auto-create profile at signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', '')
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- User memory table for coach context
create table if not exists public.user_memory (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  summary text,
  key_patterns text,
  wins text,
  struggles text,
  timeline_markers text,
  last_updated_at timestamptz default now()
);

alter table public.user_memory enable row level security;

drop policy if exists "user_memory_select_own" on public.user_memory;
create policy "user_memory_select_own"
on public.user_memory
for select
using (auth.uid() = user_id);

drop policy if exists "user_memory_update_own" on public.user_memory;
create policy "user_memory_update_own"
on public.user_memory
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Chat messages between user and coach
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

drop policy if exists "chat_messages_select_own" on public.chat_messages;
create policy "chat_messages_select_own"
on public.chat_messages
for select
using (auth.uid() = user_id);

drop policy if exists "chat_messages_insert_own" on public.chat_messages;
create policy "chat_messages_insert_own"
on public.chat_messages
for insert
with check (auth.uid() = user_id);

-- AI cost and blocking flags
alter table public.profiles add column if not exists total_ai_cost_cents int default 0;
alter table public.profiles add column if not exists ai_blocked boolean default false;
alter table public.profiles add column if not exists secondary_wish text;

create index if not exists idx_chat_messages_user_date on public.chat_messages(user_id, created_at);
