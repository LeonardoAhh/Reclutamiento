import { UserRoundPlus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Modal } from "./Modal";
import { CustomSelect } from "./CustomSelect";

interface AssignVacancyModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAssigning: boolean;
  vacancyId: string | undefined;
  currentAssignee: string;
  options: { value: string; label: string }[];
  onAssign: (vacancyId: string, assigneeId: string) => void;
}

export function AssignVacancyModal({
  isOpen,
  onClose,
  isAssigning,
  vacancyId,
  currentAssignee,
  options,
  onAssign,
}: AssignVacancyModalProps) {
  const { language } = useLanguage();
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={language === "en" ? "Assign recruiter" : "Asignar reclutador"}
      icon={<UserRoundPlus size="var(--icon-size-md)" aria-hidden="true" />}
      size="xs"
    >
      <div className="modal-body assign-vacancy-modal__body">
        <div className="form-group">
          <label htmlFor="assign-vacancy-recruiter">
            {language === "en" ? "Select the person responsible" : "Selecciona al responsable"}
          </label>
          <CustomSelect
            id="assign-vacancy-recruiter"
            className="text-input"
            value={currentAssignee}
            disabled={isAssigning}
            onChange={(value) => {
              if (vacancyId) onAssign(vacancyId, value);
            }}
            options={options}
          />
        </div>
      </div>
    </Modal>
  );
}
