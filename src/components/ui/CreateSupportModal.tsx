import {
  CreateAssignmentModal,
  type CreateActivityModalProps,
} from "@/components/ui/CreateActivityModal";

export function CreateSupportModal(props: CreateActivityModalProps) {
  return <CreateAssignmentModal {...props} activityType="soporte" />;
}
