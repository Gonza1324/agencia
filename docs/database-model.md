# Modelo de Datos

La base está diseñada para Supabase/PostgreSQL con RLS desde el inicio.

## Tablas principales

- `profiles`: usuarios internos y roles.
- `subagents`: Subagentes y código de máquina.
- `business_days`: días operativos lunes a sábado.
- `daily_settlements`: rendiciones diarias.
- `settlement_payments`: pagos de una rendición por efectivo o banco.
- `subagent_account_movements`: cuenta corriente de Subagentes.
- `cash_accounts`: Caja efectivo y Banco.
- `cash_movements`: ingresos, egresos, retiros, ajustes y transferencias.
- `cash_categories`: categorías configurables.
- `cash_closures`: cierres diarios.
- `attachments`: preparación para capturas y comprobantes.
- `audit_logs`: auditoría de acciones sensibles.

## Decisiones

- Los saldos se calculan desde movimientos, no desde un único campo editable.
- `machine_code` es único solo entre Subagentes activos.
- Las altas, ediciones y activaciones/inactivaciones de Subagentes generan
  registros de auditoría mediante un trigger de PostgreSQL.
- El día operativo actual se crea de manera idempotente y el dashboard se
  obtiene mediante funciones PostgreSQL protegidas por RLS.
- Las rendiciones y todos sus efectos asociados se crean, reemplazan o anulan
  dentro de una única transacción PostgreSQL.
- Los saldos de Caja se derivan de movimientos activos; las transferencias
  internas se enlazan con `transfer_group_id`.
- El saldo de cada Subagente se deriva de débitos y créditos activos. Los pagos
  de deuda crean su ingreso de Caja en la misma transacción y nunca pueden
  generar saldo a favor.
- El cierre diario guarda una instantánea del arqueo. El estado de
  `business_days` bloquea escrituras operativas hasta una reapertura auditada.
- Rendiciones anuladas no bloquean una nueva rendición para la misma fecha.
- Deuda monetaria solo existe cuando se cargó `expected_amount`.
- RLS inicial permite gestión completa solo a `owner_admin`.
