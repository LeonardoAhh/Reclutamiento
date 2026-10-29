import { useCallback, useEffect, useReducer, useRef } from 'react';
import { motionTransition } from '@/lib/motionTokens';

export type LoginTransitionPhase = 'idle' | 'verifying' | 'verified' | 'ready' | 'failed';

export interface LoginTransitionState {
  attemptId: number;
  phase: LoginTransitionPhase;
}

export type LoginTransitionAction =
  | { type: 'begin'; attemptId: number }
  | { type: 'confirm' | 'complete'; attemptId: number }
  | { type: 'fail'; attemptId: number }
  | { type: 'signed-out' };

const INITIAL_STATE: LoginTransitionState = { attemptId: 0, phase: 'idle' };

export function loginTransitionReducer(
  state: LoginTransitionState,
  action: LoginTransitionAction,
): LoginTransitionState {
  if (action.type === 'begin') {
    return action.attemptId > state.attemptId
      ? { attemptId: action.attemptId, phase: 'verifying' }
      : state;
  }
  if (action.type === 'signed-out') {
    return state.phase === 'verified' || state.phase === 'ready'
      ? { ...state, phase: 'idle' }
      : state;
  }
  if (action.attemptId !== state.attemptId) return state;
  if (action.type === 'confirm') {
    return state.phase === 'verifying' ? { ...state, phase: 'verified' } : state;
  }
  if (action.type === 'complete') {
    return state.phase === 'verified' ? { ...state, phase: 'ready' } : state;
  }
  if (action.type === 'fail') {
    return state.phase === 'verifying' || state.phase === 'verified'
      ? { ...state, phase: 'failed' }
      : state;
  }
  return state;
}

export function useLoginTransition() {
  const [state, dispatch] = useReducer(loginTransitionReducer, INITIAL_STATE);
  const nextAttemptId = useRef(0);

  const begin = useCallback(() => {
    const attemptId = ++nextAttemptId.current;
    dispatch({ type: 'begin', attemptId });
    return attemptId;
  }, []);
  const confirm = useCallback((attemptId: number) => dispatch({ type: 'confirm', attemptId }), []);
  const complete = useCallback((attemptId: number) => dispatch({ type: 'complete', attemptId }), []);
  const fail = useCallback((attemptId: number) => {
    dispatch({ type: 'fail', attemptId });
  }, []);
  const clearOnSignedOut = useCallback(() => dispatch({ type: 'signed-out' }), []);

  useEffect(() => {
    if (state.phase !== 'verified') return;
    // Respaldo si el componente se desmonta o la animación no emite su callback.
    // La duración principal la determina el callback; este límite deriva del token existente.
    const fallbackMs = Math.ceil(motionTransition('--transition-spring').duration * 1000 * 3);
    const timer = window.setTimeout(() => complete(state.attemptId), fallbackMs);
    return () => window.clearTimeout(timer);
  }, [state.phase, state.attemptId, complete]);

  return { state, begin, confirm, complete, fail, clearOnSignedOut };
}
