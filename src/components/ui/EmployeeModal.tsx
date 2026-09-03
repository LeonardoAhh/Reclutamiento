import { useEffect, useId, useMemo, useState } from "react";
import {
  UserRoundPlus,
  Trash2,
  Calendar,
  UserCheck,
  CircleAlert,
  Bus,
} from "lucide-react";
import { Save as SaveIconData, Trash2 as Trash2IconData } from "lucide";
import { AnimatedSubmitButton } from "@/components/ui/AnimatedSubmitButton";
import type { Employee } from "@/lib/types";
import type { AutoVacancy } from "@/lib/autoVacancies";
import { usePositions } from "@/lib/positions";
import { canonicalizeKeyPart, canonicalizePuesto } from "@/lib/utils";
import {
  CATEGORIAS,
  RECLUTADORES_ACTIVOS,
  RECLUTADORES_INFO,
} from "@/lib/constants";
import { localTodayIso } from "@/lib/dates";
import {
  TRANSPORTE_NA,
  TRANSPORTE_PARADAS,
  TRANSPORTE_RUTAS,
} from "@/lib/transporte-routes";
import { Tooltip } from "./Tooltip";
import { supabase } from "@/lib/supabase";
import { Modal } from "./Modal";
import { FormWizard } from "./FormWizard";
import { useIsMobile } from "@/hooks/useIsMobile";
import { CustomSelect } from "./CustomSelect";
import "./EmployeeModal.css";

interface EmployeeModalProps {
  isOpen: boolean;
  mode: "add" | "delete";
  employee?: Employee | null;
  onClose: () => void;
  onSave?: (emp: Employee) => Promise<{ ok: boolean; message?: string }> | void;
  onDelete?: (
    num_empleado: string,
    bajaData?: { fecha_baja: string; tipo_baja: string; motivo_baja: string },
  ) => Promise<{ ok: boolean; message?: string }> | void;
  openVacancies?: AutoVacancy[];
  existingEmployees?: Employee[];
}

type FormState = Pick<
  Employee,
  | "num_empleado"
  | "nombre"
  | "area"
  | "seccion"
  | "puesto"
  | "categoria"
  | "turno"
  | "fecha_ingreso"
> & {
  ruta: string;
  parada: string;
  is_starlite: boolean;
  reclutador: string;
};

function emptyForm(): FormState {
  return {
    num_empleado: "",
    nombre: "",
    area: "",
    seccion: "",
    puesto: "",
    categoria: "N/A",
    turno: "1",
    fecha_ingreso: localTodayIso(),
    ruta: "",
    parada: "",
    is_starlite: false,
    reclutador: "",
  };
}

/** Quita el sufijo de categoría (A/B/C/D) del puesto, preservando el resto. */
function stripCategoria(puesto: string): string {
  return puesto.replace(/\s+[A-D]$/i, "").trim();
}

interface VacancyOption {
  area: string;
  seccion: string;
  puesto: string;
}

