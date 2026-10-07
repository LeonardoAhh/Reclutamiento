import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import ReporteAreaSummary from '@/components/reporte-diario/reporte-area-summary';
import ReporteIncidentTabs from '@/components/reporte-diario/reporte-incident-tabs';
import { useReportLocale } from '@/components/reporte-diario/useReportLocale';
import { getReportDayPath } from '@/components/reporte-diario/navigation';
import type { AreaDetailRow, AreaStaffSummary, EmployeeRef, IncidentTab } from '@/components/reporte-diario/types';
import './ReportDayPage.css';

interface ReportDayPageProps {
  title: string;
  month: string;
  day: string;
  loading: boolean;
  hasData: boolean;
  hasError: boolean;
  onRetry: () => void;
  prevDay: string | null;
  nextDay: string | null;
  areas: AreaStaffSummary[];
  selectedArea: string | null;
  onSelectArea: (area: string | null) => void;
  detailRows: AreaDetailRow[];
  selectedTab: IncidentTab | '';
  onSelectTab: (tab: IncidentTab | '') => void;
  dayCounts: Record<IncidentTab, number>;
  incidentSummary: Record<IncidentTab, EmployeeRef[]>;
}

export function ReportDayPage(props: ReportDayPageProps) {
  const { copy } = useReportLocale();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const title = props.title || copy('Detalle del día', 'Day details');
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, [props.day]);

  return (
    <div className="report-day-page">
      <header className="page-header">
        <div className="page-header__content">
          <h1 ref={headingRef} tabIndex={-1} id="reporte-page-title" className="app-page-title" data-testid="selected-day-title">
            <Link to="/reports" className="report-day-page__title-link" aria-label={title + ': ' + copy('volver a Reporte diario', 'back to Daily report')}>
              <ArrowLeft size="var(--icon-size-md)" aria-hidden="true" />
              <span>{title}</span>
            </Link>
          </h1>
        </div>
        {props.hasData && !props.loading && (
            <nav className="report-day-page__navigation" aria-label={copy('Navegación entre días', 'Day navigation')}>
              {props.prevDay ? <Link replace to={getReportDayPath(props.month, props.prevDay)} className="btn-ghost" aria-label={copy('Día anterior', 'Previous day')} data-testid="prev-day-btn">
                <ChevronLeft size="var(--icon-size-sm)" aria-hidden="true" />{copy('Día anterior', 'Previous day')}
              </Link> : <button type="button" className="btn-ghost" disabled aria-label={copy('Día anterior', 'Previous day')} data-testid="prev-day-btn">
                <ChevronLeft size="var(--icon-size-sm)" aria-hidden="true" />{copy('Día anterior', 'Previous day')}
              </button>}
              {props.nextDay ? <Link replace to={getReportDayPath(props.month, props.nextDay)} className="btn-ghost" aria-label={copy('Día siguiente', 'Next day')} data-testid="next-day-btn">
                {copy('Día siguiente', 'Next day')}<ChevronRight size="var(--icon-size-sm)" aria-hidden="true" />
              </Link> : <button type="button" className="btn-ghost" disabled aria-label={copy('Día siguiente', 'Next day')} data-testid="next-day-btn">
                {copy('Día siguiente', 'Next day')}<ChevronRight size="var(--icon-size-sm)" aria-hidden="true" />
              </button>}
            </nav>
        )}
      </header>
      {props.loading ? <LoadingSkeleton label={copy('Cargando detalle del día…', 'Loading day details…')} className="report-day-page__skeleton">
        <div className="report-day-page__skeleton-grid" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => <span key={index} className="loading-skeleton__bone report-day-page__skeleton-card" />)}
        </div>
      </LoadingSkeleton> : props.hasError ? <div>
        <p className="form-error-text" role="alert">{copy('No se pudo cargar el reporte del día.', 'Could not load the day report.')}</p>
        <button type="button" className="btn-secondary" onClick={props.onRetry}>{copy('Reintentar', 'Retry')}</button>
      </div> : !props.hasData ? <p role="status">{copy('El reporte de este día no está disponible. Vuelve a Reporte diario para seleccionar un reporte.', 'This day report is unavailable. Return to Daily report to select a report.')}</p> : (
        <div className="report-day-page__content">
          <div className="report-day-page__section">
            <h2 id="ras-heading" className="report-day-page__section-title">{copy('Resumen por área', 'Summary by area')}</h2>
            <ReporteAreaSummary areas={props.areas} selectedArea={props.selectedArea} onSelectArea={props.onSelectArea} detailRows={props.detailRows} />
          </div>
          <section className="report-day-page__section" aria-labelledby="report-day-incidents-title">
            <h2 id="report-day-incidents-title" className="report-day-page__section-title">{copy('Incidencias', 'Incidents')}</h2>
            <ReporteIncidentTabs selectedTab={props.selectedTab} onSelectTab={props.onSelectTab} dayCounts={props.dayCounts} incidentSummary={props.incidentSummary} />
          </section>
        </div>
      )}
    </div>
  );
}
