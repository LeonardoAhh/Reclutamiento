import { useEffect, useRef } from 'react';
import { SquarePen, Trash2, X, ImagePlus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Modal } from "./Modal";
import { CustomSelect } from "./CustomSelect";
import { SmartTextarea } from "./SmartTextarea";
import { AttachmentCard } from "./AttachmentCard";
import { AssignmentMeta, type AssignmentPerson } from "./AssignmentMeta";
import { getResponsibilityContent } from "./responsibilityContent";
import { ReferenceImageLink } from "./ReferenceImageLink";
import type { Activity, AssignableActivityType } from "@/lib/types";

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
  previewActivity?: Activity | null;
  previewAssignee?: AssignmentPerson;
  currentUserId?: string;
  onStartEditing?: () => void;
  onDelete?: () => void;
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
  previewActivity,
  previewAssignee,
  currentUserId,
  onStartEditing,
  onDelete,
}: EditActivityModalProps) {
  const { language } = useLanguage();
  const en = language === "en";
  const { title, formId, fieldIdPrefix } = EDIT_MODAL_CONTENT[activityType];
  const modalTitle = en ? ({ unica: "Edit activity", rutinaria: "Edit responsibility", soporte: "Edit support task" })[activityType] : title;
  const titleId = `${fieldIdPrefix}-titulo`;
  const assigneeId = `${fieldIdPrefix}-asignado`;
  const descriptionId = `${fieldIdPrefix}-descripcion`;
  const showingPreview = activityType === 'rutinaria' && Boolean(previewActivity);
  const previewContent = previewActivity ? getResponsibilityContent(previewActivity) : null;
  const titleRef = useRef<HTMLInputElement>(null);
  const wasShowingPreview = useRef(false);
  useEffect(() => {
    if (!isOpen) { wasShowingPreview.current = false; return; }
    if (wasShowingPreview.current && !showingPreview) titleRef.current?.focus();
    wasShowingPreview.current = showingPreview;
  }, [isOpen, showingPreview]);

  return (
    <Modal
      className={showingPreview ? 'activities-form-dialog responsibility-detail-dialog' : 'activities-form-dialog'}
      isOpen={isOpen}
      onClose={onClose}
      title={showingPreview ? previewActivity?.titulo : modalTitle}
      icon={showingPreview ? undefined : <SquarePen size="var(--icon-size-md)" aria-hidden="true" />}
      size="sm"
      headerActions={showingPreview && <div className="responsibility-detail__actions">
        {onStartEditing && <button type="button" className="responsibility-detail__edit" onClick={onStartEditing}>
          <SquarePen size="var(--icon-size-md)" aria-hidden="true" />{en ? 'Edit' : 'Editar'}
        </button>}
        {onDelete && <button type="button" className="responsibility-detail__edit responsibility-detail__delete" onClick={onDelete}>
          <Trash2 size="var(--icon-size-md)" aria-hidden="true" />{en ? 'Delete' : 'Eliminar'}
        </button>}
      </div>}
      footerActions={!showingPreview &&
        <>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={isEditing}
          >
            {en ? "Cancel" : "Cancelar"}
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isEditing || !titulo.trim()}
            aria-busy={isEditing}
            form={formId}
          >
            {isEditing ? (en ? "Saving..." : "Guardando...") : (en ? "Save" : "Guardar")}
          </button>
        </>
      }
    >
      {showingPreview && previewActivity ? <div className="responsibility-detail type-body-md">
        {previewActivity.reference_image && <ReferenceImageLink src={previewActivity.reference_image} />}
        {previewContent?.description && <p className="responsibility-detail__description">{previewContent.description}</p>}
        {previewContent?.area && <p className="responsibility-detail__area">{previewContent.area}</p>}
        <div className="responsibility-detail__assignment">
          <span className="type-body-sm">{en ? 'Assignment' : 'Asignación'}</span>
          <AssignmentMeta assignee={previewAssignee} currentUserId={currentUserId} />
        </div>
      </div> : <form id={formId} className="modal-body" onSubmit={onSubmit} noValidate>
        <div className="form-group">
          <label htmlFor={titleId}>{en ? "Title" : "Título"}</label>
          <input
            ref={titleRef}
            id={titleId}
            required
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor={assigneeId}>{en ? "Assign to" : "Asignar a"}</label>
          <CustomSelect
            id={assigneeId}
            value={asignadoA}
            onChange={setAsignadoA}
            options={recruitersOptions}
          />
        </div>

        <div className="form-group">
          <label htmlFor={descriptionId}>{en ? "Description" : "Descripción"}</label>
          <SmartTextarea
            id={descriptionId}
            value={descripcion}
            onChange={setDescripcion}
            placeholder={en ? "Activity details..." : "Detalles de la actividad..."}
          />
        </div>

        <div className="form-group">
          <span className="activity-form-label">{en ? "Reference photo" : "Foto de Referencia"}</span>
          <div className="reference-upload-area">
            {referenceImagePreview || existingReferenceImage ? (
              <AttachmentCard
                name={
                  referenceImageFile?.name ||
                  existingReferenceImage?.split("/").pop()?.split("?")[0] ||
                  (en ? "Image" : "Imagen")
                }
                metadata={
                  referenceImageFile
                    ? `${en ? "Image" : "Imagen"} · ${(referenceImageFile.size / 1024).toFixed(0)} KB`
                    : (en ? "Attached image" : "Imagen adjunta")
                }
                imageSrc={referenceImagePreview || existingReferenceImage!}
                onRemove={() => {
                    setReferenceImageFile(null);
                    setReferenceImagePreview(null);
                    setExistingReferenceImage(null);
                }}
                removeLabel={en ? "Remove reference photo" : "Quitar foto de referencia"}
                removeIcon={
                  <X size="var(--icon-size-sm)" aria-hidden="true" />
                }
              />
            ) : (
              <label className="reference-upload-label">
                <ImagePlus size="var(--icon-size-lg)" aria-hidden="true" />
                <span>{en ? "Upload reference photo" : "Subir foto de referencia"}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
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
      </form>}
    </Modal>
  );
}
