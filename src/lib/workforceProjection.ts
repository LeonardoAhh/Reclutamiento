import type { AuthorizedPosition, Employee, PositionCoverage } from './types';
import { localDateToIso } from './dates';
import { calculatePositionCoverage, matchesEmployeeToPosition, normalizePuesto, normalizeString } from './utils';

export interface CoverageCategory {
  target: number;
  covered: number;
  vacancies: number;
  percentage: number | null;
}

export interface WorkforceSnapshot {
  plantilla: CoverageCategory;
  backup: CoverageCategory;
  starlite: CoverageCategory;
  surplus: number;
  real: number;
}

function category(target: number, covered: number): CoverageCategory {
  return {
    target,
    covered,
    vacancies: target - covered,
    // Evita anunciar 100% por redondeo mientras aún existan plazas pendientes.
    percentage: target > 0 ? Math.floor((covered * 1000) / target) / 10 : null,
  };
}

export function summarizeWorkforceCoverage(
  positions: readonly PositionCoverage[],
  dismissedKeys: ReadonlySet<string>,
): WorkforceSnapshot {
  const totals = {
    plantilla: { target: 0, covered: 0 },
    backup: { target: 0, covered: 0 },
    starlite: { target: 0, covered: 0 },
    surplus: 0,
    real: 0,
  };
  for (const position of positions) {
    const key = `${position.area}-${position.seccion || 'none'}-${position.puesto}`;
    if (dismissedKeys.has(key)) continue;
    // Starlite es independiente: su excedente no cubre plantilla ni backup.
    // Solo el excedente regular del mismo puesto puede ocupar su backup.
    const starlite = position.starlite_empleados;
    const regular = Math.max(0, position.plantilla_real - starlite);
    const regularSurplus = Math.max(0, regular - position.plantilla_autorizada);
    const categories = [
      [totals.plantilla, position.plantilla_autorizada, regular],
      [totals.backup, position.backup, regularSurplus],
      [totals.starlite, position.urgentes, starlite],
    ] as const;
    for (const [total, target, available] of categories) {
      total.target += target;
      total.covered += Math.max(0, Math.min(target, available));
    }
    totals.surplus += Math.max(0, regularSurplus - position.backup) +
      Math.max(0, starlite - position.urgentes);
    totals.real += position.plantilla_real;
  }
  return {
    plantilla: category(totals.plantilla.target, totals.plantilla.covered),
    backup: category(totals.backup.target, totals.backup.covered),
    starlite: category(totals.starlite.target, totals.starlite.covered),
    surplus: totals.surplus,
    real: totals.real,
  };
}

export function calculateWorkforceProjection(
  employees: readonly Employee[],
  positions: AuthorizedPosition[],
  todayIso: string,
  dismissedKeys: ReadonlySet<string>,
) {
  // La fila histórica «(STARLITE)» repite el objetivo ya configurado por puesto.
  // No suma otra plantilla; sus empleados siguen emparejando con la sección base.
  // Una sección sin contraparte o con metas propias de backup/Starlite se conserva.
  const projectionPositions = positions.filter((position) => {
    const section = normalizeString(position.seccion);
    const baseSection = section.replace(/\s*\(STARLITE\)$/, '');
    if (section === baseSection || position.backup || position.urgentes) return true;
    return !positions.some((candidate) =>
      normalizeString(candidate.area) === normalizeString(position.area) &&
      normalizeString(candidate.seccion) === baseSection &&
      normalizePuesto(candidate.puesto) === normalizePuesto(position.puesto),
    );
  });
  // Conserva la política de calculatePositionCoverage: una fila por número, última gana.
  const uniqueEmployees = new Map<string, Employee>();
  for (const employee of employees) {
    const number = employee.num_empleado?.trim();
    if (number) uniqueEmployees.set(number, employee);
  }
  const datedEmployees = Array.from(uniqueEmployees.values()).map((employee) => {
    const candidates = projectionPositions.filter((position) => matchesEmployeeToPosition(employee, position));
    const exact = candidates.filter((position) =>
      normalizeString(employee.area) === normalizeString(position.area) &&
      normalizeString(employee.seccion) === normalizeString(position.seccion),
    );
    // Una sección no ocupa también otra que contiene su nombre (p. ej., Starlite).
    // Se conserva la coincidencia flexible solo cuando identifica un único puesto.
    const matches = exact.length > 0 ? exact : candidates;
    return {
      employee,
      date: localDateToIso(employee.fecha_ingreso),
      position: matches.length === 1 ? matches[0] : undefined,
      ambiguous: matches.length > 1,
    };
  });
  const nextHireDate = datedEmployees.reduce<string | null>((next, entry) => {
    const date = entry.date?.slice(0, 10);
    if (!date || date <= todayIso) return next;
    return next === null || date < next ? date : next;
  }, null);
  const snapshotAt = (date: string) => summarizeWorkforceCoverage(
    projectionPositions.flatMap((position) => calculatePositionCoverage(
      datedEmployees.filter((entry) => entry.position === position && entry.date && entry.date.slice(0, 10) <= date)
        .map((entry) => entry.employee),
      [],
      [position],
      date,
    )),
    dismissedKeys,
  );
  const current = snapshotAt(todayIso);
  const projected = nextHireDate ? snapshotAt(nextHireDate) : current;
  // Snapshot que incluye todos los próximos ingresos registrados, para
  // reflejar las vacantes reales descontando los ingresos futuros confirmados.
  const withAllProximos = snapshotAt('9999-12-31');
  return {
    current,
    projected,
    withAllProximos,
    nextHireDate,
    scheduledHires: datedEmployees.filter((entry) => entry.position && entry.date &&
      entry.date.slice(0, 10) === nextHireDate &&
      !dismissedKeys.has(`${entry.position.area}-${entry.position.seccion || 'none'}-${entry.position.puesto}`),
    ).length,
    undatedEmployees: datedEmployees.filter((entry) => !entry.date).length,
    ambiguousEmployees: datedEmployees.filter((entry) => entry.ambiguous && entry.date &&
      entry.date.slice(0, 10) <= (nextHireDate ?? todayIso),
    ).length,
  };
}

export type WorkforceProjection = ReturnType<typeof calculateWorkforceProjection>;
