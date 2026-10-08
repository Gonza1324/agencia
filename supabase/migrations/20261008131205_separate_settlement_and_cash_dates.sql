create or replace function public.get_writable_current_business_day()
returns uuid
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  argentina_today date :=
    (now() at time zone 'America/Argentina/Buenos_Aires')::date;
  selected_business_day_id uuid;
  selected_status public.business_day_status;
begin
  if actor_id is null or not (select public.can_operate()) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if extract(isodow from argentina_today) = 7 then
    raise exception 'El domingo no es un día operativo'
      using errcode = '22023';
  end if;

  insert into public.business_days (
    date,
    is_working_day,
    opened_at,
    opened_by
  )
  values (
    argentina_today,
    true,
    now(),
    actor_id
  )
  on conflict (date) do nothing;

  select day.id, day.status
  into selected_business_day_id, selected_status
  from public.business_days as day
  where day.date = argentina_today
  for update;

  if selected_status = 'closed' then
    raise exception 'La caja del día de hoy está cerrada. Reabrila para registrar movimientos'
      using errcode = '55000';
  end if;

  return selected_business_day_id;
end;
$$;

comment on function public.get_writable_current_business_day() is
  'Obtiene la caja abierta del día actual en Argentina para contabilizar dinero recibido hoy.';

revoke all on function public.get_writable_current_business_day()
  from public, anon;
grant execute on function public.get_writable_current_business_day()
  to authenticated;

do $migration$
declare
  current_definition text;
  updated_definition text;
  previous_block text :=
    'insert into public.business_days (
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
  where date = p_settlement_date;';
begin
  select pg_get_functiondef(
    'public.create_daily_settlement(date, uuid, numeric, numeric, numeric, numeric, numeric, numeric, text)'::regprocedure
  )
  into current_definition;

  updated_definition := replace(
    current_definition,
    previous_block,
    'business_day_id := public.get_writable_current_business_day();'
  );

  if updated_definition = current_definition then
    raise exception 'No se encontró el bloque contable de la rendición de Subagente';
  end if;

  execute updated_definition;
end;
$migration$;

do $migration$
declare
  current_definition text;
  updated_definition text;
  previous_block text :=
    'insert into public.business_days (date, is_working_day, opened_at, opened_by)
  values (p_settlement_date, true, now(), actor_id)
  on conflict (date) do nothing;

  select id into business_day_id
  from public.business_days where date = p_settlement_date;';
begin
  select pg_get_functiondef(
    'public.create_maquinola_settlement(date, uuid, numeric, numeric, numeric, numeric, text)'::regprocedure
  )
  into current_definition;

  updated_definition := replace(
    current_definition,
    previous_block,
    'business_day_id := public.get_writable_current_business_day();'
  );

  if updated_definition = current_definition then
    raise exception 'No se encontró el bloque contable del cierre de Maquinola';
  end if;

  execute updated_definition;
end;
$migration$;

comment on column public.daily_settlements.business_day_id is
  'Caja en la que ingresó el dinero; puede diferir de settlement_date cuando se carga una rendición atrasada.';

comment on column public.maquinola_settlements.business_day_id is
  'Caja en la que ingresó el dinero; puede diferir de settlement_date cuando se carga un cierre atrasado.';
