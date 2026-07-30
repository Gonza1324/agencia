# Control Agencia

Web app interna para una Agencia Oficial de Lotería Correntina.

Slug técnico: `loteria-control`.

## Fase actual

Fase 1.3 — ABM de Subagentes.

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

1. Fase 1.4: día operativo y dashboard con datos reales.
2. Fase 1.5: carga de rendiciones y movimientos asociados.
3. Fase 1.6: caja, saldos y movimientos manuales.
