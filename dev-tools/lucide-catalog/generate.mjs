import { writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { icons } from 'lucide-react';

const require = createRequire(import.meta.url);
const { version } = require('lucide-react/package.json');
const outputPath = fileURLToPath(new URL('./index.html', import.meta.url));

const escapeHtml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const toSearchText = (name) =>
  name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLocaleLowerCase('en');

const iconEntries = Object.entries(icons).sort(([left], [right]) =>
  left.localeCompare(right, 'en'),
);

const cards = iconEntries
  .map(([name, Icon]) => {
    const safeName = escapeHtml(name);
    const iconMarkup = renderToStaticMarkup(
      React.createElement(Icon, {
        'aria-hidden': true,
        focusable: false,
      }),
    );

    return `
      <li class="icon-catalog__item" data-icon-item data-search="${escapeHtml(toSearchText(name))}">
        <button
          class="icon-catalog__card"
          type="button"
          data-icon-name="${safeName}"
          aria-label="Copiar código de ${safeName}"
        >
          <span class="icon-catalog__preview" aria-hidden="true">${iconMarkup}</span>
          <span class="icon-catalog__name">${safeName}</span>
          <span class="icon-catalog__hint">Copiar código</span>
        </button>
      </li>`;
  })
  .join('');

const document = `<!doctype html>
<html lang="es-MX">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light dark" />
    <title>Catálogo local de Lucide React</title>
    <link rel="stylesheet" href="../../src/styles/global.css" />
    <link rel="stylesheet" href="./catalog.css" />
    <script>
      document.documentElement.dataset.theme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    </script>
  </head>
  <body>
    <main class="icon-catalog">
      <header class="icon-catalog__header">
        <div class="icon-catalog__intro">
          <p class="icon-catalog__eyebrow">Herramienta local · lucide-react ${escapeHtml(version)}</p>
          <h1>Catálogo de iconos</h1>
          <p>Busca un icono y copia su importación y componente listos para React.</p>
        </div>

        <section class="icon-catalog__controls" aria-label="Controles del catálogo">
          <div class="icon-catalog__field icon-catalog__field--search">
            <label for="icon-search">Buscar por nombre</label>
            <input
              id="icon-search"
              type="search"
              placeholder="Ejemplo: calendar, user, arrow…"
              autocomplete="off"
              spellcheck="false"
              data-search-input
            />
          </div>

          <div class="icon-catalog__field">
            <label for="icon-size">Tamaño</label>
            <select id="icon-size" data-size-select>
              <option value="--icon-size-sm">Pequeño</option>
              <option value="--icon-size-md">Mediano</option>
              <option value="--icon-size-lg" selected>Grande</option>
              <option value="--icon-size-xl">Extra grande</option>
              <option value="--icon-size-xxl">XXL</option>
            </select>
          </div>

          <div class="icon-catalog__field">
            <label for="icon-stroke">Trazo</label>
            <select id="icon-stroke" data-stroke-select>
              <option value="1">Fino · 1</option>
              <option value="1.5">Ligero · 1.5</option>
              <option value="2" selected>Estándar · 2</option>
              <option value="2.5">Fuerte · 2.5</option>
              <option value="3">Grueso · 3</option>
            </select>
          </div>
        </section>

        <div class="icon-catalog__summary">
          <p data-results-status role="status" aria-live="polite">${iconEntries.length.toLocaleString('es-MX')} iconos</p>
          <p class="icon-catalog__feedback" data-copy-status role="status" aria-live="polite"></p>
        </div>
      </header>

      <ul class="icon-catalog__grid" data-icon-grid aria-label="Iconos disponibles">
        ${cards}
      </ul>

      <section class="icon-catalog__empty" data-empty-state hidden>
        <h2>Sin coincidencias</h2>
        <p>Prueba con otro nombre en inglés o limpia la búsqueda.</p>
        <button type="button" data-clear-search>Limpiar búsqueda</button>
      </section>
    </main>

    <script>
      const root = document.documentElement;
      const searchInput = document.querySelector('[data-search-input]');
      const sizeSelect = document.querySelector('[data-size-select]');
      const strokeSelect = document.querySelector('[data-stroke-select]');
      const items = Array.from(document.querySelectorAll('[data-icon-item]'));
      const resultsStatus = document.querySelector('[data-results-status]');
      const copyStatus = document.querySelector('[data-copy-status]');
      const emptyState = document.querySelector('[data-empty-state]');
      const clearSearch = document.querySelector('[data-clear-search]');

      const formatCount = (count) =>
        new Intl.NumberFormat('es-MX').format(count) + (count === 1 ? ' icono' : ' iconos');

      const updateResults = () => {
        const query = searchInput.value.trim().toLocaleLowerCase('en');
        let visibleCount = 0;

        items.forEach((item) => {
          const matches = item.dataset.search.includes(query);
          item.hidden = !matches;
          if (matches) visibleCount += 1;
        });

        resultsStatus.textContent = formatCount(visibleCount);
        emptyState.hidden = visibleCount !== 0;
      };

      const updatePreview = () => {
        root.style.setProperty('--catalog-icon-size', 'var(' + sizeSelect.value + ')');
        root.style.setProperty('--catalog-icon-stroke', strokeSelect.value);
      };

      const fallbackCopy = (text) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.className = 'icon-catalog__copy-source';
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand('copy');
        textarea.remove();
        return copied;
      };

      const copyText = async (text) => {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          return true;
        }
        return fallbackCopy(text);
      };

      const showCopyFeedback = (message) => {
        copyStatus.textContent = message;
      };

      document.querySelector('[data-icon-grid]').addEventListener('click', async (event) => {
        const card = event.target.closest('[data-icon-name]');
        if (!card) return;

        const name = card.dataset.iconName;
        const sizeToken = sizeSelect.value;
        const strokeWidth = strokeSelect.value;
        const code =
          "import { " + name + " } from 'lucide-react';\\n\\n" +
          '<' + name + ' size="var(' + sizeToken + ')" strokeWidth={' + strokeWidth + '} aria-hidden="true" />';

        try {
          const copied = await copyText(code);
          showCopyFeedback(copied ? name + ' copiado' : 'No se pudo copiar ' + name);
        } catch {
          showCopyFeedback('No se pudo copiar ' + name);
        }
      });

      searchInput.addEventListener('input', updateResults);
      sizeSelect.addEventListener('change', updatePreview);
      strokeSelect.addEventListener('change', updatePreview);
      clearSearch.addEventListener('click', () => {
        searchInput.value = '';
        updateResults();
        searchInput.focus();
      });

      updatePreview();
    </script>
  </body>
</html>`;

await writeFile(outputPath, document, 'utf8');
console.log(`Catálogo generado: ${iconEntries.length} iconos de lucide-react ${version}`);
console.log(outputPath);
