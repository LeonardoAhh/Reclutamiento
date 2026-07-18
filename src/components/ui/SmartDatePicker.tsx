import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils-shadcn";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { Calendar } from "./Calendar";
import "./SmartDatePicker.css";

// ── Constants & Helpers ───────────────────────────────────────────────

const PRESET_DATES = [
  { label: "Hoy", getValue: () => new Date() },
  { label: "Ayer", getValue: () => { const d = new Date(); d.setDate(d.getDate() - 1); return d; } },
  { label: "Mañana", getValue: () => { const d = new Date(); d.setDate(d.getDate() + 1); return d; } },
];

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
];

// parse YYYY-MM-DD or YYYY-MM-DDTHH:mm to Date
function parseIsoToDate(iso: string): Date | undefined {
  if (!iso) return undefined;
  const parsed = new Date(iso);
  return isNaN(parsed.getTime()) ? undefined : parsed;
}

// Format local date back to YYYY-MM-DD
function formatToDateIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// Format local date + time back to YYYY-MM-DDTHH:mm
function formatToDateTimeIso(d: Date, timeStr: string): string {
  const dateIso = formatToDateIso(d);
  return `${dateIso}T${timeStr}`;
}

// ── SmartDatePicker ───────────────────────────────────────────────────

export interface SmartDatePickerProps {
  value: string; // ISO string (YYYY-MM-DD or YYYY-MM-DDTHH:mm)
  onChange: (value: string) => void;
  withTime?: boolean;
  placeholder?: string;
  disabled?: boolean;
  presets?: "past" | "future" | "none";
  id?: string;
}

export function SmartDatePicker({
  value,
  onChange,
  withTime = false,
  placeholder = "Seleccionar fecha",
  disabled = false,
  presets = "none"
}: SmartDatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Derive Date and Time from ISO value
  const dateValue = parseIsoToDate(value);
  
  // Extract time if needed
  let initialTime = "";
  if (withTime && value && value.includes("T")) {
    initialTime = value.split("T")[1].substring(0, 5); // get HH:mm
  } else if (withTime && value && value.length > 10) {
    // try to extract from raw string if space separated
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      initialTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
  }
  
  const [selectedTime, setSelectedTime] = React.useState<string>(initialTime);

  // Update internal time when value changes externally
  React.useEffect(() => {
    if (withTime && value && value.includes("T")) {
      setSelectedTime(value.split("T")[1].substring(0, 5));
    }
  }, [value, withTime]);

  const handleDateSelect = (d: Date | undefined) => {
    if (!d) return;
    
    if (!withTime) {
      onChange(formatToDateIso(d));
      setIsOpen(false);
    } else {
      // If time is required, just store the date and keep popover open,
      // or if time is already selected, emit the full string.
      const timeToUse = selectedTime || "10:00";
      if (!selectedTime) setSelectedTime("10:00");
      onChange(formatToDateTimeIso(d, timeToUse));
    }
  };

  const handleTimeSelect = (t: string) => {
    setSelectedTime(t);
    if (dateValue) {
      onChange(formatToDateTimeIso(dateValue, t));
      setIsOpen(false); // Close after both are selected
    }
  };

  const handlePresetSelect = (presetFunc: () => Date) => {
    const d = presetFunc();
    if (!withTime) {
      onChange(formatToDateIso(d));
      setIsOpen(false);
    } else {
      const timeToUse = selectedTime || "10:00";
      if (!selectedTime) setSelectedTime("10:00");
      onChange(formatToDateTimeIso(d, timeToUse));
      // In withTime mode, we might want to keep it open to let them pick the time.
    }
  };

  // Determine presets to show
  const activePresets = presets === "past" 
    ? PRESET_DATES.filter(p => p.label === "Hoy" || p.label === "Ayer")
    : presets === "future"
    ? PRESET_DATES.filter(p => p.label === "Hoy" || p.label === "Mañana")
    : [];

  return (
    <div className="smart-datepicker">


      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "smart-datepicker__trigger",
              !dateValue && "smart-datepicker__trigger--muted",
              disabled && "smart-datepicker__trigger--disabled"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="smart-datepicker__icon" />
            {dateValue ? (
              <span>
                {format(dateValue, "PP", { locale: es })}
                {withTime && selectedTime && ` - ${selectedTime}`}
              </span>
            ) : (
              <span>{placeholder}</span>
            )}
          </button>
        </PopoverTrigger>
        
        <PopoverContent className="smart-datepicker__popover" align="start">
          <div className={cn("smart-datepicker__content", withTime && "smart-datepicker__content--with-time")}>
            <div className="smart-datepicker__calendar-wrapper">
              <Calendar
                mode="single"
                selected={dateValue}
                onSelect={handleDateSelect}
              />
            </div>
            
            {withTime && (
              <div className="smart-datepicker__time-wrapper">
                <div className="smart-datepicker__time-header">
                  <Clock size={14} />
                  <span>Hora</span>
                </div>
                <div className="smart-datepicker__time-grid">
                  {TIME_SLOTS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleTimeSelect(t)}
                      className={cn(
                        "smart-datepicker__time-btn",
                        selectedTime === t && "smart-datepicker__time-btn--selected"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Quick Action Presets */}
      {activePresets.length > 0 && (
        <div className="smart-datepicker__presets">
          {activePresets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="smart-datepicker__preset-btn"
              onClick={() => handlePresetSelect(preset.getValue)}
              disabled={disabled}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
