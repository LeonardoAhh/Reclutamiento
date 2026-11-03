import { daysInMonth } from '@/components/reporte-diario/helpers';
import { employeeKey, isReportedIncidence, parseRecordsByMes } from '@/components/reporte-diario/ausentismo-helpers';
import type { ReporteRow } from '@/components/reporte-diario/types';
import type { ReporteDiarioRecord } from '@/hooks/useReporteDiario';

interface IncidenceCounts {
  incidents: number;
  trackedDays: number;
}

export interface DepartmentIncidence extends IncidenceCounts {
  name: string;
}

export interface DepartmentEmployee {
  number: string;
  name: string;
  department: string;
  section: string;
  position: string;
  previousDepartments: string[];
  incidenceMonths: { month: string; byCode: Record<string, number> }[];
}

export interface DepartmentIncidenceData {
  departments: DepartmentIncidence[];
  employeesByDepartment: Map<string, DepartmentEmployee[]>;
}

interface EmployeeHistory {
  latest: ReporteRow;
  departments: Set<string>;
  incidentsByMonth: Map<string, Map<string, number>>;
}

/** Count each recorded employee-day once across the saved monthly reports. */
export function summarizeDepartmentIncidences(
  reports: ReporteDiarioRecord[],
  activeEmployeeNumbers: ReadonlySet<string>,
): DepartmentIncidenceData {
  const departments = new Map<string, DepartmentIncidence>();
  const employees = new Map<string, EmployeeHistory>();

  const months = [...parseRecordsByMes(reports)].sort(([first], [second]) => first.localeCompare(second));
  for (const [month, rows] of months) {
    const lastDay = daysInMonth(month);

    for (const row of rows) {
      const key = employeeKey(row);
      let history = employees.get(key);
      if (history) {
        history.latest = row;
        history.departments.add(row.departamento);
      } else {
        history = { latest: row, departments: new Set([row.departamento]), incidentsByMonth: new Map() };
        employees.set(key, history);
      }

      let department = departments.get(row.departamento);
      if (!department) {
        department = { name: row.departamento, incidents: 0, trackedDays: 0 };
        departments.set(row.departamento, department);
      }

      for (const [day, code] of Object.entries(row.days)) {
        const dayNumber = Number(day);
        if (dayNumber < 1 || dayNumber > lastDay || !code || code === '-') continue;

        department.trackedDays += 1;
        if (isReportedIncidence(code)) {
          department.incidents += 1;
          const monthCounts = history.incidentsByMonth.get(month) ?? new Map<string, number>();
          monthCounts.set(code, (monthCounts.get(code) ?? 0) + 1);
          history.incidentsByMonth.set(month, monthCounts);
        }
      }
    }
  }

  const employeesByDepartment = new Map<string, DepartmentEmployee[]>();
  for (const { latest, departments: history, incidentsByMonth } of employees.values()) {
    if (!activeEmployeeNumbers.has(latest.numero_empleado.trim())) continue;
    const employee: DepartmentEmployee = {
      number: latest.numero_empleado,
      name: latest.nombre,
      department: latest.departamento,
      section: latest.area,
      position: latest.puesto ?? '',
      previousDepartments: [...history]
        .filter((department) => department !== latest.departamento)
        .sort((a, b) => a.localeCompare(b, 'es-MX')),
      incidenceMonths: [...incidentsByMonth]
        .map(([month, counts]) => ({ month, byCode: Object.fromEntries(counts) }))
        .sort((a, b) => b.month.localeCompare(a.month)),
    };
    const group = employeesByDepartment.get(employee.department) ?? [];
    group.push(employee);
    employeesByDepartment.set(employee.department, group);
  }
  for (const group of employeesByDepartment.values()) {
    group.sort(
      (a, b) => a.number.localeCompare(b.number, 'es-MX', { numeric: true }) || a.name.localeCompare(b.name, 'es-MX'),
    );
  }

  return {
    departments: [...departments.values()].sort((a, b) => a.name.localeCompare(b.name, 'es-MX')),
    employeesByDepartment,
  };
}
