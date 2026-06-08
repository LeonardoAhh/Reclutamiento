/**
 * KpiHeroChart.tsx
 * Gráfica compuesta (Área + Línea) para el dashboard de KPIs de Reclutamiento.
 * Muestra vacantes plantilla, vacantes backup y cobertura % por día de la semana.
 *
 * Dependencias: recharts
 * Tokens requeridos en el sistema de diseño:
 *   --color-canvas, --color-surface-card, --color-hairline,
 *   --color-ink, --color-muted, --color-primary,
 *   --color-error, --color-accent-amber,
 *   --radius-md
 */

import { useMemo, useId } from 'react';
import {
  ResponsiveContainer,
  Area,
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
  /** Abreviación del día: "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom" */
  day: string;
  /** Fecha en formato ISO 8601, ej: "2025-01-13" */
  dateIso: string;
  /** Número de vacantes activas en plantilla principal */
  vacantesPlantilla: number;
  /** Número de vacantes activas como respaldo */
  vacantesBackup: number;
  /** Porcentaje de cobertura de personal (0–100+) */
  cobertura: number;
}

interface KpiHeroChartProps {
  data: DailyKpiData[];
  /** Altura del chart en px. Default: 320 */
  height?: number;
  /** Etiqueta accesible para lectores de pantalla */
  ariaLabel?: string;
  /** Variante visual para diferentes contextos de visualización */
  variant?: 'default' | 'presentation';
  /** Handler opcional al hacer click en la gráfica */
  onClick?: () => void;
}

// ─────────────────────────────────────────────
// Constantes de presentación (sin colores hardcodeados)
// ─────────────────────────────────────────────

// (El tamaño base de fuentes y trazos ahora se calcula dinámicamente)

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
}

