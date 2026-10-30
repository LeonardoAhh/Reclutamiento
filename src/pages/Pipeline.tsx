import { useEffect, useMemo, useState, useRef } from 'react';
import { PageHeading } from '@/components/layout/PageHeading';
import { isBoneyardBuild } from '@/lib/boneyard';
import { BONEYARD_SAMPLE_CANDIDATES } from '@/lib/boneyardFixtures';
import { MotionConfig } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

import { BarChart3, ClipboardList, EllipsisVertical, SlidersHorizontal, UserRoundPlus, UserX } from 'lucide-react';
import { ClipboardCheck, ClipboardList as MorphClipboardList } from 'lucide';
import { CandidateModal } from '@/components/ui/CandidateModal';
import { CandidatePreview } from '@/components/ui/CandidatePreview';
import { CandidateStatusBadge } from '@/components/ui/CandidateStatusBadge';
import { MorphingIcon } from '@/components/ui/MorphingIcon';
import { ActionStateContent } from '@/components/ui/ActionStateContent';
import { CandidateAccessCard } from '@/components/ui/CandidateAccessCard';
import { Tooltip } from '@/components/ui/Tooltip';
import { notifyResult, toast } from '@/lib/notify';
import { buildCandidateReport } from '@/lib/candidateReport';
import { copyTextToClipboard } from '@/lib/whatsappReport';
import { TOAST_CONFIG } from '@/lib/constants';
import { bindSoundInteractions, playSound } from '@/lib/sound';
import { HireCandidateModal } from '@/components/ui/HireCandidateModal';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CANDIDATE_METRICS_PATH } from './candidate-metrics/navigation';
import { BoneyardSkeleton } from '@/components/ui/BoneyardSkeleton';
import { Modal } from '@/components/ui/Modal';
import { FormSheet } from '@/components/ui/FormSheet';
import { useIsMobile } from '@/hooks/useIsMobile';
import { SearchField } from '@/components/ui/SearchField';
import { Toolbar, ToolbarGroup } from '@/components/ui/Toolbar';
import { Pagination } from '@/components/ui/Pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import type { CandidateGroup } from '@/components/pipeline/CandidateFilters';
import { CandidateGroupTabs } from '@/components/pipeline/CandidateGroupTabs';
import { PipelineTable } from '@/components/pipeline/PipelineTable';
import { useAuth } from '@/hooks/useAuth';
import { useCandidates } from '@/hooks/useCandidates';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useVacancyRequests } from '@/hooks/useVacancyRequests';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { Candidate, CandidateStatus, Employee } from '@/lib/types';
import { formatReadableDate } from '@/lib/dates';
import { useTeamDirectory } from '@/features/team/TeamProvider';
import { accessCardRecruiterName } from '@/features/team/types';
import { DESKTOP_MEDIA_QUERY } from '@/lib/layout';
import { getSidebarCreateAction } from '@/lib/sidebarActionNavigation';
import './Pipeline.css';

type ModalMode = 'add' | 'edit' | 'delete' | null;

function matchesCandidateGroup(candidate: Candidate, group: CandidateGroup) {
  if (group === 'activos') return !['contratado', 'baja', 'rechazado', 'no_asistio'].includes(candidate.status);
  if (group === 'contratados') return candidate.status === 'contratado';
  return true;
}

