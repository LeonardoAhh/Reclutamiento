import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildEmployeeAssignmentPreview,
  parseEmployeeAssignmentJson,
} from '../src/features/employee-bulk-update/model.ts';
import type { Employee } from '../src/lib/types.ts';

const employee: Employee = {
  num_empleado: '001',
  nombre: 'Persona Uno',
  area: 'Producción',
  seccion: 'Línea 1',
  puesto: 'Operador',
  categoria: 'A',
  turno: '1',
  fecha_ingreso: '2026-01-01',
};

test('parses the four required assignment fields and rejects duplicates', () => {
  const parsed = parseEmployeeAssignmentJson([
    { 'Num Empleado': '001', Puesto: 'Técnico', Categoria: 'B', Turno: 2 },
  ]);
  assert.deepEqual(parsed, {
    ok: true,
    updates: [{ num_empleado: '001', puesto: 'Técnico', categoria: 'B', turno: '2' }],
  });

  const duplicated = parseEmployeeAssignmentJson([
    { 'Num Empleado': '001', Puesto: 'Técnico', Categoria: 'B', Turno: '2' },
    { num_empleado: '001', puesto: 'Supervisor', categoria: 'C', turno: '3' },
  ]);
  assert.equal(duplicated.ok, false);
});

test('preview includes only real changes and reports missing employees', () => {
  const preview = buildEmployeeAssignmentPreview([employee], [
    { num_empleado: '001', puesto: 'Técnico', categoria: 'B', turno: '2' },
    { num_empleado: '404', puesto: 'Operador', categoria: 'A', turno: '1' },
  ]);

  assert.equal(preview.changes.length, 1);
  assert.equal(preview.changes[0]?.employee.nombre, 'Persona Uno');
  assert.deepEqual(preview.notFound, ['404']);
  assert.equal(preview.unchanged, 0);
});
