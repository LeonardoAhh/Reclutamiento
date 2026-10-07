import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide';
import type { ReporteDiarioSummary } from '@/hooks/useReporteDiario';
import { MorphingIcon } from '@/components/ui/MorphingIcon';
import { useReportLocale } from './useReportLocale';
import { ausentismoTone, buildReportComparison, formatShortMes, getQuarterLabel, TrendDelta } from './comparison-helpers';
import './ReporteDiario.css';
import './ReportComparisonContent.css';

export function ReportComparisonContent({ summaries }: { summaries: ReporteDiarioSummary[] }) {
  const { en, copy } = useReportLocale();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const { rows, prevByMes, quarters } = buildReportComparison(summaries);
  const toggle = (mes: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(mes)) next.delete(mes);
      else next.add(mes);
      return next;
    });
  };
  return (
        <div className="reporte-cmp__body">
          <h2 className="reporte-cmp__heading">{copy("Resumen trimestral", "Quarterly summary")}</h2>
          {quarters.length > 0 && (
            <div className="reporte-cmp__quarters">
              {quarters.map((q) => {
                const avgPct =
                  q.diasDisponibles > 0
                    ? (q.totalAusentismo / q.diasDisponibles) * 100
                    : 0;
                const tone = ausentismoTone(avgPct);
                return (
                  <article
                    key={`${q.year}-Q${q.quarter}`}
                    className="reporte-cmp__quarter"
                  >
                    <header className="reporte-cmp__quarter-header">
                      <h3 className="reporte-cmp__quarter-title">
                        Q{q.quarter} {q.year}
                      </h3>
                      <span className="reporte-cmp__quarter-label">
                        {getQuarterLabel(q.quarter, en)}
                      </span>
                    </header>
                    <strong
                      className={`reporte-cmp__quarter-value reporte-cmp__quarter-value--${tone}`}
                    >
                      {avgPct.toFixed(2)}%
                    </strong>
                  </article>
                );
              })}
            </div>
          )}

          <h2 className="reporte-cmp__heading">{copy("Detalle mensual", "Monthly details")}</h2>
          <div className="reporte-cmp__table-wrap">
            <table className="reporte-cmp__table">
              <caption className="sr-only">{copy("Comparativa mensual", "Monthly comparison")}</caption>
              <thead>
                <tr>
                  <th scope="col">{copy("Mes", "Month")}</th>
                  <th scope="col" className="reporte-cmp__num">
                    {copy("Empleados", "Employees")}
                  </th>
                  <th scope="col" className="reporte-cmp__num">
                    {copy("Días disp.", "Available days")}
                  </th>
                  <th scope="col" className="reporte-cmp__num">
                    {copy("Ausentismo", "Absenteeism")}
                  </th>
                  <th scope="col" className="reporte-cmp__num">
                    {copy("% Ausent.", "Absence %")}
                  </th>
                  <th scope="col" className="reporte-cmp__num">
                    {copy("Incidencias", "Incidents")}
                  </th>
                  <th scope="col" className="reporte-cmp__num">
                    {copy("Tend.", "Trend")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const prev = prevByMes.get(s.mes) ?? null;
                  const incDiff = prev
                    ? s.total_incidencias - prev.total_incidencias
                    : 0;
                  return (
                    <tr key={s.id}>
                      <td className="reporte-cmp__mes">
                        {formatShortMes(s.mes, en)}
                      </td>
                      <td className="reporte-cmp__num">{s.total_empleados}</td>
                      <td className="reporte-cmp__num">{s.dias_disponibles}</td>
                      <td className="reporte-cmp__num">{s.total_ausentismo}</td>
                      <td className="reporte-cmp__num">
                        <span
                          className={`reporte-inc-badge reporte-cmp__absence-badge--${ausentismoTone(s.pct_ausentismo)}`}
                        >
                          {s.pct_ausentismo.toFixed(2)}%
                        </span>
                      </td>
                      <td className="reporte-cmp__num reporte-cmp__strong">
                        {s.total_incidencias}
                      </td>
                      <td className="reporte-cmp__num">
                        {prev ? (
                          <TrendDelta diff={incDiff} />
                        ) : (
                          <span className="reporte-cmp__muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards with inline expand */}
          <ul className="reporte-cmp__cards" aria-label={copy("Comparativa mensual", "Monthly comparison")}>
            {rows.map((s) => {
              const prev = prevByMes.get(s.mes) ?? null;
              const incDiff = prev
                ? s.total_incidencias - prev.total_incidencias
                : 0;
              const ausDiff = prev ? s.pct_ausentismo - prev.pct_ausentismo : 0;
              const isOpenRow = expanded.has(s.mes);
              const detailId = `cmp-detail-${s.mes}`;
              return (
                <li key={s.id} className="reporte-incidents__card">
                  <button
                    type="button"
                    className="reporte-incidents__card-summary"
                    aria-expanded={isOpenRow}
                    aria-controls={detailId}
                    onClick={() => toggle(s.mes)}
                    data-testid={`cmp-card-${s.mes}`}
                  >
                    <span className="reporte-incidents__card-main">
                      <span className="reporte-incidents__card-name">
                        {formatShortMes(s.mes, en)}
                      </span>
                      <span className="reporte-incidents__card-tags">
                        <span className="reporte-chip">
                          {s.total_incidencias} inc.
                        </span>
                        <span
                          className={`reporte-inc-badge reporte-cmp__absence-badge--${ausentismoTone(s.pct_ausentismo)}`}
                        >
                          {s.pct_ausentismo.toFixed(2)}%
                        </span>
                      </span>
                    </span>
                    {prev && <TrendDelta diff={incDiff} />}
                    <MorphingIcon
                      icon={isOpenRow ? ChevronDown : ChevronRight}
                      size="var(--icon-size-sm)"
                      className="reporte-incidents__chevron"
                      aria-hidden="true"
                    />
                  </button>

                  {isOpenRow && (
                    <div
                      id={detailId}
                      className="reporte-incidents__card-detail"
                    >
                      <span className="reporte-incidents__detail-label">
                        {copy("Empleados", "Employees")}
                      </span>
                      <span className="reporte-incidents__detail-value">
                        {s.total_empleados}
                      </span>
                      <span className="reporte-incidents__detail-label">
                        {copy("Días disponibles", "Available days")}
                      </span>
                      <span className="reporte-incidents__detail-value">
                        {s.dias_disponibles}
                      </span>
                      <span className="reporte-incidents__detail-label">
                        {copy("Total ausentismo", "Total absences")}
                      </span>
                      <span className="reporte-incidents__detail-value">
                        {s.total_ausentismo}
                      </span>
                      {prev && (
                        <>
                          <span className="reporte-incidents__detail-label">
                            {copy("Tend. incidencias", "Incident trend")}
                          </span>
                          <span className="reporte-incidents__detail-value">
                            <TrendDelta diff={incDiff} />
                          </span>
                          <span className="reporte-incidents__detail-label">
                            {copy("Tend. ausentismo", "Absenteeism trend")}
                          </span>
                          <span className="reporte-incidents__detail-value">
                            <TrendDelta
                              diff={ausDiff}
                              suffix="%"
                              decimals={2}
                            />
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
  );
}
