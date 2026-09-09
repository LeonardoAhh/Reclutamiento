import { useEffect, useId, useState } from "react";
import { NotebookPen } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { DAILY_WORK_DESCRIPTION_MAX_LENGTH } from "./constants";
import { DailyWorkFileField } from "./DailyWorkFileField";
import type {
  DailyWorkActivity,
  DailyWorkActivityDraft,
} from "./types";

interface DailyWorkActivityModalProps {
  isOpen: boolean;
  isSaving: boolean;
  initialDate: string;
  activity: DailyWorkActivity | null;
  onClose: () => void;
  onSubmit: (draft: DailyWorkActivityDraft) => Promise<boolean>;
}

interface FormErrors {
  workDate?: string;
  description?: string;
  time?: string;
  files?: string;
}

export function DailyWorkActivityModal({
  isOpen,
  isSaving,
  initialDate,
  activity,
  onClose,
  onSubmit,
}: DailyWorkActivityModalProps) {
  const idPrefix = useId();
  const [workDate, setWorkDate] = useState(initialDate);
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});

  const descriptionId = `${idPrefix}-description`;
  const dateErrorId = `${idPrefix}-date-error`;
  const descriptionErrorId = `${idPrefix}-description-error`;
  const timeHelpId = `${idPrefix}-time-help`;
  const timeErrorId = `${idPrefix}-time-error`;

  useEffect(() => {
    if (!isOpen) return;
    setWorkDate(activity?.workDate ?? initialDate);
    setDescription(activity?.description ?? "");
    setStartTime(activity?.startTime?.slice(0, 5) ?? "");
    setEndTime(activity?.endTime?.slice(0, 5) ?? "");
    setFiles([]);
    setErrors({});
  }, [activity, initialDate, isOpen]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedDescription = description.trim();
    const nextErrors: FormErrors = {};

    if (!workDate) {
      nextErrors.workDate = "Selecciona la fecha de la actividad.";
    }

    if (!normalizedDescription) {
      nextErrors.description = "Describe la actividad realizada.";
    }

    const hasStartTime = Boolean(startTime);
    const hasEndTime = Boolean(endTime);
    if (hasStartTime !== hasEndTime) {
      nextErrors.time = "Captura tanto la hora de inicio como la de fin.";
    } else if (hasStartTime && endTime <= startTime) {
      nextErrors.time = "La hora de fin debe ser posterior a la de inicio.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const saved = await onSubmit({
      id: activity?.id,
      workDate,
      description: normalizedDescription,
      startTime: startTime || null,
      endTime: endTime || null,
      files,
    });
    if (saved) onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={activity ? "Editar actividad diaria" : "Registrar actividad diaria"}
      icon={<NotebookPen size="var(--icon-size-md)" aria-hidden="true" />}
      size="sm"
      footerActions={
        <>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary"
            form={`${idPrefix}-form`}
            disabled={isSaving || !description.trim()}
            aria-busy={isSaving}
          >
            {isSaving ? "Guardando..." : activity ? "Guardar" : "Registrar"}
          </button>
        </>
      }
    >
      <form
        id={`${idPrefix}-form`}
        className="modal-body daily-work-form"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="form-group">
          <label htmlFor={`${idPrefix}-date`}>Fecha</label>
          <input
            id={`${idPrefix}-date`}
            type="date"
            value={workDate}
            onChange={(event) => setWorkDate(event.target.value)}
            required
            aria-invalid={Boolean(errors.workDate)}
            aria-describedby={errors.workDate ? dateErrorId : undefined}
          />
          {errors.workDate && (
            <p id={dateErrorId} className="daily-work-form__error" role="alert">
              {errors.workDate}
            </p>
          )}
        </div>

        <fieldset
          className="daily-work-form__fieldset"
          aria-describedby={`${timeHelpId}${errors.time ? ` ${timeErrorId}` : ""}`}
        >
          <legend>Horario específico</legend>
          <p id={timeHelpId} className="daily-work-form__help">
            Debes capturar tanto la hora de inicio como la de fin.
          </p>
          <div className="daily-work-form__time-grid">
            <div className="form-group">
              <label htmlFor={`${idPrefix}-start-time`}>Inicio</label>
              <input
                id={`${idPrefix}-start-time`}
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                aria-invalid={Boolean(errors.time)}
              />
            </div>
            <div className="form-group">
              <label htmlFor={`${idPrefix}-end-time`}>Fin</label>
              <input
                id={`${idPrefix}-end-time`}
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                aria-invalid={Boolean(errors.time)}
              />
            </div>
          </div>
          {errors.time && (
            <p id={timeErrorId} className="daily-work-form__error" role="alert">
              {errors.time}
            </p>
          )}
        </fieldset>

        <div className="form-group">
          <label htmlFor={descriptionId}>Actividad realizada</label>
          <textarea
            id={descriptionId}
            className="daily-work-form__description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={DAILY_WORK_DESCRIPTION_MAX_LENGTH}
            rows={5}
            required
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? descriptionErrorId : undefined}
          />
          <span className="daily-work-form__counter">
            {description.length} / {DAILY_WORK_DESCRIPTION_MAX_LENGTH}
          </span>
          {errors.description && (
            <p
              id={descriptionErrorId}
              className="daily-work-form__error"
              role="alert"
            >
              {errors.description}
            </p>
          )}
        </div>

        <DailyWorkFileField
          idPrefix={idPrefix}
          existingAttachments={activity?.attachments ?? []}
          files={files}
          error={errors.files}
          isDisabled={isSaving}
          onFilesChange={setFiles}
          onErrorChange={(fileError) =>
            setErrors((current) => ({ ...current, files: fileError }))
          }
        />
      </form>
    </Modal>
  );
}
