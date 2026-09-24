-- Soporte reutiliza el contrato, las políticas y la auditoría de activities.
-- La migración solo amplía el discriminador permitido y preserva las filas actuales.
begin;

alter table public.activities
  drop constraint if exists activities_tipo_check;

alter table public.activities
  add constraint activities_tipo_check
  check (tipo in ('unica', 'rutinaria', 'vacante', 'soporte'));

commit;
