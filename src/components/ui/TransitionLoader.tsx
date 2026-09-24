import { MorphingIcon } from '@/components/ui/MorphingIcon';
import { useMorphingSequence } from '@/hooks/useMorphingSequence';
import './TransitionLoader.css';

interface TransitionLoaderProps {
  title?: string;
  variant?: TransitionLoaderVariant;
}

export type TransitionLoaderVariant = 'default' | 'workspace-entry' | 'workspace-exit';

export function TransitionLoader({
  title,
  variant = 'default',
}: TransitionLoaderProps) {
  const isWorkspaceEntry = variant === 'workspace-entry';
  const isWorkspaceExit = variant === 'workspace-exit';
  const isWorkspaceTransition = isWorkspaceEntry || isWorkspaceExit;
  const accessibleTitle = title ?? (isWorkspaceEntry
    ? 'Acceso confirmado. Preparando tu sesión…'
    : isWorkspaceExit
      ? 'Cerrando sesión…'
      : 'Sincronizando…');
  const eyebrow = isWorkspaceEntry ? 'Acceso confirmado' : 'Sesión segura';
  const visibleTitle = isWorkspaceEntry ? 'Preparando tu sesión…' : 'Cerrando sesión…';
  const { icon } = useMorphingSequence(variant);

  return (
    <div
      className={`transition-loader transition-loader--${variant}`}
      role="status"
      aria-atomic="true"
    >
      <span className="sr-only">{accessibleTitle}</span>
      {isWorkspaceTransition ? (
        <div className="transition-loader__workspace-shell" aria-hidden="true">
          <aside className="transition-loader__rail">
            <span className="transition-loader__rail-mark" />
            <span className="transition-loader__rail-line transition-loader__rail-line--strong" />
            <span className="transition-loader__rail-line" />
            <span className="transition-loader__rail-line" />
          </aside>
          <div className="transition-loader__workspace">
            <div className="transition-loader__entry-status">
              <span className="transition-loader__icon-frame">
                <MorphingIcon
                  icon={icon}
                  size="var(--loader-icon-size)"
                />
              </span>
              <span className="transition-loader__eyebrow">{eyebrow}</span>
              <span className="transition-loader__title">{visibleTitle}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="transition-loader__content" aria-hidden="true">
          <MorphingIcon
            icon={icon}
            size="var(--loader-icon-size)"
          />
        </div>
      )}
    </div>
  );
}
