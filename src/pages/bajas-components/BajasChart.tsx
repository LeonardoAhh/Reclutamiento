import { formatMonthLabel } from '@/lib/dates';
import type { MonthlyRow } from '@/lib/bajas';
import './BajasChart.css';

interface BajasChartProps {
  months: MonthlyRow[];
  chartMax: number;
  year: number;
}

export function BajasChart({ months, chartMax, year }: BajasChartProps) {
  return (
    <section className="bajas-chart-section" aria-label="Bajas vs ingresos por mes">
      <header className="bajas-chart-section__head">
        <h2 className="bajas-chart-section__title">Movimiento mensual</h2>
        <div className="bajas-chart-section__legend">
          <span className="bajas-chart-section__legend-item">
            <span
              className="bajas-chart-section__legend-swatch bajas-chart-section__legend-swatch--bajas"
              aria-hidden="true"
            />
            Bajas
          </span>
          <span className="bajas-chart-section__legend-item">
            <span
              className="bajas-chart-section__legend-swatch bajas-chart-section__legend-swatch--ingresos"
              aria-hidden="true"
            />
            Ingresos
          </span>
        </div>
      </header>
      <div
        className="bajas-chart"
        role="region"
        aria-label={`Gráfica de bajas e ingresos mensuales del año ${year}`}
        tabIndex={0}
      >
        {months.map((m) => {
          const bH = (m.bajas / chartMax) * 100;
          const iH = (m.ingresos / chartMax) * 100;
          const label = formatMonthLabel(m.month);
          return (
            <div key={m.month} className="bajas-chart__col">
              <div className="bajas-chart__bars">
                <div
                  className="bajas-chart__bar bajas-chart__bar--bajas"
                  style={{ height: `${bH}%` }}
                  title={`${label}: ${m.bajas} bajas`}
                  aria-label={`${label}: ${m.bajas} bajas`}
                >
                  {m.bajas > 0 && <span className="bajas-chart__bar-value">{m.bajas}</span>}
                </div>
                <div
                  className="bajas-chart__bar bajas-chart__bar--ingresos"
                  style={{ height: `${iH}%` }}
                  title={`${label}: ${m.ingresos} ingresos`}
                  aria-label={`${label}: ${m.ingresos} ingresos`}
                >
                  {m.ingresos > 0 && <span className="bajas-chart__bar-value">{m.ingresos}</span>}
                </div>
              </div>
              <div className="bajas-chart__x">
                <span className="bajas-chart__x-label">{label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
