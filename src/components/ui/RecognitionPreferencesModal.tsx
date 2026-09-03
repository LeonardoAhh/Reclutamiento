import { useEffect, useState } from 'react';
import { Medal } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
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
      fullscreenMobile={false}
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
          Elige cuándo quieres ver tus avances y logros de reclutamiento.
        </p>

        <div className="form-group">
          <label htmlFor="recognition-frequency">Frecuencia</label>
          <select
            id="recognition-frequency"
            value={frequency}
            aria-describedby="recognition-storage-note"
            onChange={(event) => {
              if (isRecognitionFrequency(event.target.value)) handleFrequencyChange(event.target.value);
            }}
          >
            {RECOGNITION_FREQUENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <label className="recognition-preferences-modal__check type-body-sm">
          <input
            type="checkbox"
            checked={dismissedThisMonth}
            onChange={(event) => handleDismissedChange(event.target.checked)}
          />
          <span>No volver a mostrar este mes</span>
        </label>

        {saveError && <p role="alert" className="recognition-preferences-modal__intro type-body-sm">No se pudo guardar. Permite almacenamiento en el navegador e inténtalo otra vez.</p>}
        <p id="recognition-storage-note" className="recognition-preferences-modal__note type-caption-sm">
          Preferencias por usuario en este navegador. La frecuencia se aplica al entrar; no interrumpe tu trabajo con avisos programados.
        </p>
      </div>
    </Modal>
  );
}
