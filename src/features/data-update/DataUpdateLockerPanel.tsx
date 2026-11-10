import { useEffect, useMemo, useState } from "react";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";
import { toast } from "@/lib/notify";
import { normalizeString } from "@/lib/utils";
import { assignDataUpdateLocker, dataUpdateError } from "./api";
import { DataUpdateLockerResults } from "./DataUpdateLockerResults";
import { useDataUpdateText } from "./translations";
import {
  compareDataUpdateEmployeeNumbers,
  DATA_UPDATE_LOCKER_AREAS,
  DATA_UPDATE_PAGE_SIZE,
  isDataUpdateLockerArea,
} from "./constants";
import type { DataUpdateLockerArea, DataUpdateRecord } from "./types";

interface DataUpdateLockerPanelProps {
  records: DataUpdateRecord[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  canEdit: boolean;
  onRecordUpdated: (record: DataUpdateRecord) => void;
}

const LOCKER_AREA_OPTIONS = DATA_UPDATE_LOCKER_AREAS.map((area) => ({
  value: area,
  label: area,
}));

function getLockerError(locker: string, alreadyAssigned: boolean): string | null {
  if (locker === "") return "Escribe el número de locker.";
  if (!/^\d+$/.test(locker)) return "Usa solo números.";
  if (alreadyAssigned) return "Este locker ya está asignado a otro colaborador en esta área.";
  return null;
}

export function DataUpdateLockerPanel({ records, searchTerm, onSearchChange, canEdit, onRecordUpdated }: DataUpdateLockerPanelProps) {
  const t = useDataUpdateText();
  const [selectedRecord, setSelectedRecord] = useState<DataUpdateRecord | null>(null);
  const [lockerArea, setLockerArea] = useState<DataUpdateLockerArea | "">("");
  const [locker, setLocker] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const sortedRecords = useMemo(
    () => [...records].sort(compareDataUpdateEmployeeNumbers),
    [records],
  );
  const visibleRecords = useMemo(() => {
    const terms = normalizeString(searchTerm).split(/\s+/).filter(Boolean);
    if (terms.length === 0) return sortedRecords;

    return sortedRecords.filter((record) => {
      const searchableText = normalizeString([
        record.identity.employeeNumber,
        record.identity.name,
        record.identity.hireDate,
        record.lockerArea,
        record.data.locker,
      ].join(" "));
      return terms.every((term) => searchableText.includes(term));
    });
  }, [searchTerm, sortedRecords]);
  const pagination = usePagination(visibleRecords, DATA_UPDATE_PAGE_SIZE);
  const normalizedLocker = locker.trim();
  const lockerAlreadyAssigned = records.some(
    (record) => record.id !== selectedRecord?.id
      && record.lockerArea === lockerArea
      && record.data.locker.trim() === normalizedLocker,
  );
  const lockerAreaError = submitAttempted && lockerArea === ""
    ? "Selecciona el área del locker."
    : null;
  const lockerError = submitAttempted
    ? getLockerError(normalizedLocker, lockerAlreadyAssigned)
    : null;

  useEffect(() => {
    pagination.goToPage(1);
  }, [pagination.goToPage, records, searchTerm]);

  const openEditor = (record: DataUpdateRecord) => {
    setSelectedRecord(record);
    setLockerArea(record.lockerArea);
    setLocker(/^\d+$/.test(record.data.locker.trim()) ? record.data.locker.trim() : "");
    setSubmitAttempted(false);
    setServerError(null);
  };

  const closeEditor = () => {
    if (saving) return;
    setSelectedRecord(null);
    setSubmitAttempted(false);
    setServerError(null);
  };

  const saveLocker = async () => {
    setSubmitAttempted(true);
    setServerError(null);
    if (
      !selectedRecord
      || lockerArea === ""
      || normalizedLocker === ""
      || !/^\d+$/.test(normalizedLocker)
      || lockerAlreadyAssigned
    ) return;

    setSaving(true);
    try {
      const updated = await assignDataUpdateLocker(selectedRecord.id, lockerArea, normalizedLocker);
      onRecordUpdated(updated);
      setSelectedRecord(null);
      toast.success({ title: t("Locker asignado") });
    } catch (caught) {
      setServerError(t(dataUpdateError(caught)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="data-update-lockers" aria-labelledby="data-update-lockers-title">
      <h2 id="data-update-lockers-title" className="sr-only">{t("Locker")}</h2>

      {records.length === 0 ? (
        <p className="data-update-message">{t("No hay registros disponibles en esta campaña.")}</p>
      ) : visibleRecords.length === 0 ? (
        <div id="data-update-locker-list" className="data-update-search-empty" role="status">
          <p>{t(`No hay coincidencias para “${searchTerm.trim()}”.`)}</p>
          <button data-cuelume-tap="" type="button" className="btn-secondary" onClick={() => onSearchChange("")}>{t("Limpiar búsqueda")}</button>
        </div>
      ) : (
        <>
          <div id="data-update-locker-list" className="data-update-results-panel">
            <DataUpdateLockerResults
              records={pagination.pageItems}
              canEdit={canEdit}
              onEdit={openEditor}
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
              ariaLabel={t("Paginación de lockers")}
            />
          )}
        </>
      )}

      <Modal
        className="data-update-dialog"
        isOpen={selectedRecord !== null}
        title={t("Asignar locker")}
        size="xs"
        onClose={closeEditor}
        footerActions={(
          <>
            <button data-cuelume-tap="" type="button" className="btn-secondary" onClick={closeEditor} disabled={saving}>{t("Cancelar")}</button>
            <button type="submit" form="data-update-locker-form" className="btn-primary" disabled={saving}>
              {saving ? t("Guardando…") : t("Guardar")}
            </button>
          </>
        )}
      >
        <form
          id="data-update-locker-form"
          className="modal-body"
          onSubmit={(event) => {
            event.preventDefault();
            void saveLocker();
          }}
        >
          {selectedRecord && (
            <p className="text-muted">
              {selectedRecord.identity.employeeNumber} · {selectedRecord.identity.name}
            </p>
          )}
          <div className="form-group">
            <label htmlFor="data-update-locker-area">{t("Área de locker")}</label>
            <CustomSelect
              id="data-update-locker-area"
              value={lockerArea}
              options={LOCKER_AREA_OPTIONS.map((option) => ({ ...option, label: t(option.label) }))}
              placeholder={t("Selecciona un área")}
              onChange={(value) => {
                setLockerArea(isDataUpdateLockerArea(value) ? value : "");
                setServerError(null);
              }}
              aria-invalid={Boolean(lockerAreaError) || undefined}
              aria-describedby={lockerAreaError ? "data-update-locker-area-error" : undefined}
              aria-required="true"
              disabled={saving}
            />
            {lockerAreaError && (
              <p id="data-update-locker-area-error" className="form-error" role="alert">
                {t(lockerAreaError)}
              </p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="data-update-locker-number">{t("Número de locker")}</label>
            <input
              id="data-update-locker-number"
              className="form-control"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              enterKeyHint="done"
              value={locker}
              onChange={(event) => {
                setLocker(event.target.value);
                setServerError(null);
              }}
              aria-invalid={Boolean(lockerError || serverError)}
              aria-describedby={lockerError || serverError ? "data-update-locker-error" : undefined}
              disabled={saving}
              required
            />
            {(lockerError || serverError) && (
              <p id="data-update-locker-error" className="form-error" role="alert">
                {t(lockerError ?? serverError ?? "")}
              </p>
            )}
          </div>
        </form>
      </Modal>
    </section>
  );
}
