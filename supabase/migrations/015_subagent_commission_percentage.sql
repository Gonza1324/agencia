alter table public.subagents
  add column commission_percentage numeric(5, 2) not null default 10,
  add constraint subagents_commission_percentage_range
    check (
      commission_percentage >= 0
      and commission_percentage <= 100
    );

comment on column public.subagents.commission_percentage is
  'Porcentaje vigente de comisión aplicado sobre la venta del subagente.';

alter table public.daily_settlements
  add column commission_percentage numeric(5, 2),
  add constraint daily_settlements_commission_percentage_range
    check (
      commission_percentage is null
      or (
        commission_percentage >= 0
        and commission_percentage <= 100
      )
    );

comment on column public.daily_settlements.commission_percentage is
  'Porcentaje de comisión aplicado al cierre, conservado como dato histórico.';

update public.daily_settlements
set commission_percentage = case
  when sales_amount > 0 and commission_amount is not null
    then least(round(commission_amount * 100 / sales_amount, 2), 100)
  when sales_amount = 0 and commission_amount = 0
    then 0
  else null
end
where commission_percentage is null;

create or replace function public.calculate_daily_settlement_amounts()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  applied_percentage numeric(5, 2);
begin
  if new.sales_amount is null then
    new.commission_percentage := null;
    new.commission_amount := null;
    new.expected_amount := null;
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
  new.expected_amount := greatest(
    round(
      new.sales_amount
        - new.commission_amount
        - coalesce(new.prizes_paid_amount, 0),
      2
    ),
    0
  );

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

revoke all on function public.calculate_daily_settlement_amounts()
  from public, anon, authenticated;

create trigger daily_settlements_calculate_amounts
before insert on public.daily_settlements
for each row execute function public.calculate_daily_settlement_amounts();
