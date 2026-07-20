import { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CheckCircle, Loader2, Save, type LucideIcon } from 'lucide-react';
import type { HTMLMotionProps } from 'framer-motion';

import { useFeedback } from '@/hooks/useFeedback';
import './AnimatedSubmitButton.css';

export interface AnimatedSubmitButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  isSubmitting: boolean;
  isSuccess: boolean;
  idleText?: string;
  loadingText?: string;
  successText?: string;
  idleIcon?: LucideIcon;
  iconOnly?: boolean;
}

type SubmitState = 'idle' | 'loading' | 'success';

export function AnimatedSubmitButton({
  isSubmitting,
  isSuccess,
  idleText = 'Guardar',
  loadingText = 'Guardando…',
  successText = '¡Guardado!',
  idleIcon: IdleIcon = Save,
  iconOnly = false,
  className = '',
  disabled = false,
  type = 'submit',
  ...buttonProps
}: AnimatedSubmitButtonProps) {
  const { trigger } = useFeedback();
  const reduceMotion = useReducedMotion();
  const state: SubmitState = isSubmitting ? 'loading' : isSuccess ? 'success' : 'idle';
  const isDisabled = Boolean(disabled) || state !== 'idle';
  const stateText = state === 'loading' ? loadingText : state === 'success' ? successText : idleText;

  useEffect(() => {
    if (state !== 'success') return;
    try {
      trigger('success');
    } catch (error) {
      console.warn('No se pudo reproducir el feedback de éxito:', error);
    }
  }, [state, trigger]);

  return (
    <motion.button
      {...buttonProps}
      type={type}
      className={['animated-submit-button', className].filter(Boolean).join(' ')}
      data-state={state}
      disabled={isDisabled}
      aria-busy={state === 'loading' || undefined}
      aria-label={stateText}
      title={iconOnly ? stateText : undefined}
      whileTap={reduceMotion || isDisabled ? undefined : { scale: 0.96 }}
      layout={!reduceMotion}
      transition={{
        layout: { type: 'spring', bounce: 0, duration: 0.3 }
      }}
    >
      {/* ── Hidden live region for screen readers ── */}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {stateText}
      </span>

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={state}
          className="animated-submit-button__content"
          aria-hidden="true"
          initial={reduceMotion ? false : { y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduceMotion ? undefined : { y: -15, opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
        >
          {state === 'success' ? (
            <CheckCircle size="1.25em" />
          ) : state === 'loading' ? (
            <Loader2 size="1.25em" className="animated-submit-button__spinner" />
          ) : (
            <>
              <IdleIcon size="1.2em" />
              {!iconOnly && <span className="animated-submit-button__text">{idleText}</span>}
            </>
          )}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
