import { EmployeeRowActions } from '@/components/ui/EmployeeRowActions';
import { localTodayIso } from '@/lib/dates';
import type { Employee } from '@/lib/types';
import { normalizeString } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { workforceText } from '@/pages/workforce-translations';
import './DepartmentSearchResults.css';

interface DepartmentSearchResultsProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onPromote: (employee: Employee) => void;
  onIncapacidad: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

interface EmployeeGroup {
  area: string;
  employees: Employee[];
}

function groupEmployeesByArea(employees: Employee[]): EmployeeGroup[] {
  const groups = new Map<string, Employee[]>();

  employees.forEach((employee) => {
    const area = employee.area.trim() || 'Sin departamento';
    const areaEmployees = groups.get(area) ?? [];
    areaEmployees.push(employee);
    groups.set(area, areaEmployees);
  });

  return Array.from(groups, ([area, areaEmployees]) => ({
    area,
    employees: areaEmployees.sort((a, b) =>
      a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }),
    ),
  })).sort((a, b) =>
    a.area.localeCompare(b.area, 'es', { sensitivity: 'base' }),
  );
}

function getSectionLabel(section: string, area: string): string {
  const sectionWords = section.trim().split(/\s+/).filter(Boolean);
  const areaWordCount = area.trim().split(/\s+/).filter(Boolean).length;
  const sectionPrefix = sectionWords.slice(0, areaWordCount).join(' ');

  if (normalizeString(sectionPrefix) !== normalizeString(area)) {
    return section.trim();
  }

  return sectionWords.slice(areaWordCount).join(' ');
}

export function DepartmentSearchResults({
  employees,
  onEdit,
  onPromote,
  onIncapacidad,
  onDelete,
}: DepartmentSearchResultsProps) {
  const { language } = useLanguage();
  const t = (text: string) => workforceText(language, text);
  const groups = groupEmployeesByArea(employees);
  const today = localTodayIso();

  return (
    <section
      className="department-search-results"
      aria-labelledby="department-search-results-title"
    >
      <header className="department-search-results__header">
        <h2 id="department-search-results-title">{t('Resultados')}</h2>
        <p className="department-search-results__summary" aria-live="polite">
          {employees.length} {t(employees.length === 1 ? 'empleado' : 'empleados')} ·{' '}
          {groups.length} {t(groups.length === 1 ? 'departamento' : 'departamentos')}
        </p>
      </header>

      <table className="department-search-table data-table data-table--cards">
        <caption className="sr-only">{t('Resultados')}</caption>
        <colgroup>
          <col className="department-search-table__column--number" />
          <col className="department-search-table__column--name" />
          <col className="department-search-table__column--position" />
          <col className="department-search-table__column--section" />
          <col className="department-search-table__column--actions" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">{t('No. empleado')}</th>
            <th scope="col">{t('Empleado')}</th>
            <th scope="col">{t('Puesto')}</th>
            <th scope="col">{t('Sección')}</th>
            <th scope="col">
              <span className="sr-only">{t('Acciones')}</span>
            </th>
          </tr>
        </thead>
        {groups.map((group) => (
          <tbody key={group.area}>
            <tr className="department-search-table__group-row">
              <th scope="rowgroup" colSpan={5}>
                <div className="department-search-table__group-heading">
                  <span>{group.area}</span>
                  <span
                    className="department-search-table__group-count"
                    aria-label={`${group.employees.length} ${t(group.employees.length === 1 ? 'empleado' : 'empleados')}`}
                  >
                    {group.employees.length}
                  </span>
                </div>
              </th>
            </tr>
            {group.employees.map((employee) => (
              <tr
                className="department-search-table__employee-row"
                key={employee.id ?? employee.num_empleado}
              >
                <th
                  className="department-search-table__employee-number"
                  scope="row"
                  data-label={t('No. empleado')}
                >
                  <span>#{employee.num_empleado}</span>
                </th>
                <td className="department-search-table__employee-name" data-label={t('Empleado')}>
                  <strong>{employee.nombre}</strong>
                </td>
                <td className="department-search-table__employee-position" data-label={t('Puesto')}>
                  <span>{employee.puesto}</span>
                </td>
                <td className="department-search-table__employee-section" data-label={t('Sección')}>
                  <span>{getSectionLabel(employee.seccion, group.area)}</span>
                </td>
                <td className="department-search-table__actions" data-label={t('Acciones')}>
                  <EmployeeRowActions
                    employee={employee}
                    isUpcomingHire={String(employee.fecha_ingreso).localeCompare(today) > 0}
                    onEdit={onEdit}
                    onPromote={onPromote}
                    onIncapacidad={onIncapacidad}
                    onDelete={onDelete}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </section>
  );
}
