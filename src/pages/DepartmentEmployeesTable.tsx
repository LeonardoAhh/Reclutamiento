import { ArrowDown, CircleCheckBig, History, Siren, TriangleAlert, type LucideIcon } from 'lucide-react';
import { useState, type RefObject } from 'react';
import { useReportLocale } from '@/components/reporte-diario/useReportLocale';
import { Tooltip } from '@/components/ui/Tooltip';
import type { DepartmentEmployee, DepartmentIncidenceLevel } from './department-incidences';

const INCIDENCE_LEVEL_PRESENTATION: Record<
  DepartmentIncidenceLevel,
  { label: { es: string; en: string }; icon: LucideIcon; className: string }
> = {
  excellent: {
    label: { es: 'Excelente', en: 'Excellent' },
    icon: CircleCheckBig,
    className: 'department-incidences-page__indicator--excellent',
  },
  attention: {
    label: { es: 'Atención', en: 'Attention' },
    icon: TriangleAlert,
    className: 'department-incidences-page__indicator--attention',
  },
  'priority-review': {
    label: { es: 'Revisión prioritaria', en: 'Priority review' },
    icon: Siren,
    className: 'department-incidences-page__indicator--priority',
  },
};

function PreviousDepartmentsTooltip({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Tooltip content={label} open={open} onOpenChange={setOpen}>
      <button
        type="button"
        className="department-incidences-page__history"
        aria-label={label}
        onClick={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <History size="var(--icon-size-sm)" aria-hidden="true" />
      </button>
    </Tooltip>
  );
}

interface DepartmentEmployeesTableProps {
  employees: DepartmentEmployee[];
  departmentName: string;
  tableRef: RefObject<HTMLTableElement | null>;
  onSelectEmployee: (number: string) => void;
}

export function DepartmentEmployeesTable({
  employees,
  departmentName,
  tableRef,
  onSelectEmployee,
}: DepartmentEmployeesTableProps) {
  const { copy } = useReportLocale();

  return (
    <table ref={tableRef} className="data-table department-incidences-page__table">
      <caption className="sr-only">
        {copy(
          `Empleados de ${departmentName}, ordenados por incidencias y número de empleado de mayor a menor`,
          `Employees in ${departmentName}, sorted by incidents and employee number in descending order`,
        )}
      </caption>
      <thead>
        <tr>
          <th scope="col">
            <span className="department-incidences-page__sort-label">{copy('Núm. Emp.', 'Emp. No.')}</span>
          </th>
          <th scope="col">{copy('Nombre', 'Name')}</th>
          <th scope="col">{copy('Sección', 'Section')}</th>
          <th scope="col">{copy('Puesto', 'Position')}</th>
          <th scope="col" aria-sort="descending">
            <span className="department-incidences-page__sort-label">
              {copy('Indicador', 'Indicator')}
              <ArrowDown size="var(--icon-size-sm)" aria-hidden="true" />
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        {employees.map((employee) => {
          const historyLabel = `${copy('Antes en: ', 'Previously in: ')}${employee.previousDepartments.join(', ')}`;
          const incidenceLevel = INCIDENCE_LEVEL_PRESENTATION[employee.incidenceLevel];
          const IncidenceIcon = incidenceLevel.icon;
          return (
            <tr key={employee.number}>
              <td>{employee.number}</td>
              <th scope="row">
                <span className="department-incidences-page__employee-name">
                  <button
                    type="button"
                    className="department-incidences-page__employee-button"
                    data-employee={employee.number}
                    onClick={() => onSelectEmployee(employee.number)}
                  >
                    {employee.name}
                  </button>
                  {employee.previousDepartments.length > 0 && <PreviousDepartmentsTooltip label={historyLabel} />}
                </span>
              </th>
              <td>{employee.section}</td>
              <td>{employee.position || '—'}</td>
              <td>
                <span className={`department-incidences-page__indicator ${incidenceLevel.className}`}>
                  <IncidenceIcon size="var(--icon-size-md)" aria-hidden="true" />
                  <span className="sr-only">
                    {copy(
                      `${incidenceLevel.label.es}: ${employee.incidenceCount} incidencias en el historial cargado`,
                      `${incidenceLevel.label.en}: ${employee.incidenceCount} incidents in the loaded history`,
                    )}
                  </span>
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
