import { daysInMonth } from '@/components/reporte-diario/helpers';
import { employeeKey, isReportedIncidence, parseRecordsByMes } from '@/components/reporte-diario/ausentismo-helpers';
import type { ReporteRow } from '@/components/reporte-diario/types';
import type { ReporteDiarioRecord } from '@/hooks/useReporteDiario';

export interface DepartmentIncidence {
  name: string;
}

export interface DepartmentEmployee {
  number: string;
  name: string;
  department: string;
  section: string;
  position: string;
  incidenceCount: number;
  incidenceLevel: DepartmentIncidenceLevel;
  previousDepartments: string[];
  incidenceMonths: { month: string; byCode: Record<string, number> }[];
}

export type DepartmentIncidenceLevel = 'excellent' | 'attention' | 'priority-review';

export const DEPARTMENT_EMPLOYEE_SEARCH_MIN_LENGTH = 4;
export const DEPARTMENT_EMPLOYEE_SEARCH_MAX_RESULTS = 6;

const NON_DEPARTMENT_INCIDENCE_CODES = new Set(['CT', 'V', 'I']);

export interface DepartmentIncidenceData {
  departments: DepartmentIncidence[];
  employeesByDepartment: Map<string, DepartmentEmployee[]>;
}

export function getDepartmentIncidenceLevel(count: number): DepartmentIncidenceLevel {
  if (count < 3) return 'excellent';
  if (count < 9) return 'attention';
  return 'priority-review';
}

export function normalizeDepartmentEmployeeSearch(value: string): string {
  return value.replace(/\D/g, '').slice(0, 5);
}

export function findDepartmentEmployeeMatches(employees: DepartmentEmployee[], query: string): DepartmentEmployee[] {
  if (query.length < DEPARTMENT_EMPLOYEE_SEARCH_MIN_LENGTH) return [];

  const matches: DepartmentEmployee[] = [];
  for (const employee of employees) {
    if (!employee.number.startsWith(query)) continue;
    matches.push(employee);
    if (matches.length === DEPARTMENT_EMPLOYEE_SEARCH_MAX_RESULTS) break;
  }

  return matches;
}

interface EmployeeHistory {
  latest: ReporteRow;
  departments: Set<string>;
  incidentsByMonth: Map<string, Map<string, number>>;
  incidenceCount: number;
}

/** Summarize current employees and their incident history from the saved monthly reports. */
export function summarizeDepartmentIncidences(
  reports: ReporteDiarioRecord[],
  activeEmployeeNumbers: ReadonlySet<string>,
): DepartmentIncidenceData {
  const departments = new Set<string>();
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
        history = {
          latest: row,
          departments: new Set([row.departamento]),
          incidentsByMonth: new Map(),
          incidenceCount: 0,
        };
        employees.set(key, history);
      }

      departments.add(row.departamento);

      for (const [day, code] of Object.entries(row.days)) {
        const dayNumber = Number(day);
        if (dayNumber < 1 || dayNumber > lastDay || !code || code === '-') continue;

        if (!NON_DEPARTMENT_INCIDENCE_CODES.has(code) && isReportedIncidence(code)) {
          const monthCounts = history.incidentsByMonth.get(month) ?? new Map<string, number>();
          monthCounts.set(code, (monthCounts.get(code) ?? 0) + 1);
          history.incidentsByMonth.set(month, monthCounts);
          history.incidenceCount += 1;
        }
      }
    }
  }

  const employeesByDepartment = new Map<string, DepartmentEmployee[]>();
  for (const { latest, departments: history, incidentsByMonth, incidenceCount } of employees.values()) {
    if (!activeEmployeeNumbers.has(latest.numero_empleado.trim())) continue;
    const employee: DepartmentEmployee = {
      number: latest.numero_empleado,
      name: latest.nombre,
      department: latest.departamento,
      section: latest.area,
      position: latest.puesto ?? '',
      incidenceCount,
      incidenceLevel: getDepartmentIncidenceLevel(incidenceCount),
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
      (a, b) =>
        b.incidenceCount - a.incidenceCount ||
        b.number.localeCompare(a.number, 'es-MX', { numeric: true }) ||
        a.name.localeCompare(b.name, 'es-MX'),
    );
  }

  return {
    departments: [...departments].map((name) => ({ name })).sort((a, b) => a.name.localeCompare(b.name, 'es-MX')),
    employeesByDepartment,
  };
}
