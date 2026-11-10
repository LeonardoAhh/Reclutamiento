import { useEffect, useMemo, useState } from 'react';
import { isIncidence } from './helpers';
import { useReportLocale } from './useReportLocale';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import type { ReporteRow } from './types';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ReporteEmployeeDetailProps {
  open: boolean;
  onClose: () => void;
  employee: ReporteRow | null;
  dayHeaders: string[];
  currentMonth: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;

// ─── Style Maps ────────────────────────────────────────────────────────────────

const STYLES = {
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
  },
  employeeId: {
    color: 'var(--color-mute)',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 'var(--spacing-sm)',
    marginTop: 'var(--spacing-sm)',
  },
  kpiCard: {
    borderRadius: 'var(--rounded-lg)',
    border: '1px solid var(--color-hairline)',
    background: 'var(--color-surface-card)',
    padding: 'var(--spacing-sm)',
    textAlign: 'center' as const,
  },
  kpiLabel: {
    textTransform: 'uppercase' as const,
    color: 'var(--color-mute)',
    margin: 0,
  },
  kpiValue: {
    margin: 0,
  },
  incidentSection: {
    marginTop: 'var(--spacing-lg)',
  },
  incidentLabel: {
    color: 'var(--color-mute)',
    textTransform: 'uppercase' as const,
    marginBottom: 'var(--spacing-sm)',
  },
  incidentTableWrapper: {
    borderRadius: 'var(--rounded-lg)',
    border: 'var(--border-width) solid var(--color-hairline)',
    overflow: 'hidden',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 'var(--spacing-lg)',
  },
} as const;

// ─── Helpers ───────────────────────────────────────────────────────────────────

interface EmployeeStats {
  asistencias: number;
  incidencias: number;
  descansos: number;
  tracked: number;
  incidentDetail: { day: string; code: string }[];
}

function computeStats(employee: ReporteRow, dayHeaders: string[]): EmployeeStats {
  let asistencias = 0;
  let incidencias = 0;
  let descansos = 0;
  let tracked = 0;
  const incidentDetail: { day: string; code: string }[] = [];

  for (const day of dayHeaders) {
    const code = employee.days[day];
    if (!code || code === '-' || code === 'X') continue;
    tracked++;
    if (code === 'A') asistencias++;
    else if (code === 'D' || code === 'DF') descansos++;
    else if (isIncidence(code)) {
      incidencias++;
      incidentDetail.push({ day, code });
    }
  }

  return { asistencias, incidencias, descansos, tracked, incidentDetail };
}

// ─── Subcomponent: KPI Cards ───────────────────────────────────────────────────

interface KpiCardsProps {
  stats: EmployeeStats;
}

const KPI_CONFIG = [
  { label: 'Asistencias', englishLabel: 'Attendance', key: 'asistencias' as const, tone: 'var(--color-success-text)' },
  { label: 'Incidencias', englishLabel: 'Incidents', key: 'incidencias' as const, tone: 'var(--color-error-text)' },
  { label: 'Descansos', englishLabel: 'Rest days', key: 'descansos' as const, tone: 'var(--color-ink)' },
] as const;

