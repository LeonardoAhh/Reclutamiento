import { useRef, useState, type ChangeEvent } from 'react';
import { useActivities } from '@/hooks/useActivities';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Activity, ActivityProof, ActivityStatus } from '@/lib/types';
import { toast } from '@/lib/notify';
import { playSound } from '@/lib/sound';

type ActivityDetailsMutations = Pick<
  ReturnType<typeof useActivities>,
  'updateActivityStatus' | 'uploadProof' | 'getProofs' | 'deleteProof'
>;

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function useActivityDetails(activityMutations: ActivityDetailsMutations) {
  const { profile } = useAuth();
  const { language } = useLanguage();
  const en = language === 'en';
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [proofs, setProofs] = useState<ActivityProof[]>([]);
  const [proofsLoading, setProofsLoading] = useState(false);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const proofsRequestRef = useRef(0);
  const canSubmitProgress =
    profile?.role === 'admin' || Boolean(profile?.id && selectedActivity?.asignado_a === profile.id);

  const closeDetails = () => {
    playSound('close');
    proofsRequestRef.current += 1;
    setIsDetailModalOpen(false);
  };

  const invalidateProofRequest = () => {
    proofsRequestRef.current += 1;
  };

  const openDetails = async (activity: Activity) => {
    playSound('open');
    const requestId = ++proofsRequestRef.current;
    setSelectedActivity(activity);
    setProofs([]);
    setProofsLoading(true);
    setIsDetailModalOpen(true);

    const nextProofs = await activityMutations.getProofs(activity.id!);
    if (requestId === proofsRequestRef.current) {
      setProofs(nextProofs);
      setProofsLoading(false);
    }
  };

  const handleStatusChange = async (newStatusString: string) => {
    if (!selectedActivity || !canSubmitProgress || isUpdatingStatus) return;

    const previousStatus = selectedActivity.estado;
    const newStatus = newStatusString as ActivityStatus;
    setSelectedActivity({ ...selectedActivity, estado: newStatus });
    setIsUpdatingStatus(true);

    const updated = await activityMutations.updateActivityStatus(selectedActivity.id!, newStatus);
    playSound(updated ? 'success' : 'error');
    setIsUpdatingStatus(false);
    if (updated) {
      setSelectedActivity(updated as Activity);
    } else {
      setSelectedActivity((current) => (current ? { ...current, estado: previousStatus } : current));
    }
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!selectedActivity || !canSubmitProgress || !event.target.files || event.target.files.length === 0) {
      return;
    }
    const file = event.target.files[0];

    if (file.size > MAX_FILE_SIZE) {
      playSound('warning');
      toast.error({
        title: en ? 'File too large' : 'Archivo demasiado grande',
        description: en
          ? `The limit is 10 MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)} MB.`
          : `El límite es 10 MB. Tu archivo pesa ${(file.size / (1024 * 1024)).toFixed(1)} MB.`,
      });
      event.target.value = '';
      return;
    }

    setIsUploadingProof(true);
    const proof = await activityMutations.uploadProof(selectedActivity.id!, file);
    playSound(proof ? 'success' : 'error');
    if (proof) setProofs((previous) => [proof, ...previous]);
    setIsUploadingProof(false);
    event.target.value = '';
  };

  const handleDeleteProof = async (proofId: string, url: string) => {
    if (profile?.role !== 'admin') return false;
    const deleted = await activityMutations.deleteProof(proofId, url);
    playSound(deleted ? 'success' : 'error');
    if (deleted) {
      setProofs((previous) => previous.filter((proof) => proof.id !== proofId));
    }
    return deleted;
  };

  return {
    isDetailModalOpen,
    setIsDetailModalOpen,
    selectedActivity,
    setSelectedActivity,
    proofs,
    proofsLoading,
    isUploadingProof,
    isUpdatingStatus,
    canSubmitProgress,
    invalidateProofRequest,
    closeDetails,
    openDetails,
    handleStatusChange,
    handleFileUpload,
    handleDeleteProof,
  };
}
