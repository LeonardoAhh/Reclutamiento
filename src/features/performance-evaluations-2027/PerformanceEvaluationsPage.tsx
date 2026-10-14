import { useState } from 'react';
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
        <div className="performance-evaluations-page__area-list">
          {selectedArea && (
            <EvaluationAreaCard
              area={selectedArea}
              language={language}
              copy={copy}
              areasHeadingId="performance-evaluations-areas-title"
              areasHeading={copy.areas}
              areaNavigation={{
                label: copy.areaNavigation,
                previousLabel: copy.previousArea,
                nextLabel: copy.nextArea,
                previousDisabled: selectedAreaIndex === 0,
                nextDisabled:
                  selectedAreaIndex >= evaluationProgram.areas.length - 1,
                onPrevious: () => {
                  setSelectedAreaIndex((index) => Math.max(0, index - 1));
                },
                onNext: () => {
                  setSelectedAreaIndex((index) =>
                    Math.min(evaluationProgram.areas.length - 1, index + 1),
                  );
                },
              }}
            />
          )}
        </div>
      </section>
    </main>
  );
}
