# Autenticación y usuarios dueños

La aplicación usa Supabase Auth con email y contraseña. Solo pueden entrar
usuarios que además tengan un perfil activo con rol `owner_admin`.

El registro público está deshabilitado. Los usuarios se crean desde:

1. Supabase Dashboard.
2. Authentication → Users → Add user.
3. Crear el usuario con su email real y una contraseña temporal segura.

Después de crear los tres usuarios Auth, ejecutar en SQL Editor reemplazando
los emails de ejemplo:

```sql
insert into public.profiles (id, email, full_name, role, status)
select
  auth_users.id,
  auth_users.email,
  owners.full_name,
  'owner_admin'::public.user_role,
  'active'::public.record_status
from (
  values
    ('juliana@reemplazar.com', 'Juliana'),
    ('geronimo@reemplazar.com', 'Gerónimo'),
    ('agustina@reemplazar.com', 'Agustina')
) as owners(email, full_name)
join auth.users as auth_users
  on lower(auth_users.email) = lower(owners.email)
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  role = excluded.role,
  status = excluded.status,
  updated_at = now();
```

Verificar el resultado:

```sql
select email, full_name, role, status
from public.profiles
order by full_name;
```

No crear perfiles antes que sus usuarios Auth: `profiles.id` referencia
directamente a `auth.users.id`.

## Seguridad

- La clave publicable se usa en cliente y servidor mediante RLS.
- No se usa ni se requiere `service_role` en la aplicación.
- El middleware exige sesión válida, rol `owner_admin` y estado `active`.
- Un usuario Auth sin perfil activo no puede acceder a las rutas internas.
- El primer perfil se crea desde SQL Editor porque todavía no existe un
  propietario autorizado para insertarlo mediante RLS.
