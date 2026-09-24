import type { Baja, Employee } from '@/lib/types';

export type ProfileTemplateStatus = 'draft' | 'active' | 'archived';
export type ProfileEvaluationStatus = 'draft' | 'submitted';
export type ProfileEmployeeSource = 'active' | 'baja';

export interface ProfileCycle {
  id: string;
  name: string;
  starts_on: string;
  ends_on: string;
}

export interface ProfileCriterion {
  id: string;
  template_id: string;
  category: string;
  description: string;
  display_order: number;
  weight_bps: number;
  is_scorable: boolean;
}

export interface ProfileTemplate {
  id: string;
  area: string;
  puesto: string;
  version: number;
  status: ProfileTemplateStatus;
  source: 'manual' | 'import';
  created_at: string;
  activated_at: string | null;
  criteria: ProfileCriterion[];
}

export interface ProfileEvaluationItem {
  id: string;
  evaluation_id: string;
  criterion_id: string;
  category_snapshot: string;
  description_snapshot: string;
  weight_bps_snapshot: number;
  complies: boolean;
  contribution_bps: number;
}

export interface ProfileEvaluation {
  id: string;
  cycle_id: string;
  template_id: string;
  employee_num: string;
  employee_name: string;
  employee_area: string;
  employee_section: string;
  employee_position: string;
  employee_entry_date: string;
  employee_recruiter: string | null;
  employee_source: ProfileEmployeeSource;
  employee_exit_date: string | null;
  employee_exit_reason: string | null;
  status: ProfileEvaluationStatus;
  score_bps: number;
  comments: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  items: ProfileEvaluationItem[];
}

export interface EligibleProfileEmployee {
  key: string;
  num: string;
  name: string;
  area: string;
  section: string;
  position: string;
  entryDate: string;
  recruiter: string;
  source: ProfileEmployeeSource;
  exitDate: string;
  exitReason: string;
}

export interface EditableCriterion {
  key: string;
  category: string;
  description: string;
  weightBps: number;
  isScorable: boolean;
}

const normalizeText = (value: string) =>
  value.trim().replace(/\s+/g, ' ').toLocaleUpperCase('es-MX');

export function profilePositionKey(area: string, position: string): string {
  return [area, position].map(normalizeText).join('|');
}

export function profileHiringKey(employeeNumber: string, entryDate: string): string {
  return `${employeeNumber.trim()}|${entryDate.slice(0, 10)}`;
}

export function buildEligibleProfileEmployees(
  employees: Employee[],
  bajas: Baja[],
  cycle: ProfileCycle | null,
): EligibleProfileEmployee[] {
  if (!cycle) return [];
  const byHiring = new Map<string, EligibleProfileEmployee>();
  const inCycle = (date: string) => {
    const value = date.slice(0, 10);
    return value >= cycle.starts_on && value <= cycle.ends_on;
  };

  for (const employee of employees) {
    if (!employee.fecha_ingreso || !inCycle(employee.fecha_ingreso)) continue;
    const key = profileHiringKey(employee.num_empleado, employee.fecha_ingreso);
    byHiring.set(key, {
      key,
      num: employee.num_empleado,
      name: employee.nombre,
      area: employee.area,
      section: employee.seccion,
      position: employee.puesto,
      entryDate: employee.fecha_ingreso.slice(0, 10),
      recruiter: employee.reclutador?.trim() ?? '',
      source: 'active',
      exitDate: '',
      exitReason: '',
    });
  }

  for (const baja of bajas) {
    if (!baja.fecha_ingreso || !inCycle(baja.fecha_ingreso)) continue;
    const key = profileHiringKey(baja.num_empleado, baja.fecha_ingreso);
    byHiring.set(key, {
      key,
      num: baja.num_empleado,
      name: baja.nombre,
      area: baja.area,
      section: baja.seccion,
      position: baja.puesto,
      entryDate: baja.fecha_ingreso.slice(0, 10),
      recruiter: baja.reclutador?.trim() ?? '',
      source: 'baja',
      exitDate: baja.fecha_baja?.slice(0, 10) ?? '',
      exitReason: baja.motivo_baja?.trim() ?? '',
    });
  }

  return Array.from(byHiring.values()).sort(
    (left, right) => left.entryDate.localeCompare(right.entryDate) || left.name.localeCompare(right.name, 'es-MX'),
  );
}
