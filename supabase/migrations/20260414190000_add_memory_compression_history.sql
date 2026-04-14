create table if not exists public.memory_compression_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  milestone_entries int not null,
  window_start date,
  window_end date,
  entries_in_window int not null default 0,
  status text not null check (status in ('success', 'skipped', 'error')),
  skip_reason text,
  error_message text,
  input_tokens int,
  output_tokens int,
  cost_cents int,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_memory_compression_user_milestone
  on public.memory_compression_history(user_id, milestone_entries);

create index if not exists idx_memory_compression_user_created
  on public.memory_compression_history(user_id, created_at desc);

alter table public.memory_compression_history enable row level security;

drop policy if exists "memory_compression_history_select_own" on public.memory_compression_history;
create policy "memory_compression_history_select_own"
on public.memory_compression_history
for select
using (auth.uid() = user_id);
