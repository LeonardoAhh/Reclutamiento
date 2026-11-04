import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useLanguage } from '@/contexts/LanguageContext';
import { ModalPresentationProvider } from '@/components/ui/ModalPresentation';
import { CreateActivityModal } from '@/components/ui/CreateActivityModal';
import { CreateResponsibilityModal } from '@/components/ui/CreateResponsibilityModal';
import { CreateVacancyModal } from '@/components/ui/CreateVacancyModal';
import { EditActivityModal } from '@/components/ui/EditActivityModal';
import { TaskDetailsModal } from '@/components/ui/TaskDetailsModal';
import { playSound } from '@/lib/sound';
import { getActivityImagePath } from '@/pages/activityImageNavigation';
import type { ActivityStatusFilter } from '@/lib/activityTypes';
import type { useActivityCreation } from '@/features/activities/useActivityCreation';
import type { useActivityDetails } from '@/features/activities/useActivityDetails';
import type { useActivityEditor } from '@/features/activities/useActivityEditor';

interface ActivityDialogsProps {
  creation: ReturnType<typeof useActivityCreation>;
  details: ReturnType<typeof useActivityDetails>;
  editor: ReturnType<typeof useActivityEditor>;
  statusFilter: ActivityStatusFilter;
}

function isImage(filename: string): boolean {
  if (!filename) return false;
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension);
}

export function ActivityDialogs({ creation, details, editor, statusFilter }: ActivityDialogsProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { profile } = useAuth();
  const en = language === 'en';
  const isAdmin = profile?.role === 'admin';
  const selectedActivity = details.selectedActivity;

  return (
    <>
      <ModalPresentationProvider value={isMobile ? 'modal' : 'sheet'}>
        <CreateVacancyModal
          isOpen={creation.isCreateVacanteModalOpen}
          onClose={() => {
            if (!creation.isCreatingVacancy) {
              playSound('close');
              creation.setIsCreateVacanteModalOpen(false);
            }
          }}
          isCreating={creation.isCreatingVacancy}
          area={creation.vacanteArea}
          onAreaChange={(value) => {
            playSound('select');
            creation.setVacanteArea(value);
            creation.setVacanteSeccion('');
            creation.setVacanteTitulo('');
          }}
          areasOptions={creation.areasOptions}
          seccion={creation.vacanteSeccion}
          onSeccionChange={(value) => {
            playSound('select');
            creation.setVacanteSeccion(value);
            creation.setVacanteTitulo('');
          }}
          seccionesOptions={creation.seccionesOptions}
          puesto={creation.vacanteTitulo}
          onPuestoChange={(value) => {
            playSound('select');
            creation.setVacanteTitulo(value);
          }}
          puestosOptions={creation.puestosOptions}
          asignadoA={creation.vacanteAsignadoA}
          onAsignadoAChange={(value) => {
            playSound('select');
            creation.setVacanteAsignadoA(value);
          }}
          recruitersOptions={[
            { value: '', label: en ? 'Unassigned' : 'Sin asignar' },
            ...creation.recruiters.map((recruiter) => ({
              value: recruiter.id,
              label: recruiter.username,
            })),
          ]}
          onSubmit={creation.handleCreateVacante}
        />

        <CreateActivityModal {...creation.createAssignmentModalProps} isOpen={creation.createModalType === 'unica'} />

        <CreateResponsibilityModal
          {...creation.createAssignmentModalProps}
          isOpen={creation.createModalType === 'rutinaria'}
        />

        <EditActivityModal
          isOpen={editor.isEditModalOpen}
          onClose={() => {
            if (!editor.isEditing) {
              playSound('close');
              editor.setIsEditModalOpen(false);
              editor.setPreviewResponsibility(false);
            }
          }}
          isEditing={editor.isEditing}
          activityType={
            selectedActivity?.tipo === 'rutinaria' || selectedActivity?.tipo === 'soporte'
              ? selectedActivity.tipo
              : 'unica'
          }
          titulo={editor.editTitulo}
          setTitulo={editor.setEditTitulo}
          asignadoA={editor.editAsignadoA}
          setAsignadoA={(value) => {
            playSound('select');
            editor.setEditAsignadoA(value);
          }}
          recruitersOptions={
            selectedActivity?.asignado_a &&
            !creation.teamRecruiterOptions.some((option) => option.value === selectedActivity.asignado_a)
              ? [
                  ...creation.teamRecruiterOptions,
                  {
                    value: selectedActivity.asignado_a,
                    label: `${
                      creation.members.find((member) => member.profile_id === selectedActivity.asignado_a)?.full_name ??
                      (en ? 'Current assignment' : 'Asignación actual')
                    } (${en ? 'inactive' : 'inactivo'})`,
                  },
                ]
              : creation.teamRecruiterOptions
          }
          descripcion={editor.editDescripcion}
          setDescripcion={editor.setEditDescripcion}
          referenceImagePreview={editor.editReferenceImagePreview}
          referenceImageFile={editor.editReferenceImageFile}
          existingReferenceImage={editor.editExistingReferenceImage}
          setReferenceImageFile={(file) => {
            playSound('select');
            editor.setEditReferenceImageFile(file);
          }}
          setReferenceImagePreview={editor.setEditReferenceImagePreview}
          setExistingReferenceImage={editor.setEditExistingReferenceImage}
          onSubmit={editor.handleEdit}
          previewActivity={editor.previewResponsibility ? selectedActivity : null}
          previewAssignee={
            selectedActivity?.asignado_a
              ? {
                  id: selectedActivity.asignado_a,
                  display_name: creation.members.find((member) => member.profile_id === selectedActivity.asignado_a)
                    ?.full_name,
                }
              : undefined
          }
          currentUserId={profile?.id}
          onStartEditing={
            isAdmin
              ? () => {
                  playSound('select');
                  editor.setPreviewResponsibility(false);
                }
              : undefined
          }
          onDelete={
            isAdmin && editor.previewResponsibility && selectedActivity
              ? () => editor.handleDelete(selectedActivity)
              : undefined
          }
        />
      </ModalPresentationProvider>

      <ModalPresentationProvider value={isMobile ? 'modal' : 'sheet'}>
        <TaskDetailsModal
          isOpen={details.isDetailModalOpen}
          onClose={details.closeDetails}
          activity={selectedActivity}
          statusFilter={statusFilter}
          onStatusChange={details.handleStatusChange}
          isUpdatingStatus={details.isUpdatingStatus}
          onImageOpen={(proofId) => {
            if (selectedActivity?.id) {
              playSound('navigate');
              navigate(getActivityImagePath(selectedActivity.id, 'activities', proofId, statusFilter));
            }
          }}
          proofsLoading={details.proofsLoading}
          proofs={details.proofs}
          isImage={isImage}
          isAdmin={isAdmin}
          canSubmitProgress={details.canSubmitProgress}
          onEdit={
            isAdmin && selectedActivity
              ? () => {
                  details.invalidateProofRequest();
                  details.setIsDetailModalOpen(false);
                  editor.openEdit(selectedActivity);
                }
              : undefined
          }
          onDelete={isAdmin && selectedActivity ? () => editor.handleDelete(selectedActivity) : undefined}
          onDeleteProof={details.handleDeleteProof}
          onUploadProof={details.handleFileUpload}
          isUploadingProof={details.isUploadingProof}
        />
      </ModalPresentationProvider>
    </>
  );
}
