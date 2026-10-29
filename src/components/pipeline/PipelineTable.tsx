import { Fragment } from 'react';

import type { Language } from '@/contexts/LanguageContext';
import { candidateStatusLabel } from '@/lib/candidateTranslations';
import type { Candidate } from '@/lib/types';

import { PipelineTableRow } from './PipelineTableRow';

export interface PipelineTableRowData {
  candidate: Candidate;
  startsGroup: boolean;
  groupCount: number;
}

interface PipelineTableProps {
  rows: PipelineTableRowData[];
  isDesktop: boolean;
  language: Language;
  onOpenCandidate: (candidate: Candidate) => void;
}

/**
 * Columnas de la tabla de escritorio. El orden debe coincidir con las pistas de
 * `--pipeline-table-columns` en Pipeline.css y con las celdas de PipelineTableRow.
 */
const COLUMN_LABELS: Record<Language, readonly string[]> = {
  es: ['Candidato', 'Puesto', 'Reclutador', 'Entrevista'],
  en: ['Candidate', 'Position', 'Recruiter', 'Interview'],
};

const TABLE_LABEL: Record<Language, string> = {
  es: 'Lista de candidatos',
  en: 'Candidate list',
};

export function PipelineTable({ rows, isDesktop, language, onOpenCandidate }: PipelineTableProps) {
  const columnLabels = COLUMN_LABELS[language];

  return (
    <section
      className="pipeline__card-list"
      aria-label={TABLE_LABEL[language]}
      role={isDesktop ? 'table' : undefined}
    >
      <div className="pipeline__card-list-header" role={isDesktop ? 'row' : undefined}>
        {columnLabels.map((label) => (
          <span key={label} role="columnheader">{label}</span>
        ))}
      </div>
      {rows.map(({ candidate, startsGroup, groupCount }) => (
        <Fragment key={candidate.id ?? candidate.nombre + candidate.fecha_aplicacion}>
          {startsGroup && (
            <div className="pipeline__status-group-heading" role={isDesktop ? 'row' : undefined}>
              <span
                role={isDesktop ? 'cell' : undefined}
                aria-colspan={isDesktop ? columnLabels.length : undefined}
              >
                {candidateStatusLabel(candidate.status, language)}{' '}
                <span className="pipeline__status-group-count">{groupCount}</span>
              </span>
            </div>
          )}
          <PipelineTableRow
            candidate={candidate}
            isDesktop={isDesktop}
            language={language}
            onOpen={onOpenCandidate}
          />
        </Fragment>
      ))}
    </section>
  );
}
