import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Calendar } from "./Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import "./BirthDateField.css";

interface BirthDateFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

function isoToDisplay(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "";
}

function maskBirthDate(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function displayToIso(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year
    || parsed.getMonth() !== month - 1
    || parsed.getDate() !== day
  ) return null;

  return `${match[3]}-${match[2]}-${match[1]}`;
}

function isoToLocalDate(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function localDateToIso(value: Date): string {
  const year = String(value.getFullYear()).padStart(4, "0");
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function BirthDateField({ id, label, value, onChange, error }: BirthDateFieldProps) {
  const [displayValue, setDisplayValue] = useState(() => isoToDisplay(value));
  const [inputError, setInputError] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const preserveInvalidDraftRef = useRef(false);
  const selectedDate = useMemo(() => isoToLocalDate(value), [value]);
  const today = useMemo(() => {
    const current = new Date();
    return new Date(current.getFullYear(), current.getMonth(), current.getDate());
  }, []);
  const startMonth = useMemo(
    () => new Date(today.getFullYear() - 100, 0, 1),
    [today],
  );
  const visibleError = inputError ?? error;
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const calendarId = `${id}-calendar`;

  useEffect(() => {
    if (preserveInvalidDraftRef.current) {
      preserveInvalidDraftRef.current = false;
      return;
    }
    setDisplayValue(isoToDisplay(value));
  }, [value]);

  const commitDisplayValue = (nextDisplayValue: string) => {
    if (!nextDisplayValue) {
      onChange("");
      setInputError(null);
      return;
    }

    const isoValue = displayToIso(nextDisplayValue);
    if (!isoValue) {
      setInputError("Escribe una fecha válida en formato DD/MM/AAAA.");
      preserveInvalidDraftRef.current = true;
      onChange("");
      return;
    }
    if (isoValue > localDateToIso(today)) {
      setInputError("La fecha de nacimiento no puede ser futura.");
      preserveInvalidDraftRef.current = true;
      onChange("");
      return;
    }

    preserveInvalidDraftRef.current = false;
    setInputError(null);
    onChange(isoValue);
  };

  return (
    <div className="form-group birth-date-field">
      <label htmlFor={id}>{label}</label>
      <div className="birth-date-field__control">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="DD/MM/AAAA"
          maxLength={10}
          value={displayValue}
          aria-invalid={Boolean(visibleError) || undefined}
          aria-describedby={`${helpId}${visibleError ? ` ${errorId}` : ""}`}
          onChange={(event) => {
            const nextDisplayValue = maskBirthDate(event.target.value);
            setDisplayValue(nextDisplayValue);
            setInputError(null);
            if (!nextDisplayValue || nextDisplayValue.length === 10) {
              commitDisplayValue(nextDisplayValue);
            }
          }}
          onBlur={() => commitDisplayValue(displayValue)}
          required
        />
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="btn-icon birth-date-field__calendar-trigger"
              aria-label={`Abrir calendario para ${label.toLocaleLowerCase("es-MX")}`}
              aria-controls={calendarId}
              aria-expanded={isCalendarOpen}
            >
              <CalendarDays aria-hidden="true" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            id={calendarId}
            className="birth-date-field__calendar"
            align="end"
            aria-label={`Calendario para ${label.toLocaleLowerCase("es-MX")}`}
          >
            <Calendar
              mode="single"
              selected={selectedDate}
              defaultMonth={selectedDate ?? today}
              startMonth={startMonth}
              endMonth={today}
              captionLayout="dropdown"
              reverseYears
              navLayout="after"
              disabled={{ after: today }}
              onSelect={(date) => {
                if (!date) return;
                const isoValue = localDateToIso(date);
                preserveInvalidDraftRef.current = false;
                setDisplayValue(isoToDisplay(isoValue));
                setInputError(null);
                onChange(isoValue);
                setIsCalendarOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      <span id={helpId} className="form-help">
        Escribe día, mes y año. Los separadores se agregan automáticamente.
      </span>
      {visibleError && <p id={errorId} className="form-error-text">{visibleError}</p>}
    </div>
  );
}
