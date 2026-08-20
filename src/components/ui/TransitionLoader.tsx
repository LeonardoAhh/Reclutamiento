import { MorphingIcon } from '@/components/ui/MorphingIcon';
import { useMorphingSequence } from '@/hooks/useMorphingSequence';
import './TransitionLoader.css';

interface TransitionLoaderProps {
  title?: string;
}

export function TransitionLoader({
  title = 'Sincronizando…',
}: TransitionLoaderProps) {
  const { icon } = useMorphingSequence();

  return (
    <div
      className="transition-loader"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-busy="true"
    >
      <span className="sr-only">{title}</span>
      <div className="transition-loader__content" aria-hidden="true">
        <div className="transition-loader__icon">
          <MorphingIcon
            icon={icon}
            size="var(--loader-icon-size)"
          />
        </div>
      </div>
    </div>
  );
}
