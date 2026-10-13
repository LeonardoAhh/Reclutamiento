# Retiro del bucket de fotos de actualización de datos

Antes de eliminar `data-update-photos` en Supabase:

1. Aplica la migración `066_data_update_optional_photos.sql`; el cierre y la sincronización ya no usan el bucket ni exigen una foto, y se eliminan las políticas RLS exclusivas de ese bucket.
2. Despliega las funciones actualizadas, que ya no borran objetos del bucket al eliminar registros o campañas:

   ```sh
   supabase functions deploy delete-data-update-record --no-verify-jwt
   supabase functions deploy delete-data-update-campaign --no-verify-jwt
   ```

3. Despliega la versión nueva de la aplicación para retirar captura, consulta y exportación de fotos.
4. Elimina desde Supabase Dashboard la función `organization-chart-photos` si todavía está desplegada. Ya no hay un cliente que la invoque.
5. Elimina el bucket desde Supabase Dashboard. Esto elimina los archivos almacenados; la columna histórica `photo_path` permanece en la base de datos, pero la aplicación ya no la usa para acceder a fotos.

Se retiró el uso de `data-update-photos` para captura, consulta y exportación administrativa, y para servir URLs al organigrama. Las imágenes estáticas locales y otros buckets no se modifican. No se han ejecutado estos pasos contra el servicio remoto.
