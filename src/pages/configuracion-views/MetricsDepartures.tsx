import { useId, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { parseDate } from '@/hooks/useIndicadoresStats';
import type { getConfiguracionCopy } from './configuracion-translations';
import './MetricsDepartures.css';

type MetricsCopy = ReturnType<typeof getConfiguracionCopy>['indicators'];

interface Departure {
  numEmpleado: string;
  nombre: string;
  reclutador: string;
  fechaIngreso: string;
  fechaBaja: string;
  dias: number;
}

interface MetricsDeparturesProps {
  items: Departure[];
  copy: MetricsCopy;
  english: boolean;
}

const TARGET_RETENTION_DAYS = 90;

function efficiencyFor(days: number) {
  return Math.min(Math.round(days / TARGET_RETENTION_DAYS * 100), 100);
}

function shortDate(date: string, english: boolean) {
  const parsed = parseDate(date);
  return Number.isNaN(parsed.getTime())
    ? date
    : new Intl.DateTimeFormat(english ? 'en-US' : 'es-MX', { day: 'numeric', month: 'short' }).format(parsed);
}

function EfficiencyBadge({ days, copy }: { days: number; copy: MetricsCopy }) {
  const value = efficiencyFor(days);
  const variant = value >= 80 ? 'success' : value >= 30 ? 'amber' : 'error';
  return <Badge variant={variant}>{copy.efficiency} {value}%</Badge>;
}

export function MetricsDepartures({ items, copy, english }: MetricsDeparturesProps) {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  if (items.length === 0) return null;

  return (
    <section className="indicadores-card metrics-departures" aria-labelledby={`${listId}-title`}>
      <div className="indicadores-table-header">
        <h2 id={`${listId}-title`}>{copy.inactiveStaffDetails} ({items.length})</h2>
        {items.length > 3 && (
          <button type="button" className="btn-secondary metrics-departures__expand"
            data-short-list={items.length <= 6} aria-controls={listId} aria-expanded={expanded}
            onClick={() => setExpanded((current) => !current)}>
            {expanded ? copy.showLess : `${copy.showAll} (${items.length})`}
          </button>
        )}
      </div>
      <div id={listId}>
        <div className="metrics-departures__table-wrap">
          <table className="indicadores-table data-table metrics-departures__table">
            <thead>
              <tr>
                <th scope="col">{copy.employeeNumber}</th>
                <th scope="col">{copy.employee}</th>
                <th scope="col">{copy.recruiter}</th>
                <th scope="col">{copy.hireDate}</th>
                <th scope="col">{copy.leavingDate}</th>
                <th scope="col">{copy.averageDays}</th>
                <th scope="col">{copy.efficiency}</th>
              </tr>
            </thead>
            <tbody className={expanded ? '' : 'metrics-departures__collapsed'}>
              {items.map((item, index) => (
                <tr key={`${item.numEmpleado}-${item.fechaBaja}-${index}`}>
                  <td>{item.numEmpleado ? `#${item.numEmpleado}` : '—'}</td>
                  <th scope="row">{item.nombre}</th>
                  <td>{item.reclutador}</td>
                  <td>{shortDate(item.fechaIngreso, english)}</td>
                  <td>{shortDate(item.fechaBaja, english)}</td>
                  <td>{item.dias}</td>
                  <td><EfficiencyBadge days={item.dias} copy={copy} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className={`metrics-departures__cards${expanded ? '' : ' metrics-departures__collapsed'}`}>
          {items.map((item, index) => (
            <li key={`${item.numEmpleado}-${item.fechaBaja}-${index}`} className="metrics-departures__card">
              <div className="metrics-departures__card-heading">
                <strong>{item.nombre}</strong>
                {item.numEmpleado && <span>#{item.numEmpleado}</span>}
              </div>
              <p>{shortDate(item.fechaIngreso, english)} → {shortDate(item.fechaBaja, english)} · {item.dias} {copy.daysShort} · {item.reclutador}</p>
              <EfficiencyBadge days={item.dias} copy={copy} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
