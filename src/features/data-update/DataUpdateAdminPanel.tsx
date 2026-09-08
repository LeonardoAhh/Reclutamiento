import { useEffect, useMemo } from "react";
import { Download, RotateCcw } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";
import { formatDateTimeMx } from "@/lib/dates";
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
import type { DataUpdateCampaignDetail, DataUpdateProfileOption } from "./types";

interface DataUpdateAdminPanelProps {
  detail: DataUpdateCampaignDetail;
  profiles: DataUpdateProfileOption[];
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
  onRefresh: () => void;
}

export function DataUpdateAdminPanel({
  detail,
  profiles,
  busy,
  onBusyChange,
  onRefresh,
}: DataUpdateAdminPanelProps) {
  const participantProfiles = profiles.filter((profile) => detail.participantIds.includes(profile.id));
  const sortedRecords = useMemo(
    () => [...detail.records].sort(compareDataUpdateRecords),
    [detail.records],
  );
  const pagination = usePagination(sortedRecords, DATA_UPDATE_PAGE_SIZE);

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

  return (
    <section className="data-update-admin" aria-labelledby="data-update-admin-title">
      <div className="data-update-section-heading">
        <div>
          <h2 id="data-update-admin-title">Administración</h2>
          <p className="text-muted">Reasigna responsables, reabre registros y exporta la campaña.</p>
        </div>
        <button type="button" className="btn-secondary" onClick={() => void exportCampaign()} disabled={busy || detail.records.length === 0}>
          <Download aria-hidden="true" />
          Exportar Excel
        </button>
      </div>

      <div className="data-update-record-grid">
        {pagination.pageItems.map((record) => (
          <article key={record.id} className="card data-update-record-card data-update-admin-card">
            <div className="data-update-admin-card__identity">
              <span className="type-caption-up text-muted">{record.identity.employeeNumber}</span>
              <h3>{record.identity.name}</h3>
              <p className="text-muted">{record.identity.area} · {record.identity.position}</p>
              <span className="data-update-admin-card__updated text-muted">Actualizado {formatDateTimeMx(record.updatedAt)}</span>
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
            <div className="data-update-record-card__footer">
              <span className={`data-update-status data-update-status--${record.status}`}>{record.status.replace("_", " ")}</span>
              {record.status === "completado" && (
                <button type="button" className="btn-secondary btn-sm" onClick={() => void reopen(record.id)} disabled={busy}>
                  <RotateCcw aria-hidden="true" />
                  Reabrir
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
