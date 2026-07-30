alter table public.cash_movements
  add column transfer_group_id uuid;

create index cash_movements_active_account_created_idx
  on public.cash_movements (cash_account_id, created_at desc)
  where voided_at is null;

create index cash_movements_transfer_group_idx
  on public.cash_movements (transfer_group_id)
  where transfer_group_id is not null;

create or replace function public.get_cash_summary()
returns table (
  cash_balance numeric,
  bank_balance numeric,
  total_balance numeric,
  operating_income numeric,
  operating_expense numeric,
  operating_profit numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  with movement_totals as (
    select
      account.type as account_type,
      coalesce(
        sum(
          case movement.direction
            when 'in' then movement.amount
            else -movement.amount
          end
        ),
        0
      ) as balance
    from public.cash_accounts as account
    left join public.cash_movements as movement
      on movement.cash_account_id = account.id
      and movement.voided_at is null
    where account.status = 'active'
    group by account.type
  ),
  operation_totals as (
    select
      coalesce(
        sum(movement.amount) filter (
          where movement.type = 'income'
            and movement.direction = 'in'
        ),
        0
      ) as income,
      coalesce(
        sum(movement.amount) filter (
          where movement.type = 'expense'
            and movement.direction = 'out'
        ),
        0
      ) as expense
    from public.cash_movements as movement
    where movement.voided_at is null
  )
  select
    coalesce(
      (select balance from movement_totals where account_type = 'cash'),
      0
    ) as cash_balance,
    coalesce(
      (select balance from movement_totals where account_type = 'bank'),
      0
    ) as bank_balance,
    coalesce((select sum(balance) from movement_totals), 0) as total_balance,
    operation_totals.income as operating_income,
    operation_totals.expense as operating_expense,
    operation_totals.income - operation_totals.expense as operating_profit
  from operation_totals;
$$;

revoke all on function public.get_cash_summary() from public;
revoke all on function public.get_cash_summary() from anon;
grant execute on function public.get_cash_summary() to authenticated;

create or replace function public.create_manual_cash_movement(
  p_business_date date,
  p_type public.cash_movement_type,
  p_cash_account_id uuid,
  p_category_id uuid,
  p_amount numeric,
  p_direction public.cash_movement_direction,
  p_owner_name text default null,
  p_description text default null,
  p_note text default null
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
  movement_id uuid;
  destination_account_id uuid;
  transfer_id uuid;
  current_balance numeric;
  category_type public.cash_category_type;
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

  if not exists (
    select 1
    from public.cash_accounts
    where id = p_cash_account_id
      and status = 'active'
  ) then
    raise exception 'La cuenta de caja no existe o está inactiva'
      using errcode = '22023';
  end if;

  if p_type = 'transfer' then
    select id
    into destination_account_id
    from public.cash_accounts
    where id <> p_cash_account_id
      and status = 'active'
      and type in ('cash', 'bank')
    order by id
    limit 1;

    if destination_account_id is null then
      raise exception 'No existe una cuenta destino activa'
        using errcode = '55000';
    end if;

    perform id
    from public.cash_accounts
    where id in (p_cash_account_id, destination_account_id)
    order by id
    for update;
  else
    perform id
    from public.cash_accounts
    where id = p_cash_account_id
    for update;
  end if;

  select coalesce(
    sum(
      case direction
        when 'in' then amount
        else -amount
      end
    ),
    0
  )
  into current_balance
  from public.cash_movements
  where cash_account_id = p_cash_account_id
    and voided_at is null;

  if (p_type = 'transfer' or p_direction = 'out')
    and current_balance < p_amount then
    raise exception 'El saldo de la cuenta es insuficiente'
      using errcode = '22023';
  end if;

  if p_type <> 'transfer' then
    select type
    into category_type
    from public.cash_categories
    where id = p_category_id
      and status = 'active';

    if category_type is null then
      raise exception 'Seleccioná una categoría activa'
        using errcode = '22023';
    end if;
  end if;

  if p_type = 'income'
    and (p_direction <> 'in' or category_type <> 'income') then
    raise exception 'El ingreso requiere dirección de entrada y categoría de ingreso'
      using errcode = '22023';
  end if;

  if p_type = 'expense'
    and (p_direction <> 'out' or category_type <> 'expense') then
    raise exception 'El egreso requiere dirección de salida y categoría de egreso'
      using errcode = '22023';
  end if;

  if p_type = 'withdrawal' then
    if p_direction <> 'out'
      or category_type <> 'withdrawal'
      or p_owner_name not in ('Juliana', 'Gerónimo', 'Agustina') then
      raise exception 'El retiro requiere categoría y dueño válidos'
        using errcode = '22023';
    end if;
  end if;

  if p_type = 'adjustment'
    and (
      category_type <> 'adjustment'
      or nullif(trim(p_note), '') is null
    ) then
    raise exception 'El ajuste requiere categoría y nota'
      using errcode = '22023';
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

  if p_type = 'transfer' then
    transfer_id := gen_random_uuid();

    insert into public.cash_movements (
      business_day_id,
      cash_account_id,
      type,
      direction,
      amount,
      description,
      note,
      transfer_group_id,
      created_by,
      updated_by
    )
    values (
      business_day_id,
      p_cash_account_id,
      'transfer',
      'out',
      p_amount,
      coalesce(nullif(trim(p_description), ''), 'Transferencia interna'),
      nullif(trim(p_note), ''),
      transfer_id,
      actor_id,
      actor_id
    )
    returning id into movement_id;

    insert into public.cash_movements (
      business_day_id,
      cash_account_id,
      type,
      direction,
      amount,
      description,
      note,
      transfer_group_id,
      created_by,
      updated_by
    )
    values (
      business_day_id,
      destination_account_id,
      'transfer',
      'in',
      p_amount,
      coalesce(nullif(trim(p_description), ''), 'Transferencia interna'),
      nullif(trim(p_note), ''),
      transfer_id,
      actor_id,
      actor_id
    );
  else
    insert into public.cash_movements (
      business_day_id,
      cash_account_id,
      type,
      direction,
      category_id,
      amount,
      owner_name,
      description,
      note,
      created_by,
      updated_by
    )
    values (
      business_day_id,
      p_cash_account_id,
      p_type,
      p_direction,
      p_category_id,
      p_amount,
      case when p_type = 'withdrawal' then p_owner_name else null end,
      nullif(trim(p_description), ''),
      nullif(trim(p_note), ''),
      actor_id,
      actor_id
    )
    returning id into movement_id;
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
    'cash_movement',
    movement.id,
    'create_cash_movement',
    to_jsonb(movement)
  from public.cash_movements as movement
  where movement.id = movement_id;

  return movement_id;
end;
$$;

revoke all on function public.create_manual_cash_movement(
  date, public.cash_movement_type, uuid, uuid, numeric,
  public.cash_movement_direction, text, text, text
) from public;
revoke all on function public.create_manual_cash_movement(
  date, public.cash_movement_type, uuid, uuid, numeric,
  public.cash_movement_direction, text, text, text
) from anon;
grant execute on function public.create_manual_cash_movement(
  date, public.cash_movement_type, uuid, uuid, numeric,
  public.cash_movement_direction, text, text, text
) to authenticated;

create or replace function public.void_manual_cash_movement(
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
  selected_movement public.cash_movements;
begin
  if actor_id is null or not (select public.is_owner_admin()) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if nullif(trim(p_reason), '') is null then
    raise exception 'El motivo de anulación es obligatorio'
      using errcode = '22023';
  end if;

  select *
  into selected_movement
  from public.cash_movements
  where id = p_movement_id
  for update;

  if selected_movement.id is null then
    raise exception 'El movimiento no existe' using errcode = 'P0002';
  end if;

  if selected_movement.related_settlement_id is not null then
    raise exception 'Este movimiento debe anularse desde su rendición'
      using errcode = '22023';
  end if;

  if selected_movement.voided_at is not null then
    raise exception 'El movimiento ya está anulado'
      using errcode = '22023';
  end if;

  update public.cash_movements
  set
    voided_at = now(),
    voided_by = actor_id,
    void_reason = trim(p_reason),
    updated_by = actor_id
  where
    (
      selected_movement.transfer_group_id is null
      and id = selected_movement.id
    )
    or (
      selected_movement.transfer_group_id is not null
      and transfer_group_id = selected_movement.transfer_group_id
    );

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
    'cash_movement',
    selected_movement.id,
    'void_cash_movement',
    to_jsonb(selected_movement),
    trim(p_reason)
  );
end;
$$;

revoke all on function public.void_manual_cash_movement(uuid, text)
  from public;
revoke all on function public.void_manual_cash_movement(uuid, text)
  from anon;
grant execute on function public.void_manual_cash_movement(uuid, text)
  to authenticated;
