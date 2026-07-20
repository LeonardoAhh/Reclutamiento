import { useEffect, useMemo, useState } from 'react';
import { Copy, Check, Share2, Users } from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Modal } from './Modal';
import { ExpandableSection } from './ExpandableSection';
import { formatShortDate } from '@/lib/dates';
import { RECLUTADORES_ACTIVOS } from '@/lib/constants';
import { normalizeString } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { Candidate, CandidateStatus } from '@/lib/types';
import './CandidateReportModal.css';

interface CandidateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: Candidate[];
}

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
  starlite: number;
}

interface AreaGroup {
  area: string;
  rows: PuestoRow[];
  total: number;
  starlite: number;
}

interface RecruiterRow {
  name: string;
  e1: number;
  e2: number;
  fd: number;
  fp: number;
  total: number;
  starlite: number;
}

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
        starlite: 0,
      };
      rowMap.set(key, row);
    }
    if (c.status === 'entrevista') row.e1 += 1;
    else if (c.status === 'entrega_documentos') row.e2 += 1;
    else if (c.status === 'faltan_documentos') row.fd += 1;
    else if (c.status === 'feedback_pendiente') row.fp += 1;
    row.total += 1;
    if (c.is_starlite) row.starlite += 1;
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
      group = { area: row.area, rows: [], total: 0, starlite: 0 };
      map.set(row.area, group);
    }
    group.rows.push(row);
    group.total += row.total;
    group.starlite += row.starlite;
  }
  return Array.from(map.values()).sort((a, b) => a.area.localeCompare(b.area, 'es'));
}

function buildRecruiterRows(active: Candidate[]): RecruiterRow[] {
  const empty = (name: string): RecruiterRow => ({ name, e1: 0, e2: 0, fd: 0, fp: 0, total: 0, starlite: 0 });
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
    if (c.is_starlite) bucket.starlite += 1;
  }

  return Array.from(acc.values()).filter(
    (r) => r.name !== SIN_ASIGNAR || r.total > 0,
  );
}

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/(?:^|\s|-|\/)\w/g, m => m.toUpperCase());
}

function buildWhatsappMessageBlock(
  title: string,
  candidates: Candidate[],
  showRecruiters: boolean
): string {
  if (candidates.length === 0) return '';
  const groups = buildPuestoGroups(candidates);
  const recruiters = buildRecruiterRows(candidates);
  const totalActivos = candidates.length;

  const lines: string[] = [
    title,
    `Activos: ${totalActivos} · Puestos: ${groups.reduce((s, g) => s + g.rows.length, 0)}${showRecruiters ? ` · Reclutadores: ${recruiters.filter((r) => r.total > 0).length}` : ''}`,
    '',
  ];

  for (const g of groups) {
    lines.push(`*${g.area}* — ${g.total} candidatos`);
    const puestosMap = new Map<string, typeof g.rows>();
    for (const r of g.rows) {
      if (!puestosMap.has(r.puesto)) puestosMap.set(r.puesto, []);
      puestosMap.get(r.puesto)!.push(r);
    }

    for (const [puesto, filas] of puestosMap.entries()) {
      lines.push(`• ${toTitleCase(puesto)}`);
      for (const r of filas) {
        let cleanSeccion = r.seccion;
        if (cleanSeccion.toUpperCase().startsWith(g.area.toUpperCase())) {
          cleanSeccion = cleanSeccion.substring(g.area.length).trim();
          if (cleanSeccion.startsWith('-') || cleanSeccion.startsWith('—')) {
            cleanSeccion = cleanSeccion.substring(1).trim();
          }
        }

        // Construir el label preservando toda la información:
        //   · Sin sección → sólo turno (o "General").
        //   · Sección sin turno → agregar el turno entre paréntesis.
        //   · Sección que YA contiene el turno → usar la sección completa
        //     (evita que la lógica anterior descarte "Calidad" de
        //     "Calidad 1er. Turno").
        let seccionLabel: string;
        if (!cleanSeccion) {
          seccionLabel = r.turno || 'General';
        } else if (r.turno && !cleanSeccion.toUpperCase().includes(r.turno.toUpperCase())) {
          seccionLabel = `${cleanSeccion} (${r.turno})`;
        } else {
          seccionLabel = cleanSeccion;
        }

        seccionLabel = toTitleCase(seccionLabel);

        const detalle: string[] = [];
        if (r.e1 > 0) detalle.push(`Entrevista: ${r.e1}`);
        if (r.e2 > 0) detalle.push(`Entrega de documentos: ${r.e2}`);
        if (r.fd > 0) detalle.push(`Faltan documentos: ${r.fd}`);
        if (r.fp > 0) detalle.push(`Feedback pendiente: ${r.fp}`);

        lines.push(`   - ${seccionLabel}: ${r.total} activos (${detalle.join(' · ')})`);
      }
    }
    lines.push('');
  }

  if (showRecruiters) {
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
      lines.push('');
    }
  }

  return lines.join('\n').trim();
}

