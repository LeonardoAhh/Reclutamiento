import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeading } from '@/components/layout/PageHeading';
import { useLanguage } from '@/contexts/LanguageContext';
import { EvaluationAreaCard } from './EvaluationAreaCard';
import { getEvaluationCopy } from './copy';
import { evaluationProgram } from './data';
import { EvaluationProgramSummary } from './EvaluationProgramSummary';
import './PerformanceEvaluationsPage.css';

export function PerformanceEvaluationsPage() {
  const { language } = useLanguage();
  const copy = getEvaluationCopy(language);
  const [selectedAreaIndex, setSelectedAreaIndex] = useState(0);
  const selectedArea = evaluationProgram.areas[selectedAreaIndex];

  return (
    <main
      className="performance-evaluations-page container"
      aria-labelledby="performance-evaluations-title"
    >
      <PageHeading id="performance-evaluations-title" className="app-page-title">
        {copy.title}
      </PageHeading>

      <EvaluationProgramSummary
        program={evaluationProgram}
        language={language}
        copy={copy}
      />

      <section
        className="performance-evaluations-page__areas"
        aria-labelledby="performance-evaluations-areas-title"
      >
        <div className="performance-evaluations-page__areas-heading">
          <h2 id="performance-evaluations-areas-title">{copy.areas}</h2>
          <div
            className="performance-evaluations-page__area-navigation"
            role="group"
            aria-label={copy.areaNavigation}
          >
            <button
              type="button"
              className="btn-icon"
              aria-label={copy.previousArea}
              disabled={selectedAreaIndex === 0}
              onClick={() => {
                setSelectedAreaIndex((index) => Math.max(0, index - 1));
              }}
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              className="btn-icon"
              aria-label={copy.nextArea}
              disabled={selectedAreaIndex >= evaluationProgram.areas.length - 1}
              onClick={() => {
                setSelectedAreaIndex((index) =>
                  Math.min(evaluationProgram.areas.length - 1, index + 1),
                );
              }}
            >
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="performance-evaluations-page__area-list">
          {selectedArea && (
            <EvaluationAreaCard
              area={selectedArea}
              language={language}
              copy={copy}
            />
          )}
        </div>
      </section>
    </main>
  );
}
