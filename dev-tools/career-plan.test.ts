import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CAREER_ROLES, emptyCareerPlan, findCareerRole, isCareerPlan } from '../src/features/career/types';
import { careerStorageKey, readCareerPlan, writeCareerPlan } from '../src/features/career/storage';

function memoryStorage() {
  const entries = new Map<string, string>();
  return { getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => { entries.set(key, value); } };
}
test('metas: guardar, retomar ambas direcciones y separar cuentas', () => {
  const storage = memoryStorage();
  const plan = emptyCareerPlan(CAREER_ROLES[0].title);
  plan.internal = { target: CAREER_ROLES[2].title, nextStep: 'Preparar un plan de aprendizaje.' };
  plan.external = { target: 'Crear un proyecto propio', nextStep: 'Definir el primer servicio.' };
  assert.deepEqual(readCareerPlan('one', storage), { ok: true, plan: null, revision: null });
  assert.equal(writeCareerPlan('one', plan, null, storage).ok, true);
  const saved = readCareerPlan('one', storage);
  assert.equal(saved.ok, true);

  assert.deepEqual(saved.plan, plan);
  assert.deepEqual(readCareerPlan('two', storage), { ok: true, plan: null, revision: null });
  const next = { ...plan, external: { ...plan.external, nextStep: 'Escribir una propuesta.' } };
  assert.equal(writeCareerPlan('one', next, saved.revision, storage).ok, true);
  const result = readCareerPlan('one', storage);
  assert.equal(result.ok && result.plan?.external.nextStep, 'Escribir una propuesta.');
});
test('metas: formato inválido y almacenamiento bloqueado conservan los datos', () => {
  const storage = memoryStorage();
  const key = careerStorageKey('one');
  storage.setItem(key, '{');
  assert.equal(readCareerPlan('one', storage).ok, false);
  assert.equal(storage.getItem(key), '{');
  storage.setItem(key, JSON.stringify({ version: 2 }));
  assert.equal(readCareerPlan('one', storage).ok, false);
  assert.equal(isCareerPlan(null), false);
  assert.equal(isCareerPlan({ ...emptyCareerPlan(), external: { target: {}, nextStep: '' } }), false);
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.equal(readCareerPlan('one', blocked).ok, false);
  const plan = emptyCareerPlan('Puesto actual');
  plan.external.target = 'Proyecto personal';
  assert.equal(writeCareerPlan('one', plan, null, blocked).ok, false);
  const full = { getItem: () => null, setItem() { throw new Error('quota'); } };
  assert.equal(writeCareerPlan('one', plan, null, full).ok, false);
});
test('metas: no pisar cambios de otra pestaña y validar antes de escribir', () => {
  const storage = memoryStorage();
  const plan = emptyCareerPlan('Puesto actual');
  assert.equal(writeCareerPlan('one', plan, null, storage).ok, false);
  plan.external.target = 'Proyecto personal';
  assert.equal(writeCareerPlan('one', plan, null, storage).ok, true);
  plan.external.target = 'Otra meta';
  assert.equal(writeCareerPlan('one', plan, null, storage).ok, false);
  assert.equal(writeCareerPlan('', plan, null, storage).ok, false);
  assert.equal(readCareerPlan('', storage).ok, false);
  assert.equal(isCareerPlan({ ...plan, internal: { target: 'Puesto inventado', nextStep: '' } }), false);
  assert.equal(isCareerPlan({ ...plan, currentPosition: 'x'.repeat(201) }), false);
  assert.equal(isCareerPlan({ ...plan, external: { target: 'Meta', nextStep: 'x'.repeat(1001) } }), false);
});
test('ruta: coincidencia explícita del puesto; el rol de acceso no infiere un nivel', () => {
  assert.equal(findCareerRole('ADMIN'), undefined);
  assert.equal(findCareerRole('Analista de Reclutamiento'), undefined);
  assert.equal(findCareerRole('  analista de reclutamiento y selección b  ')?.id, 'analyst-b');
  assert.equal(findCareerRole(CAREER_ROLES[4].title)?.id, 'manager');
});

