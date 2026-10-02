alter table public.user_alert_preferences
  add column overdue_lookback_days smallint not null default 45,
  add constraint user_alert_preferences_overdue_lookback_days_range
    check (overdue_lookback_days between 7 and 180);

drop function if exists public.set_user_alert_preferences(uuid, boolean, smallint);

create function public.set_user_alert_preferences(
  p_user_id uuid,
  p_overdue_alerts_enabled boolean,
  p_overdue_min_days smallint,
  p_overdue_lookback_days smallint
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  target_role public.user_role;
  previous_values jsonb;
begin
  if actor_id is null or not (select public.can_manage_users()) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if p_overdue_min_days not between 1 and 30 then
    raise exception 'Los días de aviso deben estar entre 1 y 30'
      using errcode = '22023';
  end if;

  if p_overdue_lookback_days not between 7 and 180 then
    raise exception 'El período de revisión debe estar entre 7 y 180 días'
      using errcode = '22023';
  end if;

  select profile.role
  into target_role
  from public.profiles as profile
  where profile.id = p_user_id;

  if target_role is null then
    raise exception 'El usuario no existe' using errcode = '22023';
  end if;

  if target_role not in ('owner_admin', 'subagent') then
    raise exception 'El rol no admite alertas de Subagentes'
      using errcode = '22023';
  end if;

  select to_jsonb(preference)
  into previous_values
  from public.user_alert_preferences as preference
  where preference.user_id = p_user_id;

  insert into public.user_alert_preferences (
    user_id,
    overdue_alerts_enabled,
    overdue_min_days,
    overdue_lookback_days,
    updated_by
  )
  values (
    p_user_id,
    p_overdue_alerts_enabled,
    p_overdue_min_days,
    p_overdue_lookback_days,
    actor_id
  )
  on conflict (user_id)
  do update set
    overdue_alerts_enabled = excluded.overdue_alerts_enabled,
    overdue_min_days = excluded.overdue_min_days,
    overdue_lookback_days = excluded.overdue_lookback_days,
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
    'set_user_alert_preferences',
    previous_values,
    jsonb_build_object(
      'overdue_alerts_enabled', p_overdue_alerts_enabled,
      'overdue_min_days', p_overdue_min_days,
      'overdue_lookback_days', p_overdue_lookback_days
    )
  );
end;
$$;

revoke all on function public.set_user_alert_preferences(
  uuid,
  boolean,
  smallint,
  smallint
) from public, anon;
grant execute on function public.set_user_alert_preferences(
  uuid,
  boolean,
  smallint,
  smallint
) to authenticated;

comment on column public.user_alert_preferences.overdue_lookback_days is
  'Cantidad de días calendario anteriores revisados para detectar cierres faltantes.';
