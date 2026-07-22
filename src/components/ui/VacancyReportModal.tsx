import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Copy, Check, Share2 } from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Modal } from './Modal';
import { ExpandableSection } from './ExpandableSection';
import { formatShortDate } from '@/lib/dates';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useDismissedPositions } from '@/hooks/useDismissedPositions';
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
  starliteUrgentes: number;
  starliteEmpleados: number;
}

interface AreaGroup {
  area: string;
  rows: VacancyRow[];
  totalVacantes: number;
  totalBackup: number;
  totalProximosIngresos: number;
  totalStarliteUrgentes: number;
  totalStarliteEmpleados: number;
}

function extractTurno(seccion: string): string {
  const match = seccion.match(
    /\b(?:1ER|1RA|2DO|2DA|3ER|3RA|4TO|4TA|[1-9]O|[1-9]A|NOCTURNO|DIURNO|MATUTINO|VESPERTINO)\.?\s*TURNO\b/i,
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
    .filter((p) => p.vacantes > 0 || p.proximos_ingresos > 0 || p.urgentes > 0)
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
        starliteUrgentes: p.urgentes || 0,
        starliteEmpleados: p.starlite_empleados || 0,
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
      group = { area: row.area, rows: [], totalVacantes: 0, totalBackup: 0, totalProximosIngresos: 0, totalStarliteUrgentes: 0, totalStarliteEmpleados: 0 };
      map.set(row.area, group);
    }
    group.rows.push(row);
    group.totalVacantes += row.vacantesAutorizada;
    group.totalBackup += row.vacantesBackup;
    group.totalProximosIngresos += row.proximosIngresos;
    group.totalStarliteUrgentes += row.starliteUrgentes;
    group.totalStarliteEmpleados += row.starliteEmpleados;
  }
  return Array.from(map.values()).sort((a, b) => a.area.localeCompare(b.area, 'es'));
}

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/(?:^|\s|-|\/)\w/g, m => m.toUpperCase());
}