test('guardar desde el organigrama conserva la meta externa y permite un puesto no configurado', () => {
  const storage = memoryStorage();
  const plan = emptyCareerPlan();
  plan.internal.target = CAREER_ROLES[2].title;
  plan.external = { target: 'Proyecto personal', nextStep: 'Definir el servicio.' };
  const first = writeCareerPlan('one', plan, null, storage);
  assert.equal(first.ok, true);
  if (!first.ok) return;
  const next = { ...plan, internal: { ...plan.internal, target: CAREER_ROLES[4].title } };
  assert.equal(writeCareerPlan('one', next, first.revision, storage).ok, true);
  const result = readCareerPlan('one', storage);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.plan?.currentPosition, '');
  assert.equal(result.plan?.internal.target, CAREER_ROLES[4].title);
  assert.deepEqual(result.plan?.external, plan.external);
});

test('recorrido: solo una confirmación explícita marca la cuenta como completada', async () => {
  const { hasCompletedCareerJourney } = await import('../src/features/career/completion');
  for (const metadata of [undefined, null, {}, true, { career_journey_completed: false },
    { career_journey_completed: 'true' }]) {
    assert.equal(hasCompletedCareerJourney(metadata), false);
  }
  assert.equal(hasCompletedCareerJourney({ career_journey_completed: true }), true);
});

test('recorrido: guardar en la cuenta permite reconocerlo con una nueva sesión', async () => {
  const { completeCareerJourney, hasCompletedCareerJourney } = await import('../src/features/career/completion');
  const user = { id: 'one', aud: 'authenticated', app_metadata: {}, created_at: '',
    user_metadata: { display_name: 'Nombre de prueba' } };
  const result = await completeCareerJourney({
    async updateUser(attributes) {
      assert.deepEqual(attributes, { data: { career_journey_completed: true } });
      return { data: { user: { ...user, user_metadata: { ...user.user_metadata, ...attributes.data } } }, error: null };
    },
  }, 'one');
  assert.deepEqual(result, { ok: true });
  const freshSessionMetadata: unknown = JSON.parse('{"display_name":"Nombre de prueba","career_journey_completed":true}');
  assert.equal(hasCompletedCareerJourney(freshSessionMetadata), true);
  assert.equal(hasCompletedCareerJourney({ display_name: 'Otra cuenta' }), false);
});

test('recorrido: un fallo permite reintentar sin marcar éxito', async () => {
  const { completeCareerJourney } = await import('../src/features/career/completion');
  const { AuthError } = await import('@supabase/supabase-js');
  const failed = await completeCareerJourney({
    async updateUser() { return { data: { user: null }, error: new AuthError('unavailable', 503) }; },
  }, 'one');
  assert.equal(failed.ok, false);
  const disconnected = await completeCareerJourney({
    async updateUser() { throw new Error('offline'); },
  }, 'one');
  assert.equal(disconnected.ok, false);
  const expired = await completeCareerJourney({
    async updateUser() { return { data: { user: null }, error: new AuthError('expired', 401) }; },
  }, 'one');
  assert.equal(expired.ok, false);
  if (!expired.ok) assert.match(expired.message, /iniciar sesión/);
});

test('recorrido: no aceptar una respuesta incompleta o de otra cuenta', async () => {
  const { completeCareerJourney } = await import('../src/features/career/completion');
  const user = { id: 'one', aud: 'authenticated', app_metadata: {}, created_at: '', user_metadata: {} };
  for (const responseUser of [user, { ...user, id: 'two', user_metadata: { career_journey_completed: true } }]) {
    const result = await completeCareerJourney({
      async updateUser() { return { data: { user: responseUser }, error: null }; },
    }, 'one');
    assert.equal(result.ok, false);
  }
});