export function Pipeline() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const InterviewPassDialog = isMobile ? Modal : FormSheet;
  const { language } = useLanguage();
  const en = language === 'en';
  const {
    candidates: liveCandidates,
    loading,
    error,
    addCandidate,
    updateCandidate,
    setCandidateStatus,
    markCandidateHired,
    deleteCandidate,
    refetch,
  } = useCandidates();
  // Solo en la captura de Boneyard (sin sesión): muestra representativa para
  // que el snapshot dibuje la lista real y no el estado vacío.
  const usingBoneyardSample = isBoneyardBuild() && liveCandidates.length === 0;
  const candidates = useMemo(
    () => (usingBoneyardSample ? [...BONEYARD_SAMPLE_CANDIDATES] : liveCandidates),
    [usingBoneyardSample, liveCandidates],
  );

  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const { addSingleEmployee } = useSupabaseData();
  const { coverVacancyForEmployee } = useVacancyRequests({ loadHistory: false });

  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [reportCopied, setReportCopied] = useState(false);
  const reportCopiedTimer = useRef<number | null>(null);
  const [macroStatus, setMacroStatus] = useState<CandidateGroup>(() => {
    try {
      const stored = localStorage.getItem('reclutamiento_macro_status');
      if (stored === 'todos' || stored === 'activos' || stored === 'contratados') {
        return stored;
      }
    } catch {}
    return 'activos';
  });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [quickProfile, setQuickProfile] = useState<Candidate | null>(null);
  const [accessCardTarget, setAccessCardTarget] = useState<Candidate | null>(null);
  const [hireTarget, setHireTarget] = useState<Candidate | null>(null);
  const { members } = useTeamDirectory();
  const previewCandidate = quickProfile?.id
    ? candidates.find((candidate) => candidate.id === quickProfile.id) ?? quickProfile
    : quickProfile;
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);

  useEffect(() => bindSoundInteractions(document), []);

  useEffect(() => {
    if (getSidebarCreateAction(location.state) !== 'create-candidate') return;
    setSelected(null);
    setModalMode('add');
    navigate(
      { pathname: location.pathname, search: location.search, hash: location.hash },
      { replace: true, state: null },
    );
  }, [location.pathname, location.search, location.hash, location.state, navigate]);


  useEffect(() => () => {
    if (reportCopiedTimer.current !== null) window.clearTimeout(reportCopiedTimer.current);
  }, []);

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


  function resetFilters() {
    playSound('select');
    setMacroStatus('todos');
    setSearchTerm('');
  }


  const filtered = useMemo(() => candidates.filter((c) => matchesCandidateGroup(c, macroStatus)), [candidates, macroStatus]);
  const groupCounts = useMemo(() => ({
    todos: candidates.length,
    activos: candidates.filter((c) => matchesCandidateGroup(c, 'activos')).length,
    contratados: candidates.filter((c) => matchesCandidateGroup(c, 'contratados')).length,
  }), [candidates]);

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
  const visiblePage = Math.min(currentPage, totalPages);
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);
  const paginatedCandidates = filtered.slice(
    (visiblePage - 1) * ITEMS_PER_PAGE,
    visiblePage * ITEMS_PER_PAGE
  );
  const pageGroups = new Map<CandidateStatus, Candidate[]>();
  for (const candidate of paginatedCandidates) {
    const group = pageGroups.get(candidate.status) ?? [];
    group.push(candidate);
    pageGroups.set(candidate.status, group);
  }
  const groupedPageCandidates = isDesktop
    ? Array.from(pageGroups.values(), (group) =>
        group.map((candidate, index) => ({ candidate, startsGroup: index === 0, groupCount: group.length })),
      ).flat()
    : paginatedCandidates.map((candidate) => ({ candidate, startsGroup: false, groupCount: 0 }));


  function openAdd() {
    playSound('open');
    setSelected(null);
    setModalMode('add');
  }

  function openEdit(c: Candidate) {
    playSound('open');
    setSelected(c);
    setModalMode('edit');
  }

  function openDelete(c: Candidate) {
    playSound('open');
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
    const result = await notifyResult(
      id ? updateCandidate(id, payload) : addCandidate(payload),
      {
        success: id ? (en ? 'Candidate updated' : 'Candidato actualizado') : (en ? 'Candidate added' : 'Candidato agregado'),
        error: id ? (en ? 'Could not update candidate' : 'No se pudo actualizar el candidato') : (en ? 'Could not add candidate' : 'No se pudo agregar el candidato'),
      }
    );
    playSound(result.ok ? 'success' : 'error');
    return result;
  }

  async function handleStatusChange(c: Candidate, status: CandidateStatus) {
    if (!c.id || c.status === status) return;
    const result = await notifyResult(setCandidateStatus(c.id, status), {
      success: en ? 'Status updated' : 'Estado actualizado',
      error: en ? 'Could not change status' : 'No se pudo cambiar el estado',
    });
    playSound(result.ok ? 'success' : 'error');
  }

  function openHire(c: Candidate) {
    playSound('open');
    setHireTarget(c);
  }

  function openAccessCard(c: Candidate) {
    playSound('open');
    setAccessCardTarget(c);
  }

  function openPreview(c: Candidate) {
    playSound('open');
    setQuickProfile(c);
  }

  async function handleHire(input: {
    mode: 'create' | 'associate';
    employee: Employee;
    candidateId: string;
  }): Promise<{ ok: boolean; message?: string }> {
    if (input.mode === 'create') {
      const empResult = await addSingleEmployee(input.employee);
      if (!empResult.ok) {
        playSound('error');
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
      playSound('warning');
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
    playSound('success');
    return { ok: true };
  }

  async function handleCopyReport() {
    if (!isAdmin) return;
    if (reportCopiedTimer.current !== null) window.clearTimeout(reportCopiedTimer.current);
    setReportCopied(false);
    const report = buildCandidateReport(candidates, members, language);
    if (!report) {
      playSound('warning');
      toast.info({ title: en ? 'No active candidates in process' : 'No hay candidatos activos en proceso' });
      return;
    }
    try {
      await copyTextToClipboard(report);
      playSound('success');
      setReportCopied(true);
      reportCopiedTimer.current = window.setTimeout(() => setReportCopied(false), TOAST_CONFIG.defaultDurationMs);
      toast.success({ title: en ? 'Summary copied' : 'Resumen copiado', description: en ? 'You can now paste it into WhatsApp.' : 'Ya puedes pegarlo en WhatsApp.' });
    } catch {
      playSound('error');
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
        {/* ── Hero ── */}
      <PageHeading className="app-page-title">{en ? 'Candidates' : 'Candidatos'}</PageHeading>

      <Toolbar label={en ? 'Candidate tools' : 'Herramientas de candidatos'} className="pipeline__toolbar">
          <CandidateGroupTabs value={macroStatus} language={language} counts={groupCounts} onChange={(value) => {
            if (value !== macroStatus) playSound('select');
            setMacroStatus(value);
          }} />
          <ToolbarGroup label={en ? 'Search candidates' : 'Buscar candidatos'} className="pipeline__controls">
            <div className="pipeline__search-container">
              <div className="pipeline__search">
                <SearchField
                  id="pipeline-search-input"
                  ref={searchInputRef}
                  className="pipeline__search-field"
                  label={en ? 'Search candidate' : 'Buscar candidato'}
                  data-cuelume-type=""
                  placeholder={en ? 'Search' : 'Buscar'}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  onClear={() => {
                    playSound('tap');
                    setSearchTerm('');
                  }}
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
                            playSound('open');
                            setSearchTerm('');
                            setQuickProfile(c);
                          }}
                        >
                          <div className="search-dropdown-item__avatar" aria-hidden="true">
                            {(c.nombre ?? '?').charAt(0)}
                          </div>
                          <div className="search-dropdown-item__text">
                            <strong>{c.nombre}</strong>
                            <CandidateStatusBadge status={c.status} icon compact />
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
            {isAdmin && <Link
              className="btn-secondary pipeline__report-btn pipeline__action--desktop"
              to={CANDIDATE_METRICS_PATH}
              data-cuelume-navigate=""
              aria-label={en ? 'Open metrics and KPIs' : 'Abrir métricas y KPIs'}
              title={en ? 'Metrics and KPIs' : 'Métricas y KPIs'}
            >
              <BarChart3 size={16} aria-hidden="true" />
              <span>{en ? 'Metrics' : 'Métricas'}</span>
            </Link>}
            {isAdmin && <button
              type="button"
              className="btn-secondary pipeline__report-btn pipeline__action--desktop"
              onClick={handleCopyReport}
              aria-label={en ? 'Copy candidate summary for WhatsApp' : 'Copiar resumen de candidatos para WhatsApp'}
              title={en ? 'Copy candidate summary for WhatsApp' : 'Copiar resumen de candidatos para WhatsApp'}
            >
              <ActionStateContent active={reportCopied}>
                <MorphingIcon icon={reportCopied ? ClipboardCheck : MorphClipboardList} size="var(--icon-size-sm)" reducedMotion="user" aria-hidden="true" />
                <span className="pipeline__report-label" aria-hidden="true">{en ? 'Summary' : 'Resumen'}</span>
              </ActionStateContent>
            </button>}
            <button
              type="button"
              className="btn-primary pipeline__new-btn"
              onClick={openAdd}
              aria-label={en ? 'New candidate' : 'Nuevo candidato'}
              title={en ? 'New candidate' : 'Nuevo candidato'}
            >
              <UserRoundPlus size={16} aria-hidden="true" />
              <span>{en ? 'New' : 'Nuevo'}</span>
            </button>
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="pipeline__overflow-btn"
                    aria-label={en ? 'More candidate actions' : 'Más acciones de candidatos'}
                    title={en ? 'More actions' : 'Más acciones'}
                  >
                    <EllipsisVertical size={16} aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link
                      to={CANDIDATE_METRICS_PATH}
                      data-cuelume-navigate=""
                    >
                      <BarChart3 size={16} aria-hidden="true" />
                      <span>{en ? 'Metrics and KPIs' : 'Métricas y KPIs'}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    data-cuelume-select=""
                    onSelect={() => {
                      void handleCopyReport();
                    }}
                  >
                    <ClipboardList size={16} aria-hidden="true" />
                    <span>{en ? 'Copy summary for WhatsApp' : 'Copiar resumen para WhatsApp'}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </ToolbarGroup>
      </Toolbar>

      <div className="pipeline__layout">
        <div className="pipeline__content">

          {/* ── Vista (tabla o kanban) ── */}
          {error && !usingBoneyardSample ? (
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
                <button type="button" className="btn-secondary pipeline__empty-action" data-cuelume-tap="" onClick={() => refetch()}>
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
            <div className="pipeline__results">
              <PipelineTable
                rows={groupedPageCandidates}
                isDesktop={isDesktop}
                language={language}
                onOpenCandidate={openPreview}
              />
              <Pagination
                currentPage={visiblePage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  playSound('navigate');
                  setCurrentPage(page);
                }}
                canGoPrev={visiblePage > 1}
                canGoNext={visiblePage < totalPages}
                ariaLabel={en ? 'Candidate pages' : 'Paginación de candidatos'}
              />
            </div>
          )}

          {/* ── Modales ── */}
          <CandidateModal
            isOpen={modalMode !== null}
            mode={modalMode ?? 'add'}
            candidate={selected}
            candidates={candidates}
            onClose={closeModal}
            onSave={handleSave}
            onDelete={async (id) => {
              const result = await notifyResult(deleteCandidate(id), {
                success: en ? 'Candidate deleted' : 'Candidato eliminado',
                error: en ? 'Could not delete candidate' : 'No se pudo eliminar el candidato',
              });
              playSound(result.ok ? 'success' : 'error');
              return result;
            }}
          />

          <InterviewPassDialog
            isOpen={accessCardData !== null}
            onClose={() => {
              playSound('close');
              setAccessCardTarget(null);
            }}
            className="candidate-access-card-modal"
            size="sm"
            title={en ? 'Interview pass' : 'Pase de entrevista'}
          >
            {accessCardData && (
              <CandidateAccessCard
                data={accessCardData}
              />
            )}
          </InterviewPassDialog>



          <HireCandidateModal
            isOpen={hireTarget !== null}
            candidate={hireTarget}
            onClose={() => setHireTarget(null)}
            onConfirm={handleHire}
          />

        </div>
      </div>


      <CandidatePreview
        candidate={previewCandidate}
        isMobile={isMobile}
        canDelete={isAdmin}
        onClose={() => {
          playSound('close');
          setQuickProfile(null);
        }}
        onEdit={(candidate) => {
          setQuickProfile(null);
          openEdit(candidate);
        }}
        onDelete={(candidate) => {
          setQuickProfile(null);
          openDelete(candidate);
        }}
        onViewPass={(candidate) => {
          setQuickProfile(null);
          openAccessCard(candidate);
        }}
        onHire={(candidate) => {
          setQuickProfile(null);
          openHire(candidate);
        }}
        onStatusChange={(candidate, status) => {
          void handleStatusChange(candidate, status);
        }}
      />

        </main>
      </MotionConfig>
    </BoneyardSkeleton>
  );
}
