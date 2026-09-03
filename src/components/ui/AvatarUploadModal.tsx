import { useState, useRef, type ChangeEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useLoader } from "@/hooks/useLoader";
import { useFeedback } from "@/hooks/useFeedback";
import { CloudUpload, LoaderCircle } from "lucide";
import { Avatar } from "./Avatar";
import { Modal } from "./Modal";
import { MorphingIcon } from "@/components/ui/MorphingIcon";
import "./AvatarUploadModal.css";

type AvatarUploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AvatarUploadModal({ isOpen, onClose }: AvatarUploadModalProps) {
  const { user, profile, username, updateAvatarUrl } = useAuth();
  const loader = useLoader();
  const { trigger } = useFeedback();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    profile?.avatar_url || null,
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !user || !profile) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      loader.flash({ title: "Solo se permiten imágenes", duration: 2500 });
      return;
    }

    if (selected.size > 2 * 1024 * 1024) {
      loader.flash({
        title: "La imagen es muy grande (Máx 2MB)",
        duration: 2500,
      });
      return;
    }

    setFile(selected);
    const objectUrl = URL.createObjectURL(selected);
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
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Obtener URL pública
      const { data: publicData } = supabase.storage
        .from("avatars")
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
      loader.flash({
        title: "Avatar actualizado exitosamente",
        duration: 2500,
      });
      onClose();
    } catch (err: unknown) {
      console.error(err);
      trigger("error");
      loader.flash({
        title: "Error al subir el avatar",
        duration: 3000,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) onClose();
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
            <Avatar name={username} src={preview} size={96} />
          </div>

          <p className="avatar-modal__hint">
            Sube un avatar cuadrado, máximo 2MB.
            <br />
          </p>

          <input
            type="file"
            accept="image/png, image/jpeg, image/webp"
            className="avatar-modal__input-hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={uploading}
          />

          <button
            type="button"
            className="button-utility avatar-modal__select-btn"
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
        </div>
    </Modal>
  );
}
