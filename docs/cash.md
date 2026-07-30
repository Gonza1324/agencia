# Caja

La Caja usa un libro de movimientos. Los saldos de efectivo, banco y total se
calculan desde movimientos activos y nunca se editan directamente.

## Operaciones

- Ingreso: suma a la cuenta y a los ingresos operativos.
- Egreso: resta de la cuenta y de la ganancia operativa.
- Retiro: resta disponibilidad, exige dueño y no reduce ganancia operativa.
- Ajuste: puede sumar o restar y exige una nota.
- Transferencia: crea una salida y una entrada enlazadas; no cambia el total.

Los egresos, retiros, ajustes de salida y transferencias se rechazan cuando el
saldo de la cuenta origen es insuficiente.

## Concurrencia

`public.create_manual_cash_movement(...)` bloquea las cuentas afectadas antes
de validar el saldo. En transferencias, las dos cuentas se bloquean siempre en
orden de identificador para evitar interbloqueos.

Las categorías del sistema están protegidas. Los usuarios pueden crear,
editar, activar e inactivar categorías propias.
