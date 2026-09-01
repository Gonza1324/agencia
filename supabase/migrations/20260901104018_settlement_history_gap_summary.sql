create or replace function public.get_settlement_gap_summary(
  p_from date,
  p_to date
)
returns table (
  subagent_id uuid,
  subagent_name text,
  machine_code text,
  missing_days bigint,
  missing_dates date[]
)
language sql
stable
security invoker
set search_path = ''
as $$
  with expected_dates as (
    select
      subagent.id as subagent_id,
      subagent.name as subagent_name,
      subagent.machine_code,
      expected_date::date as expected_date
    from public.subagents as subagent
    cross join lateral generate_series(
      greatest(
        p_from,
        (subagent.created_at at time zone 'America/Argentina/Buenos_Aires')::date
      ),
      least(
        p_to,
        (now() at time zone 'America/Argentina/Buenos_Aires')::date - 1
      ),
      interval '1 day'
    ) as expected_date
    where subagent.status = 'active'
      and p_from <= p_to
      and extract(isodow from expected_date) between 1 and 6
  ),
  missing as (
    select expected.*
    from expected_dates as expected
    where not exists (
      select 1
      from public.daily_settlements as settlement
      where settlement.subagent_id = expected.subagent_id
        and settlement.settlement_date = expected.expected_date
        and settlement.status <> 'voided'
    )
  )
  select
    missing.subagent_id,
    missing.subagent_name,
    missing.machine_code,
    count(*) as missing_days,
    array_agg(missing.expected_date order by missing.expected_date desc) as missing_dates
  from missing
  group by missing.subagent_id, missing.subagent_name, missing.machine_code
  order by missing_days desc, missing.subagent_name;
$$;

revoke all on function public.get_settlement_gap_summary(date, date)
from public, anon;

grant execute on function public.get_settlement_gap_summary(date, date)
to authenticated;
