import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Copy, Check, Share2 } from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Modal } from './Modal';
import { ExpandableSection } from './ExpandableSection';
import { formatShortDate } from '@/lib/dates';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { PositionCoverage } from '@/lib/types';
import './VacancyReportModal.css';

interface VacancyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  positions: PositionCoverage[];
}

interface VacancyRow {
  area: string;
  seccion: string;
  turno: string;
  puesto: string;
  vacantesAutorizada: number;
  vacantesBackup: number;
  totalVacantes: number;
  proximosIngresos: number;
}

interface AreaGroup {
  area: string;
  rows: VacancyRow[];
  totalVacantes: number;
  totalBackup: number;
  totalProximosIngresos: number;
}

function extractTurno(seccion: string): string {
  const match = seccion.match(
    /\b(?:1ER|1RA|1ER\.|2DO|2DA|2DO\.|3ER|3RA|3ER\.|4TO|4TA|4TO\.|NOCTURNO|DIURNO|MATUTINO|VESPERTINO)\s*\.?\s*TURNO\b/i,
  );
  return match ? match[0].toUpperCase().replace(/\s+/g, ' ').trim() : '';
}

function decomposeVacancies(pos: PositionCoverage): {
  vacantesAutorizada: number;
  vacantesBackup: number;
} {
  const vacantesAutorizada = Math.max(0, pos.plantilla_autorizada - pos.plantilla_real);
  const vacantesBackup = Math.max(0, pos.vacantes - vacantesAutorizada);
  return { vacantesAutorizada, vacantesBackup };
}

function buildGroups(positions: PositionCoverage[]): AreaGroup[] {
  const pendientes = positions
    .filter((p) => p.vacantes > 0 || p.proximos_ingresos > 0)
    .map<VacancyRow>((p) => {
      const { vacantesAutorizada, vacantesBackup } = decomposeVacancies(p);
      return {
        area: p.area,
        seccion: p.seccion,
        turno: extractTurno(p.seccion),
        puesto: p.puesto,
        vacantesAutorizada,
        vacantesBackup,
        totalVacantes: p.vacantes,
        proximosIngresos: p.proximos_ingresos,
      };
    })
    .sort((a, b) => {
      if (a.area !== b.area) return a.area.localeCompare(b.area, 'es');
      if (a.seccion !== b.seccion) return a.seccion.localeCompare(b.seccion, 'es');
      return a.puesto.localeCompare(b.puesto, 'es');
    });

  const map = new Map<string, AreaGroup>();
  for (const row of pendientes) {
    let group = map.get(row.area);
    if (!group) {
      group = { area: row.area, rows: [], totalVacantes: 0, totalBackup: 0, totalProximosIngresos: 0 };
      map.set(row.area, group);
    }
    group.rows.push(row);
    group.totalVacantes += row.vacantesAutorizada;
    group.totalBackup += row.vacantesBackup;
    group.totalProximosIngresos += row.proximosIngresos;
  }
  return Array.from(map.values()).sort((a, b) => a.area.localeCompare(b.area, 'es'));
}

