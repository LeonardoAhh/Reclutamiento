import { useEffect, useMemo, useState } from 'react';
import { MotionConfig, motion } from 'framer-motion';
import { parseISO, isToday, isTomorrow, isYesterday, formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import Avatar from 'boring-avatars';
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
  ChevronLeft,
  PanelLeftOpen,
  PanelLeftClose,
  Phone,
  MessageSquare,
  MessageCircle,
  Star,
  Pencil,
  Trash2,
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
import { normalizeString, formatPhoneNumber } from '@/lib/utils';
import { splitCandidateName } from '@/lib/names';
import './Pipeline.css';

const FILTERS_STORAGE_KEY = 'pipeline_filters_v1';

type ModalMode = 'add' | 'edit' | 'delete' | null;

const formatDate = formatShortDate;

/**
 * Paleta semilla para los avatares generativos (boring-avatars "beam").
 * No son tokens de diseño: son colores de la ilustración generada por
 * el hash del nombre. Se centralizan aquí para no repetir literales.
 */
const AVATAR_PALETTE = ['#0F172A', '#334155', '#3B82F6', '#06B6D4', '#F8FAFC'];

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

const StarliteBadge = () => (
  <span className="pipeline__starlite-badge" title="Proyecto: Starlite">
    <Star size="1em" className="pipeline__starlite-icon" aria-hidden="true" />
    <span>Starlite</span>
  </span>
);

const VinoplasticBadge = () => (
  <span className="pipeline__vinoplastic-badge" title="Proyecto: ViñoPlastic">
    ViñoPlastic
  </span>
);

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
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [notesTarget, setNotesTarget] = useState<Candidate | null>(null);
  const [hireTarget, setHireTarget] = useState<Candidate | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [kpiModalOpen, setKpiModalOpen] = useState<'global' | 'pauta' | 'alexandra' | 'daniela' | null>(null);
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
  const [selectedMobileCandidate, setSelectedMobileCandidate] = useState<Candidate | null>(null);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => typeof localStorage !== 'undefined' && localStorage.getItem('pipeline_sidebar_collapsed') === '1'
  );

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof localStorage !== 'undefined') {
        if (next) localStorage.setItem('pipeline_sidebar_collapsed', '1');
        else localStorage.removeItem('pipeline_sidebar_collapsed');
      }
      return next;
    });
  };

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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedCandidates = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );


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
        error: id ? 'No se pudo actualizar el candidato' : 'No se pudo agregar el candidato',
      }
    );
  }

  async function handleStatusChange(c: Candidate, status: CandidateStatus) {
    if (!c.id || c.status === status) return;
    await notifyResult(setCandidateStatus(c.id, status), {
      success: 'Estado actualizado',
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
      sileo.error({ title: 'No se pudo contratar' });
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
      sileo.warning({ title: 'Contratación incompleta' });
      return { ok: false, message };
    }
    // Cierra automáticamente la vacante abierta que coincida con el puesto.
    await coverVacancyForEmployee(input.employee, {
      source: `candidato:${input.candidateId}`,
    });
    sileo.success({
      title: 'Candidato contratado',
    });
    return { ok: true };
  }

  if (loading) {
    return (
      <main className="pipeline">
        <section className="pipeline__hero">
          <div className="pipeline__hero-content">
            <h1>Candidatos</h1>
          </div>
          <div className="pipeline__hero-actions">
            <Skeleton variant="circle" width={36} height={36} />
            <Skeleton width={130} height={36} radius="var(--rounded-md)" />
          </div>
        </section>

        <div className="pipeline__layout">
          <aside className="pipeline__sidebar">
            <div className="pipeline__sidebar-header">
              <Skeleton width={140} height={20} />
            </div>
            <Skeleton height={140} radius="var(--rounded-xl)" style={{ marginBottom: '16px' }} />
            <Skeleton height={100} radius="var(--rounded-xl)" style={{ marginBottom: '12px' }} />
            <Skeleton height={100} radius="var(--rounded-xl)" style={{ marginBottom: '12px' }} />
            <Skeleton height={100} radius="var(--rounded-xl)" style={{ marginBottom: '12px' }} />
          </aside>
          
          <div className="pipeline__main">
            <section className="pipeline__controls">
              <Skeleton
                height={40}
                radius="var(--rounded-md)"
                style={{ flex: '1 1 260px' }}
              />
              <Skeleton width={100} height={40} radius="var(--rounded-md)" />
              <div className="pipeline__view-toggle">
                <Skeleton width={80} height={32} radius="16px" />
              </div>
            </section>
            
            <SkeletonTable
              rows={8}
              columns={['26%', '22%', '20%', '18%', '14%']}
            />
          </div>
        </div>
      </main>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <main className="pipeline">
      <div className={`pipeline-main-container ${selectedMobileCandidate ? 'mobile-hidden' : ''}`}>
        {/* ── Hero ── */}
        <section className="pipeline__hero">
        <div className="pipeline__hero-content">
          <h1>Candidatos</h1>
        </div>
        <div className="pipeline__hero-actions">
          <motion.button
            type="button"
            className="btn-secondary pipeline__report-btn"
            onClick={() => setReportOpen(true)}
            aria-label="Abrir resumen de candidatos"
            title="Resumen de candidatos para WhatsApp"
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

      <div className="pipeline__layout" data-collapsed={sidebarCollapsed}>
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

            <div className="pipeline__recruiters">
              <button
                type="button"
                className="pipeline__kpi-row"
                onClick={() => setKpiModalOpen('pauta')}
              >
                <div className="pipeline__kpi-row__meta">
                  <span className="pipeline__kpi-row__dot pipeline__kpi-row__dot--pauta" />
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
                  <span className="pipeline__kpi-row__dot pipeline__kpi-row__dot--alexandra" />
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
                  <span className="pipeline__kpi-row__dot pipeline__kpi-row__dot--daniela" />
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
          {/* ── Toggle sidebar ── */}
          <button
            type="button"
            className="pipeline__sidebar-toggle"
            onClick={toggleSidebar}
            aria-pressed={sidebarCollapsed}
            aria-label={sidebarCollapsed ? 'Mostrar panel de KPIs' : 'Ocultar panel de KPIs'}
          >
            {sidebarCollapsed
              ? <PanelLeftOpen size={16} aria-hidden="true" />
              : <PanelLeftClose size={16} aria-hidden="true" />}
            <span>{sidebarCollapsed ? 'KPIs' : 'Ocultar'}</span>
          </button>

          {/* ── Search ── */}
          <section className="pipeline__controls">
            <div className="pipeline__search">
              <Search size={16} className="pipeline__search-icon" aria-hidden="true" />
              <label htmlFor="pipeline-search" className="sr-only">
                Buscar candidato
              </label>
              <input
                id="pipeline-search"
                type="search"
                inputMode="search"
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

            <div className="pipeline__pagination-controls">
              <button
                type="button"
                className="btn-icon"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                aria-label="Página anterior"
                title="Página anterior"
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              <span className="pipeline__pagination-text">
                Página {currentPage} de {totalPages}
              </span>
              <button
                type="button"
                className="btn-icon"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                aria-label="Página siguiente"
                title="Página siguiente"
              >
                <ChevronRight size={16} aria-hidden="true" />
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
          ) : (
            <section
              className="pipeline__card-list"
              aria-label="Lista de candidatos"
            >
              <header className="pipeline__card-list-header" aria-hidden="true">
                <span>Candidato</span>
                <span>Proyecto</span>
                <span>Puesto</span>
                <span>Contacto</span>
                <span>Fuente</span>
                <span>Estado</span>
                <span>Entrevista</span>
                <span className="text-center">Acciones</span>
              </header>
              {paginatedCandidates.map((c) => {
                const fechaCitaFmt = c.fecha_cita ? formatDate(c.fecha_cita) : null;
                const totalNotas = notesCount(c);

                const getRelativeDateInfo = (isoString: string | null) => {
                  if (!isoString) return null;
                  const date = parseISO(isoString);
                  if (isNaN(date.getTime())) return null;

                  let relative = '';
                  if (isToday(date)) relative = 'Hoy';
                  else if (isTomorrow(date)) relative = 'Mañana';
                  else if (isYesterday(date)) relative = 'Ayer';
                  else {
                    relative = formatDistanceToNowStrict(date, { addSuffix: true, locale: es });
                    relative = relative.charAt(0).toUpperCase() + relative.slice(1);
                  }
                  return relative;
                };

                const nameParts = c.nombre.trim().split(/\s+/);
                const { apellidos, nombres } = splitCandidateName(c.nombre);
                const initials = (nameParts[0]?.[0] || '') + (nameParts[1]?.[0] || '');
                const primerNombre = (nombres.split(' ')[0] || apellidos.split(' ')[0] || '').toUpperCase();

                const rawPuesto = c.puesto || '';
                const puestoLower = rawPuesto.toLowerCase();
                const puestoMsg = puestoLower ? puestoLower.charAt(0).toUpperCase() + puestoLower.slice(1) : '';

                return (
                  <article
                    key={c.id ?? c.nombre + c.fecha_aplicacion}
                    className={`pipeline__ccard pipeline__ccard--${c.status}`}
                    onClick={(e) => {
                      if (window.innerWidth <= 1024) {
                        setSelectedMobileCandidate(c);
                      }
                    }}
                  >
                    <div className="pipeline__ccard-name-col">
                      <div className="pipeline__ccard-avatar">
                        <Avatar
                          size={36}
                          name={c.nombre}
                          variant="beam"
                          colors={AVATAR_PALETTE}
                        />
                        <span
                          className="pipeline__status-dot pipeline__status-dot--avatar"
                          data-status={c.status}
                          aria-label={`Estado: ${CANDIDATE_STATUS_LABEL[c.status]}`}
                          title={CANDIDATE_STATUS_LABEL[c.status]}
                        />
                      </div>
                      <div className="pipeline__name-details">
                        <span className="pipeline__name-text">
                          <span className="pipeline__name-first">{apellidos.toUpperCase()}</span>
                          {nombres && <span className="pipeline__name-rest">{nombres.toUpperCase()}</span>}
                        </span>
                        {c.reclutador && (
                          <div className="pipeline__recruiter" title={`Reclutador: ${c.reclutador}`}>
                            <span>{c.reclutador.toUpperCase()}</span>
                          </div>
                        )}
                      </div>

                      {/* Bloque visible solo en mobile (<=1024) que resume
                          puesto + reclutador + entrevista de forma compacta. */}
                      <div className="pipeline__ccard-mobile-info" aria-hidden="true">
                        <div className="pipeline__ccard-mobile-info__puesto">
                          <div>{c.puesto}</div>
                          {c.seccion?.trim() && (
                            <div className="pipeline__seccion">{c.seccion.trim()}</div>
                          )}
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

                    <div className="pipeline__ccard-project-col">
                      {c.is_starlite ? (
                        <StarliteBadge />
                      ) : (
                        <VinoplasticBadge />
                      )}
                    </div>

                    <div className="pipeline__ccard-puesto-col">
                      <div className="pipeline__puesto">
                        <div>{c.puesto}</div>
                        {c.seccion?.trim() && (
                          <div className="pipeline__seccion">{c.seccion.trim()}</div>
                        )}
                      </div>
                    </div>
                    <div className="pipeline__ccard-contact-col">
                      {c.telefono ? (
                        <motion.a
                          href={`https://wa.me/52${c.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${primerNombre}, te escribo de Reclutamiento Querétaro para darle seguimiento a tu proceso para la vacante de ${puestoMsg}. ¿Cómo vas? ¿Tienes alguna duda? ¿Algo en lo que se te pueda ayudar?`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pipeline__whatsapp-link"
                          title="Enviar WhatsApp"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ 
                            opacity: 1, 
                            scale: 1,
                            boxShadow: [
                              "0px 0px 0px 0px rgba(0, 0, 0, 0)",
                              "0px 0px 12px 2px rgba(130, 130, 130, 0.25)",
                              "0px 0px 0px 0px rgba(0, 0, 0, 0)"
                            ]
                          }}
                          whileHover={{ scale: 1.05, y: -2, rotate: [-1, 1, 0] }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ 
                            opacity: { duration: 0.2 },
                            scale: { type: 'spring', stiffness: 400, damping: 15 },
                            boxShadow: { duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }
                          }}
                        >
                          <MessageCircle size={14} aria-hidden="true" />
                          <span>WhatsApp</span>
                        </motion.a>
                      ) : (
                        <span className="pipeline__muted">—</span>
                      )}
                      {totalNotas > 0 && (
                        <div className="pipeline__contact-item pipeline__contact-item--notes" title="Tiene notas">
                          <MessageSquare size={13} aria-hidden="true" />
                          <span>{totalNotas} nota{totalNotas !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                    <div className="pipeline__ccard-source-col">
                      {c.source ? (
                        <motion.span
                          className="pipeline__source-badge"
                          data-source={normalizeString(c.source).toLowerCase()}
                          title={`Fuente: ${c.source}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ 
                            opacity: 1, 
                            scale: 1,
                            boxShadow: [
                              "0px 0px 0px 0px rgba(0, 0, 0, 0)",
                              "0px 0px 12px 2px rgba(130, 130, 130, 0.25)",
                              "0px 0px 0px 0px rgba(0, 0, 0, 0)"
                            ]
                          }}
                          whileHover={{ scale: 1.05, y: -2, rotate: [-1, 1, 0] }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ 
                            opacity: { duration: 0.2 },
                            scale: { type: 'spring', stiffness: 400, damping: 15 },
                            boxShadow: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
                          }}
                        >
                          {c.source}
                        </motion.span>
                      ) : (
                        <span className="pipeline__muted">—</span>
                      )}
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
                          <motion.span
                            className="pipeline__status-tag"
                            data-status={c.status}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ 
                              opacity: 1, 
                              scale: 1,
                              boxShadow: [
                                "0px 0px 0px 0px rgba(0, 0, 0, 0)",
                                "0px 0px 12px 2px rgba(130, 130, 130, 0.25)",
                                "0px 0px 0px 0px rgba(0, 0, 0, 0)"
                              ]
                            }}
                            whileHover={{ scale: 1.05, y: -2, rotate: [-1, 1, 0] }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ 
                              opacity: { duration: 0.2 },
                              scale: { type: 'spring', stiffness: 400, damping: 15 },
                              boxShadow: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }
                            }}
                          >
                            <span className="pipeline__status-tag__label">
                              {CANDIDATE_STATUS_LABEL[c.status]}
                            </span>
                            <ChevronDown
                              size={14}
                              aria-hidden="true"
                              className="pipeline__status-tag__chevron"
                            />
                          </motion.span>
                        }
                      />
                    </div>
                    <div className="pipeline__ccard-dates-col pipeline__cell-dates">
                      {c.fecha_cita ? (
                        <div className="pipeline__date-smart">
                          <div className="pipeline__date-relative">
                            <CalendarDays size={13} aria-hidden="true" />
                            <span>{getRelativeDateInfo(c.fecha_cita)}</span>
                          </div>
                          <div className="pipeline__date-exact">
                            {fechaCitaFmt}
                          </div>
                        </div>
                      ) : (
                        <span className="pipeline__muted">—</span>
                      )}
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
      </div>

      {/* ── Drill-down Detail View (Mobile) ── */}
      {selectedMobileCandidate && (
        <div className="pipeline-mobile-detail-container">
          <button 
            className="config-mobile-back" 
            onClick={() => setSelectedMobileCandidate(null)}
            aria-label="Volver a Candidatos"
          >
            <ChevronLeft size={20} aria-hidden="true" />
            <span>Volver</span>
          </button>

          <article className="pipeline-mobile-detail__card">
            <div className="pipeline-mobile-detail__header">
              <div className="pipeline-mobile-detail__avatar-wrapper">
                <Avatar
                  size={56}
                  name={selectedMobileCandidate.nombre}
                  variant="beam"
                  colors={AVATAR_PALETTE}
                />
                <span
                  className="pipeline__status-dot pipeline__status-dot--avatar pipeline-mobile-detail__status-dot"
                  data-status={selectedMobileCandidate.status}
                  aria-label={`Estado: ${CANDIDATE_STATUS_LABEL[selectedMobileCandidate.status]}`}
                  title={CANDIDATE_STATUS_LABEL[selectedMobileCandidate.status]}
                />
              </div>
              <div className="pipeline-mobile-detail__title">
                {(() => {
                  const { apellidos, nombres } = splitCandidateName(selectedMobileCandidate.nombre);
                  return (
                    <h2 className="pipeline-mobile-detail__name">
                      <span className="pipeline-mobile-detail__name-apellidos">{apellidos.toUpperCase()}</span>
                      {nombres && <span className="pipeline-mobile-detail__name-nombres">{nombres.toUpperCase()}</span>}
                    </h2>
                  );
                })()}
                <div className="pipeline-mobile-detail__puesto">
                  {selectedMobileCandidate.puesto}
                  {selectedMobileCandidate.seccion?.trim() && ` - ${selectedMobileCandidate.seccion.trim()}`}
                </div>
              </div>
            </div>

            <div className="pipeline-mobile-detail__info-grid">
              <div className="pipeline-mobile-detail__info-item">
                <UserRound size={16} aria-hidden="true" className="pipeline-mobile-detail__info-icon" />
                <div className="pipeline-mobile-detail__info-content">
                  <span className="pipeline-mobile-detail__info-label">Reclutador</span>
                  <span className="pipeline-mobile-detail__info-value">{selectedMobileCandidate.reclutador || '—'}</span>
                </div>
              </div>
              
              <div className="pipeline-mobile-detail__info-item">
                <CalendarDays size={16} aria-hidden="true" className="pipeline-mobile-detail__info-icon" />
                <div className="pipeline-mobile-detail__info-content">
                  <span className="pipeline-mobile-detail__info-label">Entrevista</span>
                  <span className="pipeline-mobile-detail__info-value">
                    {selectedMobileCandidate.fecha_cita ? formatDate(selectedMobileCandidate.fecha_cita) : '—'}
                  </span>
                </div>
              </div>

              <div className="pipeline-mobile-detail__info-item">
                <LayoutGrid size={16} aria-hidden="true" className="pipeline-mobile-detail__info-icon" />
                <div className="pipeline-mobile-detail__info-content">
                  <span className="pipeline-mobile-detail__info-label">Proyecto</span>
                  <span className="pipeline-mobile-detail__info-value" style={{ display: 'flex' }}>
                    {selectedMobileCandidate.is_starlite ? <StarliteBadge /> : <VinoplasticBadge />}
                  </span>
                </div>
              </div>
            </div>

            <div className="pipeline-mobile-detail__actions">
              <div className="pipeline-mobile-detail__quick-row">
              {selectedMobileCandidate.telefono ? (
                <motion.a
                  href={`https://wa.me/52${selectedMobileCandidate.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, te escribo de Reclutamiento Querétaro para darle seguimiento a tu proceso para la vacante de ${selectedMobileCandidate.puesto}. ¿Cómo vas? ¿Tienes alguna duda? ¿Algo en lo que se te pueda ayudar?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pipeline__whatsapp-link pipeline-mobile-detail__whatsapp"
                  title="Contactar por WhatsApp"
                  aria-label="Contactar por WhatsApp"
                  whileTap={{ scale: 0.95 }}
                >
                  <MessageCircle size={18} aria-hidden="true" />
                  <span>WhatsApp</span>
                </motion.a>
              ) : (
                <div className="pipeline-mobile-detail__no-whatsapp">
                  Sin número
                </div>
              )}

              <div className="pipeline-mobile-detail__status-select">
                <div className="pipeline__cell-status pipeline-mobile-detail__status-cell" data-status={selectedMobileCandidate.status}>
                  <CustomSelect
                    id={`mobile-status-${selectedMobileCandidate.id}`}
                    value={selectedMobileCandidate.status}
                    placeholder=""
                    onChange={(val) => handleStatusChange(selectedMobileCandidate, val as CandidateStatus)}
                    options={CANDIDATE_STATUSES.map((s) => ({
                      value: s,
                      label: CANDIDATE_STATUS_LABEL[s],
                    }))}
                    aria-label={`Cambiar estado de ${selectedMobileCandidate.nombre}`}
                    customTrigger={
                      <motion.span
                        className="pipeline__status-tag pipeline-mobile-detail__status-tag"
                        data-status={selectedMobileCandidate.status}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="pipeline__status-tag__label">
                          {CANDIDATE_STATUS_LABEL[selectedMobileCandidate.status]}
                        </span>
                        <ChevronDown size={16} aria-hidden="true" className="pipeline__status-tag__chevron" />
                      </motion.span>
                    }
                  />
                </div>
              </div>
              </div>

              <div className="pipeline-mobile-detail__row-actions">
                <span className="pipeline-mobile-detail__info-label pipeline-mobile-detail__actions-label">Acciones</span>
                <div className="pipeline-mobile-detail__actions-grid">
                  <button
                    className="btn-secondary pipeline-mobile-detail__action-btn"
                    title="Editar candidato"
                    onClick={() => openEdit(selectedMobileCandidate)}
                  >
                    <Pencil size={16} aria-hidden="true" />
                    <span>Editar</span>
                  </button>
                  <button
                    className="btn-secondary pipeline-mobile-detail__action-btn"
                    title="Ver notas"
                    onClick={() => setNotesTarget(selectedMobileCandidate)}
                  >
                    <MessageSquare size={16} aria-hidden="true" />
                    <span>Notas ({notesCount(selectedMobileCandidate)})</span>
                  </button>
                  {selectedMobileCandidate.status === 'contratado' && !selectedMobileCandidate.employee_num && (
                    <button
                      className="btn-primary pipeline-mobile-detail__action-btn"
                      title="Contratar"
                      onClick={() => openHire(selectedMobileCandidate)}
                    >
                      <BadgeCheck size={16} aria-hidden="true" />
                      <span>Contratar</span>
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      className="btn-secondary pipeline-mobile-detail__action-btn pipeline-mobile-detail__action-btn--full pipeline-mobile-detail__action-btn--danger"
                      title="Eliminar candidato"
                      onClick={() => {
                        openDelete(selectedMobileCandidate);
                        setSelectedMobileCandidate(null);
                      }}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                      <span>Eliminar</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </article>
        </div>
      )}

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
    </MotionConfig>
  );
}
