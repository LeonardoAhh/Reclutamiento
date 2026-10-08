import { useEffect, useId, useMemo, useState } from "react";
import {
  UserRoundPlus,
  Trash2,
  Calendar,
  UserCheck,
  CircleAlert,
} from "lucide-react";
import { Save } from "lucide-react";
import { toast } from "@/lib/notify";
import type { Employee } from "@/lib/types";
import type { AutoVacancy } from "@/lib/autoVacancies";
import { usePositions } from "@/lib/positions";
import {
  canonicalizeKeyPart,
  canonicalizePuesto,
  toNaturalCase,
} from "@/lib/utils";
import { CATEGORIAS } from "@/lib/constants";
import { useTeamDirectory } from '@/features/team/TeamProvider';
import { recruiterOptions } from '@/features/team/types';
import { localTodayIso } from "@/lib/dates";
import { Tooltip } from "./Tooltip";
import { supabase } from "@/lib/supabase";
import { Modal } from "./Modal";
import { FormSheet } from "./FormSheet";
import { FormWizard } from "./FormWizard";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useLanguage } from "@/contexts/LanguageContext";
import { workforceText } from "@/pages/workforce-translations";
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
    turno: "",
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
  const { language } = useLanguage();
  const t = (text: string) => workforceText(language, text);
  const { members } = useTeamDirectory();
  const formId = useId();
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [bajaForm, setBajaForm] = useState({
    fecha_baja: localTodayIso(),
    tipo_baja: "Renuncia Voluntaria",
    motivo_baja: "",
  });
  const emptyTouchedAdd = {
    num_empleado: false, nombre: false, area: false, seccion: false, puesto: false, fecha_ingreso: false, turno: false, reclutador: false
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

  const vacancySelectOptions = useMemo(() => {
    return vacancyOptions.map((vacancy, index) => ({
      value: index.toString(),
      label: [toNaturalCase(vacancy.puesto), toNaturalCase(vacancy.seccion)]
        .filter(Boolean)
        .join(' · '),
    }));
  }, [vacancyOptions]);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setSubmitting(false);
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
    if (errorMsg) setErrorMsg(null);
  }, [form, bajaForm]);

  const isValidNameStr = (str: string) => str === '' || /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(str);

  const isNumDuplicate = form.num_empleado.trim() !== '' &&
    existingEmployees.some(e => e.num_empleado === form.num_empleado.trim());

  const errorsAdd = {
    num_empleado: !form.num_empleado.trim() ? t('Obligatorio.') : !/^\d+$/.test(form.num_empleado.trim()) ? t('Solo números.') : form.num_empleado.trim().length > 4 ? t('Máximo 4 dígitos.') : isNumDuplicate ? t('Este número ya existe.') : null,
    nombre: !form.nombre.trim() ? t('Obligatorio.') : form.nombre.trim().length < 2 ? t('Mín. 2 letras.') : !isValidNameStr(form.nombre) ? t('Solo letras.') : null,
    area: !form.area ? t('Obligatorio.') : null,
    seccion: !form.seccion ? t('Obligatorio.') : null,
    puesto: !form.puesto ? t('Obligatorio.') : null,
    fecha_ingreso: !form.fecha_ingreso ? t('Obligatorio.') : null,
    turno: !form.turno ? t('Selecciona turno.') : null,
    reclutador: !form.reclutador ? t('Debes asignar un reclutador.') : null,
  };

  const isNameDuplicate = form.nombre.trim() !== '' &&
    existingEmployees.some(e => e.nombre.trim().toLowerCase() === form.nombre.trim().toLowerCase());

  const errorsDelete = {
    fecha_baja: !bajaForm.fecha_baja ? t('Obligatorio.') : null,
    tipo_baja: !bajaForm.tipo_baja ? t('Obligatorio.') : null,
    motivo_baja: !bajaForm.motivo_baja.trim() ? t('Obligatorio.') : null,
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

        const result = await onSave(payload);
        if (result && result.ok === false) {
          const message = result.message ? t(result.message) : t("No se pudo guardar.");
          setErrorMsg(message);
          toast.error({ title: message });
          setSubmitting(false);
          return;
        }
        toast.success({ title: t("¡Guardado!") });
        onClose();
      } else if (mode === "delete" && onDelete && form.num_empleado) {
        const result = await onDelete(form.num_empleado, bajaForm);
        if (result && result.ok === false) {
          const message = result.message ? t(result.message) : t("No se pudo eliminar.");
          setErrorMsg(message);
          toast.error({ title: message });
          setSubmitting(false);
          return;
        }
        toast.success({ title: t("¡Baja registrada!") });
        onClose();
      }
    } catch (err) {
      const message = t("Error inesperado.");
      setErrorMsg(message);
      toast.error({ title: message });
      setSubmitting(false);
    }
  }

  const isAdd = mode === "add";

  const fieldsIdentidad = (
    <div className="employee-modal__identity-grid form-group--span-2">
      <div className="form-group">
        <label htmlFor="emp-num">{t('No. de Empleado')} <span className="text-error">*</span></label>
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
          placeholder={t("Ej. 1234")}
          autoComplete="off"
          className={touchedAdd.num_empleado && errorsAdd.num_empleado ? 'input-error' : ''}
        />
        {touchedAdd.num_empleado && errorsAdd.num_empleado && <span className="form-error-text">{errorsAdd.num_empleado}</span>}
      </div>
      <div className="form-group">
        <label htmlFor="emp-name">{t('Nombre Completo')} <span className="text-error">*</span></label>
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
          placeholder={t("APELLIDOS NOMBRE")}
          autoComplete="off"
          className={touchedAdd.nombre && errorsAdd.nombre ? 'input-error' : ''}
        />
        {touchedAdd.nombre && errorsAdd.nombre && <span className="form-error-text">{errorsAdd.nombre}</span>}
        {!errorsAdd.nombre && isNameDuplicate && mode === 'add' && (
          <span className="form-warning-text">
            <CircleAlert size={12} /> {t('Ya existe alguien con este nombre. Verifica que sea un homónimo.')}
          </span>
        )}
      </div>
    </div>
  );

  const starliteField = (
    <div className="form-group employee-modal__starlite-toggle">
      <label htmlFor="emp-starlite" className="starlite-label">
        Starlite
      </label>
      <CustomSelect
        id="emp-starlite"
        value={form.is_starlite ? "true" : "false"}
        onChange={(val) => setForm({ ...form, is_starlite: val === "true" })}
        options={[
          { value: "false", label: t("No") },
          { value: "true", label: t("Sí") },
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
          <label htmlFor="emp-area">{t('Área')} <span className="text-error">*</span></label>
          <CustomSelect
            id="emp-area"
            value={form.area}
            onChange={(val) => {
              setForm({ ...form, area: val, seccion: "", puesto: "" });
              setTouchedAdd(t => ({ ...t, area: true, seccion: false, puesto: false }));
            }}
            options={areas.map((a) => ({ value: a, label: toNaturalCase(a) }))}
            placeholder={t("Seleccione área…")}
          />
          {touchedAdd.area && errorsAdd.area && <span className="form-error-text">{errorsAdd.area}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="emp-seccion">{t('Sección')} <span className="text-error">*</span></label>
          <CustomSelect
            id="emp-seccion"
            value={form.seccion}
            onChange={(val) => {
              setForm({ ...form, seccion: val, puesto: "" });
              setTouchedAdd(t => ({ ...t, seccion: true, puesto: false }));
            }}
            options={sectionsForArea.map((s) => ({ value: s, label: toNaturalCase(s) }))}
            placeholder={t("Seleccione sección…")}
            disabled={!form.area}
          />
          {touchedAdd.seccion && errorsAdd.seccion && <span className="form-error-text">{errorsAdd.seccion}</span>}
        </div>
        <>
          <div className="form-group">
            <label htmlFor="emp-puesto">{t('Puesto')} <span className="text-error">*</span></label>
            <CustomSelect
              id="emp-puesto"
              value={form.puesto}
              onChange={(val) => {
                setForm({ ...form, puesto: val });
                setTouchedAdd(t => ({ ...t, puesto: true }));
              }}
              options={puestosForSection.map((p) => ({ value: p, label: toNaturalCase(p) }))}
              placeholder={t("Seleccione puesto…")}
              disabled={!form.seccion}
            />
            {touchedAdd.puesto && errorsAdd.puesto && <span className="form-error-text">{errorsAdd.puesto}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="emp-turno">{t('Turno')} <span className="text-error">*</span></label>
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
                { value: "Mixto", label: t("Mixto") },
              ]}
              placeholder={t("Seleccionar...")}
              aria-invalid={touchedAdd.turno && !!errorsAdd.turno}
            />
            {touchedAdd.turno && errorsAdd.turno && <span className="form-error-text">{errorsAdd.turno}</span>}
          </div>
          {starliteField}
        </>
        <div className="form-group">
          <label htmlFor="emp-fecha">{t('Fecha de Ingreso')} <span className="text-error">*</span></label>
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
    <div className="form-group">
      <label htmlFor="emp-vacancy">{t('Puesto')} <span className="text-error">*</span></label>
      <CustomSelect
        id="emp-vacancy"
        value={selectedVacancyIndex.toString()}
        customTrigger={
          <span className="employee-modal__vacancy-value" title={vacancySelectOptions[selectedVacancyIndex]?.label}>
            {vacancySelectOptions[selectedVacancyIndex]?.label ?? t("Seleccione puesto…")}
          </span>
        }
        triggerAppearance="control"
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
        options={vacancySelectOptions}
      />
    </div>
  ) : null;

  // Cuando se usa el selector de vacante, `fieldsPosicion` se oculta y con él
  // su campo de Fecha de Ingreso. Lo reponemos aquí para no perderlo. Si NO hay
  // selector de vacante, `fieldsPosicion` ya incluye su propia Fecha de Ingreso.
  const fieldsFecha = showVacancySelector ? (
    <>
      <>
        <div className="form-group">
          <label htmlFor="emp-vac-categoria">{t('Categoría')}</label>
          <CustomSelect
            id="emp-vac-categoria"
            value={form.categoria}
            onChange={(val) => setForm({ ...form, categoria: val })}
            options={CATEGORIAS.map((c) => ({ value: c, label: c }))}
            placeholder={t("N/A")}
            showPlaceholderOption={false}
          />
        </div>
        <div className="form-group">
          <label htmlFor="emp-vac-turno">{t('Turno')} <span className="text-error">*</span></label>
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
              { value: "Mixto", label: t("Mixto") },
            ]}
            placeholder={t("Turno...")}
            aria-invalid={touchedAdd.turno && !!errorsAdd.turno}
          />
          {touchedAdd.turno && errorsAdd.turno && <span className="form-error-text">{errorsAdd.turno}</span>}
        </div>
        {starliteField}
      </>
      <div className="form-group">
        <label htmlFor="emp-vac-fecha">{t('Fecha de Ingreso')} <span className="text-error">*</span></label>
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

  const fieldsExtra = (
    <>
      <div className="form-group">
        <label htmlFor="emp-reclutador">{t('Reclutador')} <span className="text-error">*</span></label>
        <CustomSelect
          id="emp-reclutador"
          value={form.reclutador}
          onChange={(val) => {
            setForm({ ...form, reclutador: val });
            setTouchedAdd(t => ({ ...t, reclutador: true }));
          }}
          placeholder={t("Seleccionar...")}
          options={recruiterOptions(members, employee?.reclutador, true)}
          aria-invalid={touchedAdd.reclutador && !!errorsAdd.reclutador}
        />
        {touchedAdd.reclutador && errorsAdd.reclutador && <span className="form-error-text">{errorsAdd.reclutador}</span>}
      </div>
    </>
  );

  const errorNotice = errorMsg ? (
    <p id="employee-submit-error" className="form-error-text">
      {errorMsg}
    </p>
  ) : null;

  const icon = isAdd ? (
    <UserRoundPlus size={20} className="color-primary" aria-hidden="true" />
  ) : (
    <Trash2 size={20} className="color-error" aria-hidden="true" />
  );
  const title = isAdd ? t("Nuevo Empleado") : t("Eliminar");
  const deleteContent = (
    <div className="employee-modal__delete">
      <div className="delete-warning">
        <p className="delete-warning__title">
          {t('Esta acción no se puede deshacer.')}
        </p>
      </div>

      <div className="form-grid employee-modal__baja-grid">
        <div className="form-group">
          <label htmlFor="baja-fecha">{t('Fecha de Baja')} <span className="text-error">*</span></label>
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
          <label htmlFor="baja-tipo">{t('Tipo de Baja')} <span className="text-error">*</span></label>
          <CustomSelect
            id="baja-tipo"
            value={bajaForm.tipo_baja}
            onChange={(val) => {
              setBajaForm({ ...bajaForm, tipo_baja: val });
              setTouchedDelete(t => ({ ...t, tipo_baja: true }));
            }}
            options={[
              { value: "Renuncia", label: t("Renuncia") },
              { value: "Ausentismo", label: t("Ausentismo") },
              {
                value: "Rescisión de Contrato",
                label: t("Rescisión de Contrato"),
              },
              { value: "Termino de Contrato", label: t("Termino de Contrato") },
              { value: "Solo Inducción", label: t("Solo Inducción") },
            ]}
          />
          {touchedDelete.tipo_baja && errorsDelete.tipo_baja && <span className="form-error-text">{errorsDelete.tipo_baja}</span>}
        </div>
        <div className="form-group form-group--span-2">
          <label htmlFor="baja-motivo">{t('Descripción')} <span className="text-error">*</span></label>
          <input
            id="baja-motivo"
            type="text"
            placeholder={t("Especifica el motivo...")}
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
        disabled={submitting}
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
                <span>{t('No contará en KPIs ni Dashboard.')}</span>
              </span>
            }
          >
            <span style={{ display: "inline-block" }}>
              <button type="submit" className="btn-primary" disabled={submitting || !isAddValid} form={formId}>
                <Save size="var(--icon-size-sm)" aria-hidden="true" />
                {t("Guardar")}
              </button>
            </span>
          </Tooltip>
        ) : (
          <button type="submit" className="btn-primary" disabled={submitting || !isAddValid} form={formId}>
            <Save size="var(--icon-size-sm)" aria-hidden="true" />
            {t("Guardar")}
          </button>
        )
      ) : (
        <button type="submit" className="btn-danger" disabled={submitting || !isDeleteValid} form={formId}>
          <Trash2 size="var(--icon-size-sm)" aria-hidden="true" />
          {t("Eliminar")}
        </button>
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
        size="sm"
      >
        <form onSubmit={handleSubmit} className="modal-wizard-form" noValidate>
          <FormWizard
            onCancel={onClose}
            submitting={submitting}
            submitDisabled={!isAddValid}
            submitLabel={t("Guardar")}
            submittingLabel={t("Guardando…")}
            notice={errorNotice}
            steps={[
              {
                id: "identidad",
                title: t("Identidad"),
                isValid:
                  form.num_empleado.trim().length > 0 &&
                  form.nombre.trim().length > 0,
                content: <div className="form-grid">{fieldsIdentidad}</div>,
              },
              {
                id: "posicion",
                title: t("Posición"),
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
            ]}
          />
        </form>
      </Modal>
    );
  }

  const Dialog = isMobile ? Modal : FormSheet;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      className="employee-modal"
      icon={icon}
      title={title}
      size="md"
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
          </div>
        ) : (
          deleteContent
        )}

        {errorNotice}
      </form>
    </Dialog>
  );
}
