import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  isRecognitionFrequency,
  markRecognitionShown,
  readRecognitionPreferences,
  setRecognitionFrequency,
  setRecognitionMonthDismissed,
  shouldShowRecognition,
} from '../src/lib/recruiterRecognition';

function memoryStorage() {
  const entries = new Map<string, string>();
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => { entries.set(key, value); },
  };
}

test('recognition preferences: frequency, identity, rollover and unavailable storage', () => {
  const localStorage = memoryStorage();
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage, sessionStorage: memoryStorage() },
  });
  const today = new Date(2026, 8, 3);
  const tomorrow = new Date(2026, 8, 4);
  const nextMonth = new Date(2026, 9, 1);

  assert.equal(shouldShowRecognition('session-user', today), true);
  markRecognitionShown('session-user', today);
  assert.equal(shouldShowRecognition('session-user', today), false);
  assert.equal(shouldShowRecognition('other-user', today), true);

  for (const frequency of ['daily', 'weekly', 'monthly'] as const) {
    assert.equal(setRecognitionFrequency(frequency, frequency), true);
    assert.equal(shouldShowRecognition(frequency, today), true);
    markRecognitionShown(frequency, today);
    assert.equal(shouldShowRecognition(frequency, today), false);
  }
  assert.equal(shouldShowRecognition('daily', tomorrow), true);
  assert.equal(shouldShowRecognition('weekly', tomorrow), false);
  assert.equal(shouldShowRecognition('weekly', new Date(2026, 8, 7)), true);
  assert.equal(shouldShowRecognition('monthly', tomorrow), false);
  assert.equal(shouldShowRecognition('monthly', nextMonth), true);

  setRecognitionMonthDismissed('daily', true, today);
  assert.equal(shouldShowRecognition('daily', tomorrow), false);
  assert.equal(shouldShowRecognition('daily', nextMonth), true);
  setRecognitionMonthDismissed('daily', false, today);
  assert.equal(shouldShowRecognition('daily', tomorrow), true);

  setRecognitionFrequency('disabled', 'off');
  assert.equal(shouldShowRecognition('disabled', nextMonth), false);
  setRecognitionFrequency('disabled', 'daily');
  assert.equal(shouldShowRecognition('disabled', today), true);

  assert.equal(isRecognitionFrequency({ toString: () => 'daily' }), false);
  localStorage.setItem('reclutamiento:recognition-preferences:corrupt', '{');
  assert.equal(readRecognitionPreferences('corrupt').frequency, 'session');
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage: { setItem() { throw new Error('Unavailable'); } } },
  });
  assert.equal(setRecognitionMonthDismissed('unavailable', true), false);
});
