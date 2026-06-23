import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, FileText } from 'lucide-react';
import { Modal } from './Modal';
import type {
  AuthorizedPosition,
  Baja,
  Employee,
  PuestoHabilidades,
} from '@/lib/types';
import { HABILIDADES_PUESTOS } from '@/lib/constants';
import { usePositions } from '@/lib/positions';
import { formatShortDate, localTodayIso, addDaysToIso } from '@/lib/dates';
import { normalizePuesto, normalizeString } from '@/lib/utils';
import './RequisicionSheet.css';

/**
 * Busca la configuración del puesto en la PLANTILLA_AUTORIZADA usando la
 * tripleta (área, sección, puesto) como clave compuesta. La búsqueda
 * normaliza acentos y elimina el sufijo de turno (A/B/C/D) que las bajas
 * traen pegado al puesto (`"OPERADOR DE MÁQUINA D"` → `"OPERADOR DE
 * MÁQUINA"`). Devuelve `undefined` si la baja no corresponde a un puesto
 * autorizado conocido — en cuyo caso la requisición cae a captura manual.
 */
function findPuestoConfig(
  baja: Baja,
  positions: AuthorizedPosition[]
): AuthorizedPosition | undefined {
  const targetArea = normalizeString(baja.area ?? '');
  const targetSeccion = normalizeString(baja.seccion ?? '');
  const targetPuesto = normalizePuesto(baja.puesto ?? '');

  return positions.find(
    (p) =>
      normalizeString(p.area) === targetArea &&
      normalizeString(p.seccion) === targetSeccion &&
      normalizePuesto(p.puesto) === targetPuesto
  );
}

/**
 * Busca las habilidades requeridas del puesto en el catálogo
 * `HABILIDADES_PUESTOS`, usando la misma normalización que el lookup de
 * bono (acentos + sufijo de turno). Si no hay entrada para el puesto,
 * devuelve `undefined` y la requisición deja el bloque en blanco.
 */
function findHabilidades(baja: Baja): PuestoHabilidades | undefined {
  const targetArea = normalizeString(baja.area ?? '');
  const targetSeccion = normalizeString(baja.seccion ?? '');
  const targetPuesto = normalizePuesto(baja.puesto ?? '');

  return HABILIDADES_PUESTOS.find(
    (h) =>
      normalizeString(h.area) === targetArea &&
      normalizeString(h.seccion) === targetSeccion &&
      normalizePuesto(h.puesto) === targetPuesto
  );
}

/** Formateador MXN sin decimales (los montos de bono/sueldo son enteros). */
const MXN_FORMATTER = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

