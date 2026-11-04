import { useState } from 'react';
import { BriefcaseBusiness, EllipsisVertical, Plus, Trash2, UserRoundPlus } from 'lucide-react';
import type { Activity, AuthorizedPosition } from '@/lib/types';
import type { ActivityWithAssignee } from '@/lib/activityTypes';
import { useLanguage } from '@/contexts/LanguageContext';
import { AssignmentCard } from '@/components/ui/AssignmentCard';
import type { Option } from '@/components/ui/CustomSelect';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import './VacancyAssignmentSection.css';
import { playSound } from '@/lib/sound';

interface VacancyAssignmentSectionProps {
  vacancies: Activity[];
  positions: AuthorizedPosition[];
  isAdmin: boolean;
  isNew: (vacancy: Activity) => boolean;
  onCreate: () => void;
  recruiterOptions: readonly Option[];
  isAssigning: boolean;
  onAssign: (vacancyId: string, assigneeId: string) => void;
  onDelete: (vacancy: Activity) => Promise<boolean>;
}

interface VacancyGroup {
  key: string;
  label: string;
  assigned: boolean;
  vacancies: Activity[];
}

export function VacancyAssignmentSection({
  vacancies,
  positions,
  isAdmin,
  isNew,
  onCreate,
  recruiterOptions,
  isAssigning,
  onAssign,
  onDelete,
}: VacancyAssignmentSectionProps) {
  const { language } = useLanguage();
  const en = language === 'en';
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const confirmDelete = async (vacancy: Activity) => {
    if (!vacancy.id || deletingId) return;
    if (confirmingDeleteId !== vacancy.id) {
      playSound('warning');
      setConfirmingDeleteId(vacancy.id);
      return;
    }
    setDeletingId(vacancy.id);
    try {
      if (await onDelete(vacancy)) setConfirmingDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  };
  const vacancyGroups = Array.from(
    vacancies
      .reduce<Map<string, VacancyGroup>>((groups, vacancy) => {
        const vacancyWithAssignee = vacancy as ActivityWithAssignee;
        const key = vacancy.asignado_a ?? 'unassigned';
        const label = vacancy.asignado_a
          ? vacancyWithAssignee.asignado_a_profile?.display_name ||
            vacancyWithAssignee.asignado_a_profile?.username ||
            (en ? 'Unnamed' : 'Sin nombre')
          : en
            ? 'Unassigned'
            : 'Sin asignar';
        const group = groups.get(key);

        if (group) {
          group.vacancies.push(vacancy);
        } else {
          groups.set(key, {
            key,
            label,
            assigned: Boolean(vacancy.asignado_a),
            vacancies: [vacancy],
          });
        }

        return groups;
      }, new Map())
      .values(),
  ).sort((first, second) => {
    if (first.assigned !== second.assigned) return first.assigned ? -1 : 1;
    return first.label.localeCompare(second.label, 'es', {
      sensitivity: 'base',
    });
  });

  return (
    <section className="vacancy-assignment-section" aria-labelledby="vacancy-assignment-heading">
      <header className="vacancy-assignment-section__header">
        <div className="vacancy-assignment-section__heading">
          <h2 id="vacancy-assignment-heading" className="vacancy-assignment-section__title">
            {isAdmin ? (en ? 'Vacancy assignments' : 'Asignación de Vacantes') : en ? 'Your vacancies' : 'Tus Vacantes'}
          </h2>
          <p className="vacancy-assignment-section__subtitle type-body-sm text-muted">
            {en ? 'By recruiter' : 'Por reclutador'}
          </p>
        </div>

        {isAdmin && (
          <button type="button" className="btn-primary btn-sm activities-create-action" onClick={onCreate}>
            <Plus size="var(--icon-size-sm)" aria-hidden="true" />
            <span>{en ? 'Create' : 'Crear'}</span>
          </button>
        )}
      </header>

      {vacancies.length === 0 ? (
        <div className="vacancy-assignment-section__empty">
          <BriefcaseBusiness
            size="var(--icon-size-xxl)"
            className="vacancy-assignment-section__empty-icon"
            aria-hidden="true"
          />
          <p className="vacancy-assignment-section__empty-title">{en ? 'No vacancies' : 'Sin vacantes'}</p>
          <p className="vacancy-assignment-section__empty-description">
            {en ? 'Create a new vacancy assignment manually.' : 'Crea una nueva asignación de vacante manualmente.'}
          </p>
        </div>
      ) : (
        <div className="vacancy-assignment-groups">
          {vacancyGroups.map((group) => (
            <section
              key={group.key}
              className={`assignment-results vacancy-assignment-group vacancy-assignment-group--${Math.min(group.vacancies.length, 4)}`}
              aria-label={`${en ? 'Vacancies for' : 'Vacantes de'} ${group.label}`}
            >
              <header className="vacancy-assignment-group__header">
                <h3 className="vacancy-assignment-group__title">{group.label}</h3>
                <span
                  className="vacancy-assignment-group__count"
                  aria-label={`${group.vacancies.length} ${group.vacancies.length === 1 ? (en ? 'vacancy' : 'vacante') : en ? 'vacancies' : 'vacantes'}`}
                >
                  {group.vacancies.length}
                </span>
              </header>

              <ul className="vacancy-assignment-grid">
                {group.vacancies.map((vacancy) => {
                  const [area, ...sectionParts] = (vacancy.descripcion || '').split(' - ');
                  let section = sectionParts.join(' - ');

                  if (!section) {
                    const match = positions.find(
                      (position) => position.area === area && position.puesto === vacancy.titulo,
                    );
                    if (match?.seccion) section = match.seccion;
                  }

                  return (
                    <AssignmentCard
                      key={vacancy.id}
                      className="vacancy-assignment-card"
                      headingLevel={4}
                      title={vacancy.titulo}
                      summary={section || undefined}
                      isNew={isNew(vacancy)}
                      assignmentDisplay="hidden"
                      actions={
                        isAdmin && (
                          <DropdownMenu
                            onOpenChange={(open) => {
                              if (!open) setConfirmingDeleteId(null);
                            }}
                          >
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="vacancy-assignment-card__menu-trigger"
                                aria-label={`${en ? 'Options for' : 'Opciones de'} ${vacancy.titulo}`}
                                disabled={deletingId !== null || !vacancy.id}
                              >
                                <EllipsisVertical aria-hidden="true" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="vacancy-assignment-menu">
                              <DropdownMenuLabel>{en ? 'Assign to' : 'Asignar a'}</DropdownMenuLabel>
                              {recruiterOptions.map((option) => (
                                <DropdownMenuItem
                                  key={option.value}
                                  disabled={
                                    isAssigning || deletingId !== null || option.value === (vacancy.asignado_a || '')
                                  }
                                  onSelect={() => {
                                    if (vacancy.id) onAssign(vacancy.id, option.value);
                                  }}
                                >
                                  <UserRoundPlus aria-hidden="true" />
                                  {option.label}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                disabled={deletingId !== null || !vacancy.id}
                                aria-busy={deletingId === vacancy.id}
                                aria-label={`${confirmingDeleteId === vacancy.id ? (en ? 'Confirm deletion of' : 'Confirmar eliminación de') : en ? 'Delete' : 'Eliminar'} ${vacancy.titulo}`}
                                onSelect={(event) => {
                                  if (confirmingDeleteId !== vacancy.id) event.preventDefault();
                                  void confirmDelete(vacancy);
                                }}
                              >
                                <Trash2 aria-hidden="true" />
                                {confirmingDeleteId === vacancy.id
                                  ? en
                                    ? 'Confirm'
                                    : 'Confirmar'
                                  : en
                                    ? 'Delete'
                                    : 'Eliminar'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )
                      }
                    />
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
