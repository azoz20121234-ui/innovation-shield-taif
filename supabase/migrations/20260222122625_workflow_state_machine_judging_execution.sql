create extension if not exists "pgcrypto";

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  department text,
  success_criteria text,
  impact_metric text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references public.challenges(id) on delete set null,
  title text not null,
  description text,
  owner_id text,
  owner_name text,
  state text not null default 'idea_submitted',
  ai_summary text,
  ai_pitch text,
  ai_risk_summary text,
  ai_prototype_hint text,
  ip_recommendation text,
  latest_ai_score numeric,
  final_judging_score numeric,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.idea_state_events (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  from_state text,
  to_state text not null,
  action text,
  notes text,
  actor_id text,
  actor_role text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  action text not null,
  entity text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid references public.ideas(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  member_id text,
  member_name text not null,
  role text,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid references public.ideas(id) on delete set null,
  project_id uuid,
  title text not null,
  description text,
  owner_name text,
  due_date date,
  status text not null default 'todo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.judging_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.judging_criteria (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.judging_templates(id) on delete cascade,
  criterion text not null,
  weight numeric not null check (weight > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.judging_evaluations (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  evaluator_id text,
  evaluator_name text not null,
  evaluator_role text not null,
  criterion_id uuid not null references public.judging_criteria(id) on delete cascade,
  score numeric not null check (score >= 0 and score <= 100),
  comments text,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid unique not null references public.ideas(id) on delete cascade,
  name text not null,
  description text,
  pm_name text,
  start_date date not null,
  end_date date not null,
  status text not null default 'planned',
  progress numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.tasks
  add column if not exists project_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tasks_project_id_fk'
  ) then
    alter table public.tasks
      add constraint tasks_project_id_fk
      foreign key (project_id) references public.projects(id)
      on delete cascade;
  end if;
end $$;

create table if not exists public.project_risks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  severity text not null default 'medium',
  mitigation text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists public.project_kpis (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  baseline numeric,
  target numeric,
  current_value numeric,
  unit text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_assist_logs (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid references public.ideas(id) on delete set null,
  step text not null,
  prompt text,
  response jsonb,
  created_at timestamptz not null default now()
);

insert into public.judging_templates (name, is_default)
select 'Default Innovation Template', true
where not exists (select 1 from public.judging_templates where is_default = true);

insert into public.judging_criteria (template_id, criterion, weight)
select t.id, c.criterion, c.weight
from public.judging_templates t
join (
  values
    ('الأثر الصحي/التشغيلي', 30::numeric),
    ('الجدوى وسهولة التطبيق', 25::numeric),
    ('الابتكار والتميّز', 20::numeric),
    ('القابلية للتوسع', 15::numeric),
    ('الالتزام بالخصوصية والسلامة', 10::numeric)
) as c(criterion, weight) on true
where t.is_default = true
and not exists (select 1 from public.judging_criteria jc where jc.template_id = t.id);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'ideas' and column_name = 'state'
  ) then
    create index if not exists idx_ideas_state on public.ideas(state);
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'ideas' and column_name = 'challenge_id'
  ) then
    create index if not exists idx_ideas_challenge_id on public.ideas(challenge_id);
  end if;
end $$;

create index if not exists idx_projects_idea_id on public.projects(idea_id);
create index if not exists idx_tasks_project_id on public.tasks(project_id);
create index if not exists idx_judging_eval_idea_id on public.judging_evaluations(idea_id);
create index if not exists idx_state_events_idea_id on public.idea_state_events(idea_id);
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'audit_logs' and column_name = 'entity_id'
  ) then
    create index if not exists idx_audit_logs_entity on public.audit_logs(entity, entity_id);
  end if;
end $$;
