import type { NuevoReporte } from "@/hooks/useIncidenciasTransporte";
import {
  TRANSPORTE_RUTAS,
  TRANSPORTE_TURNOS,
} from "@/lib/transporte-routes";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { IncidentImageField } from "@/components/transporte/IncidentImageField";
import { IncidentTypeField } from "@/components/transporte/IncidentTypeField";
import {
  sanitizeTransportReportEmployeeNumber,
  TRANSPORT_REPORT_EMPLOYEE_NUMBER_MAX_LENGTH,
} from "@/lib/transport-report-employee-number";
import {
  TRANSPORT_REPORT_COMMENT_MAX_LENGTH,
} from "@/lib/transport-report-comment";

export type ReportFieldErrors = Partial<
  Record<keyof NuevoReporte, string>
>;

export type ReportFieldChange = <K extends keyof NuevoReporte>(
  field: K,
  value: NuevoReporte[K],
) => void;

interface ReportStepProps {
  data: NuevoReporte;
  errors: ReportFieldErrors;
  disabled: boolean;
  onFieldChange: ReportFieldChange;
}

export function TransportTripStep({
  data,
  errors,
  disabled,
  onFieldChange,
}: ReportStepProps) {
  return (
    <div className="reporte-publico__step-fields">
      <div className="form-group">
        <label htmlFor="num_emp" className="reporte-publico__label">
          No. Empleado <span aria-hidden="true">*</span>
        </label>
        <input
          id="num_emp"
          name="numero_empleado"
          type="text"
          inputMode="numeric"
          pattern="[0-9]{1,4}"
          maxLength={TRANSPORT_REPORT_EMPLOYEE_NUMBER_MAX_LENGTH}
          required
          disabled={disabled}
          className="reporte-publico__input"
          placeholder="Lo necesitamos para validar tu reporte."
          value={data.numero_empleado}
          aria-invalid={Boolean(errors.numero_empleado) || undefined}
          aria-describedby={
            errors.numero_empleado ? "num-emp-error" : undefined
          }
          onChange={(event) =>
            onFieldChange(
              "numero_empleado",
              sanitizeTransportReportEmployeeNumber(event.target.value),
            )
          }
        />
        {errors.numero_empleado && (
          <p id="num-emp-error" className="form-error-text">
            {errors.numero_empleado}
          </p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="ruta" className="reporte-publico__label">
          Ruta <span aria-hidden="true">*</span>
        </label>
        <CustomSelect
          id="ruta"
          value={data.ruta}
          disabled={disabled}
          onChange={(value) => onFieldChange("ruta", value)}
          placeholder="Selecciona tu ruta."
          aria-label="Ruta, campo obligatorio"
          aria-describedby={errors.ruta ? "ruta-error" : undefined}
          className={errors.ruta ? "reporte-publico__select--invalid" : ""}
          options={TRANSPORTE_RUTAS.map((route) => ({
            value: route,
            label: route,
          }))}
        />
        {errors.ruta && (
          <p id="ruta-error" className="form-error-text">
            {errors.ruta}
          </p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="turno" className="reporte-publico__label">
          Turno <span aria-hidden="true">*</span>
        </label>
        <CustomSelect
          id="turno"
          value={data.turno}
          disabled={disabled}
          onChange={(value) => onFieldChange("turno", value)}
          placeholder="Selecciona tu turno."
          aria-label="Turno, campo obligatorio"
          aria-describedby={errors.turno ? "turno-error" : undefined}
          className={errors.turno ? "reporte-publico__select--invalid" : ""}
          options={TRANSPORTE_TURNOS.filter((shift) => shift !== "5").map(
            (shift) => ({ value: shift, label: `Turno ${shift}` }),
          )}
        />
        {errors.turno && (
          <p id="turno-error" className="form-error-text">
            {errors.turno}
          </p>
        )}
      </div>
    </div>
  );
}

interface IncidentStepProps extends ReportStepProps {
  imageFile: File | null;
  onImageChange: (file: File | null) => void;
}

export function TransportIncidentStep({
  data,
  errors,
  imageFile,
  disabled,
  onFieldChange,
  onImageChange,
}: IncidentStepProps) {
  return (
    <div className="reporte-publico__step-fields">
      <IncidentTypeField
        value={data.tipo}
        error={errors.tipo}
        disabled={disabled}
        onChange={(value) => onFieldChange("tipo", value)}
      />

      <div className="form-group">
        <label htmlFor="comentarios" className="reporte-publico__label">
          Comentarios adicionales <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="comentarios"
          className="reporte-publico__textarea"
          rows={3}
          maxLength={TRANSPORT_REPORT_COMMENT_MAX_LENGTH}
          required
          disabled={disabled}
          placeholder={
            errors.comentarios || "Detalles sobre lo ocurrido..."
          }
          value={data.comentarios}
          aria-invalid={Boolean(errors.comentarios) || undefined}
          aria-describedby={
            errors.comentarios ? "comentarios-error" : undefined
          }
          onChange={(event) =>
            onFieldChange("comentarios", event.target.value)
          }
        />
        {errors.comentarios && (
          <p id="comentarios-error" className="sr-only">
            {errors.comentarios}
          </p>
        )}
      </div>

      <IncidentImageField
        file={imageFile}
        disabled={disabled}
        onChange={onImageChange}
      />
    </div>
  );
}
