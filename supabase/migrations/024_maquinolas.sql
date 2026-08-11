alter table public.subagents
  add column maquinola_overdue_alerts_enabled boolean not null default true,
  add column maquinola_overdue_min_days smallint not null default 1,
  add constraint subagents_maquinola_overdue_min_days_range
    check (maquinola_overdue_min_days between 1 and 30);

create table public.maquinolas (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  subagent_id uuid not null references public.subagents(id),
  status public.record_status not null default 'active',
  assigned_at date not null default timezone('America/Argentina/Buenos_Aires', now())::date,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint maquinolas_number_not_blank check (nullif(trim(number), '') is not null)
);

create index maquinolas_subagent_status_idx
  on public.maquinolas (subagent_id, status);

create table public.maquinola_settlements (
  id uuid primary key default gen_random_uuid(),
  business_day_id uuid not null references public.business_days(id),
  maquinola_id uuid not null references public.maquinolas(id),
  subagent_id uuid not null references public.subagents(id),
  settlement_date date not null,
  status public.settlement_status not null default 'settled',
  sales_amount numeric(14, 2) not null check (sales_amount >= 0),
  prizes_paid_amount numeric(14, 2) not null check (prizes_paid_amount >= 0),
  expected_amount numeric(14, 2) not null check (expected_amount >= 0),
  received_amount numeric(14, 2) not null check (received_amount >= 0),
  debt_amount numeric(14, 2) not null default 0 check (debt_amount >= 0),
  prize_credit_amount numeric(14, 2) not null default 0 check (prize_credit_amount >= 0),
  overpayment_credit_amount numeric(14, 2) not null default 0 check (overpayment_credit_amount >= 0),
  notes text,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  voided_at timestamptz,
  voided_by uuid references public.profiles(id),
  void_reason text,
  constraint maquinola_settlements_void_reason_required
    check (voided_at is null or nullif(trim(void_reason), '') is not null)
);

create unique index maquinola_settlements_unit_date_active_uidx
  on public.maquinola_settlements (maquinola_id, settlement_date)
  where voided_at is null;
create index maquinola_settlements_business_day_idx
  on public.maquinola_settlements (business_day_id);
create index maquinola_settlements_subagent_date_idx
  on public.maquinola_settlements (subagent_id, settlement_date desc);

create table public.maquinola_settlement_payments (
  id uuid primary key default gen_random_uuid(),
  settlement_id uuid not null references public.maquinola_settlements(id),
  method public.payment_method not null,
  amount numeric(14, 2) not null check (amount > 0),
  cash_account_id uuid not null references public.cash_accounts(id),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  voided_at timestamptz,
  voided_by uuid references public.profiles(id),
  void_reason text,
  constraint maquinola_payments_void_reason_required
    check (voided_at is null or nullif(trim(void_reason), '') is not null)
);

create index maquinola_payments_settlement_active_idx
  on public.maquinola_settlement_payments (settlement_id)
  where voided_at is null;

alter table public.subagent_account_movements
  add column related_maquinola_settlement_id uuid
    references public.maquinola_settlements(id);
create index subagent_account_maquinola_settlement_idx
  on public.subagent_account_movements (related_maquinola_settlement_id)
  where related_maquinola_settlement_id is not null;

alter table public.cash_movements
  add column related_maquinola_settlement_id uuid
    references public.maquinola_settlements(id);
create index cash_movements_maquinola_settlement_idx
  on public.cash_movements (related_maquinola_settlement_id)
  where related_maquinola_settlement_id is not null;

create trigger maquinolas_set_updated_at
before update on public.maquinolas
for each row execute function public.set_updated_at();
create trigger maquinola_settlements_set_updated_at
before update on public.maquinola_settlements
for each row execute function public.set_updated_at();

create or replace function public.prepare_maquinola_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.number := upper(trim(new.number));

  if tg_op = 'UPDATE' and new.subagent_id is distinct from old.subagent_id then
    new.assigned_at := timezone('America/Argentina/Buenos_Aires', now())::date;
  end if;

  return new;
end;
$$;

revoke all on function public.prepare_maquinola_update()
  from public, anon, authenticated;

