import {
  CreateAssignmentModal,
  type CreateActivityModalProps,
} from "@/components/ui/CreateActivityModal";

export function CreateResponsibilityModal(props: CreateActivityModalProps) {
  return <CreateAssignmentModal {...props} activityType="rutinaria" />;
}
