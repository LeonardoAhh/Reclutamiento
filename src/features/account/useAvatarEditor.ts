import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useFeedback } from '@/hooks/useFeedback';
import { toast } from '@/lib/notify';
import type { AccountCopy } from '@/pages/account-translations';

const AVATAR_BUCKET = 'avatars';
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

function getOwnedAvatarPath(publicUrl: string, userId: string): string | null {
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

/** Estado y persistencia de la foto de perfil (subida, vista previa y borrado). */
export function useAvatarEditor(copy: AccountCopy) {
  const { user, profile, updateAvatarUrl } = useAuth();
  const { trigger } = useFeedback();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const objectUrl = useRef<string | null>(null);

  function revokePreview() {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = null;
  }

  useEffect(() => revokePreview, []);

  function clear() {
    revokePreview();
    setFile(null);
    setPreview(null);
  }

  function select(selected: File | undefined) {
    if (!selected) return false;
    if (!selected.type.startsWith('image/')) {
      toast.error({ title: copy.photoOnlyImages });
      return false;
    }
    if (selected.size > AVATAR_MAX_BYTES) {
      toast.error({ title: copy.photoTooLarge });
      return false;
    }
    revokePreview();
    objectUrl.current = URL.createObjectURL(selected);
    setFile(selected);
    setPreview(objectUrl.current);
    setDeleteError(null);
    return true;
  }

  async function upload() {
    if (!file || !user || uploading) return false;
    setUploading(true);
    trigger('light');
    const path = `${user.id}/avatar_${Date.now()}`;
    try {
      const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
      const { error: dbError } = await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id);
      if (dbError) throw dbError;
      updateAvatarUrl(data.publicUrl);
      clear();
      trigger('success');
      toast.success({ title: copy.photoUpdated });
      return true;
    } catch (error: unknown) {
      console.error(error);
      trigger('error');
      toast.error({ title: copy.photoUploadFailed });
      return false;
    } finally {
      setUploading(false);
    }
  }

  async function remove() {
    const currentAvatarUrl = profile?.avatar_url;
    if (!user || !currentAvatarUrl || deleting) return false;
    setDeleting(true);
    setDeleteError(null);
    trigger('light');
    try {
      const { error: dbError } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id);
      if (dbError) throw dbError;
      updateAvatarUrl(null);
      clear();
      const ownedPath = getOwnedAvatarPath(currentAvatarUrl, user.id);
      if (ownedPath) {
        const { error: storageError } = await supabase.storage.from(AVATAR_BUCKET).remove([ownedPath]);
        if (storageError) {
          trigger('error');
          toast.warning({ title: copy.photoFileKept });
          return true;
        }
      }
      trigger('success');
      toast.success({ title: copy.photoDeleted });
      return true;
    } catch (error: unknown) {
      console.error(error);
      trigger('error');
      setDeleteError(copy.photoDeleteFailed);
      return false;
    } finally {
      setDeleting(false);
    }
  }

  return {
    file,
    preview: preview ?? profile?.avatar_url ?? null,
    hasSavedAvatar: Boolean(profile?.avatar_url),
    uploading,
    deleting,
    deleteError,
    select,
    clear,
    upload,
    remove,
  };
}
