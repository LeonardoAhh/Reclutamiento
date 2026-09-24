import { useEffect, useMemo, useState } from "react";
import { ChevronDown, EllipsisVertical, FileArchive, FileJson2, FileSpreadsheet, PencilLine, RotateCcw, Trash2 } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Pagination } from "@/components/ui/Pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { SearchField } from "@/components/ui/SearchField";
import { Toolbar, ToolbarGroup } from "@/components/ui/Toolbar";
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
import { DataUpdateShiftImportModal } from "./DataUpdateShiftImportModal";
import { DataUpdateStatus } from "./DataUpdateStatus";
import type { DataUpdateCampaignDetail, DataUpdateProfileOption, DataUpdateRecord } from "./types";

interface DataUpdateAdminPanelProps {
  detail: DataUpdateCampaignDetail;
  profiles: DataUpdateProfileOption[];
  busy: boolean;
  online: boolean;
  onBusyChange: (busy: boolean) => void;
  onShiftsUpdated: () => void;
  onOpenRecord: (record: DataUpdateRecord) => void;
  onRecordUpdated: (record: DataUpdateRecord) => void;
  onRecordDeleted: (recordId: string) => void;
}

export function DataUpdateAdminPanel({
  detail,
  profiles,
  busy,
  online,
  onBusyChange,
  onShiftsUpdated,
  onOpenRecord,
  onRecordUpdated,
  onRecordDeleted,
}: DataUpdateAdminPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const participantProfiles = profiles.filter((profile) => detail.participantIds.includes(profile.id));
  const sortedRecords = useMemo(
    () => [...detail.records].sort(compareDataUpdateRecords),
    [detail.records],
  );
  const shiftOptions = useMemo(
    () => Array.from(new Set(detail.records.map((record) => record.identity.shift.trim()).filter(Boolean)))
      .sort((left, right) => left.localeCompare(right, "es", { numeric: true }))
      .map((shift) => ({ value: shift, label: shift })),
    [detail.records],
  );
  const visibleRecords = useMemo(() => {
    const terms = normalizeString(searchTerm).split(/\s+/).filter(Boolean);
    return sortedRecords.filter((record) => {
      if (selectedShift && record.identity.shift.trim() !== selectedShift) return false;
      if (terms.length === 0) return true;
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
  }, [searchTerm, selectedShift, sortedRecords]);
  const pagination = usePagination(visibleRecords, DATA_UPDATE_PAGE_SIZE);
  const [photoExportProgress, setPhotoExportProgress] = useState<DataUpdatePhotoExportProgress | null>(null);
  const [pendingDeleteRecord, setPendingDeleteRecord] = useState<DataUpdateRecord | null>(null);
  const [deleteRecordError, setDeleteRecordError] = useState<string | null>(null);
  const [deletingRecord, setDeletingRecord] = useState(false);
  const [shiftImportOpen, setShiftImportOpen] = useState(false);

  useEffect(() => {
    setSelectedShift("");
  }, [detail.campaign.id]);

  useEffect(() => {
    pagination.goToPage(1);
  }, [detail.campaign.id, pagination.goToPage, searchTerm, selectedShift]);

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
      </div>
      <Toolbar
        label="Herramientas de administración"
        className={`data-update-admin__toolbar${detail.records.length === 0 ? " data-update-admin__toolbar--empty" : ""}`}
      >
        {detail.records.length > 0 && (
          <ToolbarGroup label="Buscar registros" className="data-update-admin__search">
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
          </ToolbarGroup>
        )}
        <ToolbarGroup label="Filtrar por turno" className="data-update-admin__shift">
          <CustomSelect
            id="data-update-admin-shift"
            value={selectedShift}
            options={shiftOptions}
            placeholder="Todos"
            onChange={setSelectedShift}
            triggerAppearance="control"
            disabled={shiftOptions.length === 0}
            aria-label={`Filtrar por turno: ${selectedShift || "Todos"}`}
            customTrigger={
              <span className="data-update-admin__shift-trigger">
                <span>Turno</span>
                <span className="data-update-admin__shift-value">{selectedShift || "Todos"}</span>
                <ChevronDown size="var(--icon-size-sm)" aria-hidden="true" />
              </span>
            }
          />
        </ToolbarGroup>
        <ToolbarGroup label="Acciones de administración" className="data-update-admin__actions">
          <button
            type="button"
            className="btn-secondary data-update-admin__shift-import"
            hidden
            onClick={() => setShiftImportOpen(true)}
            disabled={busy || !online || detail.records.length === 0}
            aria-label="Actualizar turnos desde JSON"
          >
            <FileJson2 aria-hidden="true" />
            Cargar turnos
          </button>
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
        </ToolbarGroup>
      </Toolbar>

      <DataUpdateShiftImportModal
        key={detail.campaign.id}
        isOpen={shiftImportOpen}
        campaignId={detail.campaign.id}
        campaignName={detail.campaign.name}
        records={detail.records}
        busy={busy}
        online={online}
        onBusyChange={onBusyChange}
        onClose={() => setShiftImportOpen(false)}
        onApplied={onShiftsUpdated}
      />

      {detail.records.length === 0 ? (
        <p className="data-update-message">No hay registros disponibles en esta campaña.</p>
      ) : visibleRecords.length === 0 ? (
        <div id="data-update-admin-list" className="data-update-search-empty" role="status">
          <p>{searchTerm.trim()
            ? selectedShift
              ? `No hay coincidencias para “${searchTerm.trim()}” en el turno ${selectedShift}.`
              : `No hay coincidencias para “${searchTerm.trim()}”.`
            : `No hay registros del turno ${selectedShift}.`}</p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setSearchTerm("");
              setSelectedShift("");
            }}
          >
            {selectedShift ? "Limpiar filtros" : "Limpiar búsqueda"}
          </button>
        </div>
      ) : (
        <div id="data-update-admin-list" className="data-update-record-grid">
          {pagination.pageItems.map((record) => (
            <article key={record.id} className="card data-update-record-card data-update-admin-card">
              <div className="data-update-admin-card__header">
                <div className="data-update-admin-card__identity">
                  <div className="data-update-admin-card__meta">
                    <span className="type-caption-up text-muted">
                      <span className="sr-only">Número de empleado: </span>
                      {record.identity.employeeNumber}
                    </span>
                    {record.identity.area && (
                      <span className="data-update-admin-card__meta-item type-caption-up text-muted">
                        <span aria-hidden="true">●</span>
                        <span><span className="sr-only">Área: </span>{record.identity.area}</span>
                      </span>
                    )}
                    {record.identity.shift && (
                      <span className="data-update-admin-card__meta-item type-caption-up text-muted">
                        <span aria-hidden="true">●</span>
                        <span><span className="sr-only">Turno: </span>{record.identity.shift}</span>
                      </span>
                    )}
                  </div>
                  <div className="data-update-admin-card__name-row">
                    <h3 title={record.identity.name}>{record.identity.name}</h3>
                    <DataUpdateStatus status={record.status} />
                  </div>
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
        description= "Esta acción no se puede deshacer."
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
