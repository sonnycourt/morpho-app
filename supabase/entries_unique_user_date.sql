-- À exécuter une fois sur le projet Supabase (éditeur SQL) pour permettre l’upsert jour par jour.
create unique index if not exists entries_user_id_entry_date_key on public.entries (user_id, entry_date);
