import { useMemo } from 'react';
import { ToulouseSymbol } from './ToulouseSymbol';
import {
  generateGrid,
  isModel,
  TOULOUSE_CONSIGNA,
  TOULOUSE_CANDIDATE_STEPS,
  type ToulouseConfig,
} from '@/lib/toulouse';

export interface ToulouseSheetData {
  folio: string;
  candidato: string;
  puesto: string;
  edad: string;
  fecha: string; // ISO yyyy-mm-dd
  evaluador: string;
  tiempoLimiteMin: string;
}

interface Props {
  data: ToulouseSheetData;
  config: ToulouseConfig;
  seed: number;
  variant: 'candidato' | 'correccion';
  /** Tamaño de celda en px (debe permitir que `cols` quepan en carta). */
  cell?: number;
}

function fmtDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

/** Campo con línea para rellenar a mano si va vacío. */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="tp-field">
      <span className="tp-field__label">{label}</span>
      <span className="tp-field__value">{value || '\u00A0'}</span>
    </div>
  );
}

/**
 * Hoja imprimible (tamaño carta) de la prueba Toulouse-Piéron.
 * `variant='candidato'` → rejilla limpia para tachar.
 * `variant='correccion'` → mismos símbolos con los objetivos resaltados.
 */
export function ToulouseSheet({ data, config, seed, variant, cell = 15 }: Props) {
  const grid = useMemo(() => generateGrid(seed, config), [seed, config]);
  const isKey = variant === 'correccion';

  const columns = isKey
    ? `2.4ch repeat(${config.cols}, var(--tp-cell)) 3ch`
    : `2.4ch repeat(${config.cols}, var(--tp-cell))`;

  return (
    <article
      className={`tp-sheet tp-sheet--${variant}`}
      style={{ ['--tp-cell' as string]: `${cell}px` } as React.CSSProperties}
      aria-label={
        isKey ? 'Plantilla de corrección Toulouse-Piéron' : 'Hoja del candidato Toulouse-Piéron'
      }
    >
      <header className="tp-sheet__head">
        <div className="tp-sheet__titles">
          <h2 className="tp-sheet__title">Prueba de Atención · Toulouse-Piéron</h2>
          <p className="tp-sheet__subtitle">
            {isKey ? 'Plantilla de corrección' : 'Hoja de aplicación'}
            {data.folio ? ` · Folio ${data.folio}` : ''}
          </p>
        </div>

        <div className="tp-sheet__fields">
          <Field label="Nombre" value={data.candidato} />
          <Field label="Puesto solicitado" value={data.puesto} />
          <Field label="Edad" value={data.edad} />
          <Field label="Fecha" value={fmtDate(data.fecha)} />
          <Field label="Evaluador" value={data.evaluador} />
          <Field
            label="Tiempo límite"
            value={data.tiempoLimiteMin ? `${data.tiempoLimiteMin} min` : ''}
          />
        </div>
      </header>

      <section className="tp-sheet__models" aria-label="Modelos a tachar">
        <span className="tp-sheet__models-label">
          Tache los signos iguales a los modelos:
        </span>
        <div className="tp-sheet__models-list">
          {config.models.map((m) => (
            <span key={m} className="tp-sheet__model">
              <ToulouseSymbol orientation={m} size={20} highlight={isKey} />
            </span>
          ))}
        </div>
        {!isKey && (
          <p className="tp-sheet__instructions">
            <strong>Instrucciones:</strong> «{TOULOUSE_CONSIGNA}»
          </p>
        )}
      </section>

      {!isKey && (
        <ol className="tp-sheet__rules" aria-label="Instrucciones para el candidato">
          {TOULOUSE_CANDIDATE_STEPS.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      )}

      {isKey && (
        <section className="tp-score" aria-label="Calificación">
          <div className="tp-score__item">
            <span className="tp-score__label">Signos modelo (objetivos)</span>
            <span className="tp-score__value">{grid.targets}</span>
          </div>
          <div className="tp-score__item">
            <span className="tp-score__label">Aciertos (A)</span>
            <span className="tp-score__blank">&nbsp;</span>
          </div>
          <div className="tp-score__item">
            <span className="tp-score__label">Omisiones (O)</span>
            <span className="tp-score__blank">&nbsp;</span>
          </div>
          <div className="tp-score__item">
            <span className="tp-score__label">Errores (E)</span>
            <span className="tp-score__blank">&nbsp;</span>
          </div>
          <div className="tp-score__item">
            <span className="tp-score__label">Índice (A − E − O)</span>
            <span className="tp-score__blank">&nbsp;</span>
          </div>
          <p className="tp-score__formula">
            Puntuación directa: <strong>PD = A − (E + O)</strong>
          </p>
        </section>
      )}

      <section
        className="tp-grid"
        role="img"
        aria-label={`Rejilla de ${config.rows} renglones por ${config.cols} columnas`}
      >
        {grid.cells.map((row, r) => (
          <div className="tp-grid__row" key={r} role="presentation" style={{ gridTemplateColumns: columns }}>
            <span className="tp-grid__rownum">{r + 1}</span>
            {row.map((orientation, c) => {
              const hit = isKey && isModel(orientation, config.models);
              return (
                <span
                  className={`tp-grid__cell${hit ? ' tp-grid__cell--hit' : ''}`}
                  key={c}
                >
                  <ToulouseSymbol orientation={orientation} highlight={hit} />
                </span>
              );
            })}
            {isKey && <span className="tp-grid__count">{grid.rowTargets[r]}</span>}
          </div>
        ))}
      </section>

      <footer className="tp-sheet__foot">
        <span>
          {config.rows} × {config.cols} = {config.rows * config.cols} signos
        </span>
        <span>Toulouse-Piéron · Atención y resistencia a la fatiga</span>
      </footer>
    </article>
  );
}
