import type {
  AuthorizedPosition,
  Employee,
  EmployeeRaw,
  PositionCoverage,
  DepartmentCoverage,
  PositionComment,
} from './types';
import { PLANTILLA_AUTORIZADA } from './constants';

/**
 * Transform raw JSON employee data to normalized DB format
 */
export function transformEmployeeData(raw: EmployeeRaw): Omit<Employee, 'id'> {
  return {
    num_empleado: raw['Num Empleado'],
    nombre: raw['Nombre'],
    area: raw['Area'],
    seccion: raw['Seccion'],
    puesto: raw['Puesto'],
    categoria: raw['Categoria'] || 'N/A',
    turno: raw['Turno'] || '0',
    fecha_ingreso: raw['Fecha Ingreso'] || '',
  };
}

/**
 * Normalize string by stripping accents and trimming
 */
export function normalizeString(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normalize a single position name by stripping trailing category letter (A/B/C/D)
 * and removing accents.
 */
export function normalizePuesto(puesto: string): string {
  return normalizeString(puesto).replace(/\s+[A-D]$/, '');
}

/**
 * Flexible text matching for areas and sections
 */
function matchesText(empVal: string, constVal: string): boolean {
  const e = normalizeString(empVal);
  const c = normalizeString(constVal);
  if (e === c) return true;
  if (e.length > 3 && c.length > 3) {
    return e.includes(c) || c.includes(e);
  }
  return false;
}

/**
 * Apply synonym rules so equivalent puestos resolve to the same canonical form.
 * Keep this list short: every entry can mask a real mismatch, so only add
 * pairs that we know are interchangeable in the real plantilla data.
 */
function canonicalPuesto(puesto: string): string {
  return puesto.replace(/\bGERENCIA\b/g, 'GERENTE');
}

/**
 * Strict puesto matching: an employee puesto matches a constant puesto only when
 * they normalize (accent-stripped, category-letter-stripped, synonym-applied) to
 * the exact same string. Substring fallbacks are intentionally avoided because
 * puestos like "TÉCNICO DE MANTENIMIENTO" would otherwise leak into
 * "TÉCNICO DE MANTENIMIENTO DE EDIFICIOS" and inflate the headcount.
 */
function matchesPuesto(empPuesto: string, constPuesto: string): boolean {
  if (!empPuesto) return false;
  const target = canonicalPuesto(normalizePuesto(constPuesto));
  const parts = empPuesto.split('/').map((p) => canonicalPuesto(normalizePuesto(p)));
  return parts.some((part) => part === target);
}

/**
 * Drop duplicate employees by `num_empleado` keeping the most recent entry.
 * Defensive guard so stale records cached from Supabase don't inflate counts.
 */
function dedupeEmployees(employees: Employee[]): Employee[] {
  const byNum = new Map<string, Employee>();
  for (const emp of employees) {
    const key = (emp.num_empleado ?? '').trim();
    if (!key) continue;
    byNum.set(key, emp);
  }
  return Array.from(byNum.values());
}

/**
 * Calculate coverage per position using constants + employee data.
 *
 * Acepta una lista opcional de puestos (`positions`) que combina la
 * `PLANTILLA_AUTORIZADA` estática con los puestos creados desde la UI
 * (custom_positions). Si no se pasa, cae a la lista estática para mantener
 * compatibilidad con llamadores legacy.
 */
export function calculatePositionCoverage(
  employees: Employee[],
  comments: PositionComment[],
  positions: AuthorizedPosition[] = PLANTILLA_AUTORIZADA
): PositionCoverage[] {
  const uniqueEmployees = dedupeEmployees(employees);

  return positions.map((pos) => {
    const real = uniqueEmployees.filter(
      (emp) =>
        matchesText(emp.area, pos.area) &&
        matchesText(emp.seccion, pos.seccion) &&
        matchesPuesto(emp.puesto, pos.puesto)
    ).length;

    const backup = pos.backup ?? 0;
    /*
     * `plantilla_objetivo` es el target operativo: la suma de la plantilla
     * autorizada más el buffer de back-up definido para el puesto. Es el
     * denominador de la cobertura y la base de las vacantes — si un puesto
     * no tiene back-up declarado, el objetivo iguala la autorizada y el
     * cálculo se comporta exactamente como antes.
     */
    const objetivo = pos.plantilla_autorizada + backup;

    const vacantes = Math.max(0, objetivo - real);
    const porcentaje = objetivo > 0
      ? Math.round((real / objetivo) * 100)
      : 0;

    const excedente = Math.max(0, real - pos.plantilla_autorizada);
    const excedenteBackup = Math.min(excedente, backup);
    const excedenteCritico = Math.max(0, excedente - backup);

    const posComments = comments.filter(
      (c) =>
        matchesText(c.area, pos.area) &&
        matchesText(c.seccion || '', pos.seccion) &&
        matchesPuesto(c.puesto, pos.puesto)
    );

    return {
      area: pos.area,
      seccion: pos.seccion,
      puesto: pos.puesto,
      plantilla_autorizada: pos.plantilla_autorizada,
      plantilla_objetivo: objetivo,
      plantilla_real: real,
      vacantes,
      porcentaje_cobertura: porcentaje,
      comentarios: posComments,
      urgentes: Math.max(0, pos.urgentes ?? 0),
      backup,
      notas: pos.notas,
      excedente,
      excedente_backup: excedenteBackup,
      excedente_critico: excedenteCritico,
    };
  });
}

/**
 * Aggregate position coverage into department-level data
 */
export function calculateDepartmentCoverage(
  positions: PositionCoverage[]
): DepartmentCoverage[] {
  const grouped = new Map<string, PositionCoverage[]>();

  for (const pos of positions) {
    const existing = grouped.get(pos.area) || [];
    existing.push(pos);
    grouped.set(pos.area, existing);
  }

  return Array.from(grouped.entries()).map(([area, puestos]) => {
    const totalAutorizada = puestos.reduce((sum, p) => sum + p.plantilla_autorizada, 0);
    const totalObjetivo = puestos.reduce((sum, p) => sum + p.plantilla_objetivo, 0);
    const totalReal = puestos.reduce((sum, p) => sum + p.plantilla_real, 0);
    const totalVacantes = puestos.reduce((sum, p) => sum + p.vacantes, 0);
    const porcentaje = totalObjetivo > 0
      ? Math.round((totalReal / totalObjetivo) * 100)
      : 0;

    const urgentes = puestos.reduce((sum, p) => sum + p.urgentes, 0);

    return {
      area,
      plantilla_autorizada: totalAutorizada,
      plantilla_objetivo: totalObjetivo,
      plantilla_real: totalReal,
      vacantes: totalVacantes,
      porcentaje_cobertura: porcentaje,
      puestos,
      urgentes,
    };
  });
}

/**
 * Get coverage color based on percentage — uses design tokens
 */
export function getCoverageColor(percentage: number): string {
  if (percentage >= 100) return 'var(--color-success)';
  if (percentage >= 75) return 'var(--color-accent-teal)';
  if (percentage >= 50) return 'var(--color-accent-amber)';
  return 'var(--color-error)';
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number): string {
  return `${Math.min(value, 100)}%`;
}
