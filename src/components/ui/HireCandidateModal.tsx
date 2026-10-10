import { useEffect, useId, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CircleAlert, CircleCheckBig, UserRoundPlus } from 'lucide-react';
import { LoaderCircle, UserRoundPlus as UserPlusIcon } from 'lucide';
import { Modal } from './Modal';
import { MorphingIcon } from './MorphingIcon';
import type { Candidate, Employee } from '@/lib/types';
import { localTodayIso } from '@/lib/dates';
import { CustomSelect } from './CustomSelect';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import './HireCandidateModal.css';

interface HireCandidateModalProps {
  isOpen: boolean;
  candidate: Candidate | null;
  onClose: () => void;
  onConfirm: (input: {
    mode: 'create' | 'associate';
    employee: Employee;
    candidateId: string;
  }) => Promise<{ ok: boolean; message?: string }>;
}

export function HireCandidateModal({
  isOpen,
  candidate,
  onClose,
  onConfirm,
}: HireCandidateModalProps) {
  const { language } = useLanguage();
  const en = language === 'en';
  const formId = useId();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { employees } = useSupabaseData();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setSubmitting(false);
    setSelectedEmployeeId('');
  }, [isOpen, candidate?.id]);

  if (!candidate) return null;

  const alreadyHired = !!candidate.employee_num;
  const footerActions = alreadyHired ? (
    <button type="button" className="btn-secondary" onClick={onClose}>
      {en ? 'Close' : 'Cerrar'}
    </button>
  ) : (
    <>
      <button
        type="button"
        className="btn-secondary"
        onClick={onClose}
        disabled={submitting}
      >
        {en ? 'Cancel' : 'Cancelar'}
      </button>
      <button
        type="submit"
        className="btn-primary"
        disabled={submitting || !selectedEmployeeId}
        aria-busy={submitting}
        form={formId}
      >
        <MorphingIcon
          icon={submitting ? LoaderCircle : UserPlusIcon}
          size="var(--icon-size-sm)"
          aria-hidden="true"
          className={submitting ? 'spin' : undefined}
        />
        {submitting ? (en ? 'Saving…' : 'Guardando…') : (en ? 'Link' : 'Vincular')}
      </button>
    </>
  );

    async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!candidate?.id) {
      setErrorMsg(en ? 'Save the candidate before linking them.' : 'El candidato debe estar guardado antes de vincularlo.');
      return;
    }

    if (!selectedEmployeeId) {
      setErrorMsg(en ? 'Select an existing employee.' : 'Debes seleccionar un empleado existente.');
      return;
    }
    const existing = employees.find((e) => e.num_empleado === selectedEmployeeId);
    if (!existing) {
      setErrorMsg(en ? 'The selected employee was not found.' : 'No se encontró el empleado seleccionado.');
      return;
    }
    const targetEmployee = existing;

    try {
      setSubmitting(true);
      setErrorMsg(null);
      const result = await onConfirm({
        mode: 'associate',
        employee: targetEmployee,
        candidateId: candidate.id,
      });
      if (!result.ok) {
        setErrorMsg(
          result.message ?? (en ? 'Could not link the candidate.' : 'No se pudo asociar al candidato.'),
        );
        return;
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="employee-modal hire-candidate-modal"
      icon={<UserRoundPlus size={20} className="color-primary" aria-hidden="true" />}
      title={`${en ? 'Hire' : 'Contratar a'} ${candidate.nombre}`}
      size="sm"
      footerActions={footerActions}
    >
      {alreadyHired ? (
        <div className="modal-body">
          <div className="delete-warning">
            <div
              className="delete-warning__icon hire-success-icon"
              aria-hidden="true"
            >
              <CircleCheckBig size={32} />
            </div>
            <p className="delete-warning__title">
              {en ? 'Already hired as employee' : 'Ya está contratado como empleado'}{' '}
              <span className="delete-warning__name">#{candidate.employee_num}</span>
            </p>
            <p className="delete-warning__sub">
              {en ? 'To correct employee details, edit them directly in the Dashboard.' : 'Si necesitas corregir los datos del empleado, edítalo directamente en el Dashboard.'}
            </p>
          </div>
        </div>
      ) : (
        <form id={formId} onSubmit={handleSubmit} className="modal-body" noValidate aria-describedby="hire-hint-text">
            <div className="form-group">
              <label htmlFor="hire-associate-select">{en ? 'Select employee' : 'Selecciona el empleado'} *</label>
              <CustomSelect
                id="hire-associate-select"
                value={selectedEmployeeId}
                onChange={setSelectedEmployeeId}
                options={employees.map(e => ({ value: e.num_empleado, label: `${e.nombre} (#${e.num_empleado})` }))}
                placeholder={en ? 'Search' : 'Buscar'}
              />
            </div>

          <p id="hire-hint-text" className="hire-hint">
            {en ? 'The candidate will be linked and marked as' : 'Se enlazará y pasará a estado'} <strong>{en ? 'Hired' : 'Contratado'}</strong>.
          </p>

          {errorMsg && (
            <p className="form-error" role="alert">
              <CircleAlert size={14} aria-hidden="true" /> {errorMsg}
            </p>
          )}

        </form>
      )}
    </Modal>
  );
}
