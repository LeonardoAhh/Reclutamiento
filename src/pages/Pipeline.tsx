import { useEffect, useMemo, useState, useRef } from 'react';
import { MotionConfig } from 'framer-motion';
import { parseISO, isToday, isTomorrow, isYesterday, formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';

import { ArrowUpRight, BadgeCheck, BarChart3, CalendarDays, CircleCheckBig, ChevronDown, ChevronLeft, ChevronRight, ClipboardList, Info, LayoutGrid, MessageCircle, MessageSquare, PanelLeftClose, PanelLeftOpen, PenLine, Phone, Search, SlidersHorizontal, Star, Table2, Trash2, UserRoundPlus, UserRound, UserX, UsersRound } from 'lucide-react';
import { SlidersHorizontal as SlidersHorizontalIconData } from 'lucide';
import { Badge, StarliteBadge, VinoplasticBadge, ReclutadorBadge } from '@/components/ui/Badge';
import { CandidateModal } from '@/components/ui/CandidateModal';
import { CandidateAccessCard } from '@/components/ui/CandidateAccessCard';
import { CandidateNotesModal } from '@/components/ui/CandidateNotesModal';
import { Tooltip } from '@/components/ui/Tooltip';
import { notifyResult, toast } from '@/lib/notify';
import { CandidateReportModal } from '@/components/ui/CandidateReportModal';
import { CandidateStatusBadge } from '@/components/ui/CandidateStatusBadge';
import { HireCandidateModal } from '@/components/ui/HireCandidateModal';
import { RecruiterStatsModal } from '@/components/ui/RecruiterStatsModal';
import { CandidateRowActions } from '@/components/ui/CandidateRowActions';
import { BoneyardSkeleton } from '@/components/ui/BoneyardSkeleton';
import { Modal } from '@/components/ui/Modal';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { SearchField } from '@/components/ui/SearchField';
import {
  EMPTY_FILTERS,
  type FilterState,
} from '@/components/pipeline/CandidateFilters';
import { useAuth } from '@/hooks/useAuth';
import { useCandidates } from '@/hooks/useCandidates';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useVacancyRequests } from '@/hooks/useVacancyRequests';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { CANDIDATE_STATUSES, CANDIDATE_STATUS_LABEL } from '@/lib/types';
import type { Candidate, CandidateStatus, Employee } from '@/lib/types';
import { formatReadableDate, formatShortDate, startOfDayMxMs, endOfDayMxMs, getPautaWeekRange, shiftPautaWeek } from '@/lib/dates';
import { getRecruiterAccessCardName, RECLUTADORES_ACTIVOS } from '@/lib/constants';
import { normalizeString, formatPhoneNumber } from '@/lib/utils';
import { splitCandidateName } from '@/lib/names';
import { DESKTOP_MEDIA_QUERY } from '@/lib/layout';
import './Pipeline.css';

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
    loading,
    error,
    addCandidate,
    updateCandidate,
    setCandidateStatus,
    markCandidateHired,
    deleteCandidate,
    refetch,
  } = useCandidates();

  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const { addSingleEmployee } = useSupabaseData();
  const { coverVacancyForEmployee } = useVacancyRequests({ loadHistory: false });

  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [macroStatus, setMacroStatus] = useState<'todos' | 'activos' | 'contratados' | 'bajas'>(() => {
    try {
      const stored = localStorage.getItem('reclutamiento_macro_status');
      if (stored === 'todos' || stored === 'activos' || stored === 'contratados' || stored === 'bajas') {
        return stored;
      }
    } catch {}
    return 'activos';
  });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [quickProfile, setQuickProfile] = useState<Candidate | null>(null);
  const [accessCardTarget, setAccessCardTarget] = useState<Candidate | null>(null);
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
  const [selectedMobileCandidate, setSelectedMobileCandidate] = useState<Candidate | null>(null);
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);

  const [metricsModalOpen, setMetricsModalOpen] = useState(false);

  useEffect(() => {
    if (isDesktop) setSelectedMobileCandidate(null);
  }, [isDesktop]);

  // Guardar macroStatus en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('reclutamiento_macro_status', macroStatus);
    } catch {}
  }, [macroStatus]);

  // Forzar switch de "Mis Candidatos" al entrar si es reclutador
  const [hasForcedRecruiter, setHasForcedRecruiter] = useState(false);
  useEffect(() => {
    if (profile?.role === 'reclutador' && profile?.display_name && !hasForcedRecruiter) {
      setFilters((prev) => {
        const newFilters = { ...prev, reclutador: profile.display_name! };
        try { localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(newFilters)); } catch {}
        return newFilters;
      });
      setHasForcedRecruiter(true);
    }
  }, [profile, hasForcedRecruiter]);

  // Global hotkey para enfocar la búsqueda (Ctrl+K o Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const accessCardData = useMemo(() => {
    if (!accessCardTarget?.reclutador || !accessCardTarget.puesto) return null;
    const recruiterName = getRecruiterAccessCardName(accessCardTarget.reclutador);
    if (!recruiterName) return null;

    return {
      candidateName: accessCardTarget.nombre,
      recruiterName,
      position: accessCardTarget.puesto,
      interviewDate: accessCardTarget.fecha_cita
        ? formatReadableDate(accessCardTarget.fecha_cita)
        : null,
    };
  }, [accessCardTarget]);

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
    setSearchTerm('');
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
    // Filtros de rango anclados a TZ MX para evitar desfases del visor.
    const desde = startOfDayMxMs(filters.fechaDesde);
    const hasta = endOfDayMxMs(filters.fechaHasta);

    return candidates.filter((c) => {
      // Macro filter (Segmented Control)
      if (macroStatus === 'activos' && ['contratado', 'baja', 'rechazado', 'no_asistio'].includes(c.status)) return false;
      if (macroStatus === 'contratados' && c.status !== 'contratado') return false;

      if (filters.area && c.area !== filters.area) return false;
      if (filters.puesto && c.puesto !== filters.puesto) return false;
      if (filters.estado && c.status !== filters.estado) return false;
      if (filters.reclutador && normalizeString(c.reclutador ?? '') !== normalizeString(filters.reclutador)) return false;
      if (filters.source && (c.source ?? '') !== filters.source) return false;

      if (desde || hasta) {
        if (!c.fecha_cita) return false;
        const dayStr = String(c.fecha_cita).slice(0, 10);
        const ts = startOfDayMxMs(dayStr);
        if (ts === null) return false;
        if (desde && ts < desde) return false;
        if (hasta && ts > hasta) return false;
      }
      return true;
    });
  }, [candidates, filters, macroStatus]);

  // Resultados exclusivos para el Dropdown de Búsqueda
  const searchResults = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return [];

    const digitsOnly = q.replace(/\D/g, '');
    const isPhoneQuery = digitsOnly.length >= 10;
    const phoneToSearch = isPhoneQuery ? digitsOnly.slice(-10) : digitsOnly;
    const isNumericQuery = digitsOnly.length > 0 && q.replace(/[\s-]/g, '') === digitsOnly;

    return candidates.filter((c) => {
      const telStr = c.telefono ? String(c.telefono) : '';
      const cleanTel = telStr.replace(/\D/g, '');

      const haystack = [
        c.nombre,
        c.puesto,
        c.area,
        c.reclutador,
        c.source,
        c.email,
        telStr,
        cleanTel
      ].filter(Boolean).join(' ').toLowerCase();

      // Búsqueda estricta de teléfono
      if (isPhoneQuery) {
        return cleanTel.includes(phoneToSearch) || haystack.includes(phoneToSearch);
      }

      if (isNumericQuery) {
        return cleanTel.includes(digitsOnly) || haystack.includes(digitsOnly);
      }

      // Búsqueda normal de texto
      return haystack.includes(q);
    }).slice(0, 5); // Limitamos a 5 resultados
  }, [candidates, searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, macroStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedCandidates = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );


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
    mode: 'create' | 'associate';
    employee: Employee;
    candidateId: string;
  }): Promise<{ ok: boolean; message?: string }> {
    if (input.mode === 'create') {
      const empResult = await addSingleEmployee(input.employee);
      if (!empResult.ok) {
        toast.error({ title: 'No se pudo contratar' });
        return empResult;
      }
    }

    const candResult = await markCandidateHired(
      input.candidateId,
      input.employee.num_empleado,
      input.employee.fecha_ingreso
    );

    if (!candResult.ok) {
      const message =
        candResult.message ??
        (input.mode === 'create'
          ? 'Empleado creado, pero no se pudo actualizar el candidato.'
          : 'No se pudo vincular al candidato.');
      toast.warning({ title: input.mode === 'create' ? 'Contratación incompleta' : 'Vinculación fallida' });
      return { ok: false, message };
    }

    // Cierra automáticamente la vacante abierta que coincida con el puesto.
    await coverVacancyForEmployee(input.employee, {
      source: `candidato:${input.candidateId}`,
    });

    toast.success({
      title: input.mode === 'create' ? 'Candidato contratado' : 'Candidato vinculado',
    });
    return { ok: true };
  }

  return (
    <BoneyardSkeleton
      name="candidatos-page"
      loading={loading}
      loadingLabel="Cargando candidatos…"
    >
      <MotionConfig reducedMotion="user">
        <main className="pipeline container">
      <div className={`pipeline-main-container ${selectedMobileCandidate ? 'mobile-hidden' : ''}`}>
        {/* ── Hero ── */}
      <header className="page-header">
        <div className="page-header__content">
          <h1 className="page-title">Candidatos</h1>
        </div>
        <div className="page-header__actions pipeline__hero-actions">
          <button
            type="button"
            className="btn-secondary pipeline__report-btn"
            onClick={() => setMetricsModalOpen(true)}
            aria-label="Abrir métricas y KPIs"
            title="Métricas y KPIs"
          >
            <BarChart3 size={16} aria-hidden="true" />
            <span>Métricas</span>
          </button>
          <button
            type="button"
            className="btn-secondary pipeline__report-btn"
            onClick={() => setReportOpen(true)}
            aria-label="Abrir resumen de candidatos"
            title="Resumen de candidatos para WhatsApp"
          >
            <ClipboardList size={16} aria-hidden="true" />
            <span>Resumen</span>
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={openAdd}
            aria-label="Nuevo candidato"
            title="Nuevo candidato"
          >
            <UserRoundPlus size={16} aria-hidden="true" />
            <span>Nuevo</span>
          </button>
        </div>
      </header>

      <div className="pipeline__layout">
        <div className="pipeline__content">

          {/* ── Search & Macro Filters ── */}
          <section className="pipeline__controls">
            <div className="pipeline__search-container">
              <div className="pipeline__search">
                <SearchField
                  id="pipeline-search-input"
                  ref={searchInputRef}
                  className="pipeline__search-field"
                  label="Buscar candidato"
                  placeholder="Buscar por nombre, puesto, teléfono... (Ctrl+K)"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  onClear={() => setSearchTerm('')}
                  autoComplete="off"
                />

                {/* ── Dropdown de Resultados ── */}
                {searchTerm.trim().length > 0 && (
                  <div
                    className="pipeline__search-dropdown"
                    role="region"
                    aria-label="Resultados de búsqueda"
                  >
                    {searchResults.length > 0 ? (
                      searchResults.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          className="search-dropdown-item"
                          onClick={() => {
                            setSearchTerm('');
                            setQuickProfile(c);
                          }}
                        >
                          <div className="search-dropdown-item__avatar">
                            {(c.nombre ?? '?').charAt(0)}
                          </div>
                          <div className="search-dropdown-item__text">
                            <strong>{c.nombre}</strong>
                            <span className="search-dropdown-item__info">
                              {c.telefono} • {c.reclutador} • {CANDIDATE_STATUS_LABEL[c.status]}
                            </span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="search-dropdown-item__empty" role="status">
                        <UserX size={16} aria-hidden="true" />
                        <span>No hay coincidencias</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="pipeline__quick-filters">
              {profile?.role === 'reclutador' && (
                <label className="toggle-switch pipeline__quick-toggle">
                  <input
                    type="checkbox"
                    role="switch"
                    aria-checked={normalizeString(filters.reclutador ?? '') === normalizeString(profile.display_name ?? '')}
                    checked={normalizeString(filters.reclutador ?? '') === normalizeString(profile.display_name ?? '')}
                    onChange={(e) => {
                      const newFilters = {
                        ...filters,
                        reclutador: e.target.checked ? (profile.display_name ?? '') : ''
                      };
                      setFilters(newFilters);
                      try {
                        localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(newFilters));
                      } catch {}
                    }}
                  />
                  <span className="toggle-switch__slider"></span>
                  <span className="toggle-switch__label">Mis Candidatos</span>
                </label>
              )}

              <div className="segmented-control pipeline__quick-segments">
                {(['todos', 'activos', 'contratados', 'bajas'] as const).map(f => (
                  <button
                    key={f}
                    type="button"
                    className={`segmented-control__btn ${macroStatus === f ? 'is-active' : ''}`}
                    onClick={() => setMacroStatus(f)}
                    aria-pressed={macroStatus === f}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ── Vista (tabla o kanban) ── */}
          {error ? (
            <section
              className="pipeline__empty"
              aria-labelledby="pipeline-error-title"
              role="alert"
            >
              <div className="animated-empty-state pipeline__empty-state pipeline__empty-state--error">
                <div className="animated-empty-state__icon">
                  <UserX aria-hidden="true" />
                </div>
                <h2 className="animated-empty-state__title" id="pipeline-error-title">Error al cargar</h2>
                <p className="pipeline__error-message">
                  {error}
                </p>
                <button type="button" className="btn-secondary pipeline__empty-action" onClick={() => refetch()}>
                  Reintentar
                </button>
              </div>
            </section>
          ) : filtered.length === 0 ? (
            <section className="pipeline__empty">
              {candidates.length === 0 ? (
                <>
                  <h2>Aún no hay candidatos</h2>
                  <p>
                    Empieza agregando tu primer candidato a la base de datos de reclutamiento.
                  </p>
                  <Tooltip content="Agregar candidato">
                    <button type="button" className="btn-primary" onClick={openAdd} aria-label="Agregar primer candidato">
                      <UserRoundPlus size={16} aria-hidden="true" />
                    </button>
                  </Tooltip>
                </>
              ) : (
                <div className="animated-empty-state pipeline__empty-state">
                  <div className="animated-empty-state__icon">
                    <UserX aria-hidden="true" />
                  </div>
                  <div className="animated-empty-state__title">Sin resultados</div>
                  {(activeFiltersCount > 0 || searchTerm.trim().length > 0) && (
                    <button
                      type="button"
                      className="btn-secondary pipeline__empty-action"
                      onClick={resetFilters}
                      title="Limpiar filtros"
                    >
                      <SlidersHorizontal size={16} aria-hidden="true" />
                      Limpiar filtros
                    </button>
                  )}
                </div>
              )}
            </section>
          ) : (
            <>
            <section
              className="pipeline__card-list"
              aria-label="Lista de candidatos"
              role={isDesktop ? "table" : undefined}
            >
              <div className="pipeline__card-list-header" role="row">
                <span role="columnheader">Candidato</span>
                <span role="columnheader">Puesto</span>
                <span role="columnheader">Proceso</span>
                <span role="columnheader">Entrevista</span>
                <span role="columnheader" className="text-center">Acciones</span>
              </div>
              {paginatedCandidates.map((c) => {
                const fechaCitaFmt = c.fecha_cita ? formatDate(c.fecha_cita) : null;
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
                    role={isDesktop ? "row" : "button"}
                    tabIndex={isDesktop ? undefined : 0}
                    aria-label={isDesktop ? undefined : `Ver detalles de ${c.nombre}`}
                    onClick={isDesktop ? undefined : () => setSelectedMobileCandidate(c)}
                    onKeyDown={isDesktop ? undefined : (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedMobileCandidate(c);
                      }
                    }}
                  >
                    <div className="pipeline__ccard-name-col" role={isDesktop ? "cell" : undefined}>
                      <div className="pipeline__name-details">
                        <span className="pipeline__name-text">
                          <span className="pipeline__name-first">{apellidos.toUpperCase()}</span>
                          {nombres && <span className="pipeline__name-rest">{nombres.toUpperCase()}</span>}
                        </span>

                      </div>

                      {/* Bloque visible bajo desktop que resume
                          puesto + reclutador + entrevista de forma compacta. */}
                      <div className="pipeline__ccard-mobile-info" aria-hidden="true">
                        <div className="pipeline__ccard-mobile-info__puesto">
                          <div className="pipeline__puesto-name" title={c.puesto}>{c.puesto}</div>
                          {c.seccion?.trim() && (
                            <div className="pipeline__seccion">{c.seccion.trim()}</div>
                          )}
                        </div>
                        <div className="pipeline__ccard-mobile-info__meta">
                          {c.reclutador && (
                            <ReclutadorBadge nombre={c.reclutador} size="sm" />
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

                    <div className="pipeline__ccard-puesto-col" role={isDesktop ? "cell" : undefined}>
                      <div className="pipeline__puesto">
                        <div className="pipeline__puesto-name" title={c.puesto}>{c.puesto}</div>
                        {c.seccion?.trim() && (
                          <div className="pipeline__seccion">{c.seccion.trim()}</div>
                        )}
                      </div>
                    </div>

                    <div
                      className="pipeline__cell-status pipeline__ccard-status-col"
                      data-status={c.status}
                      role={isDesktop ? "cell" : undefined}
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
                          <div className="pipeline__status-trigger">
                            <CandidateStatusBadge status={c.status} showCaret />
                          </div>
                        }
                      />
                    </div>
                    <div
                      className="pipeline__ccard-dates-col pipeline__cell-dates"
                      role={isDesktop ? "cell" : undefined}
                    >
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
                    <div
                      className="pipeline__cell-actions pipeline__ccard-actions-col"
                      role={isDesktop ? "cell" : undefined}
                    >
                      <CandidateRowActions
                        candidate={c}
                        onEdit={openEdit}
                        onDelete={isAdmin ? openDelete : undefined}
                        onAccessCard={
                          c.reclutador && c.puesto
                            ? () => setAccessCardTarget(c)
                            : undefined
                        }
                      />
                    </div>
                  </article>
                );
              })}
            </section>

            <nav className="pipeline__pagination-controls" aria-label="Paginación de candidatos">
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
            </nav>
            </>
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

          <Modal
            isOpen={accessCardData !== null}
            onClose={() => setAccessCardTarget(null)}
            className="candidate-access-card-modal"
            size="xs"
            title="Pase de entrevista"
            icon={<BadgeCheck size={20} className="color-success" aria-hidden="true" />}
          >
            {accessCardData && (
              <CandidateAccessCard
                data={accessCardData}
              />
            )}
          </Modal>



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
            type="button"
            className="btn-text config-mobile-back"
            onClick={() => setSelectedMobileCandidate(null)}
            aria-label="Volver a Candidatos"
          >
            <ChevronLeft size={20} aria-hidden="true" />
            <span>Volver</span>
          </button>

          <article className="pipeline-mobile-detail__card">
            <div className="pipeline-mobile-detail__header">
              <div className="pipeline-mobile-detail__avatar-wrapper">
                {selectedMobileCandidate.reclutador ? (
                  <ReclutadorBadge nombre={selectedMobileCandidate.reclutador} variant="icon-only" className="pipeline__ccard-avatar-badge" />
                ) : (
                  <div className="pipeline__ccard-avatar-placeholder" />
                )}
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
                  <div>{selectedMobileCandidate.puesto}</div>
                  {selectedMobileCandidate.seccion?.trim() && <div>{selectedMobileCandidate.seccion.trim()}</div>}
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

              <div className="pipeline-mobile-detail__info-item pipeline-mobile-detail__info-item--wide">
                <LayoutGrid size={16} aria-hidden="true" className="pipeline-mobile-detail__info-icon" />
                <div className="pipeline-mobile-detail__info-content">
                  <span className="pipeline-mobile-detail__info-label">Proyecto</span>
                  <span className="pipeline-mobile-detail__info-value pipeline-mobile-detail__info-value--inline">
                    {selectedMobileCandidate.is_starlite ? <StarliteBadge /> : <VinoplasticBadge />}
                  </span>
                </div>
              </div>
            </div>

            <div className="pipeline-mobile-detail__actions">
              <div className="pipeline-mobile-detail__quick-row">
              {selectedMobileCandidate.telefono ? (
                <a
                  href={`https://wa.me/52${selectedMobileCandidate.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, te escribo de Reclutamiento Querétaro para darle seguimiento a tu proceso para la vacante de ${selectedMobileCandidate.puesto}. ¿Cómo vas? ¿Tienes alguna duda? ¿Algo en lo que se te pueda ayudar?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pipeline__whatsapp-link pipeline-mobile-detail__whatsapp"
                  title="Contactar por WhatsApp"
                  aria-label="Contactar por WhatsApp"
                >
                  <MessageCircle size={18} aria-hidden="true" />
                  <span>WhatsApp</span>
                </a>
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
                      <div className="pipeline__status-trigger pipeline__status-trigger--full">
                        <CandidateStatusBadge
                          status={selectedMobileCandidate.status}
                          showCaret
                          compact
                          className="pipeline-mobile-detail__status-badge"
                        />
                      </div>
                    }
                  />
                </div>
              </div>
              </div>

              <div className="pipeline-mobile-detail__row-actions">
                <span className="pipeline-mobile-detail__info-label pipeline-mobile-detail__actions-label">Acciones</span>
                <div className="pipeline-mobile-detail__actions-grid">
                  <button
                    type="button"
                    className="btn-secondary pipeline-mobile-detail__action-btn"
                    title="Editar candidato"
                    onClick={() => openEdit(selectedMobileCandidate)}
                  >
                    <PenLine size={16} aria-hidden="true" />
                    <span>Editar</span>
                  </button>
                  {selectedMobileCandidate.status === 'contratado' && !selectedMobileCandidate.employee_num && (
                    <button
                      type="button"
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
                      type="button"
                      className="btn-secondary pipeline-mobile-detail__action-btn pipeline-mobile-detail__action-btn--danger"
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

      {/* ── Quick Profile (Modal) ── */}
      <Modal
        isOpen={!!quickProfile}
        onClose={() => setQuickProfile(null)}
        title="Vista Previa"
        size="md"
        footerActions={
          <>
            {quickProfile?.status === 'contratado' && !quickProfile?.employee_num && (
              <button
                type="button"
                className="btn btn-primary quick-profile__footer-action"
                onClick={() => {
                  if (!quickProfile) return;
                  const target = quickProfile;
                  setQuickProfile(null);
                  openHire(target);
                }}
              >
                <BadgeCheck size={16} aria-hidden="true" />
                <span>Contratar</span>
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary quick-profile__footer-action"
              onClick={() => {
                if (!quickProfile) return;
                const target = quickProfile;
                setQuickProfile(null);
                openEdit(target);
              }}
            >
              Editar Perfil Completo
            </button>
          </>
        }
      >
        {quickProfile && (
          <div className="modal-body">
            <div className="quick-profile-header">
              <div className="quick-profile__avatar">
                {(quickProfile.nombre ?? '?').charAt(0)}
              </div>
              <div className="quick-profile__info">
                <h3>{quickProfile.nombre}</h3>
                <p>{quickProfile.telefono} • {quickProfile.puesto}</p>
                <div className="quick-profile__status-wrap">
                  <CandidateStatusBadge status={quickProfile.status} />
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modals de KPIs de reclutadores ── */}
      <RecruiterStatsModal
        isOpen={kpiModalOpen !== null}
        onClose={() => setKpiModalOpen(null)}
        onBack={() => {
          setKpiModalOpen(null);
          setMetricsModalOpen(true);
        }}
        mode={kpiModalOpen}
        recruiterStats={recruiterStats}
        pautaStats={pautaStats}
        alexandraStats={alexandraStats}
        danielaStats={danielaStats}
      />
      {/* ── Modal de Menú de Métricas ── */}
      <Modal
        isOpen={metricsModalOpen}
        onClose={() => setMetricsModalOpen(false)}
        title="Métricas y KPIs"
        size="sm"
      >
        <div className="modal-body pipeline__metrics-menu">
          {/* Card resumen global */}
          <button
            type="button"
            className="pipeline__kpi-card pipeline__kpi-card--global"
            onClick={() => {
              setMetricsModalOpen(false);
              setKpiModalOpen('global');
            }}
          >
            <div className="pipeline__kpi-card__icon">
              <UsersRound size={20} aria-hidden="true" />
            </div>
            <div className="pipeline__kpi-card__body">
              <span className="pipeline__kpi-card__label">Resumen General</span>
              <span className="pipeline__kpi-card__hint">
                {candidates.filter(c => CITADO_STATUSES.has(c.status)).length} citados
              </span>
            </div>
            <ArrowUpRight size={18} className="pipeline__kpi-card__arrow" aria-hidden="true" />
          </button>

          <div className="pipeline__sidebar-divider" />

          {/* Sección: Detalle por Reclutador */}
          <div className="pipeline__sidebar-section">
            <span className="pipeline__sidebar-section__label">Detalle por Reclutador</span>
            <div className="pipeline__recruiters">
              <button
                type="button"
                className="pipeline__kpi-row"
                onClick={() => {
                  setMetricsModalOpen(false);
                  setKpiModalOpen('pauta');
                }}
              >
                <div className="pipeline__kpi-row__meta">
                  <span className="pipeline__kpi-row__dot pipeline__kpi-row__dot--pauta" />
                  <span className="pipeline__kpi-row__name">Pauta</span>
                </div>
                <div className="pipeline__kpi-row__stats">
                  <ArrowUpRight size={16} className="pipeline__kpi-card__arrow" aria-hidden="true" />
                </div>
              </button>

              <button
                type="button"
                className="pipeline__kpi-row"
                onClick={() => {
                  setMetricsModalOpen(false);
                  setKpiModalOpen('alexandra');
                }}
              >
                <div className="pipeline__kpi-row__meta">
                  <span className="pipeline__kpi-row__dot pipeline__kpi-row__dot--alexandra" />
                  <span className="pipeline__kpi-row__name">Alexandra</span>
                </div>
                <div className="pipeline__kpi-row__stats">
                  <ArrowUpRight size={16} className="pipeline__kpi-card__arrow" aria-hidden="true" />
                </div>
              </button>

              <button
                type="button"
                className="pipeline__kpi-row"
                onClick={() => {
                  setMetricsModalOpen(false);
                  setKpiModalOpen('daniela');
                }}
              >
                <div className="pipeline__kpi-row__meta">
                  <span className="pipeline__kpi-row__dot pipeline__kpi-row__dot--daniela" />
                  <span className="pipeline__kpi-row__name">Daniela</span>
                </div>
                <div className="pipeline__kpi-row__stats">
                  <ArrowUpRight size={16} className="pipeline__kpi-card__arrow" aria-hidden="true" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </Modal>

        </main>
      </MotionConfig>
    </BoneyardSkeleton>
  );
}
