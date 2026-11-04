import { useEffect, useMemo, useState } from 'react';
import type { Language } from '@/contexts/LanguageContext';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { calculatePositionCoverage } from '@/lib/utils';
import { candidateText } from '@/lib/candidateTranslations';
import { localTodayIso } from '@/lib/dates';
import { usePositions } from '@/lib/positions';
import type { Candidate } from '@/lib/types';
import { useTeamDirectory } from '@/features/team/TeamProvider';

import {
  candidateToForm,
  createEmptyCandidateForm,
  createEmptyCandidateTouched,
  isSequentialOrRepeatedPhone,
  isValidCandidateName,
  type CandidateFormErrors,
  type CandidateFormState,
  type CandidateFormTouched,
  type CandidateModalMode,
} from './candidateForm';

interface UseCandidateModalFormOptions {
  candidate?: Candidate | null;
  candidates: Candidate[];
  isOpen: boolean;
  language: Language;
  mode: CandidateModalMode;
}

export function useCandidateModalForm({ candidate, candidates, isOpen, language, mode }: UseCandidateModalFormOptions) {
  const [form, setForm] = useState<CandidateFormState>(createEmptyCandidateForm);
  const [touched, setTouched] = useState<CandidateFormTouched>(createEmptyCandidateTouched);
  const { positions } = usePositions();
  const { employees, comments, noCitados } = useSupabaseData();
  const { members } = useTeamDirectory();
  const en = language === 'en';
  const t = (value: string) => candidateText(value, language);

  const positionCoverage = useMemo(
    () => calculatePositionCoverage(employees, comments, positions),
    [employees, comments, positions],
  );
  const openPositionsKeySet = useMemo(() => {
    const keys = new Set<string>();
    for (const position of positionCoverage) {
      if (position.vacantes > 0) {
        keys.add(`${position.area}||${position.seccion ?? ''}||${position.puesto}`);
      }
    }
    return keys;
  }, [positionCoverage]);

  const restrictToOpen = mode === 'add';
  const openPositions = useMemo(
    () =>
      restrictToOpen
        ? positions.filter((position) =>
            openPositionsKeySet.has(`${position.area}||${position.seccion ?? ''}||${position.puesto}`),
          )
        : positions,
    [positions, openPositionsKeySet, restrictToOpen],
  );
  const areas = useMemo(
    () => Array.from(new Set(openPositions.map((position) => position.area))).sort(),
    [openPositions],
  );
  const sectionsForArea = useMemo(
    () =>
      Array.from(
        new Set(openPositions.filter((position) => position.area === form.area).map((position) => position.seccion)),
      ).sort(),
    [openPositions, form.area],
  );
  const puestosForSection = useMemo(
    () =>
      Array.from(
        new Set(
          openPositions
            .filter((position) => position.area === form.area && position.seccion === form.seccion)
            .map((position) => position.puesto),
        ),
      ).sort(),
    [openPositions, form.area, form.seccion],
  );

  useEffect(() => {
    if (!isOpen) return;
    setForm(candidate ? candidateToForm(candidate) : createEmptyCandidateForm());
    setTouched(createEmptyCandidateTouched());
  }, [candidate, isOpen, mode]);

  const telDigits = form.telefono.replace(/\D/g, '');
  const isPhoneValid = telDigits.length === 10 && !isSequentialOrRepeatedPhone(telDigits);
  const duplicateSource = useMemo(() => {
    if (telDigits.length !== 10) return null;
    if (candidates.some((item) => item.id !== candidate?.id && item.telefono?.replace(/\D/g, '') === telDigits)) {
      return 'Candidatos';
    }
    if (noCitados.some((item) => item.telefono?.replace(/\D/g, '') === telDigits)) {
      return 'No Citados';
    }
    return null;
  }, [candidate?.id, candidates, noCitados, telDigits]);

  const nombreError = !form.nombre.trim()
    ? 'El nombre completo es obligatorio.'
    : !isValidCandidateName(form.nombre)
      ? 'Debe contener al menos nombre y apellido (solo letras).'
      : null;
  const telefonoError =
    telDigits.length === 0
      ? 'El teléfono es obligatorio.'
      : telDigits.length !== 10
        ? 'Debe tener exactamente 10 dígitos.'
        : isSequentialOrRepeatedPhone(telDigits)
          ? 'El número de teléfono parece ser falso o incorrecto.'
          : duplicateSource
            ? en
              ? `Duplicate phone number in ${t(duplicateSource)}`
              : `Teléfono duplicado en ${duplicateSource}`
            : null;
  const emailError =
    form.email === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
      ? null
      : 'El formato del correo electrónico no es válido.';
  const noOpenPositions = restrictToOpen && areas.length === 0;
  const errors: CandidateFormErrors = {
    nombre: nombreError ? t(nombreError) : null,
    telefono: telefonoError ? t(telefonoError) : null,
    email: emailError ? t(emailError) : null,
    area: !form.area ? t('Selecciona un área.') : null,
    seccion: !form.seccion ? t('Selecciona una sección.') : null,
    puesto: !form.puesto ? t('Selecciona un puesto.') : null,
    reclutador: !form.reclutador ? t('Debes asignar un reclutador.') : null,
    source: !form.source ? t('Selecciona la fuente del candidato.') : null,
    fecha_aplicacion: !form.fecha_aplicacion
      ? t('La fecha de contacto es obligatoria.')
      : form.fecha_aplicacion > localTodayIso()
        ? t('La fecha de contacto no puede ser futura.')
        : null,
    fecha_cita: !form.fecha_cita ? t('La fecha de entrevista es obligatoria.') : null,
  };

  return {
    areas,
    duplicateSource,
    errors,
    form,
    isFormValid: !Object.values(errors).some(Boolean),
    isPhoneValid,
    members,
    noOpenPositions,
    puestosForSection,
    restrictToOpen,
    sectionsForArea,
    setForm,
    setTouched,
    touched,
  };
}
