import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeMonthlyComparison } from '../src/lib/bajas.ts';
import { PLANTILLA_AUTORIZADA } from '../src/lib/constants.ts';
import { lastCompletedQuarter } from '../src/lib/dates.ts';
import type { AuthorizedPosition, Baja, Employee } from '../src/lib/types.ts';
import { getLocalizedNavigation, HOME_PATH } from '../src/components/layout/navigation.ts';
import { REPORT_SGI_PATH } from '../src/pages/report-sgi/navigation.ts';
import { buildQuarterReports } from '../src/pages/report-sgi/quarterlyData.ts';

function baja(
  num_empleado: string,
  area: string,
  puesto: string,
  fecha_ingreso: string,
  fecha_baja: string,
  extra: Partial<Baja> = {},
): Baja {
  return {
    num_empleado,
    nombre: `Empleado ${num_empleado}`,
    area,
    seccion: '',
    puesto,
    fecha_ingreso,
    fecha_baja,
    tipo_baja: '',
    motivo_baja: '',
    ...extra,
  };
}

test('last completed calendar quarter handles the current and prior year', () => {
  assert.deepEqual(lastCompletedQuarter('2026-11-09'), {
    year: 2026,
    quarter: 3,
    start: '2026-07-01',
    end: '2026-09-30',
  });
  assert.deepEqual(lastCompletedQuarter('2027-01-15'), {
    year: 2026,
    quarter: 4,
    start: '2026-10-01',
    end: '2026-12-31',
  });
  assert.throws(() => lastCompletedQuarter('2026-13-01'), /Fecha inválida/);
});

test('quarter report counts former hires and applies authorized/manual/automatic coverage rules', () => {
  const quarter = lastCompletedQuarter('2026-11-09');
  const employees: Employee[] = [
    {
      num_empleado: 'active-hire',
      nombre: 'Ingreso activo',
      area: 'PRODUCCIÓN',
      seccion: '',
      puesto: 'OPERADOR DE MÁQUINA A',
      categoria: '',
      turno: '',
      fecha_ingreso: '06/07/2026',
    },
    {
      num_empleado: 'unauthorized-hire',
      nombre: 'Ingreso no autorizado',
      area: 'PRODUCCIÓN',
      seccion: '',
      puesto: 'TEMPORAL',
      categoria: '',
      turno: '',
      fecha_ingreso: '2026-07-07',
    },
    {
      num_empleado: 'future-quality-hire',
      nombre: 'Ingreso posterior al trimestre',
      area: 'CALIDAD',
      seccion: '',
      puesto: 'INSPECTOR',
      categoria: '',
      turno: '',
      fecha_ingreso: '2027-01-01',
    },
  ];
  const bajas = [
    baja('departure', 'PRODUCCIÓN', 'OPERADOR DE MÁQUINA A', '2025-01-01', '2026-07-01', {
      cubierta_manual: true,
    }),
    baja('former-hire', 'PRODUCCIÓN', 'OPERADOR DE MÁQUINA A', '2026-08-01', '2026-09-01'),
    baja('unauthorized-departure', 'PRODUCCIÓN', 'TEMPORAL', '2025-01-01', '2026-08-10'),
    baja('manual-departure', 'CALIDAD', 'INSPECTOR', '2025-01-01', '2026-07-01', {
      cubierta_manual: true,
      cubierta_fecha: '2026-07-10',
    }),
    baja('quality-auto-departure', 'CALIDAD', 'INSPECTOR', '2025-01-01', '2026-09-10'),
  ];
  const positions: AuthorizedPosition[] = [
    { area: 'PRODUCCIÓN', seccion: 'Línea', puesto: 'OPERADOR DE MÁQUINA', plantilla_autorizada: 1 },
    { area: 'PRODUCCIÓN', seccion: 'Línea', puesto: 'TEMPORAL', plantilla_autorizada: 0 },
    { area: 'CALIDAD', seccion: 'Calidad', puesto: 'INSPECTOR', plantilla_autorizada: 1 },
  ];

  const reports = buildQuarterReports(quarter, bajas, employees, positions);
  const production = reports.get('produccion');
  const quality = reports.get('calidad');

  assert.ok(production);
  assert.equal(production.ingresos, 2);
  assert.equal(production.bajas, 2);
  assert.equal(production.authorizedPositions, 1);
  assert.equal(production.averageCoverage, 5);
  assert.equal(production.rows[0].cubiertaPor, 'auto');

  assert.ok(quality);
  assert.equal(quality.rows[0].coberturaDias, 9);
  assert.equal(quality.rows[0].cubiertaPor, 'manual');
  assert.equal(quality.rows[1].coberturaDias, 113);
  assert.equal(quality.cubiertas, 2, 'late coverage still counts as a filled vacancy');
  assert.equal(quality.ingresos, 0, 'future hires are only used for coverage matching');
});

