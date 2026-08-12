import type { Baja, Employee } from '@/lib/types';
import { toTitleCase } from '@/lib/utils';

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
