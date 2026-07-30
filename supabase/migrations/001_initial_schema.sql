create extension if not exists "pgcrypto";

create type public.user_role as enum ('owner_admin', 'cash_operator', 'subagent', 'viewer');
create type public.record_status as enum ('active', 'inactive');
create type public.business_day_status as enum ('open', 'closed', 'reopened');
create type public.settlement_status as enum (
  'pending',
  'settled',
  'settled_with_debt',
  'late',
  'late_serious',
  'late_critical',
  'voided'
);
create type public.payment_method as enum ('cash', 'bank_transfer');
create type public.cash_account_type as enum ('cash', 'bank');
create type public.cash_movement_type as enum ('income', 'expense', 'withdrawal', 'adjustment', 'transfer');
create type public.cash_movement_direction as enum ('in', 'out');
create type public.cash_category_type as enum ('income', 'expense', 'withdrawal', 'adjustment');
create type public.account_movement_type as enum (
  'settlement_debt',
  'debt_payment',
  'positive_adjustment',
  'negative_adjustment',
  'compensation',
  'void'
);
create type public.account_movement_direction as enum ('debit', 'credit');
create type public.closure_status as enum ('closed', 'reopened');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role public.user_role not null default 'owner_admin',
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_owner_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'owner_admin'
      and status = 'active'
  );
$$;

revoke all on function public.is_owner_admin() from public;
grant execute on function public.is_owner_admin() to authenticated;

create table public.subagents (
  id uuid primary key default gen_random_uuid(),
  machine_code text not null,
  name text not null,
  status public.record_status not null default 'active',
  notes text,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index subagents_active_machine_code_uidx
  on public.subagents (lower(machine_code))
  where status = 'active';

create table public.business_days (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  status public.business_day_status not null default 'open',
  is_working_day boolean not null,
  opened_at timestamptz,
  closed_at timestamptz,
  opened_by uuid references public.profiles(id),
  closed_by uuid references public.profiles(id),
  reopened_at timestamptz,
  reopened_by uuid references public.profiles(id),
  reopen_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_days_reopen_reason_required
    check (status <> 'reopened' or nullif(trim(reopen_reason), '') is not null)
);

create table public.cash_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  type public.cash_account_type not null,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cash_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type public.cash_category_type not null,
  is_system boolean not null default false,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, type)
);

create table public.daily_settlements (
  id uuid primary key default gen_random_uuid(),
  business_day_id uuid not null references public.business_days(id),
  settlement_date date not null,
  subagent_id uuid not null references public.subagents(id),
  status public.settlement_status not null default 'settled',
  sales_amount numeric(14, 2) check (sales_amount is null or sales_amount >= 0),
  commission_amount numeric(14, 2) check (commission_amount is null or commission_amount >= 0),
  prizes_paid_amount numeric(14, 2) check (prizes_paid_amount is null or prizes_paid_amount >= 0),
  expected_amount numeric(14, 2) check (expected_amount is null or expected_amount >= 0),
  received_amount numeric(14, 2) not null check (received_amount >= 0),
  debt_amount numeric(14, 2) not null default 0 check (debt_amount >= 0),
  notes text,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  voided_at timestamptz,
  voided_by uuid references public.profiles(id),
  void_reason text,
  constraint daily_settlements_void_reason_required
    check (voided_at is null or nullif(trim(void_reason), '') is not null),
  constraint daily_settlements_debt_known_amount
    check (expected_amount is not null or debt_amount = 0)
);

create unique index daily_settlements_subagent_date_active_uidx
  on public.daily_settlements (subagent_id, settlement_date)
  where voided_at is null;

create index daily_settlements_business_day_idx on public.daily_settlements (business_day_id);
create index daily_settlements_status_idx on public.daily_settlements (status);

