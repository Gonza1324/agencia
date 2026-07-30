alter table public.daily_settlements
  add column credit_balance_amount numeric(14, 2) not null default 0,
  add constraint daily_settlements_credit_balance_amount_nonnegative
    check (credit_balance_amount >= 0);

comment on column public.daily_settlements.credit_balance_amount is
  'Saldo a favor generado cuando premios y comisión superan la venta.';

create or replace function public.calculate_daily_settlement_amounts()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  applied_percentage numeric(5, 2);
  net_amount numeric(14, 2);
begin
  if new.sales_amount is null then
    new.commission_percentage := null;
    new.commission_amount := null;
    new.expected_amount := null;
    new.credit_balance_amount := 0;
    new.debt_amount := 0;
    new.status := 'settled'::public.settlement_status;
    return new;
  end if;

  select subagent.commission_percentage
  into applied_percentage
  from public.subagents as subagent
  where subagent.id = new.subagent_id
    and subagent.status = 'active';

  if applied_percentage is null then
    raise exception 'El Subagente no existe o está inactivo'
      using errcode = '22023';
  end if;

  new.commission_percentage := applied_percentage;
  new.commission_amount :=
    round(new.sales_amount * applied_percentage / 100, 2);
  net_amount := round(
    new.sales_amount
      - new.commission_amount
      - coalesce(new.prizes_paid_amount, 0),
    2
  );
  new.expected_amount := greatest(net_amount, 0);
  new.credit_balance_amount := greatest(-net_amount, 0);

  if new.received_amount > new.expected_amount then
    raise exception 'El importe recibido no puede superar el importe esperado'
      using errcode = '22023';
  end if;

  new.debt_amount := greatest(
    new.expected_amount - new.received_amount,
    0
  );
  new.status := case
    when new.debt_amount > 0
      then 'settled_with_debt'::public.settlement_status
    else 'settled'::public.settlement_status
  end;

  return new;
end;
$$;

create or replace function public.create_prize_credit_account_movement()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.credit_balance_amount <= 0 then
    return new;
  end if;

  insert into public.subagent_account_movements (
    subagent_id,
    business_day_id,
    type,
    direction,
    amount,
    related_settlement_id,
    notes,
    created_by
  )
  values (
    new.subagent_id,
    new.business_day_id,
    'prize_credit',
    'credit',
    new.credit_balance_amount,
    new.id,
    'Saldo a favor por premios y comisión superiores a la venta',
    new.created_by
  );

  return new;
end;
$$;

revoke all on function public.create_prize_credit_account_movement()
  from public, anon, authenticated;

create trigger daily_settlements_create_prize_credit
after insert on public.daily_settlements
for each row execute function public.create_prize_credit_account_movement();

do $migration$
declare
  current_definition text;
  corrected_definition text;
begin
  select pg_get_functiondef(
    'public.create_daily_settlement(date, uuid, numeric, numeric, numeric, numeric, numeric, numeric, text)'::regprocedure
  )
  into current_definition;

  corrected_definition := replace(
    current_definition,
    'if p_cash_amount < 0 or p_bank_amount < 0 or received_amount <= 0 then',
    'if p_cash_amount < 0 or p_bank_amount < 0
    or (received_amount = 0 and coalesce(p_expected_amount, -1) <> 0) then'
  );

  if corrected_definition = current_definition then
    raise exception 'No se encontró la validación de pagos a actualizar';
  end if;

  execute corrected_definition;
end;
$migration$;
