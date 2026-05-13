# Supabase migrations

Migraciones SQL versionadas para el schema del proyecto.

## Cómo aplicar una migración

### Opción A — SQL Editor (manual, sin CLI)

1. Abre tu proyecto en https://app.supabase.com
2. Ve a **SQL Editor** → **New query**
3. Copia el contenido completo del archivo `.sql` (en orden numérico) y pega
4. Click **Run** (o `Ctrl+Enter`)
5. Verifica que aparezca **Success. No rows returned**

### Opción B — Supabase CLI

```bash
# Una sola vez: vincular el proyecto local con el remoto
supabase link --project-ref <tu-project-ref>

# Aplicar todas las migraciones nuevas
supabase db push
```

## Orden de las migraciones

| Archivo | Qué crea | PR asociado |
|---|---|---|
| `001_pipeline_schema.sql` | Tablas `candidates`, `candidate_notes`, `vacancy_requests`, `vacancy_status_history` + triggers de auditoría y `updated_at`. | PR B |
| `002_candidates_employee_link.sql` | Columna `employee_num` en `candidates` para linkear al empleado generado tras "Contratar". | PR F |
| `003_vacancy_sla.sql` | Columnas `dias_sla`, `excluida_indicador`, `motivo_exclusion` en `vacancy_requests` para tracking de SLA y exclusión de KPI. | PR G |

## RLS

Todas las tablas tienen RLS habilitada con políticas permisivas (`using (true)`)
para mantener compatibilidad con el frontend actual, que usa solo la anon key.

Cuando se agregue auth + roles (Tier 4 del roadmap), las políticas se cambian
a algo como:

```sql
drop policy "candidates_all" on public.candidates;

create policy "candidates_select_authenticated"
  on public.candidates for select to authenticated using (true);

create policy "candidates_modify_recruiter"
  on public.candidates for all to authenticated
  using ((auth.jwt() ->> 'role') in ('admin', 'reclutador'))
  with check ((auth.jwt() ->> 'role') in ('admin', 'reclutador'));
```
