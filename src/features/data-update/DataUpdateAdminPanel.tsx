import { useEffect, useMemo, useState } from "react";
import { FileArchive, FileSpreadsheet, PencilLine, RotateCcw } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";
import { toast } from "@/lib/notify";
import {
  dataUpdateError,
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
  onRefresh: () => void;
}

export function DataUpdateAdminPanel({
  detail,
  profiles,
  busy,
  onBusyChange,
  onOpenRecord,
  onRefresh,
}: DataUpdateAdminPanelProps) {
  const participantProfiles = profiles.filter((profile) => detail.participantIds.includes(profile.id));
  const sortedRecords = useMemo(
    () => [...detail.records].sort(compareDataUpdateRecords),
    [detail.records],
  );
  const pagination = usePagination(sortedRecords, DATA_UPDATE_PAGE_SIZE);
  const [photoExportProgress, setPhotoExportProgress] = useState<DataUpdatePhotoExportProgress | null>(null);

  useEffect(() => {
    pagination.goToPage(1);
  }, [detail.campaign.id, pagination.goToPage]);

  const reassign = async (recordId: string, profileId: string) => {
    onBusyChange(true);
    try {
      await reassignDataUpdateRecord(recordId, profileId);
      toast.success({ title: "Responsable actualizado" });
      onRefresh();
    } catch (caught) {
      toast.error({ title: dataUpdateError(caught) });
    } finally {
      onBusyChange(false);
    }
  };

  const reopen = async (recordId: string) => {
    onBusyChange(true);
    try {
      await reopenDataUpdateRecord(recordId);
      toast.success({ title: "Registro reabierto" });
      onRefresh();
    } catch (caught) {
      toast.error({ title: dataUpdateError(caught) });
    } finally {
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

      <div className="data-update-record-grid">
        {pagination.pageItems.map((record) => (
          <article key={record.id} className="card data-update-record-card data-update-admin-card">
            <div className="data-update-admin-card__identity">
              <span className="type-caption-up text-muted">{record.identity.employeeNumber}</span>
              <h3>{record.identity.name}</h3>
            </div>
            <div className="data-update-admin-card__assignment">
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
              <div className="data-update-admin-card__status-slot">
                <span className={`data-update-status data-update-status--${record.status}`}>{record.status.replace("_", " ")}</span>
              </div>
            </div>
            <div className="data-update-record-card__footer">
              {record.status === "completado" ? (
                <button type="button" className="btn-secondary btn-sm" onClick={() => void reopen(record.id)} disabled={busy}>
                  <RotateCcw aria-hidden="true" />
                  Reabrir
                </button>
              ) : (
                <button type="button" className="btn-primary btn-sm" onClick={() => onOpenRecord(record)} disabled={busy}>
                  <PencilLine aria-hidden="true" />
                  Actualizar
                </button>
              )}
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
          ariaLabel="Paginación de administración de registros"
          variant="compact"
        />
      )}
    </section>
  );
}