function CustomTooltip({ active, payload, label }: CustomTooltipInternalProps) {
  if (!active || !payload?.length) return null;

  return (
    <div
      role="tooltip"
      style={{
        backgroundColor: 'var(--color-surface-card)',
        border: '1px solid var(--color-hairline)',
        borderRadius: 'var(--radius-md, 8px)',
        boxShadow: '0 4px 16px var(--color-shadow-soft, color-mix(in srgb, var(--color-ink) 8%, transparent))',
        padding: '10px 14px',
        fontFamily: 'inherit',
        minWidth: 160,
      }}
    >
      {/* Día */}
      <p
        style={{
          margin: '0 0 8px',
          fontSize: 'inherit',
          fontWeight: 600,
          color: 'var(--color-ink)',
          letterSpacing: '0.02em',
        }}
      >
        {label}
      </p>

      {/* Filas de datos */}
      {payload.map((entry) => {
        const isPercent = entry.dataKey === 'cobertura';
        const valor = isPercent
          ? `${entry.value.toFixed(1)}%`
          : entry.value.toLocaleString('es-MX');

        return (
          <p
            key={entry.dataKey}
            style={{
              margin: '4px 0 0',
              fontSize: 'inherit',
              color: 'var(--color-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {/* Indicador de color accesible */}
            <span
              aria-hidden="true"
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: entry.color,
                flexShrink: 0,
              }}
            />
            <span style={{ color: 'var(--color-ink-secondary, var(--color-muted))' }}>
              {entry.name}:
            </span>{' '}
            <strong style={{ color: 'var(--color-ink)', fontWeight: 600 }}>{valor}</strong>
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
}

function CustomLegend({ payload }: CustomLegendProps) {
  if (!payload?.length) return null;

  return (
    <ul
      aria-label="Leyenda de la gráfica"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px 20px',
        listStyle: 'none',
        margin: '16px 0 0',
        padding: 0,
        justifyContent: 'center',
      }}
    >
      {payload.map((entry) => (
        <li
          key={entry.dataKey ?? entry.value}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 'inherit',
            color: 'var(--color-muted)',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: entry.color,
              flexShrink: 0,
            }}
          />
          {entry.value}
        </li>
      ))}
    </ul>
  );
}

// ─────────────────────────────────────────────
// Formateadores de ejes
// ─────────────────────────────────────────────

/** Formatea valores del eje Y izquierdo como enteros */
function formatYLeft(value: number): string {
  return Number.isInteger(value) ? value.toString() : '';
}

/** Formatea valores del eje Y derecho como porcentaje */
function formatYRight(value: number): string {
  return `${value}%`;
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
        gap: 8,
        color: 'var(--color-muted)',
        fontSize: 14,
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
  // ID único para el elemento descriptivo del chart (accesibilidad)
  const descId = useId();

  const presentation = variant === 'presentation';

  const chartHeight = height ?? (presentation ? 540 : 320);

  const TICK_FONT_SIZE = presentation ? 18 : 12;

  const DOT_ACTIVE_RADIUS = presentation ? 11 : 6;
  const DOT_REST_RADIUS = presentation ? 7 : 4;

  const LINE_STROKE_WIDTH = presentation ? 5 : 3;
  const AREA_STROKE_WIDTH = presentation ? 3 : 2;

  const AREA_FILL_OPACITY = presentation ? 0.32 : 0.12;

  /**
   * Normaliza los datos de entrada:
   * - Filtra registros con propiedades numéricas inválidas
   * - Redondea cobertura a 1 decimal para evitar ruido visual en los ejes
   */
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
        // Redondear a 1 decimal para evitar flotantes largos en ticks
        cobertura: Math.round(d.cobertura * 10) / 10,
      }));
  }, [data]);

  const isEmpty = chartData.length === 0;

  return (
    <figure
      aria-label={ariaLabel}
      aria-describedby={descId}
      style={{
        width: '100%',
        height: chartHeight,
        margin: 'var(--space-6, 24px) 0',
        display: 'block',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
      }}
      onClick={onClick}
      role={onClick ? "button" : "img"}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {/* Descripción accesible oculta visualmente */}
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
        {ariaLabel}. {isEmpty
          ? 'No hay datos disponibles.'
          : `Semana del ${chartData[0]?.dateIso ?? ''} al ${chartData[chartData.length - 1]?.dateIso ?? ''}.`}
      </figcaption>

      {isEmpty ? (
        <ChartEmpty />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{
              top: presentation ? 32 : 20,
              right: presentation ? 24 : 12,
              left: presentation ? 12 : 0,
              bottom: presentation ? 24 : 12,
            }}
            role="img"
            aria-label={ariaLabel}
          >
            {/* Cuadrícula horizontal únicamente, sin contaminación visual vertical */}
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--color-hairline)"
              strokeOpacity={0.8}
            />

            {/* Eje X: días de la semana */}
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: 'var(--color-muted)',
                fontSize: TICK_FONT_SIZE,
                fontWeight: presentation ? 600 : 400,
                fontFamily: 'inherit',
              }}
              dy={presentation ? 14 : 10}
            />

            {/* Eje Y izquierdo: conteo de vacantes */}
            <YAxis
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: 'var(--color-muted)',
                fontSize: TICK_FONT_SIZE,
                fontWeight: presentation ? 600 : 400,
                fontFamily: 'inherit',
              }}
              tickFormatter={formatYLeft}
              width={presentation ? 55 : 32}
              allowDecimals={false}
            />

            {/* Eje Y derecho: porcentaje de cobertura */}
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: 'var(--color-muted)',
                fontSize: TICK_FONT_SIZE,
                fontWeight: presentation ? 600 : 400,
                fontFamily: 'inherit',
              }}
              tickFormatter={formatYRight}
              width={presentation ? 65 : 40}
              domain={[0, (dataMax: number) => Math.max(100, Math.ceil(dataMax / 10) * 10)]}
            />

            {/* Tooltip con componente personalizado */}
            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: 'var(--color-hairline)',
                strokeWidth: presentation ? 2 : 1,
                strokeDasharray: '3 3',
              }}
            />

            {/* Leyenda con componente personalizado */}
            <Legend
              verticalAlign="top"
              align="center"
              height={presentation ? 50 : 36}
              content={<CustomLegend />}
            />

            {/* ── Área: Vacantes Plantilla ── */}
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="vacantesPlantilla"
              name="Vacantes Plantilla"
              stackId="vacantes"
              stroke="var(--color-error)"
              fill="var(--color-error)"
              fillOpacity={AREA_FILL_OPACITY}
              strokeWidth={AREA_STROKE_WIDTH}
              activeDot={{ r: DOT_ACTIVE_RADIUS, strokeWidth: 0 }}
              dot={false}
              isAnimationActive
              animationDuration={600}
              animationEasing="ease-out"
            />

            {/* ── Área: Vacantes Backup ── */}
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="vacantesBackup"
              name="Vacantes Backup"
              stackId="vacantes"
              stroke="var(--color-accent-amber)"
              fill="var(--color-accent-amber)"
              fillOpacity={AREA_FILL_OPACITY}
              strokeWidth={AREA_STROKE_WIDTH}
              activeDot={{ r: DOT_ACTIVE_RADIUS, strokeWidth: 0 }}
              dot={false}
              isAnimationActive
              animationDuration={600}
              animationEasing="ease-out"
              animationBegin={100}
            />

            {/* ── Línea: Cobertura % ── */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cobertura"
              name="Cobertura %"
              stroke="var(--color-primary)"
              strokeWidth={LINE_STROKE_WIDTH}
              dot={{
                r: DOT_REST_RADIUS,
                fill: 'var(--color-canvas)',
                stroke: 'var(--color-primary)',
                strokeWidth: presentation ? 3 : 2,
              }}
              activeDot={{ r: DOT_ACTIVE_RADIUS, strokeWidth: 0 }}
              isAnimationActive
              animationDuration={800}
              animationEasing="ease-out"
              animationBegin={200}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </figure>
  );
}
