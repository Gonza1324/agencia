create or replace function public.guard_open_business_day()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_business_day_id uuid;
  target_status public.business_day_status;
begin
  target_business_day_id := case
    when tg_op = 'DELETE' then old.business_day_id
    else new.business_day_id
  end;

  select status
  into target_status
  from public.business_days
  where id = target_business_day_id
  for update;

  if target_status = 'closed' then
    raise exception 'El día operativo está cerrado'
      using errcode = '55000';
  end if;

  if tg_op = 'UPDATE'
    and old.business_day_id is distinct from new.business_day_id then
    select status
    into target_status
    from public.business_days
    where id = old.business_day_id
    for update;

    if target_status = 'closed' then
      raise exception 'El día operativo de origen está cerrado'
        using errcode = '55000';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all on function public.guard_open_business_day() from public;
revoke all on function public.guard_open_business_day() from anon;
revoke all on function public.guard_open_business_day() from authenticated;

create trigger daily_settlements_require_open_day
before insert or update or delete on public.daily_settlements
for each row execute function public.guard_open_business_day();

create trigger cash_movements_require_open_day
before insert or update or delete on public.cash_movements
for each row execute function public.guard_open_business_day();

create trigger subagent_account_movements_require_open_day
before insert or update or delete on public.subagent_account_movements
for each row execute function public.guard_open_business_day();

create or replace function public.get_daily_closure_summary(
  p_business_date date
)
returns table (
  business_day_id uuid,
  business_day_status public.business_day_status,
  expected_cash_amount numeric,
  expected_bank_amount numeric,
  total_income numeric,
  total_expense numeric,
  total_withdrawals numeric,
  total_available numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  with selected_day as (
    select day.id, day.status
    from public.business_days as day
    where day.date = p_business_date
  ),
  account_balances as (
    select
      account.type,
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
      and exists (
        select 1
        from public.business_days as movement_day
        where movement_day.id = movement.business_day_id
          and movement_day.date <= p_business_date
      )
    group by account.type
  ),
  day_totals as (
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
      ) as expense,
      coalesce(
        sum(movement.amount) filter (
          where movement.type = 'withdrawal'
            and movement.direction = 'out'
        ),
        0
      ) as withdrawals
    from public.cash_movements as movement
    join public.business_days as movement_day
      on movement_day.id = movement.business_day_id
    where movement_day.date = p_business_date
      and movement.voided_at is null
  )
  select
    selected_day.id,
    selected_day.status,
    coalesce(
      (select balance from account_balances where type = 'cash'),
      0
    ),
    coalesce(
      (select balance from account_balances where type = 'bank'),
      0
    ),
    day_totals.income,
    day_totals.expense,
    day_totals.withdrawals,
    coalesce((select sum(balance) from account_balances), 0)
  from day_totals
  left join selected_day on true;
$$;

revoke all on function public.get_daily_closure_summary(date) from public;
revoke all on function public.get_daily_closure_summary(date) from anon;
grant execute on function public.get_daily_closure_summary(date)
  to authenticated;

