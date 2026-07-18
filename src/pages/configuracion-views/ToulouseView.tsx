import { useMemo, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Printer, Save, RefreshCw, Trash2, FileText, ClipboardCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToulouseSheets, type ToulouseSheetRecord } from '@/hooks/useToulouseSheets';
import { ToulouseSheet, type ToulouseSheetData } from '@/components/toulouse/ToulouseSheet';
import {
  DEFAULT_TOULOUSE_CONFIG,
  buildFolio,
  generateGrid,
  newSeed,
  TOULOUSE_CONSIGNA,
  TOULOUSE_EVALUATOR_STEPS,
  TOULOUSE_CANDIDATE_STEPS,
} from '@/lib/toulouse';
import { RECLUTADORES_ACTIVOS } from '@/lib/constants';
import { localTodayIso, formatShortDate } from '@/lib/dates';
import { sileo } from '@/lib/notify';
import './Toulouse.css';

type Variant = 'candidato' | 'correccion';

export function ToulouseView() {
  const { profile, username } = useAuth();
  const { sheets, save, remove } = useToulouseSheets();

  const config = DEFAULT_TOULOUSE_CONFIG;

  const [candidato, setCandidato] = useState('');
  const [puesto, setPuesto] = useState('');
  const [edad, setEdad] = useState('');
  const [fecha, setFecha] = useState(localTodayIso());
  const [evaluador, setEvaluador] = useState('');
  const [tiempoMin, setTiempoMin] = useState('10');
  const [folio, setFolio] = useState('');
  const [seed, setSeed] = useState(() => newSeed());
  const [variant, setVariant] = useState<Variant>('candidato');
  const [saving, setSaving] = useState(false);

  const sheetData: ToulouseSheetData = useMemo(
    () => ({
      folio,
      candidato,
      puesto,
      edad,
      fecha,
      evaluador,
      tiempoLimiteMin: tiempoMin,
    }),
    [folio, candidato, puesto, edad, fecha, evaluador, tiempoMin]
  );

  function regenerate() {
    setSeed(newSeed());
    sileo.info({ title: 'Nueva rejilla generada' });
  }

  function handlePrint() {
    window.print();
  }

  async function handleSave() {
    if (!candidato.trim()) {
      sileo.error({ title: 'Falta el nombre del candidato' });
      return;
    }
    setSaving(true);
    const effectiveFolio = folio.trim() || buildFolio(fecha);
    if (!folio.trim()) setFolio(effectiveFolio);
    const targets = generateGrid(seed, config).targets;
    const record: ToulouseSheetRecord = {
      folio: effectiveFolio,
      candidato_nombre: candidato.trim(),
      puesto_solicitado: puesto.trim() || null,
      edad: edad.trim() ? Number(edad) : null,
      fecha,
      evaluador: evaluador.trim() || null,
      tiempo_limite_seg: tiempoMin.trim() ? Math.round(Number(tiempoMin) * 60) : null,
      seed,
      filas: config.rows,
      columnas: config.cols,
      modelos: config.models,
      total_objetivos: targets,
      created_by: profile?.display_name ?? username ?? null,
    };
    const result = await save(record);
    setSaving(false);
    sileo.success({
      title: 'Hoja guardada',
    });
  }

  function handlePreviewTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const nextVariant: Variant = event.key === 'Home' || event.key === 'ArrowLeft'
      ? 'candidato'
      : 'correccion';
    setVariant(nextVariant);
    requestAnimationFrame(() => document.getElementById(`tp-tab-${nextVariant}`)?.focus());
  }

  function loadSheet(s: ToulouseSheetRecord) {
    setCandidato(s.candidato_nombre);
    setPuesto(s.puesto_solicitado ?? '');
    setEdad(s.edad != null ? String(s.edad) : '');
    setFecha(s.fecha);
    setEvaluador(s.evaluador ?? '');
    setTiempoMin(s.tiempo_limite_seg != null ? String(Math.round(s.tiempo_limite_seg / 60)) : '');
    setFolio(s.folio ?? '');
    setSeed(Number(s.seed));
    sileo.info({ title: 'Hoja cargada' });
  }

  return (
    <section className="tp-page config-page__content">
      <header className="config-page__header tp-no-print">
        <h2 className="config-page__title">Toulouse-Piéron</h2>
      </header>

      {/* ── Apartado de instrucciones (evaluador + candidato) ── */}
      <details className="tp-instructions tp-no-print" open>
        <summary className="tp-instructions__summary">Instrucciones de la prueba</summary>
        <div className="tp-instructions__grid">
          <article className="tp-instructions__card">
            <h3 className="tp-instructions__title">Para el evaluador (aplicación)</h3>
            <ol className="tp-instructions__list">
              {TOULOUSE_EVALUATOR_STEPS.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </article>
          <article className="tp-instructions__card">
            <h2 className="tp-instructions__title">Para el candidato</h2>
            <p className="tp-instructions__consigna">
              <strong>Consigna:</strong> «{TOULOUSE_CONSIGNA}»
            </p>
            <ol className="tp-instructions__list">
              {TOULOUSE_CANDIDATE_STEPS.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </article>
        </div>
        <p className="tp-instructions__source">
          Basado en el manual del test Toulouse-Piéron (atención y resistencia a la fatiga):
          ejecución de 10 min con señales por minuto y corrección PD = A − (E + O).
        </p>
      </details>

      <div className="tp-layout">
        {/* ── Panel de configuración ── */}
        <aside className="tp-panel tp-no-print">
          <form className="tp-form" onSubmit={(e) => e.preventDefault()}>
            <fieldset className="tp-fieldset">
              <legend>Datos del candidato</legend>

              <div className="tp-form__group">
                <label htmlFor="tp-candidato">Nombre del candidato *</label>
                <input
                  id="tp-candidato"
                  type="text"
                  value={candidato}
                  onChange={(e) => setCandidato(e.target.value)}
                  autoComplete="off"
                  required
                  aria-required="true"
                  data-testid="tp-candidato"
                />
              </div>

              <div className="tp-form__group">
                <label htmlFor="tp-puesto">Puesto solicitado</label>
                <input
                  id="tp-puesto"
                  type="text"
                  value={puesto}
                  onChange={(e) => setPuesto(e.target.value)}
                  autoComplete="off"
                  data-testid="tp-puesto"
                />
              </div>

              <div className="tp-form__row">
                <div className="tp-form__group">
                  <label htmlFor="tp-edad">Edad</label>
                  <input
                    id="tp-edad"
                    type="number"
                    min={0}
                    max={120}
                    value={edad}
                    onChange={(e) => setEdad(e.target.value)}
                    data-testid="tp-edad"
                  />
                </div>
                <div className="tp-form__group">
                  <label htmlFor="tp-fecha">Fecha</label>
                  <input
                    id="tp-fecha"
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    data-testid="tp-fecha"
                  />
                </div>
              </div>

              <div className="tp-form__row">
                <div className="tp-form__group">
                  <label htmlFor="tp-evaluador">Evaluador</label>
                  <select
                    id="tp-evaluador"
                    value={evaluador}
                    onChange={(e) => setEvaluador(e.target.value)}
                    data-testid="tp-evaluador"
                  >
                    <option value="">SELECCIONA</option>
                    {RECLUTADORES_ACTIVOS.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="tp-form__group">
                  <label htmlFor="tp-tiempo">Tiempo límite (min)</label>
                  <input
                    id="tp-tiempo"
                    type="number"
                    min={1}
                    value={tiempoMin}
                    onChange={(e) => setTiempoMin(e.target.value)}
                    data-testid="tp-tiempo"
                  />
                </div>
              </div>

              <div className="tp-form__group">
                <label htmlFor="tp-folio">Folio (opcional)</label>
                <input
                  id="tp-folio"
                  type="text"
                  value={folio}
                  onChange={(e) => setFolio(e.target.value)}
                  placeholder="Se genera automáticamente al guardar"
                  autoComplete="off"
                  data-testid="tp-folio"
                />
              </div>
            </fieldset>

            <div className="tp-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={regenerate}
                data-testid="tp-regenerate"
              >
                <RefreshCw size={16} aria-hidden="true" />
                Nueva rejilla
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSave}
                disabled={saving}
                data-testid="tp-save"
              >
                <Save size={16} aria-hidden="true" />
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handlePrint}
                data-testid="tp-print"
              >
                <Printer size={16} aria-hidden="true" />
                Imprimir
              </button>
            </div>
          </form>

          {/* ── Hojas guardadas ── */}
          <section className="tp-saved" aria-label="Hojas guardadas">
            <h3 className="tp-saved__title">Hojas guardadas</h3>
            {sheets.length === 0 ? (
              <p className="tp-saved__empty">Aún no hay hojas guardadas.</p>
            ) : (
              <ul className="tp-saved__list">
                {sheets.map((s) => (
                  <li key={s.id} className="tp-saved__item">
                    <button
                      type="button"
                      className="tp-saved__load"
                      onClick={() => loadSheet(s)}
                      data-testid={`tp-load-${s.id}`}
                    >
                      <span className="tp-saved__name">{s.candidato_nombre}</span>
                      <span className="tp-saved__meta">
                        {s.folio ?? '—'} · {formatShortDate(s.fecha)}
                        {s.puesto_solicitado ? ` · ${s.puesto_solicitado}` : ''}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="tp-saved__del"
                      onClick={() => s.id && remove(s.id)}
                      aria-label={`Eliminar hoja de ${s.candidato_nombre}`}
                      data-testid={`tp-del-${s.id}`}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>

        {/* ── Vista previa ── */}
        <section className="tp-preview-wrap" aria-label="Vista previa">
          <div className="tp-preview-toolbar" role="tablist" aria-label="Tipo de hoja">
            <button
              type="button"
              role="tab"
              id="tp-tab-candidato"
              aria-selected={variant === 'candidato'}
              aria-controls="tp-preview-panel"
              tabIndex={variant === 'candidato' ? 0 : -1}
              className={`tp-tab${variant === 'candidato' ? ' tp-tab--active' : ''}`}
              onClick={() => setVariant('candidato')}
              onKeyDown={handlePreviewTabKeyDown}
              data-testid="tp-tab-candidato"
            >
              <FileText size={15} aria-hidden="true" /> Hoja del candidato
            </button>
            <button
              type="button"
              role="tab"
              id="tp-tab-correccion"
              aria-selected={variant === 'correccion'}
              aria-controls="tp-preview-panel"
              tabIndex={variant === 'correccion' ? 0 : -1}
              className={`tp-tab${variant === 'correccion' ? ' tp-tab--active' : ''}`}
              onClick={() => setVariant('correccion')}
              onKeyDown={handlePreviewTabKeyDown}
              data-testid="tp-tab-correccion"
            >
              <ClipboardCheck size={15} aria-hidden="true" /> Plantilla de corrección
            </button>
          </div>

          <div
            className="tp-preview-scroll"
            id="tp-preview-panel"
            role="tabpanel"
            tabIndex={0}
            aria-labelledby={variant === 'candidato' ? 'tp-tab-candidato' : 'tp-tab-correccion'}
          >
            <div className="tp-preview-sheet">
              <ToulouseSheet data={sheetData} config={config} seed={seed} variant={variant} />
            </div>
          </div>
        </section>
      </div>

      {/* Portal de impresión: copia directa en <body>, fuera de contenedores con
          overflow/transform. Solo visible al imprimir (ver Toulouse.css). */}
      {createPortal(
        <div className="tp-print-portal">
          <ToulouseSheet data={sheetData} config={config} seed={seed} variant="candidato" />
          <ToulouseSheet data={sheetData} config={config} seed={seed} variant="correccion" />
        </div>,
        document.body
      )}
    </section>
  );
}
