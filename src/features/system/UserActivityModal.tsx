import { Activity } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/hooks/useAuth";
import { UserActivityPanel } from "./UserActivityPanel";
import "./SystemModals.css";

interface UserActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserActivityModal({
  isOpen,
  onClose,
}: UserActivityModalProps) {
  const { profile } = useAuth();

  if (profile?.role !== "admin") return null;

  return (
    <Modal
      isOpen={isOpen}
      title="Actividad de usuarios"
      icon={<Activity aria-hidden="true" />}
      onClose={onClose}
      size="sm"
      fullscreenMobile={false}
    >
      <div className="modal-body user-activity-modal__body">
        <UserActivityPanel />
      </div>
    </Modal>
  );
}
