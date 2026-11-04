-- Las notas de candidatos ya no se usan en el cliente. Se conservan sus registros
-- históricos y se retira el acceso directo, incluida la política permisiva anterior.
do $$
begin
  if to_regclass('public.candidate_notes') is null then
    raise exception 'public.candidate_notes no existe; revisa el esquema antes de restringir el acceso';
  end if;
end;
$$;

drop policy if exists "candidate_notes_authenticated" on public.candidate_notes;
drop policy if exists "candidate_notes_all" on public.candidate_notes;
revoke all on public.candidate_notes from public, anon, authenticated;
