import type { AreaDetailRow } from './types';
import { useReportLocale } from './useReportLocale';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';

const INC_TONE: Record<string, 'error' | 'warn' | 'info'> = {
  F: 'error',
  S: 'error',
  I: 'error',
  FJ: 'warn',
  P: 'warn',
  PH: 'warn',
  CT: 'warn',
  TXT: 'warn',
  V: 'info',
};

function IncidenceBadge({ code }: { code: string }) {
  const { incident } = useReportLocale();
  const tone = INC_TONE[code] ?? 'warn';
  const variant: BadgeVariant = tone === 'error' ? 'error' : tone === 'warn' ? 'warning' : 'neutral';

  return (
    <Badge size="compact" variant={variant}>
      {incident(code)}
    </Badge>
  );
}

function getPositionLabel(position: string | undefined) {
  return position ? position.replace(/\s+[A-Z]$/i, '').trim() : '-';
}

export function ReporteAreaDetailList({ rows }: { rows: AreaDetailRow[] }) {
  const { copy } = useReportLocale();

  if (rows.length === 0)
    return (
      <div className="reporte-incidents__empty reporte-incidents__empty--padded">
        <p>{copy('No hay ausencias registradas.', 'No absences recorded.')}</p>
      </div>
    );

  return (
    <ul
      className="reporte-area-detail__list"
      aria-label={copy('Detalle de ausencias por empleado', 'Absences by employee')}
    >
      {rows.map((row) => (
        <li key={row.key} className="reporte-area-detail__card">
          <div className="reporte-area-detail__header">
            <div className="reporte-area-detail__identity">
              <span className="reporte-area-detail__number">
                {copy('Empleado', 'Employee')} {row.numero_empleado}
              </span>
              <h3 className="reporte-area-detail__name">
                {row.nombre || copy('Sin nombre', 'No name')}
              </h3>
            </div>
            <IncidenceBadge code={row.tipo_incidencia} />
          </div>
          <dl className="reporte-area-detail__details">
            <div className="reporte-area-detail__field">
              <dt>{copy('Puesto', 'Position')}</dt>
              <dd>{getPositionLabel(row.puesto)}</dd>
            </div>
            <div className="reporte-area-detail__field">
              <dt>{copy('Turno', 'Shift')}</dt>
              <dd><Badge size="compact" variant="neutral">{row.turno}</Badge></dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );
}
