import { useEffect, useRef } from 'react';
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
  errorMessageId?: string;
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
  errorMessageId,
  idleIcon = Save,
  iconOnly = false,
  className = '',
  disabled = false,
  type = 'submit',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  title,
  ...buttonProps
}: AnimatedSubmitButtonProps) {
  const { trigger } = useFeedback();
  const previousState = useRef<SubmitState>('idle');
  const state: SubmitState = isSubmitting ? 'loading' : isError ? 'error' : isSuccess ? 'success' : 'idle';
  const isDisabled = Boolean(disabled) || state === 'loading' || state === 'success';
  const visibleText = state === 'loading' ? loadingText : state === 'success' ? successText : idleText;
  const accessibleLabel = ariaLabel ?? (ariaLabelledBy ? undefined : visibleText);
  const describedBy = [ariaDescribedBy, state === 'error' ? errorMessageId : undefined]
    .filter(Boolean)
    .join(' ') || undefined;
  const announcement = state === 'loading'
    ? loadingText
    : state === 'success'
      ? successText
      : state === 'error' && !errorMessageId
        ? errorText
        : '';
  const stateIcon = state === 'loading'
    ? LoaderCircle
    : state === 'success'
      ? CircleCheckBig
      : state === 'error'
        ? CircleAlert
        : idleIcon;

  useEffect(() => {
    if (state === previousState.current) return;
    previousState.current = state;

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
    <>
      <motion.button
        {...buttonProps}
        type={type}
        className={['animated-submit-button', className].filter(Boolean).join(' ')}
        data-state={state}
        data-icon-only={iconOnly || undefined}
        disabled={isDisabled}
        aria-busy={state === 'loading' || undefined}
        aria-label={accessibleLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={describedBy}
        title={title ?? (iconOnly ? accessibleLabel : undefined)}
      >
        <span className="animated-submit-button__content" aria-hidden="true">
          <span className="animated-submit-button__measure">
            <span className="animated-submit-button__measure-icon" />
            {!iconOnly && (
              <span className="animated-submit-button__measure-text">
                <span>{idleText}</span>
                <span>{loadingText}</span>
                <span>{successText}</span>
              </span>
            )}
          </span>
          <span className="animated-submit-button__visual">
            <MorphingIcon
              icon={stateIcon}
              size="var(--icon-size-sm)"
              reducedMotion="user"
              className={state === 'loading' ? 'animated-submit-button__spinner' : undefined}
            />
            {state !== 'loading' && !iconOnly && (
              <span className="animated-submit-button__text">{visibleText}</span>
            )}
          </span>
        </span>
      </motion.button>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
    </>
  );
}
