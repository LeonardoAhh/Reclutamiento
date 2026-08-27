import { useEffect, useRef, useState } from "react";
import {
  Bus,
  CircleCheckBig,
  CircleAlert,
} from "lucide-react";
import {
  useIncidenciasTransporte,
  type NuevoReporte,
} from "@/hooks/useIncidenciasTransporte";
import {
  TRANSPORTE_RUTAS,
  TRANSPORTE_TURNOS,
} from "@/lib/transporte-routes";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { AnimatedSubmitButton } from "@/components/ui/AnimatedSubmitButton";
import "./ReporteTransportePublic.css";

const TIPOS_INCIDENCIA = [
  "Retraso de unidad",
  "La unidad no pasó",
  "Exceso de pasajeros",
  "Queja del conductor",
  "Unidad en mal estado",
  "Choque o siniestro",
];

function ReportePublicoFooter() {
  return (
    <footer className="reporte-publico__footer">
      <p>
        &copy; {new Date().getFullYear()} ViñoPlastic Querétaro. Derechos
        Reservados.
      </p>
      <p>
        El mal uso de este portal será sancionado. Tus datos están protegidos.
      </p>
    </footer>
  );
}

export function ReporteTransportePublic() {
  const { enviarIncidencia, errorMsg } = useIncidenciasTransporte();
  const [success, setSuccess] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const previousSuccessRef = useRef(false);

  const [formData, setFormData] = useState<NuevoReporte>({
    numero_empleado: "",
    nombre_empleado: "",
    ruta: "",
    turno: "",
    tipo: "",
    comentarios: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.numero_empleado ||
      !formData.ruta ||
      !formData.turno ||
      !formData.tipo ||
      !formData.comentarios.trim()
    ) {
      return;
    }

    setIsSubmitting(true);
    const ok = await enviarIncidencia(formData);
    setIsSubmitting(false);

    if (ok) {
      setSuccess(true);
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setFormData({
      numero_empleado: "",
      nombre_empleado: "",
      ruta: "",
      turno: "",
      tipo: "",
      comentarios: "",
    });
  };

  if (success) {
    return (
      <main className="reporte-publico">
        <section
          className="reporte-publico__container reporte-publico__container--success"
          aria-labelledby="reporte-success-title"
        >
          <div className="reporte-publico__success-icon" aria-hidden="true">
            <CircleCheckBig size="var(--icon-size-lg)" />
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
    <main className="reporte-publico">
      <div className="reporte-publico__container">
        <header className="reporte-publico__header">
          <div className="reporte-publico__header-text">
            <p className="reporte-publico__eyebrow">
              <Bus size="var(--icon-size-control)" aria-hidden="true" />
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
            <p className="reporte-publico__subtitle" id="reporte-description">
              ¿Tuviste problemas con tu ruta? Cuéntanos.
            </p>
          </div>
          <img
            src="/logo-empresa.jpg"
            alt="ViñoPlastic Querétaro"
            className="reporte-publico__logo"
          />
        </header>

        <p className="reporte-publico__required-note" id="reporte-required-note">
          Todos los campos son obligatorios.
        </p>

        {errorMsg && (
          <div className="reporte-publico__alert" role="alert">
            <CircleAlert size="var(--icon-size-control)" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form
          className="reporte-publico__form"
          onSubmit={handleSubmit}
          aria-describedby="reporte-description reporte-required-note"
          aria-busy={isSubmitting}
        >
          <div className="form-group">
            <label htmlFor="num_emp" className="reporte-publico__label">
              No. Empleado <span aria-hidden="true">*</span>
            </label>
            <input
              id="num_emp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              required
              className="reporte-publico__input"
              placeholder="Lo necesitamos para validar tu reporte."
              value={formData.numero_empleado}
              onChange={(e) =>
                setFormData({ ...formData, numero_empleado: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="ruta" className="reporte-publico__label">
              Ruta <span aria-hidden="true">*</span>
            </label>
            <CustomSelect
              id="ruta"
              value={formData.ruta}
              onChange={(val) => setFormData({ ...formData, ruta: val })}
              placeholder="Selecciona tu ruta."
              aria-label="Ruta, campo obligatorio"
              searchable={true}
              options={TRANSPORTE_RUTAS.map((r) => ({ value: r, label: r }))}
            />
          </div>

          <div className="form-group">
            <label htmlFor="turno" className="reporte-publico__label">
              Turno <span aria-hidden="true">*</span>
            </label>
            <CustomSelect
              id="turno"
              value={formData.turno}
              onChange={(val) => setFormData({ ...formData, turno: val })}
              placeholder="Selecciona tu turno."
              aria-label="Turno, campo obligatorio"
              options={TRANSPORTE_TURNOS.filter((t) => t !== "5").map((t) => ({
                value: t,
                label: `Turno ${t}`,
              }))}
            />
          </div>

          <fieldset className="form-group reporte-publico__incident-fieldset">
            <legend className="reporte-publico__label">
              Tipo de incidencia <span aria-hidden="true">*</span>
            </legend>
            <div className="reporte-publico__radios">
              {TIPOS_INCIDENCIA.map((tipo) => (
                <label
                  key={tipo}
                  className="reporte-publico__radio-label"
                >
                  <input
                    type="radio"
                    name="tipo_incidencia"
                    value={tipo}
                    required
                    checked={formData.tipo === tipo}
                    onChange={(e) =>
                      setFormData({ ...formData, tipo: e.target.value })
                    }
                  />
                  <span>{tipo}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="form-group">
            <label htmlFor="comentarios" className="reporte-publico__label">
              Comentarios adicionales <span aria-hidden="true">*</span>
            </label>
            <textarea
              id="comentarios"
              className="reporte-publico__textarea"
              rows={3}
              required
              placeholder="Detalles sobre lo ocurrido..."
              value={formData.comentarios}
              onChange={(e) =>
                setFormData({ ...formData, comentarios: e.target.value })
              }
            />
          </div>

          <AnimatedSubmitButton
            isSubmitting={isSubmitting}
            isSuccess={success}
            idleText="Enviar reporte"
            loadingText="Enviando..."
            successText="¡Enviado!"
            className="btn-primary reporte-publico__submit"
          />
        </form>
      </div>
      <ReportePublicoFooter />
    </main>
  );
}