create or replace function public.close_business_day(
  p_business_date date,
  p_counted_cash_amount numeric,
  p_reported_bank_amount numeric,
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
  selected_business_day_id uuid;
  closure_id uuid;
  existing_status public.business_day_status;
  expected_cash numeric;
  expected_bank numeric;
  day_income numeric;
  day_expense numeric;
  day_withdrawals numeric;
  available numeric;
  cash_difference numeric;
  bank_difference numeric;
  current_argentina_date date :=
    (now() at time zone 'America/Argentina/Buenos_Aires')::date;
begin
  if actor_id is null or not (select public.is_owner_admin()) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if p_business_date > current_argentina_date then
    raise exception 'No se puede cerrar una fecha futura'
      using errcode = '22023';
  end if;

  if extract(isodow from p_business_date) = 7 then
    raise exception 'El domingo no es un día operativo'
      using errcode = '22023';
  end if;

  if p_counted_cash_amount is null or p_counted_cash_amount < 0
    or p_reported_bank_amount is null or p_reported_bank_amount < 0 then
    raise exception 'Los importes informados no pueden ser negativos'
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

  select id, status
  into selected_business_day_id, existing_status
  from public.business_days
  where date = p_business_date
  for update;

  if existing_status = 'closed' then
    raise exception 'El día operativo ya está cerrado'
      using errcode = '55000';
  end if;

  select
    summary.expected_cash_amount,
    summary.expected_bank_amount,
    summary.total_income,
    summary.total_expense,
    summary.total_withdrawals,
    summary.total_available
  into
    expected_cash,
    expected_bank,
    day_income,
    day_expense,
    day_withdrawals,
    available
  from public.get_daily_closure_summary(p_business_date) as summary;

  cash_difference := p_counted_cash_amount - expected_cash;
  bank_difference := p_reported_bank_amount - expected_bank;

  if (cash_difference <> 0 or bank_difference <> 0)
    and nullif(trim(p_note), '') is null then
    raise exception 'Las diferencias requieren una nota'
      using errcode = '22023';
  end if;

  insert into public.cash_closures (
    business_day_id,
    expected_cash_amount,
    counted_cash_amount,
    cash_difference,
    expected_bank_amount,
    reported_bank_amount,
    bank_difference,
    total_income,
    total_expense,
    total_withdrawals,
    total_available,
    note,
    status,
    closed_by,
    closed_at
  )
  values (
    selected_business_day_id,
    expected_cash,
    p_counted_cash_amount,
    cash_difference,
    expected_bank,
    p_reported_bank_amount,
    bank_difference,
    day_income,
    day_expense,
    day_withdrawals,
    available,
    nullif(trim(p_note), ''),
    'closed',
    actor_id,
    now()
  )
  on conflict (business_day_id) do update
  set
    expected_cash_amount = excluded.expected_cash_amount,
    counted_cash_amount = excluded.counted_cash_amount,
    cash_difference = excluded.cash_difference,
    expected_bank_amount = excluded.expected_bank_amount,
    reported_bank_amount = excluded.reported_bank_amount,
    bank_difference = excluded.bank_difference,
    total_income = excluded.total_income,
    total_expense = excluded.total_expense,
    total_withdrawals = excluded.total_withdrawals,
    total_available = excluded.total_available,
    note = excluded.note,
    status = 'closed',
    closed_by = actor_id,
    closed_at = now()
  returning id into closure_id;

  update public.business_days
  set
    status = 'closed',
    closed_at = now(),
    closed_by = actor_id
  where id = selected_business_day_id;

  insert into public.audit_logs (
    user_id,
    entity_type,
    entity_id,
    action,
    new_values
  )
  select
    actor_id,
    'cash_closure',
    closure.id,
    'close_business_day',
    to_jsonb(closure)
  from public.cash_closures as closure
  where closure.id = closure_id;

  return closure_id;
end;
$$;

revoke all on function public.close_business_day(date, numeric, numeric, text)
  from public;
revoke all on function public.close_business_day(date, numeric, numeric, text)
  from anon;
grant execute on function public.close_business_day(
  date, numeric, numeric, text
) to authenticated;

create or replace function public.reopen_business_day(
  p_business_date date,
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
  selected_business_day_id uuid;
  closure_id uuid;
  existing_status public.business_day_status;
begin
  if actor_id is null or not (select public.is_owner_admin()) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if nullif(trim(p_reason), '') is null then
    raise exception 'La reapertura requiere un motivo'
      using errcode = '22023';
  end if;

  select day.id, day.status
  into selected_business_day_id, existing_status
  from public.business_days as day
  where day.date = p_business_date
  for update;

  if selected_business_day_id is null or existing_status <> 'closed' then
    raise exception 'El día no está cerrado'
      using errcode = '55000';
  end if;

  update public.cash_closures
  set
    status = 'reopened',
    reopened_by = actor_id,
    reopened_at = now(),
    reopen_reason = trim(p_reason)
  where business_day_id = selected_business_day_id
  returning id into closure_id;

  if closure_id is null then
    raise exception 'No existe el cierre del día'
      using errcode = 'P0002';
  end if;

  update public.business_days
  set
    status = 'reopened',
    reopened_by = actor_id,
    reopened_at = now(),
    reopen_reason = trim(p_reason)
  where id = selected_business_day_id;

  insert into public.audit_logs (
    user_id,
    entity_type,
    entity_id,
    action,
    old_values,
    new_values,
    reason
  )
  select
    actor_id,
    'cash_closure',
    closure.id,
    'reopen_business_day',
    null,
    to_jsonb(closure),
    trim(p_reason)
  from public.cash_closures as closure
  where closure.id = closure_id;

  return closure_id;
end;
$$;

revoke all on function public.reopen_business_day(date, text) from public;
revoke all on function public.reopen_business_day(date, text) from anon;
grant execute on function public.reopen_business_day(date, text)
  to authenticated;