function buildWhatsappMessageBlock(
  title: string,
  groups: AreaGroup[],
  type: 'general' | 'starlite',
  excludeKeys?: ReadonlySet<string>
): string {
  const filteredGroups = groups.map(g => ({
    ...g,
    rows: g.rows.filter(r => {
      if (excludeKeys?.has(`${r.area}|${r.seccion}|${r.puesto}`)) return false;
      return type === 'general'
        ? (r.vacantesAutorizada > 0 || r.vacantesBackup > 0 || r.proximosIngresos > 0)
        : (r.starliteUrgentes > 0);
    })
  })).filter(g => g.rows.length > 0);

  if (filteredGroups.length === 0) return '';

  const totalActivas = filteredGroups.reduce((sum, g) => sum + g.rows.reduce((s, r) => s + r.vacantesAutorizada, 0), 0);
  const totalBackup = filteredGroups.reduce((sum, g) => sum + g.rows.reduce((s, r) => s + r.vacantesBackup, 0), 0);
  const totalProximos = filteredGroups.reduce((sum, g) => sum + g.rows.reduce((s, r) => s + r.proximosIngresos, 0), 0);
  const totalStarliteUrgentes = filteredGroups.reduce((sum, g) => sum + g.rows.reduce((s, r) => s + r.starliteUrgentes, 0), 0);
  const totalStarliteEmpleados = filteredGroups.reduce((sum, g) => sum + g.rows.reduce((s, r) => s + r.starliteEmpleados, 0), 0);
  
  const totalVacantes = totalActivas + totalBackup;
  const vacantesNetas = filteredGroups.reduce((sum, g) => sum + g.rows.reduce((s, r) => s + Math.max(0, r.totalVacantes - r.proximosIngresos), 0), 0);
  const ingresosAsignados = filteredGroups.reduce((sum, g) => sum + g.rows.reduce((s, r) => s + Math.min(r.totalVacantes, r.proximosIngresos), 0), 0);
  const ingresosExtra = totalProximos - ingresosAsignados;

  const lines: string[] = [ title, '' ];

  lines.push(`Total vacantes: ${totalVacantes} (activas: ${totalActivas} · backup: ${totalBackup})`);
  const proximosText = ingresosExtra > 0
    ? `Próximos ingresos: ${totalProximos} (${ingresosAsignados} cubren vacante · ${ingresosExtra} exceden su puesto)`
    : `Próximos ingresos: ${totalProximos}`;
  lines.push(proximosText);
  lines.push(`*Balance estimado: ${vacantesNetas} vacantes por cubrir*`);
  
  if (type === 'starlite') {
    lines.push(`*Meta Starlite: ${totalStarliteEmpleados} contratados / ${totalStarliteUrgentes}*`);
  }
  
  lines.push('');

  for (const g of filteredGroups) {
    lines.push(`*${g.area}*`);
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
        let ingresosDisponibles = r.proximosIngresos;
        
        if (r.vacantesAutorizada > 0) {
          const cubiertas = Math.min(ingresosDisponibles, r.vacantesAutorizada);
          ingresosDisponibles -= cubiertas;
          detalle.push(`Activas (${cubiertas}/${r.vacantesAutorizada})`);
        }
        
        if (r.vacantesBackup > 0) {
          const cubiertas = Math.min(ingresosDisponibles, r.vacantesBackup);
          ingresosDisponibles -= cubiertas;
          detalle.push(`Backup (${cubiertas}/${r.vacantesBackup})`);
        }
        
        if (ingresosDisponibles > 0) {
          detalle.push(`+${ingresosDisponibles} ingresos extra`);
        }

        if (type === 'starlite') {
          detalle.push(`★ Starlite (${r.starliteEmpleados}/${r.starliteUrgentes})`);
        }

        const faltan = Math.max(0, r.totalVacantes - r.proximosIngresos);
        const balanceStr = faltan > 0 ? ` ➔ Faltan ${faltan}` : (r.totalVacantes > 0 ? ` ➔ Cubierto` : '');
        lines.push(`   - ${seccionLabel}: ${detalle.join(' · ')}${balanceStr}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n').trim();
}

function buildWhatsappMessage(allGroups: AreaGroup[], dismissedKeys: Set<string>): string {
  const groups = allGroups.map(g => ({
    ...g,
    rows: g.rows.filter(r => !dismissedKeys.has(`${r.area}|${r.seccion}|${r.puesto}`))
  })).filter(g => g.rows.length > 0);

  const fecha = formatShortDate(new Date().toISOString());

  const starliteKeys = new Set<string>();
  for (const g of groups) {
    for (const r of g.rows) {
      if (r.starliteUrgentes > 0) {
        starliteKeys.add(`${r.area}|${r.seccion}|${r.puesto}`);
      }
    }
  }

  const blocks: string[] = [];
  const generales = buildWhatsappMessageBlock(
    `*Resumen de Vacantes Generales* — ${fecha}`, 
    groups, 
    'general',
    starliteKeys
  );
  if (generales) blocks.push(generales);

  const starlite = buildWhatsappMessageBlock(
    `*Resumen Proyecto Starlite*${!generales ? ` — ${fecha}` : ''}`,
    groups,
    'starlite'
  );
  if (starlite) blocks.push(starlite);

  if (blocks.length === 0) {
    return `*Resumen de Vacantes* — ${fecha}\n\nSin vacantes pendientes.`;
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

export function VacancyReportModal({
  isOpen,
  onClose,
  positions,
}: VacancyReportModalProps) {
  const isMobile = useIsMobile();
  const groups = useMemo(() => buildGroups(positions), [positions]);
  const { dismissedKeys, toggleDismiss } = useDismissedPositions();

  const {
    totalActivas,
    totalBackup,
    totalProximos,
    totalStarliteUrgentes,
    totalStarliteEmpleados,
    totalPuestos
  } = useMemo(() => {
    let activas = 0;
    let backup = 0;
    let proximos = 0;
    let starliteUrgentes = 0;
    let starliteEmpleados = 0;
    let puestos = 0;

    for (const g of groups) {
      for (const r of g.rows) {
        if (!dismissedKeys.has(`${r.area}|${r.seccion}|${r.puesto}`)) {
          activas += r.vacantesAutorizada;
          backup += r.vacantesBackup;
          proximos += r.proximosIngresos;
          starliteUrgentes += r.starliteUrgentes;
          starliteEmpleados += r.starliteEmpleados;
          puestos += 1;
        }
      }
    }
    return {
      totalActivas: activas,
      totalBackup: backup,
      totalProximos: proximos,
      totalStarliteUrgentes: starliteUrgentes,
      totalStarliteEmpleados: starliteEmpleados,
      totalPuestos: puestos
    };
  }, [groups, dismissedKeys]);

  const message = useMemo(() => buildWhatsappMessage(groups, dismissedKeys), [groups, dismissedKeys]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(id);
  }, [copied]);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
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

  const empty = groups.length === 0;

  const renderGroupContent = (group: AreaGroup) => (
    <ul className="vacancy-report-modal__rows">
      {group.rows.map((row) => (
        <li
          key={`${row.area}|${row.seccion}|${row.puesto}`}
          className={`vacancy-report-modal__row ${dismissedKeys.has(`${row.area}|${row.seccion}|${row.puesto}`) ? 'vacancy-report-modal__row--dismissed' : ''}`}
          onClick={() => toggleDismiss(`${row.area}|${row.seccion}|${row.puesto}`)}
          style={{ cursor: 'pointer' }}
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
          <div className="vacancy-report-modal__badges" style={{ gap: '6px' }}>
            {row.starliteUrgentes > 0 && (
              <span style={{ color: '#d97706', fontWeight: 600, fontSize: '0.8125rem' }}>
                ★ STARLITE {row.starliteEmpleados || 0}/{row.starliteUrgentes}
              </span>
            )}
            {row.vacantesAutorizada > 0 && (
              <span style={{ color: '#e11d48', fontWeight: 600, fontSize: '0.8125rem' }}>
                {row.vacantesAutorizada} activa{row.vacantesAutorizada === 1 ? '' : 's'}
              </span>
            )}
            {row.vacantesBackup > 0 && (
              <span style={{ color: '#ea580c', fontWeight: 600, fontSize: '0.8125rem' }}>
                {row.vacantesBackup} backup
              </span>
            )}
            {row.proximosIngresos > 0 && (
              <span style={{ color: '#059669', fontWeight: 600, fontSize: '0.8125rem' }}>
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
          {totalStarliteUrgentes > 0 && (
            <div className="vacancy-report-modal__stat">
              <div className="vacancy-report-modal__big-number" style={{ color: '#d97706' }}>
                {totalStarliteEmpleados}/{totalStarliteUrgentes}
              </div>
              <p className="vacancy-report-modal__big-label">
                Starlite
              </p>
            </div>
          )}
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
                    badge={`${group.totalStarliteUrgentes > 0 ? `★ ${group.totalStarliteEmpleados}/${group.totalStarliteUrgentes} · ` : ''}${group.totalVacantes + group.totalBackup} total`}
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
                        {group.totalStarliteUrgentes > 0 && `★ Starlite ${group.totalStarliteEmpleados}/${group.totalStarliteUrgentes} · `}
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
