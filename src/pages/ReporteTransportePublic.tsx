import { useEffect, useRef, useState } from "react";
import { BadgeCheck, BusFront } from "lucide";
import { useIncidenciasTransporte } from "@/hooks/useIncidenciasTransporte";
import { TransportReportForm } from "@/components/transporte/TransportReportForm";
import { ReportePublicoFooter } from "@/components/transporte/ReportePublicoFooter";
import { MorphingIcon } from "@/components/ui/MorphingIcon";
import { BoneyardSkeleton } from "@/components/ui/BoneyardSkeleton";
import "./ReporteTransportePublic.css";

export function ReporteTransportePublic() {
  const { enviarIncidencia, errorMsg, clearError } = useIncidenciasTransporte();
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState<0 | 1>(0);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const previousSuccessRef = useRef(false);

  useEffect(() => {
    document.title = "Reporte Transporte";
  }, []);

  useEffect(() => {
    const shouldMoveFocus = success || previousSuccessRef.current;
    previousSuccessRef.current = success;
    if (!shouldMoveFocus) return;

    const frame = window.requestAnimationFrame(() => titleRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [success]);

  const handleReset = () => {
    setSuccess(false);
    setCurrentStep(0);
  };

  if (success) {
    return (
      <main className="reporte-publico">
        <section
          className="reporte-publico__container reporte-publico__container--success"
          aria-labelledby="reporte-success-title"
        >
          <div className="reporte-publico__success-icon" aria-hidden="true">
            <MorphingIcon icon={BadgeCheck} size="var(--icon-size-lg)" />
          </div>
          <div className="reporte-publico__success-copy">
            <h1
              id="reporte-success-title"
              ref={titleRef}
              className="reporte-publico__title"
              tabIndex={-1}
            >
              Reporte enviado
            </h1>
            <p className="reporte-publico__subtitle">
              Gracias por tu reporte. Lo revisaremos a la brevedad para mejorar
              el servicio de transporte.
            </p>
          </div>
          <button
            type="button"
            className="btn-primary reporte-publico__success-action"
            onClick={handleReset}
          >
            Enviar otro reporte
          </button>
        </section>
        <ReportePublicoFooter />
      </main>
    );
  }

  return (
    <BoneyardSkeleton
      name="reporte-transporte-page"
      loading={false}
      loadingLabel="Cargando reporte de transporte..."
    >
      <main className="reporte-publico">
        <div className="reporte-publico__container">
          {currentStep === 0 && (
            <>
              <header className="reporte-publico__header">
                <div className="reporte-publico__header-text">
                  <p className="reporte-publico__eyebrow">
                    <MorphingIcon
                      icon={BusFront}
                      size="var(--icon-size-control)"
                    />
                    Transporte de personal
                  </p>
                  <h1
                    id="reporte-title"
                    ref={titleRef}
                    className="reporte-publico__title"
                    tabIndex={-1}
                  >
                    Reporte de transporte
                  </h1>
                  <p
                    className="reporte-publico__subtitle"
                    id="reporte-description"
                  >
                    ¿Tuviste problemas con tu ruta? Cuéntanos.
                  </p>
                </div>
                <img
                  src="/logo-empresa.jpg"
                  alt="ViñoPlastic Querétaro"
                  className="reporte-publico__logo"
                />
              </header>

            </>
          )}

          <TransportReportForm
            onSubmit={enviarIncidencia}
            onSuccess={() => setSuccess(true)}
            onStepChange={setCurrentStep}
            submissionError={errorMsg}
            onClearSubmissionError={clearError}
          />
        </div>
        <ReportePublicoFooter />
      </main>
    </BoneyardSkeleton>
  );
}
