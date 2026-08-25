import type { Baja, Employee } from '@/lib/types';
import { toTitleCase } from '@/lib/utils';
import type { ReporteDiarioRecord } from '@/hooks/useReporteDiario';
import type { ReporteRow } from '@/components/reporte-diario/types';

const STICKER_TONES = 5;

export type SearchViewMode = 'detail' | 'compact';

export type EmployeeSearchResult =
  | (Employee & { isBaja: false })
  | (Baja & { isBaja: true });

export function normalizeFilterValue(value: string) {
  return value.trim().toLocaleLowerCase('es');
}

export function normalizeSearchText(text: string) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .trim();
}

export function matchesSearchTokens(employee: EmployeeSearchResult, tokens: string[]) {
  if (tokens.length === 0) return true;
  
  const searchableText = normalizeSearchText([
    employee.num_empleado,
    employee.nombre,
    employee.puesto,
    employee.area,
    employee.turno,
    employee.isBaja ? employee.motivo_baja : ''
  ].join(' '));

  return tokens.every(token => searchableText.includes(token));
}

export function uniqueFilterValues(
  results: EmployeeSearchResult[],
  field: 'area' | 'turno',
) {
  const values = new Map<string, string>();

  for (const result of results) {
    const display = String(result[field] ?? '').trim();
    if (!display) continue;
    const normalized = normalizeFilterValue(display);
    if (!values.has(normalized)) values.set(normalized, displayValue(display));
  }

  return Array.from(values, ([value, label]) => ({ value, label })).sort(
    (first, second) => first.label.localeCompare(second.label, 'es'),
  );
}

export function getEmployeeResultId(employee: EmployeeSearchResult) {
  const resultKind = employee.isBaja ? 'baja' : 'activo';
  const identity = employee.id || employee.num_empleado;
  const rawId = `${resultKind}-${identity}`;
  return rawId.replace(/[^a-zA-Z0-9_-]/g, '-');
}

export function getStickerTone(employeeNumber: string) {
  const numericValue = parseInt(employeeNumber.replace(/\D/g, '') || '0', 10);
  return numericValue % STICKER_TONES;
}

export function displayValue(value: unknown) {
  const text = String(value ?? '').trim();
  return text ? toTitleCase(text) : 'Sin información';
}

export function isNuevoIngreso(fecha_ingreso?: string | null): boolean {
  if (!fecha_ingreso) return false;
  // Use UTC to avoid timezone issues when parsing YYYY-MM-DD
  const [year, month, day] = fecha_ingreso.split('-').map(Number);
  if (!year || !month || !day) return false;
  
  const ingreso = new Date(year, month - 1, day);
  const now = new Date();
  
  // Calculate difference in days
  const diffTime = now.getTime() - ingreso.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays >= 0 && diffDays <= 90;
}

export function hasExcesoFaltas(num_empleado: string, allReports: ReporteDiarioRecord[]): boolean {
  const faltaDates: Date[] = [];
  
  for (const report of allReports) {
    if (!report.data || !Array.isArray(report.data)) continue;
    const rows = report.data as ReporteRow[];
    const employeeRow = rows.find(r => String(r.numero_empleado) === String(num_empleado));
    if (!employeeRow || !employeeRow.days) continue;
    
    const [yearStr, monthStr] = report.mes.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    
    for (const [dayStr, incident] of Object.entries(employeeRow.days)) {
      if (incident === 'F') {
        const day = parseInt(dayStr, 10);
        if (!isNaN(day)) {
          faltaDates.push(new Date(year, month, day));
        }
      }
    }
  }
  
  faltaDates.sort((a, b) => a.getTime() - b.getTime());
  
  // Regla 1: 3 faltas en un mes (30 días inclusivos)
  for (let i = 0; i <= faltaDates.length - 3; i++) {
    const start = faltaDates[i];
    const end = faltaDates[i + 2];
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 29) {
      return true;
    }
  }

  // Regla 2: 2 faltas en una semana (7 días inclusivos)
  for (let i = 0; i <= faltaDates.length - 2; i++) {
    const start = faltaDates[i];
    const end = faltaDates[i + 1];
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 6) {
      return true;
    }
  }
  
  return false;
}
