import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserPlus,
  UserX,
  Search,
  Table2,
  LayoutGrid,
  SlidersHorizontal,
  BadgeCheck,
  ClipboardList,
  BarChart3,
  Users,
  UserRound,
  CalendarDays,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { CandidateModal } from '@/components/ui/CandidateModal';
import { CandidateNotesModal } from '@/components/ui/CandidateNotesModal';
import { notifyResult, sileo } from '@/lib/notify';
import { CandidateReportModal } from '@/components/ui/CandidateReportModal';
import { HireCandidateModal } from '@/components/ui/HireCandidateModal';
import { RecruiterStatsModal } from '@/components/ui/RecruiterStatsModal';
import { CandidateRowActions } from '@/components/ui/CandidateRowActions';
import { Skeleton } from '@/components/ui/Skeleton';
import { SkeletonTable } from '@/components/ui/PageSkeletons';
import { PipelineKanban } from '@/components/pipeline/PipelineKanban';
import { CustomSelect } from '@/components/ui/CustomSelect';
import {
  CandidateFilters,
  EMPTY_FILTERS,
  type FilterState,
} from '@/components/pipeline/CandidateFilters';
import { useAuth } from '@/hooks/useAuth';
import { useCandidates } from '@/hooks/useCandidates';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useVacancyRequests } from '@/hooks/useVacancyRequests';
import { CANDIDATE_STATUSES, CANDIDATE_STATUS_LABEL } from '@/lib/types';
import type { Candidate, CandidateStatus, Employee } from '@/lib/types';
import { formatShortDate, startOfDayMxMs, endOfDayMxMs, getPautaWeekRange, shiftPautaWeek } from '@/lib/dates';
import { RECLUTADORES_ACTIVOS } from '@/lib/constants';
import { normalizeString } from '@/lib/utils';
import './Pipeline.css';

type ViewMode = 'table' | 'kanban';
const VIEW_STORAGE_KEY = 'pipeline_view_mode';
const FILTERS_STORAGE_KEY = 'pipeline_filters_v1';

type ModalMode = 'add' | 'edit' | 'delete' | null;

const formatDate = formatShortDate;

/**
 * Status que cuentan como "citado" para el hero de reclutadores. Tras
 * la simplificacion del pipeline a 4 etapas, citar = estar en Entrevista 1
 * o Entrevista 2. Contratado y Rechazado son terminales y se cuentan
 * aparte.
 */
const CITADO_STATUSES: ReadonlySet<CandidateStatus> = new Set<CandidateStatus>([
  'entrevista',
  'entrega_documentos',
  'faltan_documentos',
  'feedback_pendiente',
]);

type RecruiterStats = {
  name: string;
  total: number;
  citados: number;
  contratados: number;
  rechazados: number;
  no_asistio: number;
};

