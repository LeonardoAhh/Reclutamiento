import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, LockKeyhole, Save } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { formatReadableDate } from '@/lib/dates';
import { toast } from '@/lib/notify';
import { reopenProfileEvaluation, saveProfileEvaluation } from './api';
import {
  profileHiringKey,
  profilePositionKey,
  type EligibleProfileEmployee,
  type ProfileCycle,
  type ProfileEvaluation,
  type ProfileTemplate,
} from './types';

interface ProfileEvaluationPanelProps {
  cycle: ProfileCycle;
  employees: EligibleProfileEmployee[];
  templates: ProfileTemplate[];
  evaluations: ProfileEvaluation[];
  isAdmin: boolean;
  onSaved: () => Promise<void>;
}

export function ProfileEvaluationPanel({
  cycle,
  employees,
  templates,
  evaluations,
  isAdmin,
  onSaved,
}: ProfileEvaluationPanelProps) {
  const [selectedKey, setSelectedKey] = useState('');
  const [responses, setResponses] = useState<Record<string, boolean | undefined>>({});
  const [comments, setComments] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedEmployee = employees.find((employee) => employee.key === selectedKey) ?? null;
  const existingEvaluation = selectedEmployee
    ? evaluations.find((evaluation) => (
      profileHiringKey(evaluation.employee_num, evaluation.employee_entry_date) === selectedEmployee.key
    )) ?? null
    : null;

  const template = useMemo(() => {
    if (existingEvaluation) {
      return templates.find((item) => item.id === existingEvaluation.template_id) ?? null;
    }
    if (!selectedEmployee) return null;
    const positionKey = profilePositionKey(
      selectedEmployee.area,
      selectedEmployee.section,
      selectedEmployee.position,
    );
    return templates.find((item) => (
      item.status === 'active'
      && profilePositionKey(item.area, item.seccion, item.puesto) === positionKey
    )) ?? null;
  }, [existingEvaluation, selectedEmployee, templates]);

  useEffect(() => {
    setResponses(Object.fromEntries(
      (existingEvaluation?.items ?? []).map((item) => [item.criterion_id, item.complies]),
    ));
    setComments(existingEvaluation?.comments ?? '');
    setError('');
  }, [existingEvaluation?.id, selectedKey]);

  const scorableCriteria = template?.criteria.filter((criterion) => criterion.is_scorable) ?? [];
  const answeredCount = scorableCriteria.filter((criterion) => typeof responses[criterion.id] === 'boolean').length;
  const previewScoreBps = scorableCriteria.reduce(
    (score, criterion) => score + (responses[criterion.id] ? criterion.weight_bps : 0),
    0,
  );
  const isLocked = existingEvaluation?.status === 'submitted';

  const handleSave = async (submit: boolean) => {
    if (!selectedEmployee || !template || saving || isLocked) return;
    if (submit && answeredCount !== scorableCriteria.length) {
      setError('Responde todos los criterios evaluables antes de enviar.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await saveProfileEvaluation({
        cycleId: cycle.id,
        templateId: template.id,
        employee: selectedEmployee,
        responses,
        comments,
        submit,
      });
      toast.success({ title: submit ? 'Evaluación enviada' : 'Borrador guardado' });
      await onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos guardar la evaluación.');
    } finally {
      setSaving(false);
    }
  };

  const handleReopen = async () => {
    if (!existingEvaluation || !isAdmin || saving) return;
    setSaving(true);
    setError('');
    try {
      await reopenProfileEvaluation(existingEvaluation.id);
      toast.success({ title: 'Evaluación reabierta' });
      await onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos reabrir la evaluación.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card profile-general__panel" aria-labelledby="profile-capture-title">
      <header className="profile-general__section-header">
        <div>
          <h2 id="profile-capture-title">Captura de evaluación</h2>
          <p>{cycle.name} · cada ingreso se evalúa una sola vez.</p>
        </div>
        {selectedEmployee && existingEvaluation && (
          <span className={`profile-general__status profile-general__status--${existingEvaluation.status}`}>
            {existingEvaluation.status === 'submitted' ? 'Enviada' : 'Borrador'}
          </span>
        )}
      </header>

      <div className="form-group profile-general__employee-select">
        <label htmlFor="profile-general-employee">Empleado</label>
        <CustomSelect
          id="profile-general-employee"
          value={selectedKey}
          onChange={setSelectedKey}
          options={employees.map((employee) => ({
            value: employee.key,
            label: `${employee.num} · ${employee.name} · ${employee.position}`,
          }))}
          placeholder="Selecciona un empleado"
          searchable
        />
      </div>

      {!selectedEmployee ? (
        <div className="profile-general__empty" role="status">
          <h3>Selecciona un empleado</h3>
          <p>Se mostrará la plantilla activa correspondiente a su puesto.</p>
        </div>
      ) : (
        <>
          <dl className="profile-general__employee-data">
            <div><dt>Empleado</dt><dd>{selectedEmployee.num} · {selectedEmployee.name}</dd></div>
            <div><dt>Ingreso</dt><dd>{formatReadableDate(selectedEmployee.entryDate)}</dd></div>
            <div><dt>Puesto</dt><dd>{selectedEmployee.area} · {selectedEmployee.section} · {selectedEmployee.position}</dd></div>
            <div><dt>Reclutador</dt><dd>{selectedEmployee.recruiter || 'Sin asignar'}</dd></div>
            <div><dt>Estado laboral</dt><dd>{selectedEmployee.source === 'baja' ? `Baja · ${formatReadableDate(selectedEmployee.exitDate)}` : 'Activo'}</dd></div>
          </dl>

          {!template ? (
            <div className="profile-general__notice" role="alert">
              <h3>El puesto no tiene una plantilla activa</h3>
              <p>Un Administrador debe crearla o importarla antes de evaluar este ingreso.</p>
            </div>
          ) : (
            <form onSubmit={(event) => { event.preventDefault(); void handleSave(true); }}>
              <fieldset className="profile-general__evaluation-fieldset" disabled={isLocked || saving}>
                <legend>Perfil de {template.puesto} · versión {template.version}</legend>
                <div className="profile-general__evaluation-list">
                  {template.criteria.map((criterion, index) => {
                    if (!criterion.is_scorable) {
                      return (
                        <div key={criterion.id} className="profile-general__criterion profile-general__criterion--info">
                          <span className="profile-general__criterion-index">{index + 1}</span>
                          <div><strong>{criterion.description}</strong><span>{criterion.category} · Informativo</span></div>
                        </div>
                      );
                    }
                    const groupLabelId = `profile-evaluation-criterion-${criterion.id}`;
                    return (
                      <div key={criterion.id} className="profile-general__criterion">
                        <span className="profile-general__criterion-index">{index + 1}</span>
                        <div className="profile-general__criterion-copy">
                          <strong id={groupLabelId}>{criterion.description}</strong>
                          <span>{criterion.category} · {(criterion.weight_bps / 100).toFixed(2)}%</span>
                        </div>
                        <div className="profile-general__binary" role="radiogroup" aria-labelledby={groupLabelId}>
                          <label>
                            <input
                              type="radio"
                              name={`criterion-${criterion.id}`}
                              checked={responses[criterion.id] === true}
                              onChange={() => setResponses((current) => ({ ...current, [criterion.id]: true }))}
                              required
                            />
                            Cumple
                          </label>
                          <label>
                            <input
                              type="radio"
                              name={`criterion-${criterion.id}`}
                              checked={responses[criterion.id] === false}
                              onChange={() => setResponses((current) => ({ ...current, [criterion.id]: false }))}
                              required
                            />
                            No cumple
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </fieldset>

              <div className="form-group profile-general__comments">
                <label htmlFor="profile-evaluation-comments">Comentarios</label>
                <textarea
                  id="profile-evaluation-comments"
                  value={comments}
                  onChange={(event) => setComments(event.target.value)}
                  disabled={isLocked || saving}
                  placeholder="Observaciones generales de la evaluación"
                />
              </div>

              <div className="profile-general__evaluation-footer">
                <div className="profile-general__score" aria-live="polite">
                  <span>Resultado</span>
                  <strong>{(previewScoreBps / 100).toFixed(2)}%</strong>
                  <small>{answeredCount} de {scorableCriteria.length} criterios respondidos</small>
                </div>
                <div className="profile-general__footer-actions">
                  {isLocked ? (
                    isAdmin && (
                      <button type="button" className="btn-secondary" onClick={() => void handleReopen()} disabled={saving}>
                        <LockKeyhole size={16} aria-hidden="true" /> Reabrir para corrección
                      </button>
                    )
                  ) : (
                    <>
                      <button type="button" className="btn-secondary" onClick={() => void handleSave(false)} disabled={saving}>
                        <Save size={16} aria-hidden="true" /> Guardar borrador
                      </button>
                      <button type="submit" className="btn-primary" disabled={saving || answeredCount !== scorableCriteria.length}>
                        <CheckCircle2 size={16} aria-hidden="true" /> Enviar y bloquear
                      </button>
                    </>
                  )}
                </div>
              </div>
              {isLocked && !isAdmin && (
                <p className="profile-general__locked-note">La evaluación está bloqueada. Solo un Administrador puede reabrirla.</p>
              )}
              {error && <p className="form-error-text" role="alert">{error}</p>}
            </form>
          )}
        </>
      )}
    </section>
  );
}

