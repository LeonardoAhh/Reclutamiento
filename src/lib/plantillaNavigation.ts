export const PLANTILLA_PATH = '/plantilla';
export const EMPLEADOS_PATH = '/empleados';

export type PlantillaView = 'general' | 'empleados';

export function getPlantillaView(pathname: string): PlantillaView {
  return pathname === EMPLEADOS_PATH ? 'empleados' : 'general';
}

export function isPlantillaPath(pathname: string): boolean {
  return pathname === EMPLEADOS_PATH ||
    pathname === PLANTILLA_PATH;
}

export function getPlantillaHref(view: PlantillaView): string {
  return view === 'empleados' ? EMPLEADOS_PATH : PLANTILLA_PATH;
}
