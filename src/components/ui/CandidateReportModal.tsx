import { useEffect, useMemo, useState } from 'react';
import { Copy, Check, Share2, Users } from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Modal } from './Modal';
import {
  formatShortDate,
  isoWeekOf,
  isInIsoWeek,
  formatIsoWeekRange,
} from '@/lib/dates';
import { RECLUTADORES_ACTIVOS } from '@/lib/constants';
import { normalizeString } from '@/lib/utils';
import type { Candidate, CandidateStatus } from '@/lib/types';
import './CandidateReportModal.css';

interface CandidateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: Candidate[];
}

/** Status que cuentan como "candidato activo" (en proceso). Coinciden con
 *  los usados en Pipeline para "citados": entrevista 1 y entrevista 2.
 *  Contratado / Rechazado son terminales y no aparecen en este resumen.
 */
const ACTIVE_STATUSES: ReadonlySet<CandidateStatus> = new Set<CandidateStatus>([
  'entrevista',
  'entrega_documentos',
  'faltan_documentos',
  'feedback_pendiente',
]);

const SIN_ASIGNAR = 'Sin asignar';

interface PuestoRow {
  area: string;
  seccion: string;
  turno: string;
  puesto: string;
  e1: number;
  e2: number;
  fd: number;
  fp: number;
  total: number;
}

interface ContratadoPuestoRow {
  area: string;
  puesto: string;
  count: number;
}

interface ContratadoAreaGroup {
  area: string;
  rows: ContratadoPuestoRow[];
  total: number;
}

interface AreaGroup {
  area: string;
  rows: PuestoRow[];
  total: number;
}

interface RecruiterRow {
  name: string;
  e1: number;
  e2: number;
  fd: number;
  fp: number;
  total: number;
}

/** Extrae el turno (1ER/2DO/3ER/etc. TURNO) embebido en el nombre de
 *  sección. Si la sección no contiene patrón reconocible, devuelve "".
 */
function extractTurno(seccion: string): string {
  const match = seccion.match(
    /\b(?:1ER|1RA|1ER\.|2DO|2DA|2DO\.|3ER|3RA|3ER\.|4TO|4TA|4TO\.|NOCTURNO|DIURNO|MATUTINO|VESPERTINO)\s*\.?\s*TURNO\b/i,
  );
  return match ? match[0].toUpperCase().replace(/\s+/g, ' ').trim() : '';
}

function buildPuestoGroups(active: Candidate[]): AreaGroup[] {
  const rowMap = new Map<string, PuestoRow>();
  for (const c of active) {
    const area = c.area || '—';
    const seccion = c.seccion?.trim() || '—';
    const puesto = c.puesto || '—';
    const key = `${area}||${seccion}||${puesto}`;
    let row = rowMap.get(key);
    if (!row) {
      row = {
        area,
        seccion,
        turno: extractTurno(seccion),
        puesto,
        e1: 0,
        e2: 0,
        fd: 0,
        fp: 0,
        total: 0,
      };
      rowMap.set(key, row);
    }
    // At this point, row is guaranteed to exist
    if (c.status === 'entrevista') {
      row.e1 += 1;
    } else if (c.status === 'entrega_documentos') {
      row.e2 += 1;
    } else if (c.status === 'faltan_documentos') {
      row.fd += 1;
    } else if (c.status === 'feedback_pendiente') {
      row.fp += 1;
    }
    row.total += 1;
  }

  const rows = Array.from(rowMap.values()).sort((a, b) => {
    if (a.area !== b.area) return a.area.localeCompare(b.area, 'es');
    if (a.seccion !== b.seccion) return a.seccion.localeCompare(b.seccion, 'es');
    return a.puesto.localeCompare(b.puesto, 'es');
  });

  const map = new Map<string, AreaGroup>();
  for (const row of rows) {
    let group = map.get(row.area);
    if (!group) {
      group = { area: row.area, rows: [], total: 0 };
      map.set(row.area, group);
    }
    group.rows.push(row);
    group.total += row.total;
  }
  return Array.from(map.values()).sort((a, b) => a.area.localeCompare(b.area, 'es'));
}

