/**
 * Política compartida de datos stale-while-revalidate.
 *
 * - Al volver a una página se muestran al instante los datos ya cargados
 *   (memoria de la sesión o localStorage) y se revalidan en segundo plano.
 * - El skeleton solo aparece cuando no existe ningún dato que mostrar.
 * - Dentro de la ventana de frescura no se repite la descarga: navegar de ida
 *   y vuelta entre páginas no vuelve a pedir las mismas tablas completas.
 */
export const DATA_REVALIDATE_AFTER_MS = 30_000;

/** `true` si un recurso se descargó hace menos de la ventana de frescura. */
export function isFresh(fetchedAt: number | undefined): boolean {
  return fetchedAt !== undefined && Date.now() - fetchedAt < DATA_REVALIDATE_AFTER_MS;
}

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
};

/** Plazo máximo para persistir aunque el navegador no quede ocioso. */
const IDLE_TIMEOUT_MS = 2_000;

/**
 * Ejecuta trabajo no urgente (p. ej. serializar tablas completas a
 * localStorage) fuera del frame de navegación para no bloquear el render.
 */
export function scheduleIdle(task: () => void): void {
  if (typeof window === 'undefined') {
    task();
    return;
  }
  const idleWindow = window as IdleWindow;
  if (typeof idleWindow.requestIdleCallback === 'function') {
    idleWindow.requestIdleCallback(task, { timeout: IDLE_TIMEOUT_MS });
    return;
  }
  window.setTimeout(task, 0);
}
