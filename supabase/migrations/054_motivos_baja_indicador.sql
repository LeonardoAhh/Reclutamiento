-- Datos exclusivos del indicador de motivos; no modifican public.bajas.
-- La página lee únicamente esta tabla; public.bajas conserva su propio historial.
create table if not exists public.motivos_baja_indicador (
  num_empleado text primary key,
  fecha_baja date not null,
  tipo_baja text not null,
  motivo_baja_estandarizado text,
  motivo_baja text,
  created_at timestamptz not null default now()
);

alter table public.motivos_baja_indicador enable row level security;

drop policy if exists "motivos_baja_indicador_authenticated" on public.motivos_baja_indicador;
create policy "motivos_baja_indicador_authenticated"
  on public.motivos_baja_indicador for all
  to authenticated
  using (true)
  with check (true);

revoke all on public.motivos_baja_indicador from anon;
grant select, insert, update on public.motivos_baja_indicador to authenticated;

-- Reversión manual, solo tras respaldar los registros:
-- drop table public.motivos_baja_indicador;
