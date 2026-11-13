import type { CSSProperties, ReactNode } from 'react';
import './MetricTile.css';

export type MetricTileTone = 'neutral' | 'good' | 'bad';

export interface MetricTileProps {
  label: string;
  value: ReactNode;
  /** Marca a la izquierda de la etiqueta: icono o muestra de color. */
  mark?: ReactNode;
  /** Nota bajo la cifra; el tono colorea solo su fragmento destacado. */
  note?: ReactNode;
  tone?: MetricTileTone;
  /** Apunte alineado al final de la fila de etiqueta. */
  cornerNote?: string;
  /** Color propio de la ficha; tiñe la marca y la cifra al estar activa. */
  accent?: string;
  selected?: boolean;
  /** Con `tab` la ficha forma parte de una lista de pestañas. */
  role?: 'tab';
  controls?: string;
  /** Texto solo para lectores de pantalla que explica qué hace la ficha. */
  description?: string;
  /** El contenedor añade aquí su marco: tarjeta suelta o pestaña de una tira. */
  className?: string;
  onClick: () => void;
}

/**
 * Ficha de métrica: una cifra con su etiqueta y una nota. La comparten las
 * tarjetas de la semana, que abren su detalle, y las pestañas de la gráfica,
 * que cambian la serie visible; el rol decide la semántica, no el aspecto.
 */
export function MetricTile({
  label,
  value,
  mark,
  note,
  tone = 'neutral',
  cornerNote,
  accent,
  selected = false,
  role,
  controls,
  description,
  className,
  onClick,
}: MetricTileProps) {
  const isTab = role === 'tab';

  return (
    <button
      type="button"
      className={className ? `metric-tile ${className}` : 'metric-tile'}
      data-cuelume-tap=""
      data-selected={selected ? '' : undefined}
      role={role}
      aria-selected={isTab ? selected : undefined}
      tabIndex={isTab && !selected ? -1 : undefined}
      aria-controls={controls}
      style={accent ? ({ '--metric-tile-accent': accent } as CSSProperties) : undefined}
      onClick={onClick}
    >
      <span className="metric-tile__head">
        {mark && (
          <span className="metric-tile__mark" aria-hidden="true">
            {mark}
          </span>
        )}
        <span className="metric-tile__label">{label}</span>
      </span>
      <span className="metric-tile__figure">
        <span className="metric-tile__value">{value}</span>
        {cornerNote && <span className="metric-tile__corner">{cornerNote}</span>}
      </span>
      {note && (
        <span className="metric-tile__note" data-tone={tone}>
          {note}
        </span>
      )}
      {description && <span className="sr-only">{description}</span>}
    </button>
  );
}
