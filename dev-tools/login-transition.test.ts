import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loginTransitionReducer, type LoginTransitionState } from '../src/hooks/useLoginTransition';

const initial: LoginTransitionState = { attemptId: 0, phase: 'idle' };

test('a session event cannot complete login before access and animation confirm', () => {
  const verifying = loginTransitionReducer(initial, { type: 'begin', attemptId: 1 });
  assert.equal(verifying.phase, 'verifying');
  assert.equal(loginTransitionReducer(verifying, { type: 'complete', attemptId: 1 }).phase, 'verifying');
  const verified = loginTransitionReducer(verifying, { type: 'confirm', attemptId: 1 });
  assert.equal(verified.phase, 'verified');
  assert.equal(loginTransitionReducer(verified, { type: 'complete', attemptId: 1 }).phase, 'ready');
});

test('failed or stale attempts cannot trigger navigation', () => {
  const verifying = loginTransitionReducer(initial, { type: 'begin', attemptId: 1 });
  const failed = loginTransitionReducer(verifying, { type: 'fail', attemptId: 1 });
  assert.equal(failed.phase, 'failed');
  assert.equal(loginTransitionReducer(failed, { type: 'complete', attemptId: 1 }).phase, 'failed');
  const next = loginTransitionReducer(failed, { type: 'begin', attemptId: 2 });
  assert.equal(loginTransitionReducer(next, { type: 'confirm', attemptId: 1 }).phase, 'verifying');
  assert.equal(loginTransitionReducer(next, { type: 'signed-out' }).phase, 'verifying');
  assert.equal(loginTransitionReducer(failed, { type: 'signed-out' }).phase, 'failed');
});
