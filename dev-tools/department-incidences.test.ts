import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getFirstGivenName } from '../src/lib/names.ts';
import {
  findDepartmentEmployeeMatches,
  getDepartmentIncidenceLevel,
  normalizeDepartmentEmployeeSearch,
  summarizeDepartmentIncidences,
  type DepartmentEmployee,
} from '../src/pages/department-incidences.ts';
import type { ReporteDiarioRecord } from '../src/hooks/useReporteDiario.ts';

function report(mes: string, data: unknown[]): ReporteDiarioRecord {
  return {
    id: mes,
    mes,
    data,
    total_empleados: data.length,
    total_incidencias: 0,
    tasa_asistencia: 0,
    dias_disponibles: 0,
    total_ausentismo: 0,
    pct_ausentismo: 0,
    uploaded_by: null,
    created_at: '',
    updated_at: '',
  };
}

function row(mes: string, numero_empleado: string, days: Record<string, string>, departamento = 'ALMACÉN') {
  return {
    mes,
    numero_empleado,
    nombre: `Empleado ${numero_empleado}`,
    departamento,
    area: 'GENERAL',
    days,
  };
}

test('department incidence percentage counts unique historically registered employees across months', () => {
  const reports = [
    report('2025-01', [
      row('2025-01', '101', { '01': 'F' }),
      row('2025-01', '102', { '01': 'A' }),
      row('2025-01', '999', { '01': '-' }),
    ]),
    report('2025-02', [
      row('2025-02', '101', { '01': 'V' }, 'SEGURIDAD'),
      row('2025-02', '102', { '01': '-' }),
      row('2025-02', '103', { '01': 'CT' }),
      row('2025-02', '104', { '01': 'F' }, 'ZETA'),
    ]),
  ];

  const result = summarizeDepartmentIncidences(reports, new Set(['101', '102', '103', '104']));

  assert.deepEqual(result.departments, [
    { name: 'ALMACÉN', affectedEmployees: 1, registeredEmployees: 4 },
    { name: 'SEGURIDAD', affectedEmployees: 0, registeredEmployees: 1 },
    { name: 'ZETA', affectedEmployees: 1, registeredEmployees: 1 },
  ]);
  assert.deepEqual(
    result.employeesByDepartment.get('ALMACÉN')?.map((employee) => employee.number),
    ['102', '103'],
  );
  assert.deepEqual(
    result.employeesByDepartment.get('SEGURIDAD')?.map((employee) => employee.number),
    ['101'],
  );
});

test('employee incidence level uses the complete loaded history and agreed thresholds', () => {
  const reports = [
    report('2024-01', [
      row('2024-01', '101', { '01': 'F', '02': 'FJ' }),
      row('2024-01', '102', { '01': 'F', '02': 'FJ', '03': 'S' }),
      row('2024-01', '103', { '01': 'F', '02': 'FJ', '03': 'S' }),
      row('2024-01', '104', { '01': 'F', '02': 'FJ', '03': 'S', '04': 'P' }),
    ]),
    report('2025-07', [
      row('2025-07', '101', { '01': 'S' }),
      row('2025-07', '102', {
        '01': 'P',
        '02': 'CT',
        '03': 'I',
        '04': 'V',
        '05': 'TXT',
      }),
      row('2025-07', '103', {
        '01': 'P',
        '02': 'CT',
        '03': 'I',
        '04': 'V',
        '05': 'TXT',
        '06': 'PH',
      }),
    ]),
  ];

  const result = summarizeDepartmentIncidences(reports, new Set(['101', '102', '103', '104']));
  const employees = result.employeesByDepartment.get('ALMACÉN');

  assert.deepEqual(
    employees?.map(({ number, incidenceCount, incidenceLevel }) => ({
      number,
      incidenceCount,
      incidenceLevel,
    })),
    [
      { number: '101', incidenceCount: 3, incidenceLevel: 'attention' },
      { number: '102', incidenceCount: 4, incidenceLevel: 'attention' },
      { number: '103', incidenceCount: 4, incidenceLevel: 'attention' },
      { number: '104', incidenceCount: 3, incidenceLevel: 'attention' },
    ],
  );
  assert.equal(getDepartmentIncidenceLevel(0), 'excellent');
  assert.equal(getDepartmentIncidenceLevel(2), 'excellent');
  assert.equal(getDepartmentIncidenceLevel(3), 'attention');
  assert.equal(getDepartmentIncidenceLevel(8), 'attention');
  assert.equal(getDepartmentIncidenceLevel(9), 'priority-review');
});

