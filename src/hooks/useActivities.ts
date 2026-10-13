import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Activity,
  ActivityProof,
  ActivityStatus,
  ActivityType,
} from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/lib/notify';
import { useLanguage } from '@/contexts/LanguageContext';
import { CoverError, prepareKanbanCover } from '@/features/kanban/cover';

const ACTIVITY_SELECT = `
  id,
  titulo,
  descripcion,
  asignado_a,
  estado,
  tipo,
  reference_image,
  created_at,
  updated_at,
  asignado_a_profile:profiles!activities_asignado_a_fkey(display_name, username)
`;

const ACTIVITY_PROOF_SELECT =
  'id, activity_id, file_url, file_name, created_at';

function sortActivitiesByCreatedAt(rows: Activity[]): Activity[] {
  return [...rows].sort((left, right) => {
    const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0;
    const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0;
    return rightTime - leftTime;
  });
}

export function useActivities() {
  const { profile } = useAuth();
  const { language } = useLanguage();
  const english = language === 'en';
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      let query = supabase
        .from('activities')
        .select(ACTIVITY_SELECT)
        .order('created_at', { ascending: false });
      
      // If reclutador, only fetch theirs or general activities
      if (profile.role === 'reclutador') {
        query = query.or(`asignado_a.eq.${profile.id},asignado_a.is.null`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setActivities(data as Activity[]);
    } catch (err: any) {
      toast.error({ title: english ? 'Could not load activities' : 'Error al cargar actividades', description: err.message });
    } finally {
      setLoading(false);
    }
  }, [profile, english]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const createActivity = async (titulo: string, descripcion: string, asignado_a: string | null, tipo: ActivityType = 'unica', reference_image: string | null = null) => {
    if (!profile) return null;
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert({
          titulo,
          descripcion,
          asignado_a: asignado_a || null,
          creado_por: profile.id,
          estado: 'pendiente',
          tipo,
          reference_image
        })
        .select(ACTIVITY_SELECT)
        .single();
      
      if (error) throw error;
      const saved = data as Activity;
      setActivities((current) =>
        sortActivitiesByCreatedAt([
          saved,
          ...current.filter((activity) => activity.id !== saved.id),
        ])
      );
      toast.success({ title: english ? 'Activity assigned' : 'Actividad asignada' });
      return saved;
    } catch (err: any) {
      toast.error({ title: english ? 'Could not assign the activity' : 'Error al asignar', description: err.message });
      return null;
    }
  };

  const updateActivityStatus = async (id: string, estado: ActivityStatus) => {
    try {
      const { data, error } = await supabase.from('activities')
        .update({ estado, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(ACTIVITY_SELECT)
        .single();
        
      if (error) throw error;
      const saved = data as Activity;
      setActivities(prev => prev.map(a => a.id === id ? saved : a));
      toast.success({ title: english ? 'Status updated' : 'Estado actualizado' });
      return saved;
    } catch (err: any) {
      toast.error({ title: english ? 'Could not update the activity' : 'Error al actualizar', description: err.message });
      return null;
    }
  };

  const uploadProof = async (activityId: string, file: File) => {
    if (!profile) return null;
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${activityId}/${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('activity-proofs')
        .upload(fileName, file);
        
      if (uploadError) throw uploadError;
      
      const { data: publicUrlData } = supabase.storage
        .from('activity-proofs')
        .getPublicUrl(fileName);
        
      const { data, error } = await supabase.from('activity_proofs').insert({
        activity_id: activityId,
        file_url: publicUrlData.publicUrl,
        file_name: file.name,
        uploaded_by: profile.id
      }).select(ACTIVITY_PROOF_SELECT).single();
      
      if (error) throw error;
      toast.success({ title: english ? 'Proof uploaded' : 'Prueba subida exitosamente' });
      return data as ActivityProof;
    } catch (err: any) {
      toast.error({ title: english ? 'Could not upload proof' : 'Error al subir prueba', description: err.message });
      return null;
    }
  };

  const getProofs = async (activityId: string) => {
    try {
      const { data, error } = await supabase.from('activity_proofs')
        .select(ACTIVITY_PROOF_SELECT)
        .eq('activity_id', activityId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data as any[];
    } catch (err: any) {
      toast.error({ title: english ? 'Could not load proof' : 'Error al cargar pruebas', description: err.message });
      return [];
    }
  };
  
  const deleteProof = async (proofId: string, fileUrl: string) => {
      try {
        const urlObj = new URL(fileUrl);
        const pathParts = urlObj.pathname.split('/activity-proofs/');
        if (pathParts.length > 1) {
            const filePath = pathParts[1];
            await supabase.storage.from('activity-proofs').remove([filePath]);
        }
        
        const { error } = await supabase.from('activity_proofs').delete().eq('id', proofId);
        if (error) throw error;
        toast.success({ title: english ? 'Proof deleted' : 'Prueba eliminada' });
        return true;
      } catch (err: any) {
          toast.error({ title: english ? 'Could not delete proof' : 'Error al eliminar', description: err.message });
          return false;
      }
  }

  const uploadReferenceImage = async (activityId: string, file: File) => {
    if (!profile) return null;
    try {
      const prepared = await prepareKanbanCover(file);
      const fileName = `${activityId}/ref_${crypto.randomUUID()}.webp`;
      
      const { error: uploadError } = await supabase.storage
        .from('activity-proofs')
        .upload(fileName, prepared, { contentType: 'image/webp' });
        
      if (uploadError) throw uploadError;
      
      const { data: publicUrlData } = supabase.storage
        .from('activity-proofs')
        .getPublicUrl(fileName);
        
      return publicUrlData.publicUrl;
    } catch (err: unknown) {
      const coverError = err instanceof CoverError ? err.code : null;
      const description = coverError === 'format'
        ? (english ? 'Use a JPG, PNG or WebP image.' : 'Usa una imagen JPG, PNG o WebP.')
        : coverError === 'sourceSize'
          ? (english ? 'The original image must be under 10 MB.' : 'La imagen original debe pesar menos de 10 MB.')
          : coverError === 'compressedSize'
            ? (english ? 'Could not reduce the image to 300 KB. Try another.' : 'No se pudo reducir la imagen a 300 KB. Prueba otra.')
            : coverError === 'processing'
              ? (english ? 'Could not process the image.' : 'No se pudo procesar la imagen.')
              : err instanceof Error ? err.message : undefined;
      toast.error({ title: english ? 'Could not upload the photo' : 'Error al subir foto', description });
      return null;
    }
  };

  const removeReferenceImage = async (activityId: string, imageUrl: string) => {
    try {
      const bucket = supabase.storage.from('activity-proofs');
      const expected = new URL(bucket.getPublicUrl(`${activityId}/`).data.publicUrl);
      const current = new URL(imageUrl);
      if (current.origin !== expected.origin || !current.pathname.startsWith(expected.pathname)) return false;
      const fileName = decodeURIComponent(current.pathname.slice(expected.pathname.length));
      if (!/^ref_[^/]+\.[a-z0-9]+$/i.test(fileName)) return false;
      const { error } = await bucket.remove([`${activityId}/${fileName}`]);
      if (error) throw error;
      return true;
    } catch {
      toast.error({ title: english ? 'Could not remove the previous photo' : 'No se pudo borrar la foto anterior' });
      return false;
    }
  };

  const updateActivity = async (id: string, fields: { titulo?: string; descripcion?: string; asignado_a?: string | null; tipo?: ActivityType, reference_image?: string | null }) => {
    try {
      const { data, error } = await supabase.from('activities')
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(ACTIVITY_SELECT)
        .single();

      if (error) throw error;
      const saved = data as Activity;
      setActivities((current) =>
        current.map((activity) => activity.id === id ? saved : activity)
      );
      toast.success({ title: english ? 'Activity updated' : 'Actividad actualizada' });
      return saved;
    } catch (err: any) {
      toast.error({ title: english ? 'Could not update the activity' : 'Error al actualizar', description: err.message });
      return null;
    }
  };

  const deleteActivity = async (id: string) => {
    try {
      const { error } = await supabase.from('activities').delete().eq('id', id);
      if (error) throw error;
      setActivities(prev => prev.filter(a => a.id !== id));
      toast.success({ title: english ? 'Activity deleted' : 'Actividad eliminada' });
      return true;
    } catch (err: any) {
      toast.error({ title: english ? 'Could not delete the activity' : 'Error al eliminar', description: err.message });
      return false;
    }
  };

  return {
    activities,
    loading,
    refresh: fetchActivities,
    createActivity,
    updateActivity,
    updateActivityStatus,
    deleteActivity,
    uploadProof,
    uploadReferenceImage,
    removeReferenceImage,
    getProofs,
    deleteProof,
  };
}
