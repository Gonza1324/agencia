create or replace function public.can_manage_users()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'owner_admin'
      and status = 'active'
  );
$$;

create or replace function public.can_operate()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role in ('owner_admin', 'cash_operator')
      and status = 'active'
  );
$$;

create or replace function public.is_internal_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role in ('owner_admin', 'cash_operator', 'viewer')
      and status = 'active'
  );
$$;

revoke all on function public.can_manage_users() from public, anon;
revoke all on function public.can_operate() from public, anon;
revoke all on function public.is_internal_user() from public, anon;
grant execute on function public.can_manage_users() to authenticated;
grant execute on function public.can_operate() to authenticated;
grant execute on function public.is_internal_user() to authenticated;

-- Las funciones transaccionales existentes nacieron cuando solo había
-- propietarios. Se actualiza exclusivamente su chequeo de autorización para
-- habilitar al rol operador sin duplicar su lógica crítica.
do $$
declare
  function_record record;
  function_definition text;
begin
  for function_record in
    select procedure.oid
    from pg_proc as procedure
    join pg_namespace as namespace
      on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.proname in (
        'create_daily_settlement',
        'void_daily_settlement',
        'replace_daily_settlement',
        'create_manual_cash_movement',
        'void_manual_cash_movement',
        'create_subagent_account_movement',
        'void_subagent_account_movement',
        'close_business_day',
        'reopen_business_day'
      )
  loop
    function_definition := pg_get_functiondef(function_record.oid);

    if position('public.is_owner_admin()' in function_definition) > 0 then
      execute replace(
        function_definition,
        'public.is_owner_admin()',
        'public.can_operate()'
      );
    end if;
  end loop;
end;
$$;

drop policy if exists "profiles_select_authenticated" on public.profiles;
drop policy if exists "profiles_owner_admin_manage" on public.profiles;

create policy "profiles_internal_select" on public.profiles
  for select to authenticated
  using ((select public.is_internal_user()));
create policy "profiles_owner_update" on public.profiles
  for update to authenticated
  using ((select public.can_manage_users()))
  with check ((select public.can_manage_users()));

drop policy if exists "subagents_owner_admin_all" on public.subagents;
drop policy if exists "business_days_owner_admin_all" on public.business_days;
drop policy if exists "cash_accounts_owner_admin_all" on public.cash_accounts;
drop policy if exists "cash_categories_owner_admin_all" on public.cash_categories;
drop policy if exists "daily_settlements_owner_admin_all"
  on public.daily_settlements;
drop policy if exists "settlement_payments_owner_admin_all"
  on public.settlement_payments;
drop policy if exists "subagent_account_movements_owner_admin_all"
  on public.subagent_account_movements;
drop policy if exists "cash_movements_owner_admin_all" on public.cash_movements;
drop policy if exists "cash_closures_owner_admin_all" on public.cash_closures;
drop policy if exists "attachments_owner_admin_all" on public.attachments;
drop policy if exists "audit_logs_owner_admin_select" on public.audit_logs;
drop policy if exists "audit_logs_owner_admin_insert" on public.audit_logs;

create policy "subagents_internal_select" on public.subagents
  for select to authenticated using ((select public.is_internal_user()));
create policy "subagents_operator_insert" on public.subagents
  for insert to authenticated with check ((select public.can_operate()));
create policy "subagents_operator_update" on public.subagents
  for update to authenticated
  using ((select public.can_operate()))
  with check ((select public.can_operate()));

create policy "business_days_internal_select" on public.business_days
  for select to authenticated using ((select public.is_internal_user()));
create policy "business_days_operator_insert" on public.business_days
  for insert to authenticated with check ((select public.can_operate()));
create policy "business_days_operator_update" on public.business_days
  for update to authenticated
  using ((select public.can_operate()))
  with check ((select public.can_operate()));

create policy "cash_accounts_internal_select" on public.cash_accounts
  for select to authenticated using ((select public.is_internal_user()));
create policy "cash_accounts_owner_insert" on public.cash_accounts
  for insert to authenticated with check ((select public.can_manage_users()));
create policy "cash_accounts_owner_update" on public.cash_accounts
  for update to authenticated
  using ((select public.can_manage_users()))
  with check ((select public.can_manage_users()));

create policy "cash_categories_internal_select" on public.cash_categories
  for select to authenticated using ((select public.is_internal_user()));
create policy "cash_categories_owner_insert" on public.cash_categories
  for insert to authenticated with check ((select public.can_manage_users()));
create policy "cash_categories_owner_update" on public.cash_categories
  for update to authenticated
  using ((select public.can_manage_users()))
  with check ((select public.can_manage_users()));

create policy "daily_settlements_internal_select" on public.daily_settlements
  for select to authenticated using ((select public.is_internal_user()));
create policy "daily_settlements_operator_insert" on public.daily_settlements
  for insert to authenticated with check ((select public.can_operate()));
create policy "daily_settlements_operator_update" on public.daily_settlements
  for update to authenticated
  using ((select public.can_operate()))
  with check ((select public.can_operate()));

create policy "settlement_payments_internal_select"
  on public.settlement_payments
  for select to authenticated using ((select public.is_internal_user()));
create policy "settlement_payments_operator_insert"
  on public.settlement_payments
  for insert to authenticated with check ((select public.can_operate()));
create policy "settlement_payments_operator_update"
  on public.settlement_payments
  for update to authenticated
  using ((select public.can_operate()))
  with check ((select public.can_operate()));

create policy "subagent_account_movements_internal_select"
  on public.subagent_account_movements
  for select to authenticated using ((select public.is_internal_user()));
create policy "subagent_account_movements_operator_insert"
  on public.subagent_account_movements
  for insert to authenticated with check ((select public.can_operate()));
create policy "subagent_account_movements_operator_update"
  on public.subagent_account_movements
  for update to authenticated
  using ((select public.can_operate()))
  with check ((select public.can_operate()));

create policy "cash_movements_internal_select" on public.cash_movements
  for select to authenticated using ((select public.is_internal_user()));
create policy "cash_movements_operator_insert" on public.cash_movements
  for insert to authenticated with check ((select public.can_operate()));
create policy "cash_movements_operator_update" on public.cash_movements
  for update to authenticated
  using ((select public.can_operate()))
  with check ((select public.can_operate()));

create policy "cash_closures_internal_select" on public.cash_closures
  for select to authenticated using ((select public.is_internal_user()));
create policy "cash_closures_operator_insert" on public.cash_closures
  for insert to authenticated with check ((select public.can_operate()));
create policy "cash_closures_operator_update" on public.cash_closures
  for update to authenticated
  using ((select public.can_operate()))
  with check ((select public.can_operate()));

create policy "attachments_internal_select" on public.attachments
  for select to authenticated using ((select public.is_internal_user()));
create policy "attachments_operator_insert" on public.attachments
  for insert to authenticated with check ((select public.can_operate()));
create policy "attachments_operator_update" on public.attachments
  for update to authenticated
  using ((select public.can_operate()))
  with check ((select public.can_operate()));

create policy "audit_logs_owner_select" on public.audit_logs
  for select to authenticated using ((select public.can_manage_users()));
create policy "audit_logs_operator_insert" on public.audit_logs
  for insert to authenticated with check ((select public.can_operate()));

comment on function public.can_manage_users() is
  'Autoriza exclusivamente a propietarios activos para administrar usuarios.';
comment on function public.can_operate() is
  'Autoriza propietarios y operadores activos para mutaciones operativas.';
comment on function public.is_internal_user() is
  'Autoriza perfiles internos activos, incluido el rol visor.';
