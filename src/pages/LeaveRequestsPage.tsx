import { useEffect, useId, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTeamDirectory } from '@/features/team/TeamProvider';
import { HOME_PATH } from '@/components/layout/navigation';
import { Badge } from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { formatDateTimeMx, formatReadableDate } from '@/lib/dates';
import { toast } from '@/lib/notify';
import { toNaturalCase } from '@/lib/utils';
import {
  canReviewLeaveRequests, canDeleteLeaveRequest, deleteLeaveRequest, leaveTypeLabel, listLeaveRequests, LEAVE_PAGE_SIZE,
  type LeaveRequest,
} from '@/features/leave/requests';
import './LeaveRequestsPage.css';

export function LeaveRequestsPage() {
  const { profile } = useAuth();
  const { members } = useTeamDirectory();
  const canReview = canReviewLeaveRequests(profile, members);
  const id = useId();
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [rows, setRows] = useState<LeaveRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState<LeaveRequest | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const deleteBusyRef = useRef(false);

  useEffect(() => {
    if (!canReview) return;
    let live = true;
    setLoading(true);
    setError('');
    void listLeaveRequests(page).then(result => {
      if (!live) return;
      if (result.requests.length === 0 && page > 0) {
        setPage(Math.max(0, Math.ceil(result.total / LEAVE_PAGE_SIZE) - 1));
        return;
      }
      setRows(result.requests);
      setTotal(result.total);
    }).catch(cause => {
      if (live) setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las solicitudes.');
    }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [canReview, page, revision]);

  async function removeRequest() {
    if (!removing || deleteBusyRef.current) return;
    deleteBusyRef.current = true;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteLeaveRequest(removing.id);
      setRemoving(null);
      toast.success({ title: 'Solicitud eliminada' });
      setRevision(value => value + 1);
    } catch (cause) {
      setDeleteError(cause instanceof Error ? cause.message : 'No se pudo eliminar la solicitud.');
    } finally {
      deleteBusyRef.current = false;
      setDeleting(false);
    }
  }

  if (!canReview) return <Navigate to={HOME_PATH} replace />;
  return (
    <main className="leave-requests-page container" aria-labelledby={`${id}-title`}>
      <header className="leave-requests-page__header">
        <div className="leave-requests-page__heading">
          <Link to={HOME_PATH} className="btn-text leave-requests-page__back" aria-label="Volver a Inicio">
            <ArrowLeft aria-hidden="true" />
          </Link>
          <h1 id={`${id}-title`} className="app-page-title">Vacaciones y permisos</h1>
        </div>

      </header>
      <section aria-label="Solicitudes del equipo" aria-busy={loading}>
        {loading ? <p role="status">Cargando solicitudes…</p>
          : error ? <div className="leave-requests-page__error">
            <p className="form-error-text" role="alert">{error}</p>
            <button type="button" className="btn-secondary" onClick={() => setRevision(value => value + 1)}>Reintentar</button>
          </div>
          : rows.length === 0 ? <div className="animated-empty-state leave-requests-page__empty" role="status">
            <div className="animated-empty-state__icon"><CalendarDays aria-hidden="true" /></div>
            <h2 className="animated-empty-state__title">Aún no hay solicitudes</h2>
            <p className="animated-empty-state__subtitle">Cuando el equipo envíe solicitudes, aparecerán aquí.</p>
          </div>
          : <><div className="leave-requests-page__table-scroll" role="region" aria-label="Tabla de solicitudes" tabIndex={0}>
            <table className="leave-requests-page__table">
              <caption className="sr-only">Solicitudes de vacaciones y permisos pendientes de validación</caption>
              <thead><tr>
                <th scope="col">Solicitante</th><th scope="col">Tipo</th><th scope="col">Fechas</th>
                <th scope="col">Solicitada el</th><th scope="col">Estado</th>
                <th scope="col"><span className="sr-only">Acciones</span></th>
              </tr></thead>
              <tbody>{rows.map(row => <tr key={row.id}>
                <th scope="row">{toNaturalCase(row.requesterName, { preserveAcronyms: false })}</th>
                <td>{leaveTypeLabel(row.type)}</td>
                <td><time dateTime={row.startDate}>{formatReadableDate(row.startDate)}</time>
                  {' – '}<time dateTime={row.endDate}>{formatReadableDate(row.endDate)}</time></td>
                <td><time dateTime={row.requestedAt}>{formatDateTimeMx(row.requestedAt)}</time></td>
                <td><div className="leave-requests-page__status">
                  <Badge>Pendiente de validación</Badge>
                  {row.requiresNoticeException && <span className="type-body-sm">Requiere excepción de anticipación</span>}
                </div></td>
                <td className="leave-requests-page__row-actions">
                  {canDeleteLeaveRequest(profile, row) && <button
                    type="button" className="btn-icon btn-icon--danger" disabled={deleting}
                    aria-label={`Eliminar solicitud de ${toNaturalCase(row.requesterName, { preserveAcronyms: false })} del ${formatReadableDate(row.startDate)} al ${formatReadableDate(row.endDate)}`}
                    title="Eliminar solicitud"
                    onClick={() => { setDeleteError(''); setRemoving(row); }}
                  ><Trash2 aria-hidden="true" /></button>}
                </td>
              </tr>)}</tbody>
            </table>
          </div>
          <ul className="leave-requests-page__cards" aria-label="Solicitudes del equipo">
            {rows.map(row => {
              const requester = toNaturalCase(row.requesterName, { preserveAcronyms: false });
              return <li key={row.id} className="leave-requests-page__card">
                <article aria-labelledby={`${id}-request-${row.id}`}>
                  <header className="leave-requests-page__card-header">
                    <h2 id={`${id}-request-${row.id}`}>{requester}</h2>
                    <span className="leave-requests-page__card-type">{leaveTypeLabel(row.type)}</span>
                  </header>
                  <div className="leave-requests-page__card-period">
                    <div>
                      <span className="leave-requests-page__card-label">Inicio</span>
                      <time dateTime={row.startDate}>{formatReadableDate(row.startDate)}</time>
                    </div>
                    <div>
                      <span className="leave-requests-page__card-label">Fin</span>
                      <time dateTime={row.endDate}>{formatReadableDate(row.endDate)}</time>
                    </div>
                  </div>
                  <div className="leave-requests-page__card-details">
                    <div className="leave-requests-page__card-state">
                      <Badge minimal>Pendiente de validación</Badge>
                      {row.requiresNoticeException && <span className="leave-requests-page__card-exception">Requiere excepción de anticipación</span>}
                    </div>
                    <div className="leave-requests-page__card-requested">
                      <span className="leave-requests-page__card-label">Solicitada el</span>
                      <time dateTime={row.requestedAt}>{formatDateTimeMx(row.requestedAt)}</time>
                    </div>
                  </div>
                  {canDeleteLeaveRequest(profile, row) && <footer className="leave-requests-page__card-footer">
                    <button type="button" className="btn-text leave-requests-page__card-delete" disabled={deleting}
                      aria-label={`Eliminar solicitud de ${requester} del ${formatReadableDate(row.startDate)} al ${formatReadableDate(row.endDate)}`}
                      onClick={() => { setDeleteError(''); setRemoving(row); }}>
                      <Trash2 aria-hidden="true" /> Eliminar
                    </button>
                  </footer>}
                </article>
              </li>;
            })}
          </ul></>}
      </section>
      {!loading && !error && total > LEAVE_PAGE_SIZE && <nav className="leave-requests-page__pagination" aria-label="Páginas de solicitudes">
        <button type="button" className="btn-secondary" disabled={page === 0} onClick={() => setPage(value => value - 1)}>
          <ChevronLeft aria-hidden="true" /> Anterior
        </button>
        <span className="type-body-sm" role="status">Página {page + 1} de {Math.ceil(total / LEAVE_PAGE_SIZE)}</span>
        <button type="button" className="btn-secondary" disabled={(page + 1) * LEAVE_PAGE_SIZE >= total}
          onClick={() => setPage(value => value + 1)}>Siguiente <ChevronRight aria-hidden="true" /></button>
      </nav>}
      {removing && <ConfirmModal
        isOpen title="Eliminar solicitud" confirmLabel="Eliminar" isDestructive
        description={<p className="type-body-md">
          {toNaturalCase(removing.requesterName, { preserveAcronyms: false })} · {leaveTypeLabel(removing.type)}: {formatReadableDate(removing.startDate)} al {formatReadableDate(removing.endDate)}.
          {' '}Se eliminará de forma definitiva.
        </p>}
        isLoading={deleting} loadingLabel="Eliminando…" errorMessage={deleteError}
        onConfirm={() => void removeRequest()}
        onCancel={() => { if (!deleteBusyRef.current) { setRemoving(null); setDeleteError(''); } }}
      />}
    </main>
  );
}
