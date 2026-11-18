import type { EmpleadoRuta } from '@/lib/rutas-data';
import { useLanguage } from '@/contexts/LanguageContext';
import { getConfiguracionCopy } from './configuracion-translations';

const TRIP_SHIFTS = ['1', '2', '3'] as const;

const FOURTH_SHIFT_TRIP: Readonly<Record<string, string>> = {
  Domingo: '1',
  Lunes: '2',
  Martes: '2',
  Miércoles: '3',
  Jueves: '3',
};

interface RouteDayCapacitySummaryProps {
  employees: readonly EmpleadoRuta[];
  day: string;
  dayLabel: string;
  routeName: string;
  capacities: Readonly<Record<string, number>>;
}

export function RouteDayCapacitySummary({
  employees,
  day,
  dayLabel,
  routeName,
  capacities,
}: RouteDayCapacitySummaryProps) {
  const { language } = useLanguage();
  const copy = getConfiguracionCopy(language).routes;
  const counts = new Map<string, number>();

  for (const employee of employees) {
    const shift = employee.turno;
    if (shift !== '4' && !TRIP_SHIFTS.some((trip) => trip === shift)) continue;
    counts.set(shift, (counts.get(shift) ?? 0) + 1);
  }

  const rows = TRIP_SHIFTS.flatMap((trip) => {
    const shifts = FOURTH_SHIFT_TRIP[day] === trip ? [trip, '4'] : [trip];
    const activeShifts = shifts.filter((shift) => counts.has(shift));
    const capacity = capacities[trip];
    return activeShifts.map((shift, index) => ({
      shift,
      count: counts.get(shift) ?? 0,
      capacity: Number.isFinite(capacity) && capacity > 0 ? capacity : null,
      capacityRowSpan: index === 0 ? activeShifts.length : 0,
    }));
  });

  if (rows.length === 0) return null;

  return (
    <div className="ruta-day-page__capacity">
      <table className="data-table ruta-day-page__capacity-table">
        <caption className="sr-only">{copy.dayCapacity} · {routeName} · {dayLabel}</caption>
        <thead>
          <tr>
            <th scope="col">{copy.trip}</th>
            <th scope="col">{copy.employees}</th>
            <th scope="col">{copy.capacitySeats}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ shift, count, capacity, capacityRowSpan }) => (
            <tr key={shift}>
              <th scope="row">{copy.shift} {shift}</th>
              <td>{count}</td>
              {capacityRowSpan > 0 && (
                <td rowSpan={capacityRowSpan}>{capacity ?? copy.notAvailable}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
