import { useEffect, useMemo, useState } from "react";
import { CalendarDays, NotebookPen, Plus, RotateCw } from "lucide-react";
import { BoneyardSkeleton } from "@/components/ui/BoneyardSkeleton";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Pagination } from "@/components/ui/Pagination";
import { useAuth } from "@/hooks/useAuth";
import { usePagination } from "@/hooks/usePagination";
import { DAILY_WORK_PAGE_SIZE } from "./constants";
import { DailyWorkActivityCard } from "./DailyWorkActivityCard";
import { DailyWorkActivityModal } from "./DailyWorkActivityModal";
import { formatDailyWorkDate, getLocalDateInputValue } from "./format";
import type {
  DailyWorkActivity,
  DailyWorkActivityDraft,
} from "./types";
import { useDailyWorkLog } from "./useDailyWorkLog";
import "./DailyWorkLogPage.css";

export function DailyWorkLogPage() {
  const { profile, profileLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getLocalDateInputValue);
  const [recruiterFilter, setRecruiterFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] =
    useState<DailyWorkActivity | null>(null);
  const [activityPendingDelete, setActivityPendingDelete] =
    useState<DailyWorkActivity | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isAdmin = profile?.role === "admin";
  const isRecruiter = profile?.role === "reclutador";
  const canAccess = isAdmin || isRecruiter;

  const {
    activities,
    recruiters,
    isLoading,
    isSaving,
    isDeleting,
    errorMessage,
    refresh,
    saveActivity,
    deleteActivity,
  } = useDailyWorkLog({
    userId: profile?.id,
    role: profile?.role,
    workDate: selectedDate,
    recruiterId: recruiterFilter,
  });

  const recruiterOptions = useMemo(
    () => [
      { value: "", label: "Todos los reclutadores" },
      ...recruiters.map((recruiter) => ({
        value: recruiter.id,
        label: recruiter.displayName,
      })),
    ],
    [recruiters],
  );

  const {
    pageItems,
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    canGoNext,
    canGoPrev,
  } = usePagination(activities, DAILY_WORK_PAGE_SIZE);

  useEffect(() => {
    goToPage(1);
  }, [goToPage, recruiterFilter, selectedDate]);

  const openCreateModal = () => {
    setSelectedActivity(null);
    setIsModalOpen(true);
  };

  const openEditModal = (activity: DailyWorkActivity) => {
    setSelectedActivity(activity);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setSelectedActivity(null);
  };

  const handleSave = async (draft: DailyWorkActivityDraft) => {
    const saved = await saveActivity(draft);
    if (saved && draft.workDate !== selectedDate) {
      setSelectedDate(draft.workDate);
    }
    return saved;
  };

  const confirmActivityDeletion = async () => {
    if (!activityPendingDelete) return;

    setDeleteError(null);
    const deleted = await deleteActivity(activityPendingDelete);
    if (deleted) {
      setActivityPendingDelete(null);
      return;
    }

    setDeleteError("No pudimos eliminar la actividad. Inténtalo nuevamente.");
  };

  if (!profileLoading && !canAccess) {
    return (
      <main className="daily-work-page container">
        <header className="daily-work-page__header">
          <div>
            <h1>Bitácora diaria</h1>
            <p>No tienes acceso a esta página.</p>
          </div>
        </header>
      </main>
    );
  }

  return (
    <BoneyardSkeleton
      name="daily-work-log-page"
      loading={profileLoading || isLoading}
      loadingLabel="Cargando bitácora diaria..."
    >
      <main className="daily-work-page container">
        <header className="daily-work-page__header">
          <div className="daily-work-page__heading">
            <h1>Bitácora diaria</h1>
            <p>Registra las actividades realizadas durante tu jornada.</p>
          </div>

          {isRecruiter && (
            <button
              type="button"
              className="btn-primary"
              onClick={openCreateModal}
            >
              <Plus size="var(--icon-size-sm)" aria-hidden="true" />
              <span>Registrar actividad</span>
            </button>
          )}
        </header>

        <section
          className="daily-work-page__content"
          aria-labelledby="daily-work-list-heading"
        >
          <div className="daily-work-page__toolbar">
            <div className="form-group">
              <label htmlFor="daily-work-date">Fecha</label>
              <input
                id="daily-work-date"
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </div>

            {isAdmin && (
              <div className="form-group">
                <label htmlFor="daily-work-recruiter">Reclutador</label>
                <CustomSelect
                  id="daily-work-recruiter"
                  value={recruiterFilter}
                  onChange={setRecruiterFilter}
                  options={recruiterOptions}
                  showPlaceholderOption={false}
                />
              </div>
            )}
          </div>

          <header className="daily-work-page__list-header">
            <div>
              <h2 id="daily-work-list-heading">
                {formatDailyWorkDate(selectedDate)}
              </h2>
              <p>
                {activities.length}{" "}
                {activities.length === 1
                  ? "actividad registrada"
                  : "actividades registradas"}
              </p>
            </div>
          </header>

          {errorMessage ? (
            <div className="daily-work-page__state" role="alert">
              <CalendarDays
                size="var(--icon-size-xxl)"
                aria-hidden="true"
              />
              <h2>No pudimos mostrar la bitácora</h2>
              <p>{errorMessage}</p>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => void refresh()}
              >
                <RotateCw size="var(--icon-size-sm)" aria-hidden="true" />
                <span>Reintentar</span>
              </button>
            </div>
          ) : activities.length === 0 ? (
            <div className="daily-work-page__state">
              <NotebookPen
                size="var(--icon-size-xxl)"
                aria-hidden="true"
              />
              <h2>Sin actividades registradas</h2>
              <p>
                {isRecruiter
                  ? "Registra la primera actividad de esta fecha."
                  : "No hay actividades para la fecha y el filtro seleccionados."}
              </p>
              {isRecruiter && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={openCreateModal}
                >
                  Registrar actividad
                </button>
              )}
            </div>
          ) : (
            <>
              <div
                className="daily-work-page__grid"
                role="list"
                aria-label={`Actividades del ${formatDailyWorkDate(selectedDate)}`}
              >
                {pageItems.map((activity) => (
                  <DailyWorkActivityCard
                    key={activity.id}
                    activity={activity}
                    showRecruiter={isAdmin}
                    canEdit={isRecruiter && activity.recruiterId === profile?.id}
                    canDelete={isAdmin}
                    onEdit={() => openEditModal(activity)}
                    onDelete={() => {
                      setDeleteError(null);
                      setActivityPendingDelete(activity);
                    }}
                  />
                ))}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
                onPrev={prevPage}
                onNext={nextPage}
                canGoPrev={canGoPrev}
                canGoNext={canGoNext}
                ariaLabel="Paginación de la bitácora diaria"
              />
            </>
          )}
        </section>

        {isRecruiter && (
          <DailyWorkActivityModal
            isOpen={isModalOpen}
            isSaving={isSaving}
            initialDate={selectedDate}
            activity={selectedActivity}
            onClose={closeModal}
            onSubmit={handleSave}
          />
        )}

        {isAdmin && (
          <ConfirmModal
            isOpen={activityPendingDelete !== null}
            title="Eliminar actividad"
            description="Se eliminarán permanentemente la actividad y sus archivos. Esta acción no se puede deshacer."
            confirmLabel="Eliminar"
            cancelLabel="Cancelar"
            onConfirm={() => void confirmActivityDeletion()}
            onCancel={() => {
              if (isDeleting) return;
              setActivityPendingDelete(null);
              setDeleteError(null);
            }}
            isDestructive
            isLoading={isDeleting}
            loadingLabel="Eliminando…"
            errorMessage={deleteError ?? undefined}
          />
        )}
      </main>
    </BoneyardSkeleton>
  );
}
