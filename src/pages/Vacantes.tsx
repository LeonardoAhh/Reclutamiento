import { useMemo, useState } from 'react';
import {
  ClipboardList,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Trash2,
  Search,
  SlidersHorizontal,
  EyeOff,
  Plus,
} from 'lucide-react';
import { VacancySheet } from '@/components/ui/VacancySheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { SkeletonTable } from '@/components/ui/PageSkeletons';
import {
  VacancyStatusBadge,
  VacancyPriorityBadge,
} from '@/components/ui/VacancyStatusBadge';
import {
  VacancyFilters,
  EMPTY_VACANCY_FILTERS,
  type VacancyFilterState,
} from '@/components/vacancies/VacancyFilters';
import { useVacancyRequests } from '@/hooks/useVacancyRequests';
import {
  VACANCY_STATUSES,
  VACANCY_STATUS_LABEL,
  DEFAULT_VACANCY_SLA_DAYS,
} from '@/lib/types';
import type { VacancyRequest, VacancyStatus } from '@/lib/types';
import {
  formatShortDate,
  businessDaysBetween,
  startOfDayMxMs,
  endOfDayMxMs,
} from '@/lib/dates';
import './Pipeline.css';
import './Vacantes.css';

const FILTERS_STORAGE_KEY = 'vacantes_filters_v1';

type SheetMode = 'add' | 'edit' | 'delete' | null;

interface VacancyMetrics {
  diasAbierta: number;
  sla: number;
  vencida: boolean;
  /** Una vacante "cuenta" si NO está excluida del indicador. */
  cuentaEnKpi: boolean;
}

function computeMetrics(v: VacancyRequest): VacancyMetrics {
  const sla = typeof v.dias_sla === 'number' ? v.dias_sla : DEFAULT_VACANCY_SLA_DAYS;
  const end =
    v.status === 'cubierta' && v.fecha_cubierta ? v.fecha_cubierta : new Date();
  const diasAbierta = v.fecha_apertura ? businessDaysBetween(v.fecha_apertura, end) : 0;
  const vencida =
    v.status !== 'cubierta' &&
    v.status !== 'cancelada' &&
    diasAbierta > sla;
  return {
    diasAbierta,
    sla,
    vencida,
    cuentaEnKpi: !v.excluida_indicador,
  };
}

