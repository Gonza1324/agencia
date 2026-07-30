# Rendiciones

Las rendiciones se registran mediante funciones PostgreSQL transaccionales.
Esto garantiza que la rendición, sus medios de pago, los ingresos de caja, la
deuda conocida y la auditoría se confirmen o reviertan juntos.

## Reglas

- Cada Subagente puede tener una sola rendición activa por fecha.
- Los domingos no admiten rendiciones.
- El pago puede ser efectivo, transferencia o mixto.
- Los pagos mixtos generan un movimiento para Caja efectivo y otro para Banco.
- La deuda se genera únicamente cuando existe un importe esperado y el
  recibido es menor.
- El importe recibido no puede superar el esperado porque no se admiten
  adelantos.
- Una corrección anula la versión anterior y crea una nueva dentro de la misma
  transacción.
- Una anulación requiere motivo y marca como anulados todos los movimientos
  asociados, sin borrar el historial.

## Funciones

- `public.create_daily_settlement(...)`
- `public.replace_daily_settlement(...)`
- `public.void_daily_settlement(uuid, text)`
