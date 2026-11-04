import { useState, type FormEvent } from 'react';
import type { CreateActivityModalProps } from '@/components/ui/CreateActivityModal';
import { useTeamDirectory } from '@/features/team/TeamProvider';
import type { AssignableActivityType } from '@/lib/types';
import { playSound } from '@/lib/sound';
import type { useActivities } from '@/hooks/useActivities';
import { useActivityAssignmentOptions } from '@/features/activities/useActivityAssignmentOptions';

type ActivityMutations = Pick<
  ReturnType<typeof useActivities>,
  'createActivity' | 'updateActivity' | 'uploadReferenceImage' | 'removeReferenceImage'
>;

export function useActivityCreation(en: boolean, activityMutations: ActivityMutations) {
  const { members } = useTeamDirectory();
  const [createModalType, setCreateModalType] = useState<AssignableActivityType | null>(null);
  const [isCreateVacanteModalOpen, setIsCreateVacanteModalOpen] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [asignadoA, setAsignadoA] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [vacanteTitulo, setVacanteTitulo] = useState('');
  const [vacanteArea, setVacanteArea] = useState('');
  const [vacanteSeccion, setVacanteSeccion] = useState('');
  const [vacanteAsignadoA, setVacanteAsignadoA] = useState('');
  const [isCreatingVacancy, setIsCreatingVacancy] = useState(false);
  const [isAssigningVacancy, setIsAssigningVacancy] = useState(false);
  const [referenceImageFile, setReferenceImageFile] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
  const assignmentOptions = useActivityAssignmentOptions(en, members, vacanteArea, vacanteSeccion);

  const handleAssignVacancy = async (activityId: string, recruiterId: string) => {
    if (isAssigningVacancy) return;
    setIsAssigningVacancy(true);
    const updated = await activityMutations.updateActivity(activityId, {
      asignado_a: recruiterId || null,
    });
    playSound(updated ? 'success' : 'error');
    setIsAssigningVacancy(false);
    return Boolean(updated);
  };

  const handleCreateVacante = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedTitle = vacanteTitulo.trim();
    if (!normalizedTitle) return;

    setIsCreatingVacancy(true);
    const finalDescription = vacanteSeccion ? `${vacanteArea} - ${vacanteSeccion}` : vacanteArea;
    const activity = await activityMutations.createActivity(
      normalizedTitle,
      finalDescription,
      vacanteAsignadoA || null,
      'vacante',
    );

    setIsCreatingVacancy(false);
    playSound(activity ? 'success' : 'error');
    if (activity) {
      setIsCreateVacanteModalOpen(false);
      setVacanteTitulo('');
      setVacanteArea('');
      setVacanteSeccion('');
      setVacanteAsignadoA('');
    }
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedTitle = titulo.trim();
    if (!normalizedTitle || !createModalType) return;

    setIsCreating(true);
    const activity = await activityMutations.createActivity(
      normalizedTitle,
      descripcion,
      asignadoA || null,
      createModalType,
    );

    if (activity && referenceImageFile) {
      const url = await activityMutations.uploadReferenceImage(activity.id!, referenceImageFile);
      if (url) {
        const updated = await activityMutations.updateActivity(activity.id!, {
          reference_image: url,
        });
        if (!updated) await activityMutations.removeReferenceImage(activity.id!, url);
      }
    }

    setIsCreating(false);
    playSound(activity ? 'success' : 'error');
    if (activity) {
      setCreateModalType(null);
      setTitulo('');
      setDescripcion('');
      setAsignadoA('');
      setReferenceImageFile(null);
      setReferenceImagePreview(null);
    }
  };

  const createAssignmentModalProps: Omit<CreateActivityModalProps, 'isOpen'> = {
    onClose: () => {
      if (!isCreating) {
        playSound('close');
        setCreateModalType(null);
      }
    },
    isCreating,
    titulo,
    setTitulo,
    asignadoA,
    setAsignadoA: (value) => {
      playSound('select');
      setAsignadoA(value);
    },
    recruitersOptions: assignmentOptions.teamRecruiterOptions,
    descripcion,
    setDescripcion,
    referenceImagePreview,
    referenceImageFile,
    setReferenceImageFile: (file) => {
      playSound('select');
      setReferenceImageFile(file);
    },
    setReferenceImagePreview,
    onSubmit: handleCreate,
  };

  return {
    members,
    ...assignmentOptions,
    createModalType,
    setCreateModalType,
    isCreateVacanteModalOpen,
    setIsCreateVacanteModalOpen,
    isCreatingVacancy,
    vacanteArea,
    setVacanteArea,
    vacanteSeccion,
    setVacanteSeccion,
    vacanteTitulo,
    setVacanteTitulo,
    vacanteAsignadoA,
    setVacanteAsignadoA,
    isAssigningVacancy,
    handleAssignVacancy,
    handleCreateVacante,
    createAssignmentModalProps,
  };
}
