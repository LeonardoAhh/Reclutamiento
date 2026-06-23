
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

import { useMemo, useId } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import {
  ResponsiveContainer,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
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
  cobertura: number;
}

interface KpiHeroChartProps {
  data: DailyKpiData[];
  height?: number;
  ariaLabel?: string;
  variant?: 'default' | 'presentation';
  onClick?: () => void;
}

// ─────────────────────────────────────────────
// Paleta dinámica basada en Tokens CSS
// Recharts soporta variables CSS nativas en fill y stroke
// ─────────────────────────────────────────────

const PALETTE = {
  red: 'var(--color-error)',
  amber: 'var(--color-accent-amber)',
  ink: 'var(--color-ink)',
  alertFill: 'var(--color-vacancy-tint)',
  grid: 'var(--color-hairline)',
  axis: 'var(--color-muted)',
  border: 'var(--color-hairline-strong)',
  surface: 'var(--color-canvas)',
  surfaceCard: 'var(--color-surface-card)',
  surfaceSoft: 'var(--color-surface-soft)',
  textPrimary: 'var(--color-ink)',
  textMuted: 'var(--color-muted)',
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

  const baseFontSize = presentation ? 16 : 13;

  return (
    <div
      role="tooltip"
      style={{
        backgroundColor: PALETTE.surfaceCard,
        border: `1px solid ${PALETTE.border}`,
        borderRadius: 'var(--rounded-lg)',
        padding: presentation ? '14px 18px' : '10px 14px',
        fontFamily: 'var(--font-body)',
        minWidth: presentation ? 200 : 170,
      }}
    >
      <p
        style={{
          margin: '0 0 8px',
          fontSize: presentation ? 15 : 12,
          fontWeight: 600,
          color: PALETTE.textPrimary,
          letterSpacing: 'var(--type-caption-up-tracking)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </p>
      {payload.map((entry) => {
        const isPercent = entry.dataKey === 'cobertura';
        const valor = isPercent
          ? `${entry.value.toFixed(1)}%`
          : entry.value.toLocaleString('es-MX');

        return (
          <p
            key={entry.dataKey}
            style={{
              margin: '5px 0 0',
              fontSize: baseFontSize,
              color: PALETTE.textMuted,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontWeight: 400,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: 'inline-block',
                width: isPercent ? 14 : 10,
                height: isPercent ? 3 : 10,
                borderRadius: isPercent ? 2 : 3,
                backgroundColor: entry.color,
                flexShrink: 0,
              }}
            />
            <span style={{ color: PALETTE.textMuted }}>{entry.name}:</span>{' '}
            <strong style={{ color: PALETTE.textPrimary, fontWeight: 500 }}>{valor}</strong>
          </p>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// Leyenda personalizada
// ─────────────────────────────────────────────

interface LegendPayloadItem {
  value: string;
  color: string;
  dataKey?: string;
}

interface CustomLegendProps {
  payload?: LegendPayloadItem[];
  presentation?: boolean;
}

function CustomLegend({ payload, presentation }: CustomLegendProps) {
  if (!payload?.length) return null;

  const fontSize = presentation ? 15 : 13;

  return (
    <ul
      aria-label="Leyenda de la gráfica"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: presentation ? '8px 28px' : '6px 20px',
        listStyle: 'none',
        margin: presentation ? '0 0 20px' : '0 0 12px',
        padding: 0,
        justifyContent: 'flex-start',
      }}
    >
      {payload.map((entry) => {
        const isLine = entry.dataKey === 'cobertura';
        return (
          <li
            key={entry.dataKey ?? entry.value}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              fontSize,
              fontWeight: 400,
              color: PALETTE.textMuted,
              padding: presentation ? '5px 14px' : '4px 10px',
              background: PALETTE.surfaceSoft,
              borderRadius: 'var(--rounded-pill)',
              border: `1px solid ${PALETTE.border}`,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: 'inline-block',
                width: isLine ? 16 : 10,
                height: isLine ? 3 : 10,
                borderRadius: isLine ? 2 : 3,
                backgroundColor: entry.color,
                flexShrink: 0,
              }}
            />
            {entry.value}
          </li>
        );
      })}
    </ul>
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

// ─────────────────────────────────────────────
// Tarjetas de resumen por día
// ─────────────────────────────────────────────

interface DayCardProps {
  data: DailyKpiData;
  presentation: boolean;
  expanded?: boolean;
}

function DayCard({ data, presentation, expanded = false }: DayCardProps) {
  const isCritical = data.cobertura < 90;
  const hasAlta = data.vacantesPlantilla > 10 || data.vacantesBackup > 12;
  const numFontSize = presentation ? 18 : expanded ? 24 : 14;
  const padding = presentation ? '12px 10px' : expanded ? '14px 16px' : '6px 4px';

  return (
    <div
      style={{
        background: isCritical ? PALETTE.alertFill : PALETTE.surfaceCard,
        border: `1px solid ${isCritical ? PALETTE.red : PALETTE.border}`,
        borderRadius: 'var(--rounded-lg)',
        padding,
        textAlign: 'center',
        transition: 'border-color var(--transition-fast)',
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      {/* Día */}
      <p
        style={{
          fontSize: presentation ? 13 : expanded ? 12 : 9,
          fontWeight: 600,
          color: PALETTE.textMuted,
          margin: '0 0 4px',
          textTransform: 'uppercase',
          letterSpacing: 'var(--type-caption-up-tracking)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {data.day}
      </p>

      {/* % cobertura */}
      <p
        style={{
          fontSize: numFontSize,
          fontWeight: 500,
          margin: '0 0 4px',
          color: isCritical ? PALETTE.red : PALETTE.ink,
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        {data.cobertura.toFixed(1)}%
      </p>

      {/* ✅ Vacantes: whiteSpace nowrap + textOverflow ellipsis, SIN wordBreak */}
      <p
        style={{
          fontSize: presentation ? 13 : expanded ? 12 : 9,
          margin: '0 0 1px',
          fontWeight: 400,
          color: hasAlta ? PALETTE.amber : PALETTE.textMuted,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {data.vacantesPlantilla}P
      </p>
      <p
        style={{
          fontSize: presentation ? 13 : expanded ? 12 : 9,
          margin: 0,
          fontWeight: 400,
          color: hasAlta ? PALETTE.amber : PALETTE.textMuted,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        +{data.vacantesBackup}B
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
}

function ChartHeader({ data, presentation }: ChartHeaderProps) {
  if (!data.length) return null;

  const avgCobertura = data.reduce((s, d) => s + d.cobertura, 0) / data.length;
  const minCobertura = Math.min(...data.map((d) => d.cobertura));
  const isCriticalWeek = minCobertura < 90;

  const labelFontSize = presentation ? 12 : 11;
  const numFontSize = presentation ? 30 : 26;
  const headerFontSize = presentation ? 26 : 18;
  const subFontSize = presentation ? 14 : 11;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: presentation ? 24 : 16,
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      {/* Título */}
      <div>
        <p
          style={{
            fontSize: subFontSize,
            textTransform: 'uppercase',
            letterSpacing: 'var(--type-caption-up-tracking)',
            color: PALETTE.textMuted,
            margin: '0 0 4px',
            fontWeight: 600,
          }}
        >
          {data[0]?.dateIso ?? ''} — {data[data.length - 1]?.dateIso ?? ''}
        </p>
        <h2
          style={{
            fontSize: headerFontSize,
            fontWeight: 400,
            margin: 0,
            color: PALETTE.textPrimary,
            letterSpacing: 'var(--type-display-lg-tracking)',
          }}
        >
          Detalle de Vacantes y Procesos.
        </h2>
      </div>

      {/* KPIs destacados */}
      <div style={{ display: 'flex', gap: presentation ? 28 : 20, alignItems: 'flex-start' }}>
        <div style={{ textAlign: 'right' }}>
          <p
            style={{
              fontSize: labelFontSize,
              color: PALETTE.textMuted,
              margin: '0 0 2px',
              textTransform: 'uppercase',
              letterSpacing: 'var(--type-caption-up-tracking)',
              fontWeight: 600,
            }}
          >
            Cobertura prom.
          </p>
          <p style={{ fontSize: numFontSize, fontWeight: 400, margin: 0, color: PALETTE.ink }}>
            {avgCobertura.toFixed(1)}%
          </p>
        </div>

        {isCriticalWeek && (
          <>
            <div
              style={{
                width: 1,
                height: presentation ? 48 : 36,
                background: PALETTE.border,
                alignSelf: 'center',
              }}
            />
            <div style={{ textAlign: 'right' }}>
              <p
                style={{
                  fontSize: labelFontSize,
                  color: PALETTE.red,
                  margin: '0 0 2px',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--type-caption-up-tracking)',
                  fontWeight: 600,
                }}
              >
                Mín. cobertura
              </p>
              <p
                style={{
                  fontSize: numFontSize,
                  fontWeight: 400,
                  margin: 0,
                  color: PALETTE.red,
                }}
              >
                {minCobertura.toFixed(1)}%
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
    <div
      role="img"
      aria-label="Sin datos disponibles"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        color: PALETTE.textMuted,
        fontSize: 14,
        fontWeight: 400,
      }}
    >
      <svg
        width={32}
        height={32}
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
  ariaLabel = 'Gráfica de vacantes plantilla, vacantes backup y cobertura por día de la semana',
  variant = 'default',
  onClick,
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
          typeof d.cobertura === 'number' &&
          !Number.isNaN(d.vacantesPlantilla) &&
          !Number.isNaN(d.vacantesBackup) &&
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
    const todayIso = new Date().toISOString().slice(0, 10);
    const todayCard = chartData.find((d) => d.dateIso?.slice(0, 10) === todayIso);
    return todayCard ? [todayCard] : [chartData[chartData.length - 1]];
  }, [chartData, isMobile, presentation]);

  const coberturaMin = isEmpty
    ? 0
    : Math.min(...chartData.map((d) => d.cobertura));
  const yRightMin = Math.floor(Math.min(coberturaMin, 90) / 10) * 10;
  const yRightMax = 110;

  return (
    <figure
      aria-label={ariaLabel}
      aria-describedby={descId}
      style={{
        width: '100%',
        margin: 'var(--spacing-lg) 0',
        display: 'block',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        background: PALETTE.surface,
        borderRadius: presentation ? 'var(--rounded-xl)' : 'var(--rounded-lg)',
        border: `1px solid ${PALETTE.border}`,
        padding: presentation ? '28px 32px 24px' : '16px 12px 14px',
        boxSizing: 'border-box',
        fontFamily: 'var(--font-body)',
        overflow: 'hidden',
      }}
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
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          whiteSpace: 'nowrap',
        }}
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
          <ChartHeader data={chartData} presentation={presentation} />

          <CustomLegend
            presentation={presentation}
            payload={[
              { value: 'Vacantes Plantilla', color: PALETTE.red, dataKey: 'vacantesPlantilla' },
              { value: 'Vacantes Backup', color: PALETTE.amber, dataKey: 'vacantesBackup' },
              { value: 'Cobertura %', color: PALETTE.ink, dataKey: 'cobertura' },
            ]}
          />

          <div
            style={{
              background: PALETTE.surfaceCard,
              borderRadius: 'var(--rounded-lg)',
              border: `1px solid ${PALETTE.border}`,
              padding: presentation ? '20px 16px 12px' : '8px 4px 6px',
            }}
          >
            <ResponsiveContainer width="100%" height={chartHeight}>
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

                <Legend content={() => null} />

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

                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cobertura"
                  name="Cobertura %"
                  stroke={PALETTE.ink}
                  strokeWidth={LINE_STROKE_WIDTH}
                  dot={{
                    r: DOT_REST_RADIUS,
                    fill: PALETTE.surfaceCard,
                    stroke: PALETTE.ink,
                    strokeWidth: presentation ? 2.5 : 2,
                  }}
                  activeDot={{ r: DOT_ACTIVE_RADIUS, strokeWidth: 0, fill: PALETTE.ink }}
                  isAnimationActive
                  animationDuration={800}
                  animationEasing="ease-out"
                  animationBegin={200}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {presentation && (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: `repeat(${visibleCards.length}, minmax(0, 1fr))`,
                          gap: 12,
                          marginTop: 16,
                          width: '100%',
                          minWidth: 0,
                        }}
                      >
                        {visibleCards.map((d) => (
                          <DayCard
                            key={d.dateIso}
                            data={d}
                            presentation={presentation}
                            expanded={false}
                          />
                        ))}
                      </div>
                    )}

          <p
            style={{
              fontSize: presentation ? 13 : 11,
              color: PALETTE.textMuted,
              margin: `${presentation ? 14 : 10}px 0 0`,
              textAlign: 'right',
              fontWeight: 400,
            }}
          >
            KPI Reclutamiento
          </p>
        </>
      )}
    </figure>
  );
}
