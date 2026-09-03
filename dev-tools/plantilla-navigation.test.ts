import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getPlantillaHref, getPlantillaView } from '../src/lib/plantillaNavigation.ts';

test('Plantilla and Empleados resolve only from their canonical paths', () => {
  assert.equal(getPlantillaView('/plantilla'), 'general');
  assert.equal(getPlantillaView('/empleados'), 'empleados');
  assert.deepEqual(
    ['/plantilla', '/empleados', '/plantilla', '/empleados']
      .map((pathname) => getPlantillaView(pathname)),
    ['general', 'empleados', 'general', 'empleados']);
});

test('each view has one canonical path', () => {
  assert.equal(getPlantillaHref('general'), '/plantilla');
  assert.equal(getPlantillaHref('empleados'), '/empleados');
});
