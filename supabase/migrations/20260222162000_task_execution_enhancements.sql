alter table if exists public.tasks
  add column if not exists priority text not null default 'medium',
  add column if not exists progress numeric not null default 0,
  add column if not exists blocked_reason text,
  add column if not exists last_update text,
  add column if not exists last_activity_at timestamptz not null default now();

update public.tasks
set progress = case
  when status = 'done' then 100
  when status = 'inprogress' then greatest(progress, 25)
  else coalesce(progress, 0)
end;

alter table if exists public.tasks
  drop constraint if exists tasks_progress_range;
alter table if exists public.tasks
  add constraint tasks_progress_range check (progress >= 0 and progress <= 100);

alter table if exists public.tasks
  drop constraint if exists tasks_priority_valid;
alter table if exists public.tasks
  add constraint tasks_priority_valid check (priority in ('high', 'medium', 'low'));

create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  author_name text not null,
  comment text not null,
  attachment_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_tasks_priority on public.tasks(priority);
create index if not exists idx_tasks_last_activity_at on public.tasks(last_activity_at);
create index if not exists idx_task_comments_task_id on public.task_comments(task_id);
