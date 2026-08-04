import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Share2 } from 'lucide-react';
import { Check, Copy } from 'lucide';
import { motion, type Variants } from 'framer-motion';
import { Modal } from './Modal';
import { MorphingIcon } from './MorphingIcon';
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
  vacantesStarlite: number;
  totalVacantes: number;
  proximosIngresos: number;
  starliteProximos: number;
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

function buildGroups(positions: PositionCoverage[]): AreaGroup[] {
  const pendientes = positions
    .filter((p) => p.vacantes > 0 || p.proximos_ingresos > 0 || p.urgentes > 0)
    .map<VacancyRow>((p) => {
      return {
        area: p.area,
        seccion: p.seccion,
        turno: extractTurno(p.seccion),
        puesto: p.puesto,
        vacantesAutorizada: p.vacantes_plantilla,
        vacantesBackup: p.vacantes_backup,
        vacantesStarlite: p.vacantes_starlite,
        totalVacantes: p.vacantes,
        proximosIngresos: p.proximos_ingresos,
        starliteProximos: p.starlite_proximos || 0,
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
  type: 'general' | 'starlite'
): string {
  const filteredGroups = groups.map(g => ({
    ...g,
    rows: g.rows.filter(r => {
      return type === 'general'
        ? (r.vacantesAutorizada > 0 || r.vacantesBackup > 0 || (r.proximosIngresos - r.starliteProximos) > 0)
        : (r.starliteUrgentes > 0);
    })
  })).filter(g => g.rows.length > 0);

  if (filteredGroups.length === 0) return '';

  const totalActivas = filteredGroups.reduce((sum, g) => sum + g.rows.reduce((s, r) => s + r.vacantesAutorizada, 0), 0);
  const totalBackup = filteredGroups.reduce((sum, g) => sum + g.rows.reduce((s, r) => s + r.vacantesBackup, 0), 0);
  const totalProximos = filteredGroups.reduce((sum, g) => sum + g.rows.reduce((s, r) => s + (type === 'general' ? (r.proximosIngresos - r.starliteProximos) : r.starliteProximos), 0), 0);
  const totalStarliteUrgentes = filteredGroups.reduce((sum, g) => sum + g.rows.reduce((s, r) => s + r.starliteUrgentes, 0), 0);
  const totalStarliteEmpleados = filteredGroups.reduce((sum, g) => sum + g.rows.reduce((s, r) => s + r.starliteEmpleados, 0), 0);
  
  const totalVacantes = type === 'general' ? totalActivas + totalBackup : filteredGroups.reduce((sum, g) => sum + g.rows.reduce((s, r) => s + r.vacantesStarlite, 0), 0);
  
  const vacantesNetas = filteredGroups.reduce((sum, g) => sum + g.rows.reduce((s, r) => {
    const req = type === 'general' ? r.vacantesAutorizada + r.vacantesBackup : r.starliteUrgentes - r.starliteEmpleados;
    const prox = type === 'general' ? r.proximosIngresos - r.starliteProximos : r.starliteProximos;
    return s + Math.max(0, req - prox);
  }, 0), 0);
  
  const lines: string[] = [ title, '' ];

  if (type === 'general') {
    lines.push(`Total: ${totalVacantes} (${totalActivas} activas · ${totalBackup} backup)`);
    lines.push(`Ingresos: ${totalProximos}`);
    lines.push(`Balance: Faltan ${vacantesNetas} por cubrir`);
  } else {
    lines.push(`Avance: ${totalStarliteEmpleados}/${totalStarliteUrgentes} contratados`);
    const ingMsg = totalProximos > 1 ? ` (${totalProximos} ingresos programados)` : totalProximos === 1 ? ` (1 ingreso programado)` : '';
    lines.push(`Balance: Faltan ${vacantesNetas} por cubrir${ingMsg}`);
  }
  
  lines.push('');

  for (const g of filteredGroups) {
    if (type === 'general') {
      lines.push(`*${g.area.toUpperCase()}*`);
    }

    const puestosMap = new Map<string, typeof g.rows>();
    for (const r of g.rows) {
      if (!puestosMap.has(r.puesto)) puestosMap.set(r.puesto, []);
      puestosMap.get(r.puesto)!.push(r);
    }

    for (const [puesto, filas] of puestosMap.entries()) {
      for (const r of filas) {
        let cleanSeccion = r.seccion;
        if (cleanSeccion.toUpperCase().startsWith(g.area.toUpperCase())) {
          cleanSeccion = cleanSeccion.substring(g.area.length).trim();
          if (cleanSeccion.startsWith('-') || cleanSeccion.startsWith('—')) {
            cleanSeccion = cleanSeccion.substring(1).trim();
          }
        }

        let seccionLabel = cleanSeccion || r.turno || '';
        const normalizeForMatch = (s: string) => s.toUpperCase().replace(/[\.\s]/g, '');
        if (r.turno && cleanSeccion && !normalizeForMatch(cleanSeccion).includes(normalizeForMatch(r.turno))) {
          seccionLabel = `${cleanSeccion} (${r.turno})`;
        }
        seccionLabel = toTitleCase(seccionLabel);
        
        const puestoName = toTitleCase(puesto);
        const namePart = seccionLabel ? `${puestoName} - ${seccionLabel}` : puestoName;

        let ingresosDisponibles = type === 'general' ? r.proximosIngresos - r.starliteProximos : r.starliteProximos;
        
        let faltanTexto = '';
        if (type === 'general') {
            const reqTotal = r.vacantesAutorizada + r.vacantesBackup;
            if (reqTotal > 0) {
               const faltan = Math.max(0, reqTotal - ingresosDisponibles);
               if (faltan > 0) {
                   if (r.vacantesAutorizada === 0) {
                       faltanTexto = faltan === 1 ? `Falta 1 backup` : `Faltan ${faltan} backup`;
                   } else if (r.vacantesBackup === 0) {
                       faltanTexto = faltan === 1 ? `Falta 1 activa` : `Faltan ${faltan} activas`;
                   } else {
                       faltanTexto = `Faltan ${faltan}`;
                   }
               } else {
                   faltanTexto = `Cubierto`;
               }
            } else if (ingresosDisponibles > 0) {
               faltanTexto = ingresosDisponibles === 1 ? `1 ingreso extra` : `${ingresosDisponibles} ingresos extra`;
            }
        } else {
            const faltan = Math.max(0, r.starliteUrgentes - r.starliteEmpleados - ingresosDisponibles);
            if (faltan > 0) {
                faltanTexto = `Faltan ${faltan}`;
            } else if (ingresosDisponibles > 0) {
                faltanTexto = ingresosDisponibles === 1 ? `1 ingreso extra` : `${ingresosDisponibles} ingresos extra`;
            } else {
                faltanTexto = `Cubierto`;
            }
        }

        lines.push(`${namePart}: ${faltanTexto}`);
      }
    }
    
    if (type === 'general') {
       lines.push('');
    }
  }

  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }

  return lines.join('\n').trim();
}

function buildWhatsappMessage(allGroups: AreaGroup[], dismissedKeys: Set<string>): string {
  const groups = allGroups.map(g => ({
    ...g,
    rows: g.rows.filter(r => !dismissedKeys.has(`${r.area}|${r.seccion}|${r.puesto}`))
  })).filter(g => g.rows.length > 0);

  const fecha = formatShortDate(new Date().toISOString());

  const blocks: string[] = [];
  const generales = buildWhatsappMessageBlock(
    `*Resumen de Vacantes* — ${fecha}`, 
    groups, 
    'general'
  );
  if (generales) blocks.push(generales);

  const starlite = buildWhatsappMessageBlock(
    `*★ PROYECTO STARLITE*`,
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
              {row.turno && !row.seccion.toUpperCase().replace(/[.\s]/g, '').includes(row.turno.toUpperCase().replace(/[.\s]/g, '')) && (
                <> · {row.turno}</>
              )}
            </span>
          </div>
          <div className="vacancy-report-modal__badges" style={{ gap: '6px' }}>
            {row.starliteUrgentes > 0 && (
              <span
                className="vacancy-report-modal__badge"
                style={
                  row.vacantesStarlite === 0
                    ? {
                        color: 'var(--color-success)',
                        backgroundColor: 'color-mix(in srgb, var(--color-success) 12%, var(--color-canvas))',
                      }
                    : {
                        color: 'var(--color-accent-orange)',
                        backgroundColor: 'color-mix(in srgb, var(--color-accent-orange) 12%, var(--color-canvas))',
                      }
                }
              >
                <span style={{ marginRight: '4px' }}>★</span>
                STARLITE {row.starliteEmpleados || 0}/{row.starliteUrgentes}
                {row.vacantesStarlite === 0 ? ' (Cubierto)' : ''}
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
              <div className="vacancy-report-modal__big-number" style={{ color: totalStarliteEmpleados >= totalStarliteUrgentes ? 'var(--color-success)' : '#d97706' }}>
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
          <span className="vacancy-report-modal__action-inner">
            <MorphingIcon icon={copied ? Check : Copy} size={16} />
            {copied ? 'Copiado' : isMobile ? 'Copiar' : 'Copiar texto'}
          </span>
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
