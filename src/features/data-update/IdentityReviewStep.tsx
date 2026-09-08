import { IDENTITY_FIELDS } from "./constants";
import type {
  DataUpdateIdentity,
  DataUpdateIncident,
  IdentityReviewStatus,
} from "./types";

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
  return (
    <section className="data-update-step" aria-labelledby="identity-step-title">
      <div>
        <h2 id="identity-step-title">Identificación</h2>
        <p className="text-muted">
          Confirma la información bloqueada. Si algo no coincide, registra la incidencia y continúa.
        </p>
      </div>

      {review !== "incidencia" && (
        <dl className="data-update-identity-list">
          {IDENTITY_FIELDS.map((field) => (
            <div key={field.key}>
              <dt>{field.label}</dt>
              <dd>{identity[field.key]}</dd>
            </div>
          ))}
        </dl>
      )}

      <fieldset className="data-update-review-choice">
        <legend>Resultado de la revisión</legend>
        <label>
          <input
            type="radio"
            name="identity-review"
            checked={review === "confirmado"}
            onChange={() => onReviewChange("confirmado")}
          />
          <span>Los datos son correctos</span>
        </label>
        <label>
          <input
            type="radio"
            name="identity-review"
            checked={review === "incidencia"}
            onChange={() => onReviewChange("incidencia")}
          />
          <span>Hay datos incorrectos</span>
        </label>
      </fieldset>

      {review === "incidencia" && (
        <>
          <fieldset className="data-update-identity-list data-update-identity-list--selectable">
            <legend>Campos incorrectos</legend>
            {IDENTITY_FIELDS.map((field) => (
              <label key={field.key}>
                <input
                  type="checkbox"
                  checked={selectedFields.has(field.key)}
                  onChange={() => onFieldToggle(field.key)}
                />
                <span className="data-update-identity-field">
                  <span className="data-update-identity-field__label">{field.label}</span>
                  <span className="data-update-identity-field__value">{identity[field.key]}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="form-group">
            <label htmlFor="data-update-incident-note">Observación</label>
            <textarea
              id="data-update-incident-note"
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              rows={3}
              required
              aria-describedby="data-update-incident-help"
            />
            <span id="data-update-incident-help" className="form-help">
              Describe qué debe corregirse en los campos seleccionados.
            </span>
          </div>
        </>
      )}

      {existingIncidents.length > 0 && (
        <aside className="data-update-existing-incidents" aria-label="Incidencias registradas">
          <strong>Incidencias registradas</strong>
          <ul>
            {existingIncidents.map((incident) => {
              const label = IDENTITY_FIELDS.find((field) => field.key === incident.fieldName)?.label;
              return <li key={incident.id}>{label ?? incident.fieldName}: {incident.note}</li>;
            })}
          </ul>
        </aside>
      )}
    </section>
  );
}
