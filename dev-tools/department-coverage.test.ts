import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculateWorkforceProjection, summarizeOperationalCoverage, summarizeWorkforceCoverage } from '../src/lib/workforceProjection';
import { calculatePositionCoverage, formatPercentage } from '../src/lib/utils';
import type { AuthorizedPosition, Employee } from '../src/lib/types';

const today = '2026-09-03';
const excluded = new Set<string>();

test('coverage display uses whole percentages without rounding pending vacancies to 100', () => {
  assert.equal(formatPercentage(96.4), '96%');
  assert.equal(formatPercentage(99.9), '99%');
  assert.equal(formatPercentage(100), '100%');
  assert.equal(formatPercentage(111), '100%');
  assert.equal(formatPercentage(0), '0%');
});
const position: AuthorizedPosition = {
  area: 'AREA TEST', seccion: 'SECCION TEST', puesto: 'PUESTO TEST',
  plantilla_autorizada: 2, backup: 1, urgentes: 1,
};
function employee(number: string, overrides: Partial<Employee> = {}): Employee {
  return {
    num_empleado: number, nombre: 'Registro de prueba', area: position.area,
    seccion: position.seccion, puesto: position.puesto, categoria: '', turno: '',
    fecha_ingreso: today, ...overrides,
  };
}

test('surplus never covers vacancies in another position or category', () => {
  const vacant = { ...position, puesto: 'OTRO PUESTO', backup: 0, urgentes: 0 };
  const employees = Array.from({ length: 7 }, (_, index) => employee(String(index)));
  employees.push(employee('starlite', { is_starlite: true }));
  const snapshot = calculateWorkforceProjection(employees, [position, vacant], today, excluded).current;
  assert.equal(snapshot.plantilla.percentage, 50);
  assert.equal(snapshot.plantilla.vacancies, 2);
  assert.equal(snapshot.backup.percentage, 100);
  assert.equal(snapshot.starlite.percentage, 100);
  assert.equal(snapshot.surplus, 4);
  assert.equal(summarizeOperationalCoverage(snapshot).percentage, 66.6);
});

test('111 percent headcount becomes 100 percent coverage with surplus kept separately', () => {
  const target = { ...position, plantilla_autorizada: 9, backup: 0, urgentes: 0 };
  const employees = Array.from({ length: 10 }, (_, index) => employee(String(index)));
  const result = calculateWorkforceProjection(employees, [target], today, excluded, target.area);
  assert.equal(summarizeOperationalCoverage(result.current).percentage, 100);
  assert.equal(result.current.real, 10);
  assert.equal(result.current.surplus, 1);
});

test('excess Starlite does not fill regular plantilla or backup', () => {
  const result = calculateWorkforceProjection([
    employee('star-one', { is_starlite: true }),
    employee('star-two', { is_starlite: true }),
  ], [position], today, excluded, position.area);
  assert.equal(result.current.plantilla.covered, 0);
  assert.equal(result.current.backup.covered, 0);
  assert.equal(result.current.starlite.covered, 1);
  assert.equal(result.current.surplus, 1);
});

test('future hires remain separate and all scheduled hires reduce future vacancies', () => {
  const result = calculateWorkforceProjection([
    employee('current'), employee('next', { fecha_ingreso: '2026-09-04' }),
    employee('later', { fecha_ingreso: '2026-09-07' }),
  ], [position], today, excluded);
  assert.equal(result.current.plantilla.percentage, 50);
  assert.equal(result.projected.plantilla.percentage, 100);
  assert.equal(result.current.backup.percentage, 0);
  assert.equal(result.withAllProximos.backup.percentage, 100);
  assert.equal(result.nextHireDate, '2026-09-04');
  assert.equal(result.scheduledHires, 1);
});

test('deduplication, legacy Starlite rows, exclusions and missing dates match Resumen', () => {
  const legacy = { ...position, seccion: `${position.seccion} (STARLITE)`, backup: 0, urgentes: 0 };
  const result = calculateWorkforceProjection([
    employee('duplicate'), employee('duplicate'),
    employee('special', { seccion: legacy.seccion, is_starlite: true }),
    employee('undated', { fecha_ingreso: '' }),
  ], [position, legacy], today, excluded);
  assert.equal(result.current.real, 2);
  assert.equal(result.current.plantilla.target, 2);
  assert.equal(result.current.plantilla.covered, 1);
  assert.equal(result.current.starlite.covered, 1);
  assert.equal(result.undatedEmployees, 1);
  const dismissed = calculateWorkforceProjection([employee('one')], [position], today,
    new Set([`${position.area}-${position.seccion}-${position.puesto}`]));
  assert.equal(dismissed.current.plantilla.percentage, null);
});

test('zero targets are not applicable and near-complete coverage does not round to 100', () => {
  const empty = summarizeWorkforceCoverage([], excluded);
  assert.equal(empty.plantilla.percentage, null);
  const coverage = calculatePositionCoverage([], [], [{ ...position, plantilla_autorizada: 1001 }]);
  coverage[0].plantilla_real = 1000;
  const snapshot = summarizeWorkforceCoverage(coverage, excluded);
  assert.equal(snapshot.plantilla.percentage, 99.9);
});

test('department snapshots use the same rules and add up to Resumen', () => {
  const other = { ...position, area: 'OTRA AREA' };
  const employees = [
    employee('first'), employee('first-future', { fecha_ingreso: '2026-09-07' }),
    employee('second', { area: other.area }),
    employee('second-future', { area: other.area, fecha_ingreso: '2026-09-04' }),
    employee('second-undated', { area: other.area, fecha_ingreso: '' }),
  ];
  const positions = [position, other];
  const global = calculateWorkforceProjection(employees, positions, today, excluded);
  const first = calculateWorkforceProjection(employees, positions, today, excluded, position.area);
  const second = calculateWorkforceProjection(employees, positions, today, excluded, other.area);
  for (const key of ['plantilla', 'backup', 'starlite'] as const) {
    assert.equal(first.current[key].target + second.current[key].target, global.current[key].target);
    assert.equal(first.current[key].covered + second.current[key].covered, global.current[key].covered);
  }
  assert.equal(first.nextHireDate, '2026-09-07');
  assert.equal(second.nextHireDate, '2026-09-04');
  assert.equal(first.undatedEmployees, 0);
  assert.equal(second.undatedEmployees, 1);
  assert.equal(first.current.real, 1);
  assert.equal(first.projected.real, 2);
});

test('filtering a department does not turn ambiguous cross-area matches into valid hires', () => {
  const positions = [
    { ...position, area: 'PRODUCCION NORTE' },
    { ...position, area: 'PRODUCCION SUR' },
  ];
  const employees = [employee('ambiguous', { area: 'PRODUCCION' })];
  const global = calculateWorkforceProjection(employees, positions, today, excluded);
  assert.equal(global.ambiguousEmployees, 1);
  for (const scoped of positions) {
    const result = calculateWorkforceProjection(employees, positions, today, excluded, scoped.area);
    assert.equal(result.current.real, 0);
  }
});
