import { useMemo, useRef, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Modal } from './Modal';
import { FormWizard } from './FormWizard';
import { CustomSelect, type Option } from './CustomSelect';
import { usePositions } from '@/lib/positions';
import { useAuth } from '@/hooks/useAuth';
import { sileo } from '@/lib/notify';
import './PositionSettingsWizard.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const byLabel = (a: Option, b: Option) => a.label.localeCompare(b.label, 'es');

/**
 * Wizard admin-only para configurar `plantilla autorizada`, `backup`,
 * `urgentes` y `notas` de un puesto. Paso a paso: Área → Sección → Puesto →
 * Valores. Guarda en `position_settings` (override que manda sobre el código).
 */
export function PositionSettingsWizard({ isOpen, onClose }: Props) {
  const { positions, upsertPositionSetting } = usePositions();
  const { profile, username } = useAuth();

  const [area, setArea] = useState('');
  const [seccion, setSeccion] = useState('');
  const [puesto, setPuesto] = useState('');
  const [plantilla, setPlantilla] = useState('');
  const [backup, setBackup] = useState('');
  const [urgentes, setUrgentes] = useState('');
  const [notas, setNotas] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Opciones derivadas del catálogo efectivo.
  const areaOptions = useMemo<Option[]>(() => {
    const set = new Set(positions.map((p) => p.area));
    return Array.from(set).map((a) => ({ value: a, label: a })).sort(byLabel);
  }, [positions]);

  const seccionOptions = useMemo<Option[]>(() => {
    const set = new Set(positions.filter((p) => p.area === area).map((p) => p.seccion));
    return Array.from(set).map((s) => ({ value: s, label: s })).sort(byLabel);
  }, [positions, area]);

  const puestoOptions = useMemo<Option[]>(() => {
    const set = new Set(
      positions
        .filter((p) => p.area === area && p.seccion === seccion)
        .map((p) => p.puesto)
    );
    return Array.from(set).map((p) => ({ value: p, label: p })).sort(byLabel);
  }, [positions, area, seccion]);

  const selected = useMemo(
    () =>
      positions.find(
        (p) => p.area === area && p.seccion === seccion && p.puesto === puesto
      ) ?? null,
    [positions, area, seccion, puesto]
  );

  function resetAll() {
    setArea('');
    setSeccion('');
    setPuesto('');
    setPlantilla('');
    setBackup('');
    setUrgentes('');
    setNotas('');
    setError('');
  }

  function handleClose() {
    if (submitting) return;
    resetAll();
    onClose();
  }

  // Al elegir puesto, pre-llenar con los valores efectivos actuales.
  function handlePuestoChange(value: string) {
    setPuesto(value);
    if (!value) {
      setPlantilla('');
      setBackup('');
      setUrgentes('');
      setNotas('');
      return;
    }
    const pos = positions.find(
      (p) => p.area === area && p.seccion === seccion && p.puesto === value
    );
    if (pos) {
      setPlantilla(String(pos.plantilla_autorizada ?? 0));
      setBackup(String(pos.backup ?? 0));
      setUrgentes(String(pos.urgentes ?? 0));
      setNotas(pos.notas ?? '');
    }
  }

  // Validación del paso 4: todos los campos numéricos deben ser >= 0.
  const isPlantillaError = plantilla !== '' && (Number.isNaN(Number(plantilla)) || Number(plantilla) < 0);
  const isBackupError = backup !== '' && (Number.isNaN(Number(backup)) || Number(backup) < 0);
  const isUrgentesError = urgentes !== '' && (Number.isNaN(Number(urgentes)) || Number(urgentes) < 0);

  const valoresValidos = useMemo(() => {
    const plantillaNum = Number(plantilla);
    const backupNum = Number(backup);
    const urgentesNum = Number(urgentes);
    return (
      plantilla !== '' &&
      backup !== '' &&
      urgentes !== '' &&
      !Number.isNaN(plantillaNum) &&
      !Number.isNaN(backupNum) &&
      !Number.isNaN(urgentesNum) &&
      plantillaNum >= 0 &&
      backupNum >= 0 &&
      urgentesNum >= 0
    );
  }, [plantilla, backup, urgentes]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!area || !seccion || !puesto) {
      setError('Selecciona un área, sección y puesto válidos.');
      return;
    }
    if (!valoresValidos) {
      setError('Los valores deben ser números mayores o iguales a 0.');
      return;
    }
    const plantillaNum = Number(plantilla);
    const backupNum = Number(backup);
    const urgentesNum = Number(urgentes);

    setSubmitting(true);
    setError('');
    const res = await upsertPositionSetting({
      area,
      seccion,
      puesto,
      plantilla_autorizada: plantillaNum,
      backup: backupNum,
      urgentes: urgentesNum,
      notas: notas.trim() || null,
      updated_by: profile?.display_name ?? username ?? null,
    });
    setSubmitting(false);
    if (res.ok) {
      sileo.success({
        title: 'Configuración guardada',
      });
      resetAll();
      onClose();
    } else {
      setError(res.message ?? 'No se pudo guardar.');
    }
  }

  if (!isOpen) return null;

  const errorNotice = error ? (
    <p className="form-error" role="alert" data-testid="pos-settings-error">
      {error}
    </p>
  ) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={<SlidersHorizontal size={20} className="color-primary" aria-hidden="true" />}
      title="Plantilla / Backup"
      className="pos-settings-modal modal-wizard-mobile"
      size="md"
      fullscreenMobile={false}
    >
      <form onSubmit={handleSubmit} className="modal-wizard-form" noValidate>
        <FormWizard
          onCancel={handleClose}
          submitting={submitting}
          submitDisabled={!area || !seccion || !puesto || !valoresValidos}
          submitLabel="Guardar"
          submittingLabel="Guardando…"
          notice={errorNotice}
          steps={[
            {
              id: 'seleccion',
              title: 'Puesto',
              isValid: area.length > 0 && seccion.length > 0 && puesto.length > 0,
              content: (
                <div data-testid="pos-settings-step-seleccion">
                  <div className="form-group">
                    <label htmlFor="pos-area">Área *</label>
                    <CustomSelect
                      id="pos-area"
                      value={area}
                      onChange={(v) => {
                        setArea(v);
                        setSeccion('');
                        setPuesto('');
                      }}
                      options={areaOptions}
                      placeholder="Seleccionar área…"
                      aria-label="Área"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="pos-seccion">Sección *</label>
                    <CustomSelect
                      id="pos-seccion"
                      value={seccion}
                      onChange={(v) => {
                        setSeccion(v);
                        setPuesto('');
                      }}
                      options={seccionOptions}
                      placeholder="Seleccionar sección…"
                      aria-label="Sección"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="pos-puesto">Puesto *</label>
                    <CustomSelect
                      id="pos-puesto"
                      value={puesto}
                      onChange={handlePuestoChange}
                      options={puestoOptions}
                      placeholder="Seleccionar puesto…"
                      aria-label="Puesto"
                    />
                  </div>
                </div>
              ),
            },
            {
              id: 'valores',
              title: 'Valores',
              isValid: valoresValidos,
              content: (
                <div data-testid="pos-settings-step-valores">
                  {/* El summary desaparece si no hay selected, pero los inputs SIEMPRE se renderizan */}
                  {selected ? (
                    <div className="pos-settings__summary">
                      <span className="pos-settings__summary-puesto">{selected.puesto}</span>
                      <span className="pos-settings__summary-sub">
                        {selected.area} · {selected.seccion}
                      </span>
                    </div>
                  ) : (
                    <div className="pos-settings__summary pos-settings__summary--empty">
                      <span className="pos-settings__summary-puesto">—</span>
                      <span className="pos-settings__summary-sub">
                        Selecciona un puesto válido
                      </span>
                    </div>
                  )}
                  <div className="pos-settings-metrics-grid">
                    <div className="form-group">
                      <label htmlFor="pos-plantilla">Plantilla autorizada *</label>
                      <input
                        id="pos-plantilla"
                        type="number"
                        min={0}
                        value={plantilla}
                        onChange={(e) => setPlantilla(e.target.value)}
                        data-testid="pos-settings-plantilla"
                        className={isPlantillaError ? 'input-error' : ''}
                        aria-invalid={isPlantillaError}
                        aria-describedby={isPlantillaError ? "pos-plantilla-error" : undefined}
                        required
                      />
                      {isPlantillaError && (
                        <span id="pos-plantilla-error" className="no-citados-subtext" style={{ color: 'var(--color-accent-orange)', display: 'block', marginTop: 'var(--spacing-xxs)' }}>
                          Debe ser 0 o mayor
                        </span>
                      )}
                    </div>
                    <div className="form-group">
                      <label htmlFor="pos-backup">Backup *</label>
                      <input
                        id="pos-backup"
                        type="number"
                        min={0}
                        value={backup}
                        onChange={(e) => setBackup(e.target.value)}
                        data-testid="pos-settings-backup"
                        className={isBackupError ? 'input-error' : ''}
                        aria-invalid={isBackupError}
                        aria-describedby={isBackupError ? "pos-backup-error" : undefined}
                        required
                      />
                      {isBackupError && (
                        <span id="pos-backup-error" className="no-citados-subtext" style={{ color: 'var(--color-accent-orange)', display: 'block', marginTop: 'var(--spacing-xxs)' }}>
                          Debe ser 0 o mayor
                        </span>
                      )}
                    </div>
                    <div className="form-group">
                      <label htmlFor="pos-urgentes">Starlite *</label>
                      <input
                        id="pos-urgentes"
                        type="number"
                        min={0}
                        value={urgentes}
                        onChange={(e) => setUrgentes(e.target.value)}
                        data-testid="pos-settings-urgentes"
                        className={isUrgentesError ? 'input-error' : ''}
                        aria-invalid={isUrgentesError}
                        aria-describedby={isUrgentesError ? "pos-urgentes-error" : undefined}
                        required
                      />
                      {isUrgentesError && (
                        <span id="pos-urgentes-error" className="no-citados-subtext" style={{ color: 'var(--color-accent-orange)', display: 'block', marginTop: 'var(--spacing-xxs)' }}>
                          Debe ser 0 o mayor
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="form-group pos-settings-notas-wrap">
                    <label htmlFor="pos-notas">Notas</label>
                    <textarea
                      id="pos-notas"
                      rows={3}
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      placeholder="Motivo del backup / contexto…"
                      data-testid="pos-settings-notas"
                    />
                  </div>
                </div>
              ),
            },
          ]}
        />
      </form>
    </Modal>
  );
}
