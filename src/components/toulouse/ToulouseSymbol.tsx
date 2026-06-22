/**
 * Símbolo Toulouse-Piéron: cuadro con un guion (cola) en una de 8
 * orientaciones. `highlight` dibuja un anillo para la plantilla de corrección.
 */
interface Props {
  orientation: number;
  /** Tamaño fijo en px (leyenda). Si se omite, el símbolo llena su celda. */
  size?: number;
  highlight?: boolean;
}

// [x1, y1, x2, y2] de la cola, en el viewBox 0 0 20 20 (cuadro 5..15).
const TAILS: Record<number, [number, number, number, number]> = {
  0: [10, 5, 10, 1], // N
  1: [15, 5, 19, 1], // NE
  2: [15, 10, 19, 10], // E
  3: [15, 15, 19, 19], // SE
  4: [10, 15, 10, 19], // S
  5: [5, 15, 1, 19], // SW
  6: [5, 10, 1, 10], // W
  7: [5, 5, 1, 1], // NW
};

export function ToulouseSymbol({ orientation, size, highlight = false }: Props) {
  const tail = TAILS[orientation] ?? TAILS[0];
  const dim = size != null ? `${size}` : '100%';
  return (
    <svg
      className={`tp-symbol${highlight ? ' tp-symbol--hl' : ''}`}
      width={dim}
      height={dim}
      viewBox="0 0 20 20"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      {highlight && <circle className="tp-symbol__ring" cx="10" cy="10" r="9" />}
      <rect className="tp-symbol__box" x="5" y="5" width="10" height="10" />
      <line className="tp-symbol__tail" x1={tail[0]} y1={tail[1]} x2={tail[2]} y2={tail[3]} />
    </svg>
  );
}
