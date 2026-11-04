import type { Language } from '@/contexts/LanguageContext';
import { candidateSourceLabel, candidateStatusLabel } from '@/lib/candidateTranslations';
import { CANDIDATE_SOURCES, CANDIDATE_STATUSES } from '@/lib/types';
import { recruiterOptions, type TeamMember } from '@/features/team/types';
import { playSound } from '@/lib/sound';
import { CustomSelect } from './CustomSelect';
import type { CandidateFormErrors, CandidateFormState, CandidateFormTouched } from './candidateForm';

interface CandidateProcessFieldsProps {
  canEditCitaAndSource: boolean;
  candidateRecruiter?: string | null;
  errors: CandidateFormErrors;
  form: CandidateFormState;
  isAdmin: boolean;
  isEdit: boolean;
  language: Language;
  members: readonly TeamMember[];
  setForm: React.Dispatch<React.SetStateAction<CandidateFormState>>;
  setTouched: React.Dispatch<React.SetStateAction<CandidateFormTouched>>;
  touched: CandidateFormTouched;
}

export function CandidateProcessFields({
  candidateRecruiter,
  canEditCitaAndSource,
  errors,
  form,
  isAdmin,
  isEdit,
  language,
  members,
  setForm,
  setTouched,
  touched,
}: CandidateProcessFieldsProps) {
  const en = language === 'en';

  return (
    <>
      <div className="form-group">
        <label htmlFor="cand-status">{en ? 'Process' : 'Proceso'}</label>
        <CustomSelect
          id="cand-status"
          value={form.status}
          onChange={(value) => {
            playSound('select');
            setForm({ ...form, status: value as CandidateFormState['status'] });
          }}
          options={CANDIDATE_STATUSES.map((status) => ({
            value: status,
            label: candidateStatusLabel(status, language),
          }))}
        />
      </div>

      <div className="candidate-modal__field-row">
        <div className="form-group">
          <label htmlFor="cand-reclutador">
            {en ? 'Recruiter' : 'Reclutador'} <span className="text-error">*</span>
          </label>
          <CustomSelect
            id="cand-reclutador"
            value={form.reclutador}
            onChange={(value) => {
              playSound('select');
              setForm({ ...form, reclutador: value });
              setTouched({ ...touched, reclutador: true });
            }}
            placeholder={en ? 'Select...' : 'Seleccionar...'}
            options={recruiterOptions(members, isEdit ? candidateRecruiter : null)}
            disabled={isEdit && !isAdmin}
            aria-label={
              en ? 'Recruiter in charge of the process, required' : 'Reclutador a cargo del proceso, obligatorio'
            }
            aria-invalid={touched.reclutador && !!errors.reclutador}
          />
          {touched.reclutador && errors.reclutador && <span className="form-error-text">{errors.reclutador}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="cand-source">
            {en ? 'Recruitment source' : 'Medio de reclutamiento'} <span className="text-error">*</span>
          </label>
          <CustomSelect
            id="cand-source"
            value={form.source}
            onChange={(value) => {
              playSound('select');
              setForm({ ...form, source: value });
              setTouched({ ...touched, source: true });
            }}
            options={CANDIDATE_SOURCES.map((source) => ({
              value: source,
              label: candidateSourceLabel(source, language),
            }))}
            placeholder={en ? 'Select...' : 'Seleccionar...'}
            disabled={isEdit && !canEditCitaAndSource}
            aria-invalid={touched.source && !!errors.source}
          />
          {touched.source && errors.source && <span className="form-error-text">{errors.source}</span>}
        </div>
      </div>

      <div className="candidate-modal__field-row">
        <div className="form-group">
          <label htmlFor="cand-starlite">Starlite</label>
          <CustomSelect
            id="cand-starlite"
            value={form.is_starlite ? 'true' : 'false'}
            onChange={(value) => {
              playSound('select');
              setForm({ ...form, is_starlite: value === 'true' });
            }}
            options={[
              { value: 'false', label: 'No' },
              { value: 'true', label: en ? 'Yes' : 'Sí' },
            ]}
            disabled={isEdit && !isAdmin}
          />
        </div>

        <div className="form-group">
          <label htmlFor="cand-fecha-cita">
            {en ? 'Interview date' : 'Fecha de entrevista'} <span className="text-error">*</span>
          </label>
          <input
            id="cand-fecha-cita"
            type="date"
            data-cuelume-select=""
            value={form.fecha_cita}
            onChange={(event) => {
              setForm({ ...form, fecha_cita: event.target.value });
              setTouched({ ...touched, fecha_cita: true });
            }}
            disabled={isEdit && !canEditCitaAndSource}
            className={touched.fecha_cita && errors.fecha_cita ? 'input-error' : ''}
          />
          {touched.fecha_cita && errors.fecha_cita && <span className="form-error-text">{errors.fecha_cita}</span>}
        </div>
      </div>
    </>
  );
}
