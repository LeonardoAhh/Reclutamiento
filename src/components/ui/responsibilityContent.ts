import type { Activity } from '@/lib/types';

export function getResponsibilityContent(activity: Activity) {
  const rawDescription = activity.descripcion ?? '';
  if (!rawDescription.includes(' - ')) {
    return { area: undefined, description: rawDescription || undefined };
  }
  const [area, ...descriptionParts] = rawDescription.split(' - ');
  return { area: area || undefined, description: descriptionParts.join(' - ') || undefined };
}
