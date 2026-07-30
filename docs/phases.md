# Fases del Proyecto

## Fase 0 — Setup y arquitectura

Base técnica, estructura de carpetas, documentación, Supabase preparado y layout.

## Fase 1.1 — Auth y usuarios

Login, logout, rutas protegidas, perfiles y rol `owner_admin`.

Estado: completa. Los primeros usuarios `owner_admin` fueron provisionados
fuera del repositorio y verificados contra Supabase Auth y RLS.

## Fase 1.2 — Modelo de datos base

Verificación de migraciones, RLS, seeds y generación de tipos Supabase.

Estado: completa.

## Fase 1.3 — Subagentes

Listado, alta, edición, activación, inactivación y detalle básico.

Estado: completa. Incluye búsqueda y filtros, validación compartida, estados
vacíos, confirmaciones y auditoría automática de altas y cambios.

## Fase 1.4 — Día operativo y dashboard base

Determinación de día operativo, pendientes automáticos y alertas.

Estado: completa. La apertura es automática de lunes a sábado, los domingos
no generan pendientes nuevos y el dashboard calcula estados y atrasos sobre
datos reales.

## Fase 1.5 — Rendiciones

Carga de rendición, medios de pago, deuda conocida, movimientos de caja y auditoría.

Estado: completa. Incluye listado, alta, corrección versionada, anulación,
pagos en efectivo/banco/mixtos y generación transaccional de caja y deuda.

## Fase 1.6 — Caja

Saldos, ingresos, egresos, retiros, ajustes y categorías.

Estado: completa. Incluye saldos por cuenta, ganancia operativa, movimientos
manuales, transferencias atómicas, prevención de sobregiros y categorías
configurables.

## Fase 1.7 — Cuenta corriente

Saldo por Subagente, pagos de deuda, ajustes, compensaciones e historial.

## Fase 1.8 — Cierre diario

Cierre, diferencias, nota obligatoria y reapertura auditada.

## Fase 1.9 — Reportes

Reportes diarios, semanales y mensuales básicos.

## Fase 1.10 — Pulido

Responsive, estados vacíos, errores, confirmaciones, tests y documentación final.
