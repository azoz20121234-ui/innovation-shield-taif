alter table if exists public.challenges
  add column if not exists department text;
