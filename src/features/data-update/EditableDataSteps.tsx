import { useRef } from "react";
import { CustomSelect, type Option } from "@/components/ui/CustomSelect";
import { localTodayIso } from "@/lib/dates";
import { Plus, Trash2 } from "lucide-react";
import {
  DATA_UPDATE_OTHER_RELATIONSHIP,
  EMERGENCY_RELATIONSHIPS,
  MEXICO_STATES,
  PAYROLL_RECEIPT_OPTIONS,
  SHOE_SIZE_OPTIONS,
  SHIRT_SIZE_OPTIONS,
} from "./constants";
import type {
  DataUpdateEditableData,
  DataUpdateEditableTextKey,
  DataUpdateTransportOption,
} from "./types";
import { isDataUpdateBirthDateValid } from "./validation";

type EditableKey = DataUpdateEditableTextKey;
type EditableErrors = Partial<Record<EditableKey, string>>;

interface EditableDataStepProps {
  data: DataUpdateEditableData;
  onChange: (field: EditableKey, value: string) => void;
  errors?: EditableErrors;
}

interface TransportStepProps extends EditableDataStepProps {
  transportOptions: DataUpdateTransportOption[];
}

interface ContactStepProps extends EditableDataStepProps {
  civilStatuses: string[];
}

interface AddressStepProps extends EditableDataStepProps {
  relationshipChoice: string;
  relationshipOther: string;
  onRelationshipChoiceChange: (value: string) => void;
  onRelationshipOtherChange: (value: string) => void;
}

interface FamilyDataStepProps extends EditableDataStepProps {
  onChildrenBirthDatesChange: (values: string[]) => void;
  childrenError?: string;
}

function uppercaseOptions(values: readonly string[]): Option[] {
  return [...new Set(values)].map((value) => ({
    value,
    label: value.toLocaleUpperCase("es-MX"),
  }));
}

function optionsWithRegisteredValue(
  options: readonly Option[],
  currentValue: string,
): Option[] {
  const registeredValue = currentValue.trim();
  const catalogOptions = [...options];

  if (!registeredValue || catalogOptions.some((option) => option.value === registeredValue)) {
    return catalogOptions;
  }

  return [
    {
      value: currentValue,
      label: `${registeredValue.toLocaleUpperCase("es-MX")} — VALOR REGISTRADO`,
    },
    ...catalogOptions,
  ];
}

