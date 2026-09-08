import { useId, useState, type FormEvent } from "react";
import { FileJson2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { createDataUpdateCampaign, dataUpdateError } from "./api";
import { parseDataUpdateImport } from "./validation";
import type { DataUpdateImportResult, DataUpdateProfileOption } from "./types";

interface CampaignImportModalProps {
  isOpen: boolean;
  profiles: DataUpdateProfileOption[];
  currentUserId: string;
  onClose: () => void;
  onCreated: (campaignId: string) => void;
}

export function CampaignImportModal({
  isOpen,
  profiles,
  currentUserId,
  onClose,
  onCreated,
}: CampaignImportModalProps) {
  const yearNow = new Date().getFullYear();
  const formId = useId();
  const fileInputId = useId();
  const [name, setName] = useState(`Actualización de datos ${yearNow}`);
  const [year, setYear] = useState(yearNow);
  const [participants, setParticipants] = useState<Set<string>>(
    () => new Set([currentUserId]),
  );
  const [parsed, setParsed] = useState<DataUpdateImportResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const close = () => {
    if (!submitting) onClose();
  };

  const readFile = async (file: File | undefined) => {
    setError(null);
    setParsed(null);
    setFileName(file?.name ?? "");
    if (!file) return;
    try {
      const source: unknown = JSON.parse(await file.text());
      setParsed(parseDataUpdateImport(source));
    } catch {
      setError("El archivo no contiene JSON válido.");
    }
  };

  const toggleParticipant = (profileId: string) => {
    setParticipants((current) => {
      const next = new Set(current);
      if (next.has(profileId)) next.delete(profileId);
      else next.add(profileId);
      return next;
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!parsed || parsed.rows.length === 0 || parsed.errors.length > 0 || participants.size === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const campaignId = await createDataUpdateCampaign({
        name: name.trim(),
        year,
        participantIds: Array.from(participants),
        parsed,
      });
      setParsed(null);
      setFileName("");
      setParticipants(new Set([currentUserId]));
      onCreated(campaignId);
    } catch (caught) {
      setError(dataUpdateError(caught));
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = Boolean(
    name.trim() &&
      year &&
      parsed &&
      parsed.rows.length > 0 &&
      parsed.errors.length === 0 &&
      participants.size > 0,
  );

  return (
    <Modal
      isOpen={isOpen}
      title="Nueva campaña"
      onClose={close}
      size="sm"
      footerActions={
        <>
          <button type="button" className="btn-secondary" onClick={close} disabled={submitting}>
            Cancelar
          </button>
          <button
            type="submit"
            form={formId}
            className="btn-primary"
            disabled={!canSubmit || submitting}
          >
            {submitting ? "Creando…" : "Crear y repartir"}
          </button>
        </>
      }
    >
      <form id={formId} className="modal-body data-update-import" onSubmit={submit} noValidate>
        <section className="data-update-import__section" aria-labelledby="campaign-data-title">
          <h3 id="campaign-data-title">Datos de campaña</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="data-update-campaign-name">Nombre de campaña</label>
              <input
                id="data-update-campaign-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="data-update-campaign-year">Año</label>
              <input
                id="data-update-campaign-year"
                type="number"
                inputMode="numeric"
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
                required
              />
            </div>
          </div>
        </section>

        <fieldset className="data-update-import__participants">
          <legend>Participantes del reparto</legend>
          <div className="data-update-import__participant-list">
            {profiles.map((profile) => (
              <label key={profile.id} className="data-update-import__participant">
                <input
                  type="checkbox"
                  checked={participants.has(profile.id)}
                  onChange={() => toggleParticipant(profile.id)}
                />
                <span>{profile.label}</span>
                <span className="text-muted type-caption-sm">{profile.role}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <section className="data-update-import__section" aria-labelledby="campaign-file-title">
          <div>
            <h3 id="campaign-file-title">Archivo de colaboradores</h3>
            <p className="type-caption-sm text-muted">Se valida la información antes de crear.</p>
          </div>
          <div className="data-update-import__file">
            <label htmlFor={fileInputId} className="btn-secondary">
              <FileJson2 size="var(--icon-size-sm)" aria-hidden="true" />
              Seleccionar JSON
            </label>
            <input
              id={fileInputId}
              className="sr-only"
              type="file"
              accept="application/json,.json"
              onChange={(event) => void readFile(event.target.files?.[0])}
            />
            <span className="type-caption-sm text-muted">{fileName || "Sin archivo seleccionado"}</span>
          </div>
        </section>

        {parsed && (
          <section className="data-update-import__preview" aria-live="polite">
            <strong>{parsed.rows.length} colaboradores listos</strong>
            <span>{parsed.transportOptions.length} combinaciones de transporte</span>
            <span>{parsed.civilStatuses.length} estados civiles</span>
            {parsed.rows.length > 0 && (
              <ul className="data-update-import__sample" aria-label="Vista previa de colaboradores">
                {parsed.rows.slice(0, 3).map((row) => (
                  <li key={row.identity.employeeNumber}>
                    <strong>{row.identity.employeeNumber}</strong>
                    <span>{row.identity.name}</span>
                  </li>
                ))}
              </ul>
            )}
            {parsed.errors.length > 0 && (
              <ul className="data-update-import__messages data-update-import__messages--error">
                {parsed.errors.map((message) => <li key={message}>{message}</li>)}
              </ul>
            )}
            {parsed.warnings.length > 0 && (
              <details>
                <summary>{parsed.warnings.length} advertencias para corregir durante la revisión</summary>
                <ul className="data-update-import__messages">
                  {parsed.warnings.map((message) => <li key={message}>{message}</li>)}
                </ul>
              </details>
            )}
          </section>
        )}

        {error && <p className="form-error" role="alert">{error}</p>}

      </form>
    </Modal>
  );
}
