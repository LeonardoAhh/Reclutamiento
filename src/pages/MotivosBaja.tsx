import { useMemo, useState } from 'react';
import { BarChart3, SlidersHorizontal } from 'lucide-react';
import { CartesianGrid, Label, LabelList, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { CapturarMotivoBajaModal } from '@/pages/bajas-components/CapturarMotivoBajaModal';
import { MotivosBajaRecords } from '@/pages/bajas-components/MotivosBajaRecords';
import { useBajaIndicatorOnly } from '@/hooks/useBajaIndicatorOnly';
import { BAJA_REASON_CATALOG, indicatorBajaType, toBajaSentenceCase } from '@/lib/bajaReasonCatalog';
import { formatMonthLabel, monthKey } from '@/lib/dates';
import './MotivosBaja.css';

function yearFromDate(value: string): string | null {
  const match = /^(\d{4})-/.exec(value);
  return match?.[1] ?? null;
}

function monthLabel(value: string): string {
  const label = new Intl.DateTimeFormat('es-MX', { month: 'long', timeZone: 'UTC' })
    .format(new Date(Date.UTC(2000, Number(value) - 1, 15)));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function MotivosBaja() {
  const { records: indicatorBajas, loading, error, reload, createRecord } = useBajaIndicatorOnly();
  const [year, setYear] = useState('all');
  const [month, setMonth] = useState('all');
  const [exitType, setExitType] = useState('all');
  const [captureOpen, setCaptureOpen] = useState(false);
  const existingEmployees = useMemo(() => new Set(indicatorBajas.map((baja) => baja.num_empleado)), [indicatorBajas]);

  const years = useMemo(
    () =>
      Array.from(
        new Set(
          indicatorBajas
            .map((baja) => yearFromDate(baja.fecha_baja))
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort((a, b) => b.localeCompare(a)),
    [indicatorBajas],
  );

  const months = useMemo(() => Array.from(new Set(
    indicatorBajas
      .filter((baja) => year === 'all' || yearFromDate(baja.fecha_baja) === year)
      .map((baja) => baja.fecha_baja.slice(5, 7))
      .filter((value) => /^(0[1-9]|1[0-2])$/.test(value)),
  )).sort(), [indicatorBajas, year]);

  const exitTypes = useMemo(() => {
    const existing = new Set(
      indicatorBajas
        .map((baja) => baja.tipo_baja?.trim())
        .filter((value): value is string => Boolean(value))
        .map(indicatorBajaType),
    );
    const standardTypes = Object.keys(BAJA_REASON_CATALOG);
    const ordered = standardTypes.filter((type) => existing.has(type));
    const additional = Array.from(existing)
      .filter((type) => !standardTypes.includes(type))
      .sort((a, b) => a.localeCompare(b, 'es'));
    return [...ordered, ...additional];
  }, [indicatorBajas]);

  const yearBajas = useMemo(
    () =>
      indicatorBajas.filter((baja) =>
        (year === 'all' || yearFromDate(baja.fecha_baja) === year) &&
        (month === 'all' || monthKey(baja.fecha_baja).slice(5, 7) === month),
      ),
    [indicatorBajas, year, month],
  );

  const filteredBajas = useMemo(
    () =>
      yearBajas.filter((baja) =>
        exitType === 'all' ? true : indicatorBajaType(baja.tipo_baja) === exitType,
      ),
    [yearBajas, exitType],
  );

  const typeRows = useMemo(() => {
    const counts = new Map<string, number>();
    for (const baja of yearBajas) {
      const type = indicatorBajaType(baja.tipo_baja);
      counts.set(type, (counts.get(type) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([label, count]) => ({
        label,
        count,
        percentage: yearBajas.length > 0 ? Math.round((count / yearBajas.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'es'));
  }, [yearBajas]);

  const monthlyRows = useMemo(() => {
    const counts = new Map<string, number>();
    for (const baja of filteredBajas) {
      const key = monthKey(baja.fecha_baja);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const rows = Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, count]) => ({ month: formatMonthLabel(key), monthIndex: Number(key.slice(0, 4)) * 12 + Number(key.slice(5, 7)), count }));
    if (rows.length < 2) return rows;

    const averageMonth = rows.reduce((sum, row) => sum + row.monthIndex, 0) / rows.length;
    const average = rows.reduce((sum, row) => sum + row.count, 0) / rows.length;
    const denominator = rows.reduce((sum, row) => sum + (row.monthIndex - averageMonth) ** 2, 0);
    const slope = rows.reduce((sum, row) => sum + (row.monthIndex - averageMonth) * (row.count - average), 0) / denominator;
    return rows.map((row) => ({
      ...row,
      trend: Number(Math.max(0, average + slope * (row.monthIndex - averageMonth)).toFixed(1)),
    }));
  }, [filteredBajas]);

  return (
    <main className="motivos-baja container" aria-labelledby="motivos-baja-title">
      <header className="motivos-baja__header">
        <div className="motivos-baja__heading">
          <div>
            <h1 id="motivos-baja-title" className="app-page-title">
              Motivos de baja
            </h1>
          </div>
          <button
            type="button"
            className="btn-ghost motivos-baja__capture-trigger"
            onClick={() => setCaptureOpen(true)}
            disabled={loading || Boolean(error)}
          >
            Registrar
          </button>
        </div>
      </header>

      <CapturarMotivoBajaModal
        isOpen={captureOpen}
        onClose={() => setCaptureOpen(false)}
        existingEmployees={existingEmployees}
        onCreate={createRecord}
      />

      {error && (
        <div className="motivos-baja__message form-warning-text" role="alert">
          <span>No se pudieron cargar los registros del indicador: {error}</span>{' '}
          <button type="button" className="btn-secondary" onClick={() => void reload()}>Reintentar</button>
        </div>
      )}

      <section className="motivos-baja__panel" aria-labelledby="motivos-trend-title" aria-busy={loading}>
        <div className="motivos-baja__panel-heading">
          <BarChart3 size="var(--icon-size-lg)" aria-hidden="true" />
          <div>
            <h2 id="motivos-trend-title">Bajas por mes</h2>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className="btn-icon motivos-baja__filter-trigger" aria-label="Filtros del indicador">
                <SlidersHorizontal size="var(--icon-size-md)" aria-hidden="true" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="motivos-baja__filter-popover" aria-label="Filtros del indicador">
              <div className="motivos-baja__filters">
                <div className="motivos-baja__filter">
                  <label htmlFor="motivos-year">Año</label>
                  <CustomSelect
                    id="motivos-year"
                    value={year}
                    showPlaceholderOption={false}
                    onChange={(value) => { setYear(value); setMonth('all'); }}
                    options={[
                      { value: 'all', label: 'Todos los años' },
                      ...years.map((value) => ({ value, label: value })),
                    ]}
                  />
                </div>
                <div className="motivos-baja__filter">
                  <label htmlFor="motivos-month">Mes</label>
                  <CustomSelect
                    id="motivos-month"
                    value={month}
                    showPlaceholderOption={false}
                    onChange={setMonth}
                    options={[
                      { value: 'all', label: 'Todos los meses' },
                      ...months.map((value) => ({ value, label: monthLabel(value) })),
                    ]}
                  />
                </div>
                <div className="motivos-baja__filter">
                  <label htmlFor="motivos-type">Tipo de baja</label>
                  <CustomSelect
                    id="motivos-type"
                    value={exitType}
                    showPlaceholderOption={false}
                    onChange={setExitType}
                    options={[
                      { value: 'all', label: 'Todos los tipos' },
                      ...exitTypes.map((value) => ({ value, label: toBajaSentenceCase(value) })),
                    ]}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        {monthlyRows.length > 0 ? (
          <div className="motivos-baja__chart" role="img" aria-label={`Bajas por mes: ${monthlyRows.map((row) => `${row.month}, ${row.count}`).join('; ')}. ${monthlyRows.length > 1 ? 'La línea discontinua muestra la tendencia lineal del periodo.' : 'Se necesitan al menos dos meses para mostrar una tendencia.'}`}>
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <LineChart data={monthlyRows} accessibilityLayer>
                <CartesianGrid vertical={false} stroke="var(--color-hairline)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: 'var(--color-muted)' }} />
                <YAxis allowDecimals={false} domain={[0, (dataMax: number) => Math.max(1, Math.ceil(dataMax * 1.15))]} tickLine={false} axisLine={false} tick={{ fill: 'var(--color-muted)' }} width="auto" />
                <Tooltip />
                {monthlyRows.length > 1 && <Legend />}
                {monthlyRows.length > 1 && (
                  <Line
                    type="linear"
                    dataKey="trend"
                    name="Tendencia"
                    stroke="var(--color-muted)"
                    strokeWidth="var(--chart-line-width)"
                    strokeDasharray="var(--chart-dash-short)"
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                  />
                )}
                <Line
                  type="linear"
                  dataKey="count"
                  name="Bajas mensuales"
                  stroke="var(--color-primary)"
                  strokeWidth="var(--chart-line-width)"
                  strokeLinecap="round"
                  dot={{ fill: 'var(--color-surface)', stroke: 'var(--color-primary)' }}
                  isAnimationActive={false}
                >
                  <LabelList
                    dataKey="count"
                    position="top"
                    fill="var(--color-ink)"
                    content={(props) => (
                      <Label {...props} textAnchor={props.index === 0 ? 'start' : props.index === monthlyRows.length - 1 ? 'end' : 'middle'} />
                    )}
                  />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <p className="motivos-baja__empty">No hay bajas para los filtros seleccionados.</p>}
      </section>

      <div className="motivos-baja__dashboard">
        <section className="motivos-baja__panel" aria-labelledby="motivos-types-title">
          <div className="motivos-baja__panel-heading">
            <BarChart3 size="var(--icon-size-lg)" aria-hidden="true" />
            <div><h2 id="motivos-types-title">Distribución por tipo</h2></div>
          </div>
          {typeRows.length > 0 ? (
            <ul className="motivos-baja__bars">
              {typeRows.map((row) => (
                <li key={row.label}>
                  <div className="motivos-baja__bar-label">
                    <span className="motivos-baja__bar-category">
                      <span>{toBajaSentenceCase(row.label)}</span>
                      <span className="motivos-baja__bar-count">{row.count} {row.count === 1 ? 'baja' : 'bajas'}</span>
                    </span>
                    <strong>{row.percentage}%</strong>
                  </div>
                  <div className="motivos-baja__bar-track" aria-hidden="true"><span style={{ width: `${row.percentage}%` }} /></div>
                </li>
              ))}
            </ul>
          ) : <p className="motivos-baja__empty">No hay bajas para el periodo seleccionado.</p>}
        </section>

        <section className="motivos-baja__panel" aria-labelledby="motivos-reasons-title">
          <div className="motivos-baja__panel-heading">
            <BarChart3 size="var(--icon-size-lg)" aria-hidden="true" />
            <div><h2 id="motivos-reasons-title">Motivos de baja</h2></div>
          </div>
          {filteredBajas.length > 0 ? (
            <MotivosBajaRecords bajas={filteredBajas} year={year} month={month} exitType={exitType} />
          ) : <p className="motivos-baja__empty">No hay motivos para los filtros seleccionados.</p>}
        </section>
      </div>
    </main>
  );
}
