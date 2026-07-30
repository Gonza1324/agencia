do $migration$
declare
  current_definition text;
  corrected_definition text;
begin
  select pg_get_functiondef(
    'public.create_daily_settlement(date, uuid, numeric, numeric, numeric, numeric, numeric, numeric, text)'::regprocedure
  )
  into current_definition;

  corrected_definition := replace(
    current_definition,
    $old$then 'settled_with_debt'
      else 'settled'$old$,
    $new$then 'settled_with_debt'::public.settlement_status
      else 'settled'::public.settlement_status$new$
  );

  execute corrected_definition;
end;
$migration$;
