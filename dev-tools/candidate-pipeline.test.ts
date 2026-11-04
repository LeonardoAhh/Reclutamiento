import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Candidate } from '../src/lib/types.ts';
import {
  findCandidateSearchResults,
  matchesCandidateGroup,
} from '../src/components/pipeline/candidatePipelineUtils.ts';

function candidate(id: string, overrides: Partial<Candidate> = {}): Candidate {
  return {
    id,
    nombre: `Candidato ${id}`,
    puesto: 'Operador',
    area: 'Producción',
    status: 'entrevista',
    ...overrides,
  };
}

test('candidate groups retain active and hired status rules', () => {
  assert.equal(matchesCandidateGroup(candidate('active'), 'activos'), true);
  assert.equal(matchesCandidateGroup(candidate('hired', { status: 'contratado' }), 'activos'), false);
  assert.equal(matchesCandidateGroup(candidate('rejected', { status: 'rechazado' }), 'activos'), false);
  assert.equal(matchesCandidateGroup(candidate('no-show', { status: 'no_asistio' }), 'activos'), false);
  assert.equal(matchesCandidateGroup(candidate('hired', { status: 'contratado' }), 'contratados'), true);
  assert.equal(matchesCandidateGroup(candidate('active'), 'todos'), true);
});

test('candidate search keeps text, numeric phone, international phone and five-result behavior', () => {
  const records = [
    candidate('text', { nombre: 'Ana Operadora' }),
    candidate('phone', { telefono: '442 123 4567' }),
    candidate('intl', { telefono: '+52 442 765 4321' }),
    ...Array.from({ length: 6 }, (_, index) => candidate(`limit-${index}`, { nombre: `Operador ${index}` })),
  ];

  assert.deepEqual(findCandidateSearchResults(records, 'ana'), [records[0]]);
  assert.deepEqual(findCandidateSearchResults(records, '4421234567'), [records[1]]);
  assert.deepEqual(findCandidateSearchResults(records, '+52 442 765 4321'), [records[2]]);
  assert.equal(findCandidateSearchResults(records, 'operador').length, 5);
  assert.deepEqual(findCandidateSearchResults(records, '   '), []);
});
