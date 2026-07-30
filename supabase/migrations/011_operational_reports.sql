create index subagent_account_movements_active_business_day_idx
  on public.subagent_account_movements (business_day_id, subagent_id)
  where voided_at is null;

create or replace function public.get_daily_report(
  p_date date
)
returns table (
  total_income numeric,
  cash_income numeric,
  bank_income numeric,
  total_expense numeric,
  total_withdrawals numeric,
  total_available numeric,
  pending_subagents bigint,
  late_subagents bigint,
  indebted_subagents bigint,
  settlements_count bigint,
  cash_difference numeric,
  bank_difference numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  with day_cash as (
    select
      coalesce(
        sum(movement.amount) filter (
          where movement.type = 'income'
            and movement.direction = 'in'
        ),
        0
      ) as income,
      coalesce(
        sum(movement.amount) filter (
          where movement.type = 'income'
            and movement.direction = 'in'
            and account.type = 'cash'
        ),
        0
      ) as cash_income,
      coalesce(
        sum(movement.amount) filter (
          where movement.type = 'income'
            and movement.direction = 'in'
            and account.type = 'bank'
        ),
        0
      ) as bank_income,
      coalesce(
        sum(movement.amount) filter (
          where movement.type = 'expense'
            and movement.direction = 'out'
        ),
        0
      ) as expense,
      coalesce(
        sum(movement.amount) filter (
          where movement.type = 'withdrawal'
            and movement.direction = 'out'
        ),
        0
      ) as withdrawals
    from public.cash_movements as movement
    join public.business_days as day
      on day.id = movement.business_day_id
    join public.cash_accounts as account
      on account.id = movement.cash_account_id
    where day.date = p_date
      and movement.voided_at is null
  ),
  available as (
    select coalesce(
      sum(
        case movement.direction
          when 'in' then movement.amount
          else -movement.amount
        end
      ),
      0
    ) as amount
    from public.cash_movements as movement
    join public.business_days as day
      on day.id = movement.business_day_id
    where day.date <= p_date
      and movement.voided_at is null
  ),
  dashboard as (
    select *
    from public.get_subagent_dashboard(p_date)
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
      ) <= p_date
    group by movement.subagent_id
  ),
  settlement_total as (
    select count(*) as value
    from public.daily_settlements as settlement
    where settlement.settlement_date = p_date
      and settlement.voided_at is null
  ),
  selected_closure as (
    select closure.cash_difference, closure.bank_difference
    from public.cash_closures as closure
    join public.business_days as day
      on day.id = closure.business_day_id
    where day.date = p_date
  )
  select
    day_cash.income,
    day_cash.cash_income,
    day_cash.bank_income,
    day_cash.expense,
    day_cash.withdrawals,
    available.amount,
    (
      select count(*)
      from dashboard
      where dashboard_status = 'pending'
    ),
    (
      select count(*)
      from dashboard
      where dashboard_status in ('late', 'late_serious', 'late_critical')
    ),
    (
      select count(*)
      from balances
      where balance > 0
    ),
    settlement_total.value,
    coalesce(selected_closure.cash_difference, 0),
    coalesce(selected_closure.bank_difference, 0)
  from day_cash
  cross join available
  cross join settlement_total
  left join selected_closure on true;
$$;

revoke all on function public.get_daily_report(date) from public;
revoke all on function public.get_daily_report(date) from anon;
grant execute on function public.get_daily_report(date) to authenticated;

