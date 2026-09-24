import { IncapacidadBadge, ProximoIngresoBadge, StarliteBadge } from '@/components/ui/Badge';
import { EmployeeRowActions } from '@/components/ui/EmployeeRowActions';
import { localTodayIso } from '@/lib/dates';
import type { Employee } from '@/lib/types';
import { normalizeString } from '@/lib/utils';
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
  const groups = groupEmployeesByArea(employees);
  const today = localTodayIso();

  return (
    <section
      className="department-search-results"
      aria-labelledby="department-search-results-title"
    >
      <header className="department-search-results__header">
        <h2 id="department-search-results-title">Resultados</h2>
        <p className="department-search-results__summary" aria-live="polite">
          {employees.length} {employees.length === 1 ? 'empleado' : 'empleados'} ·{' '}
          {groups.length} {groups.length === 1 ? 'departamento' : 'departamentos'}
        </p>
      </header>

      <div className="department-search-results__grid">
        {groups.map((group) => (
          <section className="department-search-group" key={group.area}>
            <header className="department-search-group__header">
              <h3>{group.area}</h3>
              <span
                className="department-search-group__count"
                aria-label={`${group.employees.length} ${group.employees.length === 1 ? 'empleado' : 'empleados'} en ${group.area}`}
              >
                {group.employees.length}
              </span>
            </header>

            <ul className="department-search-group__list">
              {group.employees.map((employee) => (
                <li
                  className="department-search-result"
                  key={employee.id ?? employee.num_empleado}
                >
                  <div className="department-search-result__content">
                    <div className="department-search-result__header">
                      <strong className="department-search-result__name">
                        {employee.nombre}
                      </strong>
                      {(employee.en_incapacidad ||
                        employee.is_starlite ||
                        String(employee.fecha_ingreso).localeCompare(today) > 0) && (
                        <div className="department-search-result__statuses">
                          {employee.en_incapacidad && <IncapacidadBadge iconOnly />}
                          {employee.is_starlite && <StarliteBadge compact />}
                          {String(employee.fecha_ingreso).localeCompare(today) > 0 && (
                            <ProximoIngresoBadge iconOnly />
                          )}
                        </div>
                      )}
                    </div>
                    <p className="department-search-result__metadata">
                      {[`#${employee.num_empleado}`, employee.puesto, getSectionLabel(employee.seccion, group.area)]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>

                  <EmployeeRowActions
                    employee={employee}
                    onEdit={onEdit}
                    onPromote={onPromote}
                    onIncapacidad={onIncapacidad}
                    onDelete={onDelete}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}
