import type { Employee } from '@/lib/types';

export interface DepartmentGroup {
  area: string;
  empleados: Employee[];
}

function compareEmployeeNumber(first: string, second: string): number {
  const firstNumber = Number(first);
  const secondNumber = Number(second);

  if (!Number.isNaN(firstNumber) && !Number.isNaN(secondNumber)) {
    return firstNumber - secondNumber;
  }

  return first.localeCompare(second, 'es', { numeric: true });
}

export function groupEmployees(
  employees: Employee[],
  searchTerm: string,
  showOnlyStarlite: boolean
): DepartmentGroup[] {
  const normalizedTerm = searchTerm.trim().toUpperCase();
  const employeesByArea = new Map<string, Employee[]>();

  for (const employee of employees) {
    if (showOnlyStarlite && !employee.is_starlite) continue;

    const matchesSearch =
      !normalizedTerm ||
      employee.nombre.toUpperCase().includes(normalizedTerm) ||
      employee.num_empleado.toUpperCase().includes(normalizedTerm) ||
      employee.puesto.toUpperCase().includes(normalizedTerm) ||
      employee.area.toUpperCase().includes(normalizedTerm) ||
      employee.seccion.toUpperCase().includes(normalizedTerm);

    if (!matchesSearch) continue;

    const area = employee.area || 'Sin departamento';
    const areaEmployees = employeesByArea.get(area) ?? [];
    areaEmployees.push(employee);
    employeesByArea.set(area, areaEmployees);
  }

  return Array.from(employeesByArea.entries())
    .map(([area, areaEmployees]) => ({
      area,
      empleados: [...areaEmployees].sort((first, second) =>
        compareEmployeeNumber(first.num_empleado, second.num_empleado)
      ),
    }))
    .sort((first, second) => first.area.localeCompare(second.area, 'es'));
}