interface RequisicionSheetProps {
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
 * Estrategia de impresión:
 *  - El documento se renderiza dos veces mientras el modal está abierto:
 *    1. Dentro del modal para la vista previa interactiva.
 *    2. Como portal a `document.body` (`#requisicion-print-root`) que en
 *       pantalla está oculto y en `@media print` es el único nodo visible.
 *  - Esto evita las hojas en blanco que provocaba `visibility: hidden`
 *    sobre la cadena de ancestros del modal y elimina el desbordamiento
 *    al sacar el documento de cualquier contenedor con scroll.
 */
export function RequisicionSheet({
  isOpen,
  baja,
  employees,
  codigo,
  onClose,
}: RequisicionSheetProps) {
  // Mientras el modal esté abierto, marcamos `<html>` para que las reglas
  // de print sepan que existe un nodo imprimible montado. Útil para
  // depurar y para reforzar la regla "ocultar todo menos el portal".
  useEffect(() => {
    if (!isOpen) return;
    const root = document.documentElement;
    root.classList.add('is-printing-requisicion');
    return () => {
      root.classList.remove('is-printing-requisicion');
    };
  }, [isOpen]);

  if (!baja) return null;

  // Prioridad: turno guardado en la baja (histórico) o buscar en empleados activos
  const turno =
    baja.turno ??
    employees.find((e) => e.num_empleado === baja.num_empleado)?.turno ??
    null;

  // Fecha de emisión: 1 día después de la fecha de baja
  const issuedDate = addDaysToIso(baja.fecha_baja, 1) ?? localTodayIso();

  function handlePrint() {
    window.print();
  }

  const doc = (
    <RequisicionDoc
      baja={baja}
      turno={turno}
      codigo={codigo}
      issuedDate={issuedDate}
    />
  );

  const footerActions = (
    <button type="button" className="btn-primary" onClick={handlePrint}>
      <Printer size={14} aria-hidden="true" />
      <span className="requisicion-sheet__btn-label">Imprimir</span>
    </button>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        className="requisicion-sheet"
        icon={<FileText size={20} aria-hidden="true" />}
        title="Requisición de Personal"
        subtitle={codigo ?? '—'}
        footerActions={footerActions}
        size="lg"
        fullscreenMobile={true}
      >
        <div className="requisicion-sheet__body">{doc}</div>
      </Modal>

      {isOpen &&
        createPortal(
          <div id="requisicion-print-root" aria-hidden="true">
            {doc}
          </div>,
          document.body
        )}
    </>
  );
}

interface RequisicionDocProps {
  baja: Baja;
  turno: string | null;
  codigo: string | null;
  issuedDate: string;
}

const LEYENDA_RESPONSABILIDAD =
  'Yo acepto que el personal que estoy solicitando es indispensable ocupando el 100% de su rendimiento y no estoy desperdiciando recursos innecesarios. Yo seré responsable por No llegar a los objetivos del puesto que estoy solicitando. Soy Jefe y estoy avalando mi capacidad para detectar las necesidades de cada puesto, así como para incrementar o disminuir la plantilla según las necesidades.';

function RequisicionDoc({
  baja,
  turno,
  codigo,
  issuedDate,
}: RequisicionDocProps) {
  return (
    <div
      className="requisicion-doc"
      role="document"
      aria-label="Formato de requisición de personal"
    >
      {/* ── HOJA 1 — Requisición ─────────────────────────────────────── */}
      <article
        className="requisicion-doc__page requisicion-doc__page--first"
        aria-label="Hoja 1: requisición"
      >
        <DocHeader codigo={codigo} issuedDate={issuedDate} />

        <section
          className="requisicion-doc__section"
          aria-label="Empleado a cubrir"
        >
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
          </div>
        </section>

        <section
          className="requisicion-doc__section"
          aria-label="Datos de la solicitud"
        >
          <h4 className="requisicion-doc__section-title">
            Datos de la solicitud
          </h4>
          <div className="requisicion-doc__grid">
            <Field label="Departamento solicitante" value={baja.area} />
            <Field label="Sección solicitante" value={baja.seccion} />
            <CheckboxField
              label="Tipo de reclutamiento"
              options={['Reclutamiento', 'Desarrollo interno']}
            />
          </div>
        </section>

        <section
          className="requisicion-doc__section"
          aria-label="Conocimientos técnicos requeridos"
        >
          <h4 className="requisicion-doc__section-title">
            Conocimientos técnicos del puesto
          </h4>
          <div className="requisicion-doc__grid">
            <HabilidadesField baja={baja} />
          </div>
        </section>

        <section
          className="requisicion-doc__section requisicion-doc__section--leyenda"
          aria-label="Responsabilidad del jefe"
        >
          <div className="requisicion-doc__leyenda-header">
            <h4 className="requisicion-doc__section-title requisicion-doc__section-title--leyenda">
              Responsabilidad del jefe
            </h4>
            <div className="requisicion-doc__leyenda-fecha">
              <BlankField label="Fecha de recepción" />
            </div>
          </div>
          <p
            className="requisicion-doc__leyenda"
            aria-label="Leyenda de responsabilidad"
          >
            {LEYENDA_RESPONSABILIDAD}
          </p>
        </section>

        <section
          className="requisicion-doc__signatures"
          aria-label="Firmas de autorización"
        >
          <SignatureSlot label="Jefe inmediato" />
          <SignatureSlot label="Reclutador" />
          <SignatureSlot label="Jefe de Recursos Humanos" />
        </section>

        <footer className="requisicion-doc__foot">
          <span>
            Hoja 1 de 2 · Control interno · Código {codigo ?? '—'}
          </span>
        </footer>
      </article>

      {/* ── HOJA 2 — Candidato propuesto ─────────────────────────────── */}
      <article
        className="requisicion-doc__page requisicion-doc__page--second"
        aria-label="Hoja 2: candidato propuesto"
      >
        <DocHeader codigo={codigo} issuedDate={issuedDate} />

        <section
          className="requisicion-doc__section"
          aria-label="Datos del candidato propuesto"
        >
          <h4 className="requisicion-doc__section-title">
            Candidato propuesto
          </h4>
          <div className="requisicion-doc__grid">
            <BlankField label="Nombre completo" span={3} />
            <BlankField label="Núm. empleado asignado" />
            <BlankField label="Edad" />
            <BlankField label="Estado civil" />
            <BlankField label="Escolaridad" />
            <BlankField label="Teléfono" />
            <BlankField label="Correo electrónico" />
            <BlankField label="Fuente de reclutamiento" span={2} />
            <BlankField label="Experiencia previa" span={3} lines={2} />
            <BlankField label="Fecha de entrevista" />
            <BlankField label="Fecha probable de ingreso" />
            <BlankField label="Turno asignado" />
            <BlankField label="Observaciones" span={3} lines={3} />
          </div>
        </section>

        <section
          className="requisicion-doc__section"
          aria-label="Condiciones del puesto"
        >
          <h4 className="requisicion-doc__section-title">
            Condiciones del puesto
          </h4>
          <div className="requisicion-doc__grid">
            <SalarioBonoFields baja={baja} />
          </div>
        </section>

        <section
          className="requisicion-doc__signatures"
          aria-label="Firmas de cierre"
        >
          <SignatureSlot label="Candidato" />
          <SignatureSlot label="Reclutador" />
          <SignatureSlot label="Jefe de Recursos Humanos" />
        </section>

        <footer className="requisicion-doc__foot">
          <span>
            Hoja 2 de 2 · Control interno · Código {codigo ?? '—'}
          </span>
        </footer>
      </article>
    </div>
  );
}

interface DocHeaderProps {
  codigo: string | null;
  issuedDate: string;
  subtitle?: string;
}

function DocHeader({ codigo, issuedDate, subtitle }: DocHeaderProps) {
  return (
    <header className="requisicion-doc__head">
      <div className="requisicion-doc__head-left">
        <span className="requisicion-doc__eyebrow">
          Formato de reclutamiento
          {subtitle ? ` · ${subtitle}` : ''}
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
    <div className="requisicion-doc__field" data-span={span}>
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
      <span className="requisicion-doc__field-blank" aria-hidden="true" />
    </div>
  );
}

function SignatureSlot({ label }: { label: string }) {
  return (
    <div className="requisicion-doc__sig">
      <span className="requisicion-doc__sig-title" aria-hidden="true">FIRMA</span>
      <span className="requisicion-doc__sig-line" aria-hidden="true" />
      <span className="requisicion-doc__sig-label">{label.toUpperCase()}</span>
    </div>
  );
}

/**
 * Renderiza los campos de Sueldo / Bono / Monto del bono.
 * Si la baja corresponde a un puesto con configuración en la PLANTILLA,
 * pre-llena los valores; si no, los deja en blanco para captura manual.
 */
function SalarioBonoFields({ baja }: { baja: Baja }) {
  const { positions } = usePositions();
  const cfg = findPuestoConfig(baja, positions);

  return (
    <>
      {cfg?.sueldo != null ? (
        <Field label="Sueldo propuesto" value={MXN_FORMATTER.format(cfg.sueldo)} />
      ) : (
        <BlankField label="Sueldo propuesto" />
      )}
      {cfg?.bono === true ? (
        <Field label="Bono" value="Sí" />
      ) : cfg?.bono === false ? (
        <Field label="Bono" value="No Aplica" />
      ) : (
        <CheckboxField label="Bono" options={['Sí', 'No']} />
      )}
      {cfg?.bono === true && cfg.bono_monto != null ? (
        <Field
          label="Monto del bono"
          value={MXN_FORMATTER.format(cfg.bono_monto)}
        />
      ) : cfg?.bono === false ? (
        <Field label="Monto del bono" value="No Aplica" />
      ) : (
        <BlankField label="Monto del bono" />
      )}
    </>
  );
}

/**
 * Renderiza el bloque "Conocimientos técnicos del puesto" con campos
 * en grid: Competencias (1 col), Conocimientos Técnicos (2 cols),
 * Escolaridad (1 col), y Experiencia (2 cols, solo si tiene contenido).
 *
 * Si el puesto tiene entrada en `HABILIDADES_PUESTOS`, se muestran los
 * valores correspondientes. Si no, cae a campos en blanco para captura manual.
 */
function HabilidadesField({ baja }: { baja: Baja }) {
  const hab = findHabilidades(baja);

  if (!hab) {
    return (
      <>
        <BlankField label="Competencias" span={1} lines={3} />
        <BlankField label="Conocimientos Técnicos requeridos" span={2} lines={3} />
        <BlankField label="Escolaridad" span={1} lines={1} />
        <BlankField label="Experiencia" span={2} lines={2} />
      </>
    );
  }

  return (
    <>
      {/* Competencias - 1 columna */}
      {hab.competencias ? (
        <div
          className="requisicion-doc__field requisicion-doc__field--habilidades"
          data-span={1}
        >
          <span className="requisicion-doc__field-label">Competencias</span>
          <p className="requisicion-doc__field-value-text">{hab.competencias}</p>
        </div>
      ) : (
        <BlankField label="Competencias" span={1} lines={3} />
      )}

      {/* Conocimientos Técnicos - 2 columnas */}
      {hab.conocimientos_tecnicos ? (
        <div
          className="requisicion-doc__field requisicion-doc__field--habilidades"
          data-span={2}
        >
          <span className="requisicion-doc__field-label">
            Conocimientos Técnicos requeridos
          </span>
          <p className="requisicion-doc__field-value-text">
            {hab.conocimientos_tecnicos}
          </p>
        </div>
      ) : (
        <BlankField label="Conocimientos Técnicos requeridos" span={2} lines={3} />
      )}

      {/* Escolaridad - 1 columna */}
      {hab.escolaridad ? (
        <div
          className="requisicion-doc__field"
          data-span={1}
        >
          <span className="requisicion-doc__field-label">Escolaridad</span>
          <span className="requisicion-doc__field-value">{hab.escolaridad}</span>
        </div>
      ) : (
        <BlankField label="Escolaridad" span={1} lines={1} />
      )}

      {/* Experiencia - 2 columnas (solo se muestra si tiene contenido) */}
      {hab.experiencia && hab.experiencia.trim() !== '' && (
        <div
          className="requisicion-doc__field requisicion-doc__field--habilidades"
          data-span={2}
        >
          <span className="requisicion-doc__field-label">Experiencia</span>
          <p className="requisicion-doc__field-value-text">{hab.experiencia}</p>
        </div>
      )}
    </>
  );
}

interface CheckboxFieldProps {
  label: string;
  options: string[];
  span?: 1 | 2 | 3;
}

function CheckboxField({ label, options, span = 1 }: CheckboxFieldProps) {
  return (
    <div
      className="requisicion-doc__field requisicion-doc__field--checkbox"
      data-span={span}
    >
      <span className="requisicion-doc__field-label">{label}</span>
      <span
        className="requisicion-doc__checkbox-row"
        role="group"
        aria-label={label}
      >
        {options.map((opt) => (
          <span key={opt} className="requisicion-doc__checkbox">
            <span
              className="requisicion-doc__checkbox-box"
              aria-hidden="true"
            />
            <span className="requisicion-doc__checkbox-text">{opt}</span>
          </span>
        ))}
      </span>
    </div>
  );
}
