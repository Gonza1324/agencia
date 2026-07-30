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
- Rendiciones anuladas no bloquean una nueva rendición para la misma fecha.
- Deuda monetaria solo existe cuando se cargó `expected_amount`.
- RLS inicial permite gestión completa solo a `owner_admin`.
