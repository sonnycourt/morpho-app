do $$
begin
  if not exists (select 1 from pg_type where typname = 'memory_event_type') then
    create type public.memory_event_type as enum (
      'breakthrough',
      'fear',
      'commitment',
      'rechute',
      'milestone',
      'resistance',
      'clarity',
      'decision',
      'other'
    );
  end if;
end $$;

create table if not exists public.memory_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_date date not null,
  event_type public.memory_event_type not null,
  event_text text not null,
  source text not null check (source in ('entries', 'chat_messages')),
  confidence numeric(3,2) not null check (confidence >= 0 and confidence <= 1),
  created_at timestamptz not null default now()
);

create index if not exists idx_memory_events_user_date
  on public.memory_events(user_id, event_date desc, created_at desc);

create index if not exists idx_memory_events_user_type
  on public.memory_events(user_id, event_type);

alter table public.memory_events enable row level security;

drop policy if exists "memory_events_select_own" on public.memory_events;
create policy "memory_events_select_own"
on public.memory_events
for select
using (auth.uid() = user_id);
