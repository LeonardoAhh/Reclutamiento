import { addDaysToIso, type IsoWeekRange } from "@/lib/dates";
import type { AuthorizedPosition, Baja, Employee } from "@/lib/types";
import { calculateWorkforceProjection } from "@/lib/workforceProjection";

export interface VacancySeriesPoint {
  day: string;
  dateIso: string;
  plantilla: number;
  backup: number;
  starlite: number;
}

interface VacancySeriesInput {
  week: IsoWeekRange;
  employees: readonly Employee[];
  bajas: readonly Baja[];
  positions: AuthorizedPosition[];
  dismissedKeys: ReadonlySet<string>;
  locale: string;
}

function weekStartIso(week: IsoWeekRange): string {
  const year = week.start.getUTCFullYear();
  const month = String(week.start.getUTCMonth() + 1).padStart(2, "0");
  const day = String(week.start.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Proyecta las vacantes de lunes a viernes para la semana visible.
 * Reconstruye cada día con los ingresos y bajas vigentes en esa fecha,
 * igual que el cálculo histórico que usaba la gráfica anterior.
 */
export function buildVacancySeries({
  week,
  employees,
  bajas,
  positions,
  dismissedKeys,
  locale,
}: VacancySeriesInput): VacancySeriesPoint[] {
  const dayFormatter = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    timeZone: "America/Mexico_City",
  });
  const startIso = weekStartIso(week);
  const points: VacancySeriesPoint[] = [];

  for (let index = 0; index < 5; index += 1) {
    const dateIso = addDaysToIso(startIso, index);
    if (!dateIso) continue;

    const activeEmployees = employees.filter(
      (employee) => String(employee.fecha_ingreso).localeCompare(dateIso) <= 0,
    );
    const historicalDepartures = bajas
      .filter(
        (baja) =>
          String(baja.fecha_ingreso).localeCompare(dateIso) <= 0 &&
          String(baja.fecha_baja).localeCompare(dateIso) > 0,
      )
      .map(
        (baja) =>
          ({
            ...baja,
            turno: baja.turno || "1",
            categoria: "",
          }) as Employee,
      );

    const projection = calculateWorkforceProjection(
      [...activeEmployees, ...historicalDepartures],
      positions,
      dateIso,
      dismissedKeys,
    );

    const rawLabel = dayFormatter
      .format(new Date(`${dateIso}T12:00:00-06:00`))
      .replace(",", "");

    points.push({
      day: rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1),
      dateIso,
      plantilla: projection.current.plantilla.vacancies,
      backup: projection.current.backup.vacancies,
      starlite: projection.current.starlite.vacancies,
    });
  }

  return points;
}
