import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isRouteAssignmentEligibleShift } from '../src/pages/configuracion-views/formatos-helpers.ts';

test('excludes turno 5 and mixto from route assignment formats', () => {
  for (const shift of ['5', ' 5 ', '0', '8', '33', 'Mixto', ' MIXTO ']) {
    assert.equal(isRouteAssignmentEligibleShift(shift), false, shift);
  }
});

test('keeps transport shifts and employees without a captured shift', () => {
  for (const shift of ['1', '2', '3', '4', '27', '']) {
    assert.equal(isRouteAssignmentEligibleShift(shift), true, shift);
  }
});
