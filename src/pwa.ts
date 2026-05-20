// Service Worker registration handled by vite-plugin-pwa.
// `registerType: 'autoUpdate'` (vite.config.ts) instructs the SW to silently
// refresh assets when a new build is deployed.
import { registerSW } from 'virtual:pwa-register';

export function registerServiceWorker(): void {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  registerSW({ immediate: true });
}
