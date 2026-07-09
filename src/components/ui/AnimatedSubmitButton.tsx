import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, Save } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { HTMLMotionProps } from 'framer-motion';

import { useFeedback } from '@/hooks/useFeedback';

export interface AnimatedSubmitButtonProps extends HTMLMotionProps<"button"> {
  isSubmitting: boolean;
  isSuccess: boolean;
  idleText?: string;
  loadingText?: string;
  successText?: string;
  idleIcon?: LucideIcon;
}

/**
 * AnimatedSubmitButton
 * 
 * Componente de botón que encapsula la animación 'popLayout' de Framer Motion.
 * Muestra transiciones suaves entre los estados:
 * - Idle: Icono y texto por defecto.
 * - Loading: Spinner y texto de carga.
 * - Success: Icono de check y texto de éxito.
 */
export function AnimatedSubmitButton({
  isSubmitting,
  isSuccess,
  idleText = 'Guardar',
  loadingText = 'Guardando...',
  successText = '¡Guardado!',
  idleIcon: IdleIcon = Save,
  className = '',
  disabled,
  type = 'submit',
  ...rest
}: AnimatedSubmitButtonProps) {
  const { trigger } = useFeedback();

  React.useEffect(() => {
    if (isSuccess) {
      trigger('success');
    }
  }, [isSuccess, trigger]);

  // Combinamos la clase disabled natural o el estado de loading/success
  const isDisabled = disabled || isSubmitting || isSuccess;

  return (
    <motion.button
      type={type}
      className={`${className} ${isSuccess ? 'submit-success' : ''}`}
      disabled={isDisabled}
      aria-busy={isSubmitting}
      aria-label={
        isSubmitting
          ? loadingText
          : isSuccess
          ? successText
          : idleText
      }
      whileTap={{ scale: isDisabled ? 1 : 0.96 }}
      layout
      style={{ overflow: 'hidden' }}
      {...rest}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {isSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', width: '100%' }}
          >
            <CheckCircle size={16} aria-hidden="true" />
            <span>{successText}</span>
          </motion.div>
        ) : isSubmitting ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', width: '100%' }}
          >
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            <span>{loadingText}</span>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}
          >
            <IdleIcon size={16} aria-hidden="true" />
            <span>{idleText}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
