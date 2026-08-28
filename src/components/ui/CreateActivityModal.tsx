import { ClipboardPenLine, X, ImagePlus } from "lucide-react";
import { Modal } from "./Modal";
import { CustomSelect } from "./CustomSelect";
import { SmartTextarea } from "./SmartTextarea";
import { AttachmentCard } from "./AttachmentCard";

export interface CreateActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  isCreating: boolean;

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
  setReferenceImageFile: (file: File | null) => void;
  setReferenceImagePreview: (url: string | null) => void;

  onSubmit: (e: React.FormEvent) => void;
}

export function CreateActivityModal({
  isOpen,
  onClose,
  isCreating,
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
  setReferenceImageFile,
  setReferenceImagePreview,
  onSubmit,
}: CreateActivityModalProps) {
  const formId = "create-activity-form";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Actividad nueva"
      icon={<ClipboardPenLine size="var(--icon-size-md)" aria-hidden="true" />}
      fullscreenMobile={false}
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
        {/* Tipo selector */}
        <fieldset className="form-group activity-type-fieldset">
          <legend>Tipo</legend>
          <div className="activity-type-selector">
            <label
              className={`activity-type-option ${tipo === "unica" ? "active" : ""}`}
            >
              <input
                className="sr-only"
                type="radio"
                name="tipo"
                value="unica"
                checked={tipo === "unica"}
                onChange={() => setTipo("unica")}
              />
              Actividad
            </label>
            <label
              className={`activity-type-option ${tipo === "rutinaria" ? "active" : ""}`}
            >
              <input
                className="sr-only"
                type="radio"
                name="tipo"
                value="rutinaria"
                checked={tipo === "rutinaria"}
                onChange={() => setTipo("rutinaria")}
              />
              Responsabilidad
            </label>
          </div>
        </fieldset>

        <div className="form-group">
          <label htmlFor="activity-titulo">Título</label>
          <input
            id="activity-titulo"
            required
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej. Revisión de expedientes"
          />
        </div>

        <div className="form-group">
          <label htmlFor="activity-asignado">Asignar a</label>
          <CustomSelect
            id="activity-asignado"
            value={asignadoA}
            onChange={setAsignadoA}
            options={recruitersOptions}
          />
        </div>

        <div className="form-group">
          <label htmlFor="activity-descripcion">Descripción</label>
          <SmartTextarea
            id="activity-descripcion"
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
