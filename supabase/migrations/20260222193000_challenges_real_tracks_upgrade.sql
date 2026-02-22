alter table if exists public.challenges
  add column if not exists innovation_track text,
  add column if not exists challenge_owner text,
  add column if not exists baseline_value text,
  add column if not exists target_value text,
  add column if not exists scope_in text,
  add column if not exists scope_out text,
  add column if not exists execution_constraints text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'challenges' and column_name = 'innovation_track'
  ) then
    create index if not exists idx_challenges_innovation_track on public.challenges(innovation_track);
  end if;
end $$;
