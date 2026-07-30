create or replace function public.get_report_subagent_ranking(
  p_from date,
  p_to date
)
returns table (
  subagent_id uuid,
  subagent_name text,
  machine_code text,
  received_amount numeric,
  settlements_count bigint,
  outstanding_balance numeric,
  missing_days bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with settlement_totals as (
    select
      settlement.subagent_id,
      sum(settlement.received_amount) as received,
      count(*) as settlements
    from public.daily_settlements as settlement
    where settlement.settlement_date between p_from and p_to
      and settlement.voided_at is null
    group by settlement.subagent_id
  ),
  debt_payment_totals as (
    select
      movement.subagent_id,
      sum(movement.amount) as received
    from public.subagent_account_movements as movement
    join public.business_days as day
      on day.id = movement.business_day_id
    where day.date between p_from and p_to
      and movement.type = 'debt_payment'
      and movement.direction = 'credit'
      and movement.voided_at is null
    group by movement.subagent_id
  ),
  balances as (
    select
      movement.subagent_id,
      sum(
        case movement.direction
          when 'debit' then movement.amount
          else -movement.amount
        end
      ) as balance
    from public.subagent_account_movements as movement
    left join public.business_days as day
      on day.id = movement.business_day_id
    where movement.voided_at is null
      and coalesce(
        day.date,
        timezone(
          'America/Argentina/Buenos_Aires',
          movement.created_at
        )::date
      ) <= p_to
    group by movement.subagent_id
  ),
  missing as (
    select
      subagent.id as subagent_id,
      count(*) filter (where settlement.id is null) as value
    from public.subagents as subagent
    cross join lateral generate_series(
      greatest(
        p_from,
        timezone(
          'America/Argentina/Buenos_Aires',
          subagent.created_at
        )::date
      ),
      least(
        p_to,
        timezone('America/Argentina/Buenos_Aires', now())::date
      ),
      interval '1 day'
    ) as expected_date
    left join public.daily_settlements as settlement
      on settlement.subagent_id = subagent.id
      and settlement.settlement_date = expected_date::date
      and settlement.voided_at is null
    where subagent.status = 'active'
      and extract(isodow from expected_date) < 7
    group by subagent.id
  )
  select
    subagent.id,
    subagent.name,
    subagent.machine_code,
    coalesce(settlement_totals.received, 0)
      + coalesce(debt_payment_totals.received, 0),
    coalesce(settlement_totals.settlements, 0),
    greatest(coalesce(balances.balance, 0), 0),
    coalesce(missing.value, 0)
  from public.subagents as subagent
  left join settlement_totals
    on settlement_totals.subagent_id = subagent.id
  left join debt_payment_totals
    on debt_payment_totals.subagent_id = subagent.id
  left join balances
    on balances.subagent_id = subagent.id
  left join missing
    on missing.subagent_id = subagent.id
  where settlement_totals.subagent_id is not null
    or debt_payment_totals.subagent_id is not null
    or coalesce(balances.balance, 0) > 0
    or coalesce(missing.value, 0) > 0
  order by
    (
      coalesce(settlement_totals.received, 0)
        + coalesce(debt_payment_totals.received, 0)
    ) desc,
    subagent.name;
$$;

revoke all on function public.get_report_subagent_ranking(date, date)
  from public;
revoke all on function public.get_report_subagent_ranking(date, date)
  from anon;
grant execute on function public.get_report_subagent_ranking(date, date)
  to authenticated;
