create or replace function public.audit_cash_category_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
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
    'cash_category',
    new.id,
    case when tg_op = 'INSERT'
      then 'create_cash_category'
      else 'update_cash_category'
    end,
    case when tg_op = 'UPDATE' then to_jsonb(old) else null end,
    to_jsonb(new)
  );

  return new;
end;
$$;

revoke all on function public.audit_cash_category_changes() from public;
revoke all on function public.audit_cash_category_changes() from anon;
revoke all on function public.audit_cash_category_changes() from authenticated;

create trigger cash_categories_audit_changes
after insert or update on public.cash_categories
for each row execute function public.audit_cash_category_changes();
