import { useEffect, useMemo, useState, useRef } from 'react';
import { PageHeading } from '@/components/layout/PageHeading';
import { isBoneyardBuild } from '@/lib/boneyard';
import { BONEYARD_SAMPLE_CANDIDATES } from '@/lib/boneyardFixtures';
import { MotionConfig } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

import { notifyResult } from '@/lib/notify';
import { bindSoundInteractions, playSound } from '@/lib/sound';
import { useLocation, useNavigate } from 'react-router-dom';
import { BoneyardSkeleton } from '@/components/ui/BoneyardSkeleton';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { CandidateGroup } from '@/components/pipeline/CandidateFilters';
import { PipelineDialogs } from '@/components/pipeline/PipelineDialogs';
import { PipelineResults } from '@/components/pipeline/PipelineResults';
import { PipelineToolbar } from '@/components/pipeline/PipelineToolbar';
import { findCandidateSearchResults, matchesCandidateGroup } from '@/components/pipeline/candidatePipelineUtils';
import { useAuth } from '@/hooks/useAuth';
import { useCandidates } from '@/hooks/useCandidates';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useVacancyRequests } from '@/hooks/useVacancyRequests';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { Candidate, CandidateStatus } from '@/lib/types';
import { formatReadableDate } from '@/lib/dates';
import { useTeamDirectory } from '@/features/team/TeamProvider';
import { accessCardRecruiterName } from '@/features/team/types';
import { DESKTOP_MEDIA_QUERY } from '@/lib/layout';
import { getSidebarCreateAction } from '@/lib/sidebarActionNavigation';
import { useCandidatePipelineActions } from '@/components/pipeline/useCandidatePipelineActions';
import './Pipeline.css';

type ModalMode = 'add' | 'edit' | 'delete' | null;

