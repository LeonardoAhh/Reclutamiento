import { useMemo, useState } from 'react';
import {
  ClipboardList,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Timer,
  Pencil,
  Trash2,
  Search,
  SlidersHorizontal,
  EyeOff,
  Plus,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { VacancyModal } from '@/components/ui/VacancyModal';
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
import { formatShortDate, daysBetween } from '@/lib/dates';
import './Pipeline.css';
import './Vacantes.css';

const FILTERS_STORAGE_KEY = 'vacantes_filters_v1';

type ModalMode = 'add' | 'edit' | 'delete' | null;

/** Estados que cuentan como "abierta" para efectos del KPI. */
const OPEN_STATUSES: ReadonlyArray<VacancyStatus> = ['abierta', 'en_proceso', 'pausa'];

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
  const diasAbierta = v.fecha_apertura ? daysBetween(v.fecha_apertura, end) : 0;
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
    isConfigured,
    saveStatus,
    addVacancy,
    updateVacancy,
    setVacancyStatus,
    deleteVacancy,
    getHistoryFor,
  } = useVacancyRequests();

  const [searchTerm, setSearchTerm] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
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

  const totals = useMemo(() => {
    let abiertas = 0;
    let enSla = 0;
    let vencidas = 0;
    let cubiertas = 0;
    let ttfSum = 0;
    let ttfCount = 0;
    let excluidas = 0;

    for (const { vacancy: v, metrics: m } of enriched) {
      if (v.excluida_indicador) {
        excluidas += 1;
        continue; // NO entra en ninguno de los demás indicadores
      }
      if (OPEN_STATUSES.includes(v.status)) {
        abiertas += 1;
        if (m.vencida) vencidas += 1;
        else enSla += 1;
      } else if (v.status === 'cubierta') {
        cubiertas += 1;
        if (v.fecha_apertura && v.fecha_cubierta) {
          ttfSum += daysBetween(v.fecha_apertura, v.fecha_cubierta);
          ttfCount += 1;
        }
      }
    }

    const ttfPromedio = ttfCount > 0 ? Math.round(ttfSum / ttfCount) : 0;
    return { abiertas, enSla, vencidas, cubiertas, ttfPromedio, excluidas };
  }, [enriched]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const desde = filters.fechaDesde ? new Date(filters.fechaDesde).getTime() : null;
    const hasta = filters.fechaHasta
      ? new Date(`${filters.fechaHasta}T23:59:59`).getTime()
      : null;

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
    setModalMode('add');
  }

  function openEdit(v: VacancyRequest) {
    setSelected(v);
    setModalMode('edit');
  }

  function openDelete(v: VacancyRequest) {
    setSelected(v);
    setModalMode('delete');
  }

  function closeModal() {
    setModalMode(null);
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
            <h1>Vacantes</h1>
            <p className="pipeline__hero-sub">Cargando vacantes…</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="pipeline container">
      {/* ── Hero ── */}
      <section className="pipeline__hero">
        <div className="pipeline__hero-content">
          <h1>Vacantes</h1>
          <div className="pipeline__hero-status">
            <Badge variant={isConfigured ? 'success' : 'amber'}>
              {isConfigured ? 'Conectado a base de datos' : 'Modo local'}
            </Badge>
            {saveStatus === 'saving' && <Badge variant="teal">Guardando…</Badge>}
            {saveStatus === 'saved' && <Badge variant="success">Guardado</Badge>}
            {saveStatus === 'error' && <Badge variant="error">Error al guardar</Badge>}
          </div>
        </div>
        <div className="pipeline__hero-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={openAdd}
            aria-label="Nueva vacante"
            title="Nueva vacante"
          >
            <Plus size={18} aria-hidden="true" />
            Nueva vacante
          </button>
        </div>
      </section>

      {/* ── KPIs ── */}
      <section className="pipeline__kpis vacantes__kpis">
        <StatCard
          id="stat-vac-abiertas"
          label="Abiertas"
          value={totals.abiertas}
          icon={<ClipboardList size={20} />}
          accentColor="var(--color-primary)"
        />
        <StatCard
          id="stat-vac-sla"
          label="En SLA"
          value={totals.enSla}
          icon={<CheckCircle2 size={20} />}
          accentColor="var(--color-accent-teal)"
        />
        <StatCard
          id="stat-vac-vencidas"
          label="Vencidas"
          value={totals.vencidas}
          icon={<AlertTriangle size={20} />}
          accentColor="var(--color-error)"
        />
        <StatCard
          id="stat-vac-ttf"
          label="TTF prom. (días)"
          value={totals.ttfPromedio}
          icon={<Timer size={20} />}
          accentColor="var(--color-ink)"
        />
        <StatCard
          id="stat-vac-excluidas"
          label="Excluidas KPI"
          value={totals.excluidas}
          icon={<EyeOff size={20} />}
          accentColor="var(--color-muted)"
        />
      </section>

      {/* ── Search ── */}
      <section className="pipeline__controls">
        <div className="pipeline__search">
          <Search size={16} className="pipeline__search-icon" aria-hidden="true" />
          <label htmlFor="vac-search" className="sr-only">
            Buscar vacante
          </label>
          <input
            id="vac-search"
            type="text"
            placeholder="Buscar por puesto, área, reclutador, fuente, motivo…"
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
          title="Filtros avanzados"
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          Filtros
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

      {/* ── Tabla ── */}
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
            <button type="button" className="btn-primary" onClick={openAdd}>
              <Plus size={16} aria-hidden="true" />
              Nueva vacante
            </button>
          </div>
        </section>
      ) : (
        <section className="pipeline__table-wrap" aria-label="Tabla de vacantes">
          <table className="pipeline__table">
            <thead>
              <tr>
                <th scope="col">Puesto · Área</th>
                <th scope="col">Status</th>
                <th scope="col">Prior.</th>
                <th scope="col">Reclutador</th>
                <th scope="col">Fuente</th>
                <th scope="col">Apertura</th>
                <th scope="col">SLA</th>
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
                        <div className="vacantes__excluded-tag" title={v.motivo_exclusion ?? ''}>
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
                      <SlaCell metrics={m} status={v.status} excluded={excluded} />
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
      )}

      {/* ── Modal add/edit/delete ── */}
      <VacancyModal
        isOpen={modalMode !== null}
        mode={modalMode === 'edit' ? 'edit' : modalMode === 'delete' ? 'delete' : 'add'}
        vacancy={selected}
        history={selected?.id ? getHistoryFor(selected.id) : undefined}
        onClose={closeModal}
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
      <span className="vacantes__sla vacantes__sla--excluded" title="Excluida del indicador">
        {metrics.diasAbierta}/{metrics.sla}
      </span>
    );
  }
  if (status === 'cubierta') {
    return (
      <span className="vacantes__sla vacantes__sla--done" title="Vacante cubierta">
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
      <span className="vacantes__sla vacantes__sla--overdue" title="SLA vencido">
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
    <span className={cls} title={`${remaining} día(s) restante(s)`}>
      <Activity size={12} aria-hidden="true" />
      {metrics.diasAbierta}/{metrics.sla}
    </span>
  );
}
