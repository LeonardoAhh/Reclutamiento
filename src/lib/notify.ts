import { sileo } from 'sileo';

/**
 * Punto único de notificaciones de la app. Reexporta la API de `sileo`
 * (sileo.success / error / warning / info / action / promise) y añade un
 * helper para flujos que devuelven `{ ok, message }`.
 *
 * El `<AppToaster />` (montado en App.tsx) define posición, tema y estilos
 * cohesivos con el design system.
 */
export { sileo };

// Expuesto en window para poder disparar toasts manualmente desde la consola
// (F12 → `sileo.success({ title: 'Hola' })`). Inofensivo: es solo la API de toasts.
if (typeof window !== 'undefined') {
  (window as unknown as { sileo: typeof sileo }).sileo = sileo;
}

export type ActionResult = { ok: boolean; message?: string };

interface NotifyMessages {
  /** Título del toast de éxito. */
  success: string;
  /** Descripción opcional del toast de éxito. */
  successDescription?: string;
  /** Título del toast de error (si la acción falla). */
  error?: string;
}

/**
 * Ejecuta una acción asíncrona que resuelve a `{ ok, message }` y emite un
 * toast cohesivo: `success` en éxito, `error` (con el `message` del backend
 * como descripción) en fallo. Devuelve el mismo resultado para no romper el
 * flujo del caller (p. ej. un modal que se cierra al recibir `ok: true`).
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
      title: messages.error ?? 'No se pudo completar la acción',
      description: res.message,
    });
  }
  return res;
}