export function Pipeline() {
  const {
    candidates,
    notes,
    loading,
    addCandidate,
    updateCandidate,
    setCandidateStatus,
    markCandidateHired,
    deleteCandidate,
    addCandidateNote,
  } = useCandidates();

  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const { addSingleEmployee } = useSupabaseData();
  const { coverVacancyForEmployee } = useVacancyRequests();

  const [searchTerm, setSearchTerm] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [notesTarget, setNotesTarget] = useState<Candidate | null>(null);
  const [hireTarget, setHireTarget] = useState<Candidate | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [kpiModalOpen, setKpiModalOpen] = useState<'global' | 'pauta' | 'alexandra' | 'daniela' | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const stored = localStorage.getItem(VIEW_STORAGE_KEY);
      return stored === 'kanban' ? 'kanban' : 'table';
    } catch {
      return 'table';
    }
  });
  const [filters, setFilters] = useState<FilterState>(() => {
    try {
      const stored = localStorage.getItem(FILTERS_STORAGE_KEY);
      if (!stored) return EMPTY_FILTERS;
      return { ...EMPTY_FILTERS, ...(JSON.parse(stored) as Partial<FilterState>) };
    } catch {
      return EMPTY_FILTERS;
    }
  });
  const [showFilters, setShowFilters] = useState(
    () => Object.values(filters).some((v) => v !== '')
  );

  const { pautaStats, alexandraStats, danielaStats } = useMemo(() => {
    const getWeeklyStats = (cands: Candidate[], targetTotal?: number, targetContratados?: number) => {
      const groups = new Map<number, {
        startWed: Date;
        endTue: Date;
        total: number;
        contratados: number;
        targetTotal?: number;
        targetContratados?: number;
        efectividadVolumen?: number;
        efectividadContratacion?: number;
      }>();

      for (const c of cands) {
        // Agrupar por **fecha de entrevista** (`fecha_cita`), no por
        // fecha de contacto. Una semana de pauta agrupa los candidatos
        // citados a entrevista entre miércoles y martes (TZ MX).
        if (!c.fecha_cita) continue;
        const range = getPautaWeekRange(c.fecha_cita);
        if (!range) continue;

        const { startWed, endTue, timeKey } = range;
        if (!groups.has(timeKey)) {
          groups.set(timeKey, { startWed, endTue, total: 0, contratados: 0, targetTotal, targetContratados });
        }

        const bucket = groups.get(timeKey)!;
        bucket.total += 1;
        if (c.status === 'contratado') bucket.contratados += 1;
      }

      // Asegurar que aparezcan semana anterior / actual / siguiente
      // aun sin candidatos. Todo el cálculo es TZ-agnóstico (MX, sin DST).
      const currentRange = getPautaWeekRange(new Date());
      if (currentRange) {
        const prevRange = shiftPautaWeek(currentRange, -1);
        const nextRange = shiftPautaWeek(currentRange, 1);

        [prevRange, currentRange, nextRange].forEach(({ startWed, endTue, timeKey }) => {
          if (!groups.has(timeKey)) {
            groups.set(timeKey, { startWed, endTue, total: 0, contratados: 0, targetTotal, targetContratados });
          }
        });
      }

      return Array.from(groups.values()).map(stat => {
        // Cálculo de efectividad oculto (solo lógico)
        const efectividadVolumen = stat.targetTotal ? Math.round((stat.total / stat.targetTotal) * 100) : undefined;
        const efectividadContratacion = stat.targetContratados ? Math.round((stat.contratados / stat.targetContratados) * 100) : undefined;
        return { ...stat, efectividadVolumen, efectividadContratacion };
      }).sort((a, b) => b.startWed.getTime() - a.startWed.getTime());
    };

    return {
      // Pauta tiene un objetivo de 30/14. Reclutadoras tienen 20/7 por semana.
      pautaStats: getWeeklyStats(candidates.filter(c => normalizeString(c.source ?? '') === 'PAUTA'), 30, 14),
      alexandraStats: getWeeklyStats(candidates.filter(c => normalizeString(c.source ?? '') === 'PAUTA' && normalizeString(c.reclutador ?? '') === 'ALEXANDRA'), 20, 7),
      danielaStats: getWeeklyStats(candidates.filter(c => normalizeString(c.source ?? '') === 'PAUTA' && normalizeString(c.reclutador ?? '') === 'DANIELA'), 20, 7),
    };
  }, [candidates]);

  function changeView(next: ViewMode) {
    setViewMode(next);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      // localStorage unavailable; ignore.
    }
  }

  function changeFilters(next: FilterState) {
    setFilters(next);
    try {
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage unavailable; ignore.
    }
  }

  function resetFilters() {
    changeFilters(EMPTY_FILTERS);
  }

  const activeFiltersCount = (
    Object.keys(filters) as Array<keyof FilterState>
  ).filter((k) => filters[k] !== '').length;

  /**
   * KPIs por reclutador activo. Cuenta candidatos cuyo `reclutador`
   * normalizado (mayusculas + sin acentos) coincide con uno de los
   * nombres canonicos en RECLUTADORES_ACTIVOS. Otros nombres se
   * descartan tanto del numerador como del denominador.
   */
  const recruiterStats = useMemo<RecruiterStats[]>(() => {
    const empty = (name: string): RecruiterStats => ({
      name,
      total: 0,
      citados: 0,
      contratados: 0,
      rechazados: 0,
      no_asistio: 0,
    });
    const acc = new Map<string, RecruiterStats>();
    for (const name of RECLUTADORES_ACTIVOS) acc.set(name, empty(name));
    for (const c of candidates) {
      const norm = normalizeString(c.reclutador ?? '');
      const bucket = acc.get(norm);
      if (!bucket) continue;
      bucket.total += 1;
      if (c.status === 'contratado') bucket.contratados += 1;
      else if (c.status === 'rechazado') bucket.rechazados += 1;
      else if (c.status === 'no_asistio') bucket.no_asistio += 1;
      else if (CITADO_STATUSES.has(c.status)) bucket.citados += 1;
    }
    return Array.from(acc.values());
  }, [candidates]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    // Filtros de rango anclados a TZ MX para evitar desfases del visor.
    const desde = startOfDayMxMs(filters.fechaDesde);
    const hasta = endOfDayMxMs(filters.fechaHasta);

    return candidates.filter((c) => {
      if (filters.area && c.area !== filters.area) return false;
      if (filters.puesto && c.puesto !== filters.puesto) return false;
      if (filters.estado && c.status !== filters.estado) return false;
      if (filters.reclutador && (c.reclutador ?? '') !== filters.reclutador) return false;
      if (filters.source && (c.source ?? '') !== filters.source) return false;

      if (desde || hasta) {
        // Filtramos por **fecha de entrevista** (`fecha_cita`).
        // El valor guardado puede venir como `YYYY-MM-DD` (date) o como
        // `YYYY-MM-DDTHH:MM` (datetime-local sin TZ): en ambos casos
        // representa hora local MX. Nos quedamos con el día calendario
        // y lo comparamos contra los bordes MX (start/endOfDayMxMs ya
        // anclados a UTC-6) → comparación TZ-agnóstica.
        if (!c.fecha_cita) return false;
        const dayStr = String(c.fecha_cita).slice(0, 10);
        const ts = startOfDayMxMs(dayStr);
        if (ts === null) return false;
        if (desde && ts < desde) return false;
        if (hasta && ts > hasta) return false;
      }

      if (q) {
        const haystack = [c.nombre, c.puesto, c.area, c.reclutador, c.source, c.email]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [candidates, searchTerm, filters]);

  const notesCountByCandidate = useMemo(() => {
    const map = new Map<string, number>();
    for (const n of notes) {
      if (!n.candidate_id) continue;
      map.set(n.candidate_id, (map.get(n.candidate_id) ?? 0) + 1);
    }
    return map;
  }, [notes]);

  function notesCount(c: Candidate): number {
    return c.id ? notesCountByCandidate.get(c.id) ?? 0 : 0;
  }

  function openAdd() {
    setSelected(null);
    setModalMode('add');
  }

  function openEdit(c: Candidate) {
    setSelected(c);
    setModalMode('edit');
  }

  function openDelete(c: Candidate) {
    setSelected(c);
    setModalMode('delete');
  }

  function closeModal() {
    setModalMode(null);
    setSelected(null);
  }

  async function handleSave(
    payload: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>,
    id?: string
  ) {
    return notifyResult(
      id ? updateCandidate(id, payload) : addCandidate(payload),
      {
        success: id ? 'Candidato actualizado' : 'Candidato agregado',
        successDescription: payload.nombre,
        error: id ? 'No se pudo actualizar el candidato' : 'No se pudo agregar el candidato',
      }
    );
  }

  async function handleStatusChange(c: Candidate, status: CandidateStatus) {
    if (!c.id || c.status === status) return;
    await notifyResult(setCandidateStatus(c.id, status), {
      success: 'Estado actualizado',
      successDescription: `${c.nombre} → ${status}`,
      error: 'No se pudo cambiar el estado',
    });
  }

  function openHire(c: Candidate) {
    setHireTarget(c);
  }

  async function handleHire(input: {
    employee: Employee;
    candidateId: string;
  }): Promise<{ ok: boolean; message?: string }> {
    const empResult = await addSingleEmployee(input.employee);
    if (!empResult.ok) {
      sileo.error({ title: 'No se pudo contratar', description: empResult.message });
      return empResult;
    }
    const candResult = await markCandidateHired(
      input.candidateId,
      input.employee.num_empleado,
      input.employee.fecha_ingreso
    );
    if (!candResult.ok) {
      const message =
        candResult.message ??
        'Empleado creado, pero no se pudo actualizar el candidato.';
      sileo.warning({ title: 'Contratación incompleta', description: message });
      return { ok: false, message };
    }
    // Cierra automáticamente la vacante abierta que coincida con el puesto.
    await coverVacancyForEmployee(input.employee, {
      source: `candidato:${input.candidateId}`,
    });
    sileo.success({
      title: 'Candidato contratado',
      description: `${input.employee.nombre} · #${input.employee.num_empleado}`,
    });
    return { ok: true };
  }

  if (loading) {
    return (
      <main className="pipeline container">
        <section className="pipeline__hero">
          <div>
            <h1>Candidates</h1>
          </div>
        </section>
        <section className="pipeline__recruiters" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={120} radius="var(--rounded-lg)" />
          ))}
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
          columns={['26%', '22%', '20%', '18%', '14%']}
        />
      </main>
    );
  }

  return (
    <main className="pipeline">
      {/* ── Hero ── */}
      <section className="pipeline__hero">
        <div className="pipeline__hero-content">
          <h1>Candidates</h1>
        </div>
        <div className="pipeline__hero-actions">
          <motion.button
            type="button"
            className="btn-secondary pipeline__report-btn"
            onClick={() => setReportOpen(true)}
            aria-label="Open candidate summary"
            title="Candidate summary for WhatsApp"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
          >
            <ClipboardList size={16} aria-hidden="true" />
          </motion.button>
          <button
            type="button"
            className="btn-primary"
            onClick={openAdd}
            aria-label="Nuevo candidato"
            title="Nuevo candidato"
          >
            <UserPlus size={16} aria-hidden="true" />
          </button>
        </div>
      </section>

      <div className="pipeline__layout">
        <aside className="pipeline__sidebar">
          {/* Header del sidebar */}
          <div className="pipeline__sidebar-header">
            <BarChart3 size={18} aria-hidden="true" />
            <span>Métricas y KPIs</span>
          </div>

          {/* Card resumen global */}
          <button
            type="button"
            className="pipeline__kpi-card pipeline__kpi-card--global"
            onClick={() => setKpiModalOpen('global')}
          >
            <div className="pipeline__kpi-card__icon">
              <Users size={20} aria-hidden="true" />
            </div>
            <div className="pipeline__kpi-card__body">
              <span className="pipeline__kpi-card__label">Resumen General</span>
              <span className="pipeline__kpi-card__hint">
                {candidates.filter(c => CITADO_STATUSES.has(c.status)).length} citados
              </span>
            </div>
            <ChevronRight size={16} className="pipeline__kpi-card__arrow" aria-hidden="true" />
          </button>

          {/* Divider */}
          <div className="pipeline__sidebar-divider" />

          {/* Sección: Detalle por Reclutador */}
          <div className="pipeline__sidebar-section">
            <span className="pipeline__sidebar-section__label">Detalle por Reclutador</span>

            <div className="pipeline__kpi-list">
              <button
                type="button"
                className="pipeline__kpi-row"
                onClick={() => setKpiModalOpen('pauta')}
              >
                <div className="pipeline__kpi-row__meta">
                  <span className="pipeline__kpi-row__dot" style={{ background: 'var(--color-accent-amber)' }} />
                  <span className="pipeline__kpi-row__name">Pauta</span>
                </div>
                <div className="pipeline__kpi-row__stats">
                  <span className="pipeline__kpi-row__value">
                    {pautaStats.reduce((a, s) => a + s.total, 0)}
                  </span>
                  <ChevronRight size={14} aria-hidden="true" />
                </div>
              </button>

              <button
                type="button"
                className="pipeline__kpi-row"
                onClick={() => setKpiModalOpen('alexandra')}
              >
                <div className="pipeline__kpi-row__meta">
                  <span className="pipeline__kpi-row__dot" style={{ background: 'var(--color-accent-teal)' }} />
                  <span className="pipeline__kpi-row__name">Alexandra</span>
                </div>
                <div className="pipeline__kpi-row__stats">
                  <span className="pipeline__kpi-row__value">
                    {alexandraStats.reduce((a, s) => a + s.total, 0)}
                  </span>
                  <ChevronRight size={14} aria-hidden="true" />
                </div>
              </button>

              <button
                type="button"
                className="pipeline__kpi-row"
                onClick={() => setKpiModalOpen('daniela')}
              >
                <div className="pipeline__kpi-row__meta">
                  <span className="pipeline__kpi-row__dot" style={{ background: 'var(--color-primary)' }} />
                  <span className="pipeline__kpi-row__name">Daniela</span>
                </div>
                <div className="pipeline__kpi-row__stats">
                  <span className="pipeline__kpi-row__value">
                    {danielaStats.reduce((a, s) => a + s.total, 0)}
                  </span>
                  <ChevronRight size={14} aria-hidden="true" />
                </div>
              </button>
            </div>
          </div>
        </aside>

        <div className="pipeline__content">
          {/* ── Search ── */}
          <section className="pipeline__controls">
            <div className="pipeline__search">
              <Search size={16} className="pipeline__search-icon" aria-hidden="true" />
              <label htmlFor="pipeline-search" className="sr-only">
                Buscar candidato
              </label>
              <input
                id="pipeline-search"
                type="text"
                placeholder="Buscar por nombre, puesto, área, reclutador, fuente…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pipeline__search-input"
                autoComplete="off"
              />
            </div>
            <span className="pipeline__count">
              {filtered.length} de {candidates.length}
            </span>
            <button
              type="button"
              className={`btn-secondary pipeline__filter-btn${showFilters ? ' pipeline__filter-btn--active' : ''}`}
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
              aria-controls="pipeline-filters"
              title="Filtros avanzados"
            >
              <SlidersHorizontal size={16} aria-hidden="true" />
              {activeFiltersCount > 0 && (
                <span className="pipeline__filter-pill" aria-label={`${activeFiltersCount} activos`}>
                  {activeFiltersCount}
                </span>
              )}
            </button>
            <div className="pipeline__view-toggle" role="tablist" aria-label="Cambiar vista">
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'table'}
                className={`pipeline__view-btn${viewMode === 'table' ? ' pipeline__view-btn--active' : ''}`}
                onClick={() => changeView('table')}
                title="Vista de tabla"
              >
                <Table2 size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'kanban'}
                className={`pipeline__view-btn${viewMode === 'kanban' ? ' pipeline__view-btn--active' : ''}`}
                onClick={() => changeView('kanban')}
                title="Vista kanban"
              >
                <LayoutGrid size={16} aria-hidden="true" />
              </button>
            </div>
          </section>

          {/* ── Filtros avanzados ── */}
          {showFilters && (
            <div id="pipeline-filters">
              <CandidateFilters
                candidates={candidates}
                value={filters}
                onChange={changeFilters}
                onReset={resetFilters}
              />
            </div>
          )}

          {/* ── Vista (tabla o kanban) ── */}
          {filtered.length === 0 ? (
            <section className="pipeline__empty">
              {candidates.length === 0 ? (
                <>
                  <h2>Aún no hay candidatos</h2>
                  <p>
                    Empieza agregando tu primer candidato a la base de datos de reclutamiento.
                  </p>
                  <button type="button" className="btn-primary" onClick={openAdd} title="Agregar primer candidato">
                    <UserPlus size={16} aria-hidden="true" />
                  </button>
                </>
              ) : (
                <>
                  <h2>Sin resultados</h2>
                  <p>Ningún candidato coincide con la búsqueda o los filtros actuales.</p>
                  <div className="pipeline__empty-actions">
                    {searchTerm && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setSearchTerm('')}
                        title="Limpiar búsqueda"
                      >
                        <UserX size={16} aria-hidden="true" />
                      </button>
                    )}
                    {activeFiltersCount > 0 && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={resetFilters}
                        title="Limpiar filtros"
                      >
                        <SlidersHorizontal size={16} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </section>
          ) : viewMode === 'kanban' ? (
            <PipelineKanban
              candidates={filtered}
              notesCount={notesCount}
              onEdit={openEdit}
              onDelete={isAdmin ? openDelete : undefined}
              onNotes={(c) => setNotesTarget(c)}
              onHire={openHire}
              onStatusChange={(c, status) => handleStatusChange(c, status)}
            />
          ) : (
            <section
              className="pipeline__card-list"
              aria-label="Lista de candidatos"
            >
              <header className="pipeline__card-list-header" aria-hidden="true">
                <span>Candidato</span>
                <span>Puesto</span>
                <span>Estado</span>
                <span>Entrevista</span>
                <span />
              </header>
              {filtered.map((c) => {
                const fechaCitaFmt = c.fecha_cita ? formatDate(c.fecha_cita) : null;
                const areaLine = `${c.area}${c.seccion?.trim() ? ` · ${c.seccion.trim()}` : ''}`;
                return (
                  <article
                    key={c.id ?? c.nombre + c.fecha_aplicacion}
                    className={`pipeline__ccard pipeline__ccard--${c.status}`}
                  >
                    <div className="pipeline__ccard-name-col">
                      <div className="pipeline__name">
                        <span
                          className="pipeline__status-dot"
                          data-status={c.status}
                          aria-label={`Estado: ${CANDIDATE_STATUS_LABEL[c.status]}`}
                          title={CANDIDATE_STATUS_LABEL[c.status]}
                        />
                        <span>{c.nombre}</span>
                        {c.source && (
                          <span
                            className="pipeline__source-badge"
                            data-source={normalizeString(c.source).toLowerCase()}
                            title={`Fuente: ${c.source}`}
                          >
                            {c.source}
                          </span>
                        )}
                      </div>
                      {c.reclutador && (
                        <div className="pipeline__recruiter" title={`Reclutador: ${c.reclutador}`}>
                          <UserRound size={12} aria-hidden="true" />
                          <span>{c.reclutador}</span>
                        </div>
                      )}

                      {/* Bloque visible solo en mobile (<=1024) que resume
                          puesto + reclutador + entrevista de forma compacta. */}
                      <div className="pipeline__ccard-mobile-info" aria-hidden="true">
                        <div className="pipeline__ccard-mobile-info__puesto">
                          {c.puesto}
                        </div>
                        <div className="pipeline__ccard-mobile-info__meta">
                          {c.reclutador && (
                            <span className="pipeline__ccard-mobile-info__chip">
                              <UserRound size={11} aria-hidden="true" />
                              {c.reclutador}
                            </span>
                          )}
                          {fechaCitaFmt && (
                            <span className="pipeline__ccard-mobile-info__chip">
                              <CalendarDays size={11} aria-hidden="true" />
                              {fechaCitaFmt}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="pipeline__ccard-puesto-col">
                      <div className="pipeline__puesto">{c.puesto}</div>
                      <div className="pipeline__area">{areaLine}</div>
                    </div>
                    <div
                      className="pipeline__cell-status pipeline__ccard-status-col"
                      data-status={c.status}
                    >
                      <CustomSelect
                        id={`status-${c.id}`}
                        value={c.status}
                        placeholder=""
                        onChange={(val) =>
                          handleStatusChange(c, val as CandidateStatus)
                        }
                        options={CANDIDATE_STATUSES.map((s) => ({
                          value: s,
                          label: CANDIDATE_STATUS_LABEL[s],
                        }))}
                        aria-label={`Cambiar estado de ${c.nombre}`}
                        customTrigger={
                          <span
                            className="pipeline__status-tag"
                            data-status={c.status}
                          >
                            <span className="pipeline__status-tag__label">
                              {CANDIDATE_STATUS_LABEL[c.status]}
                            </span>
                            <ChevronDown
                              size={14}
                              aria-hidden="true"
                              className="pipeline__status-tag__chevron"
                            />
                          </span>
                        }
                      />
                    </div>
                    <div className="pipeline__ccard-dates-col pipeline__cell-dates">
                      <div className="pipeline__cell-dates-primary">
                        {fechaCitaFmt ?? '—'}
                      </div>
                    </div>
                    <div className="pipeline__cell-actions pipeline__ccard-actions-col">
                      {c.employee_num && (
                        <span
                          className="pipeline__hired-tag"
                          title={`Empleado #${c.employee_num}`}
                        >
                          <BadgeCheck size={12} aria-hidden="true" />
                          #{c.employee_num}
                        </span>
                      )}
                      <CandidateRowActions
                        candidate={c}
                        notesCount={notesCount(c)}
                        onEdit={openEdit}
                        onDelete={isAdmin ? openDelete : undefined}
                        onNotes={() => setNotesTarget(c)}
                        onHire={
                          c.status === 'contratado' && !c.employee_num
                            ? () => openHire(c)
                            : undefined
                        }
                      />
                    </div>
                  </article>
                );
              })}
            </section>
          )}

          {/* ── Modales ── */}
          <CandidateModal
            isOpen={modalMode !== null}
            mode={modalMode ?? 'add'}
            candidate={selected}
            candidates={candidates}
            onClose={closeModal}
            onSave={handleSave}
            onDelete={(id) =>
              notifyResult(deleteCandidate(id), {
                success: 'Candidato eliminado',
                error: 'No se pudo eliminar el candidato',
              })
            }
          />

          <CandidateNotesModal
            isOpen={notesTarget !== null}
            candidate={notesTarget}
            notes={notes}
            onClose={() => setNotesTarget(null)}
            onSave={(note) =>
              notifyResult(addCandidateNote(note), {
                success: 'Nota agregada',
                error: 'No se pudo guardar la nota',
              })
            }
          />

          <HireCandidateModal
            isOpen={hireTarget !== null}
            candidate={hireTarget}
            onClose={() => setHireTarget(null)}
            onConfirm={handleHire}
          />

          {/* ── Candidate Report Modal (WhatsApp-ready) ── */}
          <CandidateReportModal
            isOpen={reportOpen}
            onClose={() => setReportOpen(false)}
            candidates={candidates}
          />
        </div>
      </div>

      {/* ── Modals de KPIs de reclutadores ── */}
      <RecruiterStatsModal
        isOpen={kpiModalOpen !== null}
        onClose={() => setKpiModalOpen(null)}
        mode={kpiModalOpen}
        recruiterStats={recruiterStats}
        pautaStats={pautaStats}
        alexandraStats={alexandraStats}
        danielaStats={danielaStats}
      />
    </main>
  );
}
