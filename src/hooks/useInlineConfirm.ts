import { useCallback, useState, type KeyboardEvent } from 'react';

/**
 * Confirmación en línea de dos clics: el primer clic guarda el valor pendiente,
 * el segundo lo aplica. Perder el foco o pulsar Escape cancela la confirmación.
 */
export function useInlineConfirm<T = true>() {
  const [pending, setPending] = useState<T | null>(null);
  const cancel = useCallback(() => setPending(null), []);
  const onKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') setPending(null);
  }, []);
  return {
    pending,
    confirming: pending !== null,
    request: setPending,
    cancel,
    triggerProps: { onBlur: cancel, onKeyDown },
  };
}
