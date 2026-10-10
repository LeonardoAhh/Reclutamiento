import { useEffect, useState } from 'react';
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
import { useLanguage } from '@/contexts/LanguageContext';
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
  const { language } = useLanguage();
  const english = language === 'en';
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
      className="recognition-preferences-modal account-dialog"
      size="xs"
      title={english ? 'Recognition' : 'Reconocimientos'}
      closeLabel={english ? 'Close' : 'Cerrar'}
      footerActions={(
        <button type="button" className="btn-primary" onClick={onClose}>
          {english ? 'Done' : 'Listo'}
        </button>
      )}
    >
      <div className="modal-body recognition-preferences-modal__body">
        <p className="recognition-preferences-modal__intro type-body-md">
          {english ? 'Choose when to show your progress.' : 'Elige cuándo mostrar tu progreso.'}
        </p>

        <div className="form-group">
          <label htmlFor="recognition-frequency">{english ? 'Frequency' : 'Frecuencia'}</label>
          <CustomSelect
            id="recognition-frequency"
            value={frequency}
            options={RECOGNITION_FREQUENCY_OPTIONS.map(({ value, label }) => ({
              value,
              label: english
                ? {
                    session: 'Every session',
                    daily: 'Once a day',
                    weekly: 'Once a week',
                    monthly: 'Once a month',
                    off: 'Off',
                  }[value]
                : label,
            }))}
            showPlaceholderOption={false}
            aria-describedby="recognition-storage-note"
            onChange={(nextFrequency) => {
              if (isRecognitionFrequency(nextFrequency)) handleFrequencyChange(nextFrequency);
            }}
          />
        </div>

        <label className="recognition-preferences-modal__check type-body-md">
          <input
            type="checkbox"
            checked={dismissedThisMonth}
            onChange={(event) => handleDismissedChange(event.target.checked)}
          />
          <span>{english ? 'Hide this month' : 'Ocultar este mes'}</span>
        </label>

        {saveError && <p role="alert" className="recognition-preferences-modal__intro type-body-md">{english ? 'Could not save. Try again.' : 'No se pudo guardar. Intenta de nuevo.'}</p>}
        <p id="recognition-storage-note" className="recognition-preferences-modal__note type-body-md">
          {english ? 'Saved in this browser.' : 'Se guarda en este navegador.'}
        </p>
      </div>
    </Modal>
  );
}
