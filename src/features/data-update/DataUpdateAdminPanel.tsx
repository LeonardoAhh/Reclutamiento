import { useEffect, useMemo, useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";
import { toast } from "@/lib/notify";
import { normalizeString } from "@/lib/utils";
import {
  dataUpdateError,
  deleteDataUpdateRecord,
  reassignDataUpdateRecord,
  reopenDataUpdateRecord,
} from "./api";
import { compareDataUpdateRecords, DATA_UPDATE_PAGE_SIZE } from "./constants";
import { DataUpdateAdminResults } from "./DataUpdateAdminResults";
import { useDataUpdateText } from "./translations";
import type { DataUpdateCampaignDetail, DataUpdateProfileOption, DataUpdateRecord } from "./types";

interface DataUpdateAdminPanelProps {
  detail: DataUpdateCampaignDetail;
  profiles: DataUpdateProfileOption[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
  onOpenRecord: (record: DataUpdateRecord) => void;
  onRecordUpdated: (record: DataUpdateRecord) => void;
  onRecordDeleted: (recordId: string) => void;
}

export function DataUpdateAdminPanel({
  detail,
  profiles,
  searchTerm,
  onSearchChange,
  busy,
  onBusyChange,
  onOpenRecord,
  onRecordUpdated,
  onRecordDeleted,
}: DataUpdateAdminPanelProps) {
  const t = useDataUpdateText();
  const participantProfiles = profiles.filter((profile) => detail.participantIds.includes(profile.id));
  const sortedRecords = useMemo(
    () => [...detail.records].sort(compareDataUpdateRecords),
    [detail.records],
  );
  const visibleRecords = useMemo(() => {
    const terms = normalizeString(searchTerm).split(/\s+/).filter(Boolean);
    return sortedRecords.filter((record) => {
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
  }, [searchTerm, sortedRecords]);
  const pagination = usePagination(visibleRecords, DATA_UPDATE_PAGE_SIZE);
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

  return (
    <section className="data-update-admin" aria-labelledby="data-update-admin-title">
      <h2 id="data-update-admin-title" className="sr-only">{t("Administración")}</h2>
      {detail.records.length === 0 ? (
        <p className="data-update-message">{t("No hay registros disponibles en esta campaña.")}</p>
      ) : visibleRecords.length === 0 ? (
        <div id="data-update-admin-list" className="data-update-search-empty" role="status">
          <p>{t(`No hay coincidencias para “${searchTerm.trim()}”.`)}</p>
          <button data-cuelume-tap=""
            type="button"
            className="btn-secondary"
            onClick={() => onSearchChange("")}
          >
            {t("Limpiar búsqueda")}
          </button>
        </div>
      ) : (
        <>
          <div id="data-update-admin-list" className="data-update-results-panel">
            <DataUpdateAdminResults
              records={pagination.pageItems}
              profiles={participantProfiles}
              busy={busy}
              onOpenRecord={onOpenRecord}
              onReopen={(recordId) => void reopen(recordId)}
              onRequestDelete={(record) => {
                setDeleteRecordError(null);
                setPendingDeleteRecord(record);
              }}
              onReassign={(recordId, profileId) => void reassign(recordId, profileId)}
            />
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
        </>
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
