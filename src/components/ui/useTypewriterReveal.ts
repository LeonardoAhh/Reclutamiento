import { useEffect, useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { TYPEWRITER_INTERVAL_MS } from '@/lib/constants';

export interface TypewriterRevealOptions {
  /** Ventana disponible: el paso se reparte sin rebasar el intervalo base. */
  durationMs?: number;
  /** Con `false` el texto aparece completo, igual que con movimiento reducido. */
  animated?: boolean;
  /** Espera antes del primer carácter; deja entrar el icono primero. */
  delayMs?: number;
}

/**
 * Revela un texto carácter a carácter sin rebasar la ventana disponible.
 * Devuelve el texto completo de inmediato cuando el movimiento está desactivado,
 * así que el consumidor siempre puede pintar lo que recibe.
 */
export function useTypewriterReveal(
  text: string,
  { durationMs = Number.POSITIVE_INFINITY, animated = true, delayMs = 0 }: TypewriterRevealOptions = {},
): string {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const enabled = animated && !reducedMotion;
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    const total = Array.from(text).length;
    if (!enabled || total === 0) {
      setRevealed(total);
      return;
    }

    setRevealed(0);
    const step = Number.isFinite(durationMs)
      ? Math.max(1, Math.min(TYPEWRITER_INTERVAL_MS, Math.floor(durationMs / (total * 2))))
      : TYPEWRITER_INTERVAL_MS;

    let interval = 0;
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        setRevealed((count) => {
          const next = count + 1;
          if (next >= total) window.clearInterval(interval);
          return next;
        });
      }, step);
    }, delayMs);

    return () => {
      window.clearTimeout(start);
      window.clearInterval(interval);
    };
  }, [delayMs, durationMs, enabled, text]);

  return Array.from(text).slice(0, revealed).join('');
}
