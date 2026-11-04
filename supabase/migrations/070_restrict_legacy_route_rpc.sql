-- La función antigua de rutas usa SECURITY DEFINER y no debe poder ejecutarse
-- con la clave pública. Los datos privados se importan con service_role.
do $$
begin
  if to_regprocedure('public.update_empleados_rutas(jsonb)') is not null then
    revoke all on function public.update_empleados_rutas(jsonb) from public, anon, authenticated;
    grant execute on function public.update_empleados_rutas(jsonb) to service_role;
    alter function public.update_empleados_rutas(jsonb) set search_path = '';
  end if;

  if to_regclass('public.rutas_snapshots') is not null then
    alter table public.rutas_snapshots enable row level security;
    revoke all on public.rutas_snapshots from public, anon, authenticated;
  end if;
end;
$$;
