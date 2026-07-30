# Cuenta corriente de Subagentes

Cada Subagente tiene un libro de movimientos del que se calcula su saldo. Un
saldo positivo representa deuda vigente; el sistema no permite que un crédito
genere saldo a favor.

## Movimientos

- Deuda por rendición: débito automático creado por una rendición incompleta.
- Pago de deuda: crédito manual que crea a la vez un ingreso en Caja.
- Ajuste positivo: aumenta la deuda y exige un motivo.
- Ajuste negativo: reduce la deuda y exige un motivo.
- Compensación: aplica un crédito sin ingreso de dinero y exige un motivo.

Los pagos, ajustes reductores y compensaciones pueden ser parciales o totales,
pero nunca superar la deuda vigente.

## Integridad y auditoría

`public.create_subagent_account_movement(...)` bloquea el Subagente durante el
cálculo y la escritura para serializar cambios concurrentes del saldo. Los
pagos de deuda y su ingreso asociado en Caja se confirman en una única
transacción.

Los movimientos no se borran. Una anulación conserva el asiento, el motivo, el
usuario y la fecha; también anula el ingreso de Caja relacionado. Las deudas
originadas por una rendición solo pueden anularse desde esa rendición.
