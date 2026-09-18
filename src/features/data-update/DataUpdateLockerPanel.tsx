import { useEffect, useMemo, useState } from "react";
import { EllipsisVertical, PencilLine } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Modal } from "@/components/ui/Modal";
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
import { dataUpdateError } from "./api";
import type { OfflineClient } from "./offline/client";
import {
  compareDataUpdateEmployeeNumbers,
  DATA_UPDATE_LOCKER_AREAS,
  DATA_UPDATE_PAGE_SIZE,
  isDataUpdateLockerArea,
} from "./constants";
import type { DataUpdateLockerArea, DataUpdateRecord } from "./types";

interface DataUpdateLockerPanelProps {
  records: DataUpdateRecord[];
  canEdit: boolean;
  client: OfflineClient;
  online: boolean;
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

export function DataUpdateLockerPanel({ records, canEdit, client, online, onRecordUpdated }: DataUpdateLockerPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
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
      const updated = await client.locker(selectedRecord.id, lockerArea, normalizedLocker);
      onRecordUpdated(updated);
      setSelectedRecord(null);
      toast.success({ title: online ? "Locker pendiente de sincronizar" : "Locker guardado en este dispositivo" });
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
          <p className="text-muted">Consulta los lockers por área de la campaña.</p>
        </div>
        {records.length > 0 && (
          <SearchField
            id="data-update-locker-search"
            className="data-update-queue__search"
            label="Buscar lockers"
            placeholder="Número, nombre, fecha, área o locker"
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
                <div className="data-update-admin-card__header">
                  <div className="data-update-admin-card__identity">
                    <span className="type-caption-up text-muted">{record.identity.employeeNumber}</span>
                    <h3>{record.identity.name}</h3>
                  </div>
                  {canEdit && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="dropdown-menu-trigger"
                          aria-label={`Acciones de ${record.identity.name}`}
                        >
                          <EllipsisVertical aria-hidden="true" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="data-update-admin-card__popover">
                        <button
                          type="button"
                          className="data-update-admin-card__action"
                          onClick={() => openEditor(record)}
                        >
                          <PencilLine aria-hidden="true" />
                          <span>Editar</span>
                        </button>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
                <dl className="data-update-locker-card__details">
                  <div>
                    <dt>Turno</dt>
                    <dd>{record.identity.shift || "—"}</dd>
                  </div>
                  <div>
                    <dt>Área de locker</dt>
                    <dd>{record.lockerArea || "Sin asignar"}</dd>
                  </div>
                  <div>
                    <dt>Locker</dt>
                    <dd>{record.data.locker.trim() || "Sin asignar"}</dd>
                  </div>
                </dl>
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
            <label htmlFor="data-update-locker-area">Área de locker</label>
            <CustomSelect
              id="data-update-locker-area"
              value={lockerArea}
              options={LOCKER_AREA_OPTIONS}
              placeholder="Selecciona un área"
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
                {lockerAreaError}
              </p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="data-update-locker-number">Número de locker</label>
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
                {lockerError || serverError}
              </p>
            )}
          </div>
        </form>
      </Modal>
    </section>
  );
}
