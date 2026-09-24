import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeEmpleadoRuta } from '../src/lib/rutas-data.ts';

test('normalizes the current rutas JSON headers', () => {
  assert.deepEqual(
    normalizeEmpleadoRuta({
      numero_empleado: '4',
      nombre: 'PACHECO ALCAYA MARIA GABRIELA',
      sección: ' A. CALIDAD 1ER TURNO ',
      turno: '1',
      'nombre ruta': 'R3- SAN JOSE ITURBIDE 2',
      parada: 'LA LUZ',
      colonia: 'PARADA EN LA IGLESIA',
    }),
    {
      numeroEmpleado: '4',
      nombre: 'PACHECO ALCAYA MARIA GABRIELA',
      turno: '1',
      nombreRuta: 'R3- SAN JOSE ITURBIDE 2',
      colonia: 'PARADA EN LA IGLESIA',
      parada: 'LA LUZ',
      seccion: 'A. CALIDAD 1ER TURNO',
    },
  );
});

test('keeps compatible aliases and rejects rows without a route', () => {
  assert.equal(normalizeEmpleadoRuta({ numero_empleado: '4' }), null);
  assert.equal(
    normalizeEmpleadoRuta({
      num_empleado: 54,
      nombreRuta: 'R6- AV. DE LA LUZ',
      Seccion: 'PRODUCCIÓN ADMTVO',
    })?.numeroEmpleado,
    '54',
  );
});
