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

test('canonical Configuración paths resolve to their section', () => {
  assert.equal(getConfiguracionTab('/configuracion'), 'busqueda');
  assert.equal(getConfiguracionTab('/configuracion/unknown'), 'busqueda');
  for (const { id } of FEATURES) {
    const url = new URL(getConfiguracionHref(id), 'https://example.test');
    assert.equal(url.pathname, `/configuracion/${id}`);
    assert.equal(getConfiguracionTab(url.pathname, url.search), id);
  }
  assert.deepEqual(
    ['busqueda', 'formatos', 'rutas', 'formatos']
      .map((tab) => getConfiguracionTab(`/configuracion/${tab}`)),
    ['busqueda', 'formatos', 'rutas', 'formatos']);
});

test('each section link has one canonical path', () => {
  assert.equal(getConfiguracionHref('busqueda'), '/configuracion/busqueda');
  assert.equal(getConfiguracionHref('rutas'), '/configuracion/rutas');
  assert.equal(getConfiguracionHref('indicadores'), '/configuracion/indicadores');
});
