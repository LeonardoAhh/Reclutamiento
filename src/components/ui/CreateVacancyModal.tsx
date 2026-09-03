import { BriefcaseBusiness } from "lucide-react";
import { Modal } from "./Modal";
import { CustomSelect } from "./CustomSelect";

interface CreateVacancyModalProps {
  isOpen: boolean;
  onClose: () => void;
  isCreating: boolean;
  area: string;
  onAreaChange: (value: string) => void;
  areasOptions: string[];
  seccion: string;
  onSeccionChange: (value: string) => void;
  seccionesOptions: string[];
  puesto: string;
  onPuestoChange: (value: string) => void;
  puestosOptions: string[];
  asignadoA: string;
  onAsignadoAChange: (value: string) => void;
  recruitersOptions: { value: string; label: string }[];
  onSubmit: (event: React.FormEvent) => void;
}

export function CreateVacancyModal({
  isOpen,
  onClose,
  isCreating,
  area,
  onAreaChange,
  areasOptions,
  seccion,
  onSeccionChange,
  seccionesOptions,
  puesto,
  onPuestoChange,
  puestosOptions,
  asignadoA,
  onAsignadoAChange,
  recruitersOptions,
  onSubmit,
}: CreateVacancyModalProps) {
  const formId = "create-vacancy-form";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Asignar Vacante"
      icon={<BriefcaseBusiness size="var(--icon-size-md)" aria-hidden="true" />}
      size="sm"
      footerActions={
        <>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={isCreating}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isCreating || !puesto.trim()}
            aria-busy={isCreating}
            form={formId}
          >
            {isCreating ? "Guardando..." : "Crear"}
          </button>
        </>
      }
    >
      <form id={formId} className="modal-body" onSubmit={onSubmit} noValidate>
        <div className="vacante-form-grid">
          <div className="form-group">
            <label htmlFor="vacante-area">Área</label>
            <CustomSelect
              id="vacante-area"
              value={area}
              onChange={onAreaChange}
              options={[
                { value: "", label: "Todas las áreas" },
                ...areasOptions.map((option) => ({
                  value: option,
                  label: option,
                })),
              ]}
            />
          </div>

          <div className="form-group">
            <label htmlFor="vacante-seccion">Sección</label>
            <CustomSelect
              id="vacante-seccion"
              value={seccion}
              onChange={onSeccionChange}
              disabled={seccionesOptions.length === 0}
              options={[
                { value: "", label: "Todas las secciones" },
                ...seccionesOptions.map((option) => ({
                  value: option,
                  label: option,
                })),
              ]}
            />
          </div>

          <div className="form-group">
            <label htmlFor="vacante-puesto">Puesto</label>
            <CustomSelect
              id="vacante-puesto"
              value={puesto}
              onChange={onPuestoChange}
              disabled={puestosOptions.length === 0}
              options={[
                { value: "", label: "Seleccione un puesto" },
                ...puestosOptions.map((option) => ({
                  value: option,
                  label: option,
                })),
              ]}
            />
          </div>

          <div className="form-group">
            <label htmlFor="vacante-asignado">Asignar a</label>
            <CustomSelect
              id="vacante-asignado"
              value={asignadoA}
              onChange={onAsignadoAChange}
              options={recruitersOptions}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
