import { useId, useRef, useState } from "react";
import { FileJson2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/lib/notify";
import { bulkUpdateDataUpdateShifts, dataUpdateError } from "./api";
import { previewDataUpdateShifts, type DataUpdateShiftPreview } from "./shiftImport";
import type { DataUpdateRecord } from "./types";
import { useDataUpdateText } from "./translations";

interface DataUpdateShiftImportModalProps {
  isOpen: boolean;
  campaignId: string;
  campaignName: string;
  records: DataUpdateRecord[];
  busy: boolean;
  online: boolean;
  onBusyChange: (busy: boolean) => void;
  onClose: () => void;
  onApplied: () => void;
}

export function DataUpdateShiftImportModal({
  isOpen,
  campaignId,
  campaignName,
  records,
  busy,
  online,
  onBusyChange,
  onClose,
  onApplied,
}: DataUpdateShiftImportModalProps) {
  const t = useDataUpdateText();
  const fileInputId = useId();
  const readIdRef = useRef(0);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<DataUpdateShiftPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const close = () => {
    if (submitting) return;
    readIdRef.current += 1;
    setFileName("");
    setPreview(null);
    setError(null);
    setReading(false);
    onClose();
  };

  const readFile = async (file: File | undefined) => {
    const readId = ++readIdRef.current;
    setFileName(file?.name ?? "");
    setPreview(null);
    setError(null);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".json")) {
      setError(t("Selecciona un archivo .json."));
      return;
    }
    setReading(true);
    try {
      const source: unknown = JSON.parse(await file.text());
      if (readId !== readIdRef.current) return;
      setPreview(previewDataUpdateShifts(source, records));
    } catch {
      if (readId === readIdRef.current) setError(t("El archivo no contiene JSON válido."));
    } finally {
      if (readId === readIdRef.current) setReading(false);
    }
  };

  const apply = async () => {
    if (!preview || preview.errors.length > 0 || preview.changes.length === 0 || busy || !online || submitting) return;
    setSubmitting(true);
    onBusyChange(true);
    setError(null);
    try {
      const updated = await bulkUpdateDataUpdateShifts(campaignId, preview.changes);
      toast.success({ title: `${updated} ${t("turnos actualizados")}` });
      setFileName("");
      setPreview(null);
      onClose();
      onApplied();
    } catch (caught) {
      setError(t(dataUpdateError(caught)));
    } finally {
      setSubmitting(false);
      onBusyChange(false);
    }
  };

  return (
    <Modal
      className="data-update-dialog"
      isOpen={isOpen}
      title={t("Actualizar turnos")}
      onClose={close}
      size="md"
      footerActions={
        <>
          <button type="button" className="btn-secondary" onClick={close} disabled={submitting}>
            {t("Cancelar")}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => void apply()}
            disabled={busy || !online || reading || submitting || !preview || preview.errors.length > 0 || preview.changes.length === 0}
          >
            {submitting ? t("Actualizando…") : `${t("Aplicar")} ${preview?.changes.length ?? 0} ${t("cambios")}`}
          </button>
        </>
      }
    >
      <div className="modal-body data-update-import">
        <p className="data-update-shifts__intro type-body-md text-muted">
          {t("Campaña")}: {campaignName}. {t('El JSON debe contener solo "Numero Empleado" y "Turno".')}
        </p>
        <div className="data-update-import__file">
          <label htmlFor={fileInputId} className="btn-secondary">
            <FileJson2 size="var(--icon-size-sm)" aria-hidden="true" />
            {t("Seleccionar JSON")}
            <input
              id={fileInputId}
              className="sr-only"
              type="file"
              accept="application/json,.json"
              disabled={reading || submitting}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                void readFile(file);
              }}
            />
          </label>
          <span className="data-update-shifts__filename type-body-md text-muted">
            {reading ? t("Leyendo archivo…") : fileName || t("Sin archivo seleccionado")}
          </span>
        </div>

        {preview && (
          <section className="data-update-import__preview" aria-label={t("Vista previa de turnos")}>
            <p className="data-update-shifts__summary" role="status">
              {preview.changes.length} {t("cambios")} · {preview.unchanged} {t("sin cambio")}
            </p>
            {preview.errors.length > 0 && (
              <>
                <p className="form-error" role="alert">
                  {t("Corrige el archivo antes de aplicar. No se actualizará ningún turno.")}
                </p>
                <ul className="data-update-import__messages data-update-import__messages--error">
                  {preview.errors.map((message) => <li key={message}>{t(message)}</li>)}
                </ul>
              </>
            )}
            {preview.changes.length === 0 && preview.errors.length === 0 && (
              <p>{t("No hay cambios para aplicar.")}</p>
            )}
            {preview.changes.length > 0 && (
              <ul className="data-update-shifts__list">
                {preview.changes.map((change) => (
                  <li key={change.employeeNumber} className="data-update-shifts__item">
                    <span className="data-update-shifts__identity">
                      <strong>{change.employeeName}</strong>
                      <span className="type-body-md text-muted">{change.employeeNumber}</span>
                    </span>
                    <span className="data-update-shifts__transition">
                      {change.previousShift || "—"} → {change.shift}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
        {error && <p className="form-error" role="alert">{t(error)}</p>}
        {!online && <p className="form-error" role="alert">{t("Reconéctate para aplicar los cambios.")}</p>}
      </div>
    </Modal>
  );
}
