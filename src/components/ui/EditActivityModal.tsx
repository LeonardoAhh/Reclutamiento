import { SquarePen, X, ImagePlus } from "lucide-react";
import { Modal } from "./Modal";
import { CustomSelect } from "./CustomSelect";
import { SmartTextarea } from "./SmartTextarea";
import { AttachmentCard } from "./AttachmentCard";
import type { AssignableActivityType } from "@/lib/types";

const EDIT_MODAL_CONTENT: Record<
  AssignableActivityType,
  { title: string; formId: string; fieldIdPrefix: string }
> = {
  unica: {
    title: "Editar actividad",
    formId: "edit-activity-form",
    fieldIdPrefix: "edit-activity",
  },
  rutinaria: {
    title: "Editar responsabilidad",
    formId: "edit-responsibility-form",
    fieldIdPrefix: "edit-responsibility",
  },
  soporte: {
    title: "Editar soporte",
    formId: "edit-support-form",
    fieldIdPrefix: "edit-support",
  },
};

export interface EditActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;

  activityType: AssignableActivityType;

  titulo: string;
  setTitulo: (val: string) => void;

  asignadoA: string;
  setAsignadoA: (val: string) => void;
  recruitersOptions: { value: string; label: string }[];

  descripcion: string;
  setDescripcion: (val: string) => void;

  referenceImagePreview: string | null;
  referenceImageFile: File | null;
  existingReferenceImage: string | null;
  setReferenceImageFile: (file: File | null) => void;
  setReferenceImagePreview: (url: string | null) => void;
  setExistingReferenceImage: (url: string | null) => void;

  onSubmit: (e: React.FormEvent) => void;
}

export function EditActivityModal({
  isOpen,
  onClose,
  isEditing,
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
  existingReferenceImage,
  setReferenceImageFile,
  setReferenceImagePreview,
  setExistingReferenceImage,
  onSubmit,
}: EditActivityModalProps) {
  const { title, formId, fieldIdPrefix } = EDIT_MODAL_CONTENT[activityType];
  const titleId = `${fieldIdPrefix}-titulo`;
  const assigneeId = `${fieldIdPrefix}-asignado`;
  const descriptionId = `${fieldIdPrefix}-descripcion`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={<SquarePen size="var(--icon-size-md)" aria-hidden="true" />}
      size="sm"
      footerActions={
        <>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={isEditing}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isEditing || !titulo.trim()}
            aria-busy={isEditing}
            form={formId}
          >
            {isEditing ? "Guardando..." : "Guardar"}
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
            {referenceImagePreview || existingReferenceImage ? (
              <AttachmentCard
                name={
                  referenceImageFile?.name ||
                  existingReferenceImage?.split("/").pop()?.split("?")[0] ||
                  "Imagen"
                }
                metadata={
                  referenceImageFile
                    ? `Imagen · ${(referenceImageFile.size / 1024).toFixed(0)} KB`
                    : "Imagen adjunta"
                }
                imageSrc={referenceImagePreview || existingReferenceImage!}
                onRemove={() => {
                    setReferenceImageFile(null);
                    setReferenceImagePreview(null);
                    setExistingReferenceImage(null);
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
