import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import './FormWizard.css';

export interface FormWizardStep {
  id: string;
  title: string;
  /** `false` bloquea el botón "Siguiente" hasta completar el paso. */
  isValid?: boolean;
  content: React.ReactNode;
}

interface FormWizardProps {
  steps: FormWizardStep[];
  submitLabel: string;
  submittingLabel?: string;
  submitting?: boolean;
  /** Deshabilita el submit final (validación global del formulario). */
  submitDisabled?: boolean;
  onCancel: () => void;
  /** Nota global (e.g. mensaje de error) mostrada bajo el paso activo. */
  notice?: React.ReactNode;
}

/**
 * Wizard de pasos para formularios largos en móvil (mobile-first).
 *
 * El estado de los campos vive en el formulario padre — aquí solo se
 * controla qué paso se muestra, por lo que no se pierde información al
 * navegar entre pasos. El botón final es `type="submit"` para que el
 * `<form>` contenedor maneje el envío como siempre.
 */
export function FormWizard({
  steps,
  submitLabel,
  submittingLabel,
  submitting = false,
  submitDisabled = false,
  onCancel,
  notice,
}: FormWizardProps) {
  const [step, setStep] = useState(0);
  const total = steps.length;
  const current = steps[step];
  const isLast = step === total - 1;

  return (
    <div className="form-wizard" data-testid="form-wizard">
      <div className="form-wizard__progress" data-testid="form-wizard-progress">
        <div className="form-wizard__progress-info">
          <span className="form-wizard__step-count">
            Paso {step + 1} de {total}
          </span>
          <span className="form-wizard__step-title">{current.title}</span>
        </div>
        <div
          className="form-wizard__bar"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={step + 1}
          aria-label={`Paso ${step + 1} de ${total}: ${current.title}`}
        >
          {steps.map((s, i) => (
            <span
              key={s.id}
              className={`form-wizard__seg${
                i <= step ? ' form-wizard__seg--done' : ''
              }`}
            />
          ))}
        </div>
      </div>

      <div key={current.id} className="form-wizard__body" data-testid="form-wizard-body">
        {current.content}
        {notice}
      </div>

      <footer className="form-wizard__footer">
        {step === 0 ? (
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={submitting}
            data-testid="form-wizard-cancel"
          >
            Cancelar
          </button>
        ) : (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={submitting}
            data-testid="form-wizard-back"
          >
            <ChevronLeft size={16} aria-hidden="true" />
            Atrás
          </button>
        )}
        {isLast ? (
          <button
            type="submit"
            className="btn-primary"
            disabled={submitDisabled || submitting}
            data-testid="form-wizard-submit"
          >
            {submitting ? submittingLabel ?? submitLabel : submitLabel}
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary"
            onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
            disabled={current.isValid === false}
            data-testid="form-wizard-next"
          >
            Siguiente
          </button>
        )}
      </footer>
    </div>
  );
}
