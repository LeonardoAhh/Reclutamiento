import { useRef, useState } from 'react';
import { Check, Clock3, X } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import type { Language } from '@/contexts/LanguageContext';
import type { Profile } from '@/hooks/useAuth';
import { toast } from '@/lib/notify';
import { playSound } from '@/lib/sound';
import { leaveErrorText } from './translations';
import {
  approveLeaveRequest,
  canApproveLeaveRequest,
  leaveTypeLabel,
  rejectLeaveRequest,
  LEAVE_PAGE_SIZE,
  type LeaveRequest,
} from './requests';
import { LeaveNotificationRow } from './LeaveNotificationRow';
import { formatNotificationPeriod } from './formatNotificationPeriod';

interface LeaveRequestHistoryProps {
  requests: LeaveRequest[];
  total: number;
  page: number;
  profile: Profile;
  language: Language;
  onPageChange: (page: number) => void;
  onReviewed: () => void;
}

export function LeaveRequestHistory({
  requests,
  total,
  page,
  profile,
  language,
  onPageChange,
  onReviewed,
}: LeaveRequestHistoryProps) {
  const [confirmingAction, setConfirmingAction] = useState<{ id: string; kind: 'approve' | 'reject' } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const actionBusyRef = useRef(false);
  const english = language === 'en';
  const dateLocale = english ? 'en-US' : 'es-MX';
  const totalPages = Math.max(1, Math.ceil(total / LEAVE_PAGE_SIZE));

  async function review(request: LeaveRequest, kind: 'approve' | 'reject') {
    if (actionBusyRef.current) return;
    if (confirmingAction?.id !== request.id || confirmingAction.kind !== kind) {
      setConfirmingAction({ id: request.id, kind });
      return;
    }

    actionBusyRef.current = true;
    setBusyId(request.id);
    try {
      if (kind === 'approve') await approveLeaveRequest(request.id);
      else await rejectLeaveRequest(request.id);
      playSound('success');
      toast.success({
        title:
          kind === 'approve'
            ? english
              ? 'Request approved'
              : 'Solicitud autorizada'
            : english
              ? 'Request rejected'
              : 'Solicitud rechazada',
      });
      setConfirmingAction(null);
      onReviewed();
    } catch (cause) {
      playSound('error');
      const message = cause instanceof Error ? cause.message : 'No se pudo actualizar la solicitud.';
      toast.error({ title: leaveErrorText(message, language) });
    } finally {
      actionBusyRef.current = false;
      setBusyId(null);
    }
  }

  return (
    <>
      <ul
        className="leave-approval-notifications__list"
        aria-label={english ? 'Leave request history' : 'Historial de solicitudes'}
      >
        {requests.map((request) => {
          const busy = busyId === request.id;
          const decision =
            request.status === 'approved'
              ? {
                  icon: Check,
                  label: english ? 'Approved' : 'Autorizada',
                }
              : request.status === 'rejected'
                ? {
                    icon: X,
                    label: english ? 'Rejected' : 'Rechazada',
                  }
                : {
                    icon: Clock3,
                    label: english ? 'Pending' : 'Pendiente',
                  };
          const DecisionIcon = decision.icon;
          const period = formatNotificationPeriod(request.startDate, request.endDate, dateLocale);
          const type = english
            ? request.type === 'vacation'
              ? 'Vacation'
              : 'Permission'
            : leaveTypeLabel(request.type);
          return (
            <LeaveNotificationRow
              key={request.id}
              title={`${request.requesterName} · ${type}`}
              subtitle={period}
              trailing={
                canApproveLeaveRequest(profile, request) ? (
                  <div className="leave-approval-notifications__actions">
                    {(confirmingAction?.id === request.id
                      ? [confirmingAction.kind]
                      : (['approve', 'reject'] as const)
                    ).map((kind) => {
                      const confirming = confirmingAction?.id === request.id && confirmingAction.kind === kind;
                      const label =
                        kind === 'approve' ? (english ? 'Approve' : 'Autorizar') : english ? 'Reject' : 'Rechazar';
                      const confirmLabel =
                        kind === 'approve'
                          ? english
                            ? 'Confirm approval'
                            : 'Confirmar autorización'
                          : english
                            ? 'Confirm rejection'
                            : 'Confirmar rechazo';
                      const busyLabel =
                        kind === 'approve'
                          ? english
                            ? 'Approving'
                            : 'Autorizando'
                          : english
                            ? 'Rejecting'
                            : 'Rechazando';

                      return (
                        <button
                          key={kind}
                          type="button"
                          className="btn-secondary btn-sm leave-approval-notifications__action"
                          disabled={busyId !== null}
                          aria-busy={busy && confirming}
                          aria-label={`${busy && confirming ? busyLabel : confirming ? confirmLabel : label}: ${request.requesterName}, ${period}`}
                          onClick={() => {
                            if (confirming) playSound('tap');
                            void review(request, kind);
                          }}
                          onBlur={() => {
                            if (confirmingAction?.id === request.id && confirmingAction.kind === kind && !busyId) {
                              setConfirmingAction(null);
                            }
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Escape') {
                              event.preventDefault();
                              setConfirmingAction(null);
                            }
                          }}
                        >
                          {busy && confirming
                            ? kind === 'approve'
                              ? english
                                ? 'Approving…'
                                : 'Autorizando…'
                              : english
                                ? 'Rejecting…'
                                : 'Rechazando…'
                            : confirming
                              ? english
                                ? 'Confirm'
                                : 'Confirmar'
                              : label}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <span className="leave-approval-notifications__decision">
                    <DecisionIcon aria-hidden="true" />
                    {decision.label}
                  </span>
                )
              }
            />
          );
        })}
      </ul>
      <Pagination
        currentPage={page + 1}
        totalPages={totalPages}
        onPageChange={(nextPage) => onPageChange(nextPage - 1)}
        canGoPrev={page > 0}
        canGoNext={page + 1 < totalPages}
        ariaLabel={english ? 'Request history pages' : 'Páginas del historial'}
      />
    </>
  );
}
