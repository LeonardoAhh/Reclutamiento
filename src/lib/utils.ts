import type { Employee, EmployeeRaw, PositionCoverage, DepartmentCoverage, PositionComment } from './types';
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
 * Check if employee puesto matches a constant puesto.
 * Handles compound puestos and minor differences like "GERENTE" vs "GERENCIA"
 */
function matchesPuesto(empPuesto: string, constPuesto: string): boolean {
  if (!empPuesto) return false;
  const normalizedConst = normalizePuesto(constPuesto);
  const parts = empPuesto.split('/').map((p) => normalizePuesto(p));
  
  return parts.some((part) => {
    if (part === normalizedConst) return true;
    if (part.includes(normalizedConst) || normalizedConst.includes(part)) return true;
    
    // Fuzzy matching for GERENTE / GERENCIA
    const partGerente = part.replace('GERENCIA', 'GERENTE');
    const constGerente = normalizedConst.replace('GERENCIA', 'GERENTE');
    if (partGerente === constGerente) return true;
    
    return false;
  });
}

/**
 * Calculate coverage per position using constants + employee data
 */
export function calculatePositionCoverage(
  employees: Employee[],
  comments: PositionComment[]
): PositionCoverage[] {
  return PLANTILLA_AUTORIZADA.map((pos) => {
    const real = employees.filter(
      (emp) =>
        matchesText(emp.area, pos.area) &&
        matchesText(emp.seccion, pos.seccion) &&
        matchesPuesto(emp.puesto, pos.puesto)
    ).length;

    const vacantes = Math.max(0, pos.plantilla_autorizada - real);
    const porcentaje = pos.plantilla_autorizada > 0
      ? Math.round((real / pos.plantilla_autorizada) * 100)
      : 0;

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
      plantilla_real: real,
      vacantes,
      porcentaje_cobertura: porcentaje,
      comentarios: posComments,
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
    const totalReal = puestos.reduce((sum, p) => sum + p.plantilla_real, 0);
    const totalVacantes = puestos.reduce((sum, p) => sum + p.vacantes, 0);
    const porcentaje = totalAutorizada > 0
      ? Math.round((totalReal / totalAutorizada) * 100)
      : 0;

    return {
      area,
      plantilla_autorizada: totalAutorizada,
      plantilla_real: totalReal,
      vacantes: totalVacantes,
      porcentaje_cobertura: porcentaje,
      puestos,
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
