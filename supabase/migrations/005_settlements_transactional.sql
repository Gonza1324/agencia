alter table public.settlement_payments
  add column voided_at timestamptz,
  add column voided_by uuid references public.profiles(id),
  add column void_reason text,
  add constraint settlement_payments_void_reason_required
    check (voided_at is null or nullif(trim(void_reason), '') is not null);

create index settlement_payments_active_settlement_idx
  on public.settlement_payments (settlement_id)
  where voided_at is null;

create or replace function public.create_daily_settlement(
  p_settlement_date date,
  p_subagent_id uuid,
  p_cash_amount numeric,
  p_bank_amount numeric,
  p_sales_amount numeric default null,
  p_commission_amount numeric default null,
  p_prizes_paid_amount numeric default null,
  p_expected_amount numeric default null,
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
  settlement_id uuid;
  cash_account_id uuid;
  bank_account_id uuid;
  income_category_id uuid;
  received_amount numeric := p_cash_amount + p_bank_amount;
  debt_amount numeric :=
    case
      when p_expected_amount is null then 0
      else greatest(p_expected_amount - (p_cash_amount + p_bank_amount), 0)
    end;
  settlement_status public.settlement_status :=
    case
      when p_expected_amount is not null
        and p_expected_amount > (p_cash_amount + p_bank_amount)
        then 'settled_with_debt'::public.settlement_status
      else 'settled'::public.settlement_status
    end;
begin
  if actor_id is null or not (select public.is_owner_admin()) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if extract(isodow from p_settlement_date) = 7 then
    raise exception 'El domingo no es un día operativo'
      using errcode = '22023';
  end if;

  if p_cash_amount < 0 or p_bank_amount < 0 or received_amount <= 0 then
    raise exception 'Los importes de pago son inválidos'
      using errcode = '22023';
  end if;

  if p_expected_amount is not null and received_amount > p_expected_amount then
    raise exception 'El importe recibido no puede superar el importe esperado'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.subagents
    where id = p_subagent_id
      and status = 'active'
  ) then
    raise exception 'El Subagente no existe o está inactivo'
      using errcode = '22023';
  end if;

  insert into public.business_days (
    date,
    is_working_day,
    opened_at,
    opened_by
  )
  values (
    p_settlement_date,
    true,
    now(),
    actor_id
  )
  on conflict (date) do nothing;

  select id
  into business_day_id
  from public.business_days
  where date = p_settlement_date;

  select id
  into cash_account_id
  from public.cash_accounts
  where type = 'cash'
    and status = 'active'
  order by created_at
  limit 1;

  select id
  into bank_account_id
  from public.cash_accounts
  where type = 'bank'
    and status = 'active'
  order by created_at
  limit 1;

  select id
  into income_category_id
  from public.cash_categories
  where name = 'Rendición de subagente'
    and type = 'income'
    and status = 'active'
  limit 1;

  if cash_account_id is null
    or bank_account_id is null
    or income_category_id is null then
    raise exception 'Falta configuración de caja para registrar la rendición'
      using errcode = '55000';
  end if;

  insert into public.daily_settlements (
    business_day_id,
    settlement_date,
    subagent_id,
    status,
    sales_amount,
    commission_amount,
    prizes_paid_amount,
    expected_amount,
    received_amount,
    debt_amount,
    notes,
    created_by,
    updated_by
  )
  values (
    business_day_id,
    p_settlement_date,
    p_subagent_id,
    settlement_status,
    p_sales_amount,
    p_commission_amount,
    p_prizes_paid_amount,
    p_expected_amount,
    received_amount,
    debt_amount,
    nullif(trim(p_notes), ''),
    actor_id,
    actor_id
  )
  returning id into settlement_id;

  if p_cash_amount > 0 then
    insert into public.settlement_payments (
      settlement_id,
      method,
      amount,
      cash_account_id,
      created_by
    )
    values (
      settlement_id,
      'cash',
      p_cash_amount,
      cash_account_id,
      actor_id
    );

    insert into public.cash_movements (
      business_day_id,
      cash_account_id,
      type,
      direction,
      category_id,
      amount,
      description,
      related_settlement_id,
      created_by,
      updated_by
    )
    values (
      business_day_id,
      cash_account_id,
      'income',
      'in',
      income_category_id,
      p_cash_amount,
      'Rendición de Subagente',
      settlement_id,
      actor_id,
      actor_id
    );
  end if;

  if p_bank_amount > 0 then
    insert into public.settlement_payments (
      settlement_id,
      method,
      amount,
      cash_account_id,
      created_by
    )
    values (
      settlement_id,
      'bank_transfer',
      p_bank_amount,
      bank_account_id,
      actor_id
    );

    insert into public.cash_movements (
      business_day_id,
      cash_account_id,
      type,
      direction,
      category_id,
      amount,
      description,
      related_settlement_id,
      created_by,
      updated_by
    )
    values (
      business_day_id,
      bank_account_id,
      'income',
      'in',
      income_category_id,
      p_bank_amount,
      'Rendición de Subagente',
      settlement_id,
      actor_id,
      actor_id
    );
  end if;

  if debt_amount > 0 then
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
      p_subagent_id,
      business_day_id,
      'settlement_debt',
      'debit',
      debt_amount,
      settlement_id,
      'Deuda generada por rendición incompleta',
      actor_id
    );
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
    'daily_settlement',
    settlement.id,
    'create_settlement',
    to_jsonb(settlement)
  from public.daily_settlements as settlement
  where settlement.id = settlement_id;

  return settlement_id;
