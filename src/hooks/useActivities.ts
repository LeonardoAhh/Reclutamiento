import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity, ActivityProof, ActivityStatus } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/lib/notify';

export function useActivities() {
  const { profile } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      let query = supabase.from('activities').select(`*, asignado_a_profile:profiles!activities_asignado_a_fkey(display_name, username), creado_por_profile:profiles!activities_creado_por_fkey(display_name, username)`).order('created_at', { ascending: false });
      
      // If reclutador, only fetch theirs or general activities
      if (profile.role === 'reclutador') {
        query = query.or(`asignado_a.eq.${profile.id},asignado_a.is.null`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setActivities(data as Activity[]);
    } catch (err: any) {
      toast.error({ title: 'Error al cargar actividades', description: err.message });
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const createActivity = async (titulo: string, descripcion: string, asignado_a: string | null, tipo: 'unica' | 'rutinaria' = 'unica', reference_image: string | null = null) => {
    if (!profile) return null;
    try {
      const { data, error } = await supabase.from('activities').insert({
        titulo,
        descripcion,
        asignado_a: asignado_a || null,
        creado_por: profile.id,
        estado: 'pendiente',
        tipo,
        reference_image
      }).select().single();
      
      if (error) throw error;
      setActivities(prev => [data as Activity, ...prev]);
      toast.success({ title: 'Actividad asignada' });
      return data;
    } catch (err: any) {
      toast.error({ title: 'Error al asignar', description: err.message });
      return null;
    }
  };

  const updateActivityStatus = async (id: string, estado: ActivityStatus) => {
    try {
      const { data, error } = await supabase.from('activities')
        .update({ estado, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      setActivities(prev => prev.map(a => a.id === id ? { ...a, estado } : a));
      toast.success({ title: 'Estado actualizado' });
      return data;
    } catch (err: any) {
      toast.error({ title: 'Error al actualizar', description: err.message });
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
      }).select().single();
      
      if (error) throw error;
      toast.success({ title: 'Prueba subida exitosamente' });
      return data as ActivityProof;
    } catch (err: any) {
      toast.error({ title: 'Error al subir prueba', description: err.message });
      return null;
    }
  };

  const getProofs = async (activityId: string) => {
    try {
      const { data, error } = await supabase.from('activity_proofs')
        .select('*, uploaded_by_profile:profiles!activity_proofs_uploaded_by_fkey(display_name, username)')
        .eq('activity_id', activityId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data as any[];
    } catch (err: any) {
      toast.error({ title: 'Error al cargar pruebas', description: err.message });
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
        toast.success({ title: 'Prueba eliminada' });
        return true;
      } catch (err: any) {
          toast.error({ title: 'Error al eliminar', description: err.message });
          return false;
      }
  }

  const uploadReferenceImage = async (activityId: string, file: File) => {
    if (!profile) return null;
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${activityId}/ref_${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('activity-proofs')
        .upload(fileName, file);
        
      if (uploadError) throw uploadError;
      
      const { data: publicUrlData } = supabase.storage
        .from('activity-proofs')
        .getPublicUrl(fileName);
        
      return publicUrlData.publicUrl;
    } catch (err: any) {
      toast.error({ title: 'Error al subir foto', description: err.message });
      return null;
    }
  };

  const updateActivity = async (id: string, fields: { titulo?: string; descripcion?: string; asignado_a?: string | null; tipo?: 'unica' | 'rutinaria', reference_image?: string | null }) => {
    try {
      const { data, error } = await supabase.from('activities')
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchActivities();
      toast.success({ title: 'Actividad actualizada' });
      return data;
    } catch (err: any) {
      toast.error({ title: 'Error al actualizar', description: err.message });
      return null;
    }
  };

  const deleteActivity = async (id: string) => {
    try {
      const { error } = await supabase.from('activities').delete().eq('id', id);
      if (error) throw error;
      setActivities(prev => prev.filter(a => a.id !== id));
      toast.success({ title: 'Actividad eliminada' });
      return true;
    } catch (err: any) {
      toast.error({ title: 'Error al eliminar', description: err.message });
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
    getProofs,
    deleteProof,
  };
}
