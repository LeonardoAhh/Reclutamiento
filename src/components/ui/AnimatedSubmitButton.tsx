import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CircleAlert,
  CircleCheckBig,
  LoaderCircle,
  Save,
} from 'lucide';
import type { IconInput } from 'morphicons/react';
import type { HTMLMotionProps } from 'framer-motion';

import { useFeedback } from '@/hooks/useFeedback';
import { MorphingIcon } from '@/components/ui/MorphingIcon';
import './AnimatedSubmitButton.css';

export interface AnimatedSubmitButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  isSubmitting: boolean;
  isSuccess: boolean;
  idleText?: string;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  isError?: boolean;
  idleIcon?: IconInput;
  iconOnly?: boolean;
}

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

export function AnimatedSubmitButton({
  isSubmitting,
  isSuccess,
  isError,
  idleText = 'Guardar',
  loadingText = 'Guardando…',
  successText = '¡Guardado!',
  errorText = 'Error',
  idleIcon = Save,
  iconOnly = false,
  className = '',
  disabled = false,
  type = 'submit',
  ...buttonProps
}: AnimatedSubmitButtonProps) {
  const { trigger } = useFeedback();
  const state: SubmitState = isSuccess ? 'success' : isError ? 'error' : isSubmitting ? 'loading' : 'idle';
  const isDisabled = Boolean(disabled) || state !== 'idle';
  const stateText = state === 'loading' ? loadingText : state === 'success' ? successText : state === 'error' ? errorText : idleText;
  const stateIcon = state === 'loading'
    ? LoaderCircle
    : state === 'success'
      ? CircleCheckBig
      : state === 'error'
        ? CircleAlert
        : idleIcon;

  useEffect(() => {
    if (state === 'success') {
      try {
        trigger('success');
      } catch (error) {
        console.warn('No se pudo reproducir el feedback de éxito:', error);
      }
    } else if (state === 'error') {
      try {
        trigger('error');
      } catch (error) {
        console.warn('No se pudo reproducir el feedback de error:', error);
      }
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
    >
      {/* ── Hidden live region for screen readers ── */}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {stateText}
      </span>

      <span className="animated-submit-button__content" aria-hidden="true">
        <MorphingIcon
          icon={stateIcon}
          size="var(--icon-size-sm)"
          className={state === 'loading' ? 'animated-submit-button__spinner' : undefined}
        />
        {!iconOnly && (
          <span className="animated-submit-button__text">{stateText}</span>
        )}
      </span>
    </motion.button>
  );
}
