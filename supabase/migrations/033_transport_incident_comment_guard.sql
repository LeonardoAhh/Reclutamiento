-- Protege nuevas escrituras sin invalidar reportes históricos existentes.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'incidencias_transporte_comentarios_length_check'
      and conrelid = 'public.incidencias_transporte'::regclass
  ) then
    alter table public.incidencias_transporte
      add constraint incidencias_transporte_comentarios_length_check
      check (
        comentarios is not null
        and char_length(btrim(comentarios)) between 1 and 500
      ) not valid;
  end if;
end
$$;

comment on constraint incidencias_transporte_comentarios_length_check
  on public.incidencias_transporte is
  'Exige comentarios de 1 a 500 caracteres en nuevas escrituras';

-- Rollback:
-- alter table public.incidencias_transporte
--   drop constraint if exists incidencias_transporte_comentarios_length_check;
