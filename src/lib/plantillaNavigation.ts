export const PLANTILLA_PATH = '/plantilla';

export type PlantillaView = 'general' | 'empleados';

export function getPlantillaView(search: string): PlantillaView {
  return new URLSearchParams(search).get('view') === 'empleados' ? 'empleados' : 'general';
}

export function getPlantillaHref(view: PlantillaView, search = ''): string {
  const params = new URLSearchParams(search);
  if (view === 'empleados') params.set('view', view);
  else params.delete('view');
  const query = params.toString();
  return `${PLANTILLA_PATH}${query ? `?${query}` : ''}`;
}
