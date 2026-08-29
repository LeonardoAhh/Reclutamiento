import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Send } from "lucide";
import { AnimatedSubmitButton } from "@/components/ui/AnimatedSubmitButton";
import { MorphingIcon } from "@/components/ui/MorphingIcon";
import {
  TransportIncidentStep,
  TransportTripStep,
  type ReportFieldErrors,
} from "@/components/transporte/TransportReportSteps";
import type { NuevoReporte } from "@/hooks/useIncidenciasTransporte";
import "./TransportReportForm.css";

const INITIAL_REPORT: NuevoReporte = {
  numero_empleado: "",
  nombre_empleado: "",
  ruta: "",
  turno: "",
  tipo: "",
  comentarios: "",
};

const STEP_TITLES = ["Datos del viaje", "Detalles de la incidencia"] as const;

const FIELD_IDS: Partial<Record<keyof NuevoReporte, string>> = {
  numero_empleado: "num_emp",
  ruta: "ruta",
  turno: "turno",
  tipo: "tipo-incidencia-0",
  comentarios: "comentarios",
};

interface TransportReportFormProps {
  onSubmit: (report: NuevoReporte, image: File | null) => Promise<boolean>;
  onSuccess: () => void;
  onStepChange: (step: 0 | 1) => void;
}

function validateTripStep(data: NuevoReporte): ReportFieldErrors {
  const errors: ReportFieldErrors = {};
  const employeeNumber = data.numero_empleado.trim();

  if (!employeeNumber) {
    errors.numero_empleado = "Ingresa tu número de empleado.";
  } else if (!/^\d+$/.test(employeeNumber)) {
    errors.numero_empleado = "Usa únicamente números.";
  }
  if (!data.ruta) errors.ruta = "Selecciona tu ruta.";
  if (!data.turno) errors.turno = "Selecciona tu turno.";

  return errors;
}

function validateIncidentStep(data: NuevoReporte): ReportFieldErrors {
  const errors: ReportFieldErrors = {};

  if (!data.tipo) errors.tipo = "Selecciona el tipo de incidencia.";
  if (!data.comentarios.trim()) {
    errors.comentarios = "Describe brevemente lo ocurrido.";
  }

  return errors;
}

function firstErrorField(
  errors: ReportFieldErrors,
  order: Array<keyof NuevoReporte>,
) {
  return order.find((field) => Boolean(errors[field]));
}

export function TransportReportForm({
  onSubmit,
  onSuccess,
  onStepChange,
}: TransportReportFormProps) {
  const [step, setStep] = useState<0 | 1>(0);
  const [formData, setFormData] = useState<NuevoReporte>(INITIAL_REPORT);
  const [errors, setErrors] = useState<ReportFieldErrors>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const stepTitleRef = useRef<HTMLHeadingElement>(null);
  const previousStepRef = useRef(step);
  const fieldFocusFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (previousStepRef.current === step) return;
    previousStepRef.current = step;

    const frame = window.requestAnimationFrame(() =>
      stepTitleRef.current?.focus(),
    );
    return () => window.cancelAnimationFrame(frame);
  }, [step]);

  useEffect(
    () => () => window.cancelAnimationFrame(fieldFocusFrameRef.current ?? 0),
    [],
  );

  const focusField = (field: keyof NuevoReporte | undefined) => {
    if (!field) return;
    const fieldId = FIELD_IDS[field];
    if (!fieldId) return;
    window.cancelAnimationFrame(fieldFocusFrameRef.current ?? 0);
    fieldFocusFrameRef.current = window.requestAnimationFrame(() =>
      document.getElementById(fieldId)?.focus(),
    );
  };

  const handleFieldChange = <K extends keyof NuevoReporte>(
    field: K,
    value: NuevoReporte[K],
  ) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleContinue = () => {
    const nextErrors = validateTripStep(formData);
    setErrors(nextErrors);

    const firstError = firstErrorField(nextErrors, [
      "numero_empleado",
      "ruta",
      "turno",
    ]);
    if (firstError) {
      focusField(firstError);
      return;
    }

    setStep(1);
    onStepChange(1);
  };

  const handleBack = () => {
    setStep(0);
    onStepChange(0);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step === 0) {
      handleContinue();
      return;
    }

    const nextErrors = validateIncidentStep(formData);
    setErrors(nextErrors);

    const firstError = firstErrorField(nextErrors, ["tipo", "comentarios"]);
    if (firstError) {
      focusField(firstError);
      return;
    }

    setIsSubmitting(true);
    let submitted = false;
    try {
      submitted = await onSubmit(formData, imageFile);
    } finally {
      setIsSubmitting(false);
    }

    if (submitted) onSuccess();
  };

  const currentTitle = STEP_TITLES[step];
  const StepTitle = step === 0 ? "h2" : "h1";

  return (
    <form
      className="reporte-publico__form"
      onSubmit={handleSubmit}
      noValidate
      aria-describedby={
        step === 0
          ? "reporte-description reporte-required-note"
          : undefined
      }
      aria-busy={isSubmitting}
    >
      <header className="reporte-publico__step-header">
        <div className="reporte-publico__progress-copy">
          <span>Paso {step + 1} de {STEP_TITLES.length}</span>
        </div>
        <progress
          className="reporte-publico__progress"
          max={STEP_TITLES.length}
          value={step + 1}
          aria-label={`Paso ${step + 1} de ${STEP_TITLES.length}: ${currentTitle}`}
        />
        <StepTitle
          ref={stepTitleRef}
          className="reporte-publico__step-title"
          tabIndex={-1}
        >
          {currentTitle}
        </StepTitle>
      </header>

      {step === 0 ? (
        <TransportTripStep
          data={formData}
          errors={errors}
          disabled={isSubmitting}
          onFieldChange={handleFieldChange}
        />
      ) : (
        <TransportIncidentStep
          data={formData}
          errors={errors}
          imageFile={imageFile}
          disabled={isSubmitting}
          onFieldChange={handleFieldChange}
          onImageChange={setImageFile}
        />
      )}

      <footer
        className={`reporte-publico__actions${
          step === 0 ? " reporte-publico__actions--single" : ""
        }`}
      >
        {step === 0 ? (
          <button
            type="button"
            className="btn-primary"
            onClick={handleContinue}
          >
            Continuar
            <MorphingIcon
              icon={ArrowRight}
              size="var(--icon-size-sm)"
            />
          </button>
        ) : (
          <>
            <button
              type="button"
              className="btn-secondary"
              disabled={isSubmitting}
              onClick={handleBack}
            >
              <MorphingIcon
                icon={ArrowLeft}
                size="var(--icon-size-sm)"
              />
              Atrás
            </button>
            <AnimatedSubmitButton
              isSubmitting={isSubmitting}
              isSuccess={false}
              idleText="Enviar reporte"
              loadingText="Enviando..."
              successText="¡Enviado!"
              idleIcon={Send}
              className="btn-primary"
            />
          </>
        )}
      </footer>
    </form>
  );
}
