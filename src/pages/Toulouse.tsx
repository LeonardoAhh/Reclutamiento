import { useMemo, useState } from 'react';
import { Printer, Save, RefreshCw, Trash2, FileText, ClipboardCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToulouseSheets, type ToulouseSheetRecord } from '@/hooks/useToulouseSheets';
import { ToulouseSheet, type ToulouseSheetData } from '@/components/toulouse/ToulouseSheet';
import {
  DEFAULT_TOULOUSE_CONFIG,
  buildFolio,
  generateGrid,
  newSeed,
} from '@/lib/toulouse';
import { localTodayIso, formatShortDate } from '@/lib/dates';
import { sileo } from '@/lib/notify';
import './Toulouse.css';

type Variant = 'candidato' | 'correccion';

export function Toulouse() {
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

  function printVariant(v: Variant) {
    setVariant(v);
    requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
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
    const res = await save(record);
    setSaving(false);
    sileo.success({
      title: 'Hoja guardada',
      description: res.message ?? `${effectiveFolio} · ${candidato.trim()}`,
    });
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
    sileo.info({ title: `Hoja cargada · ${s.folio ?? s.candidato_nombre}` });
  }

  return (
    <main className="tp-page">
      <section className="tp-page__hero tp-no-print">
        <div>
          <h1>Toulouse-Piéron</h1>
          <p className="tp-page__lead">
            Genera la hoja de aplicación y su plantilla de corrección, imprime en tamaño
            carta y guarda cada hoja para reimprimir idéntica.
          </p>
        </div>
      </section>

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
                  <input
                    id="tp-evaluador"
                    type="text"
                    value={evaluador}
                    onChange={(e) => setEvaluador(e.target.value)}
                    autoComplete="off"
                    data-testid="tp-evaluador"
                  />
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
                <RefreshCw size={16} aria-hidden="true" /> Nueva rejilla
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSave}
                disabled={saving}
                data-testid="tp-save"
              >
                <Save size={16} aria-hidden="true" /> {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>

            <div className="tp-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => printVariant('candidato')}
                data-testid="tp-print-candidato"
              >
                <Printer size={16} aria-hidden="true" /> Imprimir hoja
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => printVariant('correccion')}
                data-testid="tp-print-correccion"
              >
                <Printer size={16} aria-hidden="true" /> Imprimir plantilla
              </button>
            </div>
          </form>

          {/* ── Hojas guardadas ── */}
          <section className="tp-saved" aria-label="Hojas guardadas">
            <h2 className="tp-saved__title">Hojas guardadas</h2>
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
              aria-selected={variant === 'candidato'}
              className={`tp-tab${variant === 'candidato' ? ' tp-tab--active' : ''}`}
              onClick={() => setVariant('candidato')}
              data-testid="tp-tab-candidato"
            >
              <FileText size={15} aria-hidden="true" /> Hoja del candidato
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={variant === 'correccion'}
              className={`tp-tab${variant === 'correccion' ? ' tp-tab--active' : ''}`}
              onClick={() => setVariant('correccion')}
              data-testid="tp-tab-correccion"
            >
              <ClipboardCheck size={15} aria-hidden="true" /> Plantilla de corrección
            </button>
          </div>

          <div className="tp-preview-scroll">
            <div className="tp-printable">
              <ToulouseSheet data={sheetData} config={config} seed={seed} variant={variant} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
