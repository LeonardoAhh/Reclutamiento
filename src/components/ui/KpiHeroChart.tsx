
/**
 * KpiHeroChart.tsx
 * Gráfica de líneas 2D para el dashboard de KPIs de Reclutamiento.
 * Rediseño ejecutivo — modo claro/blanco, legible en proyector y Teams.
 *
 * Muestra vacantes de plantilla, backup y Starlite por día de la semana.
 * Incluye zona crítica visual (<90%), tarjetas de resumen por día y KPIs destacados.
 *
 * Dependencias: recharts
 */

import './KpiHeroChart.css';
import { useMemo, useId } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { localTodayIso } from '@/lib/dates';
import { formatPercentage } from '@/lib/utils';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Line,
  LineChart,
  type TooltipProps,
} from 'recharts';

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

export interface DailyKpiData {
  day: string;
  dateIso: string;
  vacantesPlantilla: number;
  vacantesBackup: number;
  vacantesStarlite: number;
  cobertura: number;
}

interface KpiHeroChartProps {
  data: DailyKpiData[];
  height?: number;
  ariaLabel?: string;
  variant?: 'default' | 'presentation';
  onClick?: () => void;
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
  disableNextWeek?: boolean;
  weekNumber?: number;
}

// ─────────────────────────────────────────────
// Paleta dinámica basada en Tokens CSS
// Recharts soporta variables CSS nativas en fill y stroke
// ─────────────────────────────────────────────

const PALETTE = {
  red: 'var(--color-error)',
  amber: 'var(--color-accent-amber)',
  starlite: 'var(--color-accent-purple-deep)',
  grid: 'var(--color-hairline)',
  axis: 'var(--color-muted)',
  surfaceCard: 'var(--color-surface-card)',
};

const SERIES = [
  { key: 'vacantesPlantilla', label: 'Plantilla', name: 'Vacantes Plantilla', axis: 'left', color: PALETTE.red, dash: 'var(--chart-dash-long)' },
  { key: 'vacantesBackup', label: 'Backup', name: 'Vacantes Backup', axis: 'left', color: PALETTE.amber, dash: 'var(--chart-dash-short)' },
  { key: 'vacantesStarlite', label: 'Starlite', name: 'Vacantes Starlite', axis: 'left', color: PALETTE.starlite, dash: 'var(--chart-dash-dotted)' },
] as const;

function SeriesMarker({ seriesKey }: { seriesKey: string }) {
  const series = SERIES.find((item) => item.key === seriesKey);
  if (!series) return null;
  return (
    <svg className={`kpi-hero-legend-marker kpi-hero-legend-marker--${series.key}`} aria-hidden="true">
      <line x1="0" x2="100%" y1="50%" y2="50%" strokeDasharray={series.dash} />
      <circle cx="50%" cy="50%" />
    </svg>
  );
}

// ─────────────────────────────────────────────
// Tooltip personalizado
// ─────────────────────────────────────────────

type CustomTooltipPayloadItem = {
  name: string;
  value: number;
  color: string;
  dataKey: string;
};

interface CustomTooltipInternalProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: CustomTooltipPayloadItem[];
  label?: string;
  presentation?: boolean;
}

