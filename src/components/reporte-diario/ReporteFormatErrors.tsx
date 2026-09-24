import { ChevronDown, FileWarning, X } from "lucide-react";

interface ReporteFormatErrorsProps {
  errors: string[];
  onDismiss: () => void;
}

interface ErrorGroup {
  key: string;
  message: string;
  rows: number[];
  occurrences: number;
}

const INDEXED_ERROR_PATTERN = /^(?:Fila|Elemento)\s+(\d+)(?::\s*|\s+)(.+)$/i;

function groupErrors(errors: string[]): ErrorGroup[] {
  const groups = new Map<string, ErrorGroup>();

  errors.forEach((error) => {
    const match = error.match(INDEXED_ERROR_PATTERN);
    const message = (match?.[2] ?? error).trim();
    const key = message.toLocaleLowerCase("es-MX");
    const current = groups.get(key) ?? {
      key,
      message,
      rows: [],
      occurrences: 0,
    };

    current.occurrences += 1;
    if (match) current.rows.push(Number(match[1]));
    groups.set(key, current);
  });

  return Array.from(groups.values());
}

function formatRowRanges(rows: number[]): string {
  const sortedRows = Array.from(new Set(rows)).sort((a, b) => a - b);
  const ranges: string[] = [];
  let rangeStart = sortedRows[0];
  let rangeEnd = sortedRows[0];

  for (let index = 1; index <= sortedRows.length; index += 1) {
    const row = sortedRows[index];
    if (row === rangeEnd + 1) {
      rangeEnd = row;
      continue;
    }

    ranges.push(
      rangeStart === rangeEnd ? String(rangeStart) : `${rangeStart}–${rangeEnd}`,
    );
    rangeStart = row;
    rangeEnd = row;
  }

  return ranges.join(", ");
}

export function ReporteFormatErrors({
  errors,
  onDismiss,
}: ReporteFormatErrorsProps) {
  const groups = groupErrors(errors);
  const affectedRows = new Set(groups.flatMap((group) => group.rows)).size;
  const totalLabel = affectedRows > 0
    ? `${affectedRows} ${affectedRows === 1 ? "fila requiere" : "filas requieren"} corrección.`
    : `${errors.length} ${errors.length === 1 ? "problema requiere" : "problemas requieren"} atención.`;

  return (
    <section
      className="reporte-status-banner error reporte-errors"
      role="alert"
      data-testid="errors-banner"
      aria-labelledby="reporte-format-errors-title"
    >
      <FileWarning
        size={16}
        className="reporte-errors__icon"
        aria-hidden="true"
      />
      <div className="reporte-errors__content">
        <div className="reporte-errors__header">
          <div>
            <h2 id="reporte-format-errors-title">Errores de formato</h2>
            <p className="reporte-errors__summary">
              No pudimos cargar el reporte. {totalLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="reporte-iconbtn"
            aria-label="Cerrar errores"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <ul className="reporte-errors__groups">
          {groups.map((group) => (
            <li key={group.key} className="reporte-errors__group">
              <div className="reporte-errors__group-heading">
                <strong>{group.message}</strong>
                <span>
                  {group.occurrences}{" "}
                  {group.rows.length > 0
                    ? group.occurrences === 1 ? "fila" : "filas"
                    : group.occurrences === 1 ? "problema" : "problemas"}
                </span>
              </div>
              {group.rows.length > 0 && (
                <details className="reporte-errors__details">
                  <summary>
                    <span>Ver filas afectadas</span>
                    <ChevronDown
                      size="1em"
                      className="reporte-errors__details-icon"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="reporte-errors__rows">
                    Filas: {formatRowRanges(group.rows)}
                  </p>
                </details>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
