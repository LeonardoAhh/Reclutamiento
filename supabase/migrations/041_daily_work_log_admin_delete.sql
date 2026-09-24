-- Habilita la eliminación de actividades de bitácora únicamente para admin.
-- Los metadatos adjuntos se eliminan por cascada y los objetos se limpian
-- después desde el cliente autenticado.
begin;

grant delete on public.daily_work_activities to authenticated;

drop policy if exists daily_work_activities_delete_admin
  on public.daily_work_activities;
create policy daily_work_activities_delete_admin
  on public.daily_work_activities
  for delete
  to authenticated
  using (public.is_admin());

drop policy if exists daily_work_files_delete_admin on storage.objects;
create policy daily_work_files_delete_admin
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'daily-work-log-files'
    and public.is_admin()
  );

commit;

-- Rollback compatible:
-- drop policy if exists daily_work_files_delete_admin on storage.objects;
-- drop policy if exists daily_work_activities_delete_admin
--   on public.daily_work_activities;
-- revoke delete on public.daily_work_activities from authenticated;
