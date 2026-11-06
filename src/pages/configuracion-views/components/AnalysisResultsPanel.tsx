import { useEffect, useRef, useState } from 'react';
import type { UsePaginationResult } from '@/hooks/usePagination';
import type { ReporteDiarioRecord } from '@/hooks/useReporteDiario';
import { playSound } from '@/lib/sound';
import type { EmployeeSearchResult } from '../analisis-helpers';
import { AnalysisEmployeeDetail } from './AnalysisEmployeeDetail';
import { AnalysisResultsTable } from './AnalysisResultsTable';
import { Pagination } from '@/components/ui/Pagination';

interface AnalysisResultsPanelProps {
  pagination: UsePaginationResult<EmployeeSearchResult>;
  reports: ReporteDiarioRecord[];
  reportsLoading: boolean;
  reportsFetched: boolean;
  reportsError: boolean;
  onRetryReports: () => void;
  paginationLabel: string;
  resultCount: string;
  onDetailViewChange: (isOpen: boolean) => void;
}

export function AnalysisResultsPanel({
  pagination,
  reports,
  reportsLoading,
  reportsFetched,
  reportsError,
  onRetryReports,
  paginationLabel,
  resultCount,
  onDetailViewChange,
}: AnalysisResultsPanelProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSearchResult | null>(null);
  const returnFocusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => () => onDetailViewChange(false), [onDetailViewChange]);

  const handleSelectEmployee = (employee: EmployeeSearchResult, trigger: HTMLButtonElement) => {
    playSound('navigate');
    returnFocusRef.current = trigger;
    setSelectedEmployee(employee);
    onDetailViewChange(true);
  };

  const handleBack = () => {
    playSound('navigate', { direction: 'back' });
    setSelectedEmployee(null);
    onDetailViewChange(false);
    window.requestAnimationFrame(() => returnFocusRef.current?.focus());
  };

  return (
    <>
      {selectedEmployee ? (
        <div className="config-results-panel">
          <AnalysisEmployeeDetail
            employee={selectedEmployee}
            reports={reports}
            reportsLoading={reportsLoading}
            reportsFetched={reportsFetched}
            reportsError={reportsError}
            onRetryReports={onRetryReports}
            onBack={handleBack}
          />
        </div>
      ) : (
        <>
          <p className="config-results__count type-body-md text-muted" aria-live="polite">
            {resultCount}
          </p>
          <div className="config-results-panel">
            <AnalysisResultsTable
              employees={pagination.pageItems}
              reports={reports}
              reportsLoading={reportsLoading}
              reportsFetched={reportsFetched}
              reportsError={reportsError}
              onRetryReports={onRetryReports}
              onSelectEmployee={handleSelectEmployee}
            />
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={pagination.goToPage}
              onPrev={pagination.prevPage}
              onNext={pagination.nextPage}
              canGoPrev={pagination.canGoPrev}
              canGoNext={pagination.canGoNext}
              ariaLabel={paginationLabel}
              hideOnSinglePage
            />
          </div>
        </>
      )}
    </>
  );
}
