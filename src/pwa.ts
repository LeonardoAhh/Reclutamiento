// Service Worker registration handled by vite-plugin-pwa.
// `registerType: 'prompt'` (vite.config.ts) means we ask the user before
// activating an update so en-vuelo state (formularios abiertos, notas a
// medio escribir) no se interrumpe silenciosamente.
import { registerSW } from 'virtual:pwa-register';

type RegisterOptions = {
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
};

export function registerServiceWorker(options: RegisterOptions = {}): void {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  const updateSW = registerSW({
    onNeedRefresh: () => {
      options.onNeedRefresh?.();
      window.dispatchEvent(
        new CustomEvent('pwa:need-refresh', {
          detail: { update: () => updateSW(true) },
        })
      );
    },
    onOfflineReady: () => {
      options.onOfflineReady?.();
      window.dispatchEvent(new CustomEvent('pwa:offline-ready'));
    },
  });
}
