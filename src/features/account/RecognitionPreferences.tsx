import { useId, useState } from 'react';
import { Checkbox } from '@/components/ui/Checkbox';
import { CustomSelect } from '@/components/ui/CustomSelect';
import {
  isRecognitionFrequency,
  isRecognitionMonthDismissed,
  readRecognitionPreferences,
  RECOGNITION_FREQUENCY_OPTIONS,
  setRecognitionFrequency,
  setRecognitionMonthDismissed,
  type RecognitionFrequency,
} from '@/lib/recruiterRecognition';
import type { AccountCopy } from '@/pages/account-translations';
import { playSound } from '@/lib/sound';
import { AccountSection } from './AccountSection';

/** Preferencias de reconocimientos del reclutador, editables en línea. */
export function RecognitionPreferences({ copy, profileId }: { copy: AccountCopy; profileId: string }) {
  const id = useId();
  const [frequency, setFrequency] = useState<RecognitionFrequency>(() => readRecognitionPreferences(profileId).frequency);
  const [dismissedThisMonth, setDismissedThisMonth] = useState(() => isRecognitionMonthDismissed(profileId));
  const [saveError, setSaveError] = useState(false);
  const noteId = `${id}-note`;

  function changeFrequency(next: RecognitionFrequency) {
    const saved = setRecognitionFrequency(profileId, next);
    setSaveError(!saved);
    if (saved) {
      setFrequency(next);
      playSound('select');
    } else playSound('error', { emphasis: 'subtle' });
  }

  function changeDismissed(dismissed: boolean) {
    const saved = setRecognitionMonthDismissed(profileId, dismissed);
    setSaveError(!saved);
    if (saved) {
      setDismissedThisMonth(dismissed);
      playSound('toggle');
    } else playSound('error', { emphasis: 'subtle' });
  }

  return (
    <AccountSection id={id} title={copy.recognition} description={copy.recognitionDescription} className="account-recognition">
      <div className="account-preferences">
        <div className="form-group account-preferences__field">
          <label htmlFor={`${id}-frequency`}>{copy.frequency}</label>
          <CustomSelect
            id={`${id}-frequency`}
            value={frequency}
            options={RECOGNITION_FREQUENCY_OPTIONS.map(({ value }) => ({ value, label: copy.frequencies[value] }))}
            showPlaceholderOption={false}
            aria-describedby={noteId}
            onChange={next => {
              if (isRecognitionFrequency(next)) changeFrequency(next);
            }}
          />
        </div>
        <label htmlFor={`${id}-dismissed`} className="account-preferences__check">
          <Checkbox
            id={`${id}-dismissed`}
            checked={dismissedThisMonth}
            aria-describedby={noteId}
            onChange={event => changeDismissed(event.target.checked)}
          />
          <span>{copy.hideThisMonth}</span>
        </label>
      </div>
      {saveError && <p className="form-error-text" role="alert">{copy.preferenceSaveFailed}</p>}
      <p id={noteId} className="account-card__note">{copy.savedInBrowser}</p>
    </AccountSection>
  );
}
