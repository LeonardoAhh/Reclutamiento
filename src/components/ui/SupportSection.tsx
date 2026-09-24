import type { Activity } from "@/lib/types";
import {
  ResponsibilitiesSection,
  type AssignmentSectionCopy,
  type ResponsibilitiesSectionProps,
} from "@/components/ui/ResponsibilitiesSection";

const SUPPORT_COPY: AssignmentSectionCopy = {
  headingId: "support-heading",
  panelId: "support-panel",
  title: "Soporte",
  singular: "solicitud de soporte",
  plural: "solicitudes de soporte",
  description: "Actividades de soporte temporales.",
  emptyTitle: "Sin actividades de soporte",
  adminEmptyDescription: 'Crea una actividad tipo "Soporte" para asignarla.',
  assigneeEmptyDescription: "Aún no tienes actividades de soporte asignadas.",
  listLabel: "Solicitudes de soporte",
  paginationLabel: "Paginación de solicitudes de soporte",
};

interface SupportSectionProps
  extends Omit<ResponsibilitiesSectionProps, "responsibilities" | "copy"> {
  supportItems: Activity[];
}

export function SupportSection({
  supportItems,
  ...props
}: SupportSectionProps) {
  return (
    <ResponsibilitiesSection
      {...props}
      responsibilities={supportItems}
      copy={SUPPORT_COPY}
    />
  );
}
