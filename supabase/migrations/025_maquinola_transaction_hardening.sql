alter function public.create_maquinola_settlement(
  date, uuid, numeric, numeric, numeric, numeric, text
) security definer;
alter function public.void_maquinola_settlement(uuid, text)
  security definer;
alter function public.replace_maquinola_settlement(
  uuid, date, uuid, numeric, numeric, numeric, numeric, text
) security definer;

revoke insert, update on table public.maquinola_settlements
  from authenticated;
revoke insert, update on table public.maquinola_settlement_payments
  from authenticated;

drop policy if exists "maquinola_settlements_operator_insert"
  on public.maquinola_settlements;
drop policy if exists "maquinola_settlements_owner_update"
  on public.maquinola_settlements;
drop policy if exists "maquinola_payments_operator_insert"
  on public.maquinola_settlement_payments;
drop policy if exists "maquinola_payments_owner_update"
  on public.maquinola_settlement_payments;

comment on function public.create_maquinola_settlement(
  date, uuid, numeric, numeric, numeric, numeric, text
) is
  'Registra atómicamente cierre, pagos, Caja y cuenta corriente; valida rol operador.';
