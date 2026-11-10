import { useEffect, useId, useRef, useState } from 'react';
import { PageHeading } from '@/components/layout/PageHeading';
import { Link } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Check, Info, LoaderCircle, Trash2, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { useTeamDirectory } from '@/features/team/TeamProvider';
import { leaveErrorText } from '@/features/leave/translations';
import { HOME_PATH } from '@/components/layout/navigation';
import { Badge } from '@/components/ui/Badge';
import { StatusPage } from '@/components/ui/StatusPage';
import { BoneyardSkeleton } from '@/components/ui/BoneyardSkeleton';
import { Tooltip } from '@/components/ui/Tooltip';
import { Pagination } from '@/components/ui/Pagination';
import { isBoneyardBuild } from '@/lib/boneyard';
import { formatDateTimeMx, formatReadableDate } from '@/lib/dates';
import { toast } from '@/lib/notify';
import { playSound } from '@/lib/sound';
import { toNaturalCase } from '@/lib/utils';
import { LeaveRequestsSkeletonFixture } from './LeaveRequestsSkeletonFixture';
import {
  approveLeaveRequest,
  canApproveLeaveRequest,
  canReviewLeaveRequests,
  canDeleteLeaveRequest,
  deleteLeaveRequest,
  leaveStatusLabel,
  leaveTypeLabel,
  listLeaveRequests,
  rejectLeaveRequest,
  LEAVE_PAGE_SIZE,
  type LeaveRequest,
} from '@/features/leave/requests';
import './LeaveRequestsPage.css';

const copy = {
  es: {
    loading: 'Cargando solicitudes…',
    title: 'Vacaciones y permisos',
    team: 'Solicitudes del equipo',
    retry: 'Reintentar',
    emptyTitle: 'Aún no hay solicitudes',
    emptyText: 'Cuando el equipo envíe solicitudes, aparecerán aquí.',
    table: 'Tabla de solicitudes',
    caption: 'Solicitudes de vacaciones y permisos del equipo',
    requester: 'Solicitante',
    type: 'Tipo',
    dates: 'Fechas',
    requested: 'Solicitada el',
    status: 'Estado',
    actions: 'Acciones',
    start: 'Inicio',
    end: 'Fin',
    approve: 'Autorizar',
    reject: 'Rechazar',
    delete: 'Eliminar',
    confirm: 'Confirmar',
    approveRequest: 'Autorizar solicitud',
    rejectRequest: 'Rechazar solicitud',
    deleteRequest: 'Eliminar solicitud',
    pages: 'Páginas de solicitudes',
    approving: 'Autorizando…',
    rejecting: 'Rechazando…',
    deleting: 'Eliminando…',
    approved: 'Solicitud autorizada',
    rejected: 'Solicitud rechazada',
    deleted: 'Solicitud eliminada',
  },
  en: {
    loading: 'Loading requests…',
    title: 'Vacation and leave requests',
    team: 'Team requests',
    retry: 'Retry',
    emptyTitle: 'No requests yet',
    emptyText: 'Requests will appear here when team members submit them.',
    table: 'Requests table',
    caption: 'Team vacation and leave requests',
    requester: 'Requested by',
    type: 'Type',
    dates: 'Dates',
    requested: 'Requested on',
    status: 'Status',
    actions: 'Actions',
    start: 'Start',
    end: 'End',
    approve: 'Approve',
    reject: 'Reject',
    delete: 'Delete',
    confirm: 'Confirm',
    approveRequest: 'Approve request',
    rejectRequest: 'Reject request',
    deleteRequest: 'Delete request',
    pages: 'Request pages',
    approving: 'Approving…',
    rejecting: 'Rejecting…',
    deleting: 'Deleting…',
    approved: 'Request approved',
    rejected: 'Request rejected',
    deleted: 'Request deleted',
  },
} as const;