create table public.settlement_payments (
  id uuid primary key default gen_random_uuid(),
  settlement_id uuid not null references public.daily_settlements(id),
  method public.payment_method not null,
  amount numeric(14, 2) not null check (amount > 0),
  cash_account_id uuid not null references public.cash_accounts(id),
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index settlement_payments_settlement_idx on public.settlement_payments (settlement_id);

create table public.subagent_account_movements (
  id uuid primary key default gen_random_uuid(),
  subagent_id uuid not null references public.subagents(id),
  business_day_id uuid references public.business_days(id),
  type public.account_movement_type not null,
  direction public.account_movement_direction not null,
  amount numeric(14, 2) not null check (amount > 0),
  related_settlement_id uuid references public.daily_settlements(id),
  related_cash_movement_id uuid,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  voided_at timestamptz,
  voided_by uuid references public.profiles(id),
  void_reason text,
  constraint subagent_account_void_reason_required
    check (voided_at is null or nullif(trim(void_reason), '') is not null)
);

create index subagent_account_movements_subagent_idx
  on public.subagent_account_movements (subagent_id, created_at desc)
  where voided_at is null;

create table public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  business_day_id uuid not null references public.business_days(id),
  cash_account_id uuid not null references public.cash_accounts(id),
  type public.cash_movement_type not null,
  direction public.cash_movement_direction not null,
  category_id uuid references public.cash_categories(id),
  amount numeric(14, 2) not null check (amount > 0),
  owner_name text check (owner_name in ('Juliana', 'Gerónimo', 'Agustina')),
  description text,
  note text,
  related_settlement_id uuid references public.daily_settlements(id),
  related_subagent_account_movement_id uuid references public.subagent_account_movements(id),
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  voided_at timestamptz,
  voided_by uuid references public.profiles(id),
  void_reason text,
  constraint cash_movements_withdrawal_owner_required
    check (type <> 'withdrawal' or owner_name is not null),
  constraint cash_movements_adjustment_note_required
    check (type <> 'adjustment' or nullif(trim(note), '') is not null),
  constraint cash_movements_void_reason_required
    check (voided_at is null or nullif(trim(void_reason), '') is not null)
);

alter table public.subagent_account_movements
  add constraint subagent_account_related_cash_movement_fk
  foreign key (related_cash_movement_id) references public.cash_movements(id);

create index cash_movements_day_idx on public.cash_movements (business_day_id);
create index cash_movements_account_idx on public.cash_movements (cash_account_id);
create index cash_movements_active_created_idx on public.cash_movements (created_at desc)
  where voided_at is null;

create table public.cash_closures (
  id uuid primary key default gen_random_uuid(),
  business_day_id uuid not null unique references public.business_days(id),
  expected_cash_amount numeric(14, 2) not null default 0,
  counted_cash_amount numeric(14, 2) not null default 0,
  cash_difference numeric(14, 2) not null default 0,
  expected_bank_amount numeric(14, 2) not null default 0,
  reported_bank_amount numeric(14, 2) not null default 0,
  bank_difference numeric(14, 2) not null default 0,
  total_income numeric(14, 2) not null default 0,
  total_expense numeric(14, 2) not null default 0,
  total_withdrawals numeric(14, 2) not null default 0,
  total_available numeric(14, 2) not null default 0,
  note text,
  status public.closure_status not null default 'closed',
  closed_by uuid references public.profiles(id),
  closed_at timestamptz not null default now(),
  reopened_by uuid references public.profiles(id),
  reopened_at timestamptz,
  reopen_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cash_closures_difference_note_required
    check (
      (cash_difference = 0 and bank_difference = 0)
      or nullif(trim(note), '') is not null
    ),
  constraint cash_closures_reopen_reason_required
    check (status <> 'reopened' or nullif(trim(reopen_reason), '') is not null)
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  file_name text not null,
  file_path text not null,
  file_type text,
  file_size bigint check (file_size is null or file_size > 0),
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index attachments_entity_idx on public.attachments (entity_type, entity_id);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  old_values jsonb,
  new_values jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id, created_at desc);
create index audit_logs_user_idx on public.audit_logs (user_id, created_at desc);

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger subagents_set_updated_at before update on public.subagents
  for each row execute function public.set_updated_at();
create trigger business_days_set_updated_at before update on public.business_days
  for each row execute function public.set_updated_at();