test('future-year hires affect coverage only when explicitly enabled', () => {
  const departure = baja('departure', 'PRODUCCIÓN', 'OPERADOR', '2025-01-01', '2026-12-30');
  const futureHire: Employee = {
    num_empleado: 'future-hire',
    nombre: 'Ingreso posterior',
    area: 'PRODUCCIÓN',
    seccion: '',
    puesto: 'OPERADOR',
    categoria: '',
    turno: '',
    fecha_ingreso: '2027-01-01',
  };

  const defaultComparison = computeMonthlyComparison([departure], [futureHire], 2026);
  const futureCoverageComparison = computeMonthlyComparison([departure], [futureHire], 2026, {
    includeFutureHiresForCoverage: true,
  });

  assert.equal(defaultComparison.bajasConCobertura[0].coberturaDias, null);
  assert.equal(futureCoverageComparison.bajasConCobertura[0].coberturaDias, 2);
  assert.equal(futureCoverageComparison.totals.ingresos, 0);
});

test('SGI covers a Production CHECK LIST departure with a machine operator hire', () => {
  const departure = baja('2025', 'PRODUCCIÓN', 'CHECK LIST A', '2025-01-01', '2026-08-08');
  const hire: Employee = {
    num_empleado: '2026',
    nombre: 'Nuevo ingreso',
    area: 'PRODUCCIÓN',
    seccion: '',
    puesto: 'OPERADOR DE MÁQUINA B',
    categoria: '',
    turno: '',
    fecha_ingreso: '2026-08-10',
  };
  const positions: AuthorizedPosition[] = [
    { area: 'PRODUCCIÓN', seccion: '', puesto: 'CHECK LIST', plantilla_autorizada: 1 },
    { area: 'PRODUCCIÓN', seccion: '', puesto: 'OPERADOR DE MÁQUINA', plantilla_autorizada: 1 },
  ];

  const row = buildQuarterReports(lastCompletedQuarter('2026-11-09'), [departure], [hire], positions).get('produccion')
    ?.rows[0];

  assert.equal(row?.puesto, 'CHECK LIST A');
  assert.equal(row?.coberturaDias, 2);
  assert.equal(row?.coberturaEmpleado?.num_empleado, '2026');
});

test('SGI staffing references follow the authorized first-shift positions', () => {
  const reports = buildQuarterReports(lastCompletedQuarter('2026-11-09'), [], [], PLANTILLA_AUTORIZADA);

  assert.deepEqual(reports.get('produccion')?.referenceStaffing, { authorized: 30, backup: 4 });
  assert.deepEqual(reports.get('calidad')?.referenceStaffing, { authorized: 22, backup: 2 });
});

test('sidebar keeps Home first and alphabetizes the remaining localized links', () => {
  assert.equal(REPORT_SGI_PATH, '/analisis-t3');
  for (const [language, label] of [
    ['es', 'Analisis T3'],
    ['en', 'Q3 Analysis'],
  ] as const) {
    const items = getLocalizedNavigation(language);
    const collator = new Intl.Collator(language, { sensitivity: 'base' });
    const labels = items.slice(1).map((item) => item.label);

    assert.equal(items[0]?.to, HOME_PATH);
    assert.equal(items.filter((item) => item.to === REPORT_SGI_PATH).length, 1);
    assert.equal(items.find((item) => item.to === REPORT_SGI_PATH)?.label, label);
    assert.deepEqual(
      labels,
      [...labels].sort((first, second) => collator.compare(first, second)),
    );
  }
});
