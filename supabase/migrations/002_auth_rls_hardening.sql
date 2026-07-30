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
    where id = (select auth.uid())
      and role = 'owner_admin'
      and status = 'active'
  );
$$;

drop policy "profiles_select_authenticated" on public.profiles;
drop policy "profiles_owner_admin_manage" on public.profiles;
drop policy "subagents_owner_admin_all" on public.subagents;
drop policy "business_days_owner_admin_all" on public.business_days;
drop policy "cash_accounts_owner_admin_all" on public.cash_accounts;
drop policy "cash_categories_owner_admin_all" on public.cash_categories;
drop policy "daily_settlements_owner_admin_all" on public.daily_settlements;
drop policy "settlement_payments_owner_admin_all" on public.settlement_payments;
drop policy "subagent_account_movements_owner_admin_all" on public.subagent_account_movements;
drop policy "cash_movements_owner_admin_all" on public.cash_movements;
drop policy "cash_closures_owner_admin_all" on public.cash_closures;
drop policy "attachments_owner_admin_all" on public.attachments;
drop policy "audit_logs_owner_admin_select" on public.audit_logs;
drop policy "audit_logs_owner_admin_insert" on public.audit_logs;

create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated using ((select public.is_owner_admin()));
create policy "profiles_owner_admin_manage" on public.profiles
  for all to authenticated
  using ((select public.is_owner_admin()))
  with check ((select public.is_owner_admin()));

create policy "subagents_owner_admin_all" on public.subagents
  for all to authenticated
  using ((select public.is_owner_admin()))
  with check ((select public.is_owner_admin()));
create policy "business_days_owner_admin_all" on public.business_days
  for all to authenticated
  using ((select public.is_owner_admin()))
  with check ((select public.is_owner_admin()));
create policy "cash_accounts_owner_admin_all" on public.cash_accounts
  for all to authenticated
  using ((select public.is_owner_admin()))
  with check ((select public.is_owner_admin()));
create policy "cash_categories_owner_admin_all" on public.cash_categories
  for all to authenticated
  using ((select public.is_owner_admin()))
  with check ((select public.is_owner_admin()));
create policy "daily_settlements_owner_admin_all" on public.daily_settlements
  for all to authenticated
  using ((select public.is_owner_admin()))
  with check ((select public.is_owner_admin()));
create policy "settlement_payments_owner_admin_all" on public.settlement_payments
  for all to authenticated
  using ((select public.is_owner_admin()))
  with check ((select public.is_owner_admin()));
create policy "subagent_account_movements_owner_admin_all"
  on public.subagent_account_movements
  for all to authenticated
  using ((select public.is_owner_admin()))
  with check ((select public.is_owner_admin()));
create policy "cash_movements_owner_admin_all" on public.cash_movements
  for all to authenticated
  using ((select public.is_owner_admin()))
  with check ((select public.is_owner_admin()));
create policy "cash_closures_owner_admin_all" on public.cash_closures
  for all to authenticated
  using ((select public.is_owner_admin()))
  with check ((select public.is_owner_admin()));
create policy "attachments_owner_admin_all" on public.attachments
  for all to authenticated
  using ((select public.is_owner_admin()))
  with check ((select public.is_owner_admin()));
create policy "audit_logs_owner_admin_select" on public.audit_logs
  for select to authenticated using ((select public.is_owner_admin()));
create policy "audit_logs_owner_admin_insert" on public.audit_logs
  for insert to authenticated
  with check ((select public.is_owner_admin()));