create trigger cash_accounts_set_updated_at before update on public.cash_accounts
  for each row execute function public.set_updated_at();
create trigger cash_categories_set_updated_at before update on public.cash_categories
  for each row execute function public.set_updated_at();
create trigger daily_settlements_set_updated_at before update on public.daily_settlements
  for each row execute function public.set_updated_at();
create trigger cash_movements_set_updated_at before update on public.cash_movements
  for each row execute function public.set_updated_at();
create trigger cash_closures_set_updated_at before update on public.cash_closures
  for each row execute function public.set_updated_at();

insert into public.cash_accounts (name, type)
values
  ('Caja efectivo', 'cash'),
  ('Banco', 'bank');

insert into public.cash_categories (name, type, is_system)
values
  ('Rendición de subagente', 'income', true),
  ('Cobro de deuda de subagente', 'income', true),
  ('Ajuste positivo de caja', 'adjustment', true),
  ('Reintegro', 'income', true),
  ('Depósito bancario', 'income', true),
  ('Otro ingreso', 'income', true),
  ('Pago de premios', 'expense', true),
  ('Gasto operativo', 'expense', true),
  ('Servicios', 'expense', true),
  ('Alquiler', 'expense', true),
  ('Sueldos / colaboración', 'expense', true),
  ('Impuestos / tasas', 'expense', true),
  ('Compra de insumos', 'expense', true),
  ('Mantenimiento', 'expense', true),
  ('Ajuste negativo de caja', 'adjustment', true),
  ('Otro egreso', 'expense', true),
  ('Retiro de dueño', 'withdrawal', true);

alter table public.profiles enable row level security;
alter table public.subagents enable row level security;
alter table public.business_days enable row level security;
alter table public.cash_accounts enable row level security;
alter table public.cash_categories enable row level security;
alter table public.daily_settlements enable row level security;
alter table public.settlement_payments enable row level security;
alter table public.subagent_account_movements enable row level security;
alter table public.cash_movements enable row level security;
alter table public.cash_closures enable row level security;
alter table public.attachments enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated using (public.is_owner_admin());
create policy "profiles_owner_admin_manage" on public.profiles
  for all to authenticated using (public.is_owner_admin()) with check (public.is_owner_admin());

create policy "subagents_owner_admin_all" on public.subagents
  for all to authenticated using (public.is_owner_admin()) with check (public.is_owner_admin());
create policy "business_days_owner_admin_all" on public.business_days
  for all to authenticated using (public.is_owner_admin()) with check (public.is_owner_admin());
create policy "cash_accounts_owner_admin_all" on public.cash_accounts
  for all to authenticated using (public.is_owner_admin()) with check (public.is_owner_admin());
create policy "cash_categories_owner_admin_all" on public.cash_categories
  for all to authenticated using (public.is_owner_admin()) with check (public.is_owner_admin());
create policy "daily_settlements_owner_admin_all" on public.daily_settlements
  for all to authenticated using (public.is_owner_admin()) with check (public.is_owner_admin());
create policy "settlement_payments_owner_admin_all" on public.settlement_payments
  for all to authenticated using (public.is_owner_admin()) with check (public.is_owner_admin());
create policy "subagent_account_movements_owner_admin_all" on public.subagent_account_movements
  for all to authenticated using (public.is_owner_admin()) with check (public.is_owner_admin());
create policy "cash_movements_owner_admin_all" on public.cash_movements
  for all to authenticated using (public.is_owner_admin()) with check (public.is_owner_admin());
create policy "cash_closures_owner_admin_all" on public.cash_closures
  for all to authenticated using (public.is_owner_admin()) with check (public.is_owner_admin());
create policy "attachments_owner_admin_all" on public.attachments
  for all to authenticated using (public.is_owner_admin()) with check (public.is_owner_admin());
create policy "audit_logs_owner_admin_select" on public.audit_logs
  for select to authenticated using (public.is_owner_admin());
create policy "audit_logs_owner_admin_insert" on public.audit_logs
  for insert to authenticated with check (public.is_owner_admin());
