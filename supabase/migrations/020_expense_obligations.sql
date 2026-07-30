create type public.expense_obligation_status as enum (
  'pending',
  'paid',
  'cancelled'
);

create table public.expense_obligations (
  id uuid primary key default gen_random_uuid(),
  description text not null check (char_length(trim(description)) between 2 and 160),
  category_id uuid not null references public.cash_categories(id),
  amount numeric(14, 2) not null check (amount > 0),
  due_date date not null,
  status public.expense_obligation_status not null default 'pending',
  recurrence_months smallint
    check (recurrence_months is null or recurrence_months between 1 and 12),
  notes text,
  paid_business_date date,
  paid_cash_account_id uuid references public.cash_accounts(id),
  paid_cash_movement_id uuid references public.cash_movements(id),
  paid_at timestamptz,
  paid_by uuid references public.profiles(id),
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles(id),
  cancellation_reason text,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expense_obligations_paid_data
    check (
      status <> 'paid'
      or (
        paid_business_date is not null
        and paid_cash_account_id is not null
        and paid_cash_movement_id is not null
        and paid_at is not null
      )
    ),
  constraint expense_obligations_cancelled_data
    check (
      status <> 'cancelled'
      or (
        cancelled_at is not null
        and nullif(trim(cancellation_reason), '') is not null
      )
    )
);

create index expense_obligations_pending_due_idx
  on public.expense_obligations (due_date, id)
  where status = 'pending';
create index expense_obligations_status_updated_idx
  on public.expense_obligations (status, updated_at desc);

alter table public.cash_movements
  add column related_expense_obligation_id uuid
    references public.expense_obligations(id);
create index cash_movements_expense_obligation_idx
  on public.cash_movements (related_expense_obligation_id)
  where related_expense_obligation_id is not null;

create trigger expense_obligations_set_updated_at
before update on public.expense_obligations
for each row execute function public.set_updated_at();

alter table public.expense_obligations enable row level security;

create policy "expense_obligations_internal_select"
  on public.expense_obligations
  for select to authenticated
  using ((select public.is_internal_user()));
create policy "expense_obligations_operator_insert"
  on public.expense_obligations
  for insert to authenticated
  with check ((select public.can_operate()));
create policy "expense_obligations_operator_update"
  on public.expense_obligations
  for update to authenticated
  using ((select public.can_operate()))
  with check ((select public.can_operate()));

create or replace function public.prevent_expense_obligation_movement_void()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.related_expense_obligation_id is not null
    and old.voided_at is null
    and new.voided_at is not null then
    raise exception 'El pago debe corregirse desde Gastos'
      using errcode = '22023';
  end if;

  return new;
end;
$$;

revoke all on function public.prevent_expense_obligation_movement_void()
  from public, anon, authenticated;

create trigger cash_movements_prevent_expense_obligation_void
before update on public.cash_movements
for each row execute function public.prevent_expense_obligation_movement_void();

create or replace function public.create_expense_obligation(
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
  obligation_id uuid;
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

  insert into public.expense_obligations (
    description,
    category_id,
    amount,
    due_date,
    recurrence_months,
    notes,
    created_by,
    updated_by
  )
  values (
    trim(p_description),
    p_category_id,
    p_amount,
    p_due_date,
    p_recurrence_months,
    nullif(trim(p_notes), ''),
    actor_id,
    actor_id
  )
  returning id into obligation_id;

  return obligation_id;
end;
$$;

create or replace function public.pay_expense_obligation(
  p_obligation_id uuid,
  p_business_date date,
  p_cash_account_id uuid
)
returns uuid
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  obligation public.expense_obligations;
  business_day_id uuid;
  movement_id uuid;
  current_balance numeric;
begin
  if actor_id is null or not (select public.can_operate()) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if extract(isodow from p_business_date) = 7 then
    raise exception 'El domingo no es un día operativo'
      using errcode = '22023';
  end if;

  select *
  into obligation
  from public.expense_obligations
  where id = p_obligation_id
  for update;

  if obligation.id is null or obligation.status <> 'pending' then
    raise exception 'La obligación ya no está pendiente'
      using errcode = '22023';
  end if;

  perform id
  from public.cash_accounts
  where id = p_cash_account_id
    and status = 'active'
  for update;

  if not found then
    raise exception 'Seleccioná una cuenta de Caja activa'
      using errcode = '22023';
  end if;

  select coalesce(
    sum(case direction when 'in' then amount else -amount end),
    0
  )
  into current_balance
  from public.cash_movements
  where cash_account_id = p_cash_account_id
    and voided_at is null;

  if current_balance < obligation.amount then
    raise exception 'El saldo de la cuenta es insuficiente'
      using errcode = '22023';
  end if;

  insert into public.business_days (date, is_working_day, opened_at, opened_by)
  values (p_business_date, true, now(), actor_id)
  on conflict (date) do nothing;

  select id
  into business_day_id
  from public.business_days
  where date = p_business_date;

  insert into public.cash_movements (
    business_day_id,
    cash_account_id,
    type,
    direction,
    category_id,
    amount,
    description,
    note,
    related_expense_obligation_id,
    created_by,
    updated_by
  )
  values (
    business_day_id,
    p_cash_account_id,
    'expense',
    'out',
    obligation.category_id,
    obligation.amount,
    obligation.description,
    obligation.notes,
    obligation.id,
    actor_id,
    actor_id
  )
  returning id into movement_id;

  update public.expense_obligations
  set
    status = 'paid',
    paid_business_date = p_business_date,
    paid_cash_account_id = p_cash_account_id,
    paid_cash_movement_id = movement_id,
    paid_at = now(),
    paid_by = actor_id,
    updated_by = actor_id
  where id = obligation.id;

  if obligation.recurrence_months is not null then
    insert into public.expense_obligations (
      description,
      category_id,
      amount,
      due_date,
      recurrence_months,
      notes,
      created_by,
      updated_by
    )
    values (
      obligation.description,
      obligation.category_id,
      obligation.amount,
      (obligation.due_date
        + make_interval(months => obligation.recurrence_months))::date,
      obligation.recurrence_months,
      obligation.notes,
      actor_id,
      actor_id
    );
  end if;

  return movement_id;
end;
$$;

revoke all on function public.create_expense_obligation(
  text, uuid, numeric, date, smallint, text
) from public, anon;
grant execute on function public.create_expense_obligation(
  text, uuid, numeric, date, smallint, text
) to authenticated;
revoke all on function public.pay_expense_obligation(uuid, date, uuid)
  from public, anon;
grant execute on function public.pay_expense_obligation(uuid, date, uuid)
  to authenticated;
