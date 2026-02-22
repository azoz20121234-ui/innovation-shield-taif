alter table if exists public.ideas
  add column if not exists problem_statement text,
  add column if not exists proposed_solution text,
  add column if not exists added_value text,
  add column if not exists target_audience text,
  add column if not exists expected_impact text,
  add column if not exists potential_risks text,
  add column if not exists maturity_level text not null default 'idea',
  add column if not exists self_clarity numeric,
  add column if not exists self_readiness numeric,
  add column if not exists self_feasibility numeric,
  add column if not exists idea_quality_score numeric;

alter table if exists public.ideas
  drop constraint if exists ideas_maturity_level_valid;

alter table if exists public.ideas
  add constraint ideas_maturity_level_valid
  check (maturity_level in ('idea', 'concept', 'prototype'));

alter table if exists public.ideas
  drop constraint if exists ideas_self_clarity_range;
alter table if exists public.ideas
  add constraint ideas_self_clarity_range check (self_clarity is null or (self_clarity >= 0 and self_clarity <= 100));

alter table if exists public.ideas
  drop constraint if exists ideas_self_readiness_range;
alter table if exists public.ideas
  add constraint ideas_self_readiness_range check (self_readiness is null or (self_readiness >= 0 and self_readiness <= 100));

alter table if exists public.ideas
  drop constraint if exists ideas_self_feasibility_range;
alter table if exists public.ideas
  add constraint ideas_self_feasibility_range check (self_feasibility is null or (self_feasibility >= 0 and self_feasibility <= 100));

alter table if exists public.ideas
  drop constraint if exists ideas_quality_score_range;
alter table if exists public.ideas
  add constraint ideas_quality_score_range check (idea_quality_score is null or (idea_quality_score >= 0 and idea_quality_score <= 100));

create table if not exists public.idea_attachments (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  file_name text not null,
  file_type text,
  file_size integer,
  file_data text,
  uploaded_at timestamptz not null default now()
);

create index if not exists idx_ideas_maturity_level on public.ideas(maturity_level);
create index if not exists idx_ideas_quality_score on public.ideas(idea_quality_score);
create index if not exists idx_idea_attachments_idea_id on public.idea_attachments(idea_id);
