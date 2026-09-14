import { useEffect, useMemo, useState } from "react";
import { EllipsisVertical, FileArchive, FileSpreadsheet, PencilLine, RotateCcw, Trash2 } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Pagination } from "@/components/ui/Pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { SearchField } from "@/components/ui/SearchField";
import { usePagination } from "@/hooks/usePagination";
import { toast } from "@/lib/notify";
import { normalizeString } from "@/lib/utils";
import {
  dataUpdateError,
  deleteDataUpdateRecord,
  listCampaignDataUpdateIncidents,
  listDataUpdateAudit,
  reassignDataUpdateRecord,
  reopenDataUpdateRecord,
} from "./api";
import { compareDataUpdateRecords, DATA_UPDATE_PAGE_SIZE } from "./constants";
import { exportDataUpdateCampaign } from "./exportExcel";
import { exportDataUpdatePhotos, type DataUpdatePhotoExportProgress } from "./exportPhotos";
import type { DataUpdateCampaignDetail, DataUpdateProfileOption, DataUpdateRecord } from "./types";

interface DataUpdateAdminPanelProps {
  detail: DataUpdateCampaignDetail;
  profiles: DataUpdateProfileOption[];
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
  onOpenRecord: (record: DataUpdateRecord) => void;
  onRecordUpdated: (record: DataUpdateRecord) => void;
  onRecordDeleted: (recordId: string) => void;
}

