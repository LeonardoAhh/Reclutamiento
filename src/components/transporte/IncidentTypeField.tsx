import { useEffect, useRef, useState, type FocusEvent } from "react";
import { Check, ChevronDown } from "lucide";
import { MorphingIcon } from "@/components/ui/MorphingIcon";
import "./IncidentTypeField.css";

const INCIDENT_TYPES = [
  "Retraso de unidad",
  "La unidad no pasó",
  "Exceso de pasajeros",
  "Queja del conductor",
  "Unidad en mal estado",
  "Choque o siniestro",
];

interface IncidentTypeFieldProps {
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

export function IncidentTypeField({
  value,
  error,
  disabled,
  onChange,
}: IncidentTypeFieldProps) {
  const [expanded, setExpanded] = useState(!value);
  const summaryRef = useRef<HTMLButtonElement>(null);
  const focusFrameRef = useRef<number | undefined>(undefined);
  const pointerSelectionRef = useRef(false);
  const pointerResetTimerRef = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.cancelAnimationFrame(focusFrameRef.current ?? 0);
      window.clearTimeout(pointerResetTimerRef.current);
    },
    [],
  );

  const scheduleFocus = (target: () => HTMLElement | null) => {
    window.cancelAnimationFrame(focusFrameRef.current ?? 0);
    focusFrameRef.current = window.requestAnimationFrame(() => target()?.focus());
  };

  const handleExpand = () => {
    setExpanded(true);
    const selectedIndex = Math.max(0, INCIDENT_TYPES.indexOf(value));
    scheduleFocus(() =>
      document.getElementById(`tipo-incidencia-${selectedIndex}`),
    );
  };

  const handleSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);

    const selectedWithPointer = pointerSelectionRef.current;
    pointerSelectionRef.current = false;
    if (!selectedWithPointer) return;

    setExpanded(false);
    scheduleFocus(() => summaryRef.current);
  };

  const markPointerSelection = () => {
    pointerSelectionRef.current = true;
    window.clearTimeout(pointerResetTimerRef.current);
    pointerResetTimerRef.current = window.setTimeout(() => {
      pointerSelectionRef.current = false;
    }, 0);
  };

  const handleOptionsBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget;
    if (value && (!nextTarget || !event.currentTarget.contains(nextTarget))) {
      setExpanded(false);
    }
  };

  return (
    <fieldset
      className="form-group reporte-publico__incident-fieldset"
      aria-describedby={error ? "tipo-incidencia-error" : undefined}
    >
      <legend className="reporte-publico__label">
        Tipo de incidencia <span aria-hidden="true">*</span>
      </legend>

      {expanded ? (
        <div
          className="reporte-publico__radios"
          onBlur={handleOptionsBlur}
          onPointerUp={markPointerSelection}
          onPointerCancel={() => {
            pointerSelectionRef.current = false;
          }}
        >
          {INCIDENT_TYPES.map((type, index) => (
            <label key={type} className="reporte-publico__radio-label">
              <input
                id={`tipo-incidencia-${index}`}
                type="radio"
                name="tipo_incidencia"
                value={type}
                required
                disabled={disabled}
                checked={value === type}
                aria-invalid={Boolean(error) || undefined}
                onChange={handleSelection}
              />
              <span>{type}</span>
            </label>
          ))}
        </div>
      ) : (
        <button
          ref={summaryRef}
          type="button"
          className="incident-type-field__summary"
          disabled={disabled}
          aria-expanded="false"
          onClick={handleExpand}
        >
          <span className="incident-type-field__value">
            <MorphingIcon icon={Check} size="var(--icon-size-sm)" />
            <span>{value}</span>
          </span>
          <span className="incident-type-field__change">
            Cambiar
            <MorphingIcon icon={ChevronDown} size="var(--icon-size-sm)" />
          </span>
        </button>
      )}

      {error && (
        <p id="tipo-incidencia-error" className="form-error-text">
          {error}
        </p>
      )}
    </fieldset>
  );
}
