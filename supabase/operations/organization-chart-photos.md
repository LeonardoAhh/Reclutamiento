# Fotos del organigrama

Desplegar `organization-chart-photos` junto con `_shared`:

```sh
supabase functions deploy organization-chart-photos --no-verify-jwt
```

La función valida el JWT con Auth y conserva las comprobaciones existentes de cuenta activa y cambio de contraseña. Permite cualquier rol autenticado. Usa las variables de servidor existentes `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`.

Solo entrega URLs firmadas de una hora para la lista de empleados autorizada en el servidor. No admite números ni rutas enviados por el cliente, no devuelve expedientes y no modifica RLS ni el bucket privado. Selecciona la foto disponible con `updated_at` más reciente entre campañas; sin foto devuelve `null`. El frontend renueva las URLs a los 50 minutos y no las persiste.

Validación posterior al despliegue: sesión ausente rechazada; usuario autenticado obtiene únicamente los empleados permitidos; foto ausente muestra icono; navegación entre vistas conserva imágenes. No se han ejecutado estas comprobaciones contra el servicio remoto.
