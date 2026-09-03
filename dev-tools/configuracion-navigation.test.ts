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
    { title: 'Principal', ids: ['analisis', 'formatos', 'rutas', 'speech'] },
    { title: 'Administración', ids: ['indicadores', 'tabulador'] },
  ]);
});

test('canonical Configuración paths resolve to their section', () => {
  assert.equal(getConfiguracionTab('/configuracion'), 'analisis');
  assert.equal(getConfiguracionTab('/configuracion/unknown'), 'analisis');
  for (const { id } of FEATURES) {
    const url = new URL(getConfiguracionHref(id), 'https://example.test');
    assert.equal(getConfiguracionTab(url.pathname), id);
  }
  assert.deepEqual(
    ['/analisis', '/formatos', '/configuracion/rutas', '/speech']
      .map((path) => getConfiguracionTab(path)),
    ['analisis', 'formatos', 'rutas', 'speech']);
});

test('each section link has one canonical path', () => {
  assert.equal(getConfiguracionHref('analisis'), '/analisis');
  assert.equal(getConfiguracionHref('rutas'), '/configuracion/rutas');
  assert.equal(getConfiguracionHref('indicadores'), '/configuracion/indicadores');
  assert.equal(getConfiguracionHref('formatos'), '/formatos');
  assert.equal(getConfiguracionHref('speech'), '/speech');
});
