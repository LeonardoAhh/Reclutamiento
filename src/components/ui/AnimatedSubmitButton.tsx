import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  CircleAlert,
  LoaderCircle,
  Save,
} from 'lucide';
import { CircleCheckBig } from 'lucide-react';
import type { IconInput } from 'morphicons/react';
import type { HTMLMotionProps } from 'framer-motion';

import { useLanguage } from '@/contexts/LanguageContext';
import { useFeedback } from '@/hooks/useFeedback';
import { MorphingIcon } from '@/components/ui/MorphingIcon';
import { motionDistance, motionTransition } from '@/lib/motionTokens';
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
  feedbackSound?: boolean;
  idleIcon?: IconInput;
  iconOnly?: boolean;
  onSuccessAnimationComplete?: () => void;
}

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

export function AnimatedSubmitButton({
  isSubmitting,
  isSuccess,
  isError,
  idleText: idleTextProp,
  loadingText: loadingTextProp,
  successText: successTextProp,
  errorText: errorTextProp,
  errorMessageId,
  feedbackSound = true,
  idleIcon = Save,
  iconOnly = false,
  onSuccessAnimationComplete,
  className = '',
  disabled = false,
  type = 'submit',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  title,
  ...buttonProps
}: AnimatedSubmitButtonProps) {
  const { language } = useLanguage();
  const english = language === 'en';
  const idleText = idleTextProp ?? (english ? 'Save' : 'Guardar');
  const loadingText = loadingTextProp ?? (english ? 'Saving…' : 'Guardando…');
  const successText = successTextProp ?? (english ? 'Saved!' : '¡Guardado!');
  const errorText = errorTextProp ?? 'Error';
  const { trigger } = useFeedback();
  const reducedMotion = useReducedMotion();
  const travel = motionDistance('--motion-float-distance');
  const stateTransition = reducedMotion ? { duration: 0 } : motionTransition('--transition-spring');
  const previousState = useRef<SubmitState>('idle');
  const successNotified = useRef(false);
  const state: SubmitState = isSubmitting ? 'loading' : isError ? 'error' : isSuccess ? 'success' : 'idle';
  const isDisabled = Boolean(disabled) || state === 'loading' || state === 'success';
  const visibleText = state === 'loading' ? loadingText : state === 'success' ? successText : state === 'error' && !errorMessageId ? errorText : idleText;
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
    : state === 'error'
      ? CircleAlert
      : idleIcon;

  useEffect(() => {
    if (state === previousState.current) return;
    previousState.current = state;

    if (state === 'success') {
      try {
        trigger('success', { sound: feedbackSound });
      } catch (error) {
        console.warn('No se pudo reproducir el feedback de éxito:', error);
      }
    } else if (state === 'error') {
      try {
        trigger('error', { sound: feedbackSound });
      } catch (error) {
        console.warn('No se pudo reproducir el feedback de error:', error);
      }
    }
  }, [state, trigger, feedbackSound]);

  useEffect(() => {
    if (state !== 'success') {
      successNotified.current = false;
      return;
    }
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const frame = window.requestAnimationFrame(() => {
      if (successNotified.current) return;
      successNotified.current = true;
      onSuccessAnimationComplete?.();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [state, onSuccessAnimationComplete]);

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
                {!errorMessageId && <span>{errorText}</span>}
              </span>
            )}
          </span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={state}
              className="animated-submit-button__visual"
              initial={{ opacity: 0, y: reducedMotion ? 0 : travel }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reducedMotion ? 0 : -travel }}
              transition={stateTransition}
              onAnimationComplete={() => {
                if (state !== 'success' || successNotified.current) return;
                successNotified.current = true;
                onSuccessAnimationComplete?.();
              }}
            >
              {state === 'success' ? (
                <CircleCheckBig size="var(--icon-size-sm)" aria-hidden="true" />
              ) : (
                <MorphingIcon
                  icon={stateIcon}
                  size="var(--icon-size-sm)"
                  reducedMotion="user"
                  className={state === 'loading' ? 'animated-submit-button__spinner' : undefined}
                />
              )}
              {!iconOnly && (
                <span className="animated-submit-button__text">{visibleText}</span>
              )}
            </motion.span>
          </AnimatePresence>
        </span>
      </motion.button>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
    </>
  );
}
