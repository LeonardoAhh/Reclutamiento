import type { Language } from '@/contexts/LanguageContext';

const ENGLISH_ERRORS: Record<string, string> = {
  'Selecciona Vacaciones o Permiso.': 'Select Vacation or Leave.',
  'Selecciona las fechas de inicio y fin.': 'Select a start and end date.',
  'La fecha de inicio no puede ser anterior a hoy.': 'The start date cannot be in the past.',
  'La fecha final debe ser igual o posterior a la inicial.': 'The end date must be on or after the start date.',
  'Estas fechas coinciden con otra solicitud de reclutamiento. Elige otro periodo.': 'These dates overlap another recruitment request. Choose another period.',
  'Tu cuenta no tiene acceso para guardar solicitudes.': 'Your account does not have access to submit requests.',
  'No se pudo guardar. Revisa tu conexión y vuelve a intentar.': 'Could not save. Check your connection and try again.',
  'No se pudo confirmar el guardado. Vuelve a intentar.': 'Could not confirm the request was saved. Try again.',
  'No se pudieron leer las solicitudes.': 'Could not read the requests.',
  'No se pudieron cargar las solicitudes. Vuelve a intentar.': 'Could not load requests. Try again.',
  'No se pudieron cargar las solicitudes.': 'Could not load requests.',
  'No se pudo actualizar la solicitud.': 'Could not update the request.',
  'No se pudo autorizar. Revisa tu conexión y vuelve a intentar.': 'Could not approve. Check your connection and try again.',
  'No se pudo confirmar la autorización. Vuelve a intentar.': 'Could not confirm approval. Try again.',
  'Tu cuenta no tiene acceso para eliminar esta solicitud.': 'Your account does not have access to delete this request.',
  'No se pudo eliminar. Revisa tu conexión y vuelve a intentar.': 'Could not delete. Check your connection and try again.',
  'No se pudo confirmar la eliminación. Vuelve a intentar.': 'Could not confirm deletion. Try again.',
};

export function leaveErrorText(message: string, language: Language): string {
  return language === 'en' ? ENGLISH_ERRORS[message] ?? message : message;
}
