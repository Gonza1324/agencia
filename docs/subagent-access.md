# Acceso de Subagentes

## Objetivo

La primera versión del portal externo es de solo lectura. Cada cuenta con
rol `subagent` podrá ver únicamente las máquinas/Subagentes que la Agencia le
asigne, sus rendiciones, movimientos de cuenta corriente y saldo actual.

No tendrá acceso a Caja, Gastos, cierres, reportes globales, otros Subagentes,
usuarios internos ni configuración.

## Vinculación

Se agregó la tabla `subagent_user_links`:

- `user_id`: usuario de Supabase Auth y `profiles`;
- `subagent_id`: registro interno que puede consultar;
- `status`: vínculo activo o inactivo;
- fechas de creación y actualización;
- usuario interno que realizó la asignación.

La relación será muchos-a-muchos para soportar que una misma cuenta administre
más de una máquina. Se indexarán `user_id`, `subagent_id` y el vínculo activo.

## Aislamiento de datos

La seguridad no dependerá de filtros de React. PostgreSQL aplicará RLS sobre
cada tabla expuesta al portal.

Una función auxiliar `can_access_subagent(uuid)` comprobará, mediante
`(select auth.uid())`, que exista un vínculo activo. Las políticas permitirán
solo `select` sobre:

- el registro asignado de `subagents`;
- sus `daily_settlements`;
- sus `subagent_account_movements`;
- los datos mínimos necesarios para mostrar el saldo.

No se crearán políticas de `insert`, `update` o `delete` para el rol
`subagent`. Las funciones internas conservarán además sus comprobaciones de
rol para que no puedan invocarse directamente desde la API.

## Experiencia

El rol `subagent` tiene un shell separado y es redirigido a `/mi-cuenta`.
La pantalla mostrará:

- una tarjeta por máquina asignada;
- saldo actual, diferenciando deuda y saldo a favor;
- últimas rendiciones;
- movimientos de cuenta corriente;
- datos de comisión y cálculo de cada rendición.

No verá la navegación administrativa.

## Administración interna

Desde Configuración, un propietario puede:

- crear el acceso con contraseña temporal;
- asignar una o varias máquinas/Subagentes;
- activar o suspender el acceso;
- restablecer la contraseña;
- asignar más de una máquina a la misma cuenta.

Inactivar el usuario o el vínculo debe cortar el acceso inmediatamente sin
borrar el historial.

## Pruebas obligatorias

Se probaron dos usuarios y dos Subagentes distintos contra la API real:

- cada usuario puede leer sus propios registros;
- ninguno puede leer el registro, saldo o movimientos del otro;
- un vínculo inactivo devuelve cero filas;
- no pueden crear, editar o anular datos;
- no pueden abrir rutas administrativas.

La cuenta de Rafaela Troncozo será el piloto inicial. Después de validar la
información mostrada con la Agencia, se habilitará al resto.
