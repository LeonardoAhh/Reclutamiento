import { useState, useEffect } from "react";
import {
  Bus,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  useIncidenciasTransporte,
  type NuevoReporte,
} from "@/hooks/useIncidenciasTransporte";
import {
  TRANSPORTE_RUTAS,
  TRANSPORTE_TURNOS,
  rutaShortCode,
} from "@/lib/transporte-routes";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { AnimatedSubmitButton } from "@/components/ui/AnimatedSubmitButton";
import "./ReporteTransportePublic.css";

const TIPOS_INCIDENCIA = [
  "Retraso de unidad",
  "La unidad no pasó",
  "Sobrecupo (unidad llena)",
  "Problemas con el conductor (manejo imprudente, trato)",
  "Unidad en mal estado mecánico o de limpieza",
  "Accidente / Siniestro",
];

export function ReporteTransportePublic() {
  const { enviarIncidencia, loading, errorMsg } = useIncidenciasTransporte();
  const [success, setSuccess] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.numero_empleado ||
      !formData.ruta ||
      !formData.turno ||
      !formData.tipo
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
        <div className="reporte-publico__container">
          <div className="reporte-publico__success">
            <div className="reporte-publico__success-icon">
              <CheckCircle2 size={32} />
            </div>
            <h1 className="type-heading-md">Reporte Enviado</h1>
            <p className="type-body-md text-muted text-center">
              Gracias por tu reporte. Lo revisaremos a la brevedad para mejorar
              el servicio de transporte.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={handleReset}
              style={{ marginTop: "var(--spacing-md)" }}
            >
              Enviar otro reporte
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="reporte-publico">
      <div className="reporte-publico__container">
        <header className="reporte-publico__header">
          <h1 className="type-heading-1">Reporte</h1>
          <p className="type-body-md text-muted">
            ¿Tuviste problemas con tu ruta? Cuéntanos.
          </p>
        </header>

        {errorMsg && (
          <div className="reporte-publico__alert type-body-sm" role="alert">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form className="reporte-publico__form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="num_emp" className="type-body-sm strong">
              No. Empleado
            </label>
            <input
              id="num_emp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              required
              className="text-input"
              placeholder="Solo lo necesitamos para validar tu reporte."
              value={formData.numero_empleado}
              onChange={(e) =>
                setFormData({ ...formData, numero_empleado: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="ruta" className="type-body-sm strong">
              Ruta
            </label>
            <CustomSelect
              id="ruta"
              value={formData.ruta}
              onChange={(val) => setFormData({ ...formData, ruta: val })}
              placeholder="Selecciona tu ruta..."
              searchable={true}
              options={TRANSPORTE_RUTAS.map((r) => ({ value: r, label: r }))}
            />
          </div>

          <div className="form-group">
            <label htmlFor="turno" className="type-body-sm strong">
              Turno
            </label>
            <CustomSelect
              id="turno"
              value={formData.turno}
              onChange={(val) => setFormData({ ...formData, turno: val })}
              placeholder="Selecciona tu turno..."
              options={TRANSPORTE_TURNOS.filter((t) => t !== "5").map((t) => ({
                value: t,
                label: `Turno ${t}`,
              }))}
            />
          </div>

          <fieldset
            className="form-group"
            style={{ border: "none", padding: 0, margin: 0 }}
          >
            <legend
              className="type-body-sm strong"
              style={{ marginBottom: "var(--spacing-xs)" }}
            >
              Tipo de incidencia
            </legend>
            <div className="reporte-publico__radios" role="radiogroup">
              {TIPOS_INCIDENCIA.map((tipo) => (
                <label
                  key={tipo}
                  className="reporte-publico__radio-label type-body-sm"
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
                  {tipo}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="form-group">
            <label htmlFor="comentarios" className="type-body-sm strong">
              Comentarios adicionales
            </label>
            <textarea
              id="comentarios"
              className="text-input"
              rows={3}
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
            idleText="Enviar Reporte"
            loadingText="Enviando..."
            successText="¡Enviado!"
            className="btn-primary"
            style={{ marginTop: "var(--spacing-sm)" }}
          />
        </form>
      </div>
    </main>
  );
}
