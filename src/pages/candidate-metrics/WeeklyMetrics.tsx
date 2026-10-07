import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CircleCheckBig, Copy, Plus, Minus } from 'lucide-react';
import { toast } from '@/lib/notify';
import { Tooltip } from '@/components/ui/Tooltip';
import { useIsMobile } from '@/hooks/useIsMobile';
import { ButtonUtility } from '@/components/ui/ButtonUtility';
import { isoWeekOf } from '@/lib/dates';
import type { WeekStat } from './useCandidateMetrics';

export function WeeklyMetrics({ stats }: { stats: WeekStat[] }) {
  const { language } = useLanguage();
  const en = language === 'en';
  const dateLocale = en ? 'en-US' : 'es-MX';
  const isMobile = useIsMobile();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const handleCopyRow = async (stat: WeekStat, weekNum: number) => {
    // Formato TSV (tab-separado) listo para pegar en Excel: CITADOS \t CONTRATADOS \t EFECTIVIDAD
    const effectiveness = stat.total === 0 ? 0 : Math.round((stat.contratados / stat.total) * 100);
    const text = `${stat.total}\t${stat.contratados}\t${effectiveness}%`;
    const { year, week } = isoWeekOf(stat.endTue);
    const key = year + '-W' + week;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedKey(key);
      toast.success({
        title: en ? `Week ${weekNum} copied` : `Sem ${weekNum} copiada`,
        duration: 2000,
      });
      window.setTimeout(() => {
        setCopiedKey((curr) => (curr === key ? null : curr));
      }, 2000);
    } catch {
      toast.error({ title: en ? 'Could not copy to clipboard' : 'No se pudo copiar al portapapeles' });
    }
  };

  const renderWeeksTable = (weeks: WeekStat[], showHeader = true) => {
    const displayedWeeks = isExpanded ? weeks : weeks.slice(0, 3);
    const hasMore = weeks.length > 3;

    return (
      <div className="recruiter-metrics__table-wrap">
        <table className="recruiter-metrics__table">
          {showHeader && (
            <thead>
              <tr>
                <th scope="col">{en ? 'Week' : 'Semana'}</th>
                <th scope="col" className="recruiter-metrics__table-number">{en ? 'Candidates' : 'Candidatos'}</th>
                <th scope="col" className="recruiter-metrics__table-number">{en ? 'Hired' : 'Contratados'}</th>
                <th scope="col" className="recruiter-metrics__table-number">{en ? 'Effectiveness' : 'Efectividad'}</th>
                <th scope="col" className="recruiter-metrics__table-copy-col">
                  <span className="sr-only">{en ? 'Copy' : 'Copiar'}</span>
                </th>
              </tr>
            </thead>
          )}
          <tbody>
          {displayedWeeks.map((stat) => {
            const tueWeek = isoWeekOf(stat.endTue).week;
            const fmt = new Intl.DateTimeFormat(dateLocale, {
              day: 'numeric',
              month: 'short',
            });
            const wedStr = fmt.format(stat.startWed);
            const tueStr = fmt.format(stat.endTue);
            const effectiveness =
              stat.efectividadContratacion ??
              (stat.total === 0
                ? 0
                : Math.round((stat.contratados / stat.total) * 100));
            const { year, week } = isoWeekOf(stat.endTue);
    const key = year + '-W' + week;
            const isCopied = copiedKey === key;

            return (
              <tr key={key}>
                <td className="recruiter-metrics__table-week">
                  <span className="recruiter-metrics__table-week-label">{en ? 'Week' : 'Semana'} {tueWeek}</span>
                  <span className="recruiter-metrics__table-period">{wedStr} – {tueStr}</span>
                </td>
                <td className="recruiter-metrics__table-number">{stat.total}</td>
                <td className="recruiter-metrics__table-number recruiter-metrics__table-number--hired">
                  {stat.contratados}
                </td>
                <td className="recruiter-metrics__table-number recruiter-metrics__table-number--pct">
                  {effectiveness}%
                </td>
                <td className="recruiter-metrics__table-copy-col">
                  <Tooltip content={en ? 'Copy week' : 'Copiar semana'}>
                    <button
                      type="button"
                      onClick={() => handleCopyRow(stat, tueWeek)}
                      className={`recruiter-metrics__copy-btn${isCopied ? ' is-copied' : ''}`}
                      aria-label={`${en ? 'Copy Week' : 'Copiar Semana'} ${tueWeek}`}
                    >
                      {isCopied ? (
                        <CircleCheckBig size="var(--icon-size-sm)" aria-hidden="true" />
                      ) : (
                        <Copy size="var(--icon-size-sm)" aria-hidden="true" />
                      )}
                    </button>
                  </Tooltip>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {hasMore && (
        <div className="recruiter-metrics__table-actions">
          <ButtonUtility
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            icon={isExpanded ? <Minus size="var(--icon-size-sm)" aria-hidden="true" /> : <Plus size="var(--icon-size-sm)" aria-hidden="true" />}
          >
            {isExpanded ? (en ? 'Show less' : 'Ver menos') : (en ? 'Show more' : 'Ver más')}
          </ButtonUtility>
        </div>
      )}
    </div>
  );
  };

  return (
          <div className="recruiter-metrics__weeks">
            {isMobile ? (
              (() => {
                if (stats.length === 0) return <p>{en ? 'No data.' : 'No hay datos.'}</p>;
                const stat = stats[0];
                const tueWeek = isoWeekOf(stat.endTue).week;
                const fmt = new Intl.DateTimeFormat(dateLocale, {
                  day: 'numeric',
                  month: 'short',
                });
                const wedStr = fmt.format(stat.startWed);
                const tueStr = fmt.format(stat.endTue);
                const effectiveness =
                  stat.total === 0
                    ? 0
                    : Math.round((stat.contratados / stat.total) * 100);
                
                const { year, week } = isoWeekOf(stat.endTue);
                const key = year + '-W' + week;
                const isCopied = copiedKey === key;

                return (
                  <div className="recruiter-metrics__mobile-current-week">
                    <p className="recruiter-metrics__week-heading">
                      {en ? 'Current week' : 'Semana actual'} ({en ? 'Week' : 'Sem'} {tueWeek})<br/>
                      <span className="recruiter-metrics__table-period">{wedStr} – {tueStr}</span>
                    </p>
                    <div
                      className="recruiter-metrics__card-stats recruiter-metrics__current-week-stats"
                    >
                      <div className="recruiter-metrics__stat recruiter-metrics__stat--citados">
                        <span className="recruiter-metrics__stat-value">{stat.total}</span>
                        <span className="recruiter-metrics__stat-label">{en ? 'Candidates' : 'Candidatos'}</span>
                      </div>
                      <div className="recruiter-metrics__stat recruiter-metrics__stat--contratados">
                        <span className="recruiter-metrics__stat-value">{stat.contratados}</span>
                        <span className="recruiter-metrics__stat-label">{en ? 'Hired' : 'Contratados'}</span>
                      </div>
                      <div className="recruiter-metrics__stat">
                        <span className="recruiter-metrics__stat-value">{effectiveness}%</span>
                        <span className="recruiter-metrics__stat-label">{en ? 'Effectiveness' : 'Efectividad'}</span>
                      </div>
                    </div>
                    <ButtonUtility
                      onClick={() => handleCopyRow(stat, tueWeek)}
                      className="recruiter-metrics__weekly-copy"
                      icon={isCopied ? <CircleCheckBig size="var(--icon-size-sm)" aria-hidden="true" /> : <Copy size="var(--icon-size-sm)" aria-hidden="true" />}
                    >
                      {isCopied ? (en ? 'Copied!' : '¡Copiado!') : (en ? 'Copy weekly metrics' : 'Copiar métricas de la semana')}
                    </ButtonUtility>
                  </div>
                );
              })()
            ) : (
              renderWeeksTable(stats, true)
            )}
          </div>
  );
}
