import { SquarePen, X, ImagePlus } from "lucide-react";
import { Modal } from "./Modal";
import { CustomSelect } from "./CustomSelect";
import { SmartTextarea } from "./SmartTextarea";
import { AttachmentCard } from "./AttachmentCard";

export interface EditActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;

  tipo: "unica" | "rutinaria";
  setTipo: (val: "unica" | "rutinaria") => void;

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
  tipo,
  setTipo,
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
  const formId = "edit-activity-form";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar actividad"
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
        <fieldset className="form-group activity-type-fieldset">
          <legend>Tipo</legend>
          <div className="activity-type-selector">
            <label
              className={`activity-type-option ${tipo === "unica" ? "active" : ""}`}
            >
              <input
                className="sr-only"
                type="radio"
                name="editTipo"
                value="unica"
                checked={tipo === "unica"}
                onChange={() => setTipo("unica")}
              />
              Tarea
            </label>
            <label
              className={`activity-type-option ${tipo === "rutinaria" ? "active" : ""}`}
            >
              <input
                className="sr-only"
                type="radio"
                name="editTipo"
                value="rutinaria"
                checked={tipo === "rutinaria"}
                onChange={() => setTipo("rutinaria")}
              />
              Rutina
            </label>
          </div>
        </fieldset>

        <div className="form-group">
          <label htmlFor="edit-titulo">Título</label>
          <input
            id="edit-titulo"
            required
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="edit-asignado">Asignar a</label>
          <CustomSelect
            id="edit-asignado"
            value={asignadoA}
            onChange={setAsignadoA}
            options={recruitersOptions}
          />
        </div>

        <div className="form-group">
          <label htmlFor="edit-descripcion">Descripción</label>
          <SmartTextarea
            id="edit-descripcion"
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
