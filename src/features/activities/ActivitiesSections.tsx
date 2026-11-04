import { BriefcaseBusiness, ClipboardPenLine, ListChecks } from 'lucide-react';
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '@/components/ui/Tabs';
import { ActivitiesSection } from '@/components/ui/ActivitiesSection';
import { ResponsibilitiesSection } from '@/components/ui/ResponsibilitiesSection';
import { VacancyAssignmentSection } from '@/components/ui/VacancyAssignmentSection';
import type { UsePaginationResult } from '@/hooks/usePagination';
import type { Activity, AuthorizedPosition } from '@/lib/types';
import type { ActivityStatusFilter } from '@/lib/activityTypes';
import type { Option } from '@/components/ui/CustomSelect';
import { playSound } from '@/lib/sound';

interface ActivityPages {
  responsibilities: UsePaginationResult<Activity>;
  activities: UsePaginationResult<Activity>;
}

interface ActivitiesSectionsProps {
  en: boolean;
  initialTab: 'vacancies' | 'responsibilities' | 'activities';
  isAdmin: boolean;
  currentUserId?: string;
  vacancies: Activity[];
  positions: AuthorizedPosition[];
  recruiterOptions: readonly Option[];
  isAssigningVacancy: boolean;
  responsibilities: Activity[];
  activities: Activity[];
  filteredActivities: Activity[];
  statusFilter: ActivityStatusFilter;
  statusCounts: Record<ActivityStatusFilter, number>;
  pages: ActivityPages;
  isNew: (activity: Activity) => boolean;
  onAssignVacancy: (vacancyId: string, assigneeId: string) => void;
  onDeleteVacancy: (vacancy: Activity) => Promise<boolean>;
  onCreateVacancy: () => void;
  onCreateResponsibility: () => void;
  onCreateActivity: () => void;
  onOpenResponsibility: (activity: Activity) => void;
  onOpenActivity: (activity: Activity) => void;
  onStatusFilterChange: (status: ActivityStatusFilter) => void;
  onClearFilters: () => void;
}

export function ActivitiesSections({
  en,
  initialTab,
  isAdmin,
  currentUserId,
  vacancies,
  positions,
  recruiterOptions,
  isAssigningVacancy,
  responsibilities,
  activities,
  filteredActivities,
  statusFilter,
  statusCounts,
  pages,
  isNew,
  onAssignVacancy,
  onDeleteVacancy,
  onCreateVacancy,
  onCreateResponsibility,
  onCreateActivity,
  onOpenResponsibility,
  onOpenActivity,
  onStatusFilterChange,
  onClearFilters,
}: ActivitiesSectionsProps) {
  return (
    <TabsRoot onValueChange={() => playSound('select')} defaultValue={initialTab}>
      <TabsList
        className="actividades-tabs__list"
        variant="underline"
        aria-label={en ? 'Activity sections' : 'Secciones de actividades'}
      >
        <TabsTrigger value="vacancies">
          <BriefcaseBusiness size="var(--icon-size-sm)" aria-hidden="true" />
          {en ? 'Vacancies' : 'Vacantes'}
        </TabsTrigger>
        <TabsTrigger value="responsibilities">
          <ListChecks size="var(--icon-size-sm)" aria-hidden="true" />
          {en ? 'Responsibilities' : 'Responsabilidades'}
        </TabsTrigger>
        <TabsTrigger value="activities">
          <ClipboardPenLine size="var(--icon-size-sm)" aria-hidden="true" />
          {en ? 'Activities' : 'Actividades'}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="vacancies">
        <VacancyAssignmentSection
          vacancies={vacancies}
          positions={positions}
          isAdmin={isAdmin}
          isNew={isNew}
          onCreate={onCreateVacancy}
          recruiterOptions={recruiterOptions}
          isAssigning={isAssigningVacancy}
          onAssign={onAssignVacancy}
          onDelete={onDeleteVacancy}
        />
      </TabsContent>

      <TabsContent value="responsibilities">
        <ResponsibilitiesSection
          responsibilities={responsibilities}
          pageItems={pages.responsibilities.pageItems}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          pagination={{
            currentPage: pages.responsibilities.currentPage,
            totalPages: pages.responsibilities.totalPages,
            onPageChange: (page) => {
              playSound('navigate');
              pages.responsibilities.goToPage(page);
            },
            onPrev: () => {
              playSound('navigate', { direction: 'back' });
              pages.responsibilities.prevPage();
            },
            onNext: () => {
              playSound('navigate');
              pages.responsibilities.nextPage();
            },
            canGoPrev: pages.responsibilities.canGoPrev,
            canGoNext: pages.responsibilities.canGoNext,
          }}
          isNew={isNew}
          onCreate={onCreateResponsibility}
          onOpen={onOpenResponsibility}
        />
      </TabsContent>

      <TabsContent value="activities">
        <ActivitiesSection
          activities={activities}
          filteredActivities={filteredActivities}
          pageItems={pages.activities.pageItems}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          statusFilter={statusFilter}
          statusCounts={statusCounts}
          pagination={{
            currentPage: pages.activities.currentPage,
            totalPages: pages.activities.totalPages,
            onPageChange: (page) => {
              playSound('navigate');
              pages.activities.goToPage(page);
            },
            onPrev: () => {
              playSound('navigate', { direction: 'back' });
              pages.activities.prevPage();
            },
            onNext: () => {
              playSound('navigate');
              pages.activities.nextPage();
            },
            canGoPrev: pages.activities.canGoPrev,
            canGoNext: pages.activities.canGoNext,
          }}
          isNew={isNew}
          onStatusFilterChange={onStatusFilterChange}
          onClearFilters={onClearFilters}
          onCreate={onCreateActivity}
          onOpen={onOpenActivity}
        />
      </TabsContent>
    </TabsRoot>
  );
}
