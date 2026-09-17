# Cambio obligatorio de contraseña

Alcance: todos los usuarios existentes al activar, incluidos administradores. Es una campaña única; no incorpora automáticamente cuentas futuras. No modifica roles ni elimina usuarios. El formulario habitual de cambio de contraseña sigue disponible después de completar el requisito.

## Despliegue por etapas

1. Aplicar `../migrations/044_required_password_change.sql`. Prepara el estado privado y políticas restrictivas, pero todavía no exige cambios. Si encuentra una tabla sin RLS, aborta íntegramente: revisar esa configuración antes de continuar.
2. Desplegar `change-password`, `create-user`, `delete-data-update-record`, `delete-data-update-campaign` y `compare-cv`, incluyendo `_shared`. La nueva función `change-password` se puede desplegar con `--no-verify-jwt`: valida la sesión directamente con Auth antes de modificar contraseñas. Usa las variables existentes `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`; nunca lleva la clave de servicio al frontend.
3. Comprobar en Supabase Auth la política de contraseña y la opción **Require current password**. La función envía `current_password`; su validación depende de esa configuración de Auth. Con reautenticación habilitada, una sesión antigua puede necesitar cerrar sesión y entrar de nuevo. No usar recuperación por correo para usuarios con dominio sintético. Referencia: [seguridad de contraseñas de Supabase](https://supabase.com/docs/guides/auth/password-security).
4. Desplegar el frontend. Antes de activar, comprobar una cuenta normal y una administradora: acceso normal, cambio voluntario y cierre de sesión.
5. Revisar la configuración efectiva `db_pre_request` de PostgREST. El script aborta si encuentra un hook distinto configurado en el rol `authenticator`; no puede descubrir overrides externos. Si existe otro hook, integrar ambos antes de activar. Ejecutar `activate-required-password-change.sql` solo después de comprobar el despliegue anterior.
6. Verificar con una cuenta de cada rol: pantalla obligatoria; contraseña incorrecta conserva el formulario; API de datos, RPC y Edge Functions rechazan acceso pendiente; un cambio válido permite continuar en la ruta original. Intentar llamar a `complete_required_password_change` con token de usuario debe fallar. No introducir contraseñas en consultas SQL o logs.

La activación captura usuarios una sola vez. Repetir el script no vuelve a marcar usuarios completados ni incorpora usuarios creados posteriormente. La migración de preparación se aplica una sola vez mediante el historial de migraciones.

## Contrato y fallos

- `password_change_required()` expone únicamente el estado de la sesión actual. No permite escribirlo.
- `complete_required_password_change(uuid, timestamptz)` solo permite ejecución a `service_role`. La Edge Function obtiene el usuario de Auth, cambia su contraseña con su propio JWT y confirma después. El cliente no elige el usuario ni puede marcarse como completado.
- Si Auth guarda la contraseña pero falla la confirmación, el acceso permanece bloqueado. El mensaje indica repetir el cambio usando la nueva contraseña como actual. No se informa éxito completo ni se revierte la contraseña.
- Un cambio directo con el SDK o desde el Dashboard no confirma esta campaña. Para completarla se usa el formulario de la app, cuyo cambio pasa por la función de servidor.
- No se guardan contraseñas ni copias de hashes. Solo identificador, fecha de requerimiento y fecha de confirmación.
- El hook de PostgREST cubre Data API/RPC; las políticas RLS cubren tablas y operaciones autenticadas de Storage del proyecto. Las Edge Functions verifican el requisito antes de usar privilegios de servicio. Las políticas existentes de roles siguen aplicándose.
- No se revocan URLs públicas o URLs firmadas ya emitidas, datos descargados, ni eventos Presence/Broadcast existentes. Los accesos públicos anónimos siguen sus permisos originales. Las sesiones abiertas reciben el aviso al recuperar foco o cuando una petición protegida devuelve `PASSWORD_CHANGE_REQUIRED`.
- Aplicar la migración antes del frontend es obligatorio. Si el estado no se puede consultar, la pantalla bloquea el acceso y ofrece reintento y cierre de sesión.

## Pausa y reversión

Ejecutar `pause-required-password-change.sql` desactiva la exigencia sin borrar historial ni restaurar contraseñas anteriores. Recargar la app para revalidar. Para reanudar la misma campaña, el operador puede ejecutar:

```sql
update account_security.password_change_campaign set enabled = true where singleton;
```

Para volver al frontend anterior, pausar primero; después revertir frontend y Edge Functions. Conservar tablas, RPC y políticas inactivas durante la ventana de compatibilidad. No restablecer hooks ajenos ni eliminar políticas existentes.

## Verificación pendiente de entorno

La comprobación local de TypeScript y las simulaciones aisladas no sustituyen ejecutar la migración en Supabase y verificar Auth, RLS, Storage, RPC y la interfaz desplegada. La campaña no queda activada por guardar estos archivos.