function buildContratadoGroups(contratados: Candidate[]): ContratadoAreaGroup[] {
  const rowMap = new Map<string, ContratadoPuestoRow>();
  for (const c of contratados) {
    const area = c.area || '—';
    const puesto = c.puesto || '—';
    const key = `${area}||${puesto}`;
    let row = rowMap.get(key);
    if (!row) {
      row = { area, puesto, count: 0 };
      rowMap.set(key, row);
    }
    
    // At this point, row is guaranteed to exist
    row.count += 1;
  }

  const rows = Array.from(rowMap.values()).sort((a, b) => {
    if (a.area !== b.area) return a.area.localeCompare(b.area, 'es');
    return a.puesto.localeCompare(b.puesto, 'es');
  });

  const map = new Map<string, ContratadoAreaGroup>();
  for (const row of rows) {
    let group = map.get(row.area);
    if (!group) {
      group = { area: row.area, rows: [], total: 0 };
      map.set(row.area, group);
    }
    group.rows.push(row);
    group.total += row.count;
  }
  return Array.from(map.values()).sort((a, b) => a.area.localeCompare(b.area, 'es'));
}

function buildRecruiterRows(active: Candidate[]): RecruiterRow[] {
  const empty = (name: string): RecruiterRow => ({ name, e1: 0, e2: 0, fd: 0, fp: 0, total: 0 });
  const acc = new Map<string, RecruiterRow>();
  for (const name of RECLUTADORES_ACTIVOS) acc.set(name, empty(name));
  acc.set(SIN_ASIGNAR, empty(SIN_ASIGNAR));

  for (const c of active) {
    const norm = normalizeString(c.reclutador ?? '');
    const key = acc.has(norm) ? norm : SIN_ASIGNAR;
    const bucket = acc.get(key)!;
    if (c.status === 'entrevista') bucket.e1 += 1;
    else if (c.status === 'entrega_documentos') bucket.e2 += 1;
    else if (c.status === 'faltan_documentos') bucket.fd += 1;
    else if (c.status === 'feedback_pendiente') bucket.fp += 1;
    bucket.total += 1;
  }

  // Mostrar primero a los reclutadores con carga; "Sin asignar" siempre al
  // final si tiene algo, oculto si no.
  return Array.from(acc.values()).filter(
    (r) => r.name !== SIN_ASIGNAR || r.total > 0,
  );
}

/** Texto plano listo para WhatsApp. WhatsApp respeta `*negritas*` y emojis. */
function buildWhatsappMessage(
  groups: AreaGroup[],
  recruiters: RecruiterRow[],
  contratadoGroups: ContratadoAreaGroup[],
  totalActivos: number,
  totalContratados: number,
  contratadosWeekLabel: string | null,
): string {
  const fecha = formatShortDate(new Date().toISOString());
  // Cuando el scope de contratados es "semana", el conteo refleja solo esa
  // semana; lo aclaramos en el encabezado para que el lector no lo confunda
  // con el total histórico.
  const contratadosLabel = contratadosWeekLabel
    ? `Contratados (sem ${contratadosWeekLabel}): ${totalContratados}`
    : `Contratados: ${totalContratados}`;
  const lines: string[] = [
    `*Resumen de Candidatos* — ${fecha}`,
    '',
    `Activos: ${totalActivos} · ${contratadosLabel} · Puestos: ${groups.reduce((s, g) => s + g.rows.length, 0)} · Reclutadores: ${recruiters.filter((r) => r.total > 0).length}`,
    '',
  ];

  if (groups.length > 0) {
    lines.push('*Por puesto*');
    for (const g of groups) {
      lines.push('');
      lines.push(`_${g.area}_ — ${g.total}`);
      for (const r of g.rows) {
        const seccionConTurno = r.turno && !r.seccion.toUpperCase().includes(r.turno)
          ? `${r.seccion} · ${r.turno}`
          : r.seccion;
        const detalle: string[] = [];
        if (r.e1 > 0) detalle.push(`Entrevista: ${r.e1}`);
        if (r.e2 > 0) detalle.push(`Entrega de documentos: ${r.e2}`);
        if (r.fd > 0) detalle.push(`Faltan documentos: ${r.fd}`);
        if (r.fp > 0) detalle.push(`Feedback pendiente: ${r.fp}`);
        lines.push(`• ${seccionConTurno} — ${r.puesto}`);
        lines.push(`   ${r.total} (${detalle.join(' · ')})`);
      }
    }
    lines.push('');
  }

  const activeRecruiters = recruiters.filter((r) => r.total > 0);
  if (activeRecruiters.length > 0) {
    lines.push('*Por reclutador*');
    for (const r of activeRecruiters) {
      const detalle: string[] = [];
      if (r.e1 > 0) detalle.push(`Entrevista: ${r.e1}`);
      if (r.e2 > 0) detalle.push(`Entrega de documentos: ${r.e2}`);
      if (r.fd > 0) detalle.push(`Faltan documentos: ${r.fd}`);
      if (r.fp > 0) detalle.push(`Feedback pendiente: ${r.fp}`);
      lines.push(`• ${r.name} — ${r.total} (${detalle.join(' · ')})`);
    }
  }

  if (contratadoGroups.length > 0) {
    lines.push('');
    lines.push(`*Contratados (${totalContratados})*`);
    for (const g of contratadoGroups) {
      lines.push('');
      lines.push(`_${g.area}_ — ${g.total}`);
      for (const r of g.rows) {
        lines.push(`• ${r.puesto} — ${r.count}`);
      }
    }
  }

  return lines.join('\n').trim();
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 320, damping: 28 },
  },
};

