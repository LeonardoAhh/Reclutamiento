import { useEffect } from 'react';
import { MorphingIcon } from '@/components/ui/MorphingIcon';
import {
  MORPHING_SEQUENCE_CYCLE_MS,
  useMorphingSequence,
} from '@/hooks/useMorphingSequence';
import './SplashTypewriter.css';

interface SplashTypewriterProps {
  onDone: () => void;
}

export function SplashTypewriter({ onDone }: SplashTypewriterProps) {
  const { icon, shouldReduceMotion } = useMorphingSequence();

  useEffect(() => {
    const durationMs = shouldReduceMotion ? 0 : MORPHING_SEQUENCE_CYCLE_MS;
    const timer = window.setTimeout(onDone, durationMs);
    return () => window.clearTimeout(timer);
  }, [onDone, shouldReduceMotion]);

  return (
    <div
      className="app-splash"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-busy="true"
    >
      <span className="sr-only">Cargando aplicación…</span>
      <div className="app-splash__content" aria-hidden="true">
        <div className="app-splash__icon">
          <MorphingIcon
            icon={icon}
            size="var(--loader-icon-size)"
          />
        </div>
      </div>
    </div>
  );
}