create trigger maquinolas_prepare_update
before insert or update on public.maquinolas
for each row execute function public.prepare_maquinola_update();

create or replace function public.audit_maquinola_changes()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.audit_logs (
    user_id, entity_type, entity_id, action, old_values, new_values
  ) values (
    (select auth.uid()),
    'maquinola',
    new.id,
    case
      when tg_op = 'INSERT' then 'create_maquinola'
      when new.subagent_id is distinct from old.subagent_id then 'reassign_maquinola'
      when new.status is distinct from old.status then
        case when new.status = 'active' then 'activate_maquinola'
          else 'inactivate_maquinola' end
      else 'edit_maquinola'
    end,
    case when tg_op = 'UPDATE' then to_jsonb(old) else null end,
    to_jsonb(new)
  );
  return new;
end;
$$;

revoke all on function public.audit_maquinola_changes()
  from public, anon, authenticated;

create trigger maquinolas_audit_changes
after insert or update on public.maquinolas
for each row execute function public.audit_maquinola_changes();

insert into public.cash_categories (name, type, is_system, status)
values ('Rendición de Maquinola', 'income', true, 'active')
on conflict (name, type) do update set status = 'active';

alter table public.maquinolas enable row level security;
alter table public.maquinola_settlements enable row level security;
alter table public.maquinola_settlement_payments enable row level security;

revoke all on table public.maquinolas from public, anon;
revoke all on table public.maquinola_settlements from public, anon;
revoke all on table public.maquinola_settlement_payments from public, anon;
grant select, insert, update on table public.maquinolas to authenticated;
grant select, insert, update on table public.maquinola_settlements to authenticated;
grant select, insert, update on table public.maquinola_settlement_payments to authenticated;

create policy "maquinolas_internal_select" on public.maquinolas
  for select to authenticated using ((select public.is_internal_user()));
create policy "maquinolas_linked_select" on public.maquinolas
  for select to authenticated
  using ((select public.can_access_subagent(subagent_id)));
create policy "maquinolas_operator_insert" on public.maquinolas
  for insert to authenticated with check ((select public.can_operate()));
create policy "maquinolas_operator_update" on public.maquinolas
  for update to authenticated
  using ((select public.can_operate()))
  with check ((select public.can_operate()));

create policy "maquinola_settlements_internal_select"
  on public.maquinola_settlements
  for select to authenticated using ((select public.is_internal_user()));
create policy "maquinola_settlements_linked_select"
  on public.maquinola_settlements
  for select to authenticated
  using ((select public.can_access_subagent(subagent_id)));
create policy "maquinola_settlements_operator_insert"
  on public.maquinola_settlements
  for insert to authenticated with check ((select public.can_operate()));
create policy "maquinola_settlements_owner_update"
  on public.maquinola_settlements
  for update to authenticated
  using ((select public.can_manage_users()))
  with check ((select public.can_manage_users()));

create policy "maquinola_payments_internal_select"
  on public.maquinola_settlement_payments
  for select to authenticated using ((select public.is_internal_user()));
create policy "maquinola_payments_linked_select"
  on public.maquinola_settlement_payments
  for select to authenticated
  using (
    exists (
      select 1
      from public.maquinola_settlements as settlement
      where settlement.id = maquinola_settlement_payments.settlement_id
        and (select public.can_access_subagent(settlement.subagent_id))
    )
  );
create policy "maquinola_payments_operator_insert"
  on public.maquinola_settlement_payments
  for insert to authenticated with check ((select public.can_operate()));
create policy "maquinola_payments_owner_update"
  on public.maquinola_settlement_payments
  for update to authenticated
  using ((select public.can_manage_users()))
  with check ((select public.can_manage_users()));

