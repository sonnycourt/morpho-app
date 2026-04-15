alter table public.profiles
  add column if not exists communication_style text,
  add column if not exists motivation_driver text;
