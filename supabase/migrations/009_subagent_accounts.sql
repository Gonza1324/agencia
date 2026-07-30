create or replace function public.get_subagent_account_summary(
  p_subagent_id uuid
)
returns table (
  balance numeric,
  total_debits numeric,
  total_credits numeric,
  active_movements bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    coalesce(
      sum(
        case movement.direction
          when 'debit' then movement.amount
          else -movement.amount
        end
      ),
      0
    ) as balance,
    coalesce(
      sum(movement.amount) filter (where movement.direction = 'debit'),
      0
    ) as total_debits,
    coalesce(
      sum(movement.amount) filter (where movement.direction = 'credit'),
      0
    ) as total_credits,
    count(*) as active_movements
  from public.subagent_account_movements as movement
  where movement.subagent_id = p_subagent_id
    and movement.voided_at is null;
$$;

revoke all on function public.get_subagent_account_summary(uuid) from public;
revoke all on function public.get_subagent_account_summary(uuid) from anon;
grant execute on function public.get_subagent_account_summary(uuid)
  to authenticated;

create or replace function public.create_subagent_account_movement(
  p_business_date date,
  p_subagent_id uuid,
  p_type public.account_movement_type,
  p_amount numeric,
  p_cash_account_id uuid default null,
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
  business_day_id uuid;
  account_movement_id uuid;
  cash_movement_id uuid;
  category_id uuid;
  current_balance numeric;
  movement_direction public.account_movement_direction;
begin
  if actor_id is null or not (select public.is_owner_admin()) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if extract(isodow from p_business_date) = 7 then
    raise exception 'El domingo no es un día operativo'
      using errcode = '22023';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'El importe debe ser mayor a cero'
      using errcode = '22023';
  end if;

  if p_type not in (
    'debt_payment',
    'positive_adjustment',
    'negative_adjustment',
    'compensation'
  ) then
    raise exception 'El tipo de movimiento no es manual'
      using errcode = '22023';
  end if;

  perform id
  from public.subagents
  where id = p_subagent_id
  for update;

  if not found then
    raise exception 'El Subagente no existe' using errcode = 'P0002';
  end if;

  select coalesce(
    sum(
      case direction
        when 'debit' then amount
        else -amount
      end
    ),
    0
  )
  into current_balance
  from public.subagent_account_movements
  where subagent_id = p_subagent_id
    and voided_at is null;

  movement_direction := case
    when p_type = 'positive_adjustment'
      then 'debit'::public.account_movement_direction
    else 'credit'::public.account_movement_direction
  end;

  if movement_direction = 'credit' and p_amount > current_balance then
    raise exception 'El importe supera la deuda vigente'
      using errcode = '22023';
  end if;

  if p_type in (
    'positive_adjustment',
    'negative_adjustment',
    'compensation'
  ) and nullif(trim(p_notes), '') is null then
    raise exception 'El ajuste o compensación requiere una nota'
      using errcode = '22023';
  end if;

  if p_type = 'debt_payment' then
    if not exists (
      select 1
      from public.cash_accounts
      where id = p_cash_account_id
        and status = 'active'
    ) then
      raise exception 'Seleccioná una cuenta de Caja activa'
        using errcode = '22023';
    end if;

    select id
    into category_id
    from public.cash_categories
    where name = 'Cobro de deuda de subagente'
      and type = 'income'
      and status = 'active'
    limit 1;

    if category_id is null then
      raise exception 'Falta la categoría de cobro de deuda'
        using errcode = '55000';
    end if;
  end if;

  insert into public.business_days (
    date,
    is_working_day,
    opened_at,
    opened_by
  )
  values (p_business_date, true, now(), actor_id)
  on conflict (date) do nothing;

  select id
  into business_day_id
  from public.business_days
  where date = p_business_date;

  insert into public.subagent_account_movements (
    subagent_id,
    business_day_id,
    type,
    direction,
    amount,
    notes,
    created_by
  )
  values (
    p_subagent_id,
    business_day_id,
    p_type,
    movement_direction,
    p_amount,
    nullif(trim(p_notes), ''),
    actor_id
  )
  returning id into account_movement_id;

  if p_type = 'debt_payment' then
    insert into public.cash_movements (
      business_day_id,
      cash_account_id,
      type,
      direction,
      category_id,
      amount,
      description,
      related_subagent_account_movement_id,
      created_by,
      updated_by
    )
    values (
      business_day_id,
      p_cash_account_id,
      'income',
      'in',
      category_id,
      p_amount,
      'Cobro de deuda de Subagente',
      account_movement_id,
      actor_id,
      actor_id
    )
    returning id into cash_movement_id;

    update public.subagent_account_movements
    set related_cash_movement_id = cash_movement_id
    where id = account_movement_id;
  end if;

  insert into public.audit_logs (
    user_id,
    entity_type,
    entity_id,
    action,
    new_values
  )
  select
    actor_id,
    'subagent_account_movement',
    movement.id,
    'create_subagent_account_movement',
    to_jsonb(movement)
  from public.subagent_account_movements as movement
  where movement.id = account_movement_id;

  return account_movement_id;
end;
$$;

revoke all on function public.create_subagent_account_movement(
  date, uuid, public.account_movement_type, numeric, uuid, text
) from public;
revoke all on function public.create_subagent_account_movement(
  date, uuid, public.account_movement_type, numeric, uuid, text
) from anon;
grant execute on function public.create_subagent_account_movement(
  date, uuid, public.account_movement_type, numeric, uuid, text
) to authenticated;

create or replace function public.void_subagent_account_movement(
  p_movement_id uuid,
  p_reason text
)
returns void
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  selected_movement public.subagent_account_movements;
  current_balance numeric;
begin
  if actor_id is null or not (select public.is_owner_admin()) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if nullif(trim(p_reason), '') is null then
    raise exception 'El motivo es obligatorio' using errcode = '22023';
  end if;

  select *
  into selected_movement
  from public.subagent_account_movements
  where id = p_movement_id
  for update;

  if selected_movement.id is null then
    raise exception 'El movimiento no existe' using errcode = 'P0002';
  end if;

  if selected_movement.related_settlement_id is not null then
    raise exception 'La deuda debe anularse desde su rendición'
      using errcode = '22023';
  end if;

  if selected_movement.voided_at is not null then
    raise exception 'El movimiento ya está anulado'
      using errcode = '22023';
  end if;

  perform id
  from public.subagents
  where id = selected_movement.subagent_id
  for update;

  select coalesce(
    sum(
      case direction
        when 'debit' then amount
        else -amount
      end
    ),
    0
  )
  into current_balance
  from public.subagent_account_movements
  where subagent_id = selected_movement.subagent_id
    and voided_at is null;

  if selected_movement.direction = 'debit'
    and current_balance - selected_movement.amount < 0 then
    raise exception 'No se puede anular: generaría saldo a favor'
      using errcode = '22023';
  end if;

  update public.subagent_account_movements
  set
    voided_at = now(),
    voided_by = actor_id,
    void_reason = trim(p_reason)
  where id = p_movement_id;

  update public.cash_movements
  set
    voided_at = now(),
    voided_by = actor_id,
    void_reason = trim(p_reason),
    updated_by = actor_id
  where id = selected_movement.related_cash_movement_id
    and voided_at is null;

  insert into public.audit_logs (
    user_id,
    entity_type,
    entity_id,
    action,
    old_values,
    reason
  )
  values (
    actor_id,
    'subagent_account_movement',
    selected_movement.id,
    'void_subagent_account_movement',
    to_jsonb(selected_movement),
    trim(p_reason)
  );
end;
$$;

revoke all on function public.void_subagent_account_movement(uuid, text)
  from public;
revoke all on function public.void_subagent_account_movement(uuid, text)
  from anon;
grant execute on function public.void_subagent_account_movement(uuid, text)
  to authenticated;
