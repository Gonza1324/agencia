create or replace function public.update_expense_obligation(
  p_obligation_id uuid,
  p_description text,
  p_category_id uuid,
  p_amount numeric,
  p_due_date date,
  p_recurrence_months smallint default null,
  p_notes text default null
)
returns uuid
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  obligation_status public.expense_obligation_status;
begin
  if actor_id is null or not (select public.can_operate()) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if nullif(trim(p_description), '') is null
    or char_length(trim(p_description)) > 160
    or p_amount is null
    or p_amount <= 0
    or p_due_date is null
    or (
      p_recurrence_months is not null
      and p_recurrence_months not between 1 and 12
    ) then
    raise exception 'Los datos de la obligación son inválidos'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.cash_categories
    where id = p_category_id
      and type = 'expense'
      and status = 'active'
  ) then
    raise exception 'Seleccioná una categoría de gasto activa'
      using errcode = '22023';
  end if;

  select status
  into obligation_status
  from public.expense_obligations
  where id = p_obligation_id
  for update;

  if obligation_status is null then
    raise exception 'La obligación no existe'
      using errcode = '22023';
  end if;

  if obligation_status <> 'pending' then
    raise exception 'Solo se pueden editar obligaciones pendientes'
      using errcode = '22023';
  end if;

  update public.expense_obligations
  set
    description = trim(p_description),
    category_id = p_category_id,
    amount = p_amount,
    due_date = p_due_date,
    recurrence_months = p_recurrence_months,
    notes = nullif(trim(p_notes), ''),
    updated_by = actor_id
  where id = p_obligation_id;

  return p_obligation_id;
end;
$$;

create or replace function public.cancel_expense_obligation(
  p_obligation_id uuid,
  p_reason text
)
returns uuid
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  obligation_status public.expense_obligation_status;
begin
  if actor_id is null or not (select public.can_operate()) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if nullif(trim(p_reason), '') is null
    or char_length(trim(p_reason)) < 3
    or char_length(trim(p_reason)) > 500 then
    raise exception 'Ingresá un motivo de cancelación válido'
      using errcode = '22023';
  end if;

  select status
  into obligation_status
  from public.expense_obligations
  where id = p_obligation_id
  for update;

  if obligation_status is null then
    raise exception 'La obligación no existe'
      using errcode = '22023';
  end if;

  if obligation_status <> 'pending' then
    raise exception 'Solo se pueden cancelar obligaciones pendientes'
      using errcode = '22023';
  end if;

  update public.expense_obligations
  set
    status = 'cancelled',
    cancelled_at = now(),
    cancelled_by = actor_id,
    cancellation_reason = trim(p_reason),
    updated_by = actor_id
  where id = p_obligation_id;

  return p_obligation_id;
end;
$$;

revoke all on function public.update_expense_obligation(
  uuid, text, uuid, numeric, date, smallint, text
) from public, anon;
grant execute on function public.update_expense_obligation(
  uuid, text, uuid, numeric, date, smallint, text
) to authenticated;

revoke all on function public.cancel_expense_obligation(uuid, text)
  from public, anon;
grant execute on function public.cancel_expense_obligation(uuid, text)
  to authenticated;
