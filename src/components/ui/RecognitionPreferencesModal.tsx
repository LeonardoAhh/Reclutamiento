import { useEffect, useState } from 'react';
import { Medal } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { CustomSelect } from '@/components/ui/CustomSelect';
import {
  isRecognitionMonthDismissed,
  isRecognitionFrequency,
  readRecognitionPreferences,
  RECOGNITION_FREQUENCY_OPTIONS,
  setRecognitionFrequency,
  setRecognitionMonthDismissed,
  type RecognitionFrequency,
} from '@/lib/recruiterRecognition';
import { Modal } from './Modal';
import './RecognitionPreferencesModal.css';

interface RecognitionPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RecognitionPreferencesModal({
  isOpen,
  onClose,
}: RecognitionPreferencesModalProps) {
  const { profile } = useAuth();
  const [frequency, setFrequency] = useState<RecognitionFrequency>('session');
  const [dismissedThisMonth, setDismissedThisMonth] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    if (!isOpen || !profile) return;
    setFrequency(readRecognitionPreferences(profile.id).frequency);
    setDismissedThisMonth(isRecognitionMonthDismissed(profile.id));
  }, [isOpen, profile]);

  if (!profile || profile.role !== 'reclutador') return null;

  const handleFrequencyChange = (nextFrequency: RecognitionFrequency) => {
    const saved = setRecognitionFrequency(profile.id, nextFrequency);
    setSaveError(!saved);
    if (saved) setFrequency(nextFrequency);
  };

  const handleDismissedChange = (dismissed: boolean) => {
    const saved = setRecognitionMonthDismissed(profile.id, dismissed);
    setSaveError(!saved);
    if (saved) setDismissedThisMonth(dismissed);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="recognition-preferences-modal"
      size="xs"
      icon={<Medal aria-hidden="true" />}
      title="Reconocimientos"
      footerActions={(
        <button type="button" className="btn-primary" onClick={onClose}>
          Listo
        </button>
      )}
    >
      <div className="modal-body recognition-preferences-modal__body">
        <p className="recognition-preferences-modal__intro type-body-md">
          Elige cuándo mostrar tu progreso.
        </p>

        <div className="form-group">
          <label htmlFor="recognition-frequency">Frecuencia</label>
          <CustomSelect
            id="recognition-frequency"
            value={frequency}
            options={RECOGNITION_FREQUENCY_OPTIONS}
            showPlaceholderOption={false}
            aria-describedby="recognition-storage-note"
            onChange={(nextFrequency) => {
              if (isRecognitionFrequency(nextFrequency)) handleFrequencyChange(nextFrequency);
            }}
          />
        </div>

        <label className="recognition-preferences-modal__check type-body-sm">
          <input
            type="checkbox"
            checked={dismissedThisMonth}
            onChange={(event) => handleDismissedChange(event.target.checked)}
          />
          <span>Ocultar este mes</span>
        </label>

        {saveError && <p role="alert" className="recognition-preferences-modal__intro type-body-sm">No se pudo guardar. Intenta de nuevo.</p>}
        <p id="recognition-storage-note" className="recognition-preferences-modal__note type-caption-sm">
          Se guarda en este navegador.
        </p>
      </div>
    </Modal>
  );
}