create or replace function public.create_maquinola_settlement(
  p_settlement_date date,
  p_maquinola_id uuid,
  p_cash_amount numeric,
  p_bank_amount numeric,
  p_sales_amount numeric,
  p_prizes_paid_amount numeric,
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
  current_maquinola public.maquinolas;
  business_day_id uuid;
  settlement_id uuid;
  cash_account_id uuid;
  bank_account_id uuid;
  income_category_id uuid;
  received_amount numeric(14, 2) := round(p_cash_amount + p_bank_amount, 2);
  net_amount numeric(14, 2) := round(p_sales_amount - p_prizes_paid_amount, 2);
  expected_amount numeric(14, 2) := greatest(net_amount, 0);
  prize_credit_amount numeric(14, 2) := greatest(-net_amount, 0);
  overpayment_credit_amount numeric(14, 2) := greatest(received_amount - greatest(net_amount, 0), 0);
  debt_amount numeric(14, 2) := greatest(greatest(net_amount, 0) - received_amount, 0);
begin
  if actor_id is null or not (select public.can_operate()) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if extract(isodow from p_settlement_date) = 7 then
    raise exception 'El domingo no es un día operativo' using errcode = '22023';
  end if;

  if p_sales_amount < 0 or p_prizes_paid_amount < 0
    or p_cash_amount < 0 or p_bank_amount < 0
    or (received_amount = 0 and expected_amount <> 0) then
    raise exception 'Los importes del cierre son inválidos' using errcode = '22023';
  end if;

  select * into current_maquinola
  from public.maquinolas
  where id = p_maquinola_id and status = 'active';

  if current_maquinola.id is null then
    raise exception 'La Maquinola no existe o está inactiva' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.subagents
    where id = current_maquinola.subagent_id and status = 'active'
  ) then
    raise exception 'El Subagente asignado está inactivo' using errcode = '22023';
  end if;

  insert into public.business_days (date, is_working_day, opened_at, opened_by)
  values (p_settlement_date, true, now(), actor_id)
  on conflict (date) do nothing;

  select id into business_day_id
  from public.business_days where date = p_settlement_date;

  select id into cash_account_id from public.cash_accounts
  where type = 'cash' and status = 'active' order by created_at limit 1;
  select id into bank_account_id from public.cash_accounts
  where type = 'bank' and status = 'active' order by created_at limit 1;
  select id into income_category_id from public.cash_categories
  where name = 'Rendición de Maquinola' and type = 'income' and status = 'active'
  limit 1;

  if cash_account_id is null or bank_account_id is null or income_category_id is null then
    raise exception 'Falta configuración de caja para registrar el cierre' using errcode = '55000';
  end if;

  insert into public.maquinola_settlements (
    business_day_id, maquinola_id, subagent_id, settlement_date, status,
    sales_amount, prizes_paid_amount, expected_amount, received_amount,
    debt_amount, prize_credit_amount, overpayment_credit_amount, notes,
    created_by, updated_by
  ) values (
    business_day_id, current_maquinola.id, current_maquinola.subagent_id,
    p_settlement_date,
    case when debt_amount > 0 then 'settled_with_debt'::public.settlement_status
      else 'settled'::public.settlement_status end,
    p_sales_amount, p_prizes_paid_amount, expected_amount, received_amount,
    debt_amount, prize_credit_amount, overpayment_credit_amount,
    nullif(trim(p_notes), ''), actor_id, actor_id
  ) returning id into settlement_id;

  if p_cash_amount > 0 then
    insert into public.maquinola_settlement_payments
      (settlement_id, method, amount, cash_account_id, created_by)
    values (settlement_id, 'cash', p_cash_amount, cash_account_id, actor_id);
    insert into public.cash_movements (
      business_day_id, cash_account_id, type, direction, category_id, amount,
      description, related_maquinola_settlement_id, created_by, updated_by
    ) values (
      business_day_id, cash_account_id, 'income', 'in', income_category_id,
      p_cash_amount, 'Cierre de Maquinola ' || current_maquinola.number,
      settlement_id, actor_id, actor_id
    );
  end if;

  if p_bank_amount > 0 then
    insert into public.maquinola_settlement_payments
      (settlement_id, method, amount, cash_account_id, created_by)
    values (settlement_id, 'bank_transfer', p_bank_amount, bank_account_id, actor_id);
    insert into public.cash_movements (
      business_day_id, cash_account_id, type, direction, category_id, amount,
      description, related_maquinola_settlement_id, created_by, updated_by
    ) values (
      business_day_id, bank_account_id, 'income', 'in', income_category_id,
      p_bank_amount, 'Cierre de Maquinola ' || current_maquinola.number,
      settlement_id, actor_id, actor_id
    );
  end if;

  if debt_amount > 0 then
    insert into public.subagent_account_movements (
      subagent_id, business_day_id, type, direction, amount,
      related_maquinola_settlement_id, notes, created_by
    ) values (
      current_maquinola.subagent_id, business_day_id, 'settlement_debt', 'debit',
      debt_amount, settlement_id,
      'Deuda por cierre incompleto de Maquinola ' || current_maquinola.number,
      actor_id
    );
  end if;

  if prize_credit_amount > 0 then
    insert into public.subagent_account_movements (
      subagent_id, business_day_id, type, direction, amount,
      related_maquinola_settlement_id, notes, created_by
    ) values (
      current_maquinola.subagent_id, business_day_id, 'prize_credit', 'credit',
      prize_credit_amount, settlement_id,
      'Saldo a favor por premios de Maquinola ' || current_maquinola.number,
      actor_id
    );
  end if;

  if overpayment_credit_amount > 0 then
    insert into public.subagent_account_movements (
      subagent_id, business_day_id, type, direction, amount,
      related_maquinola_settlement_id, notes, created_by
    ) values (
      current_maquinola.subagent_id, business_day_id, 'overpayment_credit', 'credit',
      overpayment_credit_amount, settlement_id,
      'Saldo a favor por pago excedente de Maquinola ' || current_maquinola.number,
      actor_id
    );
  end if;

  insert into public.audit_logs (user_id, entity_type, entity_id, action, new_values)
  select actor_id, 'maquinola_settlement', settlement.id,
    'create_maquinola_settlement', to_jsonb(settlement)
  from public.maquinola_settlements as settlement where settlement.id = settlement_id;

  return settlement_id;
