import { Users, TrendingUp } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ExpandableSection } from '@/components/ui/ExpandableSection';
import { useIsMobile } from '@/hooks/useIsMobile';
import { isoWeekOf } from '@/lib/dates';
import './RecruiterStatsModal.css';

interface WeekStat {
  startWed: Date;
  endTue: Date;
  total: number;
  contratados: number;
  citados?: number;
  rechazados?: number;
  efectividadContratacion?: number;
}

interface RecruiterStats {
  name: string;
  total: number;
  citados: number;
  contratados: number;
  rechazados: number;
  no_asistio: number;
}

interface RecruiterStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'global' | 'pauta' | 'alexandra' | 'daniela' | null;
  recruiterStats: RecruiterStats[];
  pautaStats: WeekStat[];
  alexandraStats: WeekStat[];
  danielaStats: WeekStat[];
}

function groupWeeksByMonth(stats: WeekStat[]) {
  const grouped = new Map<string, WeekStat[]>();
  
  for (const stat of stats) {
    const monthKey = new Intl.DateTimeFormat('es-MX', { 
      month: 'long', 
      year: 'numeric' 
    }).format(stat.endTue);
    
    const existing = grouped.get(monthKey) || [];
    existing.push(stat);
    grouped.set(monthKey, existing);
  }
  
  return Array.from(grouped.entries());
}

