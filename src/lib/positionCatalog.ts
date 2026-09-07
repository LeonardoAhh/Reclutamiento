import type { AuthorizedPosition } from './types';
import { normalizePuesto, normalizeString } from './utils';

const STARLITE_SECTION_SUFFIX = /\s*\(STARLITE\)$/;

function getBaseSection(section: string) {
  return normalizeString(section).replace(STARLITE_SECTION_SUFFIX, '');
}

function getPositionKey(position: Pick<AuthorizedPosition, 'area' | 'seccion' | 'puesto'>) {
  return [
    normalizeString(position.area),
    getBaseSection(position.seccion),
    normalizePuesto(position.puesto),
  ].join('::');
}

export function isStarliteSection(section: string) {
  return STARLITE_SECTION_SUFFIX.test(normalizeString(section));
}

export function hasStarliteCompanion(
  positions: readonly AuthorizedPosition[],
  target: AuthorizedPosition,
) {
  const targetIsStarlite = isStarliteSection(target.seccion);
  const targetKey = getPositionKey(target);

  return positions.some(
    (candidate) =>
      isStarliteSection(candidate.seccion) !== targetIsStarlite &&
      getPositionKey(candidate) === targetKey,
  );
}

/**
 * Une una sección histórica `(STARLITE)` con su puesto base para los cálculos.
 * El catálogo editable se conserva intacto; únicamente la vista operativa usa
 * una fila canónica y evita contar dos veces a las mismas personas.
 */
export function consolidateStarlitePositions(
  positions: readonly AuthorizedPosition[],
): AuthorizedPosition[] {
  const baseKeys = new Set(
    positions
      .filter((position) => !isStarliteSection(position.seccion))
      .map(getPositionKey),
  );
  const starliteByBaseKey = new Map(
    positions
      .filter((position) => isStarliteSection(position.seccion))
      .map((position) => [getPositionKey(position), position]),
  );

  return positions.flatMap((position) => {
    const key = getPositionKey(position);

    if (isStarliteSection(position.seccion)) {
      return baseKeys.has(key) ? [] : [position];
    }

    const starlite = starliteByBaseKey.get(key);
    if (!starlite) return [position];

    const starliteAutorizada = Math.max(0, starlite.plantilla_autorizada);
    const starliteBackup = Math.max(0, starlite.backup ?? 0);

    return [{
      ...position,
      urgentes: starliteAutorizada + starliteBackup,
      starlite_autorizada: starliteAutorizada,
      starlite_backup: starliteBackup,
    }];
  });
}
