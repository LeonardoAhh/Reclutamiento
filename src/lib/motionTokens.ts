/**
 * Convierte los tokens de transición CSS (`--transition-*`) en transiciones de
 * framer-motion para que duración y curva provengan de la fuente central de
 * tokens (`global.css`) y no de valores fijos en componentes.
 */
export type MotionTransitionToken =
  | '--transition-fast'
  | '--transition-base'
  | '--transition-slow'
  | '--transition-spring';

export type MotionLengthToken = '--motion-float-distance';

type CubicBezier = [number, number, number, number];

export interface TokenTransition {
  duration: number;
  ease?: CubicBezier | 'linear';
}

const transitions = new Map<MotionTransitionToken, TokenTransition>();
const lengths = new Map<MotionLengthToken, number>();

function readToken(name: string) {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function parseEase(value: string): TokenTransition['ease'] {
  const match = /cubic-bezier\(([^)]+)\)/.exec(value);
  if (!match) return value.includes('linear') ? 'linear' : undefined;
  const points = match[1].split(',').map(point => Number(point.trim()));
  return points.length === 4 && points.every(Number.isFinite)
    ? [points[0], points[1], points[2], points[3]]
    : undefined;
}

/** Transición de framer-motion derivada de un token `--transition-*`. */
export function motionTransition(token: MotionTransitionToken): TokenTransition {
  const cached = transitions.get(token);
  if (cached) return cached;
  const value = readToken(token);
  const time = /(\d*\.?\d+)(ms|s)\b/.exec(value);
  if (!time) return { duration: 0 };
  const duration = Number(time[1]) / (time[2] === 'ms' ? 1000 : 1);
  const transition: TokenTransition = { duration, ease: parseEase(value) };
  transitions.set(token, transition);
  return transition;
}

/** Distancia de movimiento en px derivada de un token de longitud. */
export function motionDistance(token: MotionLengthToken): number {
  const cached = lengths.get(token);
  if (cached !== undefined) return cached;
  const value = readToken(token);
  const amount = Number.parseFloat(value);
  if (!Number.isFinite(amount)) return 0;
  const rootSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
  const pixels = value.endsWith('rem') || value.endsWith('em') ? amount * rootSize : amount;
  lengths.set(token, pixels);
  return pixels;
}
