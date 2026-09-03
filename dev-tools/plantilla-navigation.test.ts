import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getPlantillaHref, getPlantillaView } from '../src/lib/plantillaNavigation.ts';

test('existing Plantilla URLs resolve to their view, including back and forward', () => {
  assert.equal(getPlantillaView(''), 'general');
  assert.equal(getPlantillaView('?view=empleados'), 'empleados');
  assert.equal(getPlantillaView('?view=unknown'), 'general');
  assert.deepEqual(['', '?view=empleados', '', '?view=empleados'].map(getPlantillaView),
    ['general', 'empleados', 'general', 'empleados']);
});

test('view links preserve unrelated parameters and never duplicate the view parameter', () => {
  assert.equal(getPlantillaHref('general'), '/plantilla');
  assert.equal(getPlantillaHref('empleados'), '/plantilla?view=empleados');
  assert.equal(getPlantillaHref('general', '?view=empleados&filter=test'), '/plantilla?filter=test');
  assert.equal(getPlantillaHref('empleados', '?filter=test&view=general'), '/plantilla?filter=test&view=empleados');
});
