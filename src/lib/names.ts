/**
 * Utilidades para separar el nombre completo capturado en un solo campo.
 *
 * En el sistema los candidatos/empleados se capturan como
 * "APELLIDOS NOMBRES" (apellidos primero). Siempre hay al menos un
 * apellido y un nombre. Como es un único campo, aplicamos una heurística:
 *
 *  - 1 token  → todo es apellido.
 *  - 2 tokens → 1 apellido + 1 nombre.
 *  - 3+ tokens→ 2 apellidos (paterno + materno) + el resto como nombres.
 *
 * Cubre los casos reales de RH (2 apellidos) y degrada con sensatez.
 */
export interface SplitName {
  apellidos: string;
  nombres: string;
}

const PARTICLES = new Set(['DE', 'LA', 'LAS', 'LOS', 'DEL', 'Y', 'SAN', 'SANTA', 'MAC', 'MC', 'VON', 'VAN']);

/**
 * Agrupa partículas (DE, LA, DEL) con la palabra siguiente para no romper apellidos compuestos.
 * Ejemplo: ["DE", "LA", "CRUZ", "PEREZ", "JUAN"] -> ["DE LA CRUZ", "PEREZ", "JUAN"]
 */
export function parseNameWords(full: string): string[] {
  const parts = String(full ?? '').trim().split(/\s+/).filter(Boolean);
  const words: string[] = [];
  let buffer: string[] = [];

  for (const part of parts) {
    const upper = part.toUpperCase();
    if (PARTICLES.has(upper)) {
      buffer.push(part);
    } else {
      buffer.push(part);
      words.push(buffer.join(' '));
      buffer = [];
    }
  }
  
  if (buffer.length > 0) {
    words.push(buffer.join(' '));
  }
  
  return words;
}

export function splitCandidateName(full: string | null | undefined): SplitName {
  const words = parseNameWords(full || '');

  if (words.length === 0) return { apellidos: '', nombres: '' };
  if (words.length === 1) return { apellidos: words[0], nombres: '' };
  if (words.length === 2) return { apellidos: words[0], nombres: words[1] };

  return {
    apellidos: words.slice(0, 2).join(' '),
    nombres: words.slice(2).join(' '),
  };
}

/**
 * Retorna "ApellidoPaterno PrimerNombre".
 * Maneja apellidos compuestos (DE LA CRUZ) y nombres compuestos comunes (MA DEL CARMEN).
 */
export function getShortName(full: string | null | undefined): string {
  const words = parseNameWords(full || '');
  
  if (words.length === 0) return '';
  if (words.length === 1) return words[0];
  if (words.length === 2) return `${words[0]} ${words[1]}`;
  
  // 3+ palabras: words[0] = Paterno, words[1] = Materno, words[2] = Nombre
  let nombre = words[2];
  
  // Si el primer nombre es muy corto o es un prefijo común compuesto (MA, J, MARIA, JOSE),
  // tomamos también el segundo nombre si existe para que no quede solo "PEREZ MA"
  const upper = nombre.toUpperCase().replace('.', '');
  if (['MA', 'J', 'MARIA', 'JOSE'].includes(upper) && words.length > 3) {
    nombre = `${nombre} ${words[3]}`;
  }
  
  return `${words[0]} ${nombre}`;
}
