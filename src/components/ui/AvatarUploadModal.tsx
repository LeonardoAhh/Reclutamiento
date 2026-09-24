import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useFeedback } from "@/hooks/useFeedback";
import { toast } from "@/lib/notify";
import { toNaturalCase } from "@/lib/utils";
import { CloudUpload, LoaderCircle, Trash2 } from "lucide";
import { Avatar } from "./Avatar";
import { ConfirmModal } from "./ConfirmModal";
import { Modal } from "./Modal";
import { MorphingIcon } from "@/components/ui/MorphingIcon";
import "./AvatarUploadModal.css";

type AvatarUploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const AVATAR_BUCKET = "avatars";

function getOwnedAvatarPath(
  publicUrl: string,
  userId: string,
): string | null {
  try {
    const marker = `/storage/v1/object/public/${AVATAR_BUCKET}/`;
    const pathname = decodeURIComponent(new URL(publicUrl).pathname);
    const markerIndex = pathname.indexOf(marker);
    if (markerIndex < 0) return null;

    const path = pathname.slice(markerIndex + marker.length);
    return path.startsWith(`${userId}/`) ? path : null;
  } catch {
    return null;
  }
}

export function AvatarUploadModal({ isOpen, onClose }: AvatarUploadModalProps) {
  const { user, profile, username, updateAvatarUrl } = useAuth();
  const { trigger } = useFeedback();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    profile?.avatar_url || null,
  );
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewObjectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }
      return;
    }
    setFile(null);
    setPreview(profile?.avatar_url || null);
    setConfirmingDelete(false);
    setDeleteError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [isOpen]);

  useEffect(
    () => () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
    },
    [],
  );

  if (!isOpen || !user || !profile) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      toast.error({ title: "Solo se permiten imágenes" });
      return;
    }

    if (selected.size > 2 * 1024 * 1024) {
      toast.error({ title: "La imagen es muy grande (Máx 2MB)" });
      return;
    }

    setFile(selected);
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
    }
    const objectUrl = URL.createObjectURL(selected);
    previewObjectUrlRef.current = objectUrl;
    setPreview(objectUrl);
  };

  const handleUpload = async () => {
    if (!file) {
      onClose();
      return;
    }

    setUploading(true);
    trigger("light");
    const path = `${user.id}/avatar_${Date.now()}`;

    try {
      // 1. Subir al bucket
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Obtener URL pública
      const { data: publicData } = supabase.storage
        .from(AVATAR_BUCKET)
        .getPublicUrl(path);

      const publicUrl = publicData.publicUrl;

      // 3. Actualizar tabla profiles
      const { error: dbError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (dbError) throw dbError;

      // 4. Actualizar estado local
      updateAvatarUrl(publicUrl);
      trigger("success");
      toast.success({ title: "Avatar actualizado exitosamente" });
      onClose();
    } catch (err: unknown) {
      console.error(err);
      trigger("error");
      toast.error({ title: "Error al subir el avatar" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    const currentAvatarUrl = profile.avatar_url;
    if (!currentAvatarUrl || deleting) return;

    setDeleting(true);
    setDeleteError(null);
    trigger("light");

    try {
      const { error: dbError } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id);

      if (dbError) throw dbError;

      updateAvatarUrl(null);
      setPreview(null);
      setFile(null);

      const ownedPath = getOwnedAvatarPath(currentAvatarUrl, user.id);
      if (ownedPath) {
        const { error: storageError } = await supabase.storage
          .from(AVATAR_BUCKET)
          .remove([ownedPath]);

        if (storageError) {
          trigger("error");
          toast.warning({
            title: "Foto retirada; no se pudo borrar el archivo almacenado",
          });
          onClose();
          return;
        }
      }

      trigger("success");
      toast.success({ title: "Foto de perfil eliminada" });
      onClose();
    } catch (error: unknown) {
      console.error(error);
      trigger("error");
      setDeleteError("No se pudo eliminar la foto. Inténtalo de nuevo.");
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    if (!uploading && !deleting) onClose();
  };

  const footerActions = (
    <>
      <button
        type="button"
        className="btn-secondary"
        onClick={handleClose}
        disabled={uploading}
      >
        Cancelar
      </button>
      <button
        type="button"
        className="btn-primary"
        onClick={handleUpload}
        disabled={!file || uploading}
        aria-busy={uploading}
      >
        {uploading && (
          <MorphingIcon
            icon={LoaderCircle}
            size="var(--icon-size-sm)"
            className="avatar-modal__spin"
            aria-hidden="true"
          />
        )}
        <span>{uploading ? "Guardando..." : "Guardar"}</span>
      </button>
    </>
  );

  if (confirmingDelete) {
    return (
      <ConfirmModal
        isOpen={isOpen}
        title="Eliminar foto"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={() => void handleDelete()}
        onCancel={() => {
          if (!deleting) {
            setConfirmingDelete(false);
            setDeleteError(null);
          }
        }}
        isDestructive
        isLoading={deleting}
        loadingLabel="Eliminando…"
        errorMessage={deleteError ?? undefined}
      />
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Avatar"
      size="xs"
      footerActions={footerActions}
    >
        <div className="modal-body avatar-modal__body">
          <div className="avatar-modal__preview">
            <Avatar
              name={toNaturalCase(profile.display_name || username, {
                preserveAcronyms: false,
              })}
              src={preview}
            />
          </div>

          <p className="avatar-modal__hint">
            Sube un avatar cuadrado, máximo 2MB.
          </p>

          <input
            type="file"
            accept="image/png, image/jpeg, image/webp"
            className="avatar-modal__input-hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={uploading}
          />

          <div className="avatar-modal__actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <MorphingIcon
                icon={uploading ? LoaderCircle : CloudUpload}
                size="var(--icon-size-sm)"
                aria-hidden="true"
              />
              <span>{file ? "Elegir otra imagen" : "Seleccionar"}</span>
            </button>
            {profile.avatar_url && (
              <button
                type="button"
                className="btn-secondary avatar-modal__delete-btn"
                onClick={() => setConfirmingDelete(true)}
                disabled={uploading}
              >
                <MorphingIcon
                  icon={Trash2}
                  size="var(--icon-size-sm)"
                  aria-hidden="true"
                />
                <span>Borrar foto</span>
              </button>
            )}
          </div>
        </div>
    </Modal>
  );
}
