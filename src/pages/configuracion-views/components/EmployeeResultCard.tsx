import { useState } from 'react';
import { ChevronDown, ChevronUp, IdCard } from 'lucide';
import type { ReporteDiarioRecord } from '@/hooks/useReporteDiario';
import { addDaysToIso, formatReadableDate } from '@/lib/dates';
import { toTitleCase } from '@/lib/utils';
import { Badge, StarliteBadge } from '@/components/ui/Badge';
import { MorphingIcon } from '@/components/ui/MorphingIcon';
import { EmployeeIncidenceCalendar } from './EmployeeIncidenceCalendar';
import {
  displayValue,
  getRecentFaltaDates,
  type EmployeeSearchResult,
  type SearchViewMode,
} from '../analisis-helpers';

interface EmployeeResultCardProps {
  employee: EmployeeSearchResult;
  resultId: string;
  viewMode: SearchViewMode;
  isRiskFilter?: boolean;
  isExpanded: boolean;
  reportsLoading: boolean;
  reports: ReporteDiarioRecord[];
  onToggle: () => void;
  autoExpand?: boolean;
}

export function EmployeeResultCard({
  employee,
  resultId,
  viewMode,
  isRiskFilter = false,
  isExpanded,
  reportsLoading,
  reports,
  onToggle,
  autoExpand = false,
}: EmployeeResultCardProps) {
  const [isLaborInfoExpanded, setIsLaborInfoExpanded] = useState(autoExpand);
  const employeeName = displayValue(employee.nombre);
  const employeeNumber = displayValue(employee.num_empleado);
  const employeeTitleId = `employee-card-title-${resultId}`;
  const laborInfoId = `employee-labor-info-${resultId}`;
  const compactDetailsId = `compact-details-${resultId}`;
  const calendarPanelId = `employee-calendar-${resultId}`;
  const isCompact = viewMode === 'compact';
  const showDetails = !isCompact || isExpanded;
  const isCompactPreview = isCompact && !isExpanded;
  const identityLabelClassName = isCompactPreview
    ? 'sr-only'
    : 'notion-prop__label type-body-sm text-muted';
  const identityValueClassName = isCompactPreview
    ? 'notion-prop__value type-body-sm text-muted'
    : 'notion-prop__value type-body-sm-strong text-charcoal';
  const renewalDate = employee.isBaja
    ? null
    : addDaysToIso(employee.fecha_ingreso, 90);
  const faltaDates = isRiskFilter
    ? getRecentFaltaDates(employee.num_empleado, reports)
    : [];
  const faltaBadge = isRiskFilter && faltaDates.length > 0 ? (
    <Badge variant="error-solid">
      {faltaDates.length} {faltaDates.length === 1 ? 'Falta' : 'Faltas'}
    </Badge>
  ) : null;

  return (
    <article
      className={`config-card${
        isCompact ? ' config-card--compact' : ''
      }${isExpanded ? ' is-expanded' : ''}`}
      aria-labelledby={employeeTitleId}
    >
      {isCompact && (
        <button
          type="button"
          className="config-card__card-toggle"
          onClick={onToggle}
          aria-label={`${isExpanded ? 'Ocultar' : 'Mostrar'} detalles de ${employeeName}`}
          aria-expanded={isExpanded}
          aria-controls={`${compactDetailsId} ${calendarPanelId}`}
        />
      )}
      <header className="config-card__header">
        <div className="config-card__avatar" aria-hidden="true">
          <MorphingIcon icon={IdCard} size="var(--icon-size-control)" aria-hidden="true" />
        </div>
        <h3
          id={employeeTitleId}
          className="config-card__employee-title type-body-sm-strong text-muted"
        >
          No. {employeeNumber}
        </h3>
        {(employee.isBaja || employee.is_starlite || faltaBadge !== null) && (
          <span className="config-card__header-badges">
            {employee.isBaja && <Badge variant="error-solid">Baja</Badge>}
            {employee.is_starlite && <StarliteBadge />}
            {faltaBadge}
          </span>
        )}
      </header>

      <div
        className={`config-card__body${showDetails ? '' : ' config-card__body--preview'}`}
      >
        <section
          className="config-card__details"
          aria-labelledby={`details-${resultId}`}
        >
          <div className="config-card__details-heading">
            <h4
              id={`details-${resultId}`}
              className={`config-card__section-title type-caption-up text-muted${isCompactPreview ? ' sr-only' : ''}`}
            >
              Información laboral
            </h4>
            {!isCompact && (
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
            )}
          </div>
          <dl className="config-card__properties config-card__identity-properties">
            <div className="notion-prop notion-prop--wide">
              <dt className={identityLabelClassName}>Nombre</dt>
              <dd className="notion-prop__value">
                <span className="type-heading-sm text-ink">{employeeName}</span>
              </dd>
            </div>
            <div className="notion-prop">
              <dt className={identityLabelClassName}>Puesto</dt>
              <dd className={identityValueClassName}>{displayValue(employee.puesto)}</dd>
            </div>
            {!isCompactPreview && (
              <div className="notion-prop">
                <dt className={identityLabelClassName}>Departamento</dt>
                <dd className={identityValueClassName}>{displayValue(employee.area)}</dd>
              </div>
            )}
            {showDetails && (
              <>
                <div className="notion-prop">
                  <dt className={identityLabelClassName}>Estado</dt>
                  <dd className={`${identityValueClassName} config-card__status`}>
                    {employee.isBaja ? <Badge variant="error-solid">Baja</Badge> : 'Activo'}
                  </dd>
                </div>
                <div className="notion-prop">
                  <dt className={identityLabelClassName}>Reclutador</dt>
                  <dd className={identityValueClassName}>{displayValue(employee.reclutador)}</dd>
                </div>
              </>
            )}
          </dl>
          <div id={compactDetailsId} hidden={!showDetails}>
            <dl
              id={laborInfoId}
              className={`config-card__properties config-card__properties--collapsible${
                isCompact || isLaborInfoExpanded ? ' is-expanded' : ''
              }`}
            >
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
              {!employee.isBaja && (
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
                    className="notion-prop__value type-body-sm-strong text-charcoal"
                  >
                    {displayValue(employee.motivo_baja)}
                  </dd>
                </div>
              )}
              {!(employee.isBaja && !employee.turno) && (
                <div className="notion-prop">
                  <dt className="notion-prop__label type-body-sm text-muted">Turno</dt>
                  <dd className={`notion-prop__value type-body-sm-strong ${employee.turno ? 'text-charcoal' : 'text-muted'}`}>
                    {employee.turno ? displayValue(employee.turno) : 'N/A'}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </section>

        <div id={calendarPanelId} className="config-card__calendar" hidden={!showDetails}>
          {showDetails && (
            <EmployeeIncidenceCalendar
              employeeName={employeeName}
              employeeNumber={employeeNumber}
              loading={reportsLoading}
              reports={reports}
              selectId={`config-month-select-${resultId}`}
              titleId={`calendar-${resultId}`}
            />
          )}
        </div>
      </div>
    </article>
  );
}
