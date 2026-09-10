import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { localTodayIso } from "@/lib/dates";
import { isDataUpdateBirthDateValid } from "./validation";

type PendingRemoval =
  | { type: "count"; nextCount: number }
  | { type: "child"; index: number };

interface ChildrenDetailsFieldProps {
  values: string[];
  isCountConfirmed: boolean;
  countError?: string;
  datesError?: string;
  onChange: (values: string[]) => void;
  onConfirmCount: () => void;
}

export function ChildrenDetailsField({
  values,
  isCountConfirmed,
  countError,
  datesError,
  onChange,
  onConfirmCount,
}: ChildrenDetailsFieldProps) {
  const addChildButtonRef = useRef<HTMLButtonElement>(null);
  const [countInput, setCountInput] = useState(() => String(values.length));
  const [countInputError, setCountInputError] = useState<string | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval | null>(null);
  const visibleCountError = countInputError ?? countError;
  const countHelpId = "data-update-children-count-help";
  const countErrorId = "data-update-children-count-error";

  useEffect(() => {
    setCountInput(String(values.length));
  }, [values.length]);

  const applyCount = (nextCount: number) => {
    const nextValues = nextCount > values.length
      ? [...values, ...Array.from({ length: nextCount - values.length }, () => "")]
      : values.slice(0, nextCount);
    onChange(nextValues);
    onConfirmCount();
    setCountInputError(null);
    setCountInput(String(nextCount));
  };

  const requestCountChange = () => {
    const normalized = countInput.trim();
    if (!/^\d+$/.test(normalized)) {
      setCountInputError("Escribe una cantidad entera igual o mayor que 0.");
      return;
    }

    const nextCount = Number(normalized);
    if (!Number.isSafeInteger(nextCount)) {
      setCountInputError("Escribe una cantidad entera válida.");
      return;
    }

    if (nextCount === values.length) {
      onConfirmCount();
      setCountInputError(null);
      setCountInput(String(nextCount));
      return;
    }

    const removedDates = values.slice(nextCount);
    if (nextCount < values.length && removedDates.some((value) => value.trim())) {
      setPendingRemoval({ type: "count", nextCount });
      return;
    }

    applyCount(nextCount);
  };

  const handleCountKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    requestCountChange();
  };

  const addChild = () => {
    const nextIndex = values.length;
    applyCount(nextIndex + 1);
    window.requestAnimationFrame(() => {
      document.getElementById(`data-update-child-birth-date-${nextIndex}`)?.focus();
    });
  };

  const changeBirthDate = (index: number, value: string) => {
    onChange(values.map((current, currentIndex) => (
      currentIndex === index ? value : current
    )));
    onConfirmCount();
  };

  const applyChildRemoval = (index: number) => {
    onChange(values.filter((_, currentIndex) => currentIndex !== index));
    onConfirmCount();
    window.requestAnimationFrame(() => addChildButtonRef.current?.focus());
  };

  const requestChildRemoval = (index: number) => {
    if (values[index]?.trim()) {
      setPendingRemoval({ type: "child", index });
      return;
    }
    applyChildRemoval(index);
  };

  const confirmRemoval = () => {
    if (!pendingRemoval) return;
    if (pendingRemoval.type === "count") applyCount(pendingRemoval.nextCount);
    else applyChildRemoval(pendingRemoval.index);
    setPendingRemoval(null);
  };

  const cancelRemoval = () => {
    if (pendingRemoval?.type === "count") setCountInput(String(values.length));
    setPendingRemoval(null);
  };

  const removedDatesCount = pendingRemoval?.type === "count"
    ? values.slice(pendingRemoval.nextCount).filter((value) => value.trim()).length
    : 0;
  const removalDescription = pendingRemoval?.type === "count"
    ? removedDatesCount === 1
      ? "Se eliminará una fecha de nacimiento ya capturada."
      : `Se eliminarán ${removedDatesCount} fechas de nacimiento ya capturadas.`
    : pendingRemoval?.type === "child"
      ? `Se eliminará la fecha de nacimiento del hijo ${pendingRemoval.index + 1}.`
      : undefined;

  return (
    <fieldset className="data-update-children">
      <legend>Hijos</legend>
      <div className="form-group data-update-children__count">
        <label htmlFor="data-update-children-count">Cantidad de hijos</label>
        <div className="data-update-children__count-controls">
          <input
            id="data-update-children-count"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={countInput}
            aria-invalid={Boolean(visibleCountError) || undefined}
            aria-describedby={`${countHelpId}${visibleCountError ? ` ${countErrorId}` : ""}`}
            onChange={(event) => {
              setCountInput(event.target.value);
              setCountInputError(null);
            }}
            onBlur={requestCountChange}
            onKeyDown={handleCountKeyDown}
            required
          />
          <button ref={addChildButtonRef} type="button" className="btn-secondary btn-sm" onClick={addChild}>
            <Plus aria-hidden="true" />
            Agregar hijo
          </button>
        </div>
        <span id={countHelpId} className="form-help">
          Escribe 0 si no tienes hijos.
        </span>
        {visibleCountError && (
          <p id={countErrorId} className="form-error-text">{visibleCountError}</p>
        )}
      </div>

      {isCountConfirmed && values.length === 0 ? (
        <p className="text-muted">Confirmaste que no tienes hijos.</p>
      ) : values.length > 0 ? (
        <div className="data-update-children__list">
          {values.map((birthDate, index) => {
            const fieldError = datesError && !isDataUpdateBirthDateValid(birthDate)
              ? datesError
              : undefined;
            const fieldId = `data-update-child-birth-date-${index}`;
            const errorId = `${fieldId}-error`;
            return (
              <div className="data-update-child" key={fieldId}>
                <div className="data-update-child__header">
                  <h3>Hijo {index + 1}</h3>
                  <button
                    type="button"
                    className="btn-icon"
                    aria-label={`Quitar hijo ${index + 1}`}
                    onClick={() => requestChildRemoval(index)}
                  >
                    <Trash2 aria-hidden="true" />
                  </button>
                </div>
                <div className="form-group">
                  <label htmlFor={fieldId}>Fecha de nacimiento</label>
                  <input
                    id={fieldId}
                    type="date"
                    max={localTodayIso()}
                    value={birthDate}
                    aria-invalid={Boolean(fieldError) || undefined}
                    aria-describedby={fieldError ? errorId : undefined}
                    onChange={(event) => changeBirthDate(index, event.target.value)}
                    required
                  />
                  {fieldError && <p id={errorId} className="form-error-text">{fieldError}</p>}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <ConfirmModal
        isOpen={pendingRemoval !== null}
        title="Reducir cantidad de hijos"
        description={removalDescription}
        confirmLabel="Quitar"
        cancelLabel="Conservar"
        onConfirm={confirmRemoval}
        onCancel={cancelRemoval}
        isDestructive
      />
    </fieldset>
  );
}
