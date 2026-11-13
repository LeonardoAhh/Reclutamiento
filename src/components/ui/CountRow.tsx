import type { ReactNode } from 'react';
import './CountRow.css';

export interface CountRowProps {
  title: string;
  /** Distintivo junto al título, como Starlite. */
  badge?: ReactNode;
  /** Línea secundaria: turno, fecha o lo que distinga al grupo. */
  meta?: ReactNode;
  count: number;
  /** Unidad de la cifra; se escribe a su lado, no debajo. */
  unit?: string;
  /** `negative` tiñe la cifra para lecturas que restan, como las bajas. */
  tone?: 'neutral' | 'negative';
}

/**
 * Renglón de recuento: un grupo y cuántas veces ocurre. Sustituye a listar la
 * misma fila repetida, así que el detalle y su resumen dejan de ser dos cosas.
 * Va dentro de una `<ul class="count-row-list">`.
 */
export function CountRow({ title, badge, meta, count, unit, tone = 'neutral' }: CountRowProps) {
  return (
    <li className="count-row" data-tone={tone}>
      <span className="count-row__heading">
        <span className="count-row__title">
          <span>{title}</span>
          {badge}
        </span>
        {meta && <span className="count-row__meta">{meta}</span>}
      </span>
      <span className="count-row__count">
        <span className="count-row__value">{count}</span>
        {unit && <span className="count-row__unit">{unit}</span>}
      </span>
    </li>
  );
}