export function Pipeline() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
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
    } catch (error) {
      console.warn('Could not read the candidate status filter from localStorage:', error);
    }
    return 'activos';
  });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [quickProfile, setQuickProfile] = useState<Candidate | null>(null);
  const [accessCardTarget, setAccessCardTarget] = useState<Candidate | null>(null);
  const [hireTarget, setHireTarget] = useState<Candidate | null>(null);
  const { members } = useTeamDirectory();
  const { handleCopyReport, handleHire } = useCandidatePipelineActions({
    addSingleEmployee,
    candidates,
    coverVacancyForEmployee,
    isAdmin,
    language,
    markCandidateHired,
    members,
    reportCopiedTimer,
    setReportCopied,
  });
  const previewCandidate = quickProfile?.id
    ? (candidates.find((candidate) => candidate.id === quickProfile.id) ?? quickProfile)
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

  useEffect(
    () => () => {
      if (reportCopiedTimer.current !== null) window.clearTimeout(reportCopiedTimer.current);
    },
    [],
  );

  // Guardar macroStatus en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('reclutamiento_macro_status', macroStatus);
    } catch (error) {
      console.warn('Could not save the candidate status filter to localStorage:', error);
    }
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
      interviewDate: accessCardTarget.fecha_cita ? formatReadableDate(accessCardTarget.fecha_cita) : null,
    };
  }, [accessCardTarget, members]);

  function resetFilters() {
    playSound('select');
    setMacroStatus('todos');
    setSearchTerm('');
  }

  const filtered = useMemo(
    () => candidates.filter((c) => matchesCandidateGroup(c, macroStatus)),
    [candidates, macroStatus],
  );
  const groupCounts = useMemo(
    () => ({
      todos: candidates.length,
      activos: candidates.filter((c) => matchesCandidateGroup(c, 'activos')).length,
      contratados: candidates.filter((c) => matchesCandidateGroup(c, 'contratados')).length,
    }),
    [candidates],
  );

  const searchResults = useMemo(() => findCandidateSearchResults(candidates, searchTerm), [candidates, searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [macroStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const visiblePage = Math.min(currentPage, totalPages);
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);
  const paginatedCandidates = filtered.slice((visiblePage - 1) * ITEMS_PER_PAGE, visiblePage * ITEMS_PER_PAGE);
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

  async function handleSave(payload: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>, id?: string) {
    const result = await notifyResult(id ? updateCandidate(id, payload) : addCandidate(payload), {
      success: id
        ? en
          ? 'Candidate updated'
          : 'Candidato actualizado'
        : en
          ? 'Candidate added'
          : 'Candidato agregado',
      error: id
        ? en
          ? 'Could not update candidate'
          : 'No se pudo actualizar el candidato'
        : en
          ? 'Could not add candidate'
          : 'No se pudo agregar el candidato',
    });
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

          <PipelineToolbar
            counts={groupCounts}
            isAdmin={isAdmin}
            isMobile={isMobile}
            language={language}
            onAdd={openAdd}
            onChangeGroup={(value) => {
              if (value !== macroStatus) playSound('select');
              setMacroStatus(value);
            }}
            onChangeSearch={setSearchTerm}
            onClearSearch={() => {
              playSound('tap');
              setSearchTerm('');
            }}
            onCopyReport={handleCopyReport}
            onSelectCandidate={(candidate) => {
              playSound('open');
              setSearchTerm('');
              setQuickProfile(candidate);
            }}
            reportCopied={reportCopied}
            searchInputRef={searchInputRef}
            searchResults={searchResults}
            searchTerm={searchTerm}
            value={macroStatus}
          />

          <div className="pipeline__layout">
            <div className="pipeline__content">
              <PipelineResults
                candidateCount={candidates.length}
                currentPage={visiblePage}
                error={error}
                isDesktop={isDesktop}
                language={language}
                macroStatus={macroStatus}
                onAdd={openAdd}
                onChangePage={(page) => {
                  playSound('navigate');
                  setCurrentPage(page);
                }}
                onOpenCandidate={openPreview}
                onResetFilters={resetFilters}
                onRetry={() => void refetch()}
                rows={groupedPageCandidates}
                searchTerm={searchTerm}
                totalPages={totalPages}
                usingBoneyardSample={usingBoneyardSample}
                visibleCount={filtered.length}
              />
            </div>
          </div>

          <PipelineDialogs
            accessCardData={accessCardData}
            candidates={candidates}
            canDelete={isAdmin}
            isMobile={isMobile}
            language={language}
            modalMode={modalMode}
            onChangeStatus={(candidate, status) => {
              void handleStatusChange(candidate, status);
            }}
            onCloseAccessCard={() => {
              playSound('close');
              setAccessCardTarget(null);
            }}
            onCloseCandidate={closeModal}
            onCloseHire={() => setHireTarget(null)}
            onClosePreview={() => {
              playSound('close');
              setQuickProfile(null);
            }}
            onDeleteCandidate={async (id) => {
              const result = await notifyResult(deleteCandidate(id), {
                success: en ? 'Candidate deleted' : 'Candidato eliminado',
                error: en ? 'Could not delete candidate' : 'No se pudo eliminar el candidato',
              });
              playSound(result.ok ? 'success' : 'error');
              return result;
            }}
            onDeletePreview={(candidate) => {
              setQuickProfile(null);
              openDelete(candidate);
            }}
            onEditCandidate={(candidate) => {
              setQuickProfile(null);
              openEdit(candidate);
            }}
            onHire={handleHire}
            onHireCandidate={(candidate) => {
              setQuickProfile(null);
              openHire(candidate);
            }}
            onSave={handleSave}
            onViewPass={(candidate) => {
              setQuickProfile(null);
              openAccessCard(candidate);
            }}
            previewCandidate={previewCandidate}
            hireCandidate={hireTarget}
            selectedCandidate={selected}
          />
        </main>
      </MotionConfig>
    </BoneyardSkeleton>
  );
}
