import { supabase } from '@/lib/supabase';
import type { TeamMember, TeamMemberInput } from './types';

function memberFromRow(value: unknown): TeamMember {
  if (!value || typeof value !== 'object') throw new Error('El catálogo contiene un registro inválido.');
  const row = value as Record<string, unknown>;
  const fields = ['id', 'canonical_name', 'full_name', 'short_name', 'access_card_name', 'job_title'] as const;
  for (const field of fields) if (typeof row[field] !== 'string') throw new Error('El catálogo contiene un registro incompleto.');
  if (row.badge_role !== 'reclutadora' && row.badge_role !== 'coordinador') throw new Error('Rol de equipo inválido.');
  if (row.profile_id !== null && typeof row.profile_id !== 'string') throw new Error('Cuenta vinculada inválida.');
  if (row.archived_at !== null && typeof row.archived_at !== 'string') throw new Error('Estado de equipo inválido.');
  if (typeof row.active !== 'boolean' || typeof row.selectable !== 'boolean' || typeof row.include_in_metrics !== 'boolean') {
    throw new Error('Estado de equipo inválido.');
  }
  const aliases = row.recruiter_aliases;
  const profile = row.profiles;
  let profileRole: TeamMember['profile_role'] = null;
  if (profile !== null && profile !== undefined) {
    if (typeof profile !== 'object' || !('role' in profile) || (profile.role !== 'admin' && profile.role !== 'reclutador')) throw new Error('Cuenta vinculada inválida.');
    profileRole = profile.role;
  }
  if (!Array.isArray(aliases)) throw new Error('No se pudieron leer las variantes del catálogo.');
  return {
    id: String(row.id), canonical_name: String(row.canonical_name), full_name: String(row.full_name),
    short_name: String(row.short_name), access_card_name: String(row.access_card_name), job_title: String(row.job_title),
    badge_role: row.badge_role, profile_id: row.profile_id, profile_role: profileRole, active: row.active, archived_at: row.archived_at,
    selectable: row.selectable, include_in_metrics: row.include_in_metrics,
    aliases: aliases.map((value: unknown) => {
      if (!value || typeof value !== 'object' || !('alias' in value) || typeof value.alias !== 'string') {
        throw new Error('Variante de nombre inválida.');
      }
      return value.alias;
    }),
  };
}

export async function listTeamMembers(): Promise<TeamMember[]> {
  const { data, error } = await supabase.from('recruiter_directory')
    .select('id, canonical_name, full_name, short_name, access_card_name, job_title, badge_role, profile_id, active, archived_at, selectable, include_in_metrics, recruiter_aliases(alias), profiles(role)')
    .order('short_name');
  if (error) throw new Error('No se pudo cargar el equipo. Comprueba la conexión y la migración del catálogo.');
  return (data ?? []).map(memberFromRow);
}

export async function saveTeamMember(member: TeamMemberInput) {
  const { error } = await supabase.rpc('save_recruiter_member', { p_member: member });
  if (error) {
    if (error.code === '23505' || error.message.includes('variante')) {
      throw new Error('El identificador, la cuenta o una variante ya pertenece a otra persona.');
    }
    throw new Error('No se pudo guardar el integrante. Revisa los campos y tus permisos.');
  }
}

export async function setTeamMemberStatus(id: string, active: boolean) {
  const { data, error, response } = await supabase.functions.invoke<unknown>('set-team-member-status', { body: { id, active } });
  let body: unknown = data;
  if (error && response) {
    try { body = await response.json(); } catch { body = null; }
  }
  if (body && typeof body === 'object' && 'ok' in body && body.ok === true && !error) return;
  if (body && typeof body === 'object' && 'message' in body && typeof body.message === 'string') throw new Error(body.message);
  throw new Error('No se pudo cambiar el estado. Comprueba la conexión y vuelve a intentar.');
}

export async function archiveTeamMember(id: string) {
  const { error } = await supabase.rpc('archive_recruiter_member', { p_id: id });
  if (error) {
    if (error.code === '42501') throw new Error('No tienes permiso para eliminar integrantes.');
    throw new Error(error.message || 'No se pudo eliminar al integrante. Vuelve a intentar.');
  }
}
