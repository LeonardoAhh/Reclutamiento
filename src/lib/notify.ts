import React from 'react';
import { sileo as originalSileo } from 'sileo';
import { AnimatedCheck, AnimatedError } from '@/components/ui/AnimatedIcons';
import type { SileoOptions, SileoPosition } from 'sileo';

/**
 * Punto único de notificaciones de la app. Reexporta la API de `sileo`
 * pero inyectando nuestros íconos animados de Framer Motion por defecto.
 */
export const sileo = {
  ...originalSileo,
  success: (opts: SileoOptions) => 
    originalSileo.success({ icon: React.createElement(AnimatedCheck), ...opts }),
  error: (opts: SileoOptions) => 
    originalSileo.error({ icon: React.createElement(AnimatedError), ...opts }),
  promise: <T,>(promise: Promise<T> | (() => Promise<T>), opts: Parameters<typeof originalSileo.promise>[1]) =>
    originalSileo.promise(promise, opts),
};

if (typeof window !== 'undefined') {
  (window as unknown as { sileo: typeof sileo }).sileo = sileo;
}

export type ActionResult = { ok: boolean; message?: string };

interface NotifyMessages {
  /** Título del toast de éxito. */
  success: string;
  /** Título del toast de error (si la acción falla). */
  error?: string;
  successDescription?: string;
}

/**
 * Ejecuta una acción asíncrona que resuelve a `{ ok, message }` y emite un
 * toast cohesivo: `success` en éxito, `error` en fallo. Devuelve el mismo
 * resultado para no romper el flujo del caller.
 */
export async function notifyResult<T extends ActionResult>(
  action: Promise<T> | (() => Promise<T>),
  messages: NotifyMessages,
): Promise<T> {
  const res = await (typeof action === 'function' ? action() : action);
  if (res.ok) {
    sileo.success({
      title: messages.success,
      description: messages.successDescription,
    });
  } else {
    sileo.error({
      title: messages.error ?? 'No se pudo realizar la acción',
    });
  }
  return res;
}
