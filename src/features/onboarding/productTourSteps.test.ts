import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createProductTourSteps,
  getNextProductTourStep,
  type ProductTourActions,
  type ProductTourCopy,
} from './productTourSteps';

const copy: ProductTourCopy = {
  welcomeTitle: 'Personalize your account',
  welcomeText: 'A quick 3-step tour.',
  avatarTitle: 'Open your menu',
  avatarText: 'Click your avatar.',
  profileTitle: 'Go to My profile',
  profileText: 'Your account lives here.',
  preferencesTitle: 'Theme and palette',
  preferencesText: 'Switch light or dark mode and pick your colors.',
  recognitionTitle: 'Recognition',
  recognitionText: 'Set when to see your achievements.',
  finishTitle: 'All set',
  finishText: 'Replay this guide anytime from Help.',
};

const actions: ProductTourActions = {
  prepareAccountTarget: () => {},
  openAccountMenu: () => {},
  closeAccountMenu: () => {},
  navigateToAccount: () => {},
};

test('the product tour walks through its five translated steps in order', () => {
  const steps = createProductTourSteps(copy, actions, false);
  const visited: number[] = [];
  let index = 0;

  while (true) {
    visited.push(index);
    const nextIndex = getNextProductTourStep(index, steps.length);
    if (nextIndex === null) break;
    index = nextIndex;
  }

  assert.deepEqual(visited, [0, 1, 2, 3, 4]);
  assert.deepEqual(
    steps.map(({ side }) => side),
    ['center', 'right', 'right', 'below', 'center'],
  );
  assert.deepEqual(
    steps.map(({ target }) => target),
    [
      null,
      '[data-tour="account-trigger"]',
      '[data-tour="account-profile-link"]',
      '[data-tour="account-appearance"]',
      null,
    ],
  );
});

test('recruiters see recognition preferences before the final step', () => {
  const steps = createProductTourSteps(copy, actions, true);

  assert.equal(steps.length, 6);
  assert.equal(steps[4].target, '.account-recognition');
  assert.equal(steps[5].target, null);
});
