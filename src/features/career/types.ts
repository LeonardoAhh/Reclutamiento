/** Ruta proporcionada por el usuario; no representa otras áreas de la empresa. */
export const CAREER_PATH = '/career-path';
/** Recorrido y diálogo pendientes de publicación; conservar su implementación. */
export const CAREER_JOURNEY_ENABLED = false;
export const CAREER_ROLES = [
  { id: 'analyst-b', title: 'Analista de Reclutamiento y Selección B' },
  { id: 'analyst-a', title: 'Analista de Reclutamiento y Selección A' },
  { id: 'coordinator', title: 'Coordinador de Reclutamiento y Selección' },
  { id: 'head', title: 'Jefe de Recursos Humanos' },
  { id: 'manager', title: 'Gerente de Recursos Humanos' },
] as const;

export type CareerRoleId = (typeof CAREER_ROLES)[number]['id'];
export interface CareerGoal { target: string; nextStep: string }
export interface CareerPlan {
  version: 1;
  currentPosition: string;
  internal: CareerGoal;
  external: CareerGoal;
}
export const CAREER_LIMITS = { position: 200, nextStep: 1000 } as const;

export function emptyCareerPlan(currentPosition = ''): CareerPlan {
  return { version: 1, currentPosition, internal: { target: '', nextStep: '' },
    external: { target: '', nextStep: '' } };
}

export function findCareerRole(position: string) {
  const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-MX');
  return CAREER_ROLES.find(role => normalize(role.title) === normalize(position));
}

function isText(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.length <= maxLength;
}
function isGoal(value: unknown): value is CareerGoal {
  return !!value && typeof value === 'object' && 'target' in value && 'nextStep' in value
    && isText(value.target, CAREER_LIMITS.position) && isText(value.nextStep, CAREER_LIMITS.nextStep);
}
export function isCareerPlan(value: unknown): value is CareerPlan {
  if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 1
    || !('currentPosition' in value) || !isText(value.currentPosition, CAREER_LIMITS.position)
    || !('internal' in value) || !isGoal(value.internal)
    || !('external' in value) || !isGoal(value.external)) return false;
  const target = value.internal.target;
  return target === '' || CAREER_ROLES.some(role => role.title === target);
}
export function validateCareerPlan(plan: CareerPlan): string | null {
  if (!isCareerPlan(plan)) return 'Revisa los campos: el puesto admite hasta 200 caracteres y el siguiente paso hasta 1000.';
  if (!plan.internal.target.trim() && !plan.external.target.trim()) return 'Elige al menos una meta dentro o fuera de la empresa.';
  if ((!plan.internal.target && plan.internal.nextStep.trim())
    || (!plan.external.target.trim() && plan.external.nextStep.trim())) return 'Indica una meta para el siguiente paso que escribiste.';
  return null;
}
