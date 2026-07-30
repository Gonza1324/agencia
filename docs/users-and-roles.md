# Usuarios y roles

La administración está disponible para propietarios en:

```text
/configuracion/usuarios
```

## Roles

- `owner_admin`: operación completa, configuración y administración de
  usuarios.
- `cash_operator`: Rendiciones, Subagentes, Caja, cierres y Reportes. No puede
  administrar usuarios ni Configuración.
- `viewer`: acceso de solo lectura a Dashboard y Reportes.
- `subagent`: reservado para el futuro portal de Subagentes; no se asigna desde
  la administración interna actual.

## Altas y contraseñas

Un propietario crea el usuario con email, nombre, rol y una contraseña
temporal. El usuario de Supabase Auth y su perfil se crean desde una Server
Action protegida. Si falla la creación del perfil, el acceso Auth se elimina
para no dejar usuarios incompletos.

Los propietarios pueden establecer una nueva contraseña temporal, cambiar el
nombre, el rol y el estado. No hay borrado físico: al inactivar un acceso se
preserva todo su historial.

La aplicación impide:

- que un propietario cambie su propio rol o se inactive;
- que se inactive o degrade al último propietario activo;
- que operadores o visores administren perfiles;
- asignar el rol `subagent` antes de que exista su portal.

## Seguridad

La gestión de Supabase Auth requiere:

```bash
SUPABASE_SERVICE_ROLE_KEY=
```

Esta variable es exclusiva del servidor, no lleva prefijo `NEXT_PUBLIC_`, no se
guarda en Git y nunca se entrega al navegador. Antes de usar el cliente
administrativo, cada acción valida una sesión activa con rol `owner_admin`.

Los cambios de usuario y los restablecimientos de contraseña se registran en
`audit_logs` sin guardar contraseñas.
