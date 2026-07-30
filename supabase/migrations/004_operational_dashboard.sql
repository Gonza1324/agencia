create index daily_settlements_active_date_subagent_idx
  on public.daily_settlements (settlement_date, subagent_id)
  where voided_at is null;

create or replace function public.ensure_current_business_day()
returns setof public.business_days
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  operational_date date :=
    timezone('America/Argentina/Buenos_Aires', now())::date;
begin
  if extract(isodow from operational_date) = 7 then
    return;
  end if;

  insert into public.business_days (
    date,
    is_working_day,
    opened_at,
    opened_by
  )
  values (
    operational_date,
    true,
    now(),
    (select auth.uid())
  )
  on conflict (date) do nothing;

  return query
    select business_day.*
    from public.business_days as business_day
    where business_day.date = operational_date;
end;
$$;

revoke all on function public.ensure_current_business_day() from public;
revoke all on function public.ensure_current_business_day() from anon;
grant execute on function public.ensure_current_business_day() to authenticated;

create or replace function public.get_subagent_dashboard(
  p_date date default timezone('America/Argentina/Buenos_Aires', now())::date
)
returns table (
  subagent_id uuid,
  subagent_name text,
  machine_code text,
  dashboard_status text,
  today_settlement_id uuid,
  received_today numeric,
  debt_today numeric,
  known_balance numeric,
  last_settlement_date date,
  delay_days integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  with active_subagents as (
    select
      subagent.id,
      subagent.name,
      subagent.machine_code,
      coalesce(
        (
          select max(audit.created_at)
          from public.audit_logs as audit
          where audit.entity_type = 'subagent'
            and audit.entity_id = subagent.id
            and audit.action = 'activate_subagent'
        ),
        subagent.created_at
      ) as obligation_started_at
    from public.subagents as subagent
    where subagent.status = 'active'
  ),
  account_balances as (
    select
      movement.subagent_id,
      coalesce(
        sum(
          case movement.direction
            when 'debit' then movement.amount
            else -movement.amount
          end
        ),
        0
      ) as balance
    from public.subagent_account_movements as movement
    where movement.voided_at is null
    group by movement.subagent_id
  )
  select
    subagent.id as subagent_id,
    subagent.name as subagent_name,
    subagent.machine_code,
    case
      when today.status is not null then today.status::text
      when missing_days.value >= 3 then 'late_critical'
      when missing_days.value = 2 then 'late_serious'
      when missing_days.value = 1 then 'late'
      when extract(isodow from p_date) = 7 then 'non_working'
      else 'pending'
    end as dashboard_status,
    today.id as today_settlement_id,
    coalesce(today.received_amount, 0) as received_today,
    coalesce(today.debt_amount, 0) as debt_today,
    coalesce(account_balance.balance, 0) as known_balance,
    latest.settlement_date as last_settlement_date,
    missing_days.value as delay_days
  from active_subagents as subagent
  left join account_balances as account_balance
    on account_balance.subagent_id = subagent.id
  left join lateral (
    select
      settlement.id,
      settlement.status,
      settlement.received_amount,
      settlement.debt_amount
    from public.daily_settlements as settlement
    where settlement.subagent_id = subagent.id
      and settlement.settlement_date = p_date
      and settlement.voided_at is null
    limit 1
  ) as today on true
  left join lateral (
    select settlement.settlement_date
    from public.daily_settlements as settlement
    where settlement.subagent_id = subagent.id
      and settlement.settlement_date <= p_date
      and settlement.voided_at is null
    order by settlement.settlement_date desc
    limit 1
  ) as latest on true
  cross join lateral (
    select count(*)::integer as value
    from generate_series(
      greatest(
        coalesce(
          latest.settlement_date + 1,
          timezone(
            'America/Argentina/Buenos_Aires',
            subagent.obligation_started_at
          )::date
        ),
        timezone(
          'America/Argentina/Buenos_Aires',
          subagent.obligation_started_at
        )::date
      ),
      p_date - 1,
      interval '1 day'
    ) as missing_date
    where extract(isodow from missing_date) < 7
  ) as missing_days
  order by
    case
      when today.status is not null then 5
      when missing_days.value >= 3 then 1
      when missing_days.value = 2 then 2
      when missing_days.value = 1 then 3
      else 4
    end,
    subagent.name;
$$;

revoke all on function public.get_subagent_dashboard(date) from public;
revoke all on function public.get_subagent_dashboard(date) from anon;
grant execute on function public.get_subagent_dashboard(date) to authenticated;
