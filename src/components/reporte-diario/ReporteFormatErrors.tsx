import { ChevronDown, FileWarning, X } from "lucide-react";
import { useReportLocale } from "./useReportLocale";

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
  const { en, copy } = useReportLocale();
  const groups = groupErrors(errors);
  const affectedRows = new Set(groups.flatMap((group) => group.rows)).size;
  const totalLabel = affectedRows > 0
    ? en
      ? `${affectedRows} ${affectedRows === 1 ? "row needs" : "rows need"} correction.`
      : `${affectedRows} ${affectedRows === 1 ? "fila requiere" : "filas requieren"} corrección.`
    : en
      ? `${errors.length} ${errors.length === 1 ? "issue needs" : "issues need"} attention.`
      : `${errors.length} ${errors.length === 1 ? "problema requiere" : "problemas requieren"} atención.`;

  const translateError = (message: string) => {
    if (!en) return message;
    if (message === "mes inválido, use YYYY-MM") return "invalid month; use YYYY-MM";
    if (message === "no es un objeto válido") return "is not a valid object";
    if (message === "El contenido JSON debe contener una lista de registros.") return "The JSON content must contain a list of records.";
    if (message.startsWith("falta ")) {
      const field = message.slice(6);
      return `missing ${({ numero_empleado: "employee number", nombre: "name", departamento: "department", "área": "area" } as Record<string, string>)[field] ?? field}`;
    }
    return message;
  };

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
            <h2 id="reporte-format-errors-title">{copy("Errores de formato", "Format errors")}</h2>
            <p className="reporte-errors__summary">
              {copy("No pudimos cargar el reporte.", "We could not load the report.")} {totalLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="reporte-iconbtn"
            aria-label={copy("Cerrar errores", "Dismiss errors")}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <ul className="reporte-errors__groups">
          {groups.map((group) => (
            <li key={group.key} className="reporte-errors__group">
              <div className="reporte-errors__group-heading">
                <strong>{translateError(group.message)}</strong>
                <span>
                  {group.occurrences}{" "}
                  {group.rows.length > 0
                    ? group.occurrences === 1 ? copy("fila", "row") : copy("filas", "rows")
                    : group.occurrences === 1 ? copy("problema", "issue") : copy("problemas", "issues")}
                </span>
              </div>
              {group.rows.length > 0 && (
                <details className="reporte-errors__details">
                  <summary>
                    <span>{copy("Ver filas afectadas", "View affected rows")}</span>
                    <ChevronDown
                      size="1em"
                      className="reporte-errors__details-icon"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="reporte-errors__rows">
                    {copy("Filas", "Rows")}: {formatRowRanges(group.rows)}
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
