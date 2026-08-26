import { useMemo, useRef, useState } from 'react';
import { FileUp, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/lib/notify';
import { saveProfileTemplate } from './api';
import {
  criteriaFromImportedRows,
  distributeCriteriaWeights,
  parseProfileImport,
} from './import';
import type { EditableCriterion, EligibleProfileEmployee, ProfileTemplate } from './types';

interface ProfileTemplateManagerProps {
  employees: EligibleProfileEmployee[];
  templates: ProfileTemplate[];
  onSaved: () => Promise<void>;
}

const emptyCriterion = (): EditableCriterion => ({
  key: crypto.randomUUID(),
  category: 'General',
  description: '',
  weightBps: 0,
  isScorable: true,
});

export function ProfileTemplateManager({ employees, templates, onSaved }: ProfileTemplateManagerProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [area, setArea] = useState('');
  const [section, setSection] = useState('');
  const [position, setPosition] = useState('');
  const [source, setSource] = useState<'manual' | 'import'>('manual');
  const [criteria, setCriteria] = useState<EditableCriterion[]>([emptyCriterion()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const jobs = useMemo(() => {
    const unique = new Map<string, EligibleProfileEmployee>();
    for (const employee of employees) {
      unique.set(`${employee.area}|${employee.section}|${employee.position}`, employee);
    }
    return Array.from(unique.values());
  }, [employees]);

  const totalWeightBps = criteria.reduce(
    (total, criterion) => total + (criterion.isScorable ? criterion.weightBps : 0),
    0,
  );
  const hasInvalidCriterion = criteria.some(
    (criterion) => !criterion.description.trim() || (criterion.isScorable && criterion.weightBps <= 0),
  );
  const canSave = Boolean(area.trim() && section.trim() && position.trim())
    && criteria.length > 0
    && !hasInvalidCriterion
    && totalWeightBps === 10000;

  const updateCriterion = (key: string, update: Partial<EditableCriterion>) => {
    setCriteria((current) => current.map((criterion) => (
      criterion.key === key
        ? { ...criterion, ...update, ...('isScorable' in update && !update.isScorable ? { weightBps: 0 } : {}) }
        : criterion
    )));
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const rows = parseProfileImport(await file.text(), file.name);
      const imported = criteriaFromImportedRows(rows);
      if (imported.length === 0) throw new Error('No encontramos criterios para previsualizar.');
      setCriteria(imported.some((criterion) => criterion.weightBps > 0)
        ? imported
        : distributeCriteriaWeights(imported));
      setSource('import');
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos leer el archivo.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave || saving) return;
    setSaving(true);
    setError('');
    try {
      await saveProfileTemplate({ area, section, position, source, criteria });
      toast.success({ title: 'Plantilla activada' });
      setArea('');
      setSection('');
      setPosition('');
      setSource('manual');
      setCriteria([emptyCriterion()]);
      await onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos guardar la plantilla.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-general__template-layout">
      <section className="card profile-general__panel" aria-labelledby="profile-template-editor-title">
        <header className="profile-general__section-header">
          <div>
            <h2 id="profile-template-editor-title">Nueva plantilla</h2>
            <p>Captura los criterios o importa el formato estructurado o heredado desde JSON/CSV y corrige la previsualización.</p>
          </div>
          <label className="btn-secondary profile-general__file-action">
            <FileUp size={16} aria-hidden="true" />
            Importar archivo
            <input
              ref={fileRef}
              type="file"
              accept=".json,.csv,application/json,text/csv"
              onChange={(event) => void handleFile(event.target.files?.[0])}
            />
          </label>
        </header>

        <form onSubmit={(event) => void handleSubmit(event)}>
          <div className="form-grid profile-general__job-fields">
            <div className="form-group">
              <label htmlFor="profile-template-area">Área</label>
              <input id="profile-template-area" list="profile-template-areas" value={area} onChange={(event) => setArea(event.target.value)} required />
              <datalist id="profile-template-areas">
                {[...new Set(jobs.map((job) => job.area))].map((value) => <option key={value} value={value} />)}
              </datalist>
            </div>
            <div className="form-group">
              <label htmlFor="profile-template-section">Sección</label>
              <input id="profile-template-section" list="profile-template-sections" value={section} onChange={(event) => setSection(event.target.value)} required />
              <datalist id="profile-template-sections">
                {[...new Set(jobs.filter((job) => !area || job.area === area).map((job) => job.section))].map((value) => <option key={value} value={value} />)}
              </datalist>
            </div>
            <div className="form-group">
              <label htmlFor="profile-template-position">Puesto</label>
              <input id="profile-template-position" list="profile-template-positions" value={position} onChange={(event) => setPosition(event.target.value)} required />
              <datalist id="profile-template-positions">
                {[...new Set(jobs.filter((job) => (!area || job.area === area) && (!section || job.section === section)).map((job) => job.position))].map((value) => <option key={value} value={value} />)}
              </datalist>
            </div>
          </div>

          <div className="profile-general__criteria-heading">
            <div>
              <h3>Criterios</h3>
              <p>Revisa las descripciones detectadas y elimina cualquier encabezado que no sea un criterio.</p>
            </div>
            <div className="profile-general__criteria-actions">
              <button type="button" className="btn-secondary" onClick={() => setCriteria((current) => distributeCriteriaWeights(current))}>
                Distribuir 100%
              </button>
              <button type="button" className="btn-secondary" onClick={() => setCriteria((current) => [...current, emptyCriterion()])}>
                <Plus size={16} aria-hidden="true" /> Añadir criterio
              </button>
            </div>
          </div>

          <ol className="profile-general__criteria-editor">
            {criteria.map((criterion, index) => {
              const descriptionId = `profile-criterion-description-${criterion.key}`;
              const categoryId = `profile-criterion-category-${criterion.key}`;
              const weightId = `profile-criterion-weight-${criterion.key}`;
              return (
                <li key={criterion.key} className="profile-general__criterion-editor">
                  <span className="profile-general__criterion-number" aria-hidden="true">{index + 1}</span>
                  <div className="form-group">
                    <label htmlFor={descriptionId}>Criterio</label>
                    <input id={descriptionId} value={criterion.description} onChange={(event) => updateCriterion(criterion.key, { description: event.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor={categoryId}>Categoría</label>
                    <input id={categoryId} value={criterion.category} onChange={(event) => updateCriterion(criterion.key, { category: event.target.value })} required />
                  </div>
                  <div className="form-group profile-general__weight-field">
                    <label htmlFor={weightId}>Peso (%)</label>
                    <input
                      id={weightId}
                      type="number"
                      min="0.01"
                      max="100"
                      step="0.01"
                      value={criterion.isScorable ? criterion.weightBps / 100 : 0}
                      onChange={(event) => updateCriterion(criterion.key, { weightBps: Math.round(Number(event.target.value) * 100) })}
                      disabled={!criterion.isScorable}
                      required={criterion.isScorable}
                    />
                  </div>
                  <label className="profile-general__check-label">
                    <input type="checkbox" checked={criterion.isScorable} onChange={(event) => updateCriterion(criterion.key, { isScorable: event.target.checked })} />
                    Evaluable
                  </label>
                  <button
                    type="button"
                    className="btn-icon btn-icon--danger"
                    onClick={() => setCriteria((current) => current.filter((item) => item.key !== criterion.key))}
                    aria-label={`Eliminar criterio ${index + 1}`}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="profile-general__template-footer">
            <p className={totalWeightBps === 10000 ? 'text-success' : 'text-error'}>
              Peso evaluable total: {(totalWeightBps / 100).toFixed(2)}%
            </p>
            <button type="submit" className="btn-primary" disabled={!canSave || saving}>
              {saving ? 'Guardando…' : 'Guardar y activar'}
            </button>
          </div>
          {error && <p className="form-error-text" role="alert">{error}</p>}
        </form>
      </section>

      <section className="card profile-general__panel" aria-labelledby="profile-template-list-title">
        <header className="profile-general__section-header">
          <div>
            <h2 id="profile-template-list-title">Plantillas registradas</h2>
            <p>Las evaluaciones conservan la versión utilizada aunque se active una nueva.</p>
          </div>
        </header>
        {templates.length === 0 ? (
          <div className="profile-general__empty" role="status">
            <h3>Sin plantillas</h3>
            <p>Crea la primera plantilla para habilitar la captura del puesto.</p>
          </div>
        ) : (
          <div className="profile-general__details-list">
            {templates.map((template) => (
              <details key={template.id} className="profile-general__details">
                <summary>
                  <span>{template.puesto}</span>
                  <span className="profile-general__summary-meta">
                    {template.area} · {template.seccion} · v{template.version} · {template.status === 'active' ? 'Activa' : template.status === 'draft' ? 'Borrador' : 'Archivada'}
                  </span>
                </summary>
                <ol>
                  {template.criteria.map((criterion) => (
                    <li key={criterion.id}>
                      <span>{criterion.description}</span>
                      <span>{criterion.is_scorable ? `${(criterion.weight_bps / 100).toFixed(2)}%` : 'Informativo'}</span>
                    </li>
                  ))}
                </ol>
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
