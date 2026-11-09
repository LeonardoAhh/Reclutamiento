import { computeMonthlyComparison, type BajaWithCobertura } from '@/lib/bajas';
import { parseDdMmYyyy, type CalendarQuarter } from '@/lib/dates';
import type { AuthorizedPosition, Baja, Employee } from '@/lib/types';
import { canonicalizeKeyPart, canonicalizePuesto, normalizeString } from '@/lib/utils';

export const REPORT_SGI_DEPARTMENTS = [
  {
    id: 'produccion',
    area: 'PRODUCCIÓN',
    label: 'Producción',
    referenceSection: 'PRODUCCIÓN 1ER. TURNO',
    referencePosition: 'OPERADOR DE MÁQUINA',
  },
  {
    id: 'calidad',
    area: 'CALIDAD',
    label: 'Calidad',
    referenceSection: 'A. CALIDAD 1ER TURNO',
    referencePosition: 'OPERADOR DE ACABADOS GP-12',
  },
] as const;

const PRODUCTION_REPLACEMENT_POSITION = 'OPERADOR DE MÁQUINA';

export interface DepartmentQuarterReport {
  ingresos: number;
  bajas: number;
  soloInduccion: number;
  cubiertas: number;
  averageCoverage: number | null;
  rows: BajaWithCobertura[];
  authorizedPositions: number;
  referenceStaffing: { authorized: number; backup: number } | null;
}

function getHireRecords(bajas: Baja[], employees: Employee[]): Employee[] {
  const hireKey = (numEmpleado: string, fechaIngreso: string) =>
    `${numEmpleado}::${parseDdMmYyyy(fechaIngreso) ?? fechaIngreso}`;
  const knownHires = new Set(employees.map((employee) => hireKey(employee.num_empleado, employee.fecha_ingreso)));
  const formerEmployeeHires: Employee[] = [];

  for (const baja of bajas) {
    if (!baja.fecha_ingreso) continue;
    const key = hireKey(baja.num_empleado, baja.fecha_ingreso);
    if (knownHires.has(key)) continue;
    knownHires.add(key);
    formerEmployeeHires.push({
      num_empleado: baja.num_empleado,
      nombre: baja.nombre,
      area: baja.area,
      seccion: baja.seccion,
      puesto: baja.puesto,
      categoria: '',
      turno: baja.turno ?? '',
      fecha_ingreso: baja.fecha_ingreso,
      is_starlite: baja.is_starlite,
    });
  }

  return [...employees, ...formerEmployeeHires];
}

export function buildQuarterReports(
  quarter: CalendarQuarter,
  bajas: Baja[],
  employees: Employee[],
  positions: AuthorizedPosition[],
): Map<string, DepartmentQuarterReport> {
  const authorizedByArea = new Map<string, { puestos: Set<string> }>();

  for (const position of positions) {
    const plazas = Math.max(0, position.plantilla_autorizada) + Math.max(0, position.starlite_autorizada ?? 0);
    if (plazas === 0) continue;

    const areaKey = normalizeString(position.area);
    const entry = authorizedByArea.get(areaKey) ?? {
      puestos: new Set<string>(),
    };
    entry.puestos.add(canonicalizePuesto(position.puesto));
    authorizedByArea.set(areaKey, entry);
  }

  const quarterMonthKeys = Array.from({ length: 3 }, (_, index) => {
    const month = Number(quarter.start.slice(5, 7)) + index;
    return `${quarter.year}-${String(month).padStart(2, '0')}`;
  });
  const hireRecords = getHireRecords(bajas, employees);
  const coverageBajas = bajas.map((baja) => {
    if (baja.cubierta_fecha) {
      return baja.cubierta_manual ? baja : { ...baja, cubierta_manual: true };
    }
    return baja.cubierta_manual ? { ...baja, cubierta_manual: false } : baja;
  });
  const reports = new Map<string, DepartmentQuarterReport>();

  for (const department of REPORT_SGI_DEPARTMENTS) {
    const areaKey = normalizeString(department.area);
    const authorized = authorizedByArea.get(areaKey);
    const referencePosition = positions.find(
      (position) =>
        normalizeString(position.area) === areaKey &&
        canonicalizeKeyPart(position.seccion) === canonicalizeKeyPart(department.referenceSection) &&
        canonicalizePuesto(position.puesto) === canonicalizePuesto(department.referencePosition),
    );
    const comparison = computeMonthlyComparison(coverageBajas, hireRecords, quarter.year, {
      periodStart: quarter.start,
      includeFutureHiresForCoverage: true,
      positionFilter: (area, puesto) =>
        normalizeString(area) === areaKey && Boolean(authorized?.puestos.has(canonicalizePuesto(puesto))),
      coveragePosition: department.id === 'produccion' ? () => PRODUCTION_REPLACEMENT_POSITION : undefined,
    });
    const rows = comparison.bajasConCobertura.filter(
      (baja) => baja.fecha_baja >= quarter.start && baja.fecha_baja <= quarter.end,
    );
    const counted = rows.filter((baja) => !baja.soloInduccion);
    const durations = counted.map((baja) => baja.coberturaDias).filter((days): days is number => days !== null);
    const averageCoverage =
      durations.length > 0 ? Math.round(durations.reduce((total, days) => total + days, 0) / durations.length) : null;
    const ingresos = quarterMonthKeys.reduce((total, month) => {
      const row = comparison.months.find((candidate) => candidate.month === month);
      return total + (row?.ingresos ?? 0);
    }, 0);

    reports.set(department.id, {
      ingresos,
      bajas: counted.length,
      soloInduccion: rows.length - counted.length,
      cubiertas: counted.filter((baja) => baja.coberturaDias !== null).length,
      averageCoverage,
      rows,
      authorizedPositions: authorized?.puestos.size ?? 0,
      referenceStaffing: referencePosition
        ? {
            authorized: referencePosition.plantilla_autorizada,
            backup: referencePosition.backup ?? 0,
          }
        : null,
    });
  }

  return reports;
}
