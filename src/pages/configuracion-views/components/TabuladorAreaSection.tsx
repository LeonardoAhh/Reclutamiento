import { HighlightText } from '../HighlightText';

export interface PuestoTabulador {
  ÁREA: string;
  PUESTO: string;
  TIPO: string;
  SALARIO_DIARIO: string;
  SUELDO_MENSUAL: string;
}

interface TabuladorAreaSectionProps {
  area: string;
  puestos: PuestoTabulador[];
  searchTokens: string[];
}

export function TabuladorAreaSection({ area, puestos, searchTokens }: TabuladorAreaSectionProps) {
  const areaId = `tabulador-area-${area.toLocaleLowerCase('es').replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <section className="tabulador-area-section" aria-labelledby={areaId}>
      <header className="tabulador-area-header">
        <h2 id={areaId} className="tabulador-area-title type-heading-sm text-ink">
          <HighlightText text={area} tokens={searchTokens} />
        </h2>
        <span className="tabulador-area-count type-caption-sm text-muted">
          {puestos.length} puesto{puestos.length === 1 ? '' : 's'}
        </span>
      </header>

      <div className="tabulador-desktop-table">
        <table className="tabulador-table type-body-sm">
          <caption className="sr-only">Salarios vigentes del área {area}</caption>
          <colgroup>
            <col className="tabulador-table__position-column" />
            <col className="tabulador-table__amount-column" span={2} />
          </colgroup>
          <thead className="type-caption-sm text-muted">
            <tr>
              <th scope="col">Puesto</th>
              <th scope="col">Salario diario (2026)</th>
              <th scope="col">Sueldo mensual (2026)</th>
            </tr>
          </thead>
          <tbody>
            {puestos.map((puesto) => (
              <tr key={`${puesto.ÁREA}-${puesto.PUESTO}-${puesto.TIPO}`}>
                <th scope="row">
                  <span className="tabulador-position-name type-body-sm-strong text-ink">
                    <HighlightText text={puesto.PUESTO} tokens={searchTokens} />
                  </span>
                  <span className="type-caption-sm text-muted">
                    <HighlightText text={puesto.TIPO} tokens={searchTokens} />
                  </span>
                </th>
                <td className="tabulador-amount text-charcoal">{puesto.SALARIO_DIARIO}</td>
                <td className="tabulador-amount type-body-sm-strong text-ink">{puesto.SUELDO_MENSUAL}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="tabulador-cards" role="list" aria-label={`Salarios del área ${area}`}>
        {puestos.map((puesto) => (
          <li key={`card-${puesto.ÁREA}-${puesto.PUESTO}-${puesto.TIPO}`} className="tabulador-card">
            <div className="tabulador-card__head">
              <span className="tabulador-position-name type-body-sm-strong text-ink">
                <HighlightText text={puesto.PUESTO} tokens={searchTokens} />
              </span>
              <span className="tabulador-card__tipo type-caption-sm text-muted">
                <HighlightText text={puesto.TIPO} tokens={searchTokens} />
              </span>
            </div>
            <dl className="tabulador-card__figures">
              <div className="tabulador-card__figure">
                <dt className="type-caption-sm text-muted">Salario diario 2026</dt>
                <dd className="tabulador-card__value tabulador-amount type-body-sm text-charcoal">{puesto.SALARIO_DIARIO}</dd>
              </div>
              <div className="tabulador-card__figure">
                <dt className="type-caption-sm text-muted">Sueldo mensual 2026</dt>
                <dd className="tabulador-card__value tabulador-amount type-body-sm-strong text-ink">{puesto.SUELDO_MENSUAL}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}