export function CandidateReportModal({
  isOpen,
  onClose,
  candidates,
}: CandidateReportModalProps) {
  // Scope del bloque de contratados: 'all' = histórico, 'week' = semana ISO en
  // curso (TZ MX) según `fecha_contratacion`. Los activos son un snapshot del
  // pipeline y no se filtran por fecha.
  const [scope, setScope] = useState<'all' | 'week'>('all');
  const week = useMemo(() => isoWeekOf(new Date()), []);
  const weekLabel = formatIsoWeekRange(week);

  const active = useMemo(
    () => candidates.filter((c) => ACTIVE_STATUSES.has(c.status)),
    [candidates],
  );
  const contratados = useMemo(() => {
    const all = candidates.filter((c) => c.status === 'contratado');
    if (scope === 'all') return all;
    return all.filter((c) => isInIsoWeek(c.fecha_contratacion, week));
  }, [candidates, scope, week]);
  const groups = useMemo(() => buildPuestoGroups(active), [active]);
  const recruiters = useMemo(() => buildRecruiterRows(active), [active]);
  const contratadoGroups = useMemo(() => buildContratadoGroups(contratados), [contratados]);

  const totalActivos = active.length;
  const totalContratados = contratados.length;
  const totalPuestos = groups.reduce((sum, g) => sum + g.rows.length, 0);
  const reclutadoresActivos = recruiters.filter((r) => r.total > 0).length;
  const message = useMemo(
    () =>
      buildWhatsappMessage(
        groups,
        recruiters,
        contratadoGroups,
        totalActivos,
        totalContratados,
        scope === 'week' ? weekLabel : null,
      ),
    [groups, recruiters, contratadoGroups, totalActivos, totalContratados, scope, weekLabel],
  );

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(id);
  }, [copied]);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      setScope('all');
    }
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = message;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        setCopied(true);
      } finally {
        document.body.removeChild(ta);
      }
    }
  };

  const handleShareWhatsapp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const empty = totalActivos === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="candidate-report-modal"
      icon={<Users size={20} aria-hidden="true" />}
      title="Resumen de candidatos"
      subtitle={
        <span className="candidate-report-modal__subtitle">
          Activos en proceso · por puesto y por reclutador
        </span>
      }
    >
      <div className="modal-body candidate-report-modal__body">
        <motion.header
          className="candidate-report-modal__summary"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <div className="candidate-report-modal__stat">
            <div className="candidate-report-modal__big-number">{totalActivos}</div>
            <p className="candidate-report-modal__big-label">
              candidato{totalActivos === 1 ? '' : 's'} activo{totalActivos === 1 ? '' : 's'}
            </p>
          </div>
          <div className="candidate-report-modal__stat">
            <div className="candidate-report-modal__big-number candidate-report-modal__big-number--alt">
              {totalPuestos}
            </div>
            <p className="candidate-report-modal__big-label">
              puesto{totalPuestos === 1 ? '' : 's'} con proceso
            </p>
          </div>
          <div className="candidate-report-modal__stat">
            <div className="candidate-report-modal__big-number candidate-report-modal__big-number--success">
              {totalContratados}
            </div>
            <p className="candidate-report-modal__big-label">
              contratado{totalContratados === 1 ? '' : 's'}
              {scope === 'week' && <> · semana</>}
            </p>
          </div>
          <div className="candidate-report-modal__stat">
            <div className="candidate-report-modal__big-number candidate-report-modal__big-number--muted">
              {reclutadoresActivos}
            </div>
            <p className="candidate-report-modal__big-label">
              reclutador{reclutadoresActivos === 1 ? '' : 'es'} con carga
            </p>
          </div>
        </motion.header>

        <div
          className="candidate-report-modal__scope"
          role="group"
          aria-label="Alcance de contratados"
        >
          <span className="candidate-report-modal__scope-label">Contratados:</span>
          <div className="candidate-report-modal__scope-toggle">
            <button
              type="button"
              className={`candidate-report-modal__scope-btn ${
                scope === 'all' ? 'candidate-report-modal__scope-btn--active' : ''
              }`}
              onClick={() => setScope('all')}
              aria-pressed={scope === 'all'}
            >
              General
            </button>
            <button
              type="button"
              className={`candidate-report-modal__scope-btn ${
                scope === 'week' ? 'candidate-report-modal__scope-btn--active' : ''
              }`}
              onClick={() => setScope('week')}
              aria-pressed={scope === 'week'}
              title={`Semana en curso (${weekLabel})`}
            >
              Semana en curso
            </button>
          </div>
          {scope === 'week' && (
            <span className="candidate-report-modal__scope-range">{weekLabel}</span>
          )}
        </div>

        {empty ? (
          <motion.p
            className="candidate-report-modal__empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            No hay candidatos activos en proceso.
          </motion.p>
        ) : (
          <>
            <motion.section
              className="candidate-report-modal__groups"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              aria-label="Candidatos agrupados por puesto"
            >
              <h3 className="candidate-report-modal__section-title">Por puesto</h3>
              {groups.map((group) => (
                <motion.article
                  key={group.area}
                  className="candidate-report-modal__group"
                  variants={itemVariants}
                >
                  <header className="candidate-report-modal__group-header">
                    <h4 className="candidate-report-modal__group-title">{group.area}</h4>
                    <span className="candidate-report-modal__group-count">
                      {group.total} candidato{group.total === 1 ? '' : 's'}
                    </span>
                  </header>
                  <ul className="candidate-report-modal__rows">
                    {group.rows.map((row) => (
                      <motion.li
                        key={`${row.area}|${row.seccion}|${row.puesto}`}
                        className="candidate-report-modal__row"
                        variants={itemVariants}
                      >
                        <div className="candidate-report-modal__row-main">
                          <span className="candidate-report-modal__puesto">{row.puesto}</span>
                          <span className="candidate-report-modal__seccion">
                            {row.seccion}
                            {row.turno && !row.seccion.toUpperCase().includes(row.turno) && (
                              <> · {row.turno}</>
                            )}
                          </span>
                        </div>
                        <div className="candidate-report-modal__badges">
                          {row.e1 > 0 && (
                            <span className="candidate-report-modal__badge candidate-report-modal__badge--e1">
                              E1: {row.e1}
                            </span>
                          )}
                          {row.e2 > 0 && (
                            <span className="candidate-report-modal__badge candidate-report-modal__badge--e2">
                              E2: {row.e2}
                            </span>
                          )}
                          {row.fp > 0 && (
                            <span className="candidate-report-modal__badge candidate-report-modal__badge--e1">
                              FP: {row.fp}
                            </span>
                          )}
                          <span className="candidate-report-modal__badge candidate-report-modal__badge--total">
                            {row.total}
                          </span>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                </motion.article>
              ))}
            </motion.section>

            <motion.section
              className="candidate-report-modal__recruiters"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              aria-label="Conteo por reclutador"
            >
              <h3 className="candidate-report-modal__section-title">Por reclutador</h3>
              <ul className="candidate-report-modal__recruiter-list">
                {recruiters.map((r) => (
                  <motion.li
                    key={r.name}
                    className={`candidate-report-modal__recruiter ${
                      r.total === 0 ? 'candidate-report-modal__recruiter--empty' : ''
                    }`}
                    variants={itemVariants}
                  >
                    <span className="candidate-report-modal__recruiter-name">{r.name}</span>
                    <div className="candidate-report-modal__recruiter-badges">
                      {r.e1 > 0 && (
                        <span className="candidate-report-modal__badge candidate-report-modal__badge--e1">
                          E1: {r.e1}
                        </span>
                      )}
                      {r.e2 > 0 && (
                        <span className="candidate-report-modal__badge candidate-report-modal__badge--e2">
                          E2: {r.e2}
                        </span>
                      )}
                      {r.fp > 0 && (
                        <span className="candidate-report-modal__badge candidate-report-modal__badge--e1">
                          FP: {r.fp}
                        </span>
                      )}
                      <span
                        className={`candidate-report-modal__badge candidate-report-modal__badge--total ${
                          r.total === 0
                            ? 'candidate-report-modal__badge--total-muted'
                            : ''
                        }`}
                      >
                        {r.total}
                      </span>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </motion.section>

            {contratadoGroups.length > 0 && (
              <motion.section
                className="candidate-report-modal__contratados"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                aria-label="Contratados por puesto"
              >
                <h3 className="candidate-report-modal__section-title">
                  Contratados ({totalContratados})
                  {scope === 'week' && (
                    <span className="candidate-report-modal__section-note"> · sem {weekLabel}</span>
                  )}
                </h3>
                {contratadoGroups.map((group) => (
                  <motion.article
                    key={group.area}
                    className="candidate-report-modal__group"
                    variants={itemVariants}
                  >
                    <header className="candidate-report-modal__group-header">
                      <h4 className="candidate-report-modal__group-title">{group.area}</h4>
                      <span className="candidate-report-modal__group-count">
                        {group.total} contratado{group.total === 1 ? '' : 's'}
                      </span>
                    </header>
                    <ul className="candidate-report-modal__rows">
                      {group.rows.map((row) => (
                        <motion.li
                          key={`${row.area}|${row.puesto}`}
                          className="candidate-report-modal__row"
                          variants={itemVariants}
                        >
                          <div className="candidate-report-modal__row-main">
                            <span className="candidate-report-modal__puesto">{row.puesto}</span>
                          </div>
                          <div className="candidate-report-modal__badges">
                            <span className="candidate-report-modal__badge candidate-report-modal__badge--hired">
                              {row.count}
                            </span>
                          </div>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.article>
                ))}
              </motion.section>
            )}

            <motion.section
              className="candidate-report-modal__preview"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              aria-label="Vista previa del mensaje"
            >
              <h4 className="candidate-report-modal__preview-title">
                Mensaje para WhatsApp
              </h4>
              <pre className="candidate-report-modal__preview-text">{message}</pre>
            </motion.section>
          </>
        )}
      </div>

      <footer className="modal-footer candidate-report-modal__footer">
        <button
          type="button"
          className="btn-secondary candidate-report-modal__action"
          onClick={handleCopy}
          disabled={empty}
        >
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span
                key="copied"
                className="candidate-report-modal__action-inner"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <Check size={16} aria-hidden="true" />
                Copiado
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                className="candidate-report-modal__action-inner"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <Copy size={16} aria-hidden="true" />
                Copiar texto
              </motion.span>
            )}
          </AnimatePresence>
        </button>
        <motion.button
          type="button"
          className="btn-primary candidate-report-modal__action candidate-report-modal__action--whatsapp"
          onClick={handleShareWhatsapp}
          disabled={empty}
          whileHover={{ scale: empty ? 1 : 1.02 }}
          whileTap={{ scale: empty ? 1 : 0.97 }}
        >
          <Share2 size={16} aria-hidden="true" />
          Enviar por WhatsApp
        </motion.button>
      </footer>
    </Modal>
  );
}

