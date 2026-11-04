import type { ComponentProps } from 'react';
import { CandidatePreview } from '@/components/ui/CandidatePreview';
import { CandidateAccessCard } from '@/components/ui/CandidateAccessCard';
import { CandidateModal } from '@/components/ui/CandidateModal';
import { FormSheet } from '@/components/ui/FormSheet';
import { HireCandidateModal } from '@/components/ui/HireCandidateModal';
import { Modal } from '@/components/ui/Modal';
import type { CandidateAccessCardData } from '@/lib/candidateAccessCard';
import type { Candidate, CandidateStatus } from '@/lib/types';
import type { Language } from '@/contexts/LanguageContext';
import type { CandidateModalMode } from '@/components/ui/candidateForm';

type CandidateModalProps = ComponentProps<typeof CandidateModal>;
type CandidatePreviewProps = ComponentProps<typeof CandidatePreview>;
type HireCandidateModalProps = ComponentProps<typeof HireCandidateModal>;

interface PipelineDialogsProps {
  accessCardData: CandidateAccessCardData | null;
  candidates: Candidate[];
  canDelete: boolean;
  isMobile: boolean;
  language: Language;
  modalMode: CandidateModalMode | null;
  onChangeStatus: (candidate: Candidate, status: CandidateStatus) => void;
  onCloseAccessCard: () => void;
  onCloseCandidate: () => void;
  onCloseHire: () => void;
  onClosePreview: () => void;
  onDeleteCandidate: NonNullable<CandidateModalProps['onDelete']>;
  onDeletePreview: CandidatePreviewProps['onDelete'];
  onEditCandidate: NonNullable<CandidatePreviewProps['onEdit']>;
  onHire: NonNullable<HireCandidateModalProps['onConfirm']>;
  onHireCandidate: CandidatePreviewProps['onHire'];
  onSave: NonNullable<CandidateModalProps['onSave']>;
  onViewPass: CandidatePreviewProps['onViewPass'];
  previewCandidate: Candidate | null;
  hireCandidate: Candidate | null;
  selectedCandidate: Candidate | null;
}

export function PipelineDialogs({
  accessCardData,
  candidates,
  canDelete,
  isMobile,
  language,
  modalMode,
  onChangeStatus,
  onCloseAccessCard,
  onCloseCandidate,
  onCloseHire,
  onClosePreview,
  onDeleteCandidate,
  onDeletePreview,
  onEditCandidate,
  onHire,
  onHireCandidate,
  onSave,
  onViewPass,
  previewCandidate,
  hireCandidate,
  selectedCandidate,
}: PipelineDialogsProps) {
  const en = language === 'en';
  const InterviewPassDialog = isMobile ? Modal : FormSheet;

  return (
    <>
      <CandidateModal
        isOpen={modalMode !== null}
        mode={modalMode ?? 'add'}
        candidate={selectedCandidate}
        candidates={candidates}
        onClose={onCloseCandidate}
        onSave={onSave}
        onDelete={onDeleteCandidate}
      />

      <InterviewPassDialog
        isOpen={accessCardData !== null}
        onClose={onCloseAccessCard}
        className="candidate-access-card-modal"
        size="sm"
        title={en ? 'Interview pass' : 'Pase de entrevista'}
      >
        {accessCardData && <CandidateAccessCard data={accessCardData} />}
      </InterviewPassDialog>

      <HireCandidateModal
        isOpen={hireCandidate !== null}
        candidate={hireCandidate}
        onClose={onCloseHire}
        onConfirm={onHire}
      />

      <CandidatePreview
        candidate={previewCandidate}
        isMobile={isMobile}
        canDelete={canDelete}
        onClose={onClosePreview}
        onEdit={onEditCandidate}
        onDelete={onDeletePreview}
        onViewPass={onViewPass}
        onHire={onHireCandidate}
        onStatusChange={onChangeStatus}
      />
    </>
  );
}
