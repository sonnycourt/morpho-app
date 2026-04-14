create table if not exists public.memory_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  milestone_entries int not null,
  summary text,
  key_patterns text,
  wins text,
  struggles text,
  timeline_markers text,
  source text not null default 'compression' check (source in ('compression')),
  created_at timestamptz not null default now()
);

create unique index if not exists idx_memory_snapshots_user_milestone
  on public.memory_snapshots(user_id, milestone_entries);

create index if not exists idx_memory_snapshots_user_created
  on public.memory_snapshots(user_id, created_at desc);

alter table public.memory_snapshots enable row level security;

drop policy if exists "memory_snapshots_select_own" on public.memory_snapshots;
create policy "memory_snapshots_select_own"
on public.memory_snapshots
for select
using (auth.uid() = user_id);
