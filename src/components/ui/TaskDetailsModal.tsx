import { ClipboardClock, Trash2, FileUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Modal } from "./Modal";
import { CustomSelect } from "./CustomSelect";
import { AttachmentCard } from "./AttachmentCard";
import { Activity, ActivityStatus, ActivityProof } from "@/lib/types";

interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity | null;
  onStatusChange: (status: ActivityStatus) => void;
  isUpdatingStatus: boolean;
  onLightboxOpen: (src: string) => void;
  proofsLoading: boolean;
  proofs: ActivityProof[];
  isImage: (filename: string) => boolean;
  isAdmin: boolean;
  onDeleteProof: (id: string, url: string) => void;
  onUploadProof: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploadingProof: boolean;
}

export function TaskDetailsModal({
  isOpen,
  onClose,
  activity,
  onStatusChange,
  isUpdatingStatus,
  onLightboxOpen,
  proofsLoading,
  proofs,
  isImage,
  isAdmin,
  onDeleteProof,
  onUploadProof,
  isUploadingProof,
}: TaskDetailsModalProps) {
  const { language } = useLanguage();
  const en = language === "en";
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={activity?.titulo ?? (en ? "Task details" : "Detalles de Tarea")}
      icon={<ClipboardClock size="var(--icon-size-md)" aria-hidden="true" />}
      size="sm"
    >
      {activity && (
        <div className="modal-body">
          <div className="activity-detail-grid">
            <div className="form-group">
              <label htmlFor="detail-estado">{en ? "Status" : "Estado"}</label>
              <CustomSelect
                id="detail-estado"
                value={activity.estado}
                onChange={(val) => onStatusChange(val as ActivityStatus)}
                disabled={isUpdatingStatus}
                options={[
                  { value: "pendiente", label: en ? "Pending" : "Pendiente" },
                  { value: "en_proceso", label: en ? "In progress" : "En Proceso" },
                  { value: "completada", label: en ? "Completed" : "Completada" },
                ]}
              />
            </div>

            <div className="form-group">
              <h3 className="activity-detail-heading">{en ? "Description" : "Descripción"}</h3>
              <div className="activity-desc-block">
                {activity.descripcion || (en ? "No detailed description." : "Sin descripción detallada.")}
              </div>
            </div>
          </div>

          {activity.reference_image && (
            <div className="form-group">
              <span className="activity-form-label">{en ? "Reference photo" : "Foto de Referencia"}</span>
              <AttachmentCard
                name={
                  activity.reference_image.split("/").pop()?.split("?")[0] ||
                  (en ? "Image" : "Imagen")
                }
                metadata={en ? "Attached image" : "Imagen adjunta"}
                imageSrc={activity.reference_image}
                onPreview={() => onLightboxOpen(activity.reference_image!)}
                previewLabel={`${en ? "Enlarge reference for" : "Ampliar referencia de"} ${activity.titulo}`}
              />
            </div>
          )}

          <hr className="activity-detail-divider" />

          <h3 className="activity-proofs-heading">{en ? "Evidence" : "Evidencias / Pruebas"}</h3>
          <div className="proofs-layout">
            {proofs.length === 0 && !proofsLoading && (
              <p className="actividades-empty__subtitle">
                {en ? "No evidence yet." : "No hay pruebas aún."}
              </p>
            )}
            {proofsLoading && (
              <p className="actividades-empty__subtitle">
                {en ? "Loading evidence..." : "Cargando evidencias..."}
              </p>
            )}

            <div className="proofs-list" aria-live="polite">
              {!proofsLoading && proofs.map((proof) => (
                <AttachmentCard
                  key={proof.id}
                  name={proof.file_name}
                  metadata={
                    isImage(proof.file_name) ? (en ? "Attached image" : "Imagen adjunta") : (en ? "Document" : "Documento")
                  }
                  imageSrc={
                    isImage(proof.file_name) ? proof.file_url : undefined
                  }
                  href={
                    isImage(proof.file_name) ? undefined : proof.file_url
                  }
                  onPreview={
                    isImage(proof.file_name)
                      ? () => onLightboxOpen(proof.file_url)
                      : undefined
                  }
                  previewLabel={`${en ? "Open" : "Abrir"} ${proof.file_name}`}
                  onRemove={
                    isAdmin
                      ? () => onDeleteProof(proof.id!, proof.file_url)
                      : undefined
                  }
                  removeLabel={`${en ? "Delete" : "Eliminar"} ${proof.file_name}`}
                  removeIcon={
                    <Trash2
                      size="var(--icon-size-sm)"
                      aria-hidden="true"
                    />
                  }
                />
              ))}

              <label className="file-upload-wrapper">
                <input
                  type="file"
                  className="sr-only"
                  onChange={onUploadProof}
                  disabled={isUploadingProof || proofsLoading}
                  accept="image/*,.pdf"
                />
                <div className="file-upload-inner">
                  <FileUp
                    size="var(--icon-size-lg)"
                    className="file-upload-icon"
                    aria-hidden="true"
                  />
                  <span className="file-upload-text">
                    {isUploadingProof ? (en ? "Uploading..." : "Subiendo...") : (en ? "Add" : "Añadir")}
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
