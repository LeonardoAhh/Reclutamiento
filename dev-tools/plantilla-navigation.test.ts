import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isPlantillaPath, PLANTILLA_PATH } from '../src/lib/plantillaNavigation.ts';

test('Workforce has one canonical English path', () => {
  assert.equal(PLANTILLA_PATH, '/workforce');
  assert.equal(isPlantillaPath(PLANTILLA_PATH), true);
  assert.equal(isPlantillaPath('/employees'), false);
});
