import { ListRestart, Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Activity } from '@/lib/types';
import type { ActivityWithAssignee } from '@/lib/activityTypes';
import { Pagination } from '@/components/ui/Pagination';
import { ResponsabilidadCard } from '@/components/ui/ResponsabilidadCard';
import { getResponsibilityContent } from '@/components/ui/responsibilityContent';
import './ResponsibilitiesSection.css';

interface ResponsibilitiesPagination {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPrev: () => void;
  onNext: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
}

export interface AssignmentSectionCopy {
  headingId: string;
  panelId: string;
  title: string;
  emptyTitle: string;
  adminEmptyDescription: string;
  assigneeEmptyDescription: string;
  listLabel: string;
  paginationLabel: string;
}

export interface ResponsibilitiesSectionProps {
  responsibilities: Activity[];
  pageItems: Activity[];
  isAdmin: boolean;
  currentUserId?: string;
  pagination: ResponsibilitiesPagination;
  isNew: (activity: Activity) => boolean;
  onCreate: () => void;
  onOpen: (activity: Activity) => void;
  copy?: AssignmentSectionCopy;
}

const RESPONSIBILITIES_COPY: AssignmentSectionCopy = {
  headingId: 'responsibilities-heading',
  panelId: 'responsabilidades-panel',
  title: 'Responsabilidades',
  emptyTitle: 'Sin responsabilidades',
  adminEmptyDescription: 'Crea una actividad tipo "Responsabilidad" para asignarla.',
  assigneeEmptyDescription: 'Aún no tienes responsabilidades asignadas.',
  listLabel: 'Responsabilidades',
  paginationLabel: 'Paginación de responsabilidades',
};

const RESPONSIBILITIES_COPY_EN: AssignmentSectionCopy = {
  ...RESPONSIBILITIES_COPY,
  title: 'Responsibilities',
  emptyTitle: 'No responsibilities',
  adminEmptyDescription: 'Create a "Responsibility" activity to assign it.',
  assigneeEmptyDescription: 'You have no assigned responsibilities yet.',
  listLabel: 'Responsibilities',
  paginationLabel: 'Responsibility pages',
};

export function ResponsibilitiesSection({
  responsibilities,
  pageItems,
  isAdmin,
  currentUserId,
  pagination,
  isNew,
  onCreate,
  onOpen,
  copy: suppliedCopy,
}: ResponsibilitiesSectionProps) {
  const { language } = useLanguage();
  const copy = suppliedCopy ?? (language === 'en' ? RESPONSIBILITIES_COPY_EN : RESPONSIBILITIES_COPY);

  return (
    <section className="responsibilities-section" aria-labelledby={copy.headingId}>
      <header className="responsibilities-section__header">
        <div className="responsibilities-section__heading">
          <h2 id={copy.headingId} className="responsibilities-section__title">
            {copy.title}
          </h2>
          <p className="responsibilities-section__subtitle type-body-sm text-muted">
            {language === 'en' ? 'Recurring' : 'Recurrentes'}
          </p>
        </div>

        {isAdmin && (
          <button type="button" className="btn-primary btn-sm activities-create-action" onClick={onCreate}>
            <Plus size="var(--icon-size-sm)" aria-hidden="true" />
            <span>{language === 'en' ? 'Create' : 'Crear'}</span>
          </button>
        )}
      </header>

      <div id={copy.panelId} className="responsibilities-section__panel">
        {responsibilities.length === 0 ? (
          <div className="responsibilities-section__empty">
            <ListRestart
              size="var(--icon-size-xxl)"
              className="responsibilities-section__empty-icon"
              aria-hidden="true"
            />
            <p className="responsibilities-section__empty-title">{copy.emptyTitle}</p>
            <p className="responsibilities-section__empty-description">
              {isAdmin ? copy.adminEmptyDescription : copy.assigneeEmptyDescription}
            </p>
          </div>
        ) : (
          <div className="assignment-results">
            <ul className="responsibilities-section__grid" aria-label={copy.listLabel}>
              {pageItems.map((activity) => {
                const content = getResponsibilityContent(activity);
                const activityWithAssignee = activity as ActivityWithAssignee;
                const assignee = activity.asignado_a
                  ? {
                      id: activity.asignado_a,
                      display_name: activityWithAssignee.asignado_a_profile?.display_name,
                      username: activityWithAssignee.asignado_a_profile?.username,
                    }
                  : undefined;

                return (
                  <ResponsabilidadCard
                    key={activity.id}
                    title={activity.titulo}
                    description={content.description}
                    area={content.area}
                    assignee={assignee}
                    isNew={isNew(activity)}
                    currentUserId={currentUserId}
                    onOpen={() => onOpen(activity)}
                  />
                );
              })}
            </ul>

            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={pagination.onPageChange}
              onPrev={pagination.onPrev}
              onNext={pagination.onNext}
              canGoPrev={pagination.canGoPrev}
              canGoNext={pagination.canGoNext}
              ariaLabel={copy.paginationLabel}
              hideOnSinglePage
            />
          </div>
        )}
      </div>
    </section>
  );
}
