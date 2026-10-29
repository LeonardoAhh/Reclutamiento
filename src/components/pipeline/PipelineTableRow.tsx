import { CalendarDays, Clock3 } from 'lucide-react';

import { CandidateStatusBadge } from '@/components/ui/CandidateStatusBadge';
import { ReclutadorBadge, getReclutadorMeta } from '@/components/ui/Badge';
import type { Language } from '@/contexts/LanguageContext';
import { useTeamDirectory } from '@/features/team/TeamProvider';
import { formatInterviewDate, formatWeekdayDate } from '@/lib/dates';
import { splitCandidateName } from '@/lib/names';
import type { Candidate } from '@/lib/types';

interface PipelineTableRowProps {
  candidate: Candidate;
  isDesktop: boolean;
  language: Language;
  onOpen: (candidate: Candidate) => void;
}

function getInitials(fullName: string): string {
  const [firstWord = '', secondWord = ''] = fullName.trim().split(/\s+/);
  return `${firstWord.charAt(0)}${secondWord.charAt(0)}`;
}

export function PipelineTableRow({ candidate: c, isDesktop, language, onOpen }: PipelineTableRowProps) {
  const en = language === 'en';
  const { members } = useTeamDirectory();
  const { apellidos, nombres } = splitCandidateName(c.nombre);
  const fechaEntrevista = c.fecha_cita ? formatInterviewDate(c.fecha_cita, language) : null;
  const fechaEntrevistaDesktop = c.fecha_cita
    ? formatWeekdayDate(c.fecha_cita, en ? 'en-US' : 'es-MX')
    : null;
  const reclutador = c.reclutador ? getReclutadorMeta(c.reclutador, members) : null;

  return (
    <article
      className={`pipeline__ccard pipeline__ccard--${c.status}`}
      role={isDesktop ? 'row' : 'button'}
      tabIndex={0}
      aria-label={`${en ? 'Preview candidate' : 'Vista previa de'} ${c.nombre}`}
      onClick={() => onOpen(c)}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onOpen(c);
        }
      }}
    >
      <div className="pipeline__ccard-name-col" role={isDesktop ? 'cell' : undefined}>
        <span className="pipeline__name-avatar" aria-hidden="true">{getInitials(c.nombre)}</span>
        <span className="pipeline__name-desktop">{c.nombre}</span>

        {/* Resumen móvil: nombre y cita, puesto, sección, estado y reclutador. */}
        <div className="pipeline__name-details">
          <div className="pipeline__name-row">
            <span className="pipeline__name-text">
              <span className="pipeline__name-first">{apellidos.toUpperCase()}</span>
              {nombres && <span className="pipeline__name-rest">{nombres.toUpperCase()}</span>}
            </span>
            {fechaEntrevista && (
              <span className="pipeline__ccard-date">
                <Clock3 size={12} aria-hidden="true" />
                {fechaEntrevista}
              </span>
            )}
          </div>
        </div>

        <div className="pipeline__ccard-mobile-info">
          <div className="pipeline__ccard-mobile-info__puesto">
            <span className="pipeline__puesto-name" title={c.puesto}>{c.puesto}</span>
            {c.seccion && <span className="pipeline__ccard-mobile-info__seccion">{c.seccion}</span>}
          </div>
          <div className="pipeline__ccard-mobile-info__meta">
            <CandidateStatusBadge status={c.status} icon />
            {reclutador && (
              <span className="pipeline__ccard-recruiter">
                <span className="pipeline__ccard-recruiter-initial" aria-hidden="true">
                  {reclutador.nombreFormateado.charAt(0)}
                </span>
                <span className="pipeline__ccard-recruiter-name">{reclutador.nombreFormateado}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="pipeline__ccard-puesto-col" role={isDesktop ? 'cell' : undefined}>
        <div className="pipeline__puesto">
          <div className="pipeline__puesto-name" title={c.puesto}>{c.puesto}</div>
        </div>
      </div>

      <div
        className="pipeline__ccard-recruiter-col pipeline__cell-recruiter"
        role={isDesktop ? 'cell' : undefined}
      >
        {c.reclutador ? (
          <ReclutadorBadge nombre={c.reclutador} size="sm" className="pipeline__recruiter-badge" />
        ) : (
          <span className="pipeline__muted">—</span>
        )}
      </div>

      <div
        className="pipeline__ccard-dates-col pipeline__cell-dates"
        role={isDesktop ? 'cell' : undefined}
      >
        {fechaEntrevistaDesktop ? (
          <span className="pipeline__date">
            <CalendarDays size={13} aria-hidden="true" />
            {fechaEntrevistaDesktop}
          </span>
        ) : (
          <span className="pipeline__muted">—</span>
        )}
      </div>
    </article>
  );
}
