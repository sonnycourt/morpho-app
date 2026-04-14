-- Rename journal score column: incarnation → alignement (terminologie produit)
alter table public.entries rename column incarnation_score to alignment_score;
