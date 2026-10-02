(() => {
  const storageKey = 'reclutamiento_color_scheme';
  const root = document.documentElement;
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const listeners = new Set();
  const isPreference = (value) => value === 'light' || value === 'dark' || value === 'system';

  function readPreference() {
    try {
      const saved = window.localStorage.getItem(storageKey);
      return { preference: isPreference(saved) ? saved : 'system', storageError: false };
    } catch {
      return { preference: 'system', storageError: true };
    }
  }

  const initial = readPreference();
  let snapshot;

  function syncBrowserColor() {
    const canvas = window.getComputedStyle(root).getPropertyValue('--color-canvas').trim();
    const meta = document.querySelector('meta[name="theme-color"]');
    if (canvas && meta) meta.setAttribute('content', canvas);
  }

  function apply(preference, storageError) {
    const resolvedTheme = preference === 'system' ? (media.matches ? 'dark' : 'light') : preference;
    if (snapshot?.preference === preference &&
        snapshot.resolvedTheme === resolvedTheme &&
        snapshot.storageError === storageError) return;

    snapshot = Object.freeze({ preference, resolvedTheme, storageError });
    root.dataset.colorScheme = resolvedTheme;
    if (document.readyState !== 'loading') syncBrowserColor();
    listeners.forEach((listener) => listener());
  }

  function setPreference(preference) {
    if (!isPreference(preference)) throw new TypeError('Preferencia de apariencia inválida.');
    let storageError = false;
    try {
      window.localStorage.setItem(storageKey, preference);
    } catch {
      storageError = true;
    }
    apply(preference, storageError);
  }

  // Se ejecuta antes del CSS para restaurar la apariencia sin mostrar el tema contrario.
  apply(initial.preference, initial.storageError);
  window.reclutamientoTheme = Object.freeze({
    getSnapshot: () => snapshot,
    setPreference,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  });

  media.addEventListener('change', () => {
    if (snapshot.preference === 'system') apply('system', snapshot.storageError);
  });
  window.addEventListener('storage', (event) => {
    if (event.key !== storageKey && event.key !== null) return;
    // Ignorar cambios de sessionStorage y conservar la elección cuando el acceso está bloqueado.
    try {
      if (event.storageArea !== window.localStorage) return;
    } catch {
      return;
    }
    const next = readPreference();
    apply(next.preference, next.storageError);
  });
  document.addEventListener('DOMContentLoaded', syncBrowserColor, { once: true });
})();
