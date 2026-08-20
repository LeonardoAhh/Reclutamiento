import { useEffect, useRef } from 'react';
import {
  animate,
  useInView,
  useMotionValue,
  useReducedMotion,
} from 'framer-motion';
import { EASE_OUT } from '@/lib/motion';

interface AnimatedNumberProps {
  /** Valor final al que se anima. */
  value: number;
  /** Decimales a mostrar. */
  decimals?: number;
  prefix?: string;
  suffix?: string;
  /** Duración del conteo en segundos. */
  duration?: number;
  className?: string;
}

function formatValue(
  n: number,
  decimals: number,
  prefix: string,
  suffix: string,
): string {
  const fixed = decimals > 0 ? n.toFixed(decimals) : String(Math.round(n));
  return `${prefix}${fixed}${suffix}`;
}

/**
 * Número con animación de conteo (0 → valor) al entrar en viewport.
 *
 * - Mobile-first: se anima solo cuando es visible (scroll-reveal).
 * - Accesible: respeta `prefers-reduced-motion` (muestra el valor sin animar).
 * - No bloquea selección/copia: actualiza `textContent` directo, sin re-render.
 */
export function AnimatedNumber({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = 1.1,
  className,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-8% 0px' });
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduce) {
      el.textContent = formatValue(value, decimals, prefix, suffix);
      return;
    }
    if (!inView) return;

    mv.set(0);
    const controls = animate(mv, value, { duration, ease: EASE_OUT });
    const unsub = mv.on('change', (v) => {
      el.textContent = formatValue(v, decimals, prefix, suffix);
    });
    return () => {
      controls.stop();
      unsub();
    };
  }, [inView, reduce, value, decimals, prefix, suffix, duration, mv]);

  return (
    <span ref={ref} className={className}>
      {formatValue(reduce ? value : 0, decimals, prefix, suffix)}
    </span>
  );
}
