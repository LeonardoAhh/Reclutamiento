import assert from 'node:assert/strict';
import { test } from 'node:test';
import { EMPLEADOS_PATH, isPlantillaPath, PLANTILLA_PATH } from '../src/lib/plantillaNavigation.ts';

test('Plantilla has one canonical path and Empleados remains a legacy path', () => {
  assert.equal(PLANTILLA_PATH, '/plantilla');
  assert.equal(EMPLEADOS_PATH, '/empleados');
  assert.equal(isPlantillaPath(PLANTILLA_PATH), true);
  assert.equal(isPlantillaPath(EMPLEADOS_PATH), false);
});