export function RecruiterStatsModal({
  isOpen,
  onClose,
  mode,
  recruiterStats,
  pautaStats,
  alexandraStats,
  danielaStats,
}: RecruiterStatsModalProps) {
  const isMobile = useIsMobile();

  const title =
    mode === 'global'
      ? 'Resumen de Reclutadores'
      : mode === 'pauta'
        ? 'Detalle Pauta'
        : mode === 'alexandra'
          ? 'Detalle Alexandra'
          : mode === 'daniela'
            ? 'Detalle Daniela'
            : '';

  const stats =
    mode === 'pauta'
      ? pautaStats
      : mode === 'alexandra'
        ? alexandraStats
        : mode === 'daniela'
          ? danielaStats
          : [];

  const weeksByMonth = groupWeeksByMonth(stats);

  const renderWeeksTable = (weeks: WeekStat[], showHeader = true) => (
    <div className="recruiter-stats-modal__table-wrap">
      <table className="recruiter-stats-modal__table">
        {showHeader && (
          <thead>
            <tr>
              <th>Semana</th>
              <th>Período</th>
              <th className="recruiter-stats-modal__table-number">Candidatos</th>
              <th className="recruiter-stats-modal__table-number">Contratados</th>
              <th className="recruiter-stats-modal__table-number">Efectividad</th>
            </tr>
          </thead>
        )}
        <tbody>
          {weeks.map((stat) => {
            const tueWeek = isoWeekOf(stat.endTue).week;
            const fmt = new Intl.DateTimeFormat('es-MX', {
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

            return (
              <tr key={stat.startWed.getTime()}>
                <td className="recruiter-stats-modal__table-week">Sem {tueWeek}</td>
                <td className="recruiter-stats-modal__table-period">
                  {wedStr} – {tueStr}
                </td>
                <td className="recruiter-stats-modal__table-number">{stat.total}</td>
                <td className="recruiter-stats-modal__table-number recruiter-stats-modal__table-number--hired">
                  {stat.contratados}
                </td>
                <td className="recruiter-stats-modal__table-number recruiter-stats-modal__table-number--pct">
                  {effectiveness}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="recruiter-stats-modal"
      icon={
        mode === 'global' ? (
          <Users size={20} aria-hidden="true" />
        ) : (
          <TrendingUp size={20} aria-hidden="true" />
        )
      }
      title={title}
      subtitle={
        mode !== 'global' ? 'Desempeño semanal por reclutador' : 'Vista general del equipo'
      }
      size={mode === 'global' ? 'xl' : isMobile ? 'md' : 'lg'}
    >
      <div className="modal-body recruiter-stats-modal__body">
        {/* ── Vista Global: Grid de tarjetas ── */}
        {mode === 'global' && (
          <div className="recruiter-stats-modal__grid">
            {recruiterStats.map((r) => {
              const pct = (n: number) =>
                r.total === 0 ? 0 : Math.round((n / r.total) * 100);
              
              const efectividadAsistencia = r.total === 0 ? 0 : Math.round(((r.total - r.no_asistio) / r.total) * 100);

              return (
                <article key={r.name} className="recruiter-stats-modal__card">
                  <header className="recruiter-stats-modal__card-head">
                    <div className="recruiter-stats-modal__card-avatar">
                      {r.name.slice(0, 2)}
                    </div>
                    <div className="recruiter-stats-modal__card-meta">
                      <h3 className="recruiter-stats-modal__card-name">{r.name}</h3>
                      <span className="recruiter-stats-modal__card-total">
                        {r.total} candidato{r.total === 1 ? '' : 's'}
                      </span>
                      <span className="recruiter-stats-modal__card-efectividad">
                        {efectividadAsistencia}% Efectividad
                      </span>
                    </div>
                  </header>

                  <div className="recruiter-stats-modal__card-stats">
                    <div className="recruiter-stats-modal__stat recruiter-stats-modal__stat--citados">
                      <span className="recruiter-stats-modal__stat-value">{pct(r.citados)}%</span>
                      <span className="recruiter-stats-modal__stat-label">Citados</span>
                      <span className="recruiter-stats-modal__stat-count">({r.citados})</span>
                    </div>
                    <div className="recruiter-stats-modal__stat recruiter-stats-modal__stat--contratados">
                      <span className="recruiter-stats-modal__stat-value">{pct(r.contratados)}%</span>
                      <span className="recruiter-stats-modal__stat-label">Contratados</span>
                      <span className="recruiter-stats-modal__stat-count">({r.contratados})</span>
                    </div>
                    <div className="recruiter-stats-modal__stat recruiter-stats-modal__stat--rechazados">
                      <span className="recruiter-stats-modal__stat-value">{pct(r.rechazados)}%</span>
                      <span className="recruiter-stats-modal__stat-label">Rechazados</span>
                      <span className="recruiter-stats-modal__stat-count">({r.rechazados})</span>
                    </div>
                    <div className="recruiter-stats-modal__stat recruiter-stats-modal__stat--no-asistio">
                      <span className="recruiter-stats-modal__stat-value">{pct(r.no_asistio)}%</span>
                      <span className="recruiter-stats-modal__stat-label">No Asistió</span>
                      <span className="recruiter-stats-modal__stat-count">({r.no_asistio})</span>
                    </div>
                  </div>

                  <div className="recruiter-stats-modal__card-bar">
                    <div
                      className="recruiter-stats-modal__card-bar-segment recruiter-stats-modal__card-bar-segment--contratados"
                      style={{ '--bar-width': `${pct(r.contratados)}%` } as React.CSSProperties}
                    />
                    <div
                      className="recruiter-stats-modal__card-bar-segment recruiter-stats-modal__card-bar-segment--citados"
                      style={{ '--bar-width': `${pct(r.citados)}%` } as React.CSSProperties}
                    />
                    <div
                      className="recruiter-stats-modal__card-bar-segment recruiter-stats-modal__card-bar-segment--rechazados"
                      style={{ '--bar-width': `${pct(r.rechazados)}%` } as React.CSSProperties}
                    />
                    <div
                      className="recruiter-stats-modal__card-bar-segment recruiter-stats-modal__card-bar-segment--no-asistio"
                      style={{ '--bar-width': `${pct(r.no_asistio)}%` } as React.CSSProperties}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* ── Vista Individual: Semanas agrupadas por mes ── */}
        {mode && mode !== 'global' && (
          <div className="recruiter-stats-modal__weeks">
            {isMobile ? (
              weeksByMonth.map(([month, weeks]) => (
                <ExpandableSection
                  key={month}
                  title={month}
                  badge={`${weeks.length} semanas`}
                  variant="list"
                >
                  {renderWeeksTable(weeks, false)}
                </ExpandableSection>
              ))
            ) : (
              renderWeeksTable(stats, true)
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