test('employee tables prioritize incidence indicator, then employee number', () => {
  const priorityDays = Object.fromEntries(
    Array.from({ length: 9 }, (_, index) => [`${index + 1}`.padStart(2, '0'), 'F']),
  );
  const result = summarizeDepartmentIncidences(
    [
      report('2025-03', [
        row('2025-03', '20', priorityDays),
        row('2025-03', '3', priorityDays),
        row('2025-03', '11', { '01': 'F', '02': 'F', '03': 'F' }),
        row('2025-03', '2', { '01': 'A' }),
      ]),
    ],
    new Set(['20', '3', '11', '2']),
  );

  assert.deepEqual(
    result.employeesByDepartment.get('ALMACÉN')?.map(({ number, incidenceLevel }) => ({
      number,
      incidenceLevel,
    })),
    [
      { number: '3', incidenceLevel: 'priority-review' },
      { number: '20', incidenceLevel: 'priority-review' },
      { number: '11', incidenceLevel: 'attention' },
      { number: '2', incidenceLevel: 'excellent' },
    ],
  );
});

test('department incidence calculations exclude shift changes, hourly leave, vacation, disability, and permits', () => {
  const result = summarizeDepartmentIncidences(
    [
      report('2025-03', [
        row('2025-03', '201', { '01': 'CT' }),
        row('2025-03', '202', { '01': 'PH' }),
        row('2025-03', '203', { '01': 'V' }),
        row('2025-03', '204', { '01': 'I' }),
        row('2025-03', '205', { '01': 'P' }),
      ]),
    ],
    new Set(['201', '202', '203', '204', '205']),
  );

  assert.deepEqual(result.departments, [{ name: 'ALMACÉN', affectedEmployees: 0, registeredEmployees: 5 }]);
  assert.deepEqual(
    result.employeesByDepartment.get('ALMACÉN')?.map(({ number, incidenceCount, incidenceMonths }) => ({
      number,
      incidenceCount,
      incidenceMonths,
    })),
    [
      { number: '201', incidenceCount: 0, incidenceMonths: [] },
      { number: '202', incidenceCount: 0, incidenceMonths: [] },
      { number: '203', incidenceCount: 0, incidenceMonths: [] },
      { number: '204', incidenceCount: 0, incidenceMonths: [] },
      { number: '205', incidenceCount: 0, incidenceMonths: [] },
    ],
  );
});

test('employee number search accepts only up to five digits', () => {
  assert.equal(normalizeDepartmentEmployeeSearch('12345'), '12345');
  assert.equal(normalizeDepartmentEmployeeSearch('12a345'), '12345');
  assert.equal(normalizeDepartmentEmployeeSearch('123456'), '12345');
  assert.equal(normalizeDepartmentEmployeeSearch('abc'), '');
});

test('employee search waits for three digits and returns at most five prefix matches', () => {
  const employees: DepartmentEmployee[] = Array.from({ length: 8 }, (_, index) => ({
    number: `210${index}`,
    name: `EMPLOYEE ${index}`,
    department: 'ALMACÉN',
    section: 'GENERAL',
    position: '',
    incidenceCount: 0,
    incidenceLevel: 'excellent',
    previousDepartments: [],
    incidenceMonths: [],
  }));

  assert.deepEqual(findDepartmentEmployeeMatches(employees, '21'), []);
  assert.deepEqual(
    findDepartmentEmployeeMatches(employees, '210').map((employee) => employee.number),
    ['2100', '2101', '2102', '2103', '2104'],
  );
  assert.deepEqual(findDepartmentEmployeeMatches(employees, '999'), []);
});

test('employee search name shows the first given name, not the surnames or full name', () => {
  assert.equal(getFirstGivenName('HERNANDEZ HERRERA LEONARDO AHMED'), 'LEONARDO');
  assert.equal(getFirstGivenName('ZAMANO CAMACHO MARIA DEL ROCIO'), 'MARIA');
});
