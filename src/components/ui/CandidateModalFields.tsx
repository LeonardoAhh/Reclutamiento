import type { Dispatch, SetStateAction } from 'react';
import { CircleCheckBig, XCircle } from 'lucide-react';
import type { Language } from '@/contexts/LanguageContext';
import { formatPhoneNumber, toNaturalCase } from '@/lib/utils';
import type { TeamMember } from '@/features/team/types';
import { playSound } from '@/lib/sound';
import { CustomSelect } from './CustomSelect';
import type { CandidateFormErrors, CandidateFormState, CandidateFormTouched } from './candidateForm';

export interface CandidateModalFieldsProps {
  canEditCitaAndSource: boolean;
  errors: CandidateFormErrors;
  form: CandidateFormState;
  formId: string;
  isAdmin: boolean;
  isEdit: boolean;
  isPhoneValid: boolean;
  language: Language;
  members: readonly TeamMember[];
  noOpenPositions: boolean;
  restrictToOpen: boolean;
  areas: string[];
  sectionsForArea: string[];
  puestosForSection: string[];
  candidateRecruiter?: string | null;
  setForm: Dispatch<SetStateAction<CandidateFormState>>;
  setTouched: Dispatch<SetStateAction<CandidateFormTouched>>;
  touched: CandidateFormTouched;
  duplicateSource: string | null;
}

export function CandidateContactFields({
  errors,
  form,
  formId,
  isAdmin,
  isEdit,
  isPhoneValid,
  language,
  setForm,
  setTouched,
  touched,
  duplicateSource,
}: CandidateModalFieldsProps) {
  const en = language === 'en';

  return (
    <>
      <div className="form-group">
        <label htmlFor="cand-nombre">
          {en ? 'Full name' : 'Nombre completo'} <span className="text-error">*</span>
        </label>
        <input
          id="cand-nombre"
          type="text"
          value={form.nombre}
          data-cuelume-type=""
          onChange={(event) => {
            setForm({ ...form, nombre: event.target.value.toUpperCase() });
            if (!touched.nombre) setTouched({ ...touched, nombre: true });
          }}
          onBlur={() => {
            setForm({ ...form, nombre: form.nombre.trim().replace(/\s+/g, ' ') });
            if (!touched.nombre) setTouched({ ...touched, nombre: true });
          }}
          placeholder="APELLIDOS NOMBRE"
          autoComplete="off"
          disabled={isEdit && !isAdmin}
          className={touched.nombre && errors.nombre ? 'input-error' : ''}
        />
        {touched.nombre && errors.nombre && <span className="form-error-text">{errors.nombre}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="cand-telefono">
          {en ? 'Phone' : 'Teléfono'} <span className="text-error">*</span>
        </label>
        <div className="phone-input-wrapper">
          <input
            id="cand-telefono"
            type="tel"
            inputMode="tel"
            value={form.telefono}
            data-cuelume-type=""
            onChange={(event) => {
              const onlyNums = event.target.value.replace(/\D/g, '');
              if (onlyNums.length > 10) return;
              setForm({ ...form, telefono: onlyNums });
              if (!touched.telefono) setTouched({ ...touched, telefono: true });
            }}
            onBlur={() => {
              setForm({ ...form, telefono: formatPhoneNumber(form.telefono) });
              if (!touched.telefono) setTouched({ ...touched, telefono: true });
            }}
            placeholder="442 123 4567"
            autoComplete="off"
            disabled={isEdit && !isAdmin}
            aria-invalid={(touched.telefono && !!errors.telefono) || undefined}
            aria-describedby={touched.telefono && errors.telefono ? `${formId}-telefono-error` : undefined}
            className={touched.telefono && errors.telefono ? 'input-error' : ''}
          />
          {isPhoneValid && <CircleCheckBig size={18} className="phone-validation-icon valid" aria-hidden="true" />}
          {touched.telefono && errors.telefono && (
            <XCircle size={18} className="phone-validation-icon invalid" aria-hidden="true" />
          )}
        </div>
        {touched.telefono && errors.telefono && (
          <span id={`${formId}-telefono-error`} className={duplicateSource ? 'sr-only' : 'form-error-text'}>
            {errors.telefono}
          </span>
        )}
      </div>
    </>
  );
}

export function CandidatePositionFields({
  areas,
  errors,
  form,
  isAdmin,
  isEdit,
  language,
  noOpenPositions,
  restrictToOpen,
  sectionsForArea,
  setForm,
  setTouched,
  touched,
  puestosForSection,
}: CandidateModalFieldsProps) {
  const en = language === 'en';

  return (
    <>
      <div className="form-group">
        <label htmlFor="cand-area">
          {en ? 'Area' : 'Área'} <span className="text-error">*</span>
          {restrictToOpen && noOpenPositions && (
            <span className="candidate-modal__hint" role="note">
              <span className="candidate-modal__hint--warning">
                {en ? 'No open vacancies' : 'Sin vacantes abiertas'}
              </span>
            </span>
          )}
        </label>
        <CustomSelect
          id="cand-area"
          value={form.area}
          onChange={(value) => {
            playSound('select');
            setForm({ ...form, area: value, seccion: '', puesto: '' });
            setTouched({ ...touched, area: true, seccion: false, puesto: false });
          }}
          options={areas.map((area) => ({ value: area, label: toNaturalCase(area) }))}
          placeholder={en ? 'Select…' : 'Seleccionar…'}
          disabled={(isEdit && !isAdmin) || noOpenPositions}
          aria-invalid={touched.area && !!errors.area}
        />
        {touched.area && errors.area && <span className="form-error-text">{errors.area}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="cand-seccion">
          {en ? 'Section' : 'Sección'} <span className="text-error">*</span>
        </label>
        <CustomSelect
          id="cand-seccion"
          value={form.seccion}
          onChange={(value) => {
            playSound('select');
            setForm({ ...form, seccion: value, puesto: '' });
            setTouched({ ...touched, seccion: true, puesto: false });
          }}
          options={sectionsForArea.map((section) => ({ value: section, label: toNaturalCase(section) }))}
          placeholder={en ? 'Select…' : 'Seleccionar…'}
          disabled={!form.area || (isEdit && !isAdmin)}
          aria-invalid={touched.seccion && !!errors.seccion}
        />
        {touched.seccion && errors.seccion && <span className="form-error-text">{errors.seccion}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="cand-puesto">
          {en ? 'Position' : 'Puesto'} <span className="text-error">*</span>
        </label>
        <CustomSelect
          id="cand-puesto"
          value={form.puesto}
          onChange={(value) => {
            playSound('select');
            setForm({ ...form, puesto: value });
            setTouched({ ...touched, puesto: true });
          }}
          options={puestosForSection.map((position) => ({ value: position, label: toNaturalCase(position) }))}
          placeholder={en ? 'Select…' : 'Seleccionar…'}
          disabled={!form.seccion || (isEdit && !isAdmin)}
          aria-invalid={touched.puesto && !!errors.puesto}
        />
        {touched.puesto && errors.puesto && <span className="form-error-text">{errors.puesto}</span>}
      </div>
    </>
  );
}
