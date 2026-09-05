
/**
 * KpiHeroChart.tsx
 * Gráfica compuesta (Barras Agrupadas + Línea) para el dashboard de KPIs de Reclutamiento.
 * Rediseño ejecutivo — modo claro/blanco, legible en proyector y Teams.
 *
 * Muestra vacantes plantilla, vacantes backup y cobertura % por día de la semana.
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
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Line,
  ComposedChart,
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
  ink: 'var(--color-ink)',
  grid: 'var(--color-hairline)',
  axis: 'var(--color-muted)',
  surfaceCard: 'var(--color-surface-card)',
  surfaceSoft: 'var(--color-surface-soft)',
};

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
        const isPercent = entry.dataKey === 'cobertura';
        const valor = isPercent
          ? formatPercentage(entry.value)
          : entry.value.toLocaleString('es-MX');

        return (
          <p
            key={entry.dataKey}
            className="kpi-hero-tooltip__row"
          >
            <span
              aria-hidden="true"
              className={`kpi-hero-series-marker${isPercent ? ' kpi-hero-series-marker--line' : ''}`}
              style={{ backgroundColor: entry.color }}
            />
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

function formatYRight(value: number): string {
  return `${value}%`;
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
  r,
  fill,
  stroke,
  strokeWidth,
}: SafeDotProps & { r: number; fill: string; stroke?: string; strokeWidth?: number }) {
  if (!isFinitePair(cx, cy) || typeof cy !== 'number') return <g />;
  return (
    <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
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
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
  disableNextWeek?: boolean;
  weekNumber?: number;
}

function ChartHeader({ data, presentation, onPrevWeek, onNextWeek, disableNextWeek, weekNumber }: ChartHeaderProps) {
  if (!data.length) return null;

  const minCobertura = Math.min(...data.map((d) => d.cobertura));
  const isCriticalWeek = minCobertura < 90;

  return (
    <div className="kpi-hero-header">
      <div className="kpi-hero-heading">
        <h2 className="kpi-hero-title">Cobertura</h2>
        <ul className="kpi-hero-legend" aria-label="Series del gráfico">
          <li>
            <span className="kpi-hero-legend-marker kpi-hero-legend-marker--plantilla" aria-hidden="true" />
            Plantilla
          </li>
          <li>
            <span className="kpi-hero-legend-marker kpi-hero-legend-marker--backup" aria-hidden="true" />
            Backup
          </li>
          <li>
            <span className="kpi-hero-legend-marker kpi-hero-legend-marker--starlite" aria-hidden="true" />
            Starlite
          </li>
          <li>
            <span className="kpi-hero-legend-marker kpi-hero-legend-marker--coverage" aria-hidden="true" />
            Cobertura
          </li>
        </ul>
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
  ariaLabel = 'Gráfica de vacantes plantilla, vacantes backup, vacantes Starlite y cobertura por día de la semana',
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
  const Y_LEFT_WIDTH = presentation ? 48 : 32;
  const Y_RIGHT_WIDTH = presentation ? 58 : 40;
  const DOT_ACTIVE_RADIUS = presentation ? 10 : 6;
  const DOT_REST_RADIUS = presentation ? 6 : 3;
  const LINE_STROKE_WIDTH = presentation ? 4 : 2.5;
  const BAR_RADIUS = presentation ? 6 : 4;
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

  const coberturaMin = isEmpty
    ? 0
    : Math.min(...chartData.map((d) => d.cobertura));
  const yRightMin = Math.floor(Math.min(coberturaMin, 90) / 10) * 10;
  const yRightMax = 100;

  return (
    <figure
      aria-label={ariaLabel}
      aria-describedby={descId}
      className={`kpi-hero-chart${presentation ? ' kpi-hero-chart--presentation' : ''}${onClick ? ' kpi-hero-chart--interactive' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : 'img'}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
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
            onPrevWeek={onPrevWeek}
            onNextWeek={onNextWeek}
            disableNextWeek={disableNextWeek}
            weekNumber={weekNumber}
          />

          <div className={`kpi-hero-plot${presentation ? ' kpi-hero-plot--presentation' : ''}`}>
            <ResponsiveContainer width="100%" height={chartHeight} minWidth={1} minHeight={1}>
              <ComposedChart
                data={chartData}
                margin={MARGIN}
                role="img"
                aria-label={ariaLabel}
                barCategoryGap="28%"
                barGap={presentation ? 6 : 3}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
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
                  width={Y_LEFT_WIDTH}
                  allowDecimals={false}
                />

                <YAxis
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: PALETTE.ink,
                    fontSize: TICK_FONT_SIZE,
                    fontWeight: 500,
                    fontFamily: 'inherit',
                  }}
                  tickFormatter={formatYRight}
                  width={Y_RIGHT_WIDTH}
                  domain={[yRightMin, yRightMax]}
                />

                <Tooltip
                  content={<CustomTooltip presentation={presentation} />}
                  cursor={{
                    fill: PALETTE.surfaceSoft,
                    radius: 6,
                  }}
                />

                <Bar
                  yAxisId="left"
                  dataKey="vacantesPlantilla"
                  name="Vacantes Plantilla"
                  fill={PALETTE.red}
                  fillOpacity={0.85}
                  radius={[BAR_RADIUS, BAR_RADIUS, 0, 0]}
                  isAnimationActive
                  animationDuration={600}
                  animationEasing="ease-out"
                />

                <Bar
                  yAxisId="left"
                  dataKey="vacantesBackup"
                  name="Vacantes Backup"
                  fill={PALETTE.amber}
                  fillOpacity={0.85}
                  radius={[BAR_RADIUS, BAR_RADIUS, 0, 0]}
                  isAnimationActive
                  animationDuration={600}
                  animationEasing="ease-out"
                  animationBegin={100}
                />

                <Bar
                  yAxisId="left"
                  dataKey="vacantesStarlite"
                  name="Vacantes Starlite"
                  fill={PALETTE.starlite}
                  fillOpacity={0.85}
                  radius={[BAR_RADIUS, BAR_RADIUS, 0, 0]}
                  isAnimationActive
                  animationDuration={600}
                  animationEasing="ease-out"
                  animationBegin={200}
                />

                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cobertura"
                  name="Cobertura %"
                  stroke={PALETTE.ink}
                  strokeWidth={LINE_STROKE_WIDTH}
                  dot={
                    <SafeLineDot
                      r={DOT_REST_RADIUS}
                      fill={PALETTE.surfaceCard}
                      stroke={PALETTE.ink}
                      strokeWidth={presentation ? 2.5 : 2}
                    />
                  }
                  activeDot={<SafeLineDot r={DOT_ACTIVE_RADIUS} fill={PALETTE.ink} />}
                  isAnimationActive
                  animationDuration={800}
                  animationEasing="ease-out"
                  animationBegin={200}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
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
