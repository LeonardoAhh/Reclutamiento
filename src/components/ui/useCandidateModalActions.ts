import { useEffect, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react';
import type { Language } from '@/contexts/LanguageContext';
import type { Candidate } from '@/lib/types';
import { candidateText } from '@/lib/candidateTranslations';
import { formatReadableDate, localDateToIso } from '@/lib/dates';
import { toast } from '@/lib/notify';
import { playSound } from '@/lib/sound';
import { accessCardRecruiterName, type TeamMember } from '@/features/team/types';
import type { CandidateAccessCardData } from '@/lib/candidateAccessCard';
import {
  createCandidateFormTouched,
  type CandidateFormState,
  type CandidateFormTouched,
  type CandidateModalMode,
} from './candidateForm';

interface UseCandidateModalActionsOptions {
  candidate?: Candidate | null;
  candidates: Candidate[];
  form: CandidateFormState;
  isFormValid: boolean;
  isOpen: boolean;
  language: Language;
  members: readonly TeamMember[];
  mode: CandidateModalMode;
  onClose: () => void;
  onDelete?: (id: string) => Promise<{ ok: boolean; message?: string }> | void;
  onSave?: (
    payload: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>,
    id?: string,
  ) => Promise<{ ok: boolean; message?: string }> | void;
  setAccessCard: Dispatch<SetStateAction<CandidateAccessCardData | null>>;
  setTouched: Dispatch<SetStateAction<CandidateFormTouched>>;
}

export function useCandidateModalActions({
  candidate,
  candidates,
  form,
  isFormValid,
  isOpen,
  language,
  members,
  mode,
  onClose,
  onDelete,
  onSave,
  setAccessCard,
  setTouched,
}: UseCandidateModalActionsOptions) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const t = (value: string) => candidateText(value, language);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setSubmitting(false);
    setAccessCard(null);
  }, [candidate, isOpen, mode, setAccessCard]);

  useEffect(() => {
    if (errorMsg) setErrorMsg(null);
  }, [errorMsg, form]);

  async function handleDeleteConfirm() {
    if (submitting || !onDelete || !candidate?.id) return;
    setErrorMsg(null);

    try {
      setSubmitting(true);
      const result = await onDelete(candidate.id);
      if (result && result.ok === false) {
        const message = result.message ? t(result.message) : t('No se pudo eliminar.');
        setErrorMsg(message);
        setSubmitting(false);
        return;
      }

      onClose();
    } catch {
      playSound('error');
      const message = t('Ocurrió un error inesperado.');
      setErrorMsg(message);
      toast.error({ title: message });
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    if (!isFormValid && mode !== 'delete') {
      playSound('warning');
      setTouched(createCandidateFormTouched(true));
      setTimeout(() => {
        const firstInvalid = document.querySelector('.input-error, .form-error-text');
        if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }

    setErrorMsg(null);

    try {
      setSubmitting(true);

      if ((mode === 'add' || mode === 'edit') && form.email.trim()) {
        const isDuplicateEmail = candidates.some(
          (item) =>
            item.id !== candidate?.id &&
            item.email &&
            item.email.trim().toLowerCase() === form.email.trim().toLowerCase(),
        );
        if (isDuplicateEmail) {
          playSound('error');
          const message = t('Este correo electrónico ya está registrado en otro candidato.');
          setErrorMsg(message);
          toast.error({ title: message });
          setSubmitting(false);
          return;
        }
      }

      if ((mode === 'add' || mode === 'edit') && onSave) {
        const payload: Omit<Candidate, 'id' | 'created_at' | 'updated_at'> = {
          nombre: form.nombre.trim(),
          telefono: form.telefono.trim() || null,
          email: form.email.trim() || null,
          puesto: form.puesto,
          area: form.area,
          seccion: form.seccion || null,
          status: form.status,
          reclutador: form.reclutador.trim() || null,
          source: form.source.trim() || null,
          cv_url: form.cv_url.trim() || null,
          fecha_aplicacion: localDateToIso(form.fecha_aplicacion) ?? new Date().toISOString(),
          fecha_cita: form.fecha_cita ? form.fecha_cita : null,
          is_starlite: form.is_starlite,
        };

        const result = await onSave(payload, candidate?.id);
        if (result && result.ok === false) {
          const message = result.message ? t(result.message) : t('No se pudo guardar.');
          setErrorMsg(message);
          setSubmitting(false);
          return;
        }

        if (mode === 'add') {
          const recruiterName = accessCardRecruiterName(members, form.reclutador) ?? form.reclutador;
          setAccessCard({
            candidateName: payload.nombre,
            recruiterName,
            position: payload.puesto,
            interviewDate: payload.fecha_cita ? formatReadableDate(payload.fecha_cita) : null,
          });
          setSubmitting(false);
          return;
        }

        onClose();
      }
    } catch {
      playSound('error');
      const message = t('Ocurrió un error inesperado.');
      setErrorMsg(message);
      toast.error({ title: message });
      setSubmitting(false);
    }
  }

  return { errorMsg, handleDeleteConfirm, handleSubmit, submitting };
}
