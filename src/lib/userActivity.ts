import { formatDistanceToNow } from 'date-fns';
import { enUS, es } from 'date-fns/locale';

export function formatLastAccess(value: string | null | undefined, now: number, language: 'es' | 'en') {
  if (!value) return language === 'en' ? 'No access' : 'Sin acceso';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return language === 'en' ? 'Unknown' : 'Desconocido';

  const safeDate = date.getTime() > now ? new Date(now) : date;
  const distance = formatDistanceToNow(safeDate, {
    addSuffix: true,
    locale: language === 'en' ? enUS : es,
  }).replace(/alrededor de |casi |más de /g, '');

  return distance.charAt(0).toUpperCase() + distance.slice(1);
}

export function formatCompactLastAccess(lastAccess: string, language: 'es' | 'en') {
  if (language === 'en') {
    return lastAccess
      .replace(/^about /i, '')
      .replace(/ ago$/i, '')
      .replace(/^less than a minute$/i, '<1 min')
      .replace(/ minutes?$/, ' min')
      .replace(/ hours?$/, ' h')
      .replace(/ days?$/, ' d');
  }
  if (!lastAccess.startsWith('Hace ')) return lastAccess;

  return lastAccess
    .slice(5)
    .replace('menos de un minuto', '<1 min')
    .replace(/ minutos?$/, ' min')
    .replace(/ horas?$/, ' h')
    .replace(/ días?$/, ' d');
}

export function formatAccountLastAccess(lastAccess: string, language: 'es' | 'en') {
  const compact = formatCompactLastAccess(lastAccess, language);
  if (language === 'en') return lastAccess.endsWith(' ago') ? `${compact} ago` : compact;
  return lastAccess.startsWith('Hace ') ? `Hace ${compact}` : compact;
}
