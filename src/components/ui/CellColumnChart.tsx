import { useMemo, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { TooltipSurface } from '@/components/ui/Tooltip';
import './CellColumnChart.css';

/** Máximo de eje redondo cuyos cuartos también caen en números redondos. */
function niceMax(max: number): number {
  if (!(max > 0)) return 1;
  const power = 10 ** Math.floor(Math.log10(max));
  for (const step of [1, 1.2, 1.6, 2, 2.4, 3, 4, 5, 6, 8, 10]) {
    if (step * power >= max) return step * power;
  }
  return 10 * power;
}

/** Celdas encendidas por columna; un valor positivo nunca deja la columna vacía. */
function cellLevels(values: readonly number[], top: number, rows: number): number[] {
  return values.map((value) =>
    value <= 0 ? 0 : Math.min(rows, Math.max(1, Math.round((value / top) * rows))),
  );
}

const AXIS_FRACTIONS = [1, 0.75, 0.5, 0.25] as const;
/** A partir de aquí el tooltip se voltea para no salirse por el borde. */
const FLIP_AT_PERCENT = 66;
/** Sin filas dadas, la rejilla busca que cada celda valga una unidad. */
const MIN_ROWS = 4;
const MAX_ROWS = 16;

export interface CellColumnChartProps {
  values: readonly number[];
  /** Texto completo de cada columna, para el tooltip y la descripción. */
  labels: readonly string[];
  /** Texto bajo cada columna. */
  ticks: readonly string[];
  /** Sin valor, se deriva del máximo para que cada celda valga una unidad. */
  rows?: number;
  /** Color de las celdas encendidas. */
  accent: string;
  format?: (value: number) => string;
  /** Nombre accesible del gráfico. */
  label: string;
  /** Al cambiar vuelve a lanzar la cascada; identifica la serie visible. */
  revision: string;
  id?: string;
}

/**
 * Gráfica de columnas de celdas: cada columna es un periodo y se llena hasta su
 * valor. Apuntar una columna la destaca, baja una hairline y abre el tooltip;
 * cambiar de serie relanza la cascada diagonal. Toda posición es porcentual,
 * así que el gráfico no lee el layout ni necesita medir nada.
 */
export function CellColumnChart({
  values,
  labels,
  ticks,
  rows,
  accent,
  format = (value: number) => String(value),
  label,
  revision,
  id,
}: CellColumnChartProps) {
  const [active, setActive] = useState(-1);
  const top = useMemo(() => niceMax(Math.max(0, ...values)), [values]);
  const gridRows = rows ?? Math.min(MAX_ROWS, Math.max(MIN_ROWS, Math.round(top)));
  const levels = useMemo(() => cellLevels(values, top, gridRows), [values, top, gridRows]);
  const count = values.length;

  if (count === 0) return null;

  const position = ((Math.max(active, 0) + 0.5) / count) * 100;
  const reading = active >= 0;

  function onPlotKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      setActive(-1);
      return;
    }
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const step = event.key === 'ArrowRight' ? 1 : -1;
    setActive((current) => {
      if (current < 0) return step > 0 ? 0 : count - 1;
      return Math.min(count - 1, Math.max(0, current + step));
    });
  }

  return (
    <div
      className="cell-chart"
      data-reading={reading ? '' : undefined}
      style={{ '--cell-chart-accent': accent } as CSSProperties}
    >
      <div className="cell-chart__axis" aria-hidden="true">
        {AXIS_FRACTIONS.map((fraction) => (
          <span key={fraction} style={{ insetBlockStart: `${(1 - fraction) * 100}%` }}>
            {format(top * fraction)}
          </span>
        ))}
      </div>

      <div
        id={id}
        className="cell-chart__plot"
        role="img"
        tabIndex={0}
        aria-label={`${label}. ${labels.map((text, index) => `${text}: ${format(values[index])}`).join('. ')}`}
        onKeyDown={onPlotKeyDown}
        onPointerLeave={() => setActive(-1)}
        onBlur={() => setActive(-1)}
      >
        {AXIS_FRACTIONS.map((fraction) => (
          <span
            key={fraction}
            className="cell-chart__rule"
            style={{ insetBlockStart: `${(1 - fraction) * 100}%` }}
            aria-hidden="true"
          />
        ))}

        <div className="cell-chart__columns" key={revision} aria-hidden="true">
          {levels.map((level, column) => (
            <div
              key={labels[column]}
              className="cell-chart__column"
              data-active={column === active ? '' : undefined}
              onPointerEnter={() => setActive(column)}
              onPointerDown={() => setActive(column)}
            >
              {Array.from({ length: gridRows }, (_, row) => (
                <span
                  key={row}
                  className="cell-chart__cell"
                  data-on={row < level ? '' : undefined}
                  data-cap={row === level - 1 && level < gridRows ? '' : undefined}
                  style={{ '--cell-col': column, '--cell-row': row } as CSSProperties}
                />
              ))}
            </div>
          ))}
        </div>

        <span
          className="cell-chart__cursor"
          style={{ insetInlineStart: `${position}%` }}
          aria-hidden="true"
        />
        <TooltipSurface
          variant="chart"
          className={`cell-chart__tip${position > FLIP_AT_PERCENT ? ' cell-chart__tip--flip' : ''}`}
          style={{ insetInlineStart: `${position}%` }}
          aria-hidden="true"
        >
          <p className="tooltip-surface__title tooltip-surface__title--eyebrow">
            {reading ? labels[active] : ''}
          </p>
          <p className="tooltip-surface__row">
            <span className="cell-chart__tip-swatch" />
            <strong>{reading ? format(values[active]) : ''}</strong>
          </p>
        </TooltipSurface>
      </div>

      <div className="cell-chart__ticks" aria-hidden="true">
        {ticks.map((tick, index) => (
          <span key={tick} style={{ insetInlineStart: `${((index + 0.5) / ticks.length) * 100}%` }}>
            {tick}
          </span>
        ))}
      </div>
    </div>
  );
}