export function Vacantes() {
  const {
    vacancies,
    loading,
    addVacancy,
    updateVacancy,
    setVacancyStatus,
    deleteVacancy,
    getHistoryFor,
  } = useVacancyRequests();

  const [searchTerm, setSearchTerm] = useState('');
  const [sheetMode, setSheetMode] = useState<SheetMode>(null);
  const [selected, setSelected] = useState<VacancyRequest | null>(null);
  const [filters, setFilters] = useState<VacancyFilterState>(() => {
    try {
      const stored = localStorage.getItem(FILTERS_STORAGE_KEY);
      if (!stored) return EMPTY_VACANCY_FILTERS;
      return {
        ...EMPTY_VACANCY_FILTERS,
        ...(JSON.parse(stored) as Partial<VacancyFilterState>),
      };
    } catch {
      return EMPTY_VACANCY_FILTERS;
    }
  });
  const [showFilters, setShowFilters] = useState(() =>
    Object.values(filters).some((v) => v !== '')
  );

  function changeFilters(next: VacancyFilterState) {
    setFilters(next);
    try {
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  function resetFilters() {
    changeFilters(EMPTY_VACANCY_FILTERS);
  }

  const activeFiltersCount = (
    Object.keys(filters) as Array<keyof VacancyFilterState>
  ).filter((k) => filters[k] !== '').length;

  /** Vacantes con sus métricas precalculadas, para no recalcular en cada render. */
  const enriched = useMemo(
    () => vacancies.map((v) => ({ vacancy: v, metrics: computeMetrics(v) })),
    [vacancies]
  );

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    // Filtros de rango anclados a TZ MX para evitar desfases del visor.
    const desde = startOfDayMxMs(filters.fechaDesde);
    const hasta = endOfDayMxMs(filters.fechaHasta);

    return enriched.filter(({ vacancy: v }) => {
      if (filters.area && v.area !== filters.area) return false;
      if (filters.puesto && v.puesto !== filters.puesto) return false;
      if (filters.status && v.status !== filters.status) return false;
      if (filters.prioridad && v.prioridad !== filters.prioridad) return false;
      if (filters.reclutador && (v.reclutador_asignado ?? '') !== filters.reclutador)
        return false;

      if (desde || hasta) {
        const ts = v.fecha_apertura ? new Date(v.fecha_apertura).getTime() : NaN;
        if (Number.isNaN(ts)) return false;
        if (desde && ts < desde) return false;
        if (hasta && ts > hasta) return false;
      }

      if (q) {
        const haystack = [
          v.puesto,
          v.area,
          v.seccion,
          v.reclutador_asignado,
          v.fuente_planeada,
          v.justificacion,
          v.motivo_exclusion,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [enriched, searchTerm, filters]);

  function openAdd() {
    setSelected(null);
    setSheetMode('add');
  }

  function openEdit(v: VacancyRequest) {
    setSelected(v);
    setSheetMode('edit');
  }

  function openDelete(v: VacancyRequest) {
    setSelected(v);
    setSheetMode('delete');
  }

  function closeSheet() {
    setSheetMode(null);
    setSelected(null);
  }

  async function handleSave(
    payload: Omit<VacancyRequest, 'id' | 'created_at' | 'updated_at'>,
    id?: string
  ) {
    if (id) return updateVacancy(id, payload);
    return addVacancy(payload);
  }

  async function handleStatusChange(v: VacancyRequest, status: VacancyStatus) {
    if (!v.id || v.status === status) return;
    await setVacancyStatus(v.id, status);
  }

  if (loading) {
    return (
      <main className="pipeline container">
        <section className="pipeline__hero">
          <div>
            <h1>Vacancies</h1>
          </div>
        </section>
        <section className="pipeline__controls">
          <Skeleton
            height={40}
            radius="var(--rounded-md)"
            style={{ flex: '1 1 260px' }}
          />
        </section>
        <SkeletonTable
          rows={8}
          columns={['28%', '22%', '20%', '16%', '14%']}
        />
      </main>
    );
  }

  return (
    <main className="pipeline container">
      {/* ── Hero ── */}
      <section className="pipeline__hero">
        <div className="pipeline__hero-content">
          <h1>Vacancies</h1>
        </div>
        <div className="pipeline__hero-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={openAdd}
            aria-label="Nueva vacante"
            title="Nueva vacante"
          >
            <Plus size={16} aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* ── Search ── */}
      <section className="pipeline__controls">
        <div className="pipeline__search">
          <Search size={16} className="pipeline__search-icon" aria-hidden="true" />
          <label htmlFor="vac-search" className="sr-only">
            Search vacancy
          </label>
          <input
            id="vac-search"
            type="text"
            placeholder="Search by position, department, recruiter, source, reason…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pipeline__search-input"
            autoComplete="off"
          />
        </div>
        <span className="pipeline__count">
          {filtered.length} de {vacancies.length}
        </span>
        <button
          type="button"
          className={`btn-secondary pipeline__filter-btn${showFilters ? ' pipeline__filter-btn--active' : ''}`}
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          aria-controls="vac-filters"
          title="Advanced filters"
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          {activeFiltersCount > 0 && (
            <span
              className="pipeline__filter-pill"
              aria-label={`${activeFiltersCount} activos`}
            >
              {activeFiltersCount}
            </span>
          )}
        </button>
      </section>

      {showFilters && (
        <section id="vac-filters" aria-label="Filtros de vacantes">
          <VacancyFilters
            vacancies={vacancies}
            value={filters}
            onChange={changeFilters}
            onReset={resetFilters}
          />
        </section>
      )}

      {/* ── Lista de vacantes (mobile-first cards / desktop table) ── */}
      {filtered.length === 0 ? (
        <section className="pipeline__empty">
          <div className="pipeline__empty-icon" aria-hidden="true">
            <ClipboardList size={28} />
          </div>
          <h2 className="pipeline__empty-title">
            {vacancies.length === 0
              ? 'Aún no hay vacantes registradas'
              : 'No hay vacantes que coincidan con la búsqueda'}
          </h2>
          <p className="pipeline__empty-lead">
            {vacancies.length === 0
              ? 'Registra la primera solicitud de cobertura para empezar a medir el SLA.'
              : 'Prueba cambiando los filtros o el texto de búsqueda.'}
          </p>
          <div className="pipeline__empty-actions">
            <button type="button" className="btn-primary" onClick={openAdd} title="Nueva vacante">
              <Plus size={16} aria-hidden="true" />
            </button>
          </div>
        </section>
      ) : (
        <>
          {/* Mobile: tarjetas verticales. */}
          <section
            className="vacantes__cards"
            aria-label="Lista de vacantes"
          >
            {filtered.map(({ vacancy: v, metrics: m }) => (
              <VacancyCard
                key={v.id ?? `${v.puesto}-${v.fecha_apertura}`}
                vacancy={v}
                metrics={m}
                onEdit={() => openEdit(v)}
                onDelete={() => openDelete(v)}
                onStatusChange={(status) => handleStatusChange(v, status)}
              />
            ))}
          </section>

          {/* Desktop: tabla densa. */}
          <section
            className="pipeline__table-wrap vacantes__table"
            aria-label="Tabla de vacantes"
          >
            <table className="pipeline__table">
              <thead>
                <tr>
                  <th scope="col">Puesto · Área</th>
                  <th scope="col">Status</th>
                  <th scope="col">Prior.</th>
                  <th scope="col">Reclutador</th>
                  <th scope="col">Fuente</th>
                  <th scope="col">Apertura</th>
                  <th scope="col" title="Días hábiles (lun-vie, sin festivos)">Tiempo</th>
                  <th scope="col" className="pipeline__th--actions">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(({ vacancy: v, metrics: m }) => {
                  const excluded = !!v.excluida_indicador;
                  const rowCls = [
                    excluded ? 'vacantes__row--excluded' : '',
                    m.vencida && !excluded ? 'vacantes__row--overdue' : '',
                  ]
                    .filter(Boolean)
                    .join(' ');
                  return (
                    <tr key={v.id ?? `${v.puesto}-${v.fecha_apertura}`} className={rowCls}>
                      <td>
                        <div className="pipeline__puesto">{v.puesto}</div>
                        <div className="pipeline__area">
                          {v.area}
                          {v.seccion ? ` · ${v.seccion}` : ''}
                        </div>
                        {excluded && (
                          <div
                            className="vacantes__excluded-tag"
                            title={v.motivo_exclusion ?? ''}
                          >
                            <EyeOff size={11} aria-hidden="true" />
                            Excluida: {v.motivo_exclusion || 'sin motivo'}
                          </div>
                        )}
                      </td>
                      <td className="pipeline__cell-status">
                        <VacancyStatusBadge status={v.status} />
                        <label className="sr-only" htmlFor={`vstatus-${v.id}`}>
                          Cambiar status de la vacante de {v.puesto}
                        </label>
                        <select
                          id={`vstatus-${v.id}`}
                          className="pipeline__status-select"
                          value={v.status}
                          onChange={(e) =>
                            handleStatusChange(v, e.target.value as VacancyStatus)
                          }
                          aria-label={`Cambiar status de la vacante de ${v.puesto}`}
                        >
                          {VACANCY_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {VACANCY_STATUS_LABEL[s]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <VacancyPriorityBadge priority={v.prioridad} />
                      </td>
                      <td>{v.reclutador_asignado || '—'}</td>
                      <td>{v.fuente_planeada || '—'}</td>
                      <td>{formatShortDate(v.fecha_apertura)}</td>
                      <td>
                        <SlaCell
                          metrics={m}
                          status={v.status}
                          excluded={excluded}
                        />
                      </td>
                      <td className="pipeline__cell-actions">
                        <button
                          type="button"
                          className="pipeline__icon-btn"
                          onClick={() => openEdit(v)}
                          aria-label={`Editar vacante de ${v.puesto}`}
                          title="Editar"
                        >
                          <Pencil size={16} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="pipeline__icon-btn pipeline__icon-btn--danger"
                          onClick={() => openDelete(v)}
                          aria-label={`Eliminar vacante de ${v.puesto}`}
                          title="Eliminar"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        </>
      )}

      {/* ── Sheet add/edit/delete ── */}
      <VacancySheet
        isOpen={sheetMode !== null}
        mode={sheetMode === 'edit' ? 'edit' : sheetMode === 'delete' ? 'delete' : 'add'}
        vacancy={selected}
        history={selected?.id ? getHistoryFor(selected.id) : undefined}
        onClose={closeSheet}
        onSave={handleSave}
        onDelete={deleteVacancy}
      />
    </main>
  );
}

/**
 * Pequeño componente para la celda de SLA: muestra `dias/sla` con código de color.
 * - Excluida: gris, texto tachado.
 * - Cubierta: verde con check.
 * - Cancelada: gris con dash.
 * - Vencida: rojo.
 * - Cerca del límite (≤2 días restantes): ámbar.
 * - OK: por defecto.
 */
function SlaCell({
  metrics,
  status,
  excluded,
}: {
  metrics: VacancyMetrics;
  status: VacancyStatus;
  excluded: boolean;
}) {
  if (excluded) {
    return (
      <span className="vacantes__sla vacantes__sla--excluded" title="Excluida del indicador (días hábiles)">
        {metrics.diasAbierta}/{metrics.sla}
      </span>
    );
  }
  if (status === 'cubierta') {
    return (
      <span className="vacantes__sla vacantes__sla--done" title="Vacante cubierta (días hábiles)">
        <CheckCircle2 size={12} aria-hidden="true" />
        {metrics.diasAbierta}/{metrics.sla}
      </span>
    );
  }
  if (status === 'cancelada') {
    return <span className="vacantes__sla vacantes__sla--cancel">—</span>;
  }
  if (metrics.vencida) {
    return (
      <span className="vacantes__sla vacantes__sla--overdue" title="SLA vencido (días hábiles)">
        <AlertTriangle size={12} aria-hidden="true" />
        {metrics.diasAbierta}/{metrics.sla}
      </span>
    );
  }
  const remaining = metrics.sla - metrics.diasAbierta;
  const cls =
    remaining <= 2
      ? 'vacantes__sla vacantes__sla--warning'
      : 'vacantes__sla vacantes__sla--ok';
  return (
    <span className={cls} title={`${remaining} día(s) hábil(es) restante(s)`}>
      <Activity size={12} aria-hidden="true" />
      {metrics.diasAbierta}/{metrics.sla}
    </span>
  );
}

/**
 * Tarjeta de vacante para vista mobile. Renderiza la misma información que
 * una fila de la tabla pero apilada verticalmente, con áreas de toque amplias
 * para edit/delete y un select-overlay sobre el badge de status para cambio
 * inline. Visible sólo por debajo del breakpoint de tabla (ver Vacantes.css).
 */
function VacancyCard({
  vacancy: v,
  metrics: m,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  vacancy: VacancyRequest;
  metrics: VacancyMetrics;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: VacancyStatus) => void;
}) {
  const excluded = !!v.excluida_indicador;
  const overdue = m.vencida && !excluded;
  const cardCls = [
    'vacantes__card',
    excluded ? 'vacantes__card--excluded' : '',
    overdue ? 'vacantes__card--overdue' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={cardCls} aria-label={`Vacante de ${v.puesto}`}>
      <header className="vacantes__card-head">
        <div className="vacantes__card-title">
          <div className="pipeline__puesto">{v.puesto}</div>
          <div className="pipeline__area">
            {v.area}
            {v.seccion ? ` · ${v.seccion}` : ''}
          </div>
          {excluded && (
            <div
              className="vacantes__excluded-tag"
              title={v.motivo_exclusion ?? ''}
            >
              <EyeOff size={11} aria-hidden="true" />
              Excluida: {v.motivo_exclusion || 'sin motivo'}
            </div>
          )}
        </div>
        <VacancyPriorityBadge priority={v.prioridad} />
      </header>

      <dl className="vacantes__card-meta">
        <div className="vacantes__card-meta-row">
          <dt>Reclutador</dt>
          <dd>{v.reclutador_asignado || '—'}</dd>
        </div>
        <div className="vacantes__card-meta-row">
          <dt>Fuente</dt>
          <dd>{v.fuente_planeada || '—'}</dd>
        </div>
        <div className="vacantes__card-meta-row">
          <dt>Apertura</dt>
          <dd>{formatShortDate(v.fecha_apertura)}</dd>
        </div>
        <div className="vacantes__card-meta-row">
          <dt>Tiempo</dt>
          <dd>
            <SlaCell metrics={m} status={v.status} excluded={excluded} />
          </dd>
        </div>
      </dl>

      <footer className="vacantes__card-actions">
        <div className="vacantes__card-status pipeline__cell-status">
          <VacancyStatusBadge status={v.status} />
          <label className="sr-only" htmlFor={`vstatus-card-${v.id}`}>
            Cambiar status de la vacante de {v.puesto}
          </label>
          <select
            id={`vstatus-card-${v.id}`}
            className="pipeline__status-select"
            value={v.status}
            onChange={(e) => onStatusChange(e.target.value as VacancyStatus)}
            aria-label={`Cambiar status de la vacante de ${v.puesto}`}
          >
            {VACANCY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {VACANCY_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="vacantes__card-buttons">
          <button
            type="button"
            className="pipeline__icon-btn"
            onClick={onEdit}
            aria-label={`Editar vacante de ${v.puesto}`}
            title="Editar"
          >
            <Pencil size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="pipeline__icon-btn pipeline__icon-btn--danger"
            onClick={onDelete}
            aria-label={`Eliminar vacante de ${v.puesto}`}
            title="Eliminar"
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      </footer>
    </article>
  );
}
