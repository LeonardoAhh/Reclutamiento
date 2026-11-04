-- Aplicar después de desplegar el cliente que firma los enlaces de las pruebas.
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'activity-proofs') then
    raise exception 'El bucket activity-proofs no existe';
  end if;
end;
$$;

update storage.buckets set public = false where id = 'activity-proofs';

drop policy if exists "Activity proofs are publicly accessible" on storage.objects;
drop policy if exists "Authenticated users can upload activity proofs" on storage.objects;
drop policy if exists activity_proofs_private_read on storage.objects;
drop policy if exists activity_proofs_private_insert on storage.objects;

create policy activity_proofs_private_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'activity-proofs'
    and exists (
      select 1 from public.activities activity
      where activity.id::text = (storage.foldername(name))[1]
    )
  );

create policy activity_proofs_private_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'activity-proofs'
    and exists (
      select 1 from public.activities activity
      where activity.id::text = (storage.foldername(name))[1]
    )
  );