function typeLabel(request: LeaveRequest, language: Language) {
  if (language === 'es') return leaveTypeLabel(request.type);
  return request.type === 'vacation' ? 'Vacation' : 'Leave';
}

function statusLabel(request: LeaveRequest, language: Language) {
  if (language === 'es') return leaveStatusLabel(request.status);
  if (request.status === 'approved') return 'Approved';
  if (request.status === 'rejected') return 'Rejected';
  return 'Pending';
}

function noticeLabel(request: LeaveRequest, language: Language) {
  if (language === 'en') {
    if (request.status === 'approved') return 'Advance notice exception approved';
    if (request.status === 'rejected') return 'Advance notice exception rejected';
    return 'Advance notice exception required';
  }
  if (request.status === 'approved') return 'Excepción de anticipación autorizada';
  if (request.status === 'rejected') return 'Excepción de anticipación rechazada';
  return 'Requiere excepción de anticipación';
}

export function LeaveRequestsPage() {
  const { language } = useLanguage();
  const t = copy[language];
  const dateLocale = language === 'en' ? 'en-US' : 'es-MX';
  const date = (value: string) => formatReadableDate(value, dateLocale);
  const { profile } = useAuth();
  const { members } = useTeamDirectory();
  const canReview = canReviewLeaveRequests(profile, members);
  const isBuild = isBoneyardBuild();
  const id = useId();
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [rows, setRows] = useState<LeaveRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadedPage, setLoadedPage] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [reviewAction, setReviewAction] = useState<{
    kind: 'approve' | 'reject' | 'delete';
    request: LeaveRequest;
  } | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const actionBusyRef = useRef(false);

  function openReview(kind: 'approve' | 'reject' | 'delete', request: LeaveRequest) {
    playSound(kind === 'approve' ? 'open' : 'warning');
    setReviewAction({ kind, request });
  }

  function cancelReview(kind: 'approve' | 'reject' | 'delete', requestId: string) {
    if (actionBusyRef.current) return;
    setReviewAction((current) => (current?.kind === kind && current.request.id === requestId ? null : current));
  }

  useEffect(() => {
    if (!canReview) return;
    let live = true;
    setLoading(true);
    setError('');
    void listLeaveRequests(page)
      .then((result) => {
        if (!live) return;
        if (result.requests.length === 0 && page > 0) {
          setPage(Math.max(0, Math.ceil(result.total / LEAVE_PAGE_SIZE) - 1));
          return;
        }
        setRows(result.requests);
        setTotal(result.total);
        setLoadedPage(page);
      })
      .catch((cause) => {
        if (live) setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las solicitudes.');
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [canReview, page, revision]);

  async function completeReviewAction() {
    if (!reviewAction || actionBusyRef.current) return;
    actionBusyRef.current = true;
    setActionBusy(true);
    try {
      if (reviewAction.kind === 'approve') await approveLeaveRequest(reviewAction.request.id);
      else if (reviewAction.kind === 'reject') await rejectLeaveRequest(reviewAction.request.id);
      else await deleteLeaveRequest(reviewAction.request.id);
      if (reviewAction.kind === 'approve' || reviewAction.kind === 'reject') {
        setRows((current) =>
          current.map((row) =>
            row.id === reviewAction.request.id
              ? { ...row, status: reviewAction.kind === 'approve' ? 'approved' : 'rejected' }
              : row,
          ),
        );
      } else {
        setRows((current) => current.filter((row) => row.id !== reviewAction.request.id));
        setTotal((current) => Math.max(0, current - 1));
      }
      playSound('success');
      toast.success({
        title: reviewAction.kind === 'approve' ? t.approved : reviewAction.kind === 'reject' ? t.rejected : t.deleted,
      });
      setReviewAction(null);
      setRevision((value) => value + 1);
    } catch (cause) {
      playSound('error');
      toast.error({
        title: leaveErrorText(cause instanceof Error ? cause.message : 'No se pudo actualizar la solicitud.', language),
      });
    } finally {
      actionBusyRef.current = false;
      setActionBusy(false);
    }
  }

  function requestActions(request: LeaveRequest, card: boolean) {
    const requester = toNaturalCase(request.requesterName, { preserveAcronyms: false });
    const confirmingApprove = reviewAction?.kind === 'approve' && reviewAction.request.id === request.id;
    const confirmingReject = reviewAction?.kind === 'reject' && reviewAction.request.id === request.id;
    const confirmingDelete = reviewAction?.kind === 'delete' && reviewAction.request.id === request.id;
    const period = `${date(request.startDate)} – ${date(request.endDate)}`;
    return (
      <>
        {canApproveLeaveRequest(profile, request) && !confirmingDelete && !confirmingReject && (
          <button
            type="button"
            className={`${card ? 'btn-secondary leave-requests-page__card-action' : 'btn-icon'} leave-requests-page__action-approve${confirmingApprove ? ' leave-requests-page__action-confirm' : ''}`}
            disabled={actionBusy || loading}
            aria-busy={actionBusy && confirmingApprove}
            aria-label={`${actionBusy && confirmingApprove ? t.approving : confirmingApprove ? `${t.confirm} ${t.approve.toLowerCase()}` : t.approveRequest}: ${requester}, ${period}`}
            title={confirmingApprove ? `${t.confirm} ${t.approve.toLowerCase()}` : t.approveRequest}
            onClick={() => {
              if (confirmingApprove) {
                playSound('tap');
                void completeReviewAction();
              } else openReview('approve', request);
            }}
            onBlur={() => cancelReview('approve', request.id)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                cancelReview('approve', request.id);
              }
            }}
          >
            {actionBusy && confirmingApprove ? (
              <LoaderCircle className="leave-requests-page__action-spinner" aria-hidden="true" />
            ) : confirmingApprove ? (
              <span>{t.confirm}</span>
            ) : (
              <>
                <Check aria-hidden="true" />
                {card && <span>{t.approve}</span>}
              </>
            )}
          </button>
        )}
        {canApproveLeaveRequest(profile, request) && !confirmingDelete && !confirmingApprove && (
          <button
            type="button"
            className={`${card ? 'btn-secondary leave-requests-page__card-action' : 'btn-icon btn-icon--danger'} leave-requests-page__action-reject${confirmingReject ? ' leave-requests-page__action-confirm' : ''}`}
            disabled={actionBusy || loading}
            aria-busy={actionBusy && confirmingReject}
            aria-label={`${actionBusy && confirmingReject ? t.rejecting : confirmingReject ? `${t.confirm} ${t.reject.toLowerCase()}` : t.rejectRequest}: ${requester}, ${period}`}
            title={confirmingReject ? `${t.confirm} ${t.reject.toLowerCase()}` : t.rejectRequest}
            onClick={() => {
              if (confirmingReject) {
                playSound('tap');
                void completeReviewAction();
              } else openReview('reject', request);
            }}
            onBlur={() => cancelReview('reject', request.id)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                cancelReview('reject', request.id);
              }
            }}
          >
            {actionBusy && confirmingReject ? (
              <LoaderCircle className="leave-requests-page__action-spinner" aria-hidden="true" />
            ) : confirmingReject ? (
              <span>{t.confirm}</span>
            ) : (
              <>
                <X aria-hidden="true" />
                {card && <span>{t.reject}</span>}
              </>
            )}
          </button>
        )}
        {canDeleteLeaveRequest(profile, request) && !confirmingApprove && !confirmingReject && (
          <button
            type="button"
            className={`${card ? 'btn-secondary leave-requests-page__card-action' : 'btn-icon btn-icon--danger'} leave-requests-page__action-delete${confirmingDelete ? ' leave-requests-page__action-confirm' : ''}`}
            disabled={actionBusy || loading}
            aria-busy={actionBusy && confirmingDelete}
            aria-label={`${actionBusy && confirmingDelete ? t.deleting : confirmingDelete ? `${t.confirm} ${t.delete.toLowerCase()}` : t.deleteRequest}: ${requester}, ${period}`}
            title={confirmingDelete ? `${t.confirm} ${t.delete.toLowerCase()}` : t.deleteRequest}
            onClick={() => {
              if (confirmingDelete) {
                playSound('tap');
                void completeReviewAction();
              } else openReview('delete', request);
            }}
            onBlur={() => cancelReview('delete', request.id)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                cancelReview('delete', request.id);
              }
            }}
          >
            {actionBusy && confirmingDelete ? (
              <LoaderCircle className="leave-requests-page__action-spinner" aria-hidden="true" />
            ) : confirmingDelete ? (
              <span>{t.confirm}</span>
            ) : (
              <>
                <Trash2 aria-hidden="true" />
                {card && <span>{t.delete}</span>}
              </>
            )}
          </button>
        )}
      </>
    );
  }

  const showSkeleton = loading && loadedPage === null;
  const changingPage = loadedPage !== null && loadedPage !== page;
  const loadError = error ? (
    <div className="leave-requests-page__error">
      <p className="form-error-text" role="alert">
        {leaveErrorText(error, language)}
      </p>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => {
          playSound('tap');
          setRevision((value) => value + 1);
        }}
      >
        {t.retry}
      </button>
    </div>
  ) : null;

  if (!canReview && !isBuild) return <StatusPage kind="forbidden" />;
  return (
    <BoneyardSkeleton
      name="leave-requests-page"
      loading={showSkeleton}
      loadingLabel={t.loading}
      fixture={isBuild ? <LeaveRequestsSkeletonFixture /> : undefined}
    >
      <main className="leave-requests-page container" aria-labelledby={`${id}-title`}>
        <PageHeading id={`${id}-title`} className="app-page-title">
          <Link
            to={HOME_PATH}
            className="leave-requests-page__title-link"
            onClick={() => playSound('navigate', { direction: 'back' })}
          >
            <ArrowLeft size="var(--icon-size-md)" aria-hidden="true" />
            {t.title}
          </Link>
        </PageHeading>
        <section className="leave-requests-page__content" aria-label={t.team} aria-busy={loading}>
          {showSkeleton ? null : changingPage && error ? (
            loadError
          ) : changingPage || (!error && rows.length === 0 && total > 0) ? (
            <p role="status">{t.loading}</p>
          ) : (
            <>
              {loadError}
              {error && rows.length === 0 ? null : rows.length === 0 ? (
                <div className="animated-empty-state leave-requests-page__empty" role="status">
                  <div className="animated-empty-state__icon">
                    <CalendarDays aria-hidden="true" />
                  </div>
                  <h2 className="animated-empty-state__title">{t.emptyTitle}</h2>
                  <p className="animated-empty-state__subtitle">{t.emptyText}</p>
                </div>
              ) : (
                <>
                  <div className="leave-requests-page__table-scroll" role="region" aria-label={t.table} tabIndex={0}>
                    <table className="leave-requests-page__table data-table">
                      <caption className="sr-only">{t.caption}</caption>
                      <thead>
                        <tr>
                          <th scope="col">{t.requester}</th>
                          <th scope="col">{t.type}</th>
                          <th scope="col">{t.dates}</th>
                          <th scope="col">{t.requested}</th>
                          <th scope="col">{t.status}</th>
                          <th scope="col">{t.actions}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr key={row.id}>
                            <th scope="row">{toNaturalCase(row.requesterName, { preserveAcronyms: false })}</th>
                            <td>{typeLabel(row, language)}</td>
                            <td>
                              <time dateTime={row.startDate}>{date(row.startDate)}</time>
                              {' – '}
                              <time dateTime={row.endDate}>{date(row.endDate)}</time>
                            </td>
                            <td>
                              <time dateTime={row.requestedAt}>{formatDateTimeMx(row.requestedAt, dateLocale)}</time>
                            </td>
                            <td>
                              <div className="leave-requests-page__status">
                                <Badge
                                  className="leave-requests-page__status-badge"
                                  variant={
                                    row.status === 'approved'
                                      ? 'success'
                                      : row.status === 'rejected'
                                        ? 'error'
                                        : 'warning'
                                  }
                                >
                                  {statusLabel(row, language)}
                                </Badge>
                                {row.requiresNoticeException && (
                                  <Tooltip content={noticeLabel(row, language)}>
                                    <button
                                      type="button"
                                      className="btn-icon leave-requests-page__notice"
                                      aria-label={noticeLabel(row, language)}
                                      onClick={() => playSound('tap')}
                                    >
                                      <Info aria-hidden="true" />
                                    </button>
                                  </Tooltip>
                                )}
                              </div>
                            </td>
                            <td className="leave-requests-page__row-actions">
                              <div className="leave-requests-page__actions">{requestActions(row, false)}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <ul className="leave-requests-page__cards" aria-label={t.team}>
                    {rows.map((row) => {
                      const requester = toNaturalCase(row.requesterName, { preserveAcronyms: false });
                      return (
                        <li key={row.id} className="leave-requests-page__card">
                          <article aria-labelledby={`${id}-request-${row.id}`}>
                            <header className="leave-requests-page__card-header">
                              <div className="leave-requests-page__card-requester">
                                <h2 id={`${id}-request-${row.id}`}>{requester}</h2>
                                {row.requiresNoticeException && (
                                  <Tooltip content={noticeLabel(row, language)}>
                                    <button
                                      type="button"
                                      className="btn-icon leave-requests-page__notice"
                                      aria-label={noticeLabel(row, language)}
                                      onClick={() => playSound('tap')}
                                    >
                                      <Info aria-hidden="true" />
                                    </button>
                                  </Tooltip>
                                )}
                              </div>
                              <span className="leave-requests-page__card-type">{typeLabel(row, language)}</span>
                            </header>
                            <div className="leave-requests-page__card-period">
                              <div>
                                <span className="leave-requests-page__card-label">{t.start}</span>
                                <time dateTime={row.startDate}>{date(row.startDate)}</time>
                              </div>
                              <div>
                                <span className="leave-requests-page__card-label">{t.end}</span>
                                <time dateTime={row.endDate}>{date(row.endDate)}</time>
                              </div>
                            </div>
                            <div className="leave-requests-page__card-details">
                              <div className="leave-requests-page__card-state">
                                <Badge
                                  className="leave-requests-page__status-badge"
                                  variant={
                                    row.status === 'approved'
                                      ? 'success'
                                      : row.status === 'rejected'
                                        ? 'error'
                                        : 'warning'
                                  }
                                >
                                  {statusLabel(row, language)}
                                </Badge>
                              </div>
                              <div className="leave-requests-page__card-requested">
                                <span className="leave-requests-page__card-label">{t.requested}</span>
                                <time dateTime={row.requestedAt}>{formatDateTimeMx(row.requestedAt, dateLocale)}</time>
                              </div>
                            </div>
                            {(canApproveLeaveRequest(profile, row) || canDeleteLeaveRequest(profile, row)) && (
                              <footer className="leave-requests-page__card-footer">{requestActions(row, true)}</footer>
                            )}
                          </article>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </>
          )}
        </section>
        {!showSkeleton && !changingPage && rows.length > 0 && total > LEAVE_PAGE_SIZE && (
          <Pagination
            currentPage={page + 1}
            totalPages={Math.ceil(total / LEAVE_PAGE_SIZE)}
            onPageChange={(target) => {
              setReviewAction(null);
              setPage(target - 1);
            }}
            canGoPrev={!loading && page > 0}
            canGoNext={!loading && (page + 1) * LEAVE_PAGE_SIZE < total}
            ariaLabel={t.pages}
          />
        )}
      </main>
    </BoneyardSkeleton>
  );
}
