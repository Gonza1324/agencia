create index subagents_status_name_idx
  on public.subagents (status, name, id);

create or replace function public.audit_subagent_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  audit_action text;
begin
  if tg_op = 'INSERT' then
    audit_action := 'create_subagent';

    insert into public.audit_logs (
      user_id,
      entity_type,
      entity_id,
      action,
      new_values
    )
    values (
      (select auth.uid()),
      'subagent',
      new.id,
      audit_action,
      to_jsonb(new)
    );

    return new;
  end if;

  if old.status is distinct from new.status then
    audit_action := case
      when new.status = 'active' then 'activate_subagent'
      else 'inactivate_subagent'
    end;
  else
    audit_action := 'edit_subagent';
  end if;

  insert into public.audit_logs (
    user_id,
    entity_type,
    entity_id,
    action,
    old_values,
    new_values
  )
  values (
    (select auth.uid()),
    'subagent',
    new.id,
    audit_action,
    to_jsonb(old),
    to_jsonb(new)
  );

  return new;
end;
$$;

revoke all on function public.audit_subagent_changes() from public;
revoke all on function public.audit_subagent_changes() from anon;
revoke all on function public.audit_subagent_changes() from authenticated;

create trigger subagents_audit_changes
after insert or update on public.subagents
for each row execute function public.audit_subagent_changes();
