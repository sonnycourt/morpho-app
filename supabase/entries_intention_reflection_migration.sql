-- Migration: entries structure update
-- 1) add intention (required)
-- 2) make reflection optional

alter table public.entries add column if not exists intention text;

update public.entries
set intention = desired_state
where intention is null;

alter table public.entries alter column intention set not null;
alter table public.entries alter column reflection drop not null;
