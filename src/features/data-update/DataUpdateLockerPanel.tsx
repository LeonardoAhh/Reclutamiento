import { useEffect, useMemo, useState } from "react";
import { PencilLine } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { SearchField } from "@/components/ui/SearchField";
import { usePagination } from "@/hooks/usePagination";
import { formatReadableDate } from "@/lib/dates";
import { toast } from "@/lib/notify";
import { normalizeString } from "@/lib/utils";
import { assignDataUpdateLocker, dataUpdateError } from "./api";
import { compareDataUpdateEmployeeNumbers, DATA_UPDATE_PAGE_SIZE } from "./constants";
import type { DataUpdateRecord } from "./types";

interface DataUpdateLockerPanelProps {
  records: DataUpdateRecord[];
  canEdit: boolean;
  onRefresh: () => void;
}

function getLockerError(locker: string, alreadyAssigned: boolean): string | null {
  if (locker === "") return "Escribe el número de locker.";
  if (!/^\d+$/.test(locker)) return "Usa solo números.";
  if (alreadyAssigned) return "Este locker ya está asignado a otro colaborador.";
  return null;
}

export function DataUpdateLockerPanel({ records, canEdit, onRefresh }: DataUpdateLockerPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<DataUpdateRecord | null>(null);
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
        record.data.locker,
      ].join(" "));
      return terms.every((term) => searchableText.includes(term));
    });
  }, [searchTerm, sortedRecords]);
  const pagination = usePagination(visibleRecords, DATA_UPDATE_PAGE_SIZE);
  const normalizedLocker = locker.trim();
  const lockerAlreadyAssigned = records.some(
    (record) => record.id !== selectedRecord?.id && record.data.locker.trim() === normalizedLocker,
  );
  const lockerError = submitAttempted
    ? getLockerError(normalizedLocker, lockerAlreadyAssigned)
    : null;

  useEffect(() => {
    pagination.goToPage(1);
  }, [pagination.goToPage, records, searchTerm]);

  const openEditor = (record: DataUpdateRecord) => {
    setSelectedRecord(record);
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
      || normalizedLocker === ""
      || !/^\d+$/.test(normalizedLocker)
      || lockerAlreadyAssigned
    ) return;

    setSaving(true);
    try {
      await assignDataUpdateLocker(selectedRecord.id, normalizedLocker);
      setSelectedRecord(null);
      toast.success({ title: "Locker asignado" });
      onRefresh();
    } catch (caught) {
      setServerError(dataUpdateError(caught));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="data-update-lockers" aria-labelledby="data-update-lockers-title">
      <div className="data-update-section-heading">
        <div>
          <h2 id="data-update-lockers-title">Locker</h2>
          <p className="text-muted">Consulta los lockers de la campaña.</p>
        </div>
        {records.length > 0 && (
          <SearchField
            id="data-update-locker-search"
            className="data-update-queue__search"
            label="Buscar lockers"
            placeholder="Número, nombre, fecha o locker"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onClear={() => setSearchTerm("")}
            onKeyDown={(event) => {
              if (event.key === "Escape" && searchTerm) setSearchTerm("");
            }}
            aria-controls="data-update-locker-list"
            autoComplete="off"
          />
        )}
      </div>

      {records.length === 0 ? (
        <p className="data-update-message">No hay registros disponibles en esta campaña.</p>
      ) : visibleRecords.length === 0 ? (
        <div id="data-update-locker-list" className="data-update-search-empty" role="status">
          <p>No hay coincidencias para “{searchTerm.trim()}”.</p>
          <button type="button" className="btn-secondary" onClick={() => setSearchTerm("")}>Limpiar búsqueda</button>
        </div>
      ) : (
        <>
          <div id="data-update-locker-list" className="data-update-record-grid">
            {pagination.pageItems.map((record) => (
              <article key={record.id} className="card data-update-record-card data-update-locker-card">
                <div>
                  <span className="type-caption-up text-muted">{record.identity.employeeNumber}</span>
                  <h3>{record.identity.name}</h3>
                </div>
                <dl className="data-update-locker-card__details">
                  <div>
                    <dt>Fecha de ingreso</dt>
                    <dd>{formatReadableDate(record.identity.hireDate)}</dd>
                  </div>
                  <div>
                    <dt>Locker</dt>
                    <dd>{record.data.locker.trim() || "Sin asignar"}</dd>
                  </div>
                </dl>
                {canEdit && (
                  <button type="button" className="btn-secondary" onClick={() => openEditor(record)}>
                    <PencilLine aria-hidden="true" />
                    Editar
                  </button>
                )}
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
              ariaLabel="Paginación de lockers"
              variant="compact"
            />
          )}
        </>
      )}

      <Modal
        isOpen={selectedRecord !== null}
        title="Asignar locker"
        size="xs"
        onClose={closeEditor}
        footerActions={(
          <>
            <button type="button" className="btn-secondary" onClick={closeEditor} disabled={saving}>Cancelar</button>
            <button type="submit" form="data-update-locker-form" className="btn-primary" disabled={saving}>
              {saving ? "Guardando…" : "Guardar"}
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
            <label htmlFor="data-update-locker-number">Número de locker</label>
            <input
              id="data-update-locker-number"
              className="form-control"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              autoFocus
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
                {lockerError || serverError}
              </p>
            )}
          </div>
        </form>
      </Modal>
    </section>
  );
}
