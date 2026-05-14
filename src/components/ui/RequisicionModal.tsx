import { Printer, FileText } from 'lucide-react';
import { Modal } from './Modal';
import type { Baja, Employee } from '@/lib/types';
import { formatShortDate } from '@/lib/dates';
import './RequisicionModal.css';

interface RequisicionModalProps {
  isOpen: boolean;
  baja: Baja | null;
  /** Empleados activos: se busca el turno por `num_empleado`. */
  employees: Employee[];
  /** Código de registro `VAC-NN` precomputado por la página padre. */
  codigo: string | null;
  onClose: () => void;
}

/**
 * Vista imprimible de la Requisición de Personal asociada a una baja.
 *
 * Diseñada para imprimirse en una sola hoja A4 vertical: los datos del
 * empleado saliente se pre-llenan desde la baja; el bloque del candidato
 * propuesto queda con líneas en blanco para que el reclutador lo capture
 * a mano. Al imprimir, el `@media print` oculta el chrome del modal y deja
 * únicamente la hoja blanca.
 */
export function RequisicionModal({
  isOpen,
  baja,
  employees,
  codigo,
  onClose,
}: RequisicionModalProps) {
  if (!baja) return null;

  const turno =
    employees.find((e) => e.num_empleado === baja.num_empleado)?.turno ?? null;

  const issuedDate = new Date().toISOString().slice(0, 10);

  function handlePrint() {
    window.print();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="requisicion-modal"
      labelledById="requisicion-modal-title"
      icon={<FileText size={20} aria-hidden="true" />}
      title="Requisición de Personal"
      subtitle={codigo ?? '—'}
    >
      <div className="modal-body requisicion-modal__body">
        <article
          className="requisicion-doc"
          aria-label="Formato de requisición de personal"
        >
          <header className="requisicion-doc__head">
            <div className="requisicion-doc__head-left">
              <span className="requisicion-doc__eyebrow">
                Formato de reclutamiento
              </span>
              <h3 className="requisicion-doc__title">Requisición de Personal</h3>
            </div>
            <dl className="requisicion-doc__head-meta">
              <div>
                <dt>Código</dt>
                <dd className="requisicion-doc__code">{codigo ?? '—'}</dd>
              </div>
              <div>
                <dt>Fecha emisión</dt>
                <dd>{formatShortDate(issuedDate)}</dd>
              </div>
            </dl>
          </header>

          <section
            className="requisicion-doc__section"
            aria-label="Datos del empleado a reemplazar"
          >
            <h4 className="requisicion-doc__section-title">
              Empleado a reemplazar
            </h4>
            <div className="requisicion-doc__grid">
              <Field label="Nombre" value={baja.nombre} span={2} />
              <Field label="Núm. empleado" value={baja.num_empleado} />
              <Field label="Puesto" value={baja.puesto} />
              <Field label="Departamento (Área)" value={baja.area} />
              <Field label="Sección" value={baja.seccion} />
              <Field label="Turno" value={turno} />
              <Field
                label="Fecha de baja"
                value={baja.fecha_baja ? formatShortDate(baja.fecha_baja) : null}
              />
              <Field label="Tipo de baja" value={baja.tipo_baja || null} />
              <Field
                label="Motivo de baja"
                value={baja.motivo_baja || null}
                span={3}
              />
            </div>
          </section>

          <section
            className="requisicion-doc__section"
            aria-label="Datos del candidato propuesto"
          >
            <h4 className="requisicion-doc__section-title">
              Candidato propuesto
              <span className="requisicion-doc__section-hint">
                (llenar a mano)
              </span>
            </h4>
            <div className="requisicion-doc__grid">
              <BlankField label="Nombre completo" span={3} />
              <BlankField label="Núm. empleado asignado" />
              <BlankField label="Edad" />
              <BlankField label="Escolaridad" />
              <BlankField label="Teléfono" />
              <BlankField label="Fuente de reclutamiento" />
              <BlankField label="Experiencia previa" span={3} />
              <BlankField label="Fecha de entrevista" />
              <BlankField label="Fecha probable de ingreso" />
              <BlankField label="Turno asignado" />
              <BlankField label="Observaciones" span={3} lines={2} />
            </div>
          </section>

          <section
            className="requisicion-doc__signatures"
            aria-label="Firmas de autorización"
          >
            <SignatureSlot label="Reclutador" />
            <SignatureSlot label="Jefe inmediato" />
            <SignatureSlot label="Gerencia de RH" />
          </section>

          <footer className="requisicion-doc__foot">
            <span>
              Documento generado para control interno · Código {codigo ?? '—'}
            </span>
          </footer>
        </article>
      </div>

      <div className="modal-footer requisicion-modal__footer">
        <button type="button" className="btn-secondary" onClick={onClose}>
          Cerrar
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={handlePrint}
        >
          <Printer size={14} aria-hidden="true" />
          <span className="requisicion-modal__btn-label">Imprimir</span>
        </button>
      </div>
    </Modal>
  );
}

interface FieldProps {
  label: string;
  value: string | null | undefined;
  /** Cuántas columnas ocupa el campo dentro del grid (1–3). */
  span?: 1 | 2 | 3;
}

function Field({ label, value, span = 1 }: FieldProps) {
  return (
    <div
      className="requisicion-doc__field"
      data-span={span}
    >
      <span className="requisicion-doc__field-label">{label}</span>
      <span className="requisicion-doc__field-value">
        {value && value.trim() ? value : '—'}
      </span>
    </div>
  );
}

interface BlankFieldProps {
  label: string;
  span?: 1 | 2 | 3;
  /** Cantidad de líneas en blanco. Por defecto 1. */
  lines?: 1 | 2 | 3;
}

function BlankField({ label, span = 1, lines = 1 }: BlankFieldProps) {
  return (
    <div
      className="requisicion-doc__field requisicion-doc__field--blank"
      data-span={span}
      data-lines={lines}
    >
      <span className="requisicion-doc__field-label">{label}</span>
      <span
        className="requisicion-doc__field-blank"
        aria-hidden="true"
      />
    </div>
  );
}

function SignatureSlot({ label }: { label: string }) {
  return (
    <div className="requisicion-doc__sig">
      <span className="requisicion-doc__sig-line" aria-hidden="true" />
      <span className="requisicion-doc__sig-label">{label}</span>
    </div>
  );
}
