create table public.subagent_user_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  subagent_id uuid not null references public.subagents(id),
  status public.record_status not null default 'active',
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, subagent_id)
);

create index subagent_user_links_user_active_idx
  on public.subagent_user_links (user_id, subagent_id)
  where status = 'active';
create index subagent_user_links_subagent_active_idx
  on public.subagent_user_links (subagent_id, user_id)
  where status = 'active';
create index daily_settlements_subagent_portal_idx
  on public.daily_settlements (subagent_id, settlement_date desc);
create index subagent_account_movements_portal_idx
  on public.subagent_account_movements (subagent_id, created_at desc);
create index subagent_account_movements_business_day_idx
  on public.subagent_account_movements (business_day_id)
  where business_day_id is not null;

create trigger subagent_user_links_set_updated_at
before update on public.subagent_user_links
for each row execute function public.set_updated_at();

alter table public.subagent_user_links enable row level security;

revoke all on table public.subagent_user_links from public, anon;
grant select on table public.subagent_user_links to authenticated;

create or replace function public.can_access_subagent(
  p_subagent_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.subagent_user_links as link
    join public.profiles as profile
      on profile.id = link.user_id
    where link.user_id = (select auth.uid())
      and link.subagent_id = p_subagent_id
      and link.status = 'active'
      and profile.role = 'subagent'
      and profile.status = 'active'
  );
$$;

revoke all on function public.can_access_subagent(uuid)
  from public, anon;
grant execute on function public.can_access_subagent(uuid)
  to authenticated;

create or replace function public.set_subagent_user_links(
  p_user_id uuid,
  p_subagent_ids uuid[]
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  previous_ids jsonb;
  next_ids uuid[] := coalesce(p_subagent_ids, '{}'::uuid[]);
begin
  if actor_id is null or not (select public.can_manage_users()) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = p_user_id
      and role = 'subagent'
  ) then
    raise exception 'El usuario no tiene rol Subagente'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from unnest(next_ids) as requested(subagent_id)
    left join public.subagents
      on subagents.id = requested.subagent_id
    where subagents.id is null
  ) then
    raise exception 'Una de las máquinas seleccionadas no existe'
      using errcode = '22023';
  end if;

  select coalesce(jsonb_agg(subagent_id order by subagent_id), '[]'::jsonb)
  into previous_ids
  from public.subagent_user_links
  where user_id = p_user_id
    and status = 'active';

  update public.subagent_user_links
  set
    status = 'inactive',
    updated_by = actor_id
  where user_id = p_user_id
    and status = 'active';

  insert into public.subagent_user_links (
    user_id,
    subagent_id,
    status,
    created_by,
    updated_by
  )
  select
    p_user_id,
    requested.subagent_id,
    'active',
    actor_id,
    actor_id
  from (
    select distinct unnest(next_ids) as subagent_id
  ) as requested
  on conflict (user_id, subagent_id)
  do update set
    status = 'active',
    updated_by = actor_id;

  insert into public.audit_logs (
    user_id,
    entity_type,
    entity_id,
    action,
    old_values,
    new_values
  )
  values (
    actor_id,
    'profile',
    p_user_id,
    'set_subagent_user_links',
    jsonb_build_object('subagent_ids', previous_ids),
    jsonb_build_object('subagent_ids', to_jsonb(next_ids))
  );
end;
$$;

revoke all on function public.set_subagent_user_links(uuid, uuid[])
  from public, anon;
grant execute on function public.set_subagent_user_links(uuid, uuid[])
  to authenticated;

create policy "profiles_self_select"
  on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "subagent_user_links_owner_select"
  on public.subagent_user_links
  for select to authenticated
  using ((select public.can_manage_users()));
create policy "subagent_user_links_self_select"
  on public.subagent_user_links
  for select to authenticated
  using (
    user_id = (select auth.uid())
    and status = 'active'
  );

create policy "subagents_linked_select"
  on public.subagents
  for select to authenticated
  using ((select public.can_access_subagent(id)));

create policy "daily_settlements_linked_select"
  on public.daily_settlements
  for select to authenticated
  using ((select public.can_access_subagent(subagent_id)));

create policy "settlement_payments_linked_select"
  on public.settlement_payments
  for select to authenticated
  using (
    exists (
      select 1
      from public.daily_settlements as settlement
      where settlement.id = settlement_payments.settlement_id
        and (select public.can_access_subagent(settlement.subagent_id))
    )
  );

create policy "subagent_account_movements_linked_select"
  on public.subagent_account_movements
  for select to authenticated
  using ((select public.can_access_subagent(subagent_id)));

create policy "business_days_linked_select"
  on public.business_days
  for select to authenticated
  using (
    exists (
      select 1
      from public.daily_settlements as settlement
      where settlement.business_day_id = business_days.id
        and (select public.can_access_subagent(settlement.subagent_id))
    )
    or exists (
      select 1
      from public.subagent_account_movements as movement
      where movement.business_day_id = business_days.id
        and (select public.can_access_subagent(movement.subagent_id))
    )
  );

comment on table public.subagent_user_links is
  'Vincula cuentas externas con los Subagentes o máquinas que pueden consultar.';
comment on function public.can_access_subagent(uuid) is
  'Autoriza lectura externa únicamente para vínculos activos del usuario autenticado.';
