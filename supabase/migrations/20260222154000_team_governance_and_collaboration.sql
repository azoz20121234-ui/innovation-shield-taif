alter table if exists public.teams
  add column if not exists description text,
  add column if not exists objective text,
  add column if not exists challenge_id uuid references public.challenges(id) on delete set null,
  add column if not exists progress numeric not null default 0,
  add column if not exists expected_impact text,
  add column if not exists achieved_impact text,
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.ideas
  add column if not exists team_id uuid references public.teams(id) on delete set null;

alter table if exists public.tasks
  add column if not exists team_id uuid references public.teams(id) on delete set null;

update public.teams
set progress = 0
where progress < 0 or progress > 100;

alter table if exists public.teams
  drop constraint if exists teams_progress_range;

alter table if exists public.teams
  add constraint teams_progress_range check (progress >= 0 and progress <= 100);

create unique index if not exists uniq_team_single_leader
on public.team_members(team_id)
where lower(coalesce(role, '')) = 'leader';

create index if not exists idx_ideas_team_id on public.ideas(team_id);
create index if not exists idx_tasks_team_id on public.tasks(team_id);
create index if not exists idx_teams_challenge_id on public.teams(challenge_id);