end;
$$;

revoke all on function public.create_daily_settlement(
  date, uuid, numeric, numeric, numeric, numeric, numeric, numeric, text
) from public;
revoke all on function public.create_daily_settlement(
  date, uuid, numeric, numeric, numeric, numeric, numeric, numeric, text
) from anon;
grant execute on function public.create_daily_settlement(
  date, uuid, numeric, numeric, numeric, numeric, numeric, numeric, text
) to authenticated;

create or replace function public.void_daily_settlement(
  p_settlement_id uuid,
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
  previous_settlement public.daily_settlements;
  updated_settlement public.daily_settlements;
begin
  if actor_id is null or not (select public.is_owner_admin()) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if nullif(trim(p_reason), '') is null then
    raise exception 'El motivo de anulación es obligatorio'
      using errcode = '22023';
  end if;

  select *
  into previous_settlement
  from public.daily_settlements
  where id = p_settlement_id
  for update;

  if previous_settlement.id is null then
    raise exception 'La rendición no existe' using errcode = 'P0002';
  end if;

  if previous_settlement.voided_at is not null then
    raise exception 'La rendición ya está anulada' using errcode = '22023';
  end if;

  update public.daily_settlements
  set
    status = 'voided',
    voided_at = now(),
    voided_by = actor_id,
    void_reason = trim(p_reason),
    updated_by = actor_id
  where id = p_settlement_id
  returning * into updated_settlement;

  update public.settlement_payments
  set
    voided_at = now(),
    voided_by = actor_id,
    void_reason = trim(p_reason)
  where settlement_id = p_settlement_id
    and voided_at is null;

  update public.cash_movements
  set
    voided_at = now(),
    voided_by = actor_id,
    void_reason = trim(p_reason),
    updated_by = actor_id
  where related_settlement_id = p_settlement_id
    and voided_at is null;

  update public.subagent_account_movements
  set
    voided_at = now(),
    voided_by = actor_id,
    void_reason = trim(p_reason)
  where related_settlement_id = p_settlement_id
    and voided_at is null;

  insert into public.audit_logs (
    user_id,
    entity_type,
    entity_id,
    action,
    old_values,
    new_values,
    reason
  )
  values (
    actor_id,
    'daily_settlement',
    p_settlement_id,
    'void_settlement',
    to_jsonb(previous_settlement),
    to_jsonb(updated_settlement),
    trim(p_reason)
  );
end;
$$;

revoke all on function public.void_daily_settlement(uuid, text) from public;
revoke all on function public.void_daily_settlement(uuid, text) from anon;
grant execute on function public.void_daily_settlement(uuid, text)
  to authenticated;

create or replace function public.replace_daily_settlement(
  p_previous_settlement_id uuid,
  p_settlement_date date,
  p_subagent_id uuid,
  p_cash_amount numeric,
  p_bank_amount numeric,
  p_sales_amount numeric default null,
  p_commission_amount numeric default null,
  p_prizes_paid_amount numeric default null,
  p_expected_amount numeric default null,
  p_notes text default null
)
returns uuid
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  replacement_id uuid;
begin
  perform public.void_daily_settlement(
    p_previous_settlement_id,
    'Reemplazada por una edición'
  );

  replacement_id := public.create_daily_settlement(
    p_settlement_date,
    p_subagent_id,
    p_cash_amount,
    p_bank_amount,
    p_sales_amount,
    p_commission_amount,
    p_prizes_paid_amount,
    p_expected_amount,
    p_notes
  );

  insert into public.audit_logs (
    user_id,
    entity_type,
    entity_id,
    action,
    new_values
  )
  values (
    (select auth.uid()),
    'daily_settlement',
    replacement_id,
    'replace_settlement',
    jsonb_build_object(
      'previous_settlement_id',
      p_previous_settlement_id,
      'replacement_settlement_id',
      replacement_id
    )
  );

  return replacement_id;
end;
$$;

revoke all on function public.replace_daily_settlement(
  uuid, date, uuid, numeric, numeric, numeric, numeric, numeric, numeric, text
) from public;
revoke all on function public.replace_daily_settlement(
  uuid, date, uuid, numeric, numeric, numeric, numeric, numeric, numeric, text
) from anon;
grant execute on function public.replace_daily_settlement(
  uuid, date, uuid, numeric, numeric, numeric, numeric, numeric, numeric, text
) to authenticated;