function buildWhatsappMessage(groups: AreaGroup[]): string {
  const fecha = formatShortDate(new Date().toISOString());
  const totalActivas = groups.reduce((sum, g) => sum + g.totalVacantes, 0);
  const totalBackup = groups.reduce((sum, g) => sum + g.totalBackup, 0);
  const totalProximos = groups.reduce((sum, g) => sum + g.totalProximosIngresos, 0);
  
  const totalVacantes = totalActivas + totalBackup;
  const vacantesNetas = groups.reduce((sum, g) => sum + g.rows.reduce((s, r) => s + Math.max(0, r.totalVacantes - r.proximosIngresos), 0), 0);

  const lines: string[] = [
    `*Resumen de Vacantes* — ${fecha}`,
    '',
    `Total vacantes: ${totalVacantes} (activas: ${totalActivas} · backup: ${totalBackup})`,
    `Próximos ingresos: ${totalProximos}`,
    `*Balance estimado: ${vacantesNetas} vacantes*`,
    '',
  ];

  for (const g of groups) {
    lines.push(`*${g.area}*`);
    for (const r of g.rows) {
      const seccionConTurno = r.turno && !r.seccion.toUpperCase().includes(r.turno)
        ? `${r.seccion} · ${r.turno}`
        : r.seccion;
      lines.push(`• ${seccionConTurno} — ${r.puesto}`);
      const detalle: string[] = [];
      if (r.vacantesAutorizada > 0) {
        detalle.push(`${r.vacantesAutorizada} activa${r.vacantesAutorizada === 1 ? '' : 's'}`);
      }
      if (r.vacantesBackup > 0) {
        detalle.push(`${r.vacantesBackup} backup`);
      }
      if (r.proximosIngresos > 0) {
        detalle.push(`${r.proximosIngresos} próx. ingreso${r.proximosIngresos === 1 ? '' : 's'}`);
      }
      lines.push(`   ${detalle.join(' · ')}`);
    }
    lines.push('');
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

export function VacancyReportModal({
  isOpen,
  onClose,
  positions,
}: VacancyReportModalProps) {
  const isMobile = useIsMobile();
  const groups = useMemo(() => buildGroups(positions), [positions]);
  const totalActivas = groups.reduce((sum, g) => sum + g.totalVacantes, 0);
  const totalBackup = groups.reduce((sum, g) => sum + g.totalBackup, 0);
  const totalProximos = groups.reduce((sum, g) => sum + g.totalProximosIngresos, 0);
  const totalPuestos = groups.reduce((sum, g) => sum + g.rows.length, 0);
  const message = useMemo(() => buildWhatsappMessage(groups), [groups]);
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

  const empty = groups.length === 0;

  const renderGroupContent = (group: AreaGroup) => (
    <ul className="vacancy-report-modal__rows">
      {group.rows.map((row) => (
        <li
          key={`${row.area}|${row.seccion}|${row.puesto}`}
          className="vacancy-report-modal__row"
        >
          <div className="vacancy-report-modal__row-main">
            <span className="vacancy-report-modal__puesto">{row.puesto}</span>
            <span className="vacancy-report-modal__seccion">
              {row.seccion}
              {row.turno && !row.seccion.toUpperCase().includes(row.turno) && (
                <> · {row.turno}</>
              )}
            </span>
          </div>
          <div className="vacancy-report-modal__badges">
            {row.vacantesAutorizada > 0 && (
              <span className="vacancy-report-modal__badge vacancy-report-modal__badge--active">
                {row.vacantesAutorizada} activa{row.vacantesAutorizada === 1 ? '' : 's'}
              </span>
            )}
            {row.vacantesBackup > 0 && (
              <span className="vacancy-report-modal__badge vacancy-report-modal__badge--backup">
                {row.vacantesBackup} backup
              </span>
            )}
            {row.proximosIngresos > 0 && (
              <span className="vacancy-report-modal__badge vacancy-report-modal__badge--proximos">
                {row.proximosIngresos} próx.
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="vacancy-report-modal"
      icon={<ClipboardList size={20} aria-hidden="true" />}
      title="Resumen de vacantes"
      subtitle="Puestos con vacantes activas o backup pendiente"
      size={isMobile ? 'md' : 'lg'}
      fullscreenMobile={true}
    >
      <div className="modal-body vacancy-report-modal__body">
        <motion.header
          className="vacancy-report-modal__summary"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <div className="vacancy-report-modal__stat">
            <div className="vacancy-report-modal__big-number">{totalActivas}</div>
            <p className="vacancy-report-modal__big-label">
              vacante{totalActivas === 1 ? '' : 's'} activa{totalActivas === 1 ? '' : 's'}
            </p>
          </div>
          <div className="vacancy-report-modal__stat">
            <div className="vacancy-report-modal__big-number vacancy-report-modal__big-number--backup">
              {totalBackup}
            </div>
            <p className="vacancy-report-modal__big-label">
              backup{totalBackup === 1 ? '' : 's'}
            </p>
          </div>
          {!isMobile && (
            <>
              <div className="vacancy-report-modal__stat">
                <div className="vacancy-report-modal__big-number vacancy-report-modal__big-number--proximos">
                  {totalProximos}
                </div>
                <p className="vacancy-report-modal__big-label">
                  próx. ingreso{totalProximos === 1 ? '' : 's'}
                </p>
              </div>
              <div className="vacancy-report-modal__stat">
                <div className="vacancy-report-modal__big-number vacancy-report-modal__big-number--muted">
                  {totalPuestos}
                </div>
                <p className="vacancy-report-modal__big-label">
                  puesto{totalPuestos === 1 ? '' : 's'}
                </p>
              </div>
            </>
          )}
        </motion.header>

        {empty ? (
          <motion.p
            className="vacancy-report-modal__empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            No hay vacantes activas ni backups pendientes. Plantilla cubierta.
          </motion.p>
        ) : (
          <>
            {isMobile ? (
              <section
                className="vacancy-report-modal__groups vacancy-report-modal__groups--mobile"
                aria-label="Detalle de puestos con vacantes"
              >
                {groups.map((group) => (
                  <ExpandableSection
                    key={group.area}
                    title={group.area}
                    badge={`${group.totalVacantes + group.totalBackup} total`}
                    variant="list"
                  >
                    {renderGroupContent(group)}
                  </ExpandableSection>
                ))}
              </section>
            ) : (
              <motion.section
                className="vacancy-report-modal__groups"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                aria-label="Detalle de puestos con vacantes"
              >
                {groups.map((group) => (
                  <motion.article
                    key={group.area}
                    className="vacancy-report-modal__group"
                    variants={itemVariants}
                  >
                    <header className="vacancy-report-modal__group-header">
                      <h3 className="vacancy-report-modal__group-title">{group.area}</h3>
                      <span className="vacancy-report-modal__group-count">
                        {group.totalVacantes} activa{group.totalVacantes === 1 ? '' : 's'}
                        {group.totalBackup > 0 && ` · ${group.totalBackup} backup`}
                        {group.totalProximosIngresos > 0 && ` · ${group.totalProximosIngresos} próx.`}
                      </span>
                    </header>
                    {renderGroupContent(group)}
                  </motion.article>
                ))}
              </motion.section>
            )}

            {!isMobile && (
              <motion.section
                className="vacancy-report-modal__preview"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                aria-label="Vista previa del mensaje"
              >
                <h4 className="vacancy-report-modal__preview-title">Mensaje para WhatsApp</h4>
                <pre className="vacancy-report-modal__preview-text">{message}</pre>
              </motion.section>
            )}
          </>
        )}
      </div>

      <footer className="modal-footer vacancy-report-modal__footer">
        <button
          type="button"
          className="btn-secondary vacancy-report-modal__action"
          onClick={handleCopy}
          disabled={empty}
        >
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span
                key="copied"
                className="vacancy-report-modal__action-inner"
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
                className="vacancy-report-modal__action-inner"
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
          className="btn-primary vacancy-report-modal__action vacancy-report-modal__action--whatsapp"
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
