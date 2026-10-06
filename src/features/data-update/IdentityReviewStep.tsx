import { IDENTITY_FIELDS } from "./constants";
import type {
  DataUpdateIdentity,
  DataUpdateIncident,
  IdentityReviewStatus,
} from "./types";
import { useDataUpdateText } from "./translations";

interface IdentityReviewStepProps {
  identity: DataUpdateIdentity;
  review: IdentityReviewStatus;
  selectedFields: ReadonlySet<keyof DataUpdateIdentity>;
  note: string;
  existingIncidents: DataUpdateIncident[];
  onReviewChange: (value: "confirmado" | "incidencia") => void;
  onFieldToggle: (field: keyof DataUpdateIdentity) => void;
  onNoteChange: (value: string) => void;
}

export function IdentityReviewStep({
  identity,
  review,
  selectedFields,
  note,
  existingIncidents,
  onReviewChange,
  onFieldToggle,
  onNoteChange,
}: IdentityReviewStepProps) {
  const t = useDataUpdateText();
  return (
    <section className="data-update-step" aria-labelledby="identity-step-title">
      <div>
        <h2 id="identity-step-title">{t("Identificación")}</h2>
        <p className="text-muted">
          {t("Confirma la información bloqueada. Si algo no coincide, registra la incidencia y continúa.")}
        </p>
      </div>

      {review !== "incidencia" && (
        <dl className="data-update-identity-list">
          {IDENTITY_FIELDS.map((field) => (
            <div key={field.key}>
              <dt>{t(field.label)}</dt>
              <dd>{identity[field.key]}</dd>
            </div>
          ))}
        </dl>
      )}

      <fieldset className="data-update-review-choice">
        <legend>{t("Resultado de la revisión")}</legend>
        <div className="data-update-review-choice__options">
          <label>
            <input
              type="radio"
              name="identity-review"
              checked={review === "confirmado"}
              onChange={() => onReviewChange("confirmado")}
            />
            <span>{t("Los datos son correctos")}</span>
          </label>
          <label>
            <input
              type="radio"
              name="identity-review"
              checked={review === "incidencia"}
              onChange={() => onReviewChange("incidencia")}
            />
            <span>{t("Hay datos incorrectos")}</span>
          </label>
        </div>
      </fieldset>

      {review === "incidencia" && (
        <>
          <fieldset className="data-update-identity-list data-update-identity-list--selectable">
            <legend>{t("Campos incorrectos")}</legend>
            {IDENTITY_FIELDS.map((field) => (
              <label key={field.key}>
                <input
                  type="checkbox"
                  checked={selectedFields.has(field.key)}
                  onChange={() => onFieldToggle(field.key)}
                />
                <span className="data-update-identity-field">
                  <span className="data-update-identity-field__label">{t(field.label)}</span>
                  <span className="data-update-identity-field__value">{identity[field.key]}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="form-group">
            <label htmlFor="data-update-incident-note">{t("Observación")}</label>
            <textarea
              id="data-update-incident-note"
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              rows={3}
              required
              aria-describedby="data-update-incident-help"
            />
            <span id="data-update-incident-help" className="form-help">
              {t("Describe qué debe corregirse en los campos seleccionados.")}
            </span>
          </div>
        </>
      )}

      {existingIncidents.length > 0 && (
        <aside className="data-update-existing-incidents" aria-label={t("Incidencias registradas")}>
          <strong>{t("Incidencias registradas")}</strong>
          <ul>
            {existingIncidents.map((incident) => {
              const label = IDENTITY_FIELDS.find((field) => field.key === incident.fieldName)?.label;
              return <li key={incident.id}>{label ? t(label) : incident.fieldName}: {incident.note}</li>;
            })}
          </ul>
        </aside>
      )}
    </section>
  );
}
