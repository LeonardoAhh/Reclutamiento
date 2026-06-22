import { useMemo, useState } from 'react';
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) {
      setError('Selecciona un puesto válido.');
      return;
    }
    const plantillaNum = Number(plantilla);
    const backupNum = Number(backup);
    const urgentesNum = Number(urgentes);
    if ([plantillaNum, backupNum, urgentesNum].some((n) => Number.isNaN(n) || n < 0)) {
      setError('Los valores deben ser números mayores o iguales a 0.');
      return;
    }
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
        description: `${puesto}: backup ${backupNum}, plantilla ${plantillaNum}`,
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
      className="pos-settings-modal modal-fullscreen-mobile modal-wizard-mobile"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="modal-wizard-form" noValidate>
        <FormWizard
          onCancel={handleClose}
          submitting={submitting}
          submitDisabled={!selected}
          submitLabel="Guardar configuración"
          submittingLabel="Guardando…"
          notice={errorNotice}
          steps={[
            {
              id: 'area',
              title: 'Área',
              isValid: area.length > 0,
              content: (
                <div className="form-group" data-testid="pos-settings-step-area">
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
              ),
            },
            {
              id: 'seccion',
              title: 'Sección',
              isValid: seccion.length > 0,
              content: (
                <div className="form-group" data-testid="pos-settings-step-seccion">
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
              ),
            },
            {
              id: 'puesto',
              title: 'Puesto',
              isValid: puesto.length > 0,
              content: (
                <div className="form-group" data-testid="pos-settings-step-puesto">
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
              ),
            },
            {
              id: 'valores',
              title: 'Valores',
              content: (
                <div data-testid="pos-settings-step-valores">
                  {selected && (
                    <div className="pos-settings__summary">
                      <span className="pos-settings__summary-puesto">{selected.puesto}</span>
                      <span className="pos-settings__summary-sub">
                        {selected.area} · {selected.seccion}
                      </span>
                    </div>
                  )}
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="pos-plantilla">Plantilla autorizada</label>
                      <input
                        id="pos-plantilla"
                        type="number"
                        min={0}
                        value={plantilla}
                        onChange={(e) => setPlantilla(e.target.value)}
                        data-testid="pos-settings-plantilla"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="pos-backup">Backup</label>
                      <input
                        id="pos-backup"
                        type="number"
                        min={0}
                        value={backup}
                        onChange={(e) => setBackup(e.target.value)}
                        data-testid="pos-settings-backup"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="pos-urgentes">Urgentes</label>
                      <input
                        id="pos-urgentes"
                        type="number"
                        min={0}
                        value={urgentes}
                        onChange={(e) => setUrgentes(e.target.value)}
                        data-testid="pos-settings-urgentes"
                      />
                    </div>
                    <div className="form-group form-group--span-2">
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
                </div>
              ),
            },
          ]}
        />
      </form>
    </Modal>
  );
}
