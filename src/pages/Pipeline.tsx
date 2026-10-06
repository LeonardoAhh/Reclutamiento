import { useEffect, useMemo, useState, useRef } from 'react';
import { MotionConfig } from 'framer-motion';
import { isToday, isTomorrow, isYesterday, formatDistanceToNowStrict } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { candidateStatusLabel } from '@/lib/candidateTranslations';

import { ArrowUpRight, BadgeCheck, BarChart3, CalendarDays, ClipboardList, FileImage, LayoutGrid, PenLine, SlidersHorizontal, Trash2, UserRoundPlus, UserRound, UserX, UsersRound } from 'lucide-react';
import { StarliteBadge, VinoplasticBadge, ReclutadorBadge } from '@/components/ui/Badge';
import { CandidateModal } from '@/components/ui/CandidateModal';
import { CandidateAccessCard } from '@/components/ui/CandidateAccessCard';
import { Tooltip } from '@/components/ui/Tooltip';
import { notifyResult, toast } from '@/lib/notify';
import { buildCandidateReport } from '@/lib/candidateReport';
import { copyTextToClipboard } from '@/lib/whatsappReport';
import { CandidateStatusBadge } from '@/components/ui/CandidateStatusBadge';
import { HireCandidateModal } from '@/components/ui/HireCandidateModal';
import { RecruiterStatsModal } from '@/components/ui/RecruiterStatsModal';
import { CandidateRowActions } from '@/components/ui/CandidateRowActions';
import { BoneyardSkeleton } from '@/components/ui/BoneyardSkeleton';
import { Modal } from '@/components/ui/Modal';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { SearchField } from '@/components/ui/SearchField';
import { Toolbar, ToolbarGroup } from '@/components/ui/Toolbar';
import { BackButton } from '@/components/ui/BackButton';
import { Pagination } from '@/components/ui/Pagination';
import {
  CandidateFilters,
  type CandidateGroup,
} from '@/components/pipeline/CandidateFilters';
import { useAuth } from '@/hooks/useAuth';
import { useCandidates } from '@/hooks/useCandidates';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useVacancyRequests } from '@/hooks/useVacancyRequests';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { CANDIDATE_STATUSES } from '@/lib/types';
import type { Candidate, CandidateStatus, Employee } from '@/lib/types';
import { formatReadableDate, formatShortDate, getPautaWeekRange, shiftPautaWeek } from '@/lib/dates';
import { useTeamDirectory } from '@/features/team/TeamProvider';
import { accessCardRecruiterName } from '@/features/team/types';
import { normalizeString } from '@/lib/utils';
import { splitCandidateName } from '@/lib/names';
import { DESKTOP_MEDIA_QUERY } from '@/lib/layout';
import './Pipeline.css';

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
  const { language } = useLanguage();
  const en = language === 'en';
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
  const [macroStatus, setMacroStatus] = useState<CandidateGroup>(() => {
    try {
      const stored = localStorage.getItem('reclutamiento_macro_status');
      if (stored === 'todos' || stored === 'activos' || stored === 'contratados' || stored === 'bajas') {
        return stored;
      }
    } catch {}
    return 'activos';
  });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [quickProfile, setQuickProfile] = useState<Candidate | null>(null);
  const [accessCardTarget, setAccessCardTarget] = useState<Candidate | null>(null);
  const [hireTarget, setHireTarget] = useState<Candidate | null>(null);
  const { members, resolve } = useTeamDirectory();
  const [kpiModalOpen, setKpiModalOpen] = useState<'global' | 'pauta' | 'recruiter' | null>(null);
  const [metricRecruiterId, setMetricRecruiterId] = useState('');
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
    const recruiterName = accessCardRecruiterName(members, accessCardTarget.reclutador);
    if (!recruiterName) return null;

    return {
      candidateName: accessCardTarget.nombre,
      recruiterName,
      position: accessCardTarget.puesto,
      interviewDate: accessCardTarget.fecha_cita
        ? formatReadableDate(accessCardTarget.fecha_cita)
        : null,
    };
  }, [accessCardTarget, members]);

  const { pautaStats, individualStats } = useMemo(() => {
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
      individualStats: getWeeklyStats(candidates.filter(c => normalizeString(c.source ?? '') === 'PAUTA' && resolve(c.reclutador)?.id === metricRecruiterId), 20, 7),
    };
  }, [candidates, resolve, metricRecruiterId]);

  function resetFilters() {
    setMacroStatus('todos');
    setSearchTerm('');
  }

  /**
   * KPIs por integrante del catálogo, incluyendo cuentas dadas de baja.
   * Cuenta candidatos cuyo `reclutador`
   * normalizado (mayusculas + sin acentos) coincide con uno de los
   * nombres canónicos o variantes del catálogo. Otros nombres se
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
    for (const member of members.filter(member => member.selectable)) acc.set(member.canonical_name, empty(member.canonical_name));
    for (const c of candidates) {
      const norm = resolve(c.reclutador)?.canonical_name ?? normalizeString(c.reclutador ?? '');
      const bucket = acc.get(norm);
      if (!bucket) continue;
      bucket.total += 1;
      if (c.status === 'contratado') bucket.contratados += 1;
      else if (c.status === 'rechazado') bucket.rechazados += 1;
      else if (c.status === 'no_asistio') bucket.no_asistio += 1;
      else if (CITADO_STATUSES.has(c.status)) bucket.citados += 1;
    }
    return Array.from(acc.values());
  }, [candidates, members, resolve]);

  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      if (macroStatus === 'activos' && ['contratado', 'baja', 'rechazado', 'no_asistio'].includes(c.status)) return false;
      if (macroStatus === 'contratados' && c.status !== 'contratado') return false;
      return true;
    });
  }, [candidates, macroStatus]);

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
  }, [macroStatus]);

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
        success: id ? (en ? 'Candidate updated' : 'Candidato actualizado') : (en ? 'Candidate added' : 'Candidato agregado'),
        error: id ? (en ? 'Could not update candidate' : 'No se pudo actualizar el candidato') : (en ? 'Could not add candidate' : 'No se pudo agregar el candidato'),
      }
    );
  }

  async function handleStatusChange(c: Candidate, status: CandidateStatus) {
    if (!c.id || c.status === status) return;
    await notifyResult(setCandidateStatus(c.id, status), {
      success: en ? 'Status updated' : 'Estado actualizado',
      error: en ? 'Could not change status' : 'No se pudo cambiar el estado',
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
        toast.error({ title: en ? 'Could not hire candidate' : 'No se pudo contratar' });
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
          ? (en ? 'Employee created, but the candidate could not be updated.' : 'Empleado creado, pero no se pudo actualizar el candidato.')
          : (en ? 'Could not link candidate.' : 'No se pudo vincular al candidato.'));
      toast.warning({ title: input.mode === 'create' ? (en ? 'Hiring incomplete' : 'Contratación incompleta') : (en ? 'Linking failed' : 'Vinculación fallida') });
      return { ok: false, message };
    }

    // Cierra automáticamente la vacante abierta que coincida con el puesto.
    await coverVacancyForEmployee(input.employee, {
      source: `candidato:${input.candidateId}`,
    });

    toast.success({
      title: input.mode === 'create' ? (en ? 'Candidate hired' : 'Candidato contratado') : (en ? 'Candidate linked' : 'Candidato vinculado'),
    });
    return { ok: true };
  }

  async function handleCopyReport() {
    const report = buildCandidateReport(candidates, members);
    if (!report) {
      toast.info({ title: en ? 'No active candidates in process' : 'No hay candidatos activos en proceso' });
      return;
    }
    try {
      await copyTextToClipboard(report);
      toast.success({ title: en ? 'Summary copied' : 'Resumen copiado', description: en ? 'You can now paste it into WhatsApp.' : 'Ya puedes pegarlo en WhatsApp.' });
    } catch {
      toast.error({ title: en ? 'Could not copy summary' : 'No se pudo copiar el resumen' });
    }
  }

  return (
    <BoneyardSkeleton
      name="candidatos-page"
      loading={loading}
      loadingLabel={en ? 'Loading candidates…' : 'Cargando candidatos…'}
    >
      <MotionConfig reducedMotion="user">
        <main className="pipeline container">
      <div className={`pipeline-main-container ${selectedMobileCandidate ? 'mobile-hidden' : ''}`}>
        {/* ── Hero ── */}
      <header className="page-header">
        <div className="page-header__content">
          <h1 className="app-page-title">{en ? 'Candidates' : 'Candidatos'}</h1>
        </div>
      </header>

      <Toolbar label={en ? 'Candidate tools' : 'Herramientas de candidatos'} className="pipeline__toolbar">
          <ToolbarGroup label={en ? 'Search candidates' : 'Buscar candidatos'} className="pipeline__controls">
            <div className="pipeline__search-container">
              <div className="pipeline__search">
                <SearchField
                  id="pipeline-search-input"
                  ref={searchInputRef}
                  className="pipeline__search-field"
                  label={en ? 'Search candidate' : 'Buscar candidato'}
                  placeholder={en ? 'Search by name, position, phone... (Ctrl+K)' : 'Buscar por nombre, puesto, teléfono... (Ctrl+K)'}
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
                    aria-label={en ? 'Search results' : 'Resultados de búsqueda'}
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
                              {c.telefono} • {c.reclutador} • {candidateStatusLabel(c.status, language)}
                            </span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="search-dropdown-item__empty" role="status">
                        <UserX size={16} aria-hidden="true" />
                        <span>{en ? 'No matches' : 'No hay coincidencias'}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </ToolbarGroup>
          <ToolbarGroup label={en ? 'Candidate actions' : 'Acciones de candidatos'} className="pipeline__hero-actions">
            <CandidateFilters value={macroStatus} onChange={setMacroStatus} />
            <button
              type="button"
              className="btn-secondary pipeline__report-btn"
              onClick={() => setMetricsModalOpen(true)}
              aria-label={en ? 'Open metrics and KPIs' : 'Abrir métricas y KPIs'}
              title={en ? 'Metrics and KPIs' : 'Métricas y KPIs'}
            >
              <BarChart3 size={16} aria-hidden="true" />
              <span>{en ? 'Metrics' : 'Métricas'}</span>
            </button>
            <button
              type="button"
              className="btn-secondary pipeline__report-btn"
              onClick={handleCopyReport}
              aria-label={en ? 'Copy candidate summary' : 'Copiar resumen de candidatos'}
              title={en ? 'Copy candidate summary for WhatsApp' : 'Copiar resumen de candidatos para WhatsApp'}
            >
              <ClipboardList size={16} aria-hidden="true" />
              <span>{en ? 'Summary' : 'Resumen'}</span>
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={openAdd}
              aria-label={en ? 'New candidate' : 'Nuevo candidato'}
              title={en ? 'New candidate' : 'Nuevo candidato'}
            >
              <UserRoundPlus size={16} aria-hidden="true" />
              <span>{en ? 'New' : 'Nuevo'}</span>
            </button>
          </ToolbarGroup>
      </Toolbar>

      <div className="pipeline__layout">
        <div className="pipeline__content">

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
                <h2 className="animated-empty-state__title" id="pipeline-error-title">{en ? 'Could not load candidates' : 'Error al cargar'}</h2>
                <p className="pipeline__error-message">
                  {error}
                </p>
                <button type="button" className="btn-secondary pipeline__empty-action" onClick={() => refetch()}>
                  {en ? 'Retry' : 'Reintentar'}
                </button>
              </div>
            </section>
          ) : filtered.length === 0 ? (
            <section className="pipeline__empty">
              {candidates.length === 0 ? (
                <>
                  <h2>{en ? 'No candidates yet' : 'Aún no hay candidatos'}</h2>
                  <p>
                    {en ? 'Start by adding your first candidate to the recruitment database.' : 'Empieza agregando tu primer candidato a la base de datos de reclutamiento.'}
                  </p>
                  <Tooltip content={en ? 'Add candidate' : 'Agregar candidato'}>
                    <button type="button" className="btn-primary" onClick={openAdd} aria-label={en ? 'Add first candidate' : 'Agregar primer candidato'}>
                      <UserRoundPlus size={16} aria-hidden="true" />
                    </button>
                  </Tooltip>
                </>
              ) : (
                <div className="animated-empty-state pipeline__empty-state">
                  <div className="animated-empty-state__icon">
                    <UserX aria-hidden="true" />
                  </div>
                  <div className="animated-empty-state__title">{en ? 'No results' : 'Sin resultados'}</div>
                  {(macroStatus !== 'todos' || searchTerm.trim().length > 0) && (
                    <button
                      type="button"
                      className="btn-secondary pipeline__empty-action"
                      onClick={resetFilters}
                      title={en ? 'Clear filters' : 'Limpiar filtros'}
                    >
                      <SlidersHorizontal size={16} aria-hidden="true" />
                      {en ? 'Clear filters' : 'Limpiar filtros'}
                    </button>
                  )}
                </div>
              )}
            </section>
          ) : (
            <>
            <section
              className="pipeline__card-list"
              aria-label={en ? 'Candidate list' : 'Lista de candidatos'}
              role={isDesktop ? "table" : undefined}
            >
              <div className="pipeline__card-list-header" role="row">
                <span role="columnheader">{en ? 'Candidate' : 'Candidato'}</span>
                <span role="columnheader">{en ? 'Position' : 'Puesto'}</span>
                <span role="columnheader">{en ? 'Process' : 'Proceso'}</span>
                <span role="columnheader">{en ? 'Recruiter' : 'Reclutador'}</span>
                <span role="columnheader">{en ? 'Interview' : 'Entrevista'}</span>
                <span role="columnheader" className="text-center">{en ? 'Actions' : 'Acciones'}</span>
              </div>
              {paginatedCandidates.map((c) => {
                const fechaCitaFmt = c.fecha_cita ? formatDate(c.fecha_cita) : null;
                const getRelativeDateInfo = (isoString: string | null) => {
                  if (!isoString) return null;
                  // Para fechas puras YYYY-MM-DD, parseISO las trata como UTC midnight
                  // lo que en UTC-6 las retrocede al día anterior a partir de las 18:00.
                  // Se ancla al mediodía MX (mismo patrón que dates.ts) para que
                  // isToday/isTomorrow/isYesterday comparen el día calendario correcto.
                  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(isoString)
                    ? isoString
                    : isoString.slice(0, 10);
                  const date = new Date(`${dateOnly}T12:00:00-06:00`);
                  if (isNaN(date.getTime())) return null;

                  let relative = '';
                  if (isToday(date)) relative = en ? 'Today' : 'Hoy';
                  else if (isTomorrow(date)) relative = en ? 'Tomorrow' : 'Mañana';
                  else if (isYesterday(date)) relative = en ? 'Yesterday' : 'Ayer';
                  else {
                    relative = formatDistanceToNowStrict(date, { addSuffix: true, locale: en ? enUS : es });
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
                    aria-label={isDesktop ? undefined : `${en ? 'View details for' : 'Ver detalles de'} ${c.nombre}`}
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
                      <div
                        className={`pipeline__ccard-mobile-info${c.reclutador || fechaCitaFmt ? ' pipeline__ccard-mobile-info--has-meta' : ''}`}
                        aria-hidden="true"
                      >
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
                          label: candidateStatusLabel(s, language),
                        }))}
                        aria-label={`${en ? 'Change status for' : 'Cambiar estado de'} ${c.nombre}`}
                        customTrigger={
                          <span className="pipeline__status-trigger">
                            <CandidateStatusBadge status={c.status} showCaret />
                          </span>
                        }
                      />
                    </div>
                    <div
                      className="pipeline__ccard-recruiter-col pipeline__cell-recruiter"
                      role={isDesktop ? "cell" : undefined}
                    >
                      {c.reclutador ? (
                        <ReclutadorBadge nombre={c.reclutador} size="sm" />
                      ) : (
                        <span className="pipeline__muted">—</span>
                      )}
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
                    {isDesktop && (
                      <div
                        className="pipeline__cell-actions pipeline__ccard-actions-col"
                        role="cell"
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
                    )}
                  </article>
                );
              })}
            </section>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              canGoPrev={currentPage > 1}
              canGoNext={currentPage < totalPages}
              ariaLabel={en ? 'Candidate pages' : 'Paginación de candidatos'}
            />
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
                success: en ? 'Candidate deleted' : 'Candidato eliminado',
                error: en ? 'Could not delete candidate' : 'No se pudo eliminar el candidato',
              })
            }
          />

          <Modal
            isOpen={accessCardData !== null}
            onClose={() => setAccessCardTarget(null)}
            className="candidate-access-card-modal"
            size="sm"
            title={en ? 'Interview pass' : 'Pase de entrevista'}
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

        </div>
      </div>
      </div>

      {/* ── Drill-down Detail View (Mobile) ── */}
      {selectedMobileCandidate && (
        <div className="pipeline-mobile-detail-container">
          <BackButton
            className="config-mobile-back"
            onClick={() => setSelectedMobileCandidate(null)}
            aria-label={en ? 'Back to Candidates' : 'Volver a Candidatos'}
          />

          <article className="pipeline-mobile-detail__card">
            <div className="pipeline-mobile-detail__header">
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
                  <div className="pipeline-mobile-detail__puesto-name">{selectedMobileCandidate.puesto}</div>
                  {selectedMobileCandidate.seccion?.trim() &&
                    <div className="pipeline-mobile-detail__puesto-section">{selectedMobileCandidate.seccion.trim()}</div>}
                </div>
              </div>
            </div>

            <div className="pipeline-mobile-detail__info-grid">
              <div className="pipeline-mobile-detail__info-item">
                <UserRound size={16} aria-hidden="true" className="pipeline-mobile-detail__info-icon" />
                <div className="pipeline-mobile-detail__info-content">
                  <span className="pipeline-mobile-detail__info-label">{en ? 'Recruiter' : 'Reclutador'}</span>
                  <span className="pipeline-mobile-detail__info-value">{selectedMobileCandidate.reclutador || '—'}</span>
                </div>
              </div>

              <div className="pipeline-mobile-detail__info-item">
                <CalendarDays size={16} aria-hidden="true" className="pipeline-mobile-detail__info-icon" />
                <div className="pipeline-mobile-detail__info-content">
                  <span className="pipeline-mobile-detail__info-label">{en ? 'Interview' : 'Entrevista'}</span>
                  <span className="pipeline-mobile-detail__info-value">
                    {selectedMobileCandidate.fecha_cita ? formatDate(selectedMobileCandidate.fecha_cita) : '—'}
                  </span>
                </div>
              </div>

              <div className="pipeline-mobile-detail__info-item">
                <LayoutGrid size={16} aria-hidden="true" className="pipeline-mobile-detail__info-icon" />
                <div className="pipeline-mobile-detail__info-content">
                  <span className="pipeline-mobile-detail__info-label">{en ? 'Project' : 'Proyecto'}</span>
                  <span className="pipeline-mobile-detail__info-value pipeline-mobile-detail__info-value--inline">
                    {selectedMobileCandidate.is_starlite ? <StarliteBadge /> : <VinoplasticBadge />}
                  </span>
                </div>
              </div>

              <div className="pipeline-mobile-detail__info-item">
                <ClipboardList size={16} aria-hidden="true" className="pipeline-mobile-detail__info-icon" />
                <div className="pipeline-mobile-detail__info-content">
                  <span className="pipeline-mobile-detail__info-label">{en ? 'Process' : 'Proceso'}</span>
                  <div className="pipeline-mobile-detail__status-select">
                    <div className="pipeline__cell-status pipeline-mobile-detail__status-cell" data-status={selectedMobileCandidate.status}>
                      <CustomSelect
                        id={`mobile-status-${selectedMobileCandidate.id}`}
                        value={selectedMobileCandidate.status}
                        placeholder=""
                        onChange={(val) => handleStatusChange(selectedMobileCandidate, val as CandidateStatus)}
                        options={CANDIDATE_STATUSES.map((s) => ({
                          value: s,
                          label: candidateStatusLabel(s, language),
                        }))}
                        aria-label={`${en ? 'Change status for' : 'Cambiar estado de'} ${selectedMobileCandidate.nombre}`}
                        customTrigger={
                          <span className="pipeline__status-trigger pipeline__status-trigger--full">
                            <CandidateStatusBadge
                              status={selectedMobileCandidate.status}
                              showCaret
                              compact
                              className="pipeline-mobile-detail__status-badge"
                            />
                          </span>
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pipeline-mobile-detail__actions">
              <div className="pipeline-mobile-detail__row-actions">
                <span className="pipeline-mobile-detail__info-label pipeline-mobile-detail__actions-label">{en ? 'Actions' : 'Acciones'}</span>
                <div className="pipeline-mobile-detail__action-buttons">
                    {selectedMobileCandidate.reclutador && selectedMobileCandidate.puesto && (
                      <button
                        type="button"
                        className="btn-secondary pipeline-mobile-detail__action-btn"
                        title={en ? 'View pass' : 'Ver pase'}
                        onClick={() => setAccessCardTarget(selectedMobileCandidate)}
                      >
                        <FileImage size={16} aria-hidden="true" />
                        <span>{en ? 'View pass' : 'Ver pase'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-secondary pipeline-mobile-detail__action-btn"
                      title={en ? 'Edit candidate' : 'Editar candidato'}
                      onClick={() => openEdit(selectedMobileCandidate)}
                    >
                      <PenLine size={16} aria-hidden="true" />
                      <span>{en ? 'Edit' : 'Editar'}</span>
                    </button>
                    {selectedMobileCandidate.status === 'contratado' && !selectedMobileCandidate.employee_num && (
                      <button
                        type="button"
                        className="btn-primary pipeline-mobile-detail__action-btn"
                        title={en ? 'Hire' : 'Contratar'}
                        onClick={() => openHire(selectedMobileCandidate)}
                      >
                        <BadgeCheck size={16} aria-hidden="true" />
                        <span>{en ? 'Hire' : 'Contratar'}</span>
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        className="btn-secondary pipeline-mobile-detail__action-btn pipeline-mobile-detail__action-btn--danger"
                        title={en ? 'Delete candidate' : 'Eliminar candidato'}
                        onClick={() => {
                          openDelete(selectedMobileCandidate);
                          setSelectedMobileCandidate(null);
                        }}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                        <span>{en ? 'Delete' : 'Eliminar'}</span>
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
        title={en ? 'Preview' : 'Vista Previa'}
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
                <span>{en ? 'Hire' : 'Contratar'}</span>
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
              {en ? 'Edit full profile' : 'Editar Perfil Completo'}
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
        individualStats={individualStats}
        recruiterName={members.find(member => member.id === metricRecruiterId)?.short_name ?? ''}
      />
      {/* ── Modal de Menú de Métricas ── */}
      <Modal
        isOpen={metricsModalOpen}
        onClose={() => setMetricsModalOpen(false)}
        title={en ? 'Metrics and KPIs' : 'Métricas y KPIs'}
        size="lg"
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
              <span className="pipeline__kpi-card__label">{en ? 'Overall summary' : 'Resumen General'}</span>
              <span className="pipeline__kpi-card__hint">
                {candidates.filter(c => CITADO_STATUSES.has(c.status)).length} {en ? 'scheduled' : 'citados'}
              </span>
            </div>
            <ArrowUpRight size={18} className="pipeline__kpi-card__arrow" aria-hidden="true" />
          </button>

          <div className="pipeline__sidebar-divider" />

          <section className="pipeline__sidebar-section">
            <h3 className="pipeline__sidebar-section__label">{en ? 'Weekly tracking' : 'Seguimiento semanal'}</h3>
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
                <span className="pipeline__kpi-row__name">{en ? 'Campaign' : 'Pauta'}</span>
              </div>
              <div className="pipeline__kpi-row__stats">
                <ArrowUpRight size={16} className="pipeline__kpi-card__arrow" aria-hidden="true" />
              </div>
            </button>
          </section>

          <section className="pipeline__sidebar-section">
            <h3 className="pipeline__sidebar-section__label">{en ? 'By recruiter' : 'Por reclutador'}</h3>
            <div className="pipeline__recruiters">
              {members.filter(member => member.include_in_metrics).map(member => <button
                key={member.id}
                type="button"
                className="pipeline__kpi-row"
                onClick={() => {
                  setMetricsModalOpen(false);
                  setMetricRecruiterId(member.id);
                  setKpiModalOpen('recruiter');
                }}
              >
                <div className="pipeline__kpi-row__meta">
                  <span className="pipeline__kpi-row__name">{member.short_name}{!member.active && (en ? ' (inactive)' : ' (inactivo)')}</span>
                </div>
                <div className="pipeline__kpi-row__stats">
                  <ArrowUpRight size={16} className="pipeline__kpi-card__arrow" aria-hidden="true" />
                </div>
              </button>)}
            </div>
          </section>
        </div>
      </Modal>

        </main>
      </MotionConfig>
    </BoneyardSkeleton>
  );
}