function buildWhatsappMessage(active: Candidate[]): string {
  const fecha = formatShortDate(new Date().toISOString());

  const generales = active.filter(c => !c.is_starlite);
  const starlite = active.filter(c => c.is_starlite);

  const blocks: string[] = [];

  if (generales.length > 0) {
    blocks.push(buildWhatsappMessageBlock(`*Resumen de Candidatos Generales* — ${fecha}`, generales, true));
  }

  if (starlite.length > 0) {
    blocks.push(buildWhatsappMessageBlock(`*Resumen Proyecto Starlite*${generales.length === 0 ? ` — ${fecha}` : ''}`, starlite, false));
  }

  if (blocks.length === 0) {
    return `*Resumen de Candidatos* — ${fecha}\n\nSin candidatos activos.`;
  }

  return blocks.join('\n\n-----------------------------------\n\n');
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
  const isMobile = useIsMobile();
  const active = useMemo(
    () => candidates.filter((c) => ACTIVE_STATUSES.has(c.status)),
    [candidates],
  );
  const groups = useMemo(() => buildPuestoGroups(active), [active]);
  const recruiters = useMemo(() => buildRecruiterRows(active), [active]);

  const totalActivos = active.length;
  const totalStarlite = groups.reduce((sum, g) => sum + g.starlite, 0);
  const totalPuestos = groups.reduce((sum, g) => sum + g.rows.length, 0);
  const reclutadoresActivos = recruiters.filter((r) => r.total > 0).length;
  const message = useMemo(
    () => buildWhatsappMessage(active),
    [active],
  );

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(id);
  }, [copied]);

  useEffect(() => {
    if (!isOpen) setCopied(false);
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

  const renderGroupContent = (group: AreaGroup) => (
    <ul className="candidate-report-modal__rows">
      {group.rows.map((row) => (
        <li
          key={`${row.area}|${row.seccion}|${row.puesto}`}
          className="candidate-report-modal__row"
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
            {row.starlite > 0 && (
              <span className="candidate-report-modal__badge candidate-report-modal__badge--starlite">
                ★ {row.starlite}
              </span>
            )}
            <span className="candidate-report-modal__badge candidate-report-modal__badge--total">
              {row.total}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="candidate-report-modal"
      icon={<Users size={20} aria-hidden="true" />}
      title="Resumen de candidatos"
      size={isMobile ? 'md' : 'lg'}
      fullscreenMobile={true}
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
          {totalStarlite > 0 && (
            <div className="candidate-report-modal__stat">
              <div className="candidate-report-modal__big-number" style={{ color: '#d97706' }}>
                {totalStarlite}
              </div>
              <p className="candidate-report-modal__big-label">
                starlite
              </p>
            </div>
          )}
          <div className="candidate-report-modal__stat">
            <div className="candidate-report-modal__big-number candidate-report-modal__big-number--alt">
              {totalPuestos}
            </div>
            <p className="candidate-report-modal__big-label">
              puesto{totalPuestos === 1 ? '' : 's'}
            </p>
          </div>
          {!isMobile && (
            <div className="candidate-report-modal__stat">
              <div className="candidate-report-modal__big-number candidate-report-modal__big-number--muted">
                {reclutadoresActivos}
              </div>
              <p className="candidate-report-modal__big-label">
                reclutador{reclutadoresActivos === 1 ? '' : 'es'}
              </p>
            </div>
          )}
        </motion.header>

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
            {isMobile ? (
              <>
                <section
                  className="candidate-report-modal__groups candidate-report-modal__groups--mobile"
                  aria-label="Candidatos agrupados por puesto"
                >
                  <h3 className="candidate-report-modal__section-title">Por puesto</h3>
                  {groups.map((group) => (
                    <ExpandableSection
                      key={group.area}
                      title={group.area}
                      badge={`${group.total} candidatos`}
                      variant="list"
                    >
                      {renderGroupContent(group)}
                    </ExpandableSection>
                  ))}
                </section>

                <section
                  className="candidate-report-modal__recruiters candidate-report-modal__recruiters--mobile"
                  aria-label="Conteo por reclutador"
                >
                  <h3 className="candidate-report-modal__section-title">Por reclutador</h3>
                  {recruiters.filter((r) => r.total > 0).map((r) => (
                    <ExpandableSection
                      key={r.name}
                      title={r.name}
                      badge={`${r.total} activos`}
                      variant="list"
                    >
                      <div className="candidate-report-modal__recruiter-detail">
                        {r.e1 > 0 && <p>Entrevista: {r.e1}</p>}
                        {r.e2 > 0 && <p>Entrega de documentos: {r.e2}</p>}
                        {r.fd > 0 && <p>Faltan documentos: {r.fd}</p>}
                        {r.fp > 0 && <p>Feedback pendiente: {r.fp}</p>}
                      </div>
                    </ExpandableSection>
                  ))}
                </section>
              </>
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
                      {renderGroupContent(group)}
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
                              r.total === 0 ? 'candidate-report-modal__badge--total-muted' : ''
                            }`}
                          >
                            {r.total}
                          </span>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                </motion.section>

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
                {isMobile ? 'Copiar' : 'Copiar texto'}
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
          {isMobile ? 'WhatsApp' : 'Enviar por WhatsApp'}
        </motion.button>
      </footer>
    </Modal>
  );
}
