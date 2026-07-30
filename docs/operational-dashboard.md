# Día Operativo y Dashboard

La fecha operativa se determina siempre con la zona horaria
`America/Argentina/Buenos_Aires`.

## Reglas

- Lunes a sábado son días operativos, incluso cuando son feriados.
- El domingo no crea un registro en `business_days` ni genera un pendiente
  nuevo.
- La apertura del día es automática e idempotente: recargar el dashboard no
  duplica registros.
- Un Subagente activo sin rendición del día aparece como pendiente.
- Los atrasos cuentan días operativos consecutivos sin rendición y excluyen
  domingos.
- Una reactivación inicia un nuevo período de obligación y no suma los días
  en que el Subagente estuvo inactivo.
- La ausencia de una rendición genera una alerta, pero nunca una deuda
  monetaria automática.

## Estados visuales

- `settled`: rindió.
- `settled_with_debt`: rindió con deuda conocida.
- `pending`: pendiente del día.
- `late`: un día de atraso.
- `late_serious`: dos días de atraso.
- `late_critical`: tres o más días de atraso.
- `non_working`: domingo sin operación.

Los cálculos se resuelven con la función
`public.get_subagent_dashboard(date)`. El día actual se asegura mediante
`public.ensure_current_business_day()`.

El dashboard también muestra si la Caja sigue abierta, fue reabierta o si el
último cierre registró diferencias, con acceso directo al cierre diario.

## Previsión de gastos

El dashboard muestra las obligaciones vencidas y las que vencen dentro de los
próximos siete días. Compara la suma de esos compromisos con el saldo total
vigente de Caja y presenta:

- cantidad e importe vencido;
- cantidad e importe próximo;
- saldo estimado luego de cubrir los gastos o faltante de Caja;
- los cinco vencimientos más cercanos.

La previsión es informativa: no reserva dinero ni modifica los saldos. Los
usuarios operativos pueden abrir una obligación pendiente desde el dashboard
para corregirla o gestionarla.

## Resumen financiero diario

El bloque `Caja de hoy` concentra:

- saldo actual de efectivo;
- saldo actual de banco;
- total disponible;
- gastos operativos del día;
- retiros del día;
- estado y diferencias del último cierre.

Los usuarios operativos tienen accesos rápidos para registrar una rendición,
crear un movimiento de Caja o abrir las cuentas corrientes. Los visores
reciben el mismo resumen sin acciones de escritura.
