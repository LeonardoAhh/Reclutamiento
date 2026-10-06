import type { Language } from '@/contexts/LanguageContext';
import { CANDIDATE_STATUS_LABEL, type CandidateStatus } from '@/lib/types';

const ENGLISH_STATUS_LABEL: Record<CandidateStatus, string> = {
  entrevista: 'Interview',
  entrega_documentos: 'Document submission',
  faltan_documentos: 'Missing documents',
  feedback_pendiente: 'Feedback pending',
  contratado: 'Hired',
  rechazado: 'Rejected',
  no_asistio: 'Did not attend',
};

export function candidateStatusLabel(status: CandidateStatus, language: Language): string {
  return language === 'en' ? ENGLISH_STATUS_LABEL[status] : CANDIDATE_STATUS_LABEL[status];
}

const ENGLISH_COPY: Record<string, string> = {
  'El nombre completo es obligatorio.': 'Full name is required.',
  'Debe contener al menos nombre y apellido (solo letras).': 'Enter at least a first and last name using letters only.',
  'El teléfono es obligatorio.': 'Phone number is required.',
  'Debe tener exactamente 10 dígitos.': 'Enter exactly 10 digits.',
  'El número de teléfono parece ser falso o incorrecto.': 'This phone number appears to be invalid.',
  'El formato del correo electrónico no es válido.': 'Enter a valid email address.',
  'Selecciona un área.': 'Select an area.',
  'Selecciona una sección.': 'Select a section.',
  'Selecciona un puesto.': 'Select a position.',
  'Debes asignar un reclutador.': 'Assign a recruiter.',
  'Selecciona la fuente del candidato.': 'Select a candidate source.',
  'La fecha de contacto es obligatoria.': 'Contact date is required.',
  'La fecha de contacto no puede ser futura.': 'Contact date cannot be in the future.',
  'La fecha de entrevista es obligatoria.': 'Interview date is required.',
  'No se pudo eliminar.': 'Could not delete.',
  'No se pudo guardar.': 'Could not save.',
  'Ocurrió un error inesperado.': 'An unexpected error occurred.',
  'Este correo electrónico ya está registrado en otro candidato.': 'This email address is already registered for another candidate.',
  'Candidatos': 'Candidates', 'No Citados': 'Not scheduled',
  'Candidato no encontrado.': 'Candidate not found.',
};

export function candidateText(value: string, language: Language): string {
  if (language !== 'en') return value;
  if (ENGLISH_COPY[value]) return ENGLISH_COPY[value];
  if (value.startsWith('No se pudo guardar en Supabase: ')) return `Could not save in Supabase: ${value.slice('No se pudo guardar en Supabase: '.length)}`;
  if (value.startsWith('No se pudo eliminar en Supabase: ')) return `Could not delete in Supabase: ${value.slice('No se pudo eliminar en Supabase: '.length)}`;
  return value;
}

const ENGLISH_SOURCE_LABEL: Record<string, string> = {
  Referido: 'Referral',
  Pauta: 'Campaign',
  Volanteo: 'Flyers',
  Lona: 'Banner',
};

export function candidateSourceLabel(source: string, language: Language): string {
  return language === 'en' ? ENGLISH_SOURCE_LABEL[source] ?? source : source;
}
