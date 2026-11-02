import React from 'react';
import { MoonStar, TrendingDown, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge, type BadgeVariant } from './Badge';
import './SectionSummaryCard.css';

export type StatusTone = 'muted' | 'error' | 'warning' | 'primary';
const BADGE_TONE: Record<StatusTone, BadgeVariant> = {
  muted: 'neutral',
  error: 'error',
  warning: 'warning',
  primary: 'neutral',
};

export interface SectionSummaryCardProps {
  name: string;
  autorizado: number;
  contratados: number;
  asistencia: string | number;
  incidence: number;
  pct: number;

  isDescanso?: boolean;
  isCriticalTrend?: boolean;
  showTrend?: boolean;
  isSelected?: boolean;
  isClickable?: boolean;
  onClick?: () => void;

  opTitle?: string;

  statusTone?: StatusTone;
}

export function SectionSummaryCard({
  name,
  autorizado,
  contratados,
  asistencia,
  incidence,
  pct,
  isDescanso = false,
  isCriticalTrend = false,
  showTrend = true,
  isSelected = false,
  isClickable = false,
  onClick,
  opTitle,
  statusTone = 'muted',
}: SectionSummaryCardProps) {
  const { language } = useLanguage();
  const en = language === 'en';

  const className = `section-summary-card${isSelected ? ' section-summary-card--selected' : ''}`;

  const cardContent = (
    <>
      {/* Header: nombre + badge de incidencias o descanso */}
      <div className="section-summary-card__header">
        <span className="section-summary-card__name" title={name}>
          {name}
        </span>

        <div className="section-summary-card__header-metrics">
          {incidence > 0 && showTrend && (
            <span
              className={`section-summary-card__trend section-summary-card__trend--${isCriticalTrend ? 'critical' : 'stable'}`}
              aria-label={`${pct.toFixed(0)}% ${en ? 'absenteeism' : 'ausentismo'}`}
            >
              {isCriticalTrend ? (
                <TrendingUp size="1em" aria-hidden="true" />
              ) : (
                <TrendingDown size="1em" aria-hidden="true" />
              )}
              {pct.toFixed(0)}%
            </span>
          )}

          {isDescanso ? (
            <Badge
              size="icon"
              variant="neutral"
              role="img"
              data-testid={`area-descanso-${name}`}
              title={en ? 'Rest day' : 'Descanso'}
              aria-label={en ? 'Rest day' : 'Descanso'}
            >
              <MoonStar aria-hidden="true" />
            </Badge>
          ) : (
            <Badge
              size="compact"
              variant={BADGE_TONE[statusTone]}
              className="section-summary-card__badge"
              aria-label={`${incidence} ${en ? 'incidents' : 'incidencias'}`}
            >
              {incidence}
            </Badge>
          )}
        </div>
      </div>

      {/* KPIs */}
      <footer className="section-summary-card__footer">
        <div className="section-summary-card__kpis-group">
          {opTitle && <div className="section-summary-card__op-title">{opTitle}</div>}
          <dl className="section-summary-card__kpis">
            <div className="section-summary-card__kpi">
              <dt>{en ? 'Authorized' : 'Autorizado'}</dt>
              <dd>{autorizado}</dd>
            </div>
            <div className="section-summary-card__kpi">
              <dt>{en ? 'Hired' : 'Contratados'}</dt>
              <dd>{contratados}</dd>
            </div>
            <div className="section-summary-card__kpi">
              <dt>{en ? 'Attendance' : 'Asistencia'}</dt>
              <dd>{asistencia}</dd>
            </div>
          </dl>
        </div>
      </footer>
    </>
  );

  if (!isClickable) {
    return (
      <div
        className={className}
        data-testid={`area-card-${name.replace(/\s+/g, '-').toLowerCase()}`}
      >
        {cardContent}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      aria-pressed={isSelected}
      aria-label={`${en ? 'Section' : 'Sección'} ${name}. ${en ? 'Authorized' : 'Autorizado'}: ${autorizado}`}
      data-testid={`area-card-${name.replace(/\s+/g, '-').toLowerCase()}`}
    >
      {cardContent}
    </button>
  );
}