create or replace function public.get_period_report(
  p_from date,
  p_to date
)
returns table (
  total_income numeric,
  total_expense numeric,
  operating_profit numeric,
  total_withdrawals numeric,
  ending_cash_balance numeric,
  ending_bank_balance numeric,
  ending_total_balance numeric,
  outstanding_debt numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  with period_cash as (
    select
      coalesce(
        sum(movement.amount) filter (
          where movement.type = 'income'
            and movement.direction = 'in'
        ),
        0
      ) as income,
      coalesce(
        sum(movement.amount) filter (
          where movement.type = 'expense'
            and movement.direction = 'out'
        ),
        0
      ) as expense,
      coalesce(
        sum(movement.amount) filter (
          where movement.type = 'withdrawal'
            and movement.direction = 'out'
        ),
        0
      ) as withdrawals
    from public.cash_movements as movement
    join public.business_days as day
      on day.id = movement.business_day_id
    where day.date between p_from and p_to
      and movement.voided_at is null
  ),
  ending_balances as (
    select
      account.type,
      coalesce(
        sum(
          case movement.direction
            when 'in' then movement.amount
            else -movement.amount
          end
        ),
        0
      ) as balance
    from public.cash_accounts as account
    left join public.cash_movements as movement
      on movement.cash_account_id = account.id
      and movement.voided_at is null
      and exists (
        select 1
        from public.business_days as day
        where day.id = movement.business_day_id
          and day.date <= p_to
      )
    group by account.type
  ),
  account_balances as (
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
  )
  select
    period_cash.income,
    period_cash.expense,
    period_cash.income - period_cash.expense,
    period_cash.withdrawals,
    coalesce(
      (select balance from ending_balances where type = 'cash'),
      0
    ),
    coalesce(
      (select balance from ending_balances where type = 'bank'),
      0
    ),
    coalesce((select sum(balance) from ending_balances), 0),
    coalesce((select sum(greatest(balance, 0)) from account_balances), 0)
  from period_cash;
$$;

revoke all on function public.get_period_report(date, date) from public;
revoke all on function public.get_period_report(date, date) from anon;
grant execute on function public.get_period_report(date, date)
  to authenticated;

create or replace function public.get_report_daily_series(
  p_from date,
  p_to date
)
returns table (
  report_date date,
  is_working_day boolean,
  income numeric,
  expense numeric,
  operating_profit numeric,
  withdrawals numeric,
  closing_cash_balance numeric,
  closing_bank_balance numeric,
  closing_total_balance numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  with calendar as (
    select generated_date::date as report_date
    from generate_series(p_from, p_to, interval '1 day') as generated_date
  ),
  movement_days as (
    select
      day.date,
      account.type as account_type,
      sum(
        case movement.direction
          when 'in' then movement.amount
          else -movement.amount
        end
      ) as balance_change,
      coalesce(
        sum(movement.amount) filter (
          where movement.type = 'income'
            and movement.direction = 'in'
        ),
        0
      ) as income,
      coalesce(
        sum(movement.amount) filter (
          where movement.type = 'expense'
            and movement.direction = 'out'
        ),
        0
      ) as expense,
      coalesce(
        sum(movement.amount) filter (
          where movement.type = 'withdrawal'
            and movement.direction = 'out'
        ),
        0
      ) as withdrawals
    from public.cash_movements as movement
    join public.business_days as day
      on day.id = movement.business_day_id
    join public.cash_accounts as account
      on account.id = movement.cash_account_id
    where day.date between p_from and p_to
      and movement.voided_at is null
    group by day.date, account.type
  ),
  opening_balances as (
    select
      account.type,
      coalesce(
        sum(
          case movement.direction
            when 'in' then movement.amount
            else -movement.amount
          end
        ),
        0
      ) as amount
    from public.cash_accounts as account
    left join public.cash_movements as movement
      on movement.cash_account_id = account.id
      and movement.voided_at is null
      and exists (
        select 1
        from public.business_days as day
        where day.id = movement.business_day_id
          and day.date < p_from
      )
    group by account.type
  ),
  daily as (
    select
      calendar.report_date,
      coalesce(
        sum(movement_days.income),
        0
      ) as income,
      coalesce(
        sum(movement_days.expense),
        0
      ) as expense,
      coalesce(
        sum(movement_days.withdrawals),
        0
      ) as withdrawals,
      coalesce(
        sum(movement_days.balance_change) filter (
          where movement_days.account_type = 'cash'
        ),
        0
      ) as cash_change,
      coalesce(
        sum(movement_days.balance_change) filter (
          where movement_days.account_type = 'bank'
        ),
        0
      ) as bank_change
    from calendar
    left join movement_days
      on movement_days.date = calendar.report_date
    group by calendar.report_date
  )
  select
    daily.report_date,
    extract(isodow from daily.report_date) < 7,
    daily.income,
    daily.expense,
    daily.income - daily.expense,
    daily.withdrawals,
    coalesce(
      (select amount from opening_balances where type = 'cash'),
      0
    ) + sum(daily.cash_change) over (order by daily.report_date),
    coalesce(
      (select amount from opening_balances where type = 'bank'),
      0
    ) + sum(daily.bank_change) over (order by daily.report_date),
    coalesce((select sum(amount) from opening_balances), 0)
      + sum(daily.cash_change + daily.bank_change)
        over (order by daily.report_date)
  from daily
  order by daily.report_date;
$$;

revoke all on function public.get_report_daily_series(date, date)
  from public;
revoke all on function public.get_report_daily_series(date, date)
  from anon;
grant execute on function public.get_report_daily_series(date, date)
  to authenticated;

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
    coalesce(settlement_totals.received, 0),
    coalesce(settlement_totals.settlements, 0),
    greatest(coalesce(balances.balance, 0), 0),
    coalesce(missing.value, 0)
  from public.subagents as subagent
  left join settlement_totals
    on settlement_totals.subagent_id = subagent.id
  left join balances
    on balances.subagent_id = subagent.id
  left join missing
    on missing.subagent_id = subagent.id
  where settlement_totals.subagent_id is not null
    or coalesce(balances.balance, 0) > 0
    or coalesce(missing.value, 0) > 0
  order by
    coalesce(settlement_totals.received, 0) desc,
    subagent.name;
$$;

revoke all on function public.get_report_subagent_ranking(date, date)
  from public;
revoke all on function public.get_report_subagent_ranking(date, date)
  from anon;
grant execute on function public.get_report_subagent_ranking(date, date)
  to authenticated;

create or replace function public.get_report_owner_withdrawals(
  p_from date,
  p_to date
)
returns table (
  owner_name text,
  withdrawal_amount numeric,
  withdrawals_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    movement.owner_name,
    sum(movement.amount),
    count(*)
  from public.cash_movements as movement
  join public.business_days as day
    on day.id = movement.business_day_id
  where day.date between p_from and p_to
    and movement.type = 'withdrawal'
    and movement.direction = 'out'
    and movement.voided_at is null
    and movement.owner_name is not null
  group by movement.owner_name
  order by sum(movement.amount) desc, movement.owner_name;
$$;

revoke all on function public.get_report_owner_withdrawals(date, date)
  from public;
revoke all on function public.get_report_owner_withdrawals(date, date)
  from anon;
grant execute on function public.get_report_owner_withdrawals(date, date)
  to authenticated;
