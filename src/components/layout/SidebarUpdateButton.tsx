import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw as RefreshCwIconData, TriangleAlert as TriangleAlertIconData } from 'lucide';
import { MorphingIcon } from '@/components/ui/MorphingIcon';
import { Tooltip } from '@/components/ui/Tooltip';
import { useTypewriterReveal } from '@/components/ui/useTypewriterReveal';
import { useMotionTokens } from '@/hooks/useMotionTokens';
import { useSystemUpdate } from '@/hooks/useSystemUpdate';
import './SidebarUpdateButton.css';

type SidebarUpdateButtonProps = {
  collapsed: boolean;
};

/**
 * Oferta de actualización en el footer del riel, encima de la cuenta. Entra
 * como icono solo y después escribe su etiqueta; al pulsarla el sistema aplica
 * la versión en espera. Sin actualización pendiente no ocupa espacio.
 */
export function SidebarUpdateButton({ collapsed }: SidebarUpdateButtonProps) {
  const { state, label, hint, apply } = useSystemUpdate();
  const { transition, distance } = useMotionTokens();
  const visibleLabel = useTypewriterReveal(label, {
    animated: state === 'available',
    delayMs: transition.duration * 1000,
  });

  const control = (
    <button
      type="button"
      className="sidebar__update"
      data-state={state}
      data-testid="sidebar-update"
      aria-label={label}
      disabled={state === 'applying'}
      onClick={apply}
    >
      <span
        className={`sidebar__update-icon${state === 'applying' ? ' spin' : ''}`}
        aria-hidden="true"
      >
        <MorphingIcon
          icon={state === 'error' ? TriangleAlertIconData : RefreshCwIconData}
          size="var(--icon-size-md)"
        />
      </span>
      <span className="sidebar__update-label" aria-hidden="true">
        {visibleLabel}
      </span>
    </button>
  );

  return (
    <AnimatePresence initial={false}>
      {state !== 'hidden' && (
        <motion.div
          className="sidebar__update-slot"
          initial={{ opacity: 0, y: distance }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: distance }}
          transition={transition}
        >
          {collapsed ? (
            <Tooltip content={hint} side="right">
              {control}
            </Tooltip>
          ) : (
            control
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
