import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  FEATURES,
  FEATURE_GROUPS,
  getConfiguracionHref,
  getConfiguracionTab,
} from '../src/lib/configuracionNavigation.ts';

test('Administración preserves all six sections and their groups', () => {
  assert.deepEqual(FEATURE_GROUPS.map(({ title, items }) => ({
    title,
    ids: items.map(({ id }) => id),
  })), [
    { title: 'Principal', ids: ['analisis', 'formatos', 'rutas', 'speech'] },
    { title: 'Administración', ids: ['indicadores', 'tabulador'] },
  ]);
});

test('canonical administration paths resolve to their section', () => {
  for (const { id } of FEATURES) {
    const url = new URL(getConfiguracionHref(id), 'https://example.test');
    assert.equal(getConfiguracionTab(url.pathname), id);
  }
  assert.deepEqual(
    ['/analisis', '/formatos', '/rutas', '/speech']
      .map((path) => getConfiguracionTab(path)),
    ['analisis', 'formatos', 'rutas', 'speech']);
});

test('each section link has one canonical path', () => {
  assert.equal(getConfiguracionHref('analisis'), '/analisis');
  assert.equal(getConfiguracionHref('rutas'), '/rutas');
  assert.equal(getConfiguracionHref('indicadores'), '/indicadores');
  assert.equal(getConfiguracionHref('tabulador'), '/tabulador');
  assert.equal(getConfiguracionHref('formatos'), '/formatos');
  assert.equal(getConfiguracionHref('speech'), '/speech');
});
