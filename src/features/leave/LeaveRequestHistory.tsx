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
import { LeaveRequestActions, type LeaveReviewKind } from './LeaveRequestActions';
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
  const [busyAction, setBusyAction] = useState<{ id: string; kind: LeaveReviewKind } | null>(null);
  const actionBusyRef = useRef(false);
  const english = language === 'en';
  const dateLocale = english ? 'en-US' : 'es-MX';
  const totalPages = Math.max(1, Math.ceil(total / LEAVE_PAGE_SIZE));

  async function review(request: LeaveRequest, kind: LeaveReviewKind) {
    if (actionBusyRef.current) return;

    actionBusyRef.current = true;
    setBusyAction({ id: request.id, kind });
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
      onReviewed();
    } catch (cause) {
      playSound('error');
      const message = cause instanceof Error ? cause.message : 'No se pudo actualizar la solicitud.';
      toast.error({ title: leaveErrorText(message, language) });
    } finally {
      actionBusyRef.current = false;
      setBusyAction(null);
    }
  }

  return (
    <>
      <ul
        className="leave-approval-notifications__list"
        aria-label={english ? 'Leave request history' : 'Historial de solicitudes'}
      >
        {requests.map((request) => {
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
                  <LeaveRequestActions
                    subject={`${request.requesterName}, ${period}`}
                    language={language}
                    busyKind={busyAction?.id === request.id ? busyAction.kind : null}
                    disabled={busyAction !== null}
                    onReview={(kind) => void review(request, kind)}
                  />
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
