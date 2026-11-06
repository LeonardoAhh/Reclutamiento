(() => {
  const storageKey = 'reclutamiento_color_scheme';
  const paletteStorageKey = 'reclutamiento_color_palette';
  const root = document.documentElement;
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const listeners = new Set();
  const isPreference = (value) => value === 'light' || value === 'dark' || value === 'system';
  const isPalette = (value) =>
    value === 'original' ||
    value === 'ocean-saas' ||
    value === 'darkmatter-remix' ||
    value === 'sea-glass' ||
    value === 'claude-amber' ||
    value === 'supabase';

  function normalizePalette(value) {
    return value === 'chemp' ? 'sea-glass' : value;
  }

  function readPreference() {
    try {
      const saved = window.localStorage.getItem(storageKey);
      return { preference: isPreference(saved) ? saved : 'system', storageError: false };
    } catch {
      return { preference: 'system', storageError: true };
    }
  }

  function readPalette() {
    try {
      const saved = window.localStorage.getItem(paletteStorageKey);
      const palette = normalizePalette(saved);
      return { palette: isPalette(palette) ? palette : 'original', storageError: false };
    } catch {
      return { palette: 'original', storageError: true };
    }
  }

  const initialPreference = readPreference();
  const initialPalette = readPalette();
  let preferenceStorageError = initialPreference.storageError;
  let paletteStorageError = initialPalette.storageError;
  let snapshot;

  function syncBrowserColor() {
    const background = window.getComputedStyle(root).backgroundColor;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (background && meta) {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const context = canvas.getContext('2d');
      if (context) {
        try {
          context.fillStyle = background;
          context.fillRect(0, 0, 1, 1);
          const channels = context.getImageData(0, 0, 1, 1).data;
          const hex = Array.from(channels.slice(0, 3), (channel) => channel.toString(16).padStart(2, '0')).join('');
          meta.setAttribute('content', `#${hex}`);
        } catch {
          meta.setAttribute('content', background);
        }
      } else {
        meta.setAttribute('content', background);
      }
    }
    const statusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (statusBar) {
      statusBar.setAttribute(
        'content',
        snapshot.resolvedTheme === 'dark' ? 'black-translucent' : 'default',
      );
    }
  }

  function apply(preference, palette) {
    const resolvedTheme = preference === 'system' ? (media.matches ? 'dark' : 'light') : preference;
    const storageError = preferenceStorageError || paletteStorageError;
    if (
      snapshot?.preference === preference &&
      snapshot.palette === palette &&
      snapshot.resolvedTheme === resolvedTheme &&
      snapshot.storageError === storageError
    )
      return;

    snapshot = Object.freeze({ preference, palette, resolvedTheme, storageError });
    root.dataset.colorScheme = resolvedTheme;
    root.dataset.colorPalette = palette;
    if (document.readyState !== 'loading') syncBrowserColor();
    listeners.forEach((listener) => listener());
  }

  function setPreference(preference) {
    if (!isPreference(preference)) throw new TypeError('Preferencia de apariencia inválida.');
    try {
      window.localStorage.setItem(storageKey, preference);
      preferenceStorageError = false;
    } catch {
      preferenceStorageError = true;
    }
    apply(preference, snapshot.palette);
  }

  function setPalette(palette) {
    if (!isPalette(palette)) throw new TypeError('Paleta de apariencia inválida.');
    try {
      window.localStorage.setItem(paletteStorageKey, palette);
      paletteStorageError = false;
    } catch {
      paletteStorageError = true;
    }
    apply(snapshot.preference, palette);
  }

  // Se ejecuta antes del CSS para restaurar la apariencia sin mostrar el tema contrario.
  apply(initialPreference.preference, initialPalette.palette);
  window.reclutamientoTheme = Object.freeze({
    getSnapshot: () => snapshot,
    setPreference,
    setPalette,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  });

  media.addEventListener('change', () => {
    if (snapshot.preference === 'system') apply('system', snapshot.palette);
  });
  window.addEventListener('storage', (event) => {
    if (event.key !== storageKey && event.key !== paletteStorageKey && event.key !== null) return;
    // Ignorar cambios de sessionStorage y conservar la elección cuando el acceso está bloqueado.
    try {
      if (event.storageArea !== window.localStorage) return;
    } catch {
      return;
    }
    const nextPreference = readPreference();
    const nextPalette = readPalette();
    preferenceStorageError = nextPreference.storageError;
    paletteStorageError = nextPalette.storageError;
    apply(nextPreference.preference, nextPalette.palette);
  });
  document.addEventListener('DOMContentLoaded', syncBrowserColor, { once: true });
})();
