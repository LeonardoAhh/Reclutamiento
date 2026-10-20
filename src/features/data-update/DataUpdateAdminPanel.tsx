import { useEffect, useMemo, useState } from "react";
import { ChevronDown, EllipsisVertical, FileJson2, FileSpreadsheet, PencilLine, RotateCcw, Trash2 } from "lucide-react";
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
import { DataUpdateShiftImportModal } from "./DataUpdateShiftImportModal";
import { DataUpdateStatus } from "./DataUpdateStatus";
import { useDataUpdateText } from "./translations";
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
  const t = useDataUpdateText();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [showOnlyPending, setShowOnlyPending] = useState(false);
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
      if (showOnlyPending && record.status === "completado") return false;
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
  }, [searchTerm, selectedShift, showOnlyPending, sortedRecords]  );
  const pagination = usePagination(visibleRecords, DATA_UPDATE_PAGE_SIZE);
  const [pendingDeleteRecord, setPendingDeleteRecord] = useState<DataUpdateRecord | null>(null);
  const [deleteRecordError, setDeleteRecordError] = useState<string | null>(null);
  const [deletingRecord, setDeletingRecord] = useState(false);
  const [shiftImportOpen, setShiftImportOpen] = useState(false);
  const [openActionsRecordId, setOpenActionsRecordId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedShift("");
  }, [detail.campaign.id]);

  useEffect(() => {
    pagination.goToPage(1);
  }, [detail.campaign.id, pagination.goToPage, searchTerm, selectedShift, showOnlyPending]);

  const reassign = async (recordId: string, profileId: string) => {
    onBusyChange(true);
    try {
      const updated = await reassignDataUpdateRecord(recordId, profileId);
      const assignedName = profiles.find((profile) => profile.id === profileId)?.label;
      onRecordUpdated({ ...updated, assignedName });
      toast.success({ title: t("Responsable actualizado") });
    } catch (caught) {
      toast.error({ title: t(dataUpdateError(caught)) });
    } finally {
      onBusyChange(false);
    }
  };

  const reopen = async (recordId: string) => {
    onBusyChange(true);
    try {
      const updated = await reopenDataUpdateRecord(recordId);
      onRecordUpdated(updated);
      toast.success({ title: t("Registro reabierto") });
    } catch (caught) {
      toast.error({ title: t(dataUpdateError(caught)) });
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
      toast.success({ title: t("Colaborador eliminado de la campaña") });
    } catch (caught) {
      setDeleteRecordError(t(dataUpdateError(caught)));
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
      toast.success({ title: t("Excel generado") });
    } catch (caught) {
      toast.error({ title: t(dataUpdateError(caught)) });
    } finally {
      onBusyChange(false);
    }
  };

  return (
    <section className="data-update-admin" aria-labelledby="data-update-admin-title">
      <div className="data-update-section-heading">
        <div>
          <h2 id="data-update-admin-title">{t("Administración")}</h2>
          <p className="text-muted">{t("Reasigna responsables, reabre registros y exporta la campaña.")}</p>
        </div>
      </div>
      <Toolbar
        label={t("Herramientas de administración")}
        className={`data-update-admin__toolbar${detail.records.length === 0 ? " data-update-admin__toolbar--empty" : ""}`}
      >
        {detail.records.length > 0 && (
          <ToolbarGroup label={t("Buscar registros")} className="data-update-admin__search">
            <SearchField
              id="data-update-admin-search"
              className="data-update-queue__search"
              label={t("Buscar en administración")}
              placeholder={t("Buscar")}
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
        <ToolbarGroup label={t("Filtrar por turno")} className="data-update-admin__shift">
          <CustomSelect
            id="data-update-admin-shift"
            value={selectedShift}
            options={shiftOptions}
            placeholder={t("Todos")}
            onChange={setSelectedShift}
            triggerAppearance="control"
            disabled={shiftOptions.length === 0}
            aria-label={`${t("Filtrar por turno: ")}${selectedShift || t("Todos")}`}
            customTrigger={
              <span className="data-update-admin__shift-trigger">
                <span>{t("Turno")}</span>
                <span className="data-update-admin__shift-value">{selectedShift || t("Todos")}</span>
                <ChevronDown size="var(--icon-size-sm)" aria-hidden="true" />
              </span>
            }
          />
        </ToolbarGroup>
        {detail.records.length > 0 && (
          <CustomSelect
            id="data-update-admin-status"
            className="data-update-admin__status"
            aria-label={t("Estado del registro", "Record status")}
            value={showOnlyPending ? "pending" : "all"}
            options={[
              { value: "all", label: t("Todos") },
              { value: "pending", label: t("Pendientes") },
            ]}
            showPlaceholderOption={false}
            onChange={(value) => setShowOnlyPending(value === "pending")}
          />
        )}
        <ToolbarGroup label={t("Acciones de administración")} className="data-update-admin__actions">
          <button data-cuelume-tap=""
            type="button"
            className="btn-secondary data-update-admin__shift-import"
            hidden
            onClick={() => setShiftImportOpen(true)}
            disabled={busy || !online || detail.records.length === 0}
            aria-label={t("Actualizar turnos desde JSON")}
          >
            <FileJson2 aria-hidden="true" />
            {t("Cargar turnos")}
          </button>
          <button data-cuelume-tap=""
            type="button"
            className="btn-secondary"
            onClick={() => void exportCampaign()}
            disabled={busy || detail.records.length === 0}
            aria-label={t("Exportar campaña a Excel")}
          >
            <FileSpreadsheet aria-hidden="true" />
            Excel
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
        <p className="data-update-message">{t("No hay registros disponibles en esta campaña.")}</p>
      ) : visibleRecords.length === 0 ? (
        <div id="data-update-admin-list" className="data-update-search-empty" role="status">
          <p>{searchTerm.trim()
            ? selectedShift
              ? `${t(`No hay coincidencias para “${searchTerm.trim()}”.`)} ${t("en el turno")} ${selectedShift}.`
              : t(`No hay coincidencias para “${searchTerm.trim()}”.`)
            : selectedShift
              ? showOnlyPending
                ? `${t("No hay registros pendientes o en proceso para el turno")} ${selectedShift}.`
                : `${t("No hay registros del turno")} ${selectedShift}.`
              : t("No hay registros pendientes o en proceso.")}</p>
          <button data-cuelume-tap=""
            type="button"
            className="btn-secondary"
            onClick={() => {
              setSearchTerm("");
              setSelectedShift("");
              setShowOnlyPending(false);
            }}
          >
            {t("Limpiar filtros")}
          </button>
        </div>
      ) : (
        <div className="data-update-results-panel">
        <div id="data-update-admin-list" className="data-update-record-grid">
          {pagination.pageItems.map((record) => (
            <article key={record.id} className="card data-update-record-card data-update-admin-card">
              <div className="data-update-admin-card__header">
                <div className="data-update-admin-card__identity">
                  <div className="data-update-admin-card__meta">
                    <span className="type-body-md text-muted">
                      <span className="sr-only">{t("Número de empleado: ")}</span>
                      {record.identity.employeeNumber}
                    </span>
                    {record.identity.area && (
                      <span className="data-update-admin-card__meta-item type-body-md text-muted">
                        <span aria-hidden="true">●</span>
                        <span><span className="sr-only">{t("Área: ")}</span>{record.identity.area}</span>
                      </span>
                    )}
                    {record.identity.shift && (
                      <span className="data-update-admin-card__meta-item type-body-md text-muted">
                        <span aria-hidden="true">●</span>
                        <span><span className="sr-only">{t("Turno: ")}</span>{record.identity.shift}</span>
                      </span>
                    )}
                  </div>
                  <div className="data-update-admin-card__name-row">
                    <h3 title={record.identity.name}>{record.identity.name}</h3>
                    <DataUpdateStatus status={record.status} />
                  </div>
                </div>
                <Popover
                  open={openActionsRecordId === record.id}
                  onOpenChange={(open) => setOpenActionsRecordId(open ? record.id : null)}
                >
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="dropdown-menu-trigger"
                      disabled={busy}
                      aria-label={`${t("Acciones de")} ${record.identity.name}`}
                    >
                      <EllipsisVertical aria-hidden="true" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    className="data-update-admin-card__popover"
                  >
                    {record.status === "completado" ? (
                      <button data-cuelume-tap=""
                        type="button"
                        className="data-update-admin-card__action"
                        onClick={() => { void reopen(record.id); }}
                      >
                        <RotateCcw aria-hidden="true" />
                        <span>{t("Reabrir")}</span>
                      </button>
                    ) : (
                      <button data-cuelume-tap=""
                        type="button"
                        className="data-update-admin-card__action"
                        onClick={() => onOpenRecord(record)}
                      >
                        <PencilLine aria-hidden="true" />
                        <span>{t("Actualizar")}</span>
                      </button>
                    )}
                    <hr className="data-update-admin-card__separator" />
                    <button data-cuelume-tap=""
                      type="button"
                      className="data-update-admin-card__action data-update-admin-card__action--danger"
                      onClick={() => {
                        setDeleteRecordError(null);
                        setPendingDeleteRecord(record);
                      }}
                      aria-label={`${t("Eliminar")} a ${record.identity.name} ${t("de la campaña")}`}
                    >
                      <Trash2 aria-hidden="true" />
                      <span>{t("Eliminar")}</span>
                    </button>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="form-group">
                <label htmlFor={`assigned-${record.id}`}>{t("Responsable")}</label>
                <CustomSelect
                  id={`assigned-${record.id}`}
                  value={record.assignedTo}
                  options={participantProfiles.filter(profile => profile.active || profile.id === record.assignedTo)
                    .map(profile => ({ value: profile.id, label: `${profile.label}${profile.active ? '' : ` (${t("inactivo")})`}` }))}
                  onChange={(profileId) => void reassign(record.id, profileId)}
                  showPlaceholderOption={false}
                  disabled={busy}
                />
              </div>
            </article>
          ))}
        </div>

      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={pagination.goToPage}
          onPrev={pagination.prevPage}
          onNext={pagination.nextPage}
          canGoPrev={pagination.canGoPrev}
          canGoNext={pagination.canGoNext}
          ariaLabel={t("Paginación de administración de registros")}
        />
      )}
        </div>
      )}

      <ConfirmModal
        isOpen={pendingDeleteRecord !== null}
        title={t("Eliminar colaborador")}
        description={t("Esta acción no se puede deshacer.")}
        confirmLabel={t("Eliminar")}
        cancelLabel={t("Cancelar")}
        onConfirm={() => void confirmRecordDeletion()}
        onCancel={() => {
          if (deletingRecord) return;
          setPendingDeleteRecord(null);
          setDeleteRecordError(null);
        }}
        isDestructive
        isLoading={deletingRecord}
        loadingLabel={t("Eliminando…")}
        errorMessage={deleteRecordError ? t(deleteRecordError) : undefined}
      />
    </section>
  );
}
