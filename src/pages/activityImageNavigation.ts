import { ACTIVIDADES_PATH } from "@/components/layout/navigation";
import type { ActivityStatus } from "@/lib/types";

export type ActivityImageTab = "responsibilities" | "activities";
export type ActivityImageStatus = ActivityStatus | "todas";

export const ACTIVITY_IMAGE_ROUTE = `${ACTIVIDADES_PATH}/image/:activityId`;

export function getActivityImagePath(
  activityId: string,
  tab: ActivityImageTab,
  proofId?: string,
  status?: ActivityImageStatus,
) {
  const search = new URLSearchParams({ tab });
  if (proofId) search.set("proof", proofId);
  if (status) search.set("status", status);
  return `${ACTIVIDADES_PATH}/image/${encodeURIComponent(activityId)}?${search}`;
}

export function getActivityReturnPath(tab: ActivityImageTab, status: string | null) {
  const search = new URLSearchParams({ tab });
  if (status && ["todas", "pendiente", "en_proceso", "completada"].includes(status)) {
    search.set("status", status);
  }
  return `${ACTIVIDADES_PATH}?${search}`;
}
