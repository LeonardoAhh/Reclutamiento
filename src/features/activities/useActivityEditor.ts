import { useState, type FormEvent, type MouseEvent } from 'react';
import { useActivities } from '@/hooks/useActivities';
import { useAuth } from '@/hooks/useAuth';
import type { Activity } from '@/lib/types';
import { playSound } from '@/lib/sound';

type ActivityEditorMutations = Pick<
  ReturnType<typeof useActivities>,
  'updateActivity' | 'deleteActivity' | 'uploadReferenceImage' | 'removeReferenceImage'
>;

export function useActivityEditor(
  activityMutations: ActivityEditorMutations,
  selectedActivity: Activity | null,
  setSelectedActivity: (activity: Activity | null) => void,
  setIsDetailModalOpen: (isOpen: boolean) => void,
) {
  const { profile } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [previewResponsibility, setPreviewResponsibility] = useState(false);
  const [editTitulo, setEditTitulo] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editAsignadoA, setEditAsignadoA] = useState('');
  const [editReferenceImageFile, setEditReferenceImageFile] = useState<File | null>(null);
  const [editReferenceImagePreview, setEditReferenceImagePreview] = useState<string | null>(null);
  const [editExistingReferenceImage, setEditExistingReferenceImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const openEdit = (activity: Activity, event?: MouseEvent) => {
    playSound('open');
    event?.stopPropagation();
    setPreviewResponsibility(false);
    setSelectedActivity(activity);
    setEditTitulo(activity.titulo);
    setEditDescripcion(activity.descripcion || '');
    setEditAsignadoA(activity.asignado_a || '');
    setEditReferenceImageFile(null);
    setEditReferenceImagePreview(null);
    setEditExistingReferenceImage(activity.reference_image || null);
    setIsEditModalOpen(true);
  };

  const openResponsibility = (activity: Activity) => {
    openEdit(activity);
    setPreviewResponsibility(true);
  };

  const handleEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (profile?.role !== 'admin') return;
    const normalizedTitle = editTitulo.trim();
    if (!selectedActivity || !normalizedTitle) return;
    setIsEditing(true);

    let newImageUrl = editExistingReferenceImage;
    if (editReferenceImageFile) {
      const url = await activityMutations.uploadReferenceImage(selectedActivity.id!, editReferenceImageFile);
      if (!url) {
        playSound('error');
        setIsEditing(false);
        return;
      }
      newImageUrl = url;
    }

    const updatedActivity = await activityMutations.updateActivity(selectedActivity.id!, {
      titulo: normalizedTitle,
      descripcion: editDescripcion,
      asignado_a: editAsignadoA || null,
      reference_image: newImageUrl,
    });
    if (updatedActivity && selectedActivity.reference_image && selectedActivity.reference_image !== newImageUrl) {
      await activityMutations.removeReferenceImage(selectedActivity.id!, selectedActivity.reference_image);
    } else if (!updatedActivity && editReferenceImageFile && newImageUrl) {
      await activityMutations.removeReferenceImage(selectedActivity.id!, newImageUrl);
    }
    setIsEditing(false);
    playSound(updatedActivity ? 'success' : 'error');
    if (updatedActivity) {
      setIsEditModalOpen(false);
      setPreviewResponsibility(false);
      setSelectedActivity(null);
    }
  };

  const handleDelete = async (activity: Activity) => {
    if (!activity.id) return false;
    const deleted = await activityMutations.deleteActivity(activity.id);
    playSound(deleted ? 'success' : 'error');
    if (deleted) {
      setIsEditModalOpen(false);
      setPreviewResponsibility(false);
      setIsDetailModalOpen(false);
      setSelectedActivity(null);
    }
    return deleted;
  };

  return {
    isEditModalOpen,
    setIsEditModalOpen,
    previewResponsibility,
    setPreviewResponsibility,
    editTitulo,
    setEditTitulo,
    editDescripcion,
    setEditDescripcion,
    editAsignadoA,
    setEditAsignadoA,
    editReferenceImageFile,
    setEditReferenceImageFile,
    editReferenceImagePreview,
    setEditReferenceImagePreview,
    editExistingReferenceImage,
    setEditExistingReferenceImage,
    isEditing,
    openEdit,
    openResponsibility,
    handleEdit,
    handleDelete,
  };
}
