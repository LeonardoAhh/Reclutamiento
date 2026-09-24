import { ClipboardPenLine, X, ImagePlus } from "lucide-react";
import { Modal } from "./Modal";
import { CustomSelect } from "./CustomSelect";
import { SmartTextarea } from "./SmartTextarea";
import { AttachmentCard } from "./AttachmentCard";
import type { AssignableActivityType } from "@/lib/types";

const CREATE_MODAL_CONTENT: Record<
  AssignableActivityType,
  { title: string; formId: string; fieldIdPrefix: string }
> = {
  unica: {
    title: "Actividad nueva",
    formId: "create-activity-form",
    fieldIdPrefix: "activity",
  },
  rutinaria: {
    title: "Nueva responsabilidad",
    formId: "create-responsibility-form",
    fieldIdPrefix: "responsibility",
  },
  soporte: {
    title: "Nuevo soporte",
    formId: "create-support-form",
    fieldIdPrefix: "support",
  },
};

export interface CreateActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  isCreating: boolean;

  titulo: string;
  setTitulo: (val: string) => void;

  asignadoA: string;
  setAsignadoA: (val: string) => void;
  recruitersOptions: { value: string; label: string }[];

  descripcion: string;
  setDescripcion: (val: string) => void;

  referenceImagePreview: string | null;
  referenceImageFile: File | null;
  setReferenceImageFile: (file: File | null) => void;
  setReferenceImagePreview: (url: string | null) => void;

  onSubmit: (e: React.FormEvent) => void;
}

interface CreateAssignmentModalProps extends CreateActivityModalProps {
  activityType: AssignableActivityType;
}

export function CreateAssignmentModal({
  isOpen,
  onClose,
  isCreating,
  activityType,
  titulo,
  setTitulo,
  asignadoA,
  setAsignadoA,
  recruitersOptions,
  descripcion,
  setDescripcion,
  referenceImagePreview,
  referenceImageFile,
  setReferenceImageFile,
  setReferenceImagePreview,
  onSubmit,
}: CreateAssignmentModalProps) {
  const { title, formId, fieldIdPrefix } = CREATE_MODAL_CONTENT[activityType];
  const titleId = `${fieldIdPrefix}-titulo`;
  const assigneeId = `${fieldIdPrefix}-asignado`;
  const descriptionId = `${fieldIdPrefix}-descripcion`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={<ClipboardPenLine size="var(--icon-size-md)" aria-hidden="true" />}
      size="sm"
      footerActions={
        <>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={isCreating}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isCreating || !titulo.trim()}
            aria-busy={isCreating}
            form={formId}
          >
            {isCreating ? "Guardando..." : "Asignar"}
          </button>
        </>
      }
    >
      <form id={formId} className="modal-body" onSubmit={onSubmit} noValidate>
        <div className="form-group">
          <label htmlFor={titleId}>Título</label>
          <input
            id={titleId}
            required
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej. Revisión de expedientes"
          />
        </div>

        <div className="form-group">
          <label htmlFor={assigneeId}>Asignar a</label>
          <CustomSelect
            id={assigneeId}
            value={asignadoA}
            onChange={setAsignadoA}
            options={recruitersOptions}
          />
        </div>

        <div className="form-group">
          <label htmlFor={descriptionId}>Descripción</label>
          <SmartTextarea
            id={descriptionId}
            value={descripcion}
            onChange={setDescripcion}
            placeholder="Detalles de la actividad..."
          />
        </div>

        <div className="form-group">
          <span className="form-label">Foto de Referencia</span>
          <div className="reference-upload-area">
            {referenceImagePreview ? (
              <AttachmentCard
                name={referenceImageFile?.name || "Imagen"}
                metadata={`Imagen · ${referenceImageFile ? (referenceImageFile.size / 1024).toFixed(0) : 0} KB`}
                imageSrc={referenceImagePreview}
                onRemove={() => {
                    setReferenceImageFile(null);
                    setReferenceImagePreview(null);
                }}
                removeLabel="Quitar foto de referencia"
                removeIcon={
                  <X size="var(--icon-size-sm)" aria-hidden="true" />
                }
              />
            ) : (
              <label className="reference-upload-label">
                <ImagePlus size="var(--icon-size-lg)" aria-hidden="true" />
                <span>Subir foto de referencia</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setReferenceImageFile(file);
                      setReferenceImagePreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}

export function CreateActivityModal(props: CreateActivityModalProps) {
  return <CreateAssignmentModal {...props} activityType="unica" />;
}
