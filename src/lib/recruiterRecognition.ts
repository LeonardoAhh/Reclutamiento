import { getISOWeek, getISOWeekYear } from 'date-fns';

export type RecognitionFrequency =
  | 'session'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'off';

export interface RecognitionPreferences {
  frequency: RecognitionFrequency;
  dismissedMonth?: string;
  lastShownBucket?: string;
}

export const RECOGNITION_FREQUENCY_OPTIONS: ReadonlyArray<{
  value: RecognitionFrequency;
  label: string;
}> = [
  { value: 'session', label: 'Cada sesión' },
  { value: 'daily', label: 'Una vez al día' },
  { value: 'weekly', label: 'Una vez por semana' },
  { value: 'monthly', label: 'Una vez al mes' },
  { value: 'off', label: 'Desactivados' },
];

const STORAGE_PREFIX = 'reclutamiento:recognition-preferences';
const SESSION_PREFIX = 'reclutamiento:recognition-session';
const DEFAULT_PREFERENCES: RecognitionPreferences = { frequency: 'session' };

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function frequencyBucket(frequency: RecognitionFrequency, date: Date) {
  switch (frequency) {
    case 'daily':
      return `daily:${monthKey(date)}-${String(date.getDate()).padStart(2, '0')}`;
    case 'weekly':
      return `weekly:${getISOWeekYear(date)}-${String(getISOWeek(date)).padStart(2, '0')}`;
    case 'monthly':
      return `monthly:${monthKey(date)}`;
    default:
      return frequency;
  }
}

function isRecognitionFrequency(value: unknown): value is RecognitionFrequency {
  return ['session', 'daily', 'weekly', 'monthly', 'off'].includes(String(value));
}

export function readRecognitionPreferences(userId: string): RecognitionPreferences {
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return DEFAULT_PREFERENCES;
    const candidate = parsed as Partial<RecognitionPreferences>;
    if (!isRecognitionFrequency(candidate.frequency)) return DEFAULT_PREFERENCES;
    return {
      frequency: candidate.frequency,
      dismissedMonth:
        typeof candidate.dismissedMonth === 'string' ? candidate.dismissedMonth : undefined,
      lastShownBucket:
        typeof candidate.lastShownBucket === 'string' ? candidate.lastShownBucket : undefined,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function writeRecognitionPreferences(userId: string, preferences: RecognitionPreferences) {
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(preferences));
    window.dispatchEvent(new CustomEvent('recognition-preferences-changed', {
      detail: { userId },
    }));
  } catch {
    // Preferencias locales no deben bloquear uso de aplicación.
  }
}

export function setRecognitionFrequency(
  userId: string,
  frequency: RecognitionFrequency,
  date = new Date(),
) {
  const current = readRecognitionPreferences(userId);
  writeRecognitionPreferences(userId, {
    ...current,
    frequency,
    lastShownBucket:
      frequency === 'session' || frequency === 'off'
        ? undefined
        : frequencyBucket(frequency, date),
  });
}

export function isRecognitionMonthDismissed(userId: string, date = new Date()) {
  return readRecognitionPreferences(userId).dismissedMonth === monthKey(date);
}

export function setRecognitionMonthDismissed(
  userId: string,
  dismissed: boolean,
  date = new Date(),
) {
  const current = readRecognitionPreferences(userId);
  writeRecognitionPreferences(userId, {
    ...current,
    dismissedMonth: dismissed ? monthKey(date) : undefined,
  });
}

export function shouldShowRecognition(userId: string, date = new Date()) {
  const preferences = readRecognitionPreferences(userId);
  if (preferences.frequency === 'off') return false;
  if (preferences.dismissedMonth === monthKey(date)) return false;

  if (preferences.frequency === 'session') {
    try {
      return window.sessionStorage.getItem(`${SESSION_PREFIX}:${userId}`) !== 'true';
    } catch {
      return true;
    }
  }

  return preferences.lastShownBucket !== frequencyBucket(preferences.frequency, date);
}

export function markRecognitionShown(userId: string, date = new Date()) {
  const preferences = readRecognitionPreferences(userId);
  if (preferences.frequency === 'session') {
    try {
      window.sessionStorage.setItem(`${SESSION_PREFIX}:${userId}`, 'true');
    } catch {
      // Sesión continúa aunque almacenamiento no esté disponible.
    }
    return;
  }

  if (preferences.frequency === 'off') return;
  writeRecognitionPreferences(userId, {
    ...preferences,
    lastShownBucket: frequencyBucket(preferences.frequency, date),
  });
}
