export const PLANTILLA_PATH = '/plantilla';
export const EMPLEADOS_PATH = '/empleados';

export function isPlantillaPath(pathname: string): boolean {
  return pathname === PLANTILLA_PATH;
}
