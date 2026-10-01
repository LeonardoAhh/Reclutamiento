import { isCareerPlan, validateCareerPlan } from './types';
import type { CareerPlan } from './types';

export type CareerStorage = Pick<Storage, 'getItem' | 'setItem'>;
export type PlanRead = { ok: true; plan: CareerPlan | null; revision: string | null }
  | { ok: false; message: string };
export type PlanWrite = { ok: true; revision: string }
  | { ok: false; message: string };
export function careerStorageKey(userId: string) { return `reclutamiento:career-plan:v1:${userId}`; }

export function readCareerPlan(userId: string, storage: CareerStorage): PlanRead {
  try {
    if (!userId) return { ok: false, message: 'Inicia sesión para consultar tus metas.' };
    const raw = storage.getItem(careerStorageKey(userId));
    if (raw === null) return { ok: true, plan: null, revision: null };
    const parsed: unknown = JSON.parse(raw);
    if (!isCareerPlan(parsed)) return { ok: false, message: 'Las metas guardadas no tienen un formato válido. Se conservaron los datos originales.' };
    return { ok: true, plan: parsed, revision: raw };
  } catch {
    return { ok: false, message: 'No se pudieron leer tus metas. Comprueba que el navegador permite almacenamiento local y vuelve a intentar.' };
  }
}
export function writeCareerPlan(userId: string, plan: CareerPlan, revision: string | null,
  storage: CareerStorage): PlanWrite {
  const validation = validateCareerPlan(plan);
  if (validation) return { ok: false, message: validation };
  try {
    if (!userId) return { ok: false, message: 'Inicia sesión para guardar tus metas.' };
    if (storage.getItem(careerStorageKey(userId)) !== revision) {
      return { ok: false, message: 'Tus metas cambiaron en otra pestaña. Vuelve a cargar las metas guardadas antes de guardar.' };
    }
    const nextRevision = JSON.stringify(plan);
    storage.setItem(careerStorageKey(userId), nextRevision);
    return { ok: true, revision: nextRevision };
  } catch {
    return { ok: false, message: 'No se pudieron guardar tus metas. Comprueba el espacio disponible y el permiso de almacenamiento del navegador; tu texto sigue aquí.' };
  }
}
