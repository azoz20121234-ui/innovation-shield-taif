create extension if not exists "pgcrypto";

alter table if exists public.tasks add column if not exists project_id uuid;
alter table if exists public.tasks add column if not exists idea_id uuid;
alter table if exists public.tasks add column if not exists description text;
alter table if exists public.tasks add column if not exists owner_name text;
alter table if exists public.tasks add column if not exists due_date date;
alter table if exists public.tasks add column if not exists updated_at timestamptz default now();

alter table if exists public.ideas add column if not exists state text default 'idea_submitted';
alter table if exists public.ideas add column if not exists ai_summary text;
alter table if exists public.ideas add column if not exists ai_pitch text;
alter table if exists public.ideas add column if not exists ai_risk_summary text;
alter table if exists public.ideas add column if not exists ai_prototype_hint text;
alter table if exists public.ideas add column if not exists ip_recommendation text;
alter table if exists public.ideas add column if not exists latest_ai_score numeric;
alter table if exists public.ideas add column if not exists final_judging_score numeric;
alter table if exists public.ideas add column if not exists approved_at timestamptz;

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

create table if not exists public.ai_assist_logs (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid references public.ideas(id) on delete set null,
  step text not null,
  prompt text,
  response jsonb,
  created_at timestamptz not null default now()
);

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

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tasks_idea_id_fk'
  ) then
    alter table public.tasks
      add constraint tasks_idea_id_fk
      foreign key (idea_id) references public.ideas(id)
      on delete set null;
  end if;
end $$;

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
and not exists (
  select 1 from public.judging_criteria jc where jc.template_id = t.id and jc.criterion = c.criterion
);

create index if not exists idx_ideas_state on public.ideas(state);
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