export function EmployeeModal({
  isOpen,
  mode,
  employee,
  onClose,
  onSave,
  onDelete,
  openVacancies = [],
  existingEmployees = [],
}: EmployeeModalProps) {
  const formId = useId();
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [bajaForm, setBajaForm] = useState({
    fecha_baja: localTodayIso(),
    tipo_baja: "Renuncia Voluntaria",
    motivo_baja: "",
  });
  const emptyTouchedAdd = {
    num_empleado: false, nombre: false, area: false, seccion: false, puesto: false, fecha_ingreso: false, categoria: false, turno: false, reclutador: false, ruta: false, parada: false
  };
  const emptyTouchedDelete = {
    fecha_baja: false, tipo_baja: false, motivo_baja: false
  };
  const [touchedAdd, setTouchedAdd] = useState(emptyTouchedAdd);
  const [touchedDelete, setTouchedDelete] = useState(emptyTouchedDelete);
  const [selectedVacancyIndex, setSelectedVacancyIndex] = useState(0);
  const isMobile = useIsMobile();

  const { positions } = usePositions();
  const areas = useMemo(
    () => Array.from(new Set(positions.map((p) => p.area))),
    [positions],
  );
  const sectionsForArea = useMemo(
    () =>
      Array.from(
        new Set(
          positions.filter((p) => p.area === form.area).map((p) => p.seccion),
        ),
      ),
    [positions, form.area],
  );
  const puestosForSection = useMemo(
    () =>
      Array.from(
        new Set(
          positions
            .filter((p) => p.area === form.area && p.seccion === form.seccion)
            .map((p) => p.puesto),
        ),
      ),
    [positions, form.area, form.seccion],
  );

  // Vacantes seleccionables: deduplicadas por área+sección+puesto (ignorando la
  // categoría) y con el puesto SIN sufijo de categoría. La categoría la asigna
  // el usuario manualmente más abajo.
  const vacancyOptions = useMemo<VacancyOption[]>(() => {
    const seen = new Set<string>();
    const list: VacancyOption[] = [];
    for (const v of openVacancies) {
      const key = `${canonicalizeKeyPart(v.area)}|${canonicalizeKeyPart(
        v.seccion,
      )}|${canonicalizePuesto(v.puesto)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      list.push({
        area: v.area,
        seccion: v.seccion,
        puesto: stripCategoria(v.puesto),
      });
    }
    return list;
  }, [openVacancies]);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setSubmitting(false);
    setIsSuccess(false);
    setSelectedVacancyIndex(0);
    setTouchedAdd(emptyTouchedAdd);
    setTouchedDelete(emptyTouchedDelete);

    if (mode === "delete" && employee) {
      setForm({
        num_empleado: employee.num_empleado,
        nombre: employee.nombre,
        area: employee.area,
        seccion: employee.seccion,
        puesto: employee.puesto,
        categoria: employee.categoria,
        turno: employee.turno,
        fecha_ingreso: employee.fecha_ingreso,
        ruta: employee.ruta ?? "",
        parada: employee.parada ?? "",
        is_starlite: employee.is_starlite ?? false,
        reclutador: employee.reclutador ?? "",
      });
      setBajaForm({
        fecha_baja: localTodayIso(),
        tipo_baja: "Renuncia Voluntaria",
        motivo_baja: "",
      });
    } else {
      // En modo 'add', pre-llenar con la primera vacante disponible
      if (vacancyOptions.length > 0) {
        const vacancy = vacancyOptions[0];
        setForm({
          num_empleado: "",
          nombre: "",
          area: vacancy.area,
          seccion: vacancy.seccion,
          puesto: vacancy.puesto,
          categoria: "N/A",
          turno: "1",
          fecha_ingreso: localTodayIso(),
          ruta: "",
          parada: "",
          is_starlite: false,
          reclutador: "",
        });
      } else {
        setForm(emptyForm());
      }
    }
  }, [isOpen, mode, employee, vacancyOptions]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  useEffect(() => {
    if (errorMsg) setErrorMsg(null);
  }, [form, bajaForm]);

  const isValidNameStr = (str: string) => str === '' || /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(str);

  const isNumDuplicate = form.num_empleado.trim() !== '' && 
    existingEmployees.some(e => e.num_empleado === form.num_empleado.trim());

  const errorsAdd = {
    num_empleado: !form.num_empleado.trim() ? 'Obligatorio.' : !/^\d+$/.test(form.num_empleado.trim()) ? 'Solo números.' : form.num_empleado.trim().length > 4 ? 'Máximo 4 dígitos.' : isNumDuplicate ? 'Este número ya existe.' : null,
    nombre: !form.nombre.trim() ? 'Obligatorio.' : form.nombre.trim().length < 2 ? 'Mín. 2 letras.' : !isValidNameStr(form.nombre) ? 'Solo letras.' : null,
    area: !form.area ? 'Obligatorio.' : null,
    seccion: !form.seccion ? 'Obligatorio.' : null,
    puesto: !form.puesto ? 'Obligatorio.' : null,
    fecha_ingreso: !form.fecha_ingreso ? 'Obligatorio.' : null,
    categoria: !form.categoria || form.categoria === 'N/A' ? 'Selecciona categoría.' : null,
    turno: !form.turno ? 'Selecciona turno.' : null,
    reclutador: !form.reclutador ? 'Debes asignar un reclutador.' : null,
    ruta: !form.ruta ? 'Selecciona ruta.' : null,
    parada: !form.parada ? 'Selecciona parada.' : null,
  };

  const isNameDuplicate = form.nombre.trim() !== '' && 
    existingEmployees.some(e => e.nombre.trim().toLowerCase() === form.nombre.trim().toLowerCase());

  const errorsDelete = {
    fecha_baja: !bajaForm.fecha_baja ? 'Obligatorio.' : null,
    tipo_baja: !bajaForm.tipo_baja ? 'Obligatorio.' : null,
    motivo_baja: !bajaForm.motivo_baja.trim() ? 'Obligatorio.' : null,
  };

  const isAddValid = !Object.values(errorsAdd).some(Boolean);
  const isDeleteValid = !Object.values(errorsDelete).some(Boolean);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg(null);

    if (mode === "add" && !isAddValid) {
      setTouchedAdd(Object.keys(emptyTouchedAdd).reduce((acc, k) => ({ ...acc, [k]: true }), {} as typeof touchedAdd));
      setTimeout(() => {
        const firstInvalid = document.querySelector('.input-error');
        if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }
    
    if (mode === "delete" && !isDeleteValid) {
      setTouchedDelete(Object.keys(emptyTouchedDelete).reduce((acc, k) => ({ ...acc, [k]: true }), {} as typeof touchedDelete));
      setTimeout(() => {
        const firstInvalid = document.querySelector('.input-error');
        if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }

    try {
      setSubmitting(true);
      if (mode === "add" && onSave) {
        const payload: Employee = {
          ...form,
          ruta: form.ruta ? form.ruta : null,
          parada: form.parada ? form.parada : null,
          reclutador: form.reclutador ? form.reclutador : null,
        };

        // Retraso artificial para que se note la animación
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const result = await onSave(payload);
        if (result && result.ok === false) {
          setErrorMsg(result.message ?? "No se pudo guardar.");
          setSubmitting(false);
          return;
        }
        setIsSuccess(true);
        setTimeout(() => onClose(), 1500);
      } else if (mode === "delete" && onDelete && form.num_empleado) {
        // Retraso artificial para que se note la animación
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const result = await onDelete(form.num_empleado, bajaForm);
        if (result && result.ok === false) {
          setErrorMsg(result.message ?? "No se pudo eliminar.");
          setSubmitting(false);
          return;
        }
        setIsSuccess(true);
        setTimeout(() => onClose(), 1500);
      }
    } catch (err) {
      setErrorMsg("Error inesperado.");
      setSubmitting(false);
    }
  }

  const isAdd = mode === "add";

  const fieldsIdentidad = (
    <>
      <div className="form-group">
        <label htmlFor="emp-num">Número de Empleado <span className="text-error">*</span></label>
        <input
          id="emp-num"
          type="text"
          inputMode="numeric"
          maxLength={4}
          value={form.num_empleado}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 4);
            setForm({ ...form, num_empleado: val });
            if (!touchedAdd.num_empleado) setTouchedAdd(t => ({ ...t, num_empleado: true }));
          }}
          placeholder="Ej. 1234"
          autoComplete="off"
          className={touchedAdd.num_empleado && errorsAdd.num_empleado ? 'input-error' : ''}
        />
        {touchedAdd.num_empleado && errorsAdd.num_empleado && <span className="form-error-text">{errorsAdd.num_empleado}</span>}
      </div>
      <div className="form-group">
        <label htmlFor="emp-name">Nombre Completo <span className="text-error">*</span></label>
        <input
          id="emp-name"
          type="text"
          value={form.nombre}
          onChange={(e) => {
            setForm({ ...form, nombre: e.target.value.toUpperCase() });
            if (!touchedAdd.nombre) setTouchedAdd(t => ({ ...t, nombre: true }));
          }}
          onBlur={() => {
            setForm(prev => ({ ...prev, nombre: prev.nombre.trim().replace(/\s+/g, ' ') }));
            if (!touchedAdd.nombre) setTouchedAdd(t => ({ ...t, nombre: true }));
          }}
          placeholder="APELLIDOS NOMBRE"
          autoComplete="off"
          className={touchedAdd.nombre && errorsAdd.nombre ? 'input-error' : ''}
        />
        {touchedAdd.nombre && errorsAdd.nombre && <span className="form-error-text">{errorsAdd.nombre}</span>}
        {!errorsAdd.nombre && isNameDuplicate && mode === 'add' && (
          <span className="form-warning-text">
            <CircleAlert size={12} /> Ya existe alguien con este nombre. Verifica que sea un homónimo.
          </span>
        )}
      </div>
    </>
  );

  const starliteField = (
    <div className="form-group employee-modal__starlite-toggle">
      <label htmlFor="emp-starlite" className="starlite-label">
        Etiqueta Starlite
      </label>
      <CustomSelect
        id="emp-starlite"
        value={form.is_starlite ? "true" : "false"}
        onChange={(val) => setForm({ ...form, is_starlite: val === "true" })}
        options={[
          { value: "false", label: "No" },
          { value: "true", label: "Sí" },
        ]}
      />
    </div>
  );

  const fieldsPosicion =
    // Si hay vacantes disponibles y estamos en modo 'add', no mostrar selectores
    // porque se pre-llenan del selector de vacante
    vacancyOptions.length > 0 && mode === "add" ? null : (
      <>
        <div className="form-group">
          <label htmlFor="emp-area">Área <span className="text-error">*</span></label>
          <CustomSelect
            id="emp-area"
            value={form.area}
            onChange={(val) => {
              setForm({ ...form, area: val, seccion: "", puesto: "" });
              setTouchedAdd(t => ({ ...t, area: true, seccion: false, puesto: false }));
            }}
            options={areas.map((a) => ({ value: a, label: a }))}
            placeholder="Seleccione área…"
          />
          {touchedAdd.area && errorsAdd.area && <span className="form-error-text">{errorsAdd.area}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="emp-seccion">Sección <span className="text-error">*</span></label>
          <CustomSelect
            id="emp-seccion"
            value={form.seccion}
            onChange={(val) => {
              setForm({ ...form, seccion: val, puesto: "" });
              setTouchedAdd(t => ({ ...t, seccion: true, puesto: false }));
            }}
            options={sectionsForArea.map((s) => ({ value: s, label: s }))}
            placeholder="Seleccione sección…"
            disabled={!form.area}
          />
          {touchedAdd.seccion && errorsAdd.seccion && <span className="form-error-text">{errorsAdd.seccion}</span>}
        </div>
        <div className="form-group--span-2 form-grid form-grid--3-cols">
          <div className="form-group">
            <label htmlFor="emp-puesto">Puesto <span className="text-error">*</span></label>
            <CustomSelect
              id="emp-puesto"
              value={form.puesto}
              onChange={(val) => {
                setForm({ ...form, puesto: val });
                setTouchedAdd(t => ({ ...t, puesto: true }));
              }}
              options={puestosForSection.map((p) => ({ value: p, label: p }))}
              placeholder="Seleccione puesto…"
              disabled={!form.seccion}
            />
            {touchedAdd.puesto && errorsAdd.puesto && <span className="form-error-text">{errorsAdd.puesto}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="emp-turno">Turno <span className="text-error">*</span></label>
            <CustomSelect
              id="emp-turno"
              value={form.turno}
              onChange={(val) => {
                setForm({ ...form, turno: val });
                setTouchedAdd(t => ({ ...t, turno: true }));
              }}
              options={[
                { value: "1", label: "1" },
                { value: "2", label: "2" },
                { value: "3", label: "3" },
                { value: "4", label: "4" },
                { value: "Mixto", label: "Mixto" },
              ]}
              placeholder="Turno..."
              aria-invalid={touchedAdd.turno && !!errorsAdd.turno}
            />
            {touchedAdd.turno && errorsAdd.turno && <span className="form-error-text">{errorsAdd.turno}</span>}
          </div>
          {starliteField}
        </div>
        <div className="form-group">
          <label htmlFor="emp-fecha">Fecha de Ingreso <span className="text-error">*</span></label>
          <input
            id="emp-fecha"
            type="date"
            value={form.fecha_ingreso}
            onChange={(e) => {
              setForm({ ...form, fecha_ingreso: e.target.value });
              if (!touchedAdd.fecha_ingreso) setTouchedAdd(t => ({ ...t, fecha_ingreso: true }));
            }}
            className={touchedAdd.fecha_ingreso && errorsAdd.fecha_ingreso ? 'input-error' : ''}
          />
          {touchedAdd.fecha_ingreso && errorsAdd.fecha_ingreso && <span className="form-error-text">{errorsAdd.fecha_ingreso}</span>}
        </div>
      </>
    );

  const showVacancySelector = vacancyOptions.length > 0 && mode === "add";

  const fieldsVacancySelector = showVacancySelector ? (
    <div className="form-group form-group--span-2">
      <label htmlFor="emp-vacancy">Vacante Disponible <span className="text-error">*</span></label>
      <CustomSelect
        id="emp-vacancy"
        value={selectedVacancyIndex.toString()}
        onChange={(val) => {
          const idx = parseInt(val);
          setSelectedVacancyIndex(idx);
          const vacancy = vacancyOptions[idx];
          setForm({
            ...form,
            area: vacancy.area,
            seccion: vacancy.seccion,
            puesto: vacancy.puesto,
          });
          setTouchedAdd(t => ({ ...t, area: true, seccion: true, puesto: true }));
        }}
        options={vacancyOptions.map((v, i) => ({
          value: i.toString(),
          label: `${v.area} - ${v.seccion} - ${v.puesto}`,
        }))}
      />
    </div>
  ) : null;

  // Cuando se usa el selector de vacante, `fieldsPosicion` se oculta y con él
  // su campo de Fecha de Ingreso. Lo reponemos aquí para no perderlo. Si NO hay
  // selector de vacante, `fieldsPosicion` ya incluye su propia Fecha de Ingreso.
  const fieldsFecha = showVacancySelector ? (
    <>
      <div className="form-group--span-2 form-grid form-grid--3-cols">
        <div className="form-group">
          <label htmlFor="emp-vac-categoria">Categoría <span className="text-error">*</span></label>
          <CustomSelect
            id="emp-vac-categoria"
            value={form.categoria}
            onChange={(val) => {
              setForm({ ...form, categoria: val });
              setTouchedAdd(t => ({ ...t, categoria: true }));
            }}
            options={CATEGORIAS.map((c) => ({ value: c, label: c }))}
            placeholder="Categoría..."
            aria-invalid={touchedAdd.categoria && !!errorsAdd.categoria}
          />
          {touchedAdd.categoria && errorsAdd.categoria && <span className="form-error-text">{errorsAdd.categoria}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="emp-vac-turno">Turno <span className="text-error">*</span></label>
          <CustomSelect
            id="emp-vac-turno"
            value={form.turno}
            onChange={(val) => {
              setForm({ ...form, turno: val });
              setTouchedAdd(t => ({ ...t, turno: true }));
            }}
            options={[
              { value: "1", label: "1" },
              { value: "2", label: "2" },
              { value: "3", label: "3" },
              { value: "4", label: "4" },
              { value: "Mixto", label: "Mixto" },
            ]}
            placeholder="Turno..."
            aria-invalid={touchedAdd.turno && !!errorsAdd.turno}
          />
          {touchedAdd.turno && errorsAdd.turno && <span className="form-error-text">{errorsAdd.turno}</span>}
        </div>
        {starliteField}
      </div>
      <div className="form-group">
        <label htmlFor="emp-vac-fecha">Fecha de Ingreso <span className="text-error">*</span></label>
        <input
          id="emp-vac-fecha"
          type="date"
          value={form.fecha_ingreso}
          onChange={(e) => {
            setForm({ ...form, fecha_ingreso: e.target.value });
            if (!touchedAdd.fecha_ingreso) setTouchedAdd(t => ({ ...t, fecha_ingreso: true }));
          }}
          className={touchedAdd.fecha_ingreso && errorsAdd.fecha_ingreso ? 'input-error' : ''}
        />
        {touchedAdd.fecha_ingreso && errorsAdd.fecha_ingreso && <span className="form-error-text">{errorsAdd.fecha_ingreso}</span>}
      </div>
    </>
  ) : null;

  const fieldsTransporte = (
    <>
      <div className="form-group">
        <label htmlFor="emp-ruta">Ruta de Transporte <span className="text-error">*</span></label>
        <CustomSelect
          id="emp-ruta"
          value={form.ruta}
          onChange={(val) => {
            setForm({ ...form, ruta: val });
            setTouchedAdd(t => ({ ...t, ruta: true }));
          }}
          options={[
            { value: TRANSPORTE_NA, label: "N/A (No utiliza transporte)" },
            ...TRANSPORTE_RUTAS.map((r) => ({ value: r, label: r })),
          ]}
          placeholder="Seleccione ruta..."
          aria-invalid={touchedAdd.ruta && !!errorsAdd.ruta}
        />
        {touchedAdd.ruta && errorsAdd.ruta && <span className="form-error-text">{errorsAdd.ruta}</span>}
      </div>
      <div className="form-group">
        <label htmlFor="emp-parada">Parada de Transporte <span className="text-error">*</span></label>
        <CustomSelect
          id="emp-parada"
          value={form.parada}
          onChange={(val) => {
            setForm({ ...form, parada: val });
            setTouchedAdd(t => ({ ...t, parada: true }));
          }}
          options={TRANSPORTE_PARADAS.map((p) => ({
            value: p,
            label: p === TRANSPORTE_NA ? "N/A (No utiliza transporte)" : p
          }))}
          placeholder="Seleccione parada..."
          aria-invalid={touchedAdd.parada && !!errorsAdd.parada}
        />
        {touchedAdd.parada && errorsAdd.parada && <span className="form-error-text">{errorsAdd.parada}</span>}
      </div>
    </>
  );

  const fieldsExtra = (
    <>
      <div className="form-group">
        <label htmlFor="emp-reclutador">Reclutador <span className="text-error">*</span></label>
        <CustomSelect
          id="emp-reclutador"
          value={form.reclutador}
          onChange={(val) => {
            setForm({ ...form, reclutador: val });
            setTouchedAdd(t => ({ ...t, reclutador: true }));
          }}
          placeholder="Sin asignar"
          options={RECLUTADORES_ACTIVOS.map((r) => ({
            value: r.toUpperCase(),
            label: RECLUTADORES_INFO[r].nombre_completo,
          }))}
          aria-invalid={touchedAdd.reclutador && !!errorsAdd.reclutador}
        />
        {touchedAdd.reclutador && errorsAdd.reclutador && <span className="form-error-text">{errorsAdd.reclutador}</span>}
      </div>
    </>
  );

  const errorNotice = null;

  const icon = isAdd ? (
    <UserRoundPlus size={20} className="color-primary" aria-hidden="true" />
  ) : (
    <Trash2 size={20} className="color-error" aria-hidden="true" />
  );
  const title = isAdd ? "Nuevo Empleado" : "Eliminar";
  const deleteContent = (
    <div className="employee-modal__delete">
      <div className="delete-warning">
        <p className="delete-warning__title">
          Esta acción no se puede deshacer.
        </p>
      </div>

      <div className="form-grid employee-modal__baja-grid">
        <div className="form-group">
          <label htmlFor="baja-fecha">Fecha de Baja <span className="text-error">*</span></label>
          <input
            id="baja-fecha"
            type="date"
            value={bajaForm.fecha_baja}
            onChange={(e) => {
              setBajaForm({ ...bajaForm, fecha_baja: e.target.value });
              if (!touchedDelete.fecha_baja) setTouchedDelete(t => ({ ...t, fecha_baja: true }));
            }}
            className={touchedDelete.fecha_baja && errorsDelete.fecha_baja ? 'input-error' : ''}
          />
          {touchedDelete.fecha_baja && errorsDelete.fecha_baja && <span className="form-error-text">{errorsDelete.fecha_baja}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="baja-tipo">Tipo de Baja <span className="text-error">*</span></label>
          <CustomSelect
            id="baja-tipo"
            value={bajaForm.tipo_baja}
            onChange={(val) => {
              setBajaForm({ ...bajaForm, tipo_baja: val });
              setTouchedDelete(t => ({ ...t, tipo_baja: true }));
            }}
            options={[
              { value: "Renuncia", label: "Renuncia" },
              { value: "Ausentismo", label: "Ausentismo" },
              {
                value: "Rescisión de Contrato",
                label: "Rescisión de Contrato",
              },
              { value: "Termino de Contrato", label: "Termino de Contrato" },
              { value: "Solo Inducción", label: "Solo Inducción" },
            ]}
          />
          {touchedDelete.tipo_baja && errorsDelete.tipo_baja && <span className="form-error-text">{errorsDelete.tipo_baja}</span>}
        </div>
        <div className="form-group form-group--span-2">
          <label htmlFor="baja-motivo">Descripción <span className="text-error">*</span></label>
          <input
            id="baja-motivo"
            type="text"
            placeholder="Especifica el motivo..."
            value={bajaForm.motivo_baja}
            onChange={(e) => {
              setBajaForm({ ...bajaForm, motivo_baja: e.target.value });
              if (!touchedDelete.motivo_baja) setTouchedDelete(t => ({ ...t, motivo_baja: true }));
            }}
            autoComplete="off"
            className={touchedDelete.motivo_baja && errorsDelete.motivo_baja ? 'input-error' : ''}
          />
          {touchedDelete.motivo_baja && errorsDelete.motivo_baja && <span className="form-error-text">{errorsDelete.motivo_baja}</span>}
        </div>
      </div>
    </div>
  );

  const actionButtons = (
    <>
      <button
        type="button"
        className="btn-secondary"
        onClick={onClose}
        disabled={submitting || isSuccess}
      >
        Cancelar
      </button>
      {isAdd ? (
        String(form.fecha_ingreso).localeCompare(localTodayIso()) > 0 ? (
          <Tooltip
            side="top"
            content={
              <span
                style={{
                  display: "flex",
                  gap: "var(--spacing-xs)",
                  alignItems: "flex-start",
                  textAlign: "left",
                }}
              >
                <CircleAlert
                  size={14}
                  className="color-warning"
                  style={{ flexShrink: 0, marginTop: "2px" }}
                />
                <span>No contará en KPIs ni Dashboard.</span>
              </span>
            }
          >
            <span style={{ display: "inline-block" }}>
              <AnimatedSubmitButton
                isSubmitting={submitting}
                isSuccess={isSuccess}
                isError={!!errorMsg}
                errorText={errorMsg || undefined}
                idleText="Guardar"
                loadingText="Guardando..."
                successText="¡Guardado!"
                idleIcon={SaveIconData}
                className="btn-primary"
                disabled={!isAddValid}
                form={formId}
              />
            </span>
          </Tooltip>
        ) : (
          <AnimatedSubmitButton
            isSubmitting={submitting}
            isSuccess={isSuccess}
            isError={!!errorMsg}
            errorText={errorMsg || undefined}
            idleText="Guardar"
            loadingText="Guardando..."
            successText="¡Guardado!"
            idleIcon={SaveIconData}
            className="btn-primary"
            disabled={!isAddValid}
            form={formId}
          />
        )
      ) : (
        <AnimatedSubmitButton
          isSubmitting={submitting}
          isSuccess={isSuccess}
          isError={!!errorMsg}
          errorText={errorMsg || undefined}
          idleText="Eliminar"
          loadingText="Registrando baja..."
          successText="¡Baja registrada!"
          idleIcon={Trash2IconData}
          className="btn-danger"
          disabled={!isDeleteValid}
          form={formId}
        />
      )}
    </>
  );

  if (isMobile && isAdd) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        className="employee-modal modal-wizard-mobile"
        icon={icon}
        title={title}
      >
        <form onSubmit={handleSubmit} className="modal-wizard-form" noValidate>
          <FormWizard
            onCancel={onClose}
            submitting={submitting}
            submitDisabled={!isAddValid}
            submitLabel="Guardar"
            submittingLabel="Guardando…"
            notice={errorNotice}
            steps={[
              {
                id: "identidad",
                title: "Identidad",
                isValid:
                  form.num_empleado.trim().length > 0 &&
                  form.nombre.trim().length > 0,
                content: <div className="form-grid">{fieldsIdentidad}</div>,
              },
              {
                id: "posicion",
                title: "Posición",
                isValid:
                  form.area.length > 0 &&
                  form.seccion.length > 0 &&
                  form.puesto.length > 0 &&
                  form.reclutador.length > 0,
                content: (
                  <div className="form-grid">
                    {fieldsVacancySelector}
                    {fieldsFecha}
                    {fieldsPosicion}
                    {fieldsExtra}
                  </div>
                ),
              },
              {
                id: "transporte",
                title: "Transporte",
                isValid: form.ruta.length > 0 && form.parada.length > 0,
                content: (
                  <div className="form-grid">
                    {fieldsTransporte}
                  </div>
                ),
              },
            ]}
          />
        </form>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="employee-modal"
      icon={icon}
      title={title}
      size={isAdd ? "lg" : "sm"}
      footerActions={actionButtons}
    >
      <form id={formId} onSubmit={handleSubmit} className="modal-body" noValidate>
        {isAdd ? (
          <div className="form-grid">
            {fieldsIdentidad}
            {fieldsVacancySelector}
            {fieldsFecha}
            {fieldsPosicion}
            {fieldsExtra}
            {fieldsTransporte}
          </div>
        ) : (
          deleteContent
        )}

        {errorNotice}
      </form>
    </Modal>
  );
}
