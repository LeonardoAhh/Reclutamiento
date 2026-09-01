import { useCallback, useMemo, useState } from 'react';
import { FileUp, Plus, Printer, Trash2 } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { toast } from '@/lib/notify';
import { usePositions } from '@/lib/positions';
import { saveProfileTemplate } from './api';
import { ProfileImportModal } from './ProfileImportModal';
import { ProfileTemplatePrint } from './ProfileTemplatePrint';
import { distributeCriteriaWeights } from './import';
import type { EditableCriterion, ProfileTemplate } from './types';

interface ProfileTemplateManagerProps {
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

export function ProfileTemplateManager({ templates, onSaved }: ProfileTemplateManagerProps) {
  const { positions, loading: positionsLoading } = usePositions();
  const [area, setArea] = useState('');
  const [position, setPosition] = useState('');
  const [source, setSource] = useState<'manual' | 'import'>('manual');
  const [criteria, setCriteria] = useState<EditableCriterion[]>([emptyCriterion()]);
  const [importOpen, setImportOpen] = useState(false);
  const [printTemplate, setPrintTemplate] = useState<ProfileTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handlePrintComplete = useCallback(() => setPrintTemplate(null), []);

  const areas = useMemo(
    () => Array.from(new Set(positions.map((item) => item.area))).sort((left, right) => left.localeCompare(right, 'es-MX')),
    [positions],
  );
  const positionOptions = useMemo(
    () => Array.from(new Set(
      positions
        .filter((item) => item.area === area)
        .map((item) => item.puesto),
    )).sort((left, right) => left.localeCompare(right, 'es-MX')),
    [area, positions],
  );

  const totalWeightBps = criteria.reduce(
    (total, criterion) => total + (criterion.isScorable ? criterion.weightBps : 0),
    0,
  );
  const hasInvalidCriterion = criteria.some(
    (criterion) => !criterion.description.trim() || (criterion.isScorable && criterion.weightBps <= 0),
  );
  const canSave = Boolean(area.trim() && position.trim())
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave || saving) return;
    setSaving(true);
    setError('');
    try {
      await saveProfileTemplate({ area, position, source, criteria });
      toast.success({ title: 'Plantilla activada' });
      setArea('');
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
          <button type="button" className="btn-secondary" onClick={() => setImportOpen(true)}>
            <FileUp size={16} aria-hidden="true" />
            Importar archivo
          </button>
        </header>

        <form onSubmit={(event) => void handleSubmit(event)}>
          <div className="form-grid profile-general__job-fields">
            <div className="form-group">
              <label htmlFor="profile-template-area">Área</label>
              <CustomSelect
                id="profile-template-area"
                value={area}
                onChange={(value) => {
                  setArea(value);
                  setPosition('');
                }}
                options={areas.map((value) => ({ value, label: value }))}
                placeholder={positionsLoading ? 'Cargando áreas…' : 'Selecciona un área'}
                disabled={positionsLoading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="profile-template-position">Puesto</label>
              <CustomSelect
                id="profile-template-position"
                value={position}
                onChange={setPosition}
                options={positionOptions.map((value) => ({ value, label: value }))}
                placeholder="Selecciona un puesto"
                disabled={!area}
              />
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
                    {template.area} · v{template.version} · {template.status === 'active' ? 'Activa' : template.status === 'draft' ? 'Borrador' : 'Archivada'}
                  </span>
                </summary>
                <div className="profile-general__template-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setPrintTemplate(template)}
                  >
                    <Printer size={16} aria-hidden="true" />
                    Imprimir formato
                  </button>
                </div>
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
      {printTemplate && (
        <ProfileTemplatePrint template={printTemplate} onComplete={handlePrintComplete} />
      )}
      {importOpen && (
        <ProfileImportModal
          onClose={() => setImportOpen(false)}
          onImported={(importedCriteria) => {
            setCriteria(importedCriteria);
            setSource('import');
            setError('');
          }}
        />
      )}
    </div>
  );
}
