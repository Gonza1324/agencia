# Cierre diario

El cierre diario compara los saldos derivados del libro de Caja con los
importes informados por los dueños.

## Resumen

- Efectivo esperado: saldo acumulado de las cuentas de efectivo hasta la fecha.
- Banco esperado: saldo acumulado de las cuentas bancarias hasta la fecha.
- Ingresos, egresos y retiros: movimientos vigentes del día seleccionado.
- Total disponible: suma del efectivo y banco esperados.

La diferencia se calcula como `informado - esperado`. Si el efectivo contado o
el banco informado no coincide con lo esperado, la nota de cierre es
obligatoria.

## Bloqueo operativo

El cierre y su arqueo se crean en una única transacción. El día operativo se
bloquea mientras se calculan los importes para incluir cualquier movimiento
concurrente ya iniciado.

Una vez cerrado, triggers de PostgreSQL rechazan nuevas rendiciones,
movimientos de Caja y movimientos de cuenta corriente para esa fecha. Esto
también impide correcciones o anulaciones hasta que el día sea reabierto.

## Reapertura

Todos los usuarios `owner_admin` pueden reabrir un día cerrado ingresando un
motivo obligatorio. La reapertura habilita nuevamente las operaciones para la
fecha y conserva en auditoría quién la realizó, cuándo y por qué.

Al volver a cerrar, el sistema recalcula el arqueo completo y actualiza la
instantánea del cierre.
