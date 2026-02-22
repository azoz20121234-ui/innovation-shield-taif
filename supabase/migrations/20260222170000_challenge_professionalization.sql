alter table if exists public.challenges
  add column if not exists lifecycle_status text not null default 'draft',
  add column if not exists target_ideas integer not null default 5,
  add column if not exists start_date date not null default current_date,
  add column if not exists end_date date,
  add column if not exists opened_at timestamptz,
  add column if not exists review_started_at timestamptz,
  add column if not exists closed_at timestamptz,
  add column if not exists archived_at timestamptz;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'challenges' and column_name = 'status'
  ) then
    execute $sql$
      update public.challenges
      set lifecycle_status = case
        when lower(coalesce(status, '')) = 'open' then 'open'
        when lower(coalesce(status, '')) = 'closed' then 'closed'
        else coalesce(nullif(lower(lifecycle_status), ''), 'draft')
      end
    $sql$;
  else
    update public.challenges
    set lifecycle_status = coalesce(nullif(lower(lifecycle_status), ''), 'draft');
  end if;
end $$;

alter table if exists public.challenges
  drop constraint if exists challenges_lifecycle_status_valid;

alter table if exists public.challenges
  add constraint challenges_lifecycle_status_valid
  check (lifecycle_status in ('draft', 'open', 'in_review', 'closed', 'archived'));

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'challenges' and column_name = 'lifecycle_status'
  ) then
    create index if not exists idx_challenges_lifecycle_status on public.challenges(lifecycle_status);
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'challenges' and column_name = 'department'
  ) then
    create index if not exists idx_challenges_department on public.challenges(department);
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'challenges' and column_name = 'end_date'
  ) then
    create index if not exists idx_challenges_end_date on public.challenges(end_date);
  end if;
end $$;
