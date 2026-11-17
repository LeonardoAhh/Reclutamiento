import { format, getISOWeek } from 'date-fns';
import { enUS, es } from 'date-fns/locale';

export function getReportDayHeading(currentMonth: string, selectedDay: string, en: boolean) {
  if (!selectedDay || !currentMonth) return { date: '', compactDate: '', week: '', compactWeek: '' };
  try {
    const date = new Date(`${currentMonth}-${selectedDay}T00:00:00`);
    const locale = en ? enUS : es;
    const weekday = format(date, 'EEEE', { locale });
    const day = format(date, 'd', { locale });
    const monthName = format(date, 'MMMM', { locale });
    const year = format(date, 'yyyy', { locale });
    const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    const capMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    const shortWeekday = format(date, 'EEE', { locale });
    const capShortWeekday = shortWeekday.charAt(0).toUpperCase() + shortWeekday.slice(1);
    const shortMonth = format(date, 'MMM', { locale });
    const weekNum = getISOWeek(date);

    return en
      ? {
          date: `${capWeekday}, ${capMonth} ${day}, ${year}`,
          compactDate: `${capShortWeekday}, ${shortMonth} ${day}`,
          week: `Week ${weekNum}`,
          compactWeek: `Wk ${weekNum}`,
        }
      : {
          date: `${capWeekday} ${day} ${capMonth} ${year}`,
          compactDate: `${capShortWeekday} ${day} ${shortMonth}`,
          week: `Semana ${weekNum}`,
          compactWeek: `Sem ${weekNum}`,
        };
  } catch {
    const date = `${en ? 'Incidents — day' : 'Incidencias — día'} ${parseInt(selectedDay, 10)}`;
    return { date, compactDate: date, week: '', compactWeek: '' };
  }
}
