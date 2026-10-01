# Catálogo administrable del equipo

## Alcance y propiedad

Administración: página **/equipo**, con acceso desde **Mi cuenta → Administración → Equipo**, exclusiva de administradores.
`recruiter_directory.id` identifica al integrante; `profile_id` vincula su cuenta real.
`canonical_name` conserva la clave escrita por los formularios existentes. Los alias son únicos tras normalizar acentos, espacios y mayúsculas.

| Información | Fuente y consumidores |
| --- | --- |
| Nombres, puesto, pase y variantes | Directorio y alias; formularios, badges, inicio, reportes y reconocimientos |
| Disponibilidad | `active` y `selectable`; nuevas asignaciones de candidatos, vacantes y actividades |
| Inclusión en métricas | `include_in_metrics`; conserva las exclusiones del código anterior |
| Acceso | Estado del directorio, Supabase Auth, RLS y hook de PostgREST |
| Historial | Tablas actuales y sus campos de texto/UUID, sin reescritura ni eliminación |
| Cambios administrativos | `recruiter_directory_audit`, con actor, valores anteriores y posteriores |

Los nombres del catálogo anterior se importan una vez en la migración 055; las cuentas restantes se incorporan desde `profiles`.
Thalia conserva sus exclusiones anteriores de asignaciones y métricas. La migración no da de baja a ninguna cuenta.
Una vinculación establecida es inmutable. Un integrante activo sin cuenta puede vincularse desde el formulario.
Agregar un integrante administra el directorio; las cuentas y sus credenciales siguen perteneciendo a Supabase Auth.

## Despliegue ordenado — pendiente de autorización

1. Confirmar que se aplicaron las migraciones existentes hasta 054, incluido el control de contraseña y los roles vigentes.
2. Revisar en la base real RLS, grants y políticas anónimas del dominio. El archivo legado `supabase/rls-fix.sql` contiene acceso público: verificar que sus políticas no permitan consultar datos internos sin sesión. Este cambio no sustituye esa revisión ni endurece permisos anónimos por su cuenta.
3. Registrar cantidades de candidatos, empleados, bajas y asignaciones. Comprobar las correspondencias entre las cuentas actuales y los nombres a importar; ningún alias puede representar a dos personas.
4. La **055 ya fue aplicada**, según confirmó el usuario. Aplicar únicamente **056_recruiter_directory_access.sql** para los ajustes posteriores: reservas de estado, validación de nuevas asignaciones, alias y compatibilidad con el control de contraseña. No volver a ejecutar 055. Para una instalación nueva, el orden es 055 → 056. Si existe un hook desconocido de PostgREST, la migración aborta para revisar su integración.
5. Publicar `set-team-member-status` y volver a publicar los consumidores del helper compartido: `create-user`, `compare-cv`, `delete-data-update-campaign`, `delete-data-update-record`; publicar también `change-password`.
6. Publicar el frontend después de los pasos anteriores. El catálogo exige 055 y la versión nueva de la función de bajas exige 056. Durante la actualización 056 → publicación de funciones, suspender acciones de baja/reactivación: el protocolo de estado anterior se revoca y debe reintentarse con la función publicada. Las lecturas del catálogo y los registros históricos continúan disponibles.
7. Comprobar las cantidades registradas, alias importados, vinculaciones y la administración desde una cuenta autorizada. Una entrada sin cuenta vinculada excluye nuevas asignaciones al desactivarla, pero no bloquea una cuenta distinta.

## Baja, reactivación y fallos parciales

La baja exige confirmación, bloquea primero el acceso en base y después el inicio de sesión/renovación en Auth. No modifica candidatos, atribuciones ni responsables existentes. La reasignación se hace explícitamente desde cada apartado.
Las métricas históricas siguen incluyendo a inactivos según su configuración de métricas.
Los cambios de responsable en servidor rechazan integrantes conocidos inactivos; conservar el mismo responsable en una edición sigue permitido. Las atribuciones históricas de empleados y bajas permanecen intactas.

La reactivación habilita Auth antes de confirmar `active=true`. Los fallos parciales presentan un error y admiten repetir la misma operación; no anuncian éxito ni revierten automáticamente una baja.
Las operaciones de estado se serializan por integrante. Si la función termina sin liberar la reserva, esta vence a los cinco minutos. Los identificadores de operación son privados y exclusivos del servicio.
No permite desactivar la cuenta propia ni cuentas de administrador. Este flujo no altera roles.

## Eliminar de Equipo

La migración 057 permite a administradores quitar de la lista de Equipo a integrantes inactivos sin cuenta vinculada; la 058 extiende la acción a integrantes inactivos con cuenta vinculada. La acción requiere confirmación. El registro permanece en el directorio con `archived_at`, junto con sus alias y auditoría, para resolver nombres y registros históricos. La cuenta vinculada permanece bloqueada en Auth y por RLS. Un integrante retirado no puede editarse ni reactivarse. La baja y el retiro son operaciones distintas; primero debe aplicarse la baja.

Despliegue: aplicar 058 después de 057, publicar `set-team-member-status` para rechazar reactivaciones de retirados y después publicar el frontend. Para revertir esta ampliación, restaurar la validación de cuenta vinculada de 057 en la RPC y el botón; no borrar ni reactivar cuentas ya retiradas.

## Verificación pendiente en Supabase

Con cuentas destinadas a verificación, comprobar administrador/reclutador, nombres y variantes, conservación de cifras, una baja y su reactivación.
Tras una baja, verificar login rechazado, JWT anterior sin acceso a REST/RPC/Storage, asignaciones nuevas rechazadas y edición de registros antiguos con el mismo responsable permitida.
Comprobar también el control de contraseña obligatorio, los errores de Auth/red y un reintento de estado. La compilación local no prueba estos permisos.
Los archivos descargados, la caché local y enlaces firmados ya emitidos requieren las políticas existentes de retención y expiración; una baja no borra esos datos del dispositivo.

## Reversión compatible

Si falla el frontend, publicar su versión previa **manteniendo 055, el hook y los bloqueos de acceso**. Los campos históricos no cambiaron y la versión previa conserva sus contratos de lectura/escritura.
Mantener las funciones de servidor que comprueban acceso para no reabrir sesiones desactivadas. No borrar directorio, alias ni auditoría; no retirar políticas ni reactivar usuarios como parte de un rollback.
Una corrección del servidor debe conservar el estado y la auditoría. Reactivar una cuenta exige la acción explícita de administración.
La retirada posterior del esquema o de permisos requiere otra migración y autorización independiente.

Normalización Unicode: [documentación de PostgreSQL](https://www.postgresql.org/docs/15/functions-string.html).
