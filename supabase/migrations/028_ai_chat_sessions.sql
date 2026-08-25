-- =============================================================================
-- 028_ai_chat_sessions.sql
-- Historial personal del Asistente de Reclutamiento.
-- Conserva mensajes y contexto textual; nunca almacena el PDF original.
-- =============================================================================

create table if not exists public.ai_chat_sessions (
  id                  uuid primary key,
  user_id             uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title               text not null,
  selected_job_id     uuid references public.job_descriptions(id) on delete set null,
  evaluated_job_name  text,
  candidate_file_name text,
  resume_text         text not null default '',
  evaluation_result   text not null default '',
  has_compared        boolean not null default false,
  messages            jsonb not null default '[]'::jsonb
    check (jsonb_typeof(messages) = 'array'),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists ai_chat_sessions_user_updated_idx
  on public.ai_chat_sessions(user_id, updated_at desc);

drop trigger if exists ai_chat_sessions_set_updated_at on public.ai_chat_sessions;
create trigger ai_chat_sessions_set_updated_at
  before update on public.ai_chat_sessions
  for each row execute function public.set_updated_at();

alter table public.ai_chat_sessions enable row level security;

drop policy if exists "ai_chat_sessions_select_own" on public.ai_chat_sessions;
create policy "ai_chat_sessions_select_own"
  on public.ai_chat_sessions for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "ai_chat_sessions_insert_own" on public.ai_chat_sessions;
create policy "ai_chat_sessions_insert_own"
  on public.ai_chat_sessions for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "ai_chat_sessions_update_own" on public.ai_chat_sessions;
create policy "ai_chat_sessions_update_own"
  on public.ai_chat_sessions for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "ai_chat_sessions_delete_own" on public.ai_chat_sessions;
create policy "ai_chat_sessions_delete_own"
  on public.ai_chat_sessions for delete
  to authenticated
  using (user_id = auth.uid());
