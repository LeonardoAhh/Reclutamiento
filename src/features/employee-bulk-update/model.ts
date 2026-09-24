import type { Employee, EmployeeAssignmentUpdate } from '@/lib/types';

export interface EmployeeAssignmentPreviewRow {
  employee: Employee;
  update: EmployeeAssignmentUpdate;
}

export interface EmployeeAssignmentPreview {
  changes: EmployeeAssignmentPreviewRow[];
  notFound: string[];
  unchanged: number;
}

type ParsedAssignments =
  | { ok: true; updates: EmployeeAssignmentUpdate[] }
  | { ok: false; errors: string[] };

function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function readValue(record: Record<string, unknown>, aliases: string[]): unknown {
  const entries = Object.entries(record);
  for (const alias of aliases) {
    const target = normalizeKey(alias);
    const match = entries.find(([key]) => normalizeKey(key) === target);
    if (match) return match[1];
  }
  return undefined;
}

function requiredText(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value).trim();
  return text || null;
}

export function parseEmployeeAssignmentJson(value: unknown): ParsedAssignments {
  if (!Array.isArray(value) || value.length === 0) {
    return { ok: false, errors: ['El archivo debe contener una lista con al menos un empleado.'] };
  }

  const errors: string[] = [];
  const updates: EmployeeAssignmentUpdate[] = [];
  const seen = new Set<string>();

  value.forEach((item, index) => {
    const row = index + 1;
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push(`Fila ${row}: debe ser un objeto.`);
      return;
    }

    const record = item as Record<string, unknown>;
    const num_empleado = requiredText(readValue(record, ['Num Empleado', 'Número de empleado', 'num_empleado']));
    const puesto = requiredText(readValue(record, ['Puesto']));
    const categoria = requiredText(readValue(record, ['Categoria', 'Categoría']));
    const turno = requiredText(readValue(record, ['Turno']));

    if (!num_empleado || !puesto || !categoria || !turno) {
      errors.push(`Fila ${row}: requiere Num Empleado, Puesto, Categoria y Turno con valor.`);
      return;
    }
    if (seen.has(num_empleado)) {
      errors.push(`Fila ${row}: el empleado ${num_empleado} está repetido.`);
      return;
    }

    seen.add(num_empleado);
    updates.push({ num_empleado, puesto, categoria, turno });
  });

  return errors.length > 0 ? { ok: false, errors } : { ok: true, updates };
}

export function buildEmployeeAssignmentPreview(
  employees: Employee[],
  updates: EmployeeAssignmentUpdate[],
): EmployeeAssignmentPreview {
  const employeesByNumber = new Map(employees.map(employee => [employee.num_empleado.trim(), employee]));
  const changes: EmployeeAssignmentPreviewRow[] = [];
  const notFound: string[] = [];
  let unchanged = 0;

  for (const update of updates) {
    const employee = employeesByNumber.get(update.num_empleado);
    if (!employee) {
      notFound.push(update.num_empleado);
      continue;
    }

    const changed = employee.puesto.trim() !== update.puesto
      || employee.categoria.trim() !== update.categoria
      || employee.turno.trim() !== update.turno;
    if (!changed) {
      unchanged += 1;
      continue;
    }
    changes.push({ employee, update });
  }

  return { changes, notFound, unchanged };
}
