import { supabase } from '@/lib/supabase';
import { addDaysToIso, localTodayIso } from '@/lib/dates';
import type { Profile } from '@/hooks/useAuth';
import type { TeamMember } from '@/features/team/types';

export const LEAVE_REQUESTS_PATH = '/leave-requests';
export const LEAVE_NOTICE_DAYS = 14;
export const LEAVE_PAGE_SIZE = 25;
export const LEAVE_REQUESTS_CHANGED_EVENT = 'leave-requests-changed';

function notifyLeaveRequestsChanged() {
  window.dispatchEvent(new Event(LEAVE_REQUESTS_CHANGED_EVENT));
}
export const LEAVE_TYPE_OPTIONS = [
  { value: 'vacation', label: 'Vacaciones' },
  { value: 'permission', label: 'Permiso' },
] as const;
export type LeaveType = (typeof LEAVE_TYPE_OPTIONS)[number]['value'];
export interface LeaveDraft {
  type: LeaveType;
  startDate: string;
  endDate: string;
}
export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected';
export interface LeaveRequest extends LeaveDraft {
  id: string;
  requesterId: string;
  requesterName: string;
  requestedAt: string;
  reviewedAt: string | null;
  requiresNoticeException: boolean;
  status: LeaveRequestStatus;
}
export interface LeaveRequestNotification extends LeaveDraft {
  id: string;
  reviewedAt: string | null;
  status: LeaveRequestStatus;
}
export function canReviewLeaveRequests(profile: Profile | null, members: readonly TeamMember[]) {
  return Boolean(
    profile &&
    (profile.role === 'admin' ||
      members.some(
        (member) =>
          member.profile_id === profile.id &&
          member.badge_role === 'coordinador' &&
          member.active &&
          !member.archived_at,
      )),
  );
}
export function leaveTypeLabel(type: LeaveType) {
  return LEAVE_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? '';
}
export function leaveStatusLabel(status: LeaveRequest['status']) {
  if (status === 'approved') return 'Autorizada';
  if (status === 'rejected') return 'Rechazada';
  return 'Pendiente de validación';
}
function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && addDaysToIso(value, 0) === value;
}
export function validateLeaveDraft(draft: LeaveDraft, today = localTodayIso()) {
  if (!LEAVE_TYPE_OPTIONS.some((option) => option.value === draft.type)) return 'Selecciona Vacaciones o Permiso.';
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
    p_id: id,
    p_type: draft.type,
    p_start_date: draft.startDate,
    p_end_date: draft.endDate,
  });
  if (error) {
    if (error.code === '23P01')
      throw new Error('Estas fechas coinciden con otra solicitud de reclutamiento. Elige otro periodo.');
    if (error.code === '42501') throw new Error('Tu cuenta no tiene acceso para guardar solicitudes.');
    if (error.code === '22023') throw new Error(error.message);
    throw new Error('No se pudo guardar. Revisa tu conexión y vuelve a intentar.');
  }
  if (data !== id) throw new Error('No se pudo confirmar el guardado. Vuelve a intentar.');
  notifyLeaveRequestsChanged();
}
function requestFromRow(value: unknown): LeaveRequest {
  if (!value || typeof value !== 'object') throw new Error('No se pudieron leer las solicitudes.');
  const row = value as Record<string, unknown>;
  const strings = ['id', 'requester_id', 'requester_name', 'start_date', 'end_date', 'requested_at'] as const;
  if (
    strings.some((key) => typeof row[key] !== 'string') ||
    (row.status !== 'pending' && row.status !== 'approved' && row.status !== 'rejected') ||
    typeof row.requires_notice_exception !== 'boolean' ||
    (row.reviewed_at !== null && typeof row.reviewed_at !== 'string') ||
    (row.leave_type !== 'vacation' && row.leave_type !== 'permission')
  ) {
    throw new Error('No se pudieron leer las solicitudes.');
  }
  return {
    id: String(row.id),
    requesterId: String(row.requester_id),
    requesterName: String(row.requester_name),
    type: row.leave_type,
    startDate: String(row.start_date),
    endDate: String(row.end_date),
    requestedAt: String(row.requested_at),
    reviewedAt: row.reviewed_at,
    requiresNoticeException: row.requires_notice_exception,
    status: row.status,
  };
}
export async function listLeaveRequests(page: number, signal?: AbortSignal) {
  const from = page * LEAVE_PAGE_SIZE;
  const query = supabase
    .from('leave_requests')
    .select(
      'id, requester_id, requester_name, leave_type, start_date, end_date, requested_at, reviewed_at, requires_notice_exception, status',
      { count: 'exact' },
    )
    .order('requested_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, from + LEAVE_PAGE_SIZE - 1);
  const { data, error, count } = await (signal ? query.abortSignal(signal) : query);
  if (error) throw new Error('No se pudieron cargar las solicitudes. Vuelve a intentar.');
  return { requests: (data ?? []).map(requestFromRow), total: count ?? 0 };
}

function leaveRequestNotificationFromRow(value: unknown): LeaveRequestNotification {
  if (!value || typeof value !== 'object') {
    throw new Error('No se pudieron leer las solicitudes.');
  }
  const row = value as Record<string, unknown>;
  if (
    typeof row.id !== 'string' ||
    (row.leave_type !== 'vacation' && row.leave_type !== 'permission') ||
    typeof row.start_date !== 'string' ||
    typeof row.end_date !== 'string' ||
    (row.reviewed_at !== null && typeof row.reviewed_at !== 'string') ||
    (row.status !== 'pending' && row.status !== 'approved' && row.status !== 'rejected')
  ) {
    throw new Error('No se pudieron leer las solicitudes.');
  }
  return {
    id: row.id,
    type: row.leave_type,
    startDate: row.start_date,
    endDate: row.end_date,
    reviewedAt: row.reviewed_at,
    status: row.status,
  };
}

export async function listRecentLeaveRequests(
  requesterId: string,
  signal: AbortSignal,
): Promise<LeaveRequestNotification[]> {
  const { data, error } = await supabase
    .from('leave_requests')
    .select('id, leave_type, start_date, end_date, reviewed_at, status')
    .eq('requester_id', requesterId)
    .order('requested_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(5)
    .abortSignal(signal);
  if (error) throw new Error('No se pudieron cargar las solicitudes. Vuelve a intentar.');
  return (data ?? []).map(leaveRequestNotificationFromRow);
}

export async function countLeaveNotifications(
  profile: Pick<Profile, 'id' | 'role'>,
  reviewedAfter?: string,
  signal?: AbortSignal,
) {
  const query = supabase.from('leave_requests').select('id', { count: 'exact', head: true });
  const filtered =
    profile.role === 'admin'
      ? query.eq('status', 'pending').neq('requester_id', profile.id)
      : reviewedAfter
        ? query.eq('requester_id', profile.id).in('status', ['approved', 'rejected']).gt('reviewed_at', reviewedAfter)
        : query.eq('requester_id', profile.id).in('status', ['approved', 'rejected']);
  const { count, error } = await (signal ? filtered.abortSignal(signal) : filtered);
  if (error) throw new Error('No se pudo cargar el contador de notificaciones.');
  return count ?? 0;
}

export function canDeleteLeaveRequest(profile: Profile | null, request: LeaveRequest) {
  return Boolean(
    profile && request.status === 'pending' && (profile.role === 'admin' || request.requesterId === profile.id),
  );
}

export function canApproveLeaveRequest(profile: Profile | null, request: LeaveRequest) {
  return Boolean(profile?.role === 'admin' && request.status === 'pending' && request.requesterId !== profile.id);
}

export async function approveLeaveRequest(id: string) {
  const { data, error } = await supabase.rpc('approve_leave_request', { p_id: id });
  if (error) {
    if (error.code === '42501' || error.code === '22023') throw new Error(error.message);
    throw new Error('No se pudo autorizar. Revisa tu conexión y vuelve a intentar.');
  }
  if (data !== id) throw new Error('No se pudo confirmar la autorización. Vuelve a intentar.');
  notifyLeaveRequestsChanged();
}

export async function rejectLeaveRequest(id: string) {
  const { data, error } = await supabase.rpc('reject_leave_request', { p_id: id });
  if (error) {
    if (error.code === '42501' || error.code === '22023') throw new Error(error.message);
    throw new Error('No se pudo rechazar. Revisa tu conexión y vuelve a intentar.');
  }
  if (data !== id) throw new Error('No se pudo confirmar el rechazo. Vuelve a intentar.');
  notifyLeaveRequestsChanged();
}

export async function deleteLeaveRequest(id: string) {
  const { data, error } = await supabase.rpc('delete_leave_request', { p_id: id });
  if (error) {
    if (error.code === '42501') throw new Error('Tu cuenta no tiene acceso para eliminar esta solicitud.');
    if (error.code === '22023') throw new Error(error.message);
    throw new Error('No se pudo eliminar. Revisa tu conexión y vuelve a intentar.');
  }
  if (data !== id) throw new Error('No se pudo confirmar la eliminación. Vuelve a intentar.');
  notifyLeaveRequestsChanged();
}
