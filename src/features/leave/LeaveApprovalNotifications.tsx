import { useEffect, useId, useState } from 'react';
import { Check, Clock3, X } from 'lucide-react';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import type { Language } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import {
  listLeaveRequests,
  listRecentLeaveRequests,
  LEAVE_PAGE_SIZE,
  type LeaveRequestNotification,
  type LeaveRequest,
} from './requests';
import { LeaveRequestHistory } from './LeaveRequestHistory';
import { LeaveNotificationRow } from './LeaveNotificationRow';
import { formatNotificationPeriod } from './formatNotificationPeriod';
import './LeaveApprovalNotifications.css';

interface LeaveApprovalNotificationsProps {
  open: boolean;
  language: Language;
  refreshKey: number;
  onDecisionsViewed: (latestReviewedAt?: string) => void;
}

type LoadResult =
  | {
      requestKey: string;
      mode: 'admin';
      state: 'loaded';
      requests: LeaveRequest[];
      total: number;
    }
  | {
      requestKey: string;
      mode: 'personal';
      state: 'loaded';
      requests: LeaveRequestNotification[];
    }
  | { requestKey: string; mode: 'admin' | 'personal'; state: 'error' };

function EmptyNotifications({ language, admin }: { language: Language; admin: boolean }) {
  const id = useId();
  const english = language === 'en';
  const title = admin
    ? english
      ? 'No requests yet'
      : 'Aún no hay solicitudes'
    : english
      ? 'No recent requests'
      : 'Aún no tienes solicitudes';
  const description = admin
    ? english
      ? 'Team requests will appear here.'
      : 'Las solicitudes del equipo aparecerán aquí.'
    : english
      ? 'Your vacation and leave requests will appear here.'
      : 'Aquí aparecerán tus solicitudes de vacaciones y permisos.';

  return (
    <section
      className="animated-empty-state leave-approval-notifications__empty"
      aria-live="polite"
      aria-labelledby={id}
    >
      <div className="leave-approval-notifications__mockup" aria-hidden="true">
        <div className="leave-approval-notifications__mockup-top" />
        <div className="leave-approval-notifications__mockup-row">
          <span />
          <span className="leave-approval-notifications__mockup-line" />
        </div>
        <div className="leave-approval-notifications__mockup-row">
          <span />
          <span className="leave-approval-notifications__mockup-line leave-approval-notifications__mockup-line--short" />
        </div>
      </div>
      <h4 className="animated-empty-state__title" id={id}>
        {title}
      </h4>
      <p className="animated-empty-state__subtitle">{description}</p>
    </section>
  );
}