end;
$$;

revoke all on function public.create_maquinola_settlement(
  date, uuid, numeric, numeric, numeric, numeric, text
) from public, anon;
grant execute on function public.create_maquinola_settlement(
  date, uuid, numeric, numeric, numeric, numeric, text
) to authenticated;

create or replace function public.void_maquinola_settlement(
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
  previous_settlement public.maquinola_settlements;
  updated_settlement public.maquinola_settlements;
begin
  if actor_id is null or not (select public.can_manage_users()) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if nullif(trim(p_reason), '') is null then
    raise exception 'El motivo de anulación es obligatorio' using errcode = '22023';
  end if;

  select * into previous_settlement from public.maquinola_settlements
  where id = p_settlement_id for update;
  if previous_settlement.id is null then
    raise exception 'El cierre no existe' using errcode = 'P0002';
  end if;
  if previous_settlement.voided_at is not null then
    raise exception 'El cierre ya está anulado' using errcode = '22023';
  end if;

  update public.maquinola_settlements set
    status = 'voided', voided_at = now(), voided_by = actor_id,
    void_reason = trim(p_reason), updated_by = actor_id
  where id = p_settlement_id returning * into updated_settlement;
  update public.maquinola_settlement_payments set
    voided_at = now(), voided_by = actor_id, void_reason = trim(p_reason)
  where settlement_id = p_settlement_id and voided_at is null;
  update public.cash_movements set
    voided_at = now(), voided_by = actor_id, void_reason = trim(p_reason),
    updated_by = actor_id
  where related_maquinola_settlement_id = p_settlement_id and voided_at is null;
  update public.subagent_account_movements set
    voided_at = now(), voided_by = actor_id, void_reason = trim(p_reason)
  where related_maquinola_settlement_id = p_settlement_id and voided_at is null;

  insert into public.audit_logs (
    user_id, entity_type, entity_id, action, old_values, new_values, reason
  ) values (
    actor_id, 'maquinola_settlement', p_settlement_id,
    'void_maquinola_settlement', to_jsonb(previous_settlement),
    to_jsonb(updated_settlement), trim(p_reason)
  );
end;
$$;

revoke all on function public.void_maquinola_settlement(uuid, text)
  from public, anon;
grant execute on function public.void_maquinola_settlement(uuid, text)
  to authenticated;

create or replace function public.replace_maquinola_settlement(
  p_previous_settlement_id uuid,
  p_settlement_date date,
  p_maquinola_id uuid,
  p_cash_amount numeric,
  p_bank_amount numeric,
  p_sales_amount numeric,
  p_prizes_paid_amount numeric,
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
  if not (select public.can_manage_users()) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  perform public.void_maquinola_settlement(
    p_previous_settlement_id, 'Reemplazado por una edición'
  );
  replacement_id := public.create_maquinola_settlement(
    p_settlement_date, p_maquinola_id, p_cash_amount, p_bank_amount,
    p_sales_amount, p_prizes_paid_amount, p_notes
  );
  insert into public.audit_logs (user_id, entity_type, entity_id, action, new_values)
  values (
    (select auth.uid()), 'maquinola_settlement', replacement_id,
    'replace_maquinola_settlement',
    jsonb_build_object(
      'previous_settlement_id', p_previous_settlement_id,
      'replacement_settlement_id', replacement_id
    )
  );
  return replacement_id;
end;
$$;

revoke all on function public.replace_maquinola_settlement(
  uuid, date, uuid, numeric, numeric, numeric, numeric, text
) from public, anon;
grant execute on function public.replace_maquinola_settlement(
  uuid, date, uuid, numeric, numeric, numeric, numeric, text
) to authenticated;

create or replace function public.get_maquinola_dashboard(
  p_date date default timezone('America/Argentina/Buenos_Aires', now())::date
)
returns table (
  maquinola_id uuid,
  maquinola_number text,
  subagent_id uuid,
  subagent_name text,
  dashboard_status text,
  today_settlement_id uuid,
  received_today numeric,
  debt_today numeric,
  last_settlement_date date,
  delay_days integer,
  overdue_alerts_enabled boolean,
  overdue_min_days smallint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    maquinola.id,
    maquinola.number,
    subagent.id,
    subagent.name,
    case
      when today.status is not null then today.status::text
      when missing.value >= 3 then 'late_critical'
      when missing.value = 2 then 'late_serious'
      when missing.value = 1 then 'late'
      when extract(isodow from p_date) = 7 then 'non_working'
      else 'pending'
    end,
    today.id,
    coalesce(today.received_amount, 0),
    coalesce(today.debt_amount, 0),
    latest.settlement_date,
    missing.value,
    subagent.maquinola_overdue_alerts_enabled,
    subagent.maquinola_overdue_min_days
  from public.maquinolas as maquinola
  join public.subagents as subagent on subagent.id = maquinola.subagent_id
  left join lateral (
    select settlement.id, settlement.status, settlement.received_amount,
      settlement.debt_amount
    from public.maquinola_settlements as settlement
    where settlement.maquinola_id = maquinola.id
      and settlement.settlement_date = p_date
      and settlement.voided_at is null
    limit 1
  ) as today on true
  left join lateral (
    select settlement.settlement_date
    from public.maquinola_settlements as settlement
    where settlement.maquinola_id = maquinola.id
      and settlement.settlement_date <= p_date
      and settlement.voided_at is null
    order by settlement.settlement_date desc limit 1
  ) as latest on true
  cross join lateral (
    select count(*)::integer as value
    from generate_series(
      greatest(coalesce(latest.settlement_date + 1, maquinola.assigned_at), maquinola.assigned_at),
      p_date - 1,
      interval '1 day'
    ) as missing_date
    where extract(isodow from missing_date) < 7
  ) as missing
  where maquinola.status = 'active' and subagent.status = 'active'
  order by
    case
      when today.status is not null then 5
      when missing.value >= 3 then 1
      when missing.value = 2 then 2
      when missing.value = 1 then 3
      else 4
    end,
    subagent.name,
    maquinola.number;
$$;

revoke all on function public.get_maquinola_dashboard(date) from public, anon;
grant execute on function public.get_maquinola_dashboard(date) to authenticated;

comment on table public.maquinolas is
  'Unidades sin comisión asignadas a Subagentes y obligadas a cierre diario.';
comment on table public.maquinola_settlements is
  'Cierres diarios de Maquinolas con impacto atómico en Caja y cuenta corriente.';
comment on column public.maquinolas.assigned_at is
  'Inicio del período de obligación para el Subagente actualmente asignado.';
