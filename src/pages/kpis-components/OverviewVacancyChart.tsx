import { useId, useMemo, useState, type KeyboardEvent } from 'react';
import { CellColumnChart } from '@/components/ui/CellColumnChart';
import { MetricTile, type MetricTileTone } from '@/components/ui/MetricTile';
import { useLanguage } from '@/contexts/LanguageContext';
import type { IsoWeekRange } from '@/lib/dates';
import type { AuthorizedPosition, Baja, Employee } from '@/lib/types';
import { workforceText } from '@/pages/workforce-translations';
import { buildVacancySeries, type VacancySeriesPoint } from './overview-vacancy-series';
import './OverviewVacancyChart.css';

type SeriesKey = 'plantilla' | 'backup' | 'starlite';

const SERIES: readonly { key: SeriesKey; label: string; accent: string }[] = [
  { key: 'plantilla', label: 'Plantilla', accent: 'var(--color-error)' },
  { key: 'backup', label: 'Backup', accent: 'var(--color-warning)' },
  { key: 'starlite', label: 'Starlite', accent: 'var(--color-accent-purple-deep)' },
];

interface Props {
  week: IsoWeekRange;
  rangeLabel: string;
  employees: readonly Employee[];
  bajas: readonly Baja[];
  positions: AuthorizedPosition[];
  dismissedKeys: ReadonlySet<string>;
  locale: string;
}

/** Vacantes menos al cierre es una buena noticia; más, una mala. */
function changeTone(change: number): MetricTileTone {
  if (change === 0) return 'neutral';
  return change < 0 ? 'good' : 'bad';
}

function formatChange(change: number): string {
  if (change === 0) return '±0';
  return `${change < 0 ? '−' : '+'}${Math.abs(change)}`;
}

/**
 * Vacantes por día. La rejilla pinta una sola serie y la tira de pestañas de
 * abajo decide cuál: cada pestaña lleva su cierre de semana y cuánto se movió
 * desde el lunes, ambos leídos de la misma serie que dibuja.
 */
export function OverviewVacancyChart({
  week,
  rangeLabel,
  employees,
  bajas,
  positions,
  dismissedKeys,
  locale,
}: Props) {
  const { language } = useLanguage();
  const t = (text: string) => workforceText(language, text);
  const titleId = useId();
  const plotId = useId();
  const [activeSeries, setActiveSeries] = useState(0);

  const data = useMemo<VacancySeriesPoint[]>(
    () =>
      buildVacancySeries({ week, employees, bajas, positions, dismissedKeys, locale }),
    [week, employees, bajas, positions, dismissedKeys, locale],
  );

  const days = useMemo(() => data.map((point) => point.day), [data]);
  const current = SERIES[activeSeries];
  const values = useMemo(() => data.map((point) => point[current.key]), [data, current.key]);

  function onTabsKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const step = event.key === 'ArrowRight' ? 1 : SERIES.length - 1;
    const next = (activeSeries + step) % SERIES.length;
    setActiveSeries(next);
    event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  }

  return (
    <figure className="overview-chart" aria-labelledby={titleId}>
      <header className="overview-chart__header">
        <div className="overview-chart__heading">
          <h2 id={titleId} className="overview-chart__title">
            {t('Vacantes por día')}
          </h2>
          <p className="overview-chart__caption">
            {t('Semana')} {week.week} · {rangeLabel}
          </p>
        </div>
        <span className="overview-chart__badge">{t(current.label)}</span>
      </header>

      {data.length === 0 ? (
        <p className="overview-chart__empty">{t('Sin datos para mostrar')}</p>
      ) : (
        <>
          <div className="overview-chart__plot">
            <CellColumnChart
              id={plotId}
              values={values}
              labels={days}
              ticks={days}
              accent={current.accent}
              label={`${t('Vacantes por día')} · ${t(current.label)}`}
              revision={current.key}
            />
          </div>

          <div
            className="overview-chart__tabs"
            role="tablist"
            aria-label={t('Series de vacantes')}
            onKeyDown={onTabsKeyDown}
          >
            {SERIES.map((series, index) => {
              const seriesValues = data.map((point) => point[series.key]);
              const close = seriesValues[seriesValues.length - 1] ?? 0;
              const change = close - (seriesValues[0] ?? 0);
              return (
                <MetricTile
                  key={series.key}
                  role="tab"
                  controls={plotId}
                  selected={index === activeSeries}
                  accent={series.accent}
                  label={t(series.label)}
                  mark={<span className="overview-chart__tab-swatch" />}
                  value={close}
                  tone={changeTone(change)}
                  note={
                    <>
                      <strong>{formatChange(change)}</strong>{' '}
                      {language === 'en' ? 'vs start of week' : 'vs inicio de semana'}
                    </>
                  }
                  onClick={() => setActiveSeries(index)}
                />
              );
            })}
          </div>
        </>
      )}
    </figure>
  );
}
