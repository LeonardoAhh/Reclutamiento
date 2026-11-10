import type { Baja, Employee } from '@/lib/types';
import type { ReporteDiarioRecord } from '@/hooks/useReporteDiario';
import { isIncidence } from '@/components/reporte-diario/helpers';
import { toTitleCase } from '@/lib/utils';

export type EmployeeSearchResult = (Employee & { isBaja: false }) | (Baja & { isBaja: true });

export const ALL_FILTER_VALUE = 'all';

export type SearchStatusFilter = typeof ALL_FILTER_VALUE | 'active' | 'inactive';

interface EmployeeIncident {
  key: string;
  date: string;
  code: string;
}

interface EmployeeReportRow {
  numero_empleado: string;
  days: Record<string, unknown>;
}

function isEmployeeReportRow(value: unknown): value is EmployeeReportRow {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.numero_empleado === 'string' &&
    Boolean(candidate.days && typeof candidate.days === 'object' && !Array.isArray(candidate.days))
  );
}

function normalizeEmployeeNumber(value: string) {
  return String(parseInt(value.replace(/\D/g, '') || '0', 10));
}

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

  const searchableText = normalizeSearchText(
    [
      employee.num_empleado,
      employee.nombre,
      employee.puesto,
      employee.area,
      employee.turno,
      employee.isBaja ? employee.motivo_baja : '',
    ].join(' '),
  );

  return tokens.every((token) => searchableText.includes(token));
}

export function uniqueFilterValues(results: EmployeeSearchResult[], field: 'area' | 'turno') {
  const values = new Map<string, string>();

  for (const result of results) {
    const display = String(result[field] ?? '').trim();
    if (!display) continue;
    const normalized = normalizeFilterValue(display);
    if (!values.has(normalized)) values.set(normalized, displayValue(display));
  }

  return Array.from(values, ([value, label]) => ({ value, label })).sort((first, second) =>
    first.label.localeCompare(second.label, 'es'),
  );
}

export function getEmployeeResultId(employee: EmployeeSearchResult) {
  const resultKind = employee.isBaja ? 'baja' : 'activo';
  const identity = employee.id || employee.num_empleado;
  const rawId = `${resultKind}-${identity}`;
  return rawId.replace(/[^a-zA-Z0-9_-]/g, '-');
}

export function displayValue(value: unknown) {
  const text = String(value ?? '').trim();
  return text ? toTitleCase(text) : 'Sin información';
}

export function getEmployeeIncidents(employeeNumber: string, reports: ReporteDiarioRecord[]): EmployeeIncident[] {
  const normalizedEmployeeNumber = normalizeEmployeeNumber(employeeNumber);
  const incidents: EmployeeIncident[] = [];

  for (const report of reports) {
    const monthMatch = /^(\d{4})-(\d{2})$/.exec(report.mes);
    if (!monthMatch || !Array.isArray(report.data)) continue;

    const year = Number(monthMatch[1]);
    const month = Number(monthMatch[2]);
    if (month < 1 || month > 12) continue;

    const employeeRow = report.data.find(
      (candidate): candidate is EmployeeReportRow =>
        isEmployeeReportRow(candidate) &&
        normalizeEmployeeNumber(candidate.numero_empleado) === normalizedEmployeeNumber,
    );
    if (!employeeRow) continue;

    for (const [day, value] of Object.entries(employeeRow.days)) {
      if (!/^\d{2}$/.test(day) || typeof value !== 'string') continue;
      const code = value.trim();
      if (!isIncidence(code)) continue;

      const dayNumber = Number(day);
      const date = new Date(Date.UTC(year, month - 1, dayNumber));
      if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== dayNumber) {
        continue;
      }

      incidents.push({
        key: `${report.id}-${day}`,
        date: `${monthMatch[1]}-${monthMatch[2]}-${day}`,
        code,
      });
    }
  }

  return incidents.sort((first, second) => second.date.localeCompare(first.date));
}

export function getEmployeeRecordedNonIncidentDays(
  employeeNumber: string,
  monthKey: string,
  reports: ReporteDiarioRecord[],
): Map<string, string> {
  const recordedDays = new Map<string, string>();
  const normalizedEmployeeNumber = normalizeEmployeeNumber(employeeNumber);
  const monthMatch = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!monthMatch) return recordedDays;

  const year = Number(monthMatch[1]);
  const month = Number(monthMatch[2]);
  if (month < 1 || month > 12) return recordedDays;

  for (const report of reports) {
    if (report.mes !== monthKey || !Array.isArray(report.data)) continue;

    const employeeRow = report.data.find(
      (candidate): candidate is EmployeeReportRow =>
        isEmployeeReportRow(candidate) &&
        normalizeEmployeeNumber(candidate.numero_empleado) === normalizedEmployeeNumber,
    );
    if (!employeeRow) continue;

    for (const [day, value] of Object.entries(employeeRow.days)) {
      if (!/^\d{2}$/.test(day) || typeof value !== 'string') continue;
      const code = value.trim();
      if (code !== 'A' && code !== 'X' && code !== 'D' && code !== 'DF') continue;

      const dayNumber = Number(day);
      const date = new Date(Date.UTC(year, month - 1, dayNumber));
      if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== dayNumber) {
        continue;
      }

      recordedDays.set(`${monthKey}-${day}`, code);
    }
  }

  return recordedDays;
}

export function getRecentEmployeeIncidents(employeeNumber: string, reports: ReporteDiarioRecord[]): EmployeeIncident[] {
  return getEmployeeIncidents(employeeNumber, reports).slice(0, 7);
}
