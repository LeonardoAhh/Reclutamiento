import { SlidersHorizontal, UserRoundPlus, UserX } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { Tooltip } from '@/components/ui/Tooltip';
import type { Language } from '@/contexts/LanguageContext';
import type { CandidateGroup } from '@/components/pipeline/CandidateFilters';
import { PipelineTable, type PipelineTableRowData } from '@/components/pipeline/PipelineTable';
import type { Candidate } from '@/lib/types';

interface PipelineResultsProps {
  candidateCount: number;
  currentPage: number;
  error: string | null;
  isDesktop: boolean;
  language: Language;
  macroStatus: CandidateGroup;
  onAdd: () => void;
  onChangePage: (page: number) => void;
  onOpenCandidate: (candidate: Candidate) => void;
  onResetFilters: () => void;
  onRetry: () => void;
  rows: PipelineTableRowData[];
  searchTerm: string;
  totalPages: number;
  usingBoneyardSample: boolean;
  visibleCount: number;
}

export function PipelineResults({
  candidateCount,
  currentPage,
  error,
  isDesktop,
  language,
  macroStatus,
  onAdd,
  onChangePage,
  onOpenCandidate,
  onResetFilters,
  onRetry,
  rows,
  searchTerm,
  totalPages,
  usingBoneyardSample,
  visibleCount,
}: PipelineResultsProps) {
  const en = language === 'en';

  if (error && !usingBoneyardSample) {
    return (
      <section className="pipeline__empty" aria-labelledby="pipeline-error-title" role="alert">
        <div className="animated-empty-state pipeline__empty-state pipeline__empty-state--error">
          <div className="animated-empty-state__icon">
            <UserX aria-hidden="true" />
          </div>
          <h2 className="animated-empty-state__title" id="pipeline-error-title">
            {en ? 'Could not load candidates' : 'Error al cargar'}
          </h2>
          <p className="pipeline__error-message">{error}</p>
          <button type="button" className="btn-secondary pipeline__empty-action" data-cuelume-tap="" onClick={onRetry}>
            {en ? 'Retry' : 'Reintentar'}
          </button>
        </div>
      </section>
    );
  }

  if (visibleCount === 0) {
    return (
      <section className="pipeline__empty">
        {candidateCount === 0 ? (
          <>
            <h2>{en ? 'No candidates yet' : 'Aún no hay candidatos'}</h2>
            <p>
              {en
                ? 'Start by adding your first candidate to the recruitment database.'
                : 'Empieza agregando tu primer candidato a la base de datos de reclutamiento.'}
            </p>
            <Tooltip content={en ? 'Add candidate' : 'Agregar candidato'}>
              <button
                type="button"
                className="btn-primary"
                onClick={onAdd}
                aria-label={en ? 'Add first candidate' : 'Agregar primer candidato'}
              >
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
                onClick={onResetFilters}
                title={en ? 'Clear filters' : 'Limpiar filtros'}
              >
                <SlidersHorizontal size={16} aria-hidden="true" />
                {en ? 'Clear filters' : 'Limpiar filtros'}
              </button>
            )}
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="pipeline__results">
      <PipelineTable rows={rows} isDesktop={isDesktop} language={language} onOpenCandidate={onOpenCandidate} />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onChangePage}
        canGoPrev={currentPage > 1}
        canGoNext={currentPage < totalPages}
        ariaLabel={en ? 'Candidate pages' : 'Paginación de candidatos'}
      />
    </div>
  );
}
