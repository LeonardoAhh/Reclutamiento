import { useState, useRef, type ChangeEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useLoader } from '@/hooks/useLoader';
import { useFeedback } from '@/hooks/useFeedback';
import { X, UploadCloud, Loader2 } from 'lucide-react';
import { Avatar } from './Avatar';
import './AvatarUploadModal.css';

type AvatarUploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AvatarUploadModal({ isOpen, onClose }: AvatarUploadModalProps) {
  const { user, profile, username, updateAvatarUrl } = useAuth();
  const loader = useLoader();
  const { trigger } = useFeedback();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(profile?.avatar_url || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !user || !profile) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      loader.flash({ title: 'Solo se permiten imágenes', duration: 2500 });
      return;
    }

    if (selected.size > 2 * 1024 * 1024) {
      loader.flash({ title: 'La imagen es muy grande', hint: 'Máximo 2MB', duration: 2500 });
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
    trigger('light');
    const path = `${user.id}/avatar_${Date.now()}`;

    try {
      // 1. Subir al bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Obtener URL pública
      const { data: publicData } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      const publicUrl = publicData.publicUrl;

      // 3. Actualizar tabla profiles
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (dbError) throw dbError;

      // 4. Actualizar estado local
      updateAvatarUrl(publicUrl);
      trigger('success');
      loader.flash({ title: 'Foto actualizada exitosamente', duration: 2500 });
      onClose();
    } catch (err: any) {
      console.error(err);
      trigger('error');
      loader.flash({ title: 'Error al subir la foto', hint: err.message, duration: 3000 });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="avatar-modal-overlay" onPointerDown={onClose}>
      <div 
        className="avatar-modal" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="avatar-modal-title"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <header className="avatar-modal__header">
          <h2 id="avatar-modal-title" className="avatar-modal__title">Foto de perfil</h2>
          <button 
            type="button" 
            className="avatar-modal__close" 
            onClick={onClose}
            aria-label="Cerrar modal"
            disabled={uploading}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="avatar-modal__body">
          <div className="avatar-modal__preview">
            <Avatar name={username} src={preview} size={96} />
          </div>
          
          <p className="avatar-modal__hint">
            Sube una foto cuadrada, máximo 2MB.<br/>
            Se usará para identificarte en el sistema.
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
            <UploadCloud size={16} />
            <span>{file ? 'Elegir otra imagen' : 'Seleccionar imagen'}</span>
          </button>
        </div>

        <footer className="avatar-modal__footer">
          <button 
            type="button" 
            className="button-utility" 
            onClick={onClose}
            disabled={uploading}
          >
            Cancelar
          </button>
          <button 
            type="button" 
            className="button-primary" 
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="avatar-modal__spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <span>Guardar cambios</span>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}
