import { useLanguage } from "@/contexts/LanguageContext";
import { INCIDENCIA_LABELS } from "./constants";
import { formatMes } from "./helpers";

const ENGLISH_INCIDENCES: Record<string, string> = {
  "-": "Not hired",
  A: "Present",
  F: "Unexcused absence",
  DF: "Public holiday",
  FJ: "Excused absence",
  S: "Sanction",
  P: "Leave",
  CT: "Shift change",
  I: "Sick leave",
  V: "Vacation",
  TXT: "Time off in lieu",
  D: "Rest day",
  PH: "Hourly leave",
  X: "No incident",
};

const ENGLISH_HOLIDAYS: Record<string, string> = {
  "Año Nuevo": "New Year's Day",
  "Día de la Constitución": "Constitution Day",
  "Benito Juárez": "Benito Juárez Day",
  "Día del Trabajo": "Labor Day",
  Independencia: "Independence Day",
  Revolución: "Revolution Day",
  Navidad: "Christmas Day",
  "Dia de las madres": "Mother's Day",
};

export function useReportLocale() {
  const { language } = useLanguage();
  const en = language === "en";

  return {
    en,
    copy: (spanish: string, english: string) => en ? english : spanish,
    month: (yearMonth: string) => {
      if (!en) return formatMes(yearMonth);
      const [year, month] = yearMonth.split("-").map(Number);
      if (!year || !month || month < 1 || month > 12) return yearMonth;
      return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
    },
    incident: (code: string) => en
      ? ENGLISH_INCIDENCES[code] ?? code
      : INCIDENCIA_LABELS[code] ?? code,
    holiday: (label: string) => en ? ENGLISH_HOLIDAYS[label] ?? label : label,
  };
}
