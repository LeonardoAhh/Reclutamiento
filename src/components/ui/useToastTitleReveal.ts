import { useEffect, useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { TOAST_CONFIG } from '@/lib/constants';

/**
 * Revela el título carácter a carácter sin pasarse de la duración del aviso.
 * Devuelve el texto completo de inmediato cuando el movimiento está desactivado.
 */
export function useToastTitleReveal(title: string, durationMs: number, animated: boolean): string {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const enabled = animated && !reducedMotion;
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    const total = Array.from(title).length;
    if (!enabled || total === 0) {
      setRevealed(total);
      return;
    }

    setRevealed(0);
    const step = Number.isFinite(durationMs)
      ? Math.max(1, Math.min(TOAST_CONFIG.typewriterIntervalMs, Math.floor(durationMs / (total * 2))))
      : TOAST_CONFIG.typewriterIntervalMs;
    const timer = window.setInterval(() => {
      setRevealed((count) => {
        const next = count + 1;
        if (next >= total) window.clearInterval(timer);
        return next;
      });
    }, step);

    return () => window.clearInterval(timer);
  }, [durationMs, enabled, title]);

  return Array.from(title).slice(0, revealed).join('');
}
