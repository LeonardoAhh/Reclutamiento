-- Imagen opcional de evidencia para reportes de transporte.
-- El bucket permanece privado: solo administradores pueden leer objetos.

alter table public.incidencias_transporte
  add column if not exists imagen_path text;

comment on column public.incidencias_transporte.imagen_path is
  'Ruta privada de la imagen opcional asociada al reporte de transporte';

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'transport-incident-images',
  'transport-incident-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists transport_incident_images_insert on storage.objects;
create policy transport_incident_images_insert
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'transport-incident-images'
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
);

drop policy if exists transport_incident_images_select_admin on storage.objects;
create policy transport_incident_images_select_admin
on storage.objects
for select
to authenticated
using (
  bucket_id = 'transport-incident-images'
  and public.is_admin()
);

drop policy if exists transport_incident_images_delete_owner_or_admin on storage.objects;
create policy transport_incident_images_delete_owner_or_admin
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'transport-incident-images'
  and (owner = auth.uid() or public.is_admin())
);

-- Rollback manual, únicamente después de volver a una versión que no escriba
-- imágenes y respaldar la evidencia existente:
-- delete from storage.objects where bucket_id = 'transport-incident-images';
-- delete from storage.buckets where id = 'transport-incident-images';
-- alter table public.incidencias_transporte drop column imagen_path;