function Field({
  id,
  label,
  value,
  type = "text",
  autoComplete,
  onChange,
  multiline = false,
  error,
  digitsOnly = false,
  inputMode,
  max,
}: {
  id: string;
  label: string;
  value: string;
  type?: "text" | "email" | "tel" | "date";
  autoComplete?: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  error?: string;
  digitsOnly?: boolean;
  inputMode?: "text" | "tel" | "email" | "numeric" | "decimal";
  max?: string;
}) {
  const errorId = `${id}-error`;
  return (
    <div className={`form-group${multiline ? " form-group--span-2" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {multiline ? (
        <textarea
          className="data-update-value--uppercase"
          id={id}
          value={value}
          autoCapitalize="characters"
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          required
        />
      ) : (
        <input
          id={id}
          className={type === "email" ? undefined : "data-update-value--uppercase"}
          type={type}
          inputMode={inputMode ?? (type === "date" ? undefined : type === "email" ? "email" : digitsOnly ? "numeric" : type === "tel" ? "tel" : "text")}
          autoCapitalize={type === "email" ? "none" : "characters"}
          enterKeyHint="next"
          spellCheck={type === "email" ? false : undefined}
          maxLength={digitsOnly ? 10 : undefined}
          max={max}
          pattern={digitsOnly ? "[0-9]{10}" : undefined}
          value={value}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onChange(event.target.value)}
          required
        />
      )}
      {error && <p id={errorId} className="form-error-text">{error}</p>}
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
  disabled = false,
  error,
  placeholder,
  showPlaceholderOption = false,
}: {
  id: string;
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  showPlaceholderOption?: boolean;
}) {
  const errorId = `${id}-error`;
  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <CustomSelect
        id={id}
        value={value}
        options={options}
        onChange={onChange}
        placeholder={placeholder}
        showPlaceholderOption={showPlaceholderOption}
        disabled={disabled}
        aria-required="true"
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error && <p id={errorId} className="form-error-text">{error}</p>}
    </div>
  );
}

function PayrollReceiptField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const errorId = "data-update-payroll-receipts-error";
  return (
    <fieldset
      className="data-update-binary-field"
      aria-invalid={Boolean(error) || undefined}
      aria-describedby={error ? errorId : undefined}
    >
      <legend>¿Recibes recibos de nómina?</legend>
      <div className="data-update-binary-field__options">
        {PAYROLL_RECEIPT_OPTIONS.map((option) => (
          <label key={option}>
            <input
              type="radio"
              name="data-update-payroll-receipts"
              value={option}
              checked={value === option}
              onChange={(event) => onChange(event.target.value)}
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={error ? errorId : undefined}
              required
            />
            <span>{option === "SI" ? "Sí" : "No"}</span>
          </label>
        ))}
      </div>
      {error && <p id={errorId} className="form-error-text">{error}</p>}
    </fieldset>
  );
}

export function TransportStep({ data, transportOptions, onChange, errors }: TransportStepProps) {
  const routeOptions = uppercaseOptions(transportOptions.map((option) => option.route));
  const stopOptions = uppercaseOptions(
    transportOptions.filter((option) => option.route === data.route).map((option) => option.stop),
  );
  const locationOptions = uppercaseOptions(
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
      <div className="form-grid data-update-transport-grid">
        <SelectField id="data-update-route" label="Ruta" value={data.route} options={routeOptions} onChange={changeRoute} error={errors?.route} />
        <SelectField id="data-update-stop" label="Parada" value={data.stop} options={stopOptions} onChange={changeStop} disabled={!data.route} error={errors?.stop} />
        <div className="form-group--span-2">
          <SelectField id="data-update-location" label="Ubicación" value={data.location} options={locationOptions} onChange={(value) => onChange("location", value)} disabled={!data.stop} error={errors?.location} />
        </div>
      </div>
    </section>
  );
}

export function ContactStep({ data, civilStatuses, onChange, errors }: ContactStepProps) {
  return (
    <section className="data-update-step" aria-labelledby="contact-step-title">
      <div>
        <h2 id="contact-step-title">Contacto y datos personales</h2>
        <p className="text-muted">Verifica los valores precargados y actualiza lo necesario.</p>
      </div>
      <div className="data-update-contact-fields">
        <div className="form-grid data-update-contact-identity-grid">
          <SelectField id="data-update-birth-state" label="Estado de nacimiento" value={data.birthState} options={uppercaseOptions(MEXICO_STATES)} onChange={(value) => onChange("birthState", value)} error={errors?.birthState} />
          <SelectField id="data-update-civil-status" label="Estado civil" value={data.civilStatus} options={uppercaseOptions(civilStatuses)} onChange={(value) => onChange("civilStatus", value)} error={errors?.civilStatus} />
        </div>
        <div className="form-grid data-update-contact-channels-grid">
          <Field id="data-update-email" label="Correo" type="email" autoComplete="email" value={data.email} onChange={(value) => onChange("email", value)} error={errors?.email} />
          <PayrollReceiptField value={data.receivesPayrollReceipts} onChange={(value) => onChange("receivesPayrollReceipts", value)} error={errors?.receivesPayrollReceipts} />
          <Field id="data-update-mobile" label="Teléfono móvil" type="tel" autoComplete="tel" value={data.mobilePhone} onChange={(value) => onChange("mobilePhone", value)} error={errors?.mobilePhone} digitsOnly />
        </div>
      </div>
    </section>
  );
}

export function AddressStep({
  data,
  onChange,
  errors,
  relationshipChoice,
  relationshipOther,
  onRelationshipChoiceChange,
  onRelationshipOtherChange,
}: AddressStepProps) {
  return (
    <section className="data-update-step" aria-labelledby="address-step-title">
      <div>
        <h2 id="address-step-title">Emergencia y domicilio</h2>
        <p className="text-muted">Confirma que estos datos permitan contactar y ubicar al colaborador.</p>
      </div>
      <div className="data-update-address-fields">
        <div className="form-grid data-update-emergency-grid">
          <Field id="data-update-emergency-contact" label="Contacto de emergencia" autoComplete="name" value={data.emergencyContact} onChange={(value) => onChange("emergencyContact", value)} error={errors?.emergencyContact} />
          <div className="data-update-relationship-fields">
            <SelectField
              id="data-update-emergency-relationship"
              label="Parentesco"
              value={relationshipChoice}
              options={uppercaseOptions(EMERGENCY_RELATIONSHIPS)}
              placeholder="SELECCIONA EL PARENTESCO"
              showPlaceholderOption
              onChange={onRelationshipChoiceChange}
              error={!relationshipChoice ? errors?.emergencyRelationship : undefined}
            />
            {relationshipChoice === DATA_UPDATE_OTHER_RELATIONSHIP && (
              <Field
                id="data-update-emergency-relationship-other"
                label="Especifica el parentesco"
                value={relationshipOther}
                onChange={onRelationshipOtherChange}
                error={errors?.emergencyRelationship}
              />
            )}
          </div>
          <Field id="data-update-emergency-phone" label="Teléfono de emergencia" type="tel" autoComplete="tel" value={data.emergencyPhone} onChange={(value) => onChange("emergencyPhone", value)} error={errors?.emergencyPhone} digitsOnly />
        </div>
        <div className="form-grid data-update-address-grid">
          <Field id="data-update-street" label="Calle" autoComplete="street-address" value={data.street} onChange={(value) => onChange("street", value)} error={errors?.street} />
          <Field id="data-update-municipality" label="Municipio" autoComplete="address-level2" value={data.municipality} onChange={(value) => onChange("municipality", value)} error={errors?.municipality} />
        </div>
        <Field id="data-update-address" label="Dirección completa" autoComplete="street-address" value={data.fullAddress} onChange={(value) => onChange("fullAddress", value)} multiline error={errors?.fullAddress} />
      </div>
    </section>
  );
}

export function AdditionalDataStep({ data, onChange, errors }: EditableDataStepProps) {
  return (
    <section className="data-update-step" aria-labelledby="additional-step-title">
      <div>
        <h2 id="additional-step-title">Información adicional</h2>
        <p className="text-muted">Si un dato no aplica, escribe N/A o Ninguna según corresponda.</p>
      </div>
      <div className="form-grid data-update-additional-grid">
        <Field id="data-update-education" label="Último grado de estudios" value={data.educationLevel} onChange={(value) => onChange("educationLevel", value)} error={errors?.educationLevel} />
        <Field id="data-update-blood" label="Tipo de sangre" value={data.bloodType} onChange={(value) => onChange("bloodType", value)} error={errors?.bloodType} />
        <Field id="data-update-allergies" label="Alergias" value={data.allergies} onChange={(value) => onChange("allergies", value)} error={errors?.allergies} />
        <Field id="data-update-locker" label="Locker" value={data.locker} onChange={(value) => onChange("locker", value)} error={errors?.locker} />
      </div>
    </section>
  );
}

export function FamilyDataStep({
  data,
  onChange,
  errors,
  onChildrenBirthDatesChange,
  childrenError,
}: FamilyDataStepProps) {
  const addChildButtonRef = useRef<HTMLButtonElement>(null);
  const addChild = () => {
    const nextIndex = data.childrenBirthDates.length;
    onChildrenBirthDatesChange([...data.childrenBirthDates, ""]);
    window.requestAnimationFrame(() => {
      document.getElementById(`data-update-child-birth-date-${nextIndex}`)?.focus();
    });
  };
  const changeChildBirthDate = (index: number, value: string) => {
    onChildrenBirthDatesChange(
      data.childrenBirthDates.map((current, currentIndex) => (
        currentIndex === index ? value : current
      )),
    );
  };
  const removeChild = (index: number) => {
    onChildrenBirthDatesChange(
      data.childrenBirthDates.filter((_, currentIndex) => currentIndex !== index),
    );
    window.requestAnimationFrame(() => addChildButtonRef.current?.focus());
  };

  return (
    <section className="data-update-step" aria-labelledby="family-step-title">
      <div>
        <h2 id="family-step-title">Tallas e hijos</h2>
        <p className="text-muted">Registra las tallas y, si aplica, la fecha de nacimiento de cada hijo.</p>
      </div>

      <div className="form-grid data-update-family-size-grid">
        <SelectField
          id="data-update-shirt-size"
          label="Talla de playera"
          value={data.shirtSize}
          options={optionsWithRegisteredValue(SHIRT_SIZE_OPTIONS, data.shirtSize)}
          placeholder="SELECCIONA UNA TALLA"
          onChange={(value) => onChange("shirtSize", value)}
          error={errors?.shirtSize}
        />
        <SelectField
          id="data-update-shoe-size"
          label="Talla de zapatos"
          value={data.shoeSize}
          options={optionsWithRegisteredValue(SHOE_SIZE_OPTIONS, data.shoeSize)}
          placeholder="SELECCIONA UNA TALLA"
          onChange={(value) => onChange("shoeSize", value)}
          error={errors?.shoeSize}
        />
      </div>

      <fieldset className="data-update-children">
        <legend>Hijos</legend>
        <div className="data-update-children__header">
          <p>
            Cantidad de hijos: <strong aria-live="polite">{data.childrenBirthDates.length}</strong>
          </p>
          <button ref={addChildButtonRef} type="button" className="btn-secondary btn-sm" onClick={addChild}>
            <Plus aria-hidden="true" />
            Agregar hijo
          </button>
        </div>

        {data.childrenBirthDates.length === 0 ? (
          <p className="text-muted">Sin hijos registrados.</p>
        ) : (
          <div className="data-update-children__list">
            {data.childrenBirthDates.map((birthDate, index) => {
              const fieldError = childrenError && !isDataUpdateBirthDateValid(birthDate)
                ? childrenError
                : undefined;
              return (
                <div className="data-update-child" key={index}>
                  <div className="data-update-child__header">
                    <h3>Hijo {index + 1}</h3>
                    <button
                      type="button"
                      className="btn-icon"
                      aria-label={`Quitar hijo ${index + 1}`}
                      onClick={() => removeChild(index)}
                    >
                      <Trash2 aria-hidden="true" />
                    </button>
                  </div>
                  <Field
                    id={`data-update-child-birth-date-${index}`}
                    label="Fecha de nacimiento"
                    type="date"
                    max={localTodayIso()}
                    value={birthDate}
                    onChange={(value) => changeChildBirthDate(index, value)}
                    error={fieldError}
                  />
                </div>
              );
            })}
          </div>
        )}
      </fieldset>
    </section>
  );
}
