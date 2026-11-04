import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeading } from '@/components/layout/PageHeading';
import { BoneyardSkeleton } from '@/components/ui/BoneyardSkeleton';
import { useActivities } from '@/hooks/useActivities';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePagination } from '@/hooks/usePagination';
import { isBoneyardBuild } from '@/lib/boneyard';
import { BONEYARD_SAMPLE_ACTIVITIES } from '@/lib/boneyardFixtures';
import { ActivityDialogs } from '@/features/activities/ActivitiesDialogs';
import { ActivitiesSections } from '@/features/activities/ActivitiesSections';
import { useActivityCreation } from '@/features/activities/useActivityCreation';
import { useActivityDetails } from '@/features/activities/useActivityDetails';
import { useActivityEditor } from '@/features/activities/useActivityEditor';
import { useLastActivitiesVisit } from '@/features/activities/useLastActivitiesVisit';
import type { ActivityStatusFilter, ActivityWithAssignee } from '@/lib/activityTypes';
import { bindSoundInteractions, playSound } from '@/lib/sound';
import './Actividades.css';

export function Actividades() {
  useEffect(() => bindSoundInteractions(document), []);
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const { profile } = useAuth();
  const en = language === 'en';
  const isAdmin = profile?.role === 'admin';
  const isNewActivity = useLastActivitiesVisit();
  const [statusFilter, setStatusFilter] = useState<ActivityStatusFilter>(() => {
    const requested = searchParams.get('status');
    return requested === 'todas' ||
      requested === 'pendiente' ||
      requested === 'en_proceso' ||
      requested === 'completada'
      ? requested
      : 'pendiente';
  });

  const {
    activities: liveActivities,
    loading,
    createActivity,
    updateActivity,
    updateActivityStatus,
    deleteActivity,
    uploadProof,
    uploadReferenceImage,
    removeReferenceImage,
    getProofs,
    deleteProof,
  } = useActivities();
  const activities = useMemo(
    () => (isBoneyardBuild() && liveActivities.length === 0 ? [...BONEYARD_SAMPLE_ACTIVITIES] : liveActivities),
    [liveActivities],
  );
  const activityMutations = {
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
  const creation = useActivityCreation(en, activityMutations);
  const details = useActivityDetails(activityMutations);
  const editor = useActivityEditor(
    activityMutations,
    details.selectedActivity,
    details.setSelectedActivity,
    details.setIsDetailModalOpen,
  );

  const vacancies = useMemo(() => {
    const list = activities.filter((activity) => activity.tipo === 'vacante');
    list.sort((first, second) => {
      const firstIsNew = isNewActivity(first);
      const secondIsNew = isNewActivity(second);
      if (firstIsNew && !secondIsNew) return -1;
      if (!firstIsNew && secondIsNew) return 1;
      if (!first.asignado_a && second.asignado_a) return -1;
      if (first.asignado_a && !second.asignado_a) return 1;

      const firstWithAssignee = first as ActivityWithAssignee;
      const secondWithAssignee = second as ActivityWithAssignee;
      if (first.asignado_a && second.asignado_a && first.asignado_a !== second.asignado_a) {
        const firstName =
          firstWithAssignee.asignado_a_profile?.display_name || firstWithAssignee.asignado_a_profile?.username || 'Z';
        const secondName =
          secondWithAssignee.asignado_a_profile?.display_name || secondWithAssignee.asignado_a_profile?.username || 'Z';
        const nameComparison = firstName.localeCompare(secondName, 'es');
        if (nameComparison !== 0) return nameComparison;
      }

      const titleComparison = (first.titulo || '').localeCompare(second.titulo || '', 'es');
      if (titleComparison !== 0) return titleComparison;
      return (first.descripcion || '').localeCompare(second.descripcion || '', 'es');
    });
    return list;
  }, [activities, isNewActivity]);

  const responsibilities = useMemo(() => {
    const list = activities.filter((activity) => activity.tipo === 'rutinaria');
    return list.sort((first, second) => {
      const firstIsNew = isNewActivity(first);
      const secondIsNew = isNewActivity(second);
      if (firstIsNew && !secondIsNew) return -1;
      if (!firstIsNew && secondIsNew) return 1;
      return (second.created_at ?? '').localeCompare(first.created_at ?? '');
    });
  }, [activities, isNewActivity]);

  const allActivities = activities.filter((activity) => activity.tipo === 'unica' || !activity.tipo);
  const statusCounts = useMemo(
    () => ({
      todas: allActivities.length,
      pendiente: allActivities.filter((activity) => activity.estado === 'pendiente').length,
      en_proceso: allActivities.filter((activity) => activity.estado === 'en_proceso').length,
      completada: allActivities.filter((activity) => activity.estado === 'completada').length,
    }),
    [allActivities],
  );
  const filteredActivities = useMemo(() => {
    let result = allActivities;
    if (statusFilter !== 'todas') {
      result = result.filter((activity) => activity.estado === statusFilter);
    }
    return [...result].sort((first, second) => {
      const firstIsNew = isNewActivity(first);
      const secondIsNew = isNewActivity(second);
      if (firstIsNew && !secondIsNew) return -1;
      if (!firstIsNew && secondIsNew) return 1;
      return (second.created_at ?? '').localeCompare(first.created_at ?? '');
    });
  }, [allActivities, statusFilter, isNewActivity]);

  const responsibilityPages = usePagination(responsibilities, 9);
  const activityPages = usePagination(filteredActivities, 9);
  const initialTab =
    searchParams.get('tab') === 'responsibilities'
      ? 'responsibilities'
      : searchParams.get('tab') === 'activities'
        ? 'activities'
        : 'vacancies';

  return (
    <BoneyardSkeleton
      name="actividades-page"
      loading={loading}
      loadingLabel={en ? 'Loading activities...' : 'Cargando actividades...'}
    >
      <main className="actividades-page container">
        <PageHeading className="app-page-title">{en ? 'Activities' : 'Actividades'}</PageHeading>
        <ActivitiesSections
          en={en}
          initialTab={initialTab}
          isAdmin={isAdmin}
          currentUserId={profile?.id}
          vacancies={vacancies}
          positions={creation.positions}
          recruiterOptions={creation.vacancyRecruiterOptions}
          isAssigningVacancy={creation.isAssigningVacancy}
          responsibilities={responsibilities}
          activities={allActivities}
          filteredActivities={filteredActivities}
          statusFilter={statusFilter}
          statusCounts={statusCounts}
          pages={{
            responsibilities: responsibilityPages,
            activities: activityPages,
          }}
          isNew={isNewActivity}
          onAssignVacancy={(vacancyId, recruiterId) => {
            void creation.handleAssignVacancy(vacancyId, recruiterId);
          }}
          onDeleteVacancy={async (vacancy) => {
            if (!vacancy.id) return false;
            const deleted = await deleteActivity(vacancy.id);
            playSound(deleted ? 'success' : 'error');
            return deleted;
          }}
          onCreateVacancy={() => {
            playSound('open');
            creation.setIsCreateVacanteModalOpen(true);
          }}
          onCreateResponsibility={() => {
            playSound('open');
            creation.setCreateModalType('rutinaria');
          }}
          onCreateActivity={() => {
            playSound('open');
            creation.setCreateModalType('unica');
          }}
          onOpenResponsibility={editor.openResponsibility}
          onOpenActivity={details.openDetails}
          onStatusFilterChange={(status) => {
            if (status !== statusFilter) playSound('select');
            setStatusFilter(status);
          }}
          onClearFilters={() => {
            playSound('select');
            setStatusFilter('todas');
          }}
        />
        <ActivityDialogs creation={creation} details={details} editor={editor} statusFilter={statusFilter} />
      </main>
    </BoneyardSkeleton>
  );
}
