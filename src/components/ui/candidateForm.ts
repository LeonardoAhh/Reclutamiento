import type { Candidate, CandidateStatus } from '@/lib/types';
import { isoToLocalDateString, localTodayIso } from '@/lib/dates';

export type CandidateModalMode = 'add' | 'edit' | 'delete';

export interface CandidateFormState {
  nombre: string;
  telefono: string;
  email: string;
  puesto: string;
  area: string;
  seccion: string;
  status: CandidateStatus;
  reclutador: string;
  source: string;
  cv_url: string;
  fecha_aplicacion: string;
  fecha_cita: string;
  is_starlite: boolean;
}

export type CandidateFormTouched = Record<keyof CandidateFormState, boolean>;

export interface CandidateFormErrors {
  nombre: string | null;
  telefono: string | null;
  email: string | null;
  area: string | null;
  seccion: string | null;
  puesto: string | null;
  reclutador: string | null;
  source: string | null;
  fecha_aplicacion: string | null;
  fecha_cita: string | null;
}

export function createEmptyCandidateForm(): CandidateFormState {
  return {
    nombre: '',
    telefono: '',
    email: '',
    puesto: '',
    area: '',
    seccion: '',
    status: 'entrevista',
    reclutador: '',
    source: '',
    cv_url: '',
    fecha_aplicacion: localTodayIso(),
    fecha_cita: '',
    is_starlite: false,
  };
}

export function createCandidateFormTouched(value: boolean): CandidateFormTouched {
  return {
    nombre: value,
    telefono: value,
    email: value,
    puesto: value,
    area: value,
    seccion: value,
    status: value,
    reclutador: value,
    source: value,
    cv_url: value,
    fecha_aplicacion: value,
    fecha_cita: value,
    is_starlite: value,
  };
}

export function createEmptyCandidateTouched(): CandidateFormTouched {
  return createCandidateFormTouched(false);
}

export function candidateToForm(candidate: Candidate): CandidateFormState {
  return {
    nombre: candidate.nombre ?? '',
    telefono: candidate.telefono ?? '',
    email: candidate.email ?? '',
    puesto: candidate.puesto ?? '',
    area: candidate.area ?? '',
    seccion: candidate.seccion ?? '',
    status: candidate.status,
    reclutador: candidate.reclutador ?? '',
    source: candidate.source ?? '',
    cv_url: candidate.cv_url ?? '',
    fecha_aplicacion: candidate.fecha_aplicacion ? isoToLocalDateString(candidate.fecha_aplicacion) : localTodayIso(),
    fecha_cita: candidate.fecha_cita ? isoToLocalDateString(candidate.fecha_cita) : '',
    is_starlite: candidate.is_starlite ?? false,
  };
}

export function isSequentialOrRepeatedPhone(phone: string): boolean {
  if (phone.length !== 10) return false;
  if (/^(\d)\1+$/.test(phone)) return true;
  return /^1234567890$|^0987654321$/.test(phone);
}

export function isValidCandidateName(name: string): boolean {
  return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name) && name.trim().split(/\s+/).length >= 2;
}
