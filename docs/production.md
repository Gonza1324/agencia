# Producción

## Verificación previa

El comando único de control es:

```bash
npm run check
```

Ejecuta TypeScript, ESLint, tests unitarios y el build optimizado de Next.js.
Antes de desplegar también se verifica:

- `npm audit --omit=dev`;
- `npx supabase db lint --linked --level warning`;
- sincronización de migraciones con `npx supabase db push --dry-run`;
- navegación autenticada en desktop y mobile;
- respuesta de `/api/health`.

## Variables

Producción requiere:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=
```

No se usa `service_role` en la aplicación. Los permisos se resuelven mediante
Supabase Auth, perfiles y RLS.

## Despliegue

El destino previsto es Vercel. El proyecto debe usar Node.js 22 o superior y
las tres variables anteriores, apuntando al proyecto Supabase de producción.

Después de desplegar:

1. verificar `/api/health`;
2. confirmar que una ruta protegida redirige a `/login`;
3. iniciar sesión con un usuario `owner_admin`;
4. revisar Dashboard, Caja, Cierre diario y Reportes sin crear datos;
5. confirmar que Supabase no tiene migraciones pendientes.

## Recuperación

Los despliegues de Vercel son inmutables. Ante una regresión, promover la
versión de producción anterior desde Vercel. Las migraciones no se revierten
automáticamente: cualquier corrección de base debe publicarse como una nueva
migración incremental.
