import { useState } from 'react';
import { CircleUser } from 'lucide-react';
import { ChevronDown, ChevronUp } from 'lucide';
import type { ReporteDiarioRecord } from '@/hooks/useReporteDiario';
import { addDaysToIso, formatReadableDate, localTodayIso } from '@/lib/dates';
import { toTitleCase } from '@/lib/utils';
import { Badge, StarliteBadge } from '@/components/ui/Badge';
import { ButtonUtility } from '@/components/ui/ButtonUtility';
import { MorphingIcon } from '@/components/ui/MorphingIcon';
import { EmployeeIncidenceCalendar } from './EmployeeIncidenceCalendar';
import { GlobalIncidenceHistory } from './GlobalIncidenceHistory';
import {
  displayValue,
  getStickerTone,
  type EmployeeSearchResult,
  type SearchViewMode,
} from '../busqueda-helpers';

interface EmployeeResultCardProps {
  employee: EmployeeSearchResult;
  resultId: string;
  viewMode: SearchViewMode;
  isExpanded: boolean;
  reportsLoading: boolean;
  reports: ReporteDiarioRecord[];
  onToggle: () => void;
}

export function EmployeeResultCard({
  employee,
  resultId,
  viewMode,
  isExpanded,
  reportsLoading,
  reports,
  onToggle,
}: EmployeeResultCardProps) {
  const [isLaborInfoExpanded, setIsLaborInfoExpanded] = useState(false);
  const employeeName = displayValue(employee.nombre);
  const employeeNumber = displayValue(employee.num_empleado);
  const stickerTone = getStickerTone(employeeNumber);
  const employeeTitleId = `employee-card-title-${resultId}`;
  const laborInfoId = `employee-labor-info-${resultId}`;
  const compactDetailsId = `compact-details-${resultId}`;
  const isCompact = viewMode === 'compact';
  const renewalDate = employee.isBaja
    ? null
    : addDaysToIso(employee.fecha_ingreso, 90);
  const showRenewalDate = Boolean(
    renewalDate && renewalDate >= localTodayIso(),
  );

  return (
    <article
      className={`config-card${
        isCompact ? ' config-card--compact' : ''
      }${isExpanded ? ' is-expanded' : ''}`}
      aria-labelledby={employeeTitleId}
    >
      <header className="config-card__header">
        <div
          className={`config-card__avatar config-card__avatar--tone-${stickerTone}`}
          aria-hidden="true"
        >
          <CircleUser size="1em" aria-hidden="true" />
        </div>
        <div className="config-card__title-group">
          <h3
            id={employeeTitleId}
            className="config-card__employee-title type-heading-sm text-ink"
          >
            <span className="config-card__employee-number text-muted-soft">
              #{employeeNumber}
            </span>
            <span>{employeeName}</span>
            {employee.isBaja && <Badge variant="error">Baja</Badge>}
            {employee.is_starlite && <StarliteBadge />}
          </h3>
        </div>
      </header>

      {isCompact && (
        <div className="config-compact-summary">
          <dl className="config-compact-summary__facts">
            <div>
              <dt>Puesto</dt>
              <dd>{displayValue(employee.puesto)}</dd>
            </div>
            <div>
              <dt>Departamento</dt>
              <dd>{displayValue(employee.area)}</dd>
            </div>
            <div>
              <dt>Turno</dt>
              <dd>
                {employee.turno
                  ? displayValue(employee.turno)
                  : 'Sin información'}
              </dd>
            </div>
          </dl>
          <ButtonUtility
            type="button"
            className="config-compact-summary__toggle"
            icon={(
              <MorphingIcon
                icon={isExpanded ? ChevronUp : ChevronDown}
                size={16}
              />
            )}
            onClick={onToggle}
            aria-expanded={isExpanded}
            aria-controls={compactDetailsId}
          >
            {isExpanded ? 'Ocultar detalle' : 'Ver detalle'}
          </ButtonUtility>
        </div>
      )}

      {(!isCompact || isExpanded) && (
        <div
          id={isCompact ? compactDetailsId : undefined}
          className="config-card__body"
        >
          <section
            className="config-card__details"
            aria-labelledby={`details-${resultId}`}
          >
            <div className="config-card__details-heading">
              <h4
                id={`details-${resultId}`}
                className="config-card__section-title type-caption-up text-muted"
              >
                Información laboral
              </h4>
              <button
                type="button"
                className="config-card__details-toggle"
                onClick={() => setIsLaborInfoExpanded((current) => !current)}
                aria-expanded={isLaborInfoExpanded}
                aria-controls={laborInfoId}
              >
                <MorphingIcon
                  icon={isLaborInfoExpanded ? ChevronUp : ChevronDown}
                  aria-hidden="true"
                />
                {isLaborInfoExpanded ? 'Contraer' : 'Mostrar'}
              </button>
            </div>
            <dl
              id={laborInfoId}
              className={`config-card__properties config-card__properties--collapsible${
                isLaborInfoExpanded ? ' is-expanded' : ''
              }`}
            >
              <div className="notion-prop">
                <dt className="notion-prop__label type-body-sm text-muted">
                  Puesto
                </dt>
                <dd className="notion-prop__value type-body-sm-strong text-charcoal">
                  {displayValue(employee.puesto)}
                </dd>
              </div>
              <div className="notion-prop">
                <dt className="notion-prop__label type-body-sm text-muted">
                  Departamento
                </dt>
                <dd className="notion-prop__value type-body-sm-strong text-charcoal">
                  {displayValue(employee.area)}
                </dd>
              </div>
              <div className="notion-prop">
                <dt className="notion-prop__label type-body-sm text-muted">
                  Sección
                </dt>
                <dd className="notion-prop__value type-body-sm-strong text-charcoal">
                  {displayValue(employee.seccion)}
                </dd>
              </div>
              <div className="notion-prop">
                <dt className="notion-prop__label type-body-sm text-muted">
                  Fecha de ingreso
                </dt>
                <dd className="notion-prop__value type-body-sm-strong text-charcoal">
                  {toTitleCase(formatReadableDate(employee.fecha_ingreso))}
                </dd>
              </div>
              {showRenewalDate && renewalDate && (
                <div className="notion-prop">
                  <dt className="notion-prop__label type-body-sm text-muted">
                    Renov. contrato
                  </dt>
                  <dd className="notion-prop__value type-body-sm-strong text-charcoal">
                    {toTitleCase(formatReadableDate(renewalDate))}
                  </dd>
                </div>
              )}
              {employee.isBaja && (
                <div className="notion-prop">
                  <dt className="notion-prop__label type-body-sm text-muted">Fecha de baja</dt>
                  <dd className="notion-prop__value type-body-sm-strong text-charcoal">
                    {toTitleCase(formatReadableDate(employee.fecha_baja))}
                  </dd>
                </div>
              )}
              {employee.isBaja && (
                <div className="notion-prop">
                  <dt className="notion-prop__label type-body-sm text-muted">Motivo de baja</dt>
                  <dd
                    className="notion-prop__value config-card__truncate type-body-sm-strong text-charcoal"
                    title={employee.motivo_baja}
                  >
                    {displayValue(employee.motivo_baja)}
                  </dd>
                </div>
              )}
              {!(employee.isBaja && !employee.turno) && (
                <div className="notion-prop">
                  <dt className="notion-prop__label type-body-sm text-muted">Turno</dt>
                  <dd className="notion-prop__value">
                    {employee.turno ? (
                      <Badge>{employee.turno}</Badge>
                    ) : (
                      <span className="type-body-sm-strong text-muted">N/A</span>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          <EmployeeIncidenceCalendar
            employeeName={employeeName}
            employeeNumber={employeeNumber}
            loading={reportsLoading}
            reports={reports}
            selectId={`config-month-select-${resultId}`}
            titleId={`calendar-${resultId}`}
          />

          <GlobalIncidenceHistory
            employeeNumber={employeeNumber}
            allReports={reports}
            titleId={`history-${resultId}`}
          />
        </div>
      )}
    </article>
  );
}
