import { useEffect, useState } from 'react';
import type { ReporteRow } from './types';

interface ReportDayRouteLoadingInput {
  isDayPage: boolean;
  validDayRoute: boolean;
  routeMonth: string;
  rows: ReporteRow[];
  loadingDb: boolean;
  loadReport: (month: string) => Promise<void>;
}

export function useReportDayRouteLoading({ isDayPage, validDayRoute, routeMonth, rows, loadingDb, loadReport }: ReportDayRouteLoadingInput) {
  const [dayReportLoading, setDayReportLoading] = useState(isDayPage);
  const [revision, setRevision] = useState(0);
  const hasReport = rows.some(row => row.mes === routeMonth);
  useEffect(() => {
    if (!isDayPage || !validDayRoute || hasReport) {
      setDayReportLoading(false);
      return;
    }
    if (loadingDb) return;
    let active = true;
    setDayReportLoading(true);
    void loadReport(routeMonth).finally(() => {
      if (active) setDayReportLoading(false);
    });
    return () => { active = false; };
  }, [isDayPage, validDayRoute, routeMonth, hasReport, loadingDb, loadReport, revision]);
  return { dayReportLoading, retryDayReport: () => setRevision(value => value + 1) };
}