function CustomTooltip({ active, payload, label, presentation }: CustomTooltipInternalProps) {
  if (!active || !payload?.length) return null;

  return (
    <div role="tooltip" className={`kpi-hero-tooltip${presentation ? ' kpi-hero-tooltip--presentation' : ''}`}>
      <p className="kpi-hero-tooltip__title">
        {label}
      </p>
      {payload.map((entry) => {
        const valor = entry.value.toLocaleString('es-MX');

        return (
          <p
            key={entry.dataKey}
            className="kpi-hero-tooltip__row"
          >
            <SeriesMarker seriesKey={entry.dataKey} />
            <span>{entry.name}:</span>{' '}
            <strong>{valor}</strong>
          </p>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// Formateadores de ejes
// ─────────────────────────────────────────────

function formatYLeft(value: number): string {
  return Number.isInteger(value) ? value.toString() : '';
}

/* Guard para los dots de la línea: recharts puede pasar cx/cy undefined
   (hover/animación interna), lo que producía "Error: <circle> attribute
   cy/r: Expected length, 'undefined'". Solo renderizamos el punto cuando
   las coordenadas son números finitos. */
function isFinitePair(cx?: number, cy?: number): cx is number {
  return (
    typeof cx === 'number' &&
    Number.isFinite(cx) &&
    typeof cy === 'number' &&
    Number.isFinite(cy)
  );
}

interface SafeDotProps {
  cx?: number;
  cy?: number;
}

/** Dot de línea a prueba de coords inválidas (elemento clonado por recharts). */
function SafeLineDot({
  cx,
  cy,
  fill,
  stroke,
  active = false,
}: SafeDotProps & { fill: string; stroke?: string; active?: boolean }) {
  if (!isFinitePair(cx, cy) || typeof cy !== 'number') return <g />;
  return (
    <circle className={`kpi-hero-line-dot${active ? ' kpi-hero-line-dot--active' : ''}`} cx={cx} cy={cy} fill={fill} stroke={stroke} />
  );
}

// ─────────────────────────────────────────────
// Tarjetas de resumen por día
// ─────────────────────────────────────────────

interface DayCardProps {
  data: DailyKpiData;
}

function DayCard({ data }: DayCardProps) {
  const isCritical = data.cobertura < 90;
  const hasAlta = data.vacantesPlantilla > 10 || data.vacantesBackup > 12;

  return (
    <div className={`kpi-hero-day-card${isCritical ? ' kpi-hero-day-card--critical' : ''}`}>
      {/* Día */}
      <p className="kpi-hero-day-card__day">
        {data.day}
      </p>

      {/* % cobertura */}
      <p className="kpi-hero-day-card__coverage">
        {formatPercentage(data.cobertura)}
      </p>

      <p className={`kpi-hero-day-card__vacancies${hasAlta ? ' kpi-hero-day-card__vacancies--high' : ''}`}>
        {data.vacantesPlantilla}P
      </p>
      <p className={`kpi-hero-day-card__vacancies${hasAlta ? ' kpi-hero-day-card__vacancies--high' : ''}`}>
        +{data.vacantesBackup}B
      </p>
      <p className="kpi-hero-day-card__vacancies">
        +{data.vacantesStarlite}S
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Header con KPIs destacados
// ─────────────────────────────────────────────

interface ChartHeaderProps {
  data: DailyKpiData[];
  presentation: boolean;
  onClick?: () => void;
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
  disableNextWeek?: boolean;
  weekNumber?: number;
}

function ChartHeader({ data, presentation, onClick, onPrevWeek, onNextWeek, disableNextWeek, weekNumber }: ChartHeaderProps) {
  if (!data.length) return null;

  const minCobertura = Math.min(...data.map((d) => d.cobertura));
  const isCriticalWeek = minCobertura < 90;

  return (
    <div className="kpi-hero-header">
      <div className="kpi-hero-heading">
        <h2 className="kpi-hero-title">
          {onClick ? (
            <button
              type="button"
              className="kpi-hero-title-action"
              aria-label="Cobertura: ver detalle de vacantes"
              onClick={(event) => { event.stopPropagation(); onClick(); }}
            >
              Cobertura
            </button>
          ) : 'Cobertura'}
        </h2>
      </div>

      <div className="kpi-hero-metrics">
        <div className="kpi-hero-avg-container">
          {weekNumber && (
            <div className="kpi-hero-badge">
              Semana {weekNumber}
            </div>
          )}
          <div className="kpi-hero-avg-top">
            {(onPrevWeek || onNextWeek) && (
              <div className="kpi-hero-nav">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onPrevWeek) onPrevWeek();
                  }}
                  className="kpi-hero-nav-btn"
                  aria-label="Semana anterior"
                >
                  <ChevronLeft size={16} strokeWidth={3} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onNextWeek) onNextWeek();
                  }}
                  disabled={disableNextWeek}
                  className="kpi-hero-nav-btn"
                  aria-label="Semana siguiente"
                >
                  <ChevronRight size={16} strokeWidth={3} />
                </button>
              </div>
            )}
          </div>
        </div>

        {isCriticalWeek && (
          <>
            <div className={`kpi-hero-critical-divider${presentation ? ' kpi-hero-critical-divider--presentation' : ''}`} />
            <div className={`kpi-hero-critical${presentation ? ' kpi-hero-critical--presentation' : ''}`}>
              <p className="kpi-hero-critical__label">
                Mín. cobertura
              </p>
              <p className="kpi-hero-critical__value">
                {formatPercentage(minCobertura)}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Estado vacío
// ─────────────────────────────────────────────

function ChartEmpty() {
  return (
    <div role="img" aria-label="Sin datos disponibles" className="kpi-hero-empty">
      <svg
        className="kpi-hero-empty__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
      <span>Sin datos para mostrar</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────

export function KpiHeroChart({
  data,
  height,
  ariaLabel = 'Gráfica de vacantes de plantilla, backup y Starlite por día de la semana',
  variant = 'default',
  onClick,
  onPrevWeek,
  onNextWeek,
  disableNextWeek,
  weekNumber,
}: KpiHeroChartProps) {
  const descId = useId();

  const presentation = variant === 'presentation';
  const isMobile = useIsMobile();

  // ── Tamaños según variante ──────────────────
  const chartHeight = height ?? (presentation ? 420 : 280);
  const TICK_FONT_SIZE = presentation ? 15 : 13;
  const Y_AXIS_WIDTH = presentation ? 58 : 40;
  const MARGIN = {
    top: presentation ? 24 : 16,
    right: presentation ? 20 : 8,
    left: presentation ? 8 : 0,
    bottom: presentation ? 20 : 8,
  };

  const chartData = useMemo<DailyKpiData[]>(() => {
    return data
      .filter((d) => {
        return (
          typeof d.vacantesPlantilla === 'number' &&
          typeof d.vacantesBackup === 'number' &&
          typeof d.vacantesStarlite === 'number' &&
          typeof d.cobertura === 'number' &&
          !Number.isNaN(d.vacantesPlantilla) &&
          !Number.isNaN(d.vacantesBackup) &&
          !Number.isNaN(d.vacantesStarlite) &&
          !Number.isNaN(d.cobertura)
        );
      })
      .map((d) => ({
        ...d,
        cobertura: Math.round(d.cobertura * 10) / 10,
      }));
  }, [data]);

  const isEmpty = chartData.length === 0;

  // En móvil: mostrar solo la card del día actual (o la última disponible como fallback)
  const visibleCards = useMemo(() => {
    if (!isMobile || presentation) return chartData;
    if (chartData.length === 0) return chartData;
    const todayIso = localTodayIso();
    const todayCard = chartData.find((d) => d.dateIso?.slice(0, 10) === todayIso);
    return todayCard ? [todayCard] : [chartData[chartData.length - 1]];
  }, [chartData, isMobile, presentation]);

  return (
    <figure
      aria-label={ariaLabel}
      aria-describedby={descId}
      className={`kpi-hero-chart${presentation ? ' kpi-hero-chart--presentation' : ''}${onClick ? ' kpi-hero-chart--interactive' : ''}`}
      onClick={onClick}
    >
      <figcaption
        id={descId}
        className="kpi-hero-sr-only"
      >
        {ariaLabel}.{' '}
        {isEmpty
          ? 'No hay datos disponibles.'
          : `Semana del ${chartData[0]?.dateIso ?? ''} al ${chartData[chartData.length - 1]?.dateIso ?? ''}.`}
      </figcaption>

      {isEmpty ? (
        <div style={{ height: chartHeight }}>
          <ChartEmpty />
        </div>
      ) : (
        <>
          <ChartHeader
            data={chartData}
            presentation={presentation}
            onClick={onClick}
            onPrevWeek={onPrevWeek}
            onNextWeek={onNextWeek}
            disableNextWeek={disableNextWeek}
            weekNumber={weekNumber}
          />

              <section
                className={`kpi-hero-plot${presentation ? ' kpi-hero-plot--presentation' : ''}`}
                aria-labelledby={`${descId}-vacancies`}
              >
                <header className="kpi-hero-panel-header">
                  <h3 id={`${descId}-vacancies`} className="kpi-hero-panel-title">Vacantes</h3>
                  <ul className="kpi-hero-legend" aria-label="Series de vacantes">
                    {SERIES.map((series) => (
                      <li key={series.key}>
                        <SeriesMarker seriesKey={series.key} />
                        {series.label}
                      </li>
                    ))}
                  </ul>
                </header>
                <ResponsiveContainer width="100%" height={chartHeight} minWidth={1} minHeight={1}>
                  <LineChart
                    data={chartData}
                    margin={MARGIN}
                    aria-label={ariaLabel}
                    accessibilityLayer
                  >
                    <CartesianGrid
                      strokeDasharray="var(--chart-dash-short)"
                      vertical={false}
                      stroke={PALETTE.grid}
                      strokeOpacity={1}
                    />

                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: PALETTE.axis,
                        fontSize: TICK_FONT_SIZE,
                        fontWeight: 400,
                        fontFamily: 'inherit',
                      }}
                      dy={presentation ? 12 : 8}
                    />

                    <YAxis
                      yAxisId="left"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: PALETTE.axis,
                        fontSize: TICK_FONT_SIZE,
                        fontWeight: 400,
                        fontFamily: 'inherit',
                      }}
                      tickFormatter={formatYLeft}
                      width={Y_AXIS_WIDTH}
                      allowDecimals={false}
                    />

                    <Tooltip
                      content={<CustomTooltip presentation={presentation} />}
                      cursor={{
                        stroke: PALETTE.axis,
                        strokeDasharray: 'var(--chart-dash-short)',
                      }}
                    />
                    {SERIES.map((series) => (
                      <Line
                        key={series.key}
                        yAxisId={series.axis}
                        type="linear"
                        dataKey={series.key}
                        name={series.name}
                        stroke={series.color}
                        strokeWidth="var(--chart-line-width)"
                        strokeDasharray={series.dash}
                        strokeLinecap="round"
                        dot={<SafeLineDot fill={PALETTE.surfaceCard} stroke={series.color} />}
                        activeDot={<SafeLineDot active fill={series.color} stroke={PALETTE.surfaceCard} />}
                        isAnimationActive={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </section>
          {presentation && (
                      <div className="kpi-hero-day-grid">
                        {visibleCards.map((d) => (
                          <DayCard
                            key={d.dateIso}
                            data={d}
                          />
                        ))}
                      </div>
                    )}
        </>
      )}
    </figure>
  );
}
