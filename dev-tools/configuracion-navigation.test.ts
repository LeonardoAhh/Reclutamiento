import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  FEATURES,
  FEATURE_GROUPS,
  getConfiguracionHref,
  getConfiguracionTab,
} from '../src/lib/configuracionNavigation.ts';

test('Configuración preserves all six sections and their groups', () => {
  assert.deepEqual(FEATURE_GROUPS.map(({ title, items }) => ({
    title,
    ids: items.map(({ id }) => id),
  })), [
    { title: 'Principal', ids: ['busqueda', 'formatos', 'rutas', 'speech'] },
    { title: 'Administración', ids: ['indicadores', 'tabulador'] },
  ]);
});

test('default, unknown and existing URLs resolve without changing the tab contract', () => {
  assert.equal(getConfiguracionTab(''), 'busqueda');
  assert.equal(getConfiguracionTab('?tab=unknown'), 'busqueda');
  assert.equal(getConfiguracionTab('?tab='), 'busqueda');
  for (const { id } of FEATURES) {
    const url = new URL(getConfiguracionHref(id), 'https://example.test');
    assert.equal(url.pathname, '/configuracion');
    assert.equal(getConfiguracionTab(url.search), id);
  }
  assert.deepEqual(['', '?tab=formatos', '?tab=rutas', '?tab=formatos'].map(getConfiguracionTab),
    ['busqueda', 'formatos', 'rutas', 'formatos']);
});

test('section links preserve other query parameters and replace duplicate tabs', () => {
  assert.equal(getConfiguracionHref('busqueda'), '/configuracion?tab=busqueda');
  assert.equal(getConfiguracionHref('rutas', '?filter=test&tab=formatos'),
    '/configuracion?filter=test&tab=rutas');
  assert.equal(getConfiguracionHref('indicadores', '?tab=rutas&tab=speech&filter=test'),
    '/configuracion?tab=indicadores&filter=test');
});
