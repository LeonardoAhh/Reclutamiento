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

export function splitCandidateName(full: string | null | undefined): SplitName {
  const parts = String(full ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return { apellidos: '', nombres: '' };
  if (parts.length === 1) return { apellidos: parts[0], nombres: '' };
  if (parts.length === 2) return { apellidos: parts[0], nombres: parts[1] };

  return {
    apellidos: parts.slice(0, 2).join(' '),
    nombres: parts.slice(2).join(' '),
  };
}