export function LeaveApprovalNotifications({
  open,
  language,
  refreshKey,
  onDecisionsViewed,
}: LeaveApprovalNotificationsProps) {
  const { profile, profileLoading } = useAuth();
  const [loadResult, setLoadResult] = useState<LoadResult | null>(null);
  const [page, setPage] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [revision, setRevision] = useState(0);
  const english = language === 'en';
  const dateLocale = english ? 'en-US' : 'es-MX';
  const admin = profile?.role === 'admin';
  const mode = admin ? 'admin' : 'personal';
  const requestKey = `${mode}:${profile?.id ?? ''}:${page}:${retryCount}:${revision}:${refreshKey}`;
  const currentResult = loadResult?.requestKey === requestKey ? loadResult : null;
  const loadState = profileLoading ? 'loading' : !profile?.id ? 'account-error' : (currentResult?.state ?? 'loading');

  useEffect(() => {
    if (!open || profileLoading || !profile?.id) return;

    const controller = new AbortController();
    const load = async () => {
      try {
        if (admin) {
          const result = await listLeaveRequests(page, controller.signal);
          if (controller.signal.aborted) return;
          if (result.requests.length === 0 && page > 0) {
            setPage(Math.max(0, Math.ceil(result.total / LEAVE_PAGE_SIZE) - 1));
            return;
          }
          setLoadResult({
            requestKey,
            mode: 'admin',
            state: 'loaded',
            requests: result.requests,
            total: result.total,
          });
          return;
        }

        const requests = await listRecentLeaveRequests(profile.id, controller.signal);
        if (controller.signal.aborted) return;
        const latestReviewedAt = requests.reduce<string | undefined>(
          (latest, request) =>
            request.reviewedAt && (!latest || request.reviewedAt > latest) ? request.reviewedAt : latest,
          undefined,
        );
        onDecisionsViewed(latestReviewedAt);
        setLoadResult({ requestKey, mode: 'personal', state: 'loaded', requests });
      } catch {
        if (!controller.signal.aborted) setLoadResult({ requestKey, mode, state: 'error' });
      }
    };

    void load();
    return () => controller.abort();
  }, [admin, mode, onDecisionsViewed, open, page, profile?.id, profileLoading, requestKey]);

  if (!open) return null;

  if (loadState === 'loading') {
    return (
      <LoadingSkeleton
        className="leave-approval-notifications__loading"
        label={english ? 'Loading notifications' : 'Cargando notificaciones'}
      >
        {Array.from({ length: 3 }, (_, index) => (
          <div className="leave-approval-notifications__loading-row" aria-hidden="true" key={index}>
            <div className="leave-approval-notifications__loading-copy">
              <span className="loading-skeleton__bone leave-approval-notifications__loading-line" />
              <span className="loading-skeleton__bone leave-approval-notifications__loading-line leave-approval-notifications__loading-line--short" />
            </div>
            <span className="loading-skeleton__bone leave-approval-notifications__loading-status" />
          </div>
        ))}
      </LoadingSkeleton>
    );
  }

  if (loadState === 'account-error') {
    return (
      <p className="leave-approval-notifications__state" role="alert">
        {english
          ? 'Your account could not be loaded. Sign in again to view notifications.'
          : 'No se pudo cargar tu cuenta. Inicia sesión de nuevo para ver las notificaciones.'}
      </p>
    );
  }

  if (loadState === 'error') {
    return (
      <div className="leave-approval-notifications__state" role="alert">
        <p>
          {admin
            ? english
              ? 'Request history could not be loaded.'
              : 'No se pudo cargar el historial de solicitudes.'
            : english
              ? 'Your requests could not be loaded.'
              : 'No se pudieron cargar tus solicitudes.'}
        </p>
        <button type="button" className="btn-secondary btn-sm" onClick={() => setRetryCount((count) => count + 1)}>
          {english ? 'Retry' : 'Reintentar'}
        </button>
      </div>
    );
  }

  if (!currentResult || currentResult.state !== 'loaded' || !profile) return null;

  if (currentResult.mode === 'admin') {
    if (currentResult.requests.length === 0) return <EmptyNotifications language={language} admin />;
    return (
      <LeaveRequestHistory
        requests={currentResult.requests}
        total={currentResult.total}
        page={page}
        profile={profile}
        language={language}
        onPageChange={setPage}
        onReviewed={() => setRevision((value) => value + 1)}
      />
    );
  }

  if (currentResult.requests.length === 0) {
    return <EmptyNotifications language={language} admin={false} />;
  }

  return (
    <ul
      className="leave-approval-notifications__list"
      aria-label={english ? 'Recent vacation and leave requests' : 'Solicitudes recientes de vacaciones y permisos'}
    >
      {currentResult.requests.map((request) => {
        const typeLabel =
          request.type === 'vacation' ? (english ? 'Vacation' : 'Vacaciones') : english ? 'Permission' : 'Permiso';
        const status =
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
        const StatusIcon = status.icon;

        return (
          <LeaveNotificationRow
            key={request.id}
            title={typeLabel}
            subtitle={formatNotificationPeriod(request.startDate, request.endDate, dateLocale)}
            trailing={
              <span className="leave-approval-notifications__decision">
                <StatusIcon aria-hidden="true" />
                {status.label}
              </span>
            }
          />
        );
      })}
    </ul>
  );
}
