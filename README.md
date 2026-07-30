# Control Agencia

Web app interna para una Agencia Oficial de Lotería Correntina.

Slug técnico: `loteria-control`.

## Fase actual

Fase 1.7 — Cuenta corriente de Subagentes.

La base incluye:

- Next.js App Router con TypeScript estricto.
- Tailwind CSS y componentes UI base.
- Shell administrativo desktop-first y responsive.
- Rutas iniciales de Fase 1.
- Clientes Supabase para browser, server y middleware.
- Migración inicial de PostgreSQL/Supabase con RLS.
- Seeds de cuentas de caja y categorías iniciales.
- Validaciones iniciales con Zod.
- Login y logout reales con Supabase Auth.
- Protección de rutas para perfiles `owner_admin` activos.
- Tipos de base de datos generados desde el proyecto Supabase.
- Listado, búsqueda y filtros de Subagentes.
- Alta, edición, activación e inactivación sin borrado físico.
- Detalle con estado, notas y actividad reciente.
- Auditoría automática de cambios de Subagentes desde PostgreSQL.
- Día operativo automático de lunes a sábado en horario argentino.
- Dashboard real con rendiciones, pendientes y alertas progresivas.
- Domingos sin apertura ni pendientes nuevos.
- Rendiciones con efectivo, transferencia o pago mixto.
- Movimientos de caja y deuda conocida generados transaccionalmente.
- Correcciones y anulaciones auditadas sin borrado físico.
- Saldos separados de efectivo, banco y total.
- Ingresos, egresos, retiros, ajustes y transferencias internas.
- Ganancia operativa y categorías configurables.
- Saldo real y libro de movimientos por Subagente.
- Pagos de deuda parciales o totales conectados con Caja.
- Ajustes, compensaciones y anulaciones con motivo y auditoría.
- Prevención transaccional de adelantos y saldos a favor.

## Requisitos

- Node.js 22 o superior.
- npm 11 o superior.
- Proyecto Supabase para auth y base de datos.
- Supabase CLI opcional para desarrollo local.

## Variables de entorno

Copiar `.env.example` a `.env.local` y completar:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` acepta la clave publicable moderna del
proyecto. La aplicación no necesita una clave `service_role`.

## Comandos

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
```

## Supabase

Las migraciones versionadas están en:

```bash
supabase/migrations/
```

Aplicar con Supabase CLI cuando el proyecto esté vinculado:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Para desarrollo local:

```bash
npx supabase start
npx supabase db reset
```

## Dueños iniciales

En Fase 1 solo se usan usuarios con rol `owner_admin`.

Después de crear usuarios en Supabase Auth, crear su perfil en
`public.profiles` con el mismo `id` de `auth.users`:

- Juliana
- Gonzalo
- Agustina

El procedimiento seguro y la consulta de bootstrap están documentados en
[`docs/auth.md`](docs/auth.md).

## Próximas fases

1. Fase 1.8: cierre diario.
2. Fase 1.9: reportes.
3. Fase 1.10: pulido, tests y documentación final.