function KpiCards({ stats }: KpiCardsProps) {
  const { copy } = useReportLocale();
  return (
    <div style={STYLES.kpiGrid}>
      {KPI_CONFIG.map(({ label, englishLabel, key, tone }) => {
        const value = stats[key];
        const valueColor = key === 'incidencias' && value === 0 ? 'var(--color-mute)' : tone;

        return (
          <div key={label} style={STYLES.kpiCard}>
            <p className="reporte-employee-detail__metric-label" style={STYLES.kpiLabel}>
              {copy(label, englishLabel)}
            </p>
            <p className="reporte-employee-detail__metric-value" style={{ ...STYLES.kpiValue, color: valueColor }}>
              {value}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Subcomponent: Incident Table ──────────────────────────────────────────────

interface IncidentTableProps {
  incidents: { day: string; code: string }[];
  year: number;
  month: number;
}

const TABLE_HEADERS = [
  { spanish: 'Día', english: 'Day' },
  { spanish: 'Código', english: 'Code' },
  { spanish: 'Tipo', english: 'Type' },
] as const;

function IncidentTable({ incidents, year, month }: IncidentTableProps) {
  const { en, copy, incident } = useReportLocale();
  const dayNames = en ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : DAY_NAMES;
  if (incidents.length === 0) return null;

  return (
    <div style={STYLES.incidentSection}>
      <p className="reporte-employee-detail__incident-label" style={STYLES.incidentLabel}>
        {copy('Detalle de incidencias', 'Incident details')} ({incidents.length})
      </p>
      <div style={STYLES.incidentTableWrapper}>
        <table className="data-table">
          <caption className="sr-only">{copy('Detalle de incidencias', 'Incident details')}</caption>
          <thead>
            <tr>
              {TABLE_HEADERS.map((header) => (
                <th key={header.spanish} scope="col">
                  {copy(header.spanish, header.english)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {incidents.map(({ day, code }) => {
              const dayNum = parseInt(day, 10);
              const date = new Date(year, month - 1, dayNum);
              const weekday = dayNames[date.getDay()];

              return (
                <tr key={day}>
                  <td>
                    {weekday} {dayNum}
                  </td>
                  <td>
                    <Badge variant="error">{code}</Badge>
                  </td>
                  <td>{incident(code)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ReporteEmployeeDetail({
  open,
  onClose,
  employee,
  dayHeaders,
  currentMonth,
}: ReporteEmployeeDetailProps) {
  const { copy } = useReportLocale();
  const [activeTab, setActiveTab] = useState<'overview' | 'incidencias'>('overview');
  const stats = useMemo(() => (employee ? computeStats(employee, dayHeaders) : null), [employee, dayHeaders]);

  useEffect(() => {
    if (open) {
      setActiveTab('overview');
    }
  }, [open]);

  if (!employee || !stats) return null;

  const [year, month] = currentMonth.split('-').map(Number);

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={
        <div style={{ ...STYLES.titleRow, textTransform: 'capitalize' }}>
          <span
            className="reporte-employee-detail__employee-id"
            style={{ ...STYLES.employeeId, textTransform: 'none' }}
          >
            #{employee.numero_empleado}
          </span>
          <span>{employee.nombre.toLowerCase()}</span>
        </div>
      }
      size="lg"
      className="reporte-employee-detail-modal report-dialog"
    >
      <div className="modal-body">
        <div
          className="reporte-employee-detail__tabs"
          role="tablist"
          aria-label={copy('Secciones del detalle de empleado', 'Employee detail sections')}
        >
          <button
            type="button"
            role="tab"
            id="emp-tab-overview"
            aria-selected={activeTab === 'overview'}
            data-cuelume-select=""
            aria-controls="emp-detail-panel"
            tabIndex={activeTab === 'overview' ? 0 : -1}
            className={`reporte-employee-detail__tab ${activeTab === 'overview' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            {copy('Resumen', 'Overview')}
          </button>
          <button
            type="button"
            role="tab"
            id="emp-tab-incidencias"
            aria-selected={activeTab === 'incidencias'}
            data-cuelume-select=""
            aria-controls="emp-detail-panel"
            tabIndex={activeTab === 'incidencias' ? 0 : -1}
            className={`reporte-employee-detail__tab ${activeTab === 'incidencias' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('incidencias')}
          >
            {copy('Incidencias', 'Incidents')}
          </button>
        </div>

        <div
          className="reporte-employee-detail__panel"
          id="emp-detail-panel"
          role="tabpanel"
          tabIndex={0}
          aria-labelledby={activeTab === 'overview' ? 'emp-tab-overview' : 'emp-tab-incidencias'}
        >
          {activeTab === 'overview' ? (
            <div style={{ marginTop: 'var(--spacing-md)' }}>
              <KpiCards stats={stats} />
            </div>
          ) : (
            <IncidentTable incidents={stats.incidentDetail} year={year} month={month} />
          )}
        </div>
      </div>
    </Modal>
  );
}
