import { CustomSelect, type Option } from "@/components/ui/CustomSelect";
import { MEXICO_STATES } from "./constants";
import type { DataUpdateEditableData, DataUpdateTransportOption } from "./types";

type EditableKey = keyof DataUpdateEditableData;

interface EditableDataStepProps {
  data: DataUpdateEditableData;
  onChange: (field: EditableKey, value: string) => void;
}

interface TransportStepProps extends EditableDataStepProps {
  transportOptions: DataUpdateTransportOption[];
}

interface ContactStepProps extends EditableDataStepProps {
  civilStatuses: string[];
}

function uniqueOptions(values: string[]): Option[] {
  return [...new Set(values)].map((value) => ({ value, label: value }));
}

function Field({
  id,
  label,
  value,
  type = "text",
  autoComplete,
  onChange,
  multiline = false,
}: {
  id: string;
  label: string;
  value: string;
  type?: "text" | "email" | "tel";
  autoComplete?: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className={`form-group${multiline ? " form-group--span-2" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {multiline ? (
        <textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} rows={3} required />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          required
        />
      )}
    </div>
  );
}

export function TransportStep({ data, transportOptions, onChange }: TransportStepProps) {
  const routeOptions = uniqueOptions(transportOptions.map((option) => option.route));
  const stopOptions = uniqueOptions(
    transportOptions.filter((option) => option.route === data.route).map((option) => option.stop),
  );
  const locationOptions = uniqueOptions(
    transportOptions
      .filter((option) => option.route === data.route && option.stop === data.stop)
      .map((option) => option.location),
  );

  const changeRoute = (route: string) => {
    onChange("route", route);
    onChange("stop", "");
    onChange("location", "");
  };
  const changeStop = (stop: string) => {
    onChange("stop", stop);
    onChange("location", "");
  };

  return (
    <section className="data-update-step" aria-labelledby="transport-step-title">
      <div>
        <h2 id="transport-step-title">Transporte</h2>
        <p className="text-muted">Selecciona una combinación válida de ruta, parada y ubicación.</p>
      </div>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="data-update-route">Ruta</label>
          <CustomSelect id="data-update-route" value={data.route} options={routeOptions} onChange={changeRoute} showPlaceholderOption={false} aria-required="true" />
        </div>
        <div className="form-group">
          <label htmlFor="data-update-stop">Parada</label>
          <CustomSelect id="data-update-stop" value={data.stop} options={stopOptions} onChange={changeStop} showPlaceholderOption={false} disabled={!data.route} aria-required="true" />
        </div>
        <div className="form-group form-group--span-2">
          <label htmlFor="data-update-location">Ubicación</label>
          <CustomSelect id="data-update-location" value={data.location} options={locationOptions} onChange={(value) => onChange("location", value)} showPlaceholderOption={false} disabled={!data.stop} aria-required="true" />
        </div>
      </div>
    </section>
  );
}

export function ContactStep({ data, civilStatuses, onChange }: ContactStepProps) {
  return (
    <section className="data-update-step" aria-labelledby="contact-step-title">
      <div>
        <h2 id="contact-step-title">Contacto y datos personales</h2>
        <p className="text-muted">Verifica los valores precargados y actualiza lo necesario.</p>
      </div>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="data-update-birth-state">Estado de nacimiento</label>
          <CustomSelect id="data-update-birth-state" value={data.birthState} options={MEXICO_STATES.map((value) => ({ value, label: value }))} onChange={(value) => onChange("birthState", value)} showPlaceholderOption={false} aria-required="true" />
        </div>
        <div className="form-group">
          <label htmlFor="data-update-civil-status">Estado civil</label>
          <CustomSelect id="data-update-civil-status" value={data.civilStatus} options={uniqueOptions(civilStatuses)} onChange={(value) => onChange("civilStatus", value)} showPlaceholderOption={false} aria-required="true" />
        </div>
        <Field id="data-update-email" label="Correo" type="email" autoComplete="email" value={data.email} onChange={(value) => onChange("email", value)} />
        <Field id="data-update-mobile" label="Teléfono móvil" type="tel" autoComplete="tel" value={data.mobilePhone} onChange={(value) => onChange("mobilePhone", value)} />
      </div>
    </section>
  );
}

export function AddressStep({ data, onChange }: EditableDataStepProps) {
  return (
    <section className="data-update-step" aria-labelledby="address-step-title">
      <div>
        <h2 id="address-step-title">Emergencia y domicilio</h2>
        <p className="text-muted">Confirma que estos datos permitan contactar y ubicar al colaborador.</p>
      </div>
      <div className="form-grid">
        <Field id="data-update-emergency-contact" label="Contacto de emergencia" autoComplete="name" value={data.emergencyContact} onChange={(value) => onChange("emergencyContact", value)} />
        <Field id="data-update-emergency-phone" label="Teléfono de emergencia" type="tel" value={data.emergencyPhone} onChange={(value) => onChange("emergencyPhone", value)} />
        <Field id="data-update-street" label="Calle" autoComplete="street-address" value={data.street} onChange={(value) => onChange("street", value)} />
        <Field id="data-update-municipality" label="Municipio" autoComplete="address-level2" value={data.municipality} onChange={(value) => onChange("municipality", value)} />
        <Field id="data-update-address" label="Dirección completa" autoComplete="street-address" value={data.fullAddress} onChange={(value) => onChange("fullAddress", value)} multiline />
      </div>
    </section>
  );
}

export function AdditionalDataStep({ data, onChange }: EditableDataStepProps) {
  return (
    <section className="data-update-step" aria-labelledby="additional-step-title">
      <div>
        <h2 id="additional-step-title">Información adicional</h2>
        <p className="text-muted">Si un dato no aplica, escribe N/A o Ninguna según corresponda.</p>
      </div>
      <div className="form-grid">
        <Field id="data-update-education" label="Último grado de estudios" value={data.educationLevel} onChange={(value) => onChange("educationLevel", value)} />
        <Field id="data-update-blood" label="Tipo de sangre" value={data.bloodType} onChange={(value) => onChange("bloodType", value)} />
        <Field id="data-update-allergies" label="Alergias" value={data.allergies} onChange={(value) => onChange("allergies", value)} />
        <Field id="data-update-locker" label="Locker" value={data.locker} onChange={(value) => onChange("locker", value)} />
      </div>
    </section>
  );
}
