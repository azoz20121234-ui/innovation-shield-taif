alter table if exists public.team_members
  add column if not exists member_name text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'team_members' and column_name = 'name'
  ) then
    execute $sql$
      update public.team_members
      set member_name = coalesce(member_name, name)
      where member_name is null
    $sql$;
  end if;
end $$;
