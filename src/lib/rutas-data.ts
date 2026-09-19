import { mapClaveHorarioToTurno } from './transporte-routes';

export interface EmpleadoRuta {
  numeroEmpleado: string;
  nombre: string;
  turno: string;
  nombreRuta: string;
  colonia: string;
  parada: string;
  seccion?: string;
}

function normalizeRouteFieldKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .replace(/[\s_-]+/g, ' ')
    .trim();
}

function getRouteField(
  fields: ReadonlyMap<string, unknown>,
  aliases: readonly string[],
): string {
  for (const alias of aliases) {
    const value = fields.get(normalizeRouteFieldKey(alias));
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }
  }
  return '';
}

/** Normaliza las variantes de encabezados aceptadas por los JSON de rutas. */
export function normalizeEmpleadoRuta(value: unknown): EmpleadoRuta | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const fields = new Map(
    Object.entries(value).map(([key, fieldValue]) => [
      normalizeRouteFieldKey(key),
      fieldValue,
    ]),
  );
  const nombreRuta = getRouteField(fields, ['nombre ruta', 'ruta']);
  if (!nombreRuta.trim()) return null;

  const seccion = getRouteField(fields, ['seccion']).trim();
  return {
    numeroEmpleado: getRouteField(fields, [
      'numero empleado',
      'num empleado',
    ]),
    nombre: getRouteField(fields, ['nombre']),
    turno: mapClaveHorarioToTurno(getRouteField(fields, ['turno'])),
    nombreRuta,
    colonia: getRouteField(fields, ['colonia']),
    parada: getRouteField(fields, ['parada']),
    seccion: seccion || undefined,
  };
}
