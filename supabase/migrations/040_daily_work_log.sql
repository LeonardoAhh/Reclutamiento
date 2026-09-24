-- Bitácora diaria independiente de reportes_diarios y activities.
-- Reclutadores: lectura, alta y edición únicamente de registros propios.
-- Administradores: consulta global en modo lectura. No se habilita DELETE.
begin;

create table if not exists public.daily_work_activities (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid not null references public.profiles(id),
  work_date date not null,
  description text not null
    check (length(trim(description)) between 1 and 2000),
  start_time time,
  end_time time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_work_activities_time_range_check check (
    (start_time is null and end_time is null)
    or (
      start_time is not null
      and end_time is not null
      and end_time > start_time
    )
  )
);

create index if not exists daily_work_activities_date_recruiter_idx
  on public.daily_work_activities (work_date desc, recruiter_id, start_time);

create table if not exists public.daily_work_activity_attachments (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null
    references public.daily_work_activities(id) on delete cascade,
  storage_path text not null unique check (length(trim(storage_path)) > 0),
  file_name text not null check (length(trim(file_name)) > 0),
  mime_type text not null check (mime_type in (
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  )),
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  uploaded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists daily_work_attachments_activity_idx
  on public.daily_work_activity_attachments (activity_id, created_at);

create or replace function public.set_daily_work_activity_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_daily_work_activity_updated_at
  on public.daily_work_activities;
create trigger set_daily_work_activity_updated_at
  before update on public.daily_work_activities
  for each row execute function public.set_daily_work_activity_updated_at();

alter table public.daily_work_activities enable row level security;
alter table public.daily_work_activity_attachments enable row level security;

drop policy if exists daily_work_activities_select
  on public.daily_work_activities;
create policy daily_work_activities_select
  on public.daily_work_activities
  for select
  to authenticated
  using (public.is_admin() or recruiter_id = auth.uid());

drop policy if exists daily_work_activities_insert_recruiter
  on public.daily_work_activities;
create policy daily_work_activities_insert_recruiter
  on public.daily_work_activities
  for insert
  to authenticated
  with check (
    recruiter_id = auth.uid()
    and exists (
      select 1
      from public.profiles profile
      where profile.id = auth.uid() and profile.role = 'reclutador'
    )
  );

drop policy if exists daily_work_activities_update_recruiter
  on public.daily_work_activities;
create policy daily_work_activities_update_recruiter
  on public.daily_work_activities
  for update
  to authenticated
  using (
    recruiter_id = auth.uid()
    and exists (
      select 1
      from public.profiles profile
      where profile.id = auth.uid() and profile.role = 'reclutador'
    )
  )
  with check (
    recruiter_id = auth.uid()
    and exists (
      select 1
      from public.profiles profile
      where profile.id = auth.uid() and profile.role = 'reclutador'
    )
  );

drop policy if exists daily_work_attachments_select
  on public.daily_work_activity_attachments;
create policy daily_work_attachments_select
  on public.daily_work_activity_attachments
  for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.daily_work_activities activity
      where activity.id = daily_work_activity_attachments.activity_id
        and activity.recruiter_id = auth.uid()
    )
  );

drop policy if exists daily_work_attachments_insert_recruiter
  on public.daily_work_activity_attachments;
create policy daily_work_attachments_insert_recruiter
  on public.daily_work_activity_attachments
  for insert
  to authenticated
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1
      from public.daily_work_activities activity
      join public.profiles profile on profile.id = activity.recruiter_id
      where activity.id = daily_work_activity_attachments.activity_id
        and activity.recruiter_id = auth.uid()
        and profile.role = 'reclutador'
    )
  );

revoke all on public.daily_work_activities from anon, authenticated;
revoke all on public.daily_work_activity_attachments from anon, authenticated;
grant select, insert, update on public.daily_work_activities to authenticated;
grant select, insert on public.daily_work_activity_attachments to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'daily-work-log-files',
  'daily-work-log-files',
  false,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists daily_work_files_select on storage.objects;
create policy daily_work_files_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'daily-work-log-files'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

drop policy if exists daily_work_files_insert_recruiter on storage.objects;
create policy daily_work_files_insert_recruiter
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'daily-work-log-files'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1
      from public.daily_work_activities activity
      join public.profiles profile on profile.id = activity.recruiter_id
      where activity.id::text = (storage.foldername(name))[2]
        and activity.recruiter_id = auth.uid()
        and profile.role = 'reclutador'
    )
  );

-- Solo permite limpiar un archivo cuya metadata no alcanzó a guardarse.
-- Los adjuntos persistidos no pueden eliminarse desde el cliente.
drop policy if exists daily_work_files_delete_orphan on storage.objects;
create policy daily_work_files_delete_orphan
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'daily-work-log-files'
    and (storage.foldername(name))[1] = auth.uid()::text
    and not exists (
      select 1
      from public.daily_work_activity_attachments attachment
      where attachment.storage_path = name
    )
  );

commit;

-- Rollback manual y destructivo: exportar primero la bitácora y los objetos,
-- después retirar políticas/bucket y eliminar ambas tablas. No se automatiza.