export function DataUpdateAdminPanel({
  detail,
  profiles,
  busy,
  onBusyChange,
  onOpenRecord,
  onRecordUpdated,
  onRecordDeleted,
}: DataUpdateAdminPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const participantProfiles = profiles.filter((profile) => detail.participantIds.includes(profile.id));
  const sortedRecords = useMemo(
    () => [...detail.records].sort(compareDataUpdateRecords),
    [detail.records],
  );
  const visibleRecords = useMemo(() => {
    const terms = normalizeString(searchTerm).split(/\s+/).filter(Boolean);
    if (terms.length === 0) return sortedRecords;

    return sortedRecords.filter((record) => {
      const searchableText = normalizeString([
        record.identity.employeeNumber,
        record.identity.name,
        record.identity.area,
        record.identity.section,
        record.identity.position,
        record.identity.shift,
      ].join(" "));
      return terms.every((term) => searchableText.includes(term));
    });
  }, [searchTerm, sortedRecords]);
  const pagination = usePagination(visibleRecords, DATA_UPDATE_PAGE_SIZE);
  const [photoExportProgress, setPhotoExportProgress] = useState<DataUpdatePhotoExportProgress | null>(null);
  const [pendingDeleteRecord, setPendingDeleteRecord] = useState<DataUpdateRecord | null>(null);
  const [deleteRecordError, setDeleteRecordError] = useState<string | null>(null);
  const [deletingRecord, setDeletingRecord] = useState(false);

  useEffect(() => {
    pagination.goToPage(1);
  }, [detail.campaign.id, pagination.goToPage, searchTerm]);

  const reassign = async (recordId: string, profileId: string) => {
    onBusyChange(true);
    try {
      const updated = await reassignDataUpdateRecord(recordId, profileId);
      const assignedName = profiles.find((profile) => profile.id === profileId)?.label;
      onRecordUpdated({ ...updated, assignedName });
      toast.success({ title: "Responsable actualizado" });
    } catch (caught) {
      toast.error({ title: dataUpdateError(caught) });
    } finally {
      onBusyChange(false);
    }
  };

  const reopen = async (recordId: string) => {
    onBusyChange(true);
    try {
      const updated = await reopenDataUpdateRecord(recordId);
      onRecordUpdated(updated);
      toast.success({ title: "Registro reabierto" });
    } catch (caught) {
      toast.error({ title: dataUpdateError(caught) });
    } finally {
      onBusyChange(false);
    }
  };

  const confirmRecordDeletion = async () => {
    if (!pendingDeleteRecord || deletingRecord) return;
    setDeletingRecord(true);
    onBusyChange(true);
    setDeleteRecordError(null);
    try {
      await deleteDataUpdateRecord(pendingDeleteRecord.id);
      const deletedId = pendingDeleteRecord.id;
      setPendingDeleteRecord(null);
      onRecordDeleted(deletedId);
      toast.success({ title: "Colaborador eliminado de la campaña" });
    } catch (caught) {
      setDeleteRecordError(dataUpdateError(caught));
    } finally {
      setDeletingRecord(false);
      onBusyChange(false);
    }
  };

  const exportCampaign = async () => {
    onBusyChange(true);
    try {
      const recordIds = detail.records.map((record) => record.id);
      const [audit, incidents] = await Promise.all([
        listDataUpdateAudit(recordIds),
        listCampaignDataUpdateIncidents(recordIds),
      ]);
      await exportDataUpdateCampaign({ detail, audit, incidents });
      toast.success({ title: "Excel generado" });
    } catch (caught) {
      toast.error({ title: dataUpdateError(caught) });
    } finally {
      onBusyChange(false);
    }
  };

  const exportPhotos = async () => {
    onBusyChange(true);
    try {
      const result = await exportDataUpdatePhotos(detail, setPhotoExportProgress);
      if (result.downloaded === 0) {
        if (result.failed > 0) {
          toast.error({
            title: "No se pudieron descargar las fotografías",
            description: "Revisa tu conexión y vuelve a intentarlo.",
          });
        } else {
          toast.info({ title: "No hay fotografías disponibles para descargar" });
        }
        return;
      }

      const omitted = result.missing + result.failed;
      toast.success({
        title: "Fotografías descargadas",
        description: omitted > 0
          ? `${result.downloaded} incluidas; ${omitted} no disponibles.`
          : `${result.downloaded} fotografías incluidas en el ZIP.`,
      });
      if (result.failed > 0) {
        toast.warning({
          title: "Algunas fotografías no se pudieron incluir",
          description: `${result.failed} archivos presentaron un error. Puedes volver a intentarlo.`,
        });
      }
    } catch (caught) {
      toast.error({ title: dataUpdateError(caught) });
    } finally {
      setPhotoExportProgress(null);
      onBusyChange(false);
    }
  };

  return (
    <section className="data-update-admin" aria-labelledby="data-update-admin-title">
      <div className="data-update-section-heading">
        <div>
          <h2 id="data-update-admin-title">Administración</h2>
          <p className="text-muted">Reasigna responsables, reabre registros y exporta la campaña.</p>
        </div>
        <div className="data-update-admin__actions">
          {detail.records.length > 0 && (
            <SearchField
              id="data-update-admin-search"
              className="data-update-queue__search"
              label="Buscar en administración"
              placeholder="Número, nombre, área, sección, puesto o turno"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onClear={() => setSearchTerm("")}
              onKeyDown={(event) => {
                if (event.key === "Escape" && searchTerm) setSearchTerm("");
              }}
              aria-controls="data-update-admin-list"
              autoComplete="off"
            />
          )}
          <button
            type="button"
            className="btn-secondary"
            onClick={() => void exportCampaign()}
            disabled={busy || detail.records.length === 0}
            aria-label="Exportar campaña a Excel"
          >
            <FileSpreadsheet aria-hidden="true" />
            Excel
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => void exportPhotos()}
            disabled={busy || detail.records.length === 0}
            aria-busy={photoExportProgress !== null}
            aria-live="polite"
            aria-label={photoExportProgress
              ? `Preparando ${photoExportProgress.completed} de ${photoExportProgress.total} fotografías`
              : "Descargar fotografías de la campaña"}
          >
            <FileArchive aria-hidden="true" />
            {photoExportProgress
              ? `Preparando ${photoExportProgress.completed} de ${photoExportProgress.total}`
              : "Fotos"}
          </button>
        </div>
      </div>

      {detail.records.length === 0 ? (
        <p className="data-update-message">No hay registros disponibles en esta campaña.</p>
      ) : visibleRecords.length === 0 ? (
        <div id="data-update-admin-list" className="data-update-search-empty" role="status">
          <p>No hay coincidencias para “{searchTerm.trim()}”.</p>
          <button type="button" className="btn-secondary" onClick={() => setSearchTerm("")}>Limpiar búsqueda</button>
        </div>
      ) : (
        <div id="data-update-admin-list" className="data-update-record-grid">
          {pagination.pageItems.map((record) => (
            <article key={record.id} className="card data-update-record-card data-update-admin-card">
              <div className="data-update-admin-card__header">
                <div className="data-update-admin-card__identity">
                  <div className="data-update-admin-card__meta">
                    <span className="type-caption-up text-muted">{record.identity.employeeNumber}</span>
                    <span className={`data-update-status data-update-status--${record.status}`}>
                      {record.status.replace("_", " ")}
                    </span>
                  </div>
                  <h3>{record.identity.name}</h3>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="dropdown-menu-trigger"
                      disabled={busy}
                      aria-label={`Acciones de ${record.identity.name}`}
                    >
                      <EllipsisVertical aria-hidden="true" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="data-update-admin-card__popover">
                    {record.status === "completado" ? (
                      <button
                        type="button"
                        className="data-update-admin-card__action"
                        onClick={() => { void reopen(record.id); }}
                      >
                        <RotateCcw aria-hidden="true" />
                        <span>Reabrir</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="data-update-admin-card__action"
                        onClick={() => onOpenRecord(record)}
                      >
                        <PencilLine aria-hidden="true" />
                        <span>Actualizar</span>
                      </button>
                    )}
                    <hr className="data-update-admin-card__separator" />
                    <button
                      type="button"
                      className="data-update-admin-card__action data-update-admin-card__action--danger"
                      onClick={() => {
                        setDeleteRecordError(null);
                        setPendingDeleteRecord(record);
                      }}
                      aria-label={`Eliminar a ${record.identity.name} de la campaña`}
                    >
                      <Trash2 aria-hidden="true" />
                      <span>Eliminar</span>
                    </button>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="form-group">
                <label htmlFor={`assigned-${record.id}`}>Responsable</label>
                <CustomSelect
                  id={`assigned-${record.id}`}
                  value={record.assignedTo}
                  options={participantProfiles.map((profile) => ({ value: profile.id, label: profile.label }))}
                  onChange={(profileId) => void reassign(record.id, profileId)}
                  showPlaceholderOption={false}
                  disabled={busy}
                />
              </div>
            </article>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={pagination.goToPage}
          onPrev={pagination.prevPage}
          onNext={pagination.nextPage}
          canGoPrev={pagination.canGoPrev}
          canGoNext={pagination.canGoNext}
          ariaLabel="Paginación de administración de registros"
          variant="compact"
        />
      )}

      <ConfirmModal
        isOpen={pendingDeleteRecord !== null}
        title="Eliminar colaborador"
        description={pendingDeleteRecord
          ? `Se eliminará a ${pendingDeleteRecord.identity.name} de la campaña. Esta acción no se puede deshacer.`
          : undefined}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={() => void confirmRecordDeletion()}
        onCancel={() => {
          if (deletingRecord) return;
          setPendingDeleteRecord(null);
          setDeleteRecordError(null);
        }}
        isDestructive
        isLoading={deletingRecord}
        loadingLabel="Eliminando…"
        errorMessage={deleteRecordError ?? undefined}
      />
    </section>
  );
}
