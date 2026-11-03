import type { RefObject } from 'react';
import { ArrowLeft } from 'lucide-react';
import { INCIDENT_TABS } from '@/components/reporte-diario/constants';
import { useReportLocale } from '@/components/reporte-diario/useReportLocale';
import type { DepartmentEmployee } from './department-incidences';

interface DepartmentEmployeeProfileProps {
  employee: DepartmentEmployee;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onBack: () => void;
}

export function DepartmentEmployeeProfile({ employee, headingRef, onBack }: DepartmentEmployeeProfileProps) {
  const { copy, incident, month } = useReportLocale();
  const observedCodes = new Set(employee.incidenceMonths.flatMap(({ byCode }) => Object.keys(byCode)));
  const codes = [
    ...INCIDENT_TABS.filter((code) => observedCodes.has(code)),
    ...[...observedCodes].filter((code) => !(INCIDENT_TABS as readonly string[]).includes(code)).sort(),
  ];

  return (
    <section className="department-incidences-page__profile" aria-labelledby="department-employee-profile-title">
      <div className="department-incidences-page__detail-heading">
        <button type="button" className="btn-ghost department-incidences-page__back" onClick={onBack}>
          <ArrowLeft size="var(--icon-size-sm)" aria-hidden="true" />
          {copy('Volver', 'Back')}
        </button>
        <h2
          ref={headingRef}
          tabIndex={-1}
          id="department-employee-profile-title"
          className="department-incidences-page__section-title"
        >
          {employee.name}
        </h2>
      </div>

      <dl className="department-incidences-page__profile-facts">
        <div>
          <dt>{copy('Núm. Emp.', 'Emp. No.')}</dt>
          <dd>{employee.number}</dd>
        </div>
        <div>
          <dt>{copy('Departamento', 'Department')}</dt>
          <dd>{employee.department}</dd>
        </div>
        <div>
          <dt>{copy('Sección', 'Section')}</dt>
          <dd>{employee.section}</dd>
        </div>
        <div>
          <dt>{copy('Puesto', 'Position')}</dt>
          <dd>{employee.position || '—'}</dd>
        </div>
      </dl>

      <div className="department-incidences-page__profile-history">
        <h3 className="department-incidences-page__history-title">
          {copy('Historial de incidencias', 'Incident history')}
        </h3>
        {employee.incidenceMonths.length === 0 ? (
          <p className="department-incidences-page__detail-empty">
            {copy('Sin incidencias registradas.', 'No incidents recorded.')}
          </p>
        ) : (
          <>
            <table className="data-table department-incidences-page__history-table">
              <caption className="sr-only">
                {copy('Incidencias por mes de ', 'Monthly incidents for ')}
                {employee.name}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{copy('Mes', 'Month')}</th>
                  {codes.map((code) => (
                    <th key={code} scope="col">
                      <abbr title={incident(code)}>{code}</abbr>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employee.incidenceMonths.map(({ month: monthKey, byCode }) => (
                  <tr key={monthKey}>
                    <th scope="row">{month(monthKey)}</th>
                    {codes.map((code) => (
                      <td key={code}>{byCode[code] ?? 0}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <ul
              className="department-incidences-page__history-legend"
              aria-label={copy('Tipos de incidencia', 'Incident types')}
            >
              {codes.map((code) => (
                <li key={code}>
                  <strong>{code}</strong> {incident(code)}
                </li>
              ))}
            </ul>
            <ul className="department-incidences-page__history-cards">
              {employee.incidenceMonths.map(({ month: monthKey, byCode }) => (
                <li key={monthKey}>
                  <h4>{month(monthKey)}</h4>
                  <dl>
                    {codes
                      .filter((code) => byCode[code])
                      .map((code) => (
                        <div key={code}>
                          <dt>{incident(code)}</dt>
                          <dd>{byCode[code]}</dd>
                        </div>
                      ))}
                  </dl>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
