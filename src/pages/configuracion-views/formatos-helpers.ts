import { mapClaveHorarioToTurno } from '@/lib/transporte-routes';

/** Los turnos mixtos y el turno 5 no utilizan transporte de personal. */
export function isRouteAssignmentEligibleShift(
  value: string | null | undefined,
): boolean {
  const shift = mapClaveHorarioToTurno(value).toLocaleLowerCase('es');
  return shift !== '5' && shift !== 'mixto';
}
