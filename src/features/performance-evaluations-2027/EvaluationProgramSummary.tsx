import { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { Check as CheckIconData, Copy as CopyIconData } from 'lucide';
import { MorphingIcon } from '@/components/ui/MorphingIcon';
import { formatReadableDate, localTodayIso } from '@/lib/dates';
import { toast } from '@/lib/notify';
import { copyTextToClipboard } from '@/lib/whatsappReport';
import type { Language } from '@/contexts/LanguageContext';
import type { EvaluationProgramData, EvaluationStatus } from './types';

interface EvaluationProgramSummaryProps {
  program: EvaluationProgramData;
  language: Language;
  copy: {
    chartTitle: string;
    copyEmail: string;
    emailCopied: string;
    emailCopyError: string;
    emailGreeting: string;
    emailIntroduction: string;
    elapsedTime: string;
    generalCompliance: string;
    startDate: string;
    deadline: string;
    day: string;
    days: string;
    positionCompleted: string;
    positionsCompleted: string;
    of: string;
  };
}

function getDateTimestamp(date: string) {
  const timestamp = Date.parse(`${date}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
    || Number.isNaN(timestamp)
    || new Date(timestamp).toISOString().slice(0, 10) !== date
  ) {
    throw new Error(`Fecha inválida en el seguimiento de evaluaciones: "${date}".`);
  }
  return timestamp;
}

function getElapsedTime(startDate: string, deadline: string, today: string) {
  const start = getDateTimestamp(startDate);
  const end = getDateTimestamp(deadline);
  const current = getDateTimestamp(today);
  const duration = end - start;

  if (duration <= 0) {
    throw new Error('La fecha límite debe ser posterior a la fecha de inicio.');
  }

  const totalDays = duration / (24 * 60 * 60 * 1000);
  const elapsedDays = Math.min(
    totalDays,
    Math.max(0, Math.round((current - start) / (24 * 60 * 60 * 1000))),
  );

  return {
    elapsedDays,
    totalDays,
    percentage: (elapsedDays / totalDays) * 100,
  };
}

function isCompleted(status: EvaluationStatus) {
  return status === 'Entregado' || status === 'Revisado';
}

export function EvaluationProgramSummary({
  program,
  language,
  copy,
}: EvaluationProgramSummaryProps) {
  const [copied, setCopied] = useState(false);
  const dateLocale = language === 'en' ? 'en-US' : 'es-MX';
  const elapsedTime = getElapsedTime(
    program.startDate,
    program.deadline,
    localTodayIso(),
  );
  const positions = program.areas.flatMap((area) => area.positions);
  if (positions.length === 0) {
    throw new Error('El seguimiento de evaluaciones debe incluir al menos un puesto.');
  }
  const completedPositions = positions.filter(({ status }) => isCompleted(status)).length;
  const completionPercentage = (completedPositions / positions.length) * 100;
  const percentageFormatter = new Intl.NumberFormat(dateLocale, {
    maximumFractionDigits: 1,
  });

  useEffect(() => {
    if (!copied) return;

    const timeoutId = window.setTimeout(() => {
      setCopied(false);
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  const handleCopyEmail = async () => {
    const message = [
      copy.emailGreeting,
      '',
      copy.emailIntroduction,
      `${copy.startDate}: ${formatReadableDate(program.startDate, dateLocale)}`,
      `${copy.deadline}: ${formatReadableDate(program.deadline, dateLocale)}`,
      `${copy.elapsedTime}: ${elapsedTime.elapsedDays} ${elapsedTime.totalDays === 1 ? copy.day : copy.days} (${percentageFormatter.format(elapsedTime.percentage)}%).`,
      `${copy.generalCompliance}: ${completedPositions} ${copy.of} ${positions.length} ${positions.length === 1 ? copy.positionCompleted : copy.positionsCompleted} (${percentageFormatter.format(completionPercentage)}%).`,
    ].join('\n');

    try {
      await copyTextToClipboard(message);
      setCopied(true);
      toast.success({ title: copy.emailCopied });
    } catch {
      setCopied(false);
      toast.error({ title: copy.emailCopyError });
    }
  };

  return (
    <section
      className="evaluation-program-summary"
      aria-labelledby="evaluation-program-summary-title"
    >
      <div className="evaluation-program-summary__card">
        <div className="evaluation-program-summary__heading">
          <h2 id="evaluation-program-summary-title">{copy.chartTitle}</h2>
          <button
            type="button"
            className="btn-icon evaluation-program-summary__copy-button"
            onClick={() => void handleCopyEmail()}
            aria-label={copied ? copy.emailCopied : copy.copyEmail}
            title={copied ? copy.emailCopied : copy.copyEmail}
          >
            <MorphingIcon
              icon={copied ? CheckIconData : CopyIconData}
              size="var(--icon-size-sm)"
              aria-hidden="true"
            />
            <span className="sr-only">{copied ? copy.emailCopied : copy.copyEmail}</span>
          </button>
        </div>
        <div className="evaluation-program-summary__timeline">
          <div className="evaluation-program-summary__metric-heading">
            <span>{copy.elapsedTime}</span>
            <div className="evaluation-program-summary__metric-value">
              <strong>{percentageFormatter.format(elapsedTime.percentage)}%</strong>
              <span>
                {elapsedTime.elapsedDays} {copy.of} {elapsedTime.totalDays}{' '}
                {elapsedTime.totalDays === 1 ? copy.day : copy.days}
              </span>
            </div>
          </div>
          <progress
            className="evaluation-program-summary__progress-bar"
            value={elapsedTime.percentage}
            max={100}
            aria-label={`${copy.elapsedTime}: ${percentageFormatter.format(elapsedTime.percentage)}%`}
          />
          <dl className="evaluation-program-summary__dates">
            <div>
              <dt>
                <CalendarDays aria-hidden="true" />
                {copy.startDate}
              </dt>
              <dd>
                <time dateTime={program.startDate}>
                  {formatReadableDate(program.startDate, dateLocale)}
                </time>
              </dd>
            </div>
            <div>
              <dt>
                <CalendarDays aria-hidden="true" />
                {copy.deadline}
              </dt>
              <dd>
                <time dateTime={program.deadline}>
                  {formatReadableDate(program.deadline, dateLocale)}
                </time>
              </dd>
            </div>
          </dl>
        </div>

        <div className="evaluation-program-summary__compliance">
          <div className="evaluation-program-summary__metric-heading">
            <span>{copy.generalCompliance}</span>
            <strong>{percentageFormatter.format(completionPercentage)}%</strong>
          </div>
          <progress
            className="evaluation-program-summary__progress-bar"
            value={completedPositions}
            max={positions.length}
            aria-label={`${copy.generalCompliance}: ${percentageFormatter.format(completionPercentage)}%`}
          />
          <p>
            {completedPositions} {copy.of} {positions.length}{' '}
            {positions.length === 1 ? copy.positionCompleted : copy.positionsCompleted}
          </p>
        </div>
      </div>
    </section>
  );
}
