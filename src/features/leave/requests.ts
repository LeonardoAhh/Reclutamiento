import { supabase } from '@/lib/supabase';
import { addDaysToIso, localTodayIso } from '@/lib/dates';
import type { Profile } from '@/hooks/useAuth';
import type { TeamMember } from '@/features/team/types';

export const LEAVE_REQUESTS_PATH = '/leave-requests';
export const LEAVE_NOTICE_DAYS = 14;
export const LEAVE_PAGE_SIZE = 25;
export const LEAVE_TYPE_OPTIONS = [
  { value: 'vacation', label: 'Vacaciones' },
  { value: 'permission', label: 'Permiso' },
] as const;
export type LeaveType = typeof LEAVE_TYPE_OPTIONS[number]['value'];
export interface LeaveDraft {
  type: LeaveType;
  startDate: string;
  endDate: string;
}
export interface LeaveRequest extends LeaveDraft {
  id: string;
  requesterId: string;
  requesterName: string;
  requestedAt: string;
  requiresNoticeException: boolean;
  status: 'pending' | 'approved';
}
export function canReviewLeaveRequests(profile: Profile | null, members: readonly TeamMember[]) {
  return Boolean(profile && (profile.role === 'admin' || members.some(member =>
    member.profile_id === profile.id && member.badge_role === 'coordinador'
    && member.active && !member.archived_at)));
}
export function leaveTypeLabel(type: LeaveType) {
  return LEAVE_TYPE_OPTIONS.find(option => option.value === type)?.label ?? '';
}
export function leaveStatusLabel(status: LeaveRequest['status']) {
  return status === 'approved' ? 'Autorizada' : 'Pendiente de validación';
}
function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && addDaysToIso(value, 0) === value;
}
export function validateLeaveDraft(draft: LeaveDraft, today = localTodayIso()) {
  if (!LEAVE_TYPE_OPTIONS.some(option => option.value === draft.type)) return 'Selecciona Vacaciones o Permiso.';
  if (!validDate(draft.startDate) || !validDate(draft.endDate)) return 'Selecciona las fechas de inicio y fin.';
  if (draft.startDate < today) return 'La fecha de inicio no puede ser anterior a hoy.';
  if (draft.endDate < draft.startDate) return 'La fecha final debe ser igual o posterior a la inicial.';
  return '';
}
export function requiresNoticeException(draft: LeaveDraft, today = localTodayIso()) {
  const minimum = addDaysToIso(today, LEAVE_NOTICE_DAYS);
  return draft.type === 'vacation' && Boolean(minimum && draft.startDate && draft.startDate < minimum);
}
export async function createLeaveRequest(id: string, draft: LeaveDraft) {
  const validation = validateLeaveDraft(draft);
  if (validation) throw new Error(validation);
  const { data, error } = await supabase.rpc('create_leave_request', {
    p_id: id, p_type: draft.type, p_start_date: draft.startDate, p_end_date: draft.endDate,
  });
  if (error) {
    if (error.code === '23P01') throw new Error('Estas fechas coinciden con otra solicitud de reclutamiento. Elige otro periodo.');
    if (error.code === '42501') throw new Error('Tu cuenta no tiene acceso para guardar solicitudes.');
    if (error.code === '22023') throw new Error(error.message);
    throw new Error('No se pudo guardar. Revisa tu conexión y vuelve a intentar.');
  }
  if (data !== id) throw new Error('No se pudo confirmar el guardado. Vuelve a intentar.');
}
function requestFromRow(value: unknown): LeaveRequest {
  if (!value || typeof value !== 'object') throw new Error('No se pudieron leer las solicitudes.');
  const row = value as Record<string, unknown>;
  const strings = ['id', 'requester_id', 'requester_name', 'start_date', 'end_date', 'requested_at'] as const;
  if (strings.some(key => typeof row[key] !== 'string') || (row.status !== 'pending' && row.status !== 'approved')
    || typeof row.requires_notice_exception !== 'boolean'
    || (row.leave_type !== 'vacation' && row.leave_type !== 'permission')) {
    throw new Error('No se pudieron leer las solicitudes.');
  }
  return {
    id: String(row.id), requesterId: String(row.requester_id), requesterName: String(row.requester_name),
    type: row.leave_type, startDate: String(row.start_date), endDate: String(row.end_date),
    requestedAt: String(row.requested_at), requiresNoticeException: row.requires_notice_exception,
    status: row.status,
  };
}
export async function listLeaveRequests(page: number) {
  const from = page * LEAVE_PAGE_SIZE;
  const { data, error, count } = await supabase.from('leave_requests')
    .select('id, requester_id, requester_name, leave_type, start_date, end_date, requested_at, requires_notice_exception, status', { count: 'exact' })
    .order('requested_at', { ascending: false }).order('id', { ascending: false })
    .range(from, from + LEAVE_PAGE_SIZE - 1);
  if (error) throw new Error('No se pudieron cargar las solicitudes. Vuelve a intentar.');
  return { requests: (data ?? []).map(requestFromRow), total: count ?? 0 };
}

export function canDeleteLeaveRequest(profile: Profile | null, request: LeaveRequest) {
  return Boolean(profile && request.status === 'pending'
    && (profile.role === 'admin' || request.requesterId === profile.id));
}

export function canApproveLeaveRequest(profile: Profile | null, request: LeaveRequest) {
  return Boolean(profile?.role === 'admin' && request.status === 'pending'
    && request.requesterId !== profile.id);
}

export async function approveLeaveRequest(id: string) {
  const { data, error } = await supabase.rpc('approve_leave_request', { p_id: id });
  if (error) {
    if (error.code === '42501' || error.code === '22023') throw new Error(error.message);
    throw new Error('No se pudo autorizar. Revisa tu conexión y vuelve a intentar.');
  }
  if (data !== id) throw new Error('No se pudo confirmar la autorización. Vuelve a intentar.');
}

export async function deleteLeaveRequest(id: string) {
  const { data, error } = await supabase.rpc('delete_leave_request', { p_id: id });
  if (error) {
    if (error.code === '42501') throw new Error('Tu cuenta no tiene acceso para eliminar esta solicitud.');
    if (error.code === '22023') throw new Error(error.message);
    throw new Error('No se pudo eliminar. Revisa tu conexión y vuelve a intentar.');
  }
  if (data !== id) throw new Error('No se pudo confirmar la eliminación. Vuelve a intentar.');
}
