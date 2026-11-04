import type { RefObject } from 'react';
import { BarChart3, ClipboardList, EllipsisVertical, UserRoundPlus, UserX } from 'lucide-react';
import { ClipboardCheck, ClipboardList as MorphClipboardList } from 'lucide';
import { Link } from 'react-router-dom';
import { ActionStateContent } from '@/components/ui/ActionStateContent';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { MorphingIcon } from '@/components/ui/MorphingIcon';
import { CandidateStatusBadge } from '@/components/ui/CandidateStatusBadge';
import { SearchField } from '@/components/ui/SearchField';
import { Toolbar, ToolbarGroup } from '@/components/ui/Toolbar';
import type { Language } from '@/contexts/LanguageContext';
import type { CandidateGroup } from '@/components/pipeline/CandidateFilters';
import { CandidateGroupTabs } from '@/components/pipeline/CandidateGroupTabs';
import { CANDIDATE_METRICS_PATH } from '@/pages/candidate-metrics/navigation';
import type { Candidate } from '@/lib/types';

interface PipelineToolbarProps {
  counts: Record<CandidateGroup, number>;
  isAdmin: boolean;
  language: Language;
  onAdd: () => void;
  onChangeGroup: (group: CandidateGroup) => void;
  onChangeSearch: (value: string) => void;
  onClearSearch: () => void;
  onCopyReport: () => void | Promise<void>;
  onSelectCandidate: (candidate: Candidate) => void;
  reportCopied: boolean;
  searchInputRef: RefObject<HTMLInputElement | null>;
  searchResults: Candidate[];
  searchTerm: string;
  value: CandidateGroup;
}

export function PipelineToolbar({
  counts,
  isAdmin,
  language,
  onAdd,
  onChangeGroup,
  onChangeSearch,
  onClearSearch,
  onCopyReport,
  onSelectCandidate,
  reportCopied,
  searchInputRef,
  searchResults,
  searchTerm,
  value,
}: PipelineToolbarProps) {
  const en = language === 'en';

  return (
    <Toolbar label={en ? 'Candidate tools' : 'Herramientas de candidatos'} className="pipeline__toolbar">
      <CandidateGroupTabs value={value} language={language} counts={counts} onChange={onChangeGroup} />
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
              onChange={(event) => onChangeSearch(event.target.value)}
              onClear={onClearSearch}
              autoComplete="off"
            />
            {searchTerm.trim().length > 0 && (
              <section
                className="pipeline__search-dropdown"
                aria-label={en ? 'Search results' : 'Resultados de búsqueda'}
              >
                {searchResults.length > 0 ? (
                  searchResults.map((candidate) => (
                    <button
                      key={candidate.id}
                      type="button"
                      className="search-dropdown-item"
                      onClick={() => onSelectCandidate(candidate)}
                    >
                      <div className="search-dropdown-item__avatar" aria-hidden="true">
                        {(candidate.nombre ?? '?').charAt(0)}
                      </div>
                      <div className="search-dropdown-item__text">
                        <strong>{candidate.nombre}</strong>
                        <CandidateStatusBadge status={candidate.status} icon compact />
                      </div>
                    </button>
                  ))
                ) : (
                  <output className="search-dropdown-item__empty">
                    <UserX size={16} aria-hidden="true" />
                    <span>{en ? 'No matches' : 'No hay coincidencias'}</span>
                  </output>
                )}
              </section>
            )}
          </div>
        </div>
      </ToolbarGroup>

      <ToolbarGroup label={en ? 'Candidate actions' : 'Acciones de candidatos'} className="pipeline__hero-actions">
        {isAdmin && (
          <Link
            className="btn-secondary pipeline__report-btn pipeline__action--desktop"
            to={CANDIDATE_METRICS_PATH}
            data-cuelume-navigate=""
            aria-label={en ? 'Open metrics and KPIs' : 'Abrir métricas y KPIs'}
            title={en ? 'Metrics and KPIs' : 'Métricas y KPIs'}
          >
            <BarChart3 size={16} aria-hidden="true" />
            <span>{en ? 'Metrics' : 'Métricas'}</span>
          </Link>
        )}
        {isAdmin && (
          <button
            type="button"
            className="btn-secondary pipeline__report-btn pipeline__action--desktop"
            onClick={() => void onCopyReport()}
            aria-label={en ? 'Copy candidate summary for WhatsApp' : 'Copiar resumen de candidatos para WhatsApp'}
            title={en ? 'Copy candidate summary for WhatsApp' : 'Copiar resumen de candidatos para WhatsApp'}
          >
            <ActionStateContent active={reportCopied}>
              <MorphingIcon
                icon={reportCopied ? ClipboardCheck : MorphClipboardList}
                size="var(--icon-size-sm)"
                reducedMotion="user"
                aria-hidden="true"
              />
              <span className="pipeline__report-label" aria-hidden="true">
                {en ? 'Summary' : 'Resumen'}
              </span>
            </ActionStateContent>
          </button>
        )}
        <button
          type="button"
          className="btn-primary pipeline__new-btn"
          onClick={onAdd}
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
                <Link to={CANDIDATE_METRICS_PATH} data-cuelume-navigate="">
                  <BarChart3 size={16} aria-hidden="true" />
                  <span>{en ? 'Metrics and KPIs' : 'Métricas y KPIs'}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem data-cuelume-select="" onSelect={() => void onCopyReport()}>
                <ClipboardList size={16} aria-hidden="true" />
                <span>{en ? 'Copy summary for WhatsApp' : 'Copiar resumen para WhatsApp'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </ToolbarGroup>
    </Toolbar>
  );
}
