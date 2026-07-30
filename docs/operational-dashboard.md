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
