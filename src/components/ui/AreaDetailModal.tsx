import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  HeartPulse,
  MessageSquare,
  Shield,
} from 'lucide-react';
import { Modal } from './Modal';
import { Badge } from './Badge';
import { CoverageBar } from './CoverageBar';
import { Tooltip } from './Tooltip';
import { useIsMobile } from '@/hooks/useIsMobile';
import { COMMENT_TYPE_LABELS } from '@/lib/constants';
import { normalizePuesto } from '@/lib/bajas';
import { getCoverageColor } from '@/lib/utils';
import type {
  Candidate,
  CandidateStatus,
  DepartmentCoverage,
  PositionComment,
} from '@/lib/types';
import './AreaDetailModal.css';

/**
 * Status que cuentan como "candidato activo" para mostrar el badge de
 * EN PROCESO en el detalle de área. Se excluyen los estados terminales
 * `contratado` y `rechazado`: el primero ya se reflejó como ingreso, el
 * segundo no aporta progreso al puesto.
 */
const ACTIVE_CANDIDATE_STATUSES: ReadonlySet<CandidateStatus> = new Set<CandidateStatus>([
  'entrevista',
  'entrega_documentos',
  'faltan_documentos',
  'feedback_pendiente',
]);

interface AreaDetailModalProps {
  isOpen: boolean;
  dept: DepartmentCoverage | null;
  comments: PositionComment[];
  /**
   * Pipeline completo (todas las áreas). Se filtra internamente al área
   * abierta y se cuentan los candidatos activos por (puesto normalizado +
   * sección) para mostrar el badge "EN PROCESO (N)" en el row.
   */
  candidates?: Candidate[];
  onClose: () => void;
  onOpenComment: (area: string, seccion: string, puesto: string) => void;
  getCoverageBadge: (pct: number) => 'success' | 'teal' | 'amber' | 'error';
  /** Mapa sección -> # empleados en incapacidad dentro del área activa. */
  incapacidadPorSeccion?: Map<string, number> | null;
  /** Total de empleados en incapacidad para el área activa. */
  incapacidadAreaTotal?: number;
}

const ALL_TAB = '__all__';

export function AreaDetailModal({
  isOpen,
  dept,
  comments,
  candidates = [],
  onClose,
  onOpenComment,
  getCoverageBadge,
  incapacidadPorSeccion = null,
  incapacidadAreaTotal = 0,
}: AreaDetailModalProps) {
  const tablistRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const secciones = useMemo(() => {
    if (!dept) return [] as string[];
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const p of dept.puestos) {
      if (!seen.has(p.seccion)) {
        seen.add(p.seccion);
        ordered.push(p.seccion);
      }
    }
    return ordered;
  }, [dept]);

  const [activeTab, setActiveTab] = useState<string>(secciones[0] ?? '');

  // Cada departamento ya está dividido por secciones, así que no hay tab "Todas":
  // al abrir un área se selecciona su primera sección.
  useEffect(() => {
    if (isOpen) setActiveTab(secciones[0] ?? '');
  }, [isOpen, dept?.area, secciones]);

  const visiblePuestos = useMemo(() => {
    if (!dept) return [];
    return dept.puestos
      .filter((p) => p.seccion === activeTab)
      .slice()
      .sort((a, b) => {
        const aHasVacancies = a.vacantes > 0 ? 1 : 0;
        const bHasVacancies = b.vacantes > 0 ? 1 : 0;
        return bHasVacancies - aHasVacancies;
      });
  }, [dept, activeTab]);

  /**
   * Cuenta candidatos activos del área por (sección, puesto normalizado).
   * - `area` debe coincidir con el del depto abierto.
   * - `puesto` se compara normalizado (sin sufijo de turno A/B/C/D y sin
   *   acentos), igual que en `bajas` / `requisicion`.
   * - Si el candidato no tiene `seccion`, cuenta para TODAS las secciones
   *   del puesto en esa área (caso común: pipeline captura puesto+área
   *   pero no asigna turno hasta contratar).
   */
  const candidatesByPuesto = useMemo(() => {
    const map = new Map<string, number>();
    if (!dept) return map;
    const deptArea = (dept.area ?? '').trim();

    const incr = (seccion: string, puestoNorm: string) => {
      const key = `${seccion}\u0000${puestoNorm}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    };

    for (const c of candidates) {
      if (!ACTIVE_CANDIDATE_STATUSES.has(c.status)) continue;
      if ((c.area ?? '').trim() !== deptArea) continue;
      const puestoNorm = normalizePuesto(c.puesto);
      if (!puestoNorm) continue;
      const cSeccion = (c.seccion ?? '').trim();
      if (cSeccion) {
        incr(cSeccion, puestoNorm);
      } else {
        // Sin sección -> contribuye a todas las secciones del depto donde
        // ese puesto esté autorizado. Así, un candidato genérico para
        // OPERADOR DE ACABADOS GP-12 / CALIDAD aparece como "EN PROCESO"
        // en cada turno (1ER / 2DO / 3ER / 4TO).
        for (const p of dept.puestos) {
          if (normalizePuesto(p.puesto) === puestoNorm) {
            incr(p.seccion, puestoNorm);
          }
        }
      }
    }
    return map;
  }, [dept, candidates]);

  const seccionTotals = useMemo(() => {
    const map = new Map<
      string,
      { autorizada: number; real: number; vacantes: number; urgentes: number }
    >();
    if (!dept) return map;
    for (const p of dept.puestos) {
      const acc = map.get(p.seccion) ?? {
        autorizada: 0,
        real: 0,
        vacantes: 0,
        urgentes: 0,
      };
      acc.autorizada += p.plantilla_autorizada;
      acc.real += p.plantilla_real;
      acc.vacantes += p.vacantes;
      acc.urgentes += p.urgentes;
      map.set(p.seccion, acc);
    }
    return map;
  }, [dept]);

  function onTabKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, idx: number) {
    const tabs: HTMLButtonElement[] = Array.from(
      tablistRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? []
    );
    if (tabs.length === 0) return;
    let next = idx;
    if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    tabs[next]?.focus();
    tabs[next]?.click();
  }

  if (!dept) return null;

  const formatSeccionTabLabel = (label: string) => {
    const match = label.match(/\b(\d{1,2}(?:er|do|to|ro|ra|o|º)?\.?\s*turno)\b/i);
    if (!match) return label;
    return match[1].replace(/\./g, '').replace(/\s+/g, ' ').toUpperCase();
  };

  const sectionTabs = secciones.map((s) => ({
    id: s,
    label: s,
    displayLabel: formatSeccionTabLabel(s),
    count: dept.puestos.filter((p) => p.seccion === s).length,
    incapacidad: incapacidadPorSeccion?.get(s) ?? 0,
  }));
  const tabs = sectionTabs;

  // El resumen superior es la vista de ÁREA (totales del departamento), coherente
  // con el título del área y la barra de cobertura. Los tabs sólo filtran la lista.
  const activeTotals = {
    autorizada: dept.plantilla_autorizada,
    real: dept.plantilla_real,
    vacantes: dept.vacantes,
    urgentes: dept.urgentes,
  };

  // Vínculo accesible tab <-> panel: el panel toma su nombre del tab activo
  // por ÍNDICE (no por el texto de la sección, que trae espacios/acentos y
  // no es un id HTML válido). Con una sola sección no hay tabs, así que el
  // panel se describe con su propio heading ("Puestos").
  const activeTabIndex = tabs.findIndex((t) => t.id === activeTab);
  const activeTabDomId =
    tabs.length > 1 && activeTabIndex >= 0
      ? `area-tab-${activeTabIndex}`
      : 'area-detail-list-title';

  const useModal = !isMobile;

  type Puesto = DepartmentCoverage['puestos'][number];

  const commentsFor = (pos: Puesto) =>
    comments.filter(
      (c) => c.area === pos.area && c.seccion === pos.seccion && c.puesto === pos.puesto
    );

  /** Badge de estado del puesto (reutilizado por tabla y tarjetas móviles). */
  const renderEstado = (pos: Puesto) => {
    const posComments = commentsFor(pos);
    const latestComment = posComments[posComments.length - 1];
    const activeCount =
      candidatesByPuesto.get(`${pos.seccion}\u0000${normalizePuesto(pos.puesto)}`) ?? 0;

    if (latestComment) {
      return (
        <Badge
          variant={
            latestComment.tipo === 'proceso_activo'
              ? 'amber'
              : latestComment.tipo === 'entrevista'
                ? 'teal'
                : latestComment.tipo === 'entrega_documentos'
                  ? 'coral'
                  : 'default'
          }
        >
          {COMMENT_TYPE_LABELS[latestComment.tipo]}
        </Badge>
      );
    }
    if (pos.vacantes > 0 && activeCount > 0) {
      return (
        <div className="area-detail-modal__badge-stack">
          <Badge variant="teal">Proceso ({activeCount})</Badge>
          {pos.proximos_ingresos > 0 && (
            <Badge variant="coral">Ingreso ({pos.proximos_ingresos})</Badge>
          )}
        </div>
      );
    }
    if (pos.vacantes > 0) {
      return (
        <div className="area-detail-modal__badge-stack">
          <Badge variant="error">Sin proceso</Badge>
          {pos.proximos_ingresos > 0 && (
            <Badge variant="coral">Ingreso ({pos.proximos_ingresos})</Badge>
          )}
        </div>
      );
    }
    if (pos.proximos_ingresos > 0) {
      return <Badge variant="coral">Ingreso ({pos.proximos_ingresos})</Badge>;
    }
    return <span className="no-vacancy">—</span>;
  };

  const renderFlags = (pos: Puesto) => {
    if (pos.urgentes <= 0 && pos.excedente_critico <= 0 && pos.excedente_backup <= 0) return null;
    return (
      <div className="cell-puesto__flags">
        {pos.urgentes > 0 && (
          <Badge variant="error">
            <AlertCircle size={11} aria-hidden="true" />
            URGENTE {pos.urgentes}
          </Badge>
        )}
        {pos.excedente_critico > 0 && (
          <Badge variant="amber">+{pos.excedente_critico} excede</Badge>
        )}
        {pos.excedente_backup > 0 && (
          <Badge variant="teal">
            <Shield size={11} aria-hidden="true" />
            +{pos.excedente_backup} back-up
          </Badge>
        )}
      </div>
    );
  };

  const commentButton = (pos: Puesto) => {
    const posComments = commentsFor(pos);
    return (
      <button
        type="button"
        className="btn-icon"
        onClick={() => onOpenComment(pos.area, pos.seccion, pos.puesto)}
        title="Agregar comentario"
        aria-label={`Comentario para ${pos.puesto}`}
      >
        <MessageSquare size={16} aria-hidden="true" />
        {posComments.length > 0 && (
          <span className="btn-icon__count">{posComments.length}</span>
        )}
      </button>
    );
  };

  const coverageColor = getCoverageColor(dept.porcentaje_cobertura);

  const modalContent = (
    <>
      <section
        className="area-detail-modal__summary"
        aria-labelledby="area-detail-summary-title"
      >
        <div className="area-detail-modal__summary-heading">
          <h3 id="area-detail-summary-title">Resumen del área</h3>
        </div>

        <dl className="area-detail-modal__summary-stats">
          <div className="area-detail-modal__stat">
            <dt className="area-detail-modal__stat-label">Real / Aut.</dt>
            <dd className="area-detail-modal__stat-value">
              {activeTotals.real}
              <span className="area-detail-modal__stat-sep">/</span>
              {activeTotals.autorizada}
            </dd>
          </div>
          <div className="area-detail-modal__stat">
            <dt className="area-detail-modal__stat-label">Vacantes</dt>
            <dd className="area-detail-modal__stat-value">{activeTotals.vacantes}</dd>
          </div>
          {activeTotals.urgentes > 0 && (
            <div className="area-detail-modal__stat area-detail-modal__stat--error">
              <dt className="area-detail-modal__stat-label">Urgentes</dt>
              <dd className="area-detail-modal__stat-value">{activeTotals.urgentes}</dd>
            </div>
          )}
          {incapacidadAreaTotal > 0 && (
            <div className="area-detail-modal__stat area-detail-modal__stat--amber">
              <dt className="area-detail-modal__stat-label">
                <HeartPulse size={11} aria-hidden="true" /> Incapacidad
              </dt>
              <dd className="area-detail-modal__stat-value">{incapacidadAreaTotal}</dd>
            </div>
          )}
        </dl>

        {/* Cobertura — hero con porcentaje grande + barra. El % ya queda
            anunciado como texto arriba (showLabel=false), así que la
            barra es puramente decorativa para lectores de pantalla. */}
        <div className="area-detail-modal__coverage">
          <div className="area-detail-modal__coverage-head">
            <span
              className="area-detail-modal__coverage-pct"
              style={{ color: coverageColor }}
            >
              {dept.porcentaje_cobertura}
              <span className="area-detail-modal__coverage-pct-sign">%</span>
            </span>
            <span className="area-detail-modal__coverage-label">Cobertura del área</span>
          </div>
          <div aria-hidden="true">
            <CoverageBar
              percentage={dept.porcentaje_cobertura}
              color={coverageColor}
              height={8}
              showLabel={false}
            />
          </div>
        </div>
      </section>

      {tabs.length > 1 && (
        <div
          ref={tablistRef}
          role="tablist"
          aria-label="Secciones del área"
          className="area-detail-modal__tabs"
        >
          {tabs.map((t, idx) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                id={`area-tab-${idx}`}
                role="tab"
                type="button"
                aria-selected={isActive}
                aria-controls="area-detail-tabpanel"
                tabIndex={isActive ? 0 : -1}
                className={`area-detail-modal__tab${isActive ? ' is-active' : ''}`}
                onClick={() => setActiveTab(t.id)}
                onKeyDown={(e) => onTabKeyDown(e, idx)}
              >
                <span className="area-detail-modal__tab-label">{t.displayLabel}</span>
                <span className="area-detail-modal__tab-count" aria-hidden="true">
                  {t.count}
                </span>
                <span className="sr-only">, {t.count}</span>
                {t.incapacidad > 0 && (
                  <span
                    className="area-detail-modal__tab-incapacidad"
                    aria-label={`${t.incapacidad} en incapacidad`}
                    title={`${t.incapacidad} en incapacidad`}
                  >
                    <HeartPulse size={11} aria-hidden="true" />
                    {t.incapacidad}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <section
        id="area-detail-tabpanel"
        role="tabpanel"
        aria-labelledby={activeTabDomId}
        className="area-detail-modal__panel"
      >
        {visiblePuestos.length === 0 ? (
          <div className="area-detail-modal__empty">
            <p>No hay puestos en esta sección.</p>
          </div>
        ) : isMobile ? (
          <ul className="area-detail-modal__cards">
            {visiblePuestos.map((pos) => (
              <li
                key={`${pos.area}-${pos.seccion}-${pos.puesto}`}
                className={`area-detail-modal__card${pos.vacantes > 0 ? ' area-detail-modal__card--vac' : ''}${pos.urgentes > 0 ? ' area-detail-modal__card--urgent' : ''}`}
              >
                <div className="area-detail-modal__card-top">
                  <div className="area-detail-modal__card-id">
                    <span className="area-detail-modal__card-name">{pos.puesto}</span>
                    {activeTab === ALL_TAB && (
                      <span className="area-detail-modal__card-sec">{pos.seccion}</span>
                    )}
                  </div>
                  {commentButton(pos)}
                </div>
                {renderFlags(pos)}
                <div className="area-detail-modal__card-meta">
                  <span className="area-detail-modal__card-metric">
                    <span className="area-detail-modal__card-metric-value">
                      {pos.plantilla_real}
                      <span className="area-detail-modal__stat-sep">/</span>
                      {pos.plantilla_autorizada}
                    </span>
                    <span className="area-detail-modal__card-metric-label">Real / Aut.</span>
                  </span>
                  <span className="area-detail-modal__card-metric">
                    <span className="area-detail-modal__card-metric-value">
                      {pos.vacantes > 0 ? (
                        <span className="vacancy-count">{pos.vacantes}</span>
                      ) : (
                        <span className="no-vacancy">—</span>
                      )}
                    </span>
                    <span className="area-detail-modal__card-metric-label">Vacantes</span>
                  </span>
                  <span className="area-detail-modal__card-estado">{renderEstado(pos)}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="dept-card__table-wrapper area-detail-modal__table-wrapper">
            <table className="dept-card__table">
              <thead>
                <tr>
                  <th scope="col">Puesto</th>
                  {activeTab === ALL_TAB && <th scope="col" className="hide-on-mobile">Sección</th>}
                  <th scope="col" className="text-center hide-on-mobile">Autorizada</th>
                  <th scope="col" className="text-center hide-on-mobile">Real</th>
                  <th scope="col" className="text-center">Vacantes</th>
                  <th scope="col" className="hide-on-mobile">Cobertura</th>
                  <th scope="col" className="text-center">Estado</th>
                  <th scope="col" aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {visiblePuestos.map((pos) => {
                  const posComments = comments.filter(
                    (c) =>
                      c.area === pos.area &&
                      c.seccion === pos.seccion &&
                      c.puesto === pos.puesto
                  );
                  const latestComment = posComments[posComments.length - 1];

                  const rowClass = [
                    pos.vacantes > 0 ? 'row--has-vacancy' : '',
                    pos.urgentes > 0 ? 'row--urgent' : '',
                  ]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <tr
                      key={`${pos.area}-${pos.seccion}-${pos.puesto}`}
                      className={rowClass}
                    >
                      <td className="cell-puesto">
                        <div className="cell-puesto__inner">
                          <span className="cell-puesto__name">{pos.puesto}</span>
                          <div className="cell-puesto__flags">
                            {pos.urgentes > 0 && (
                              <Badge variant="error">
                                <AlertCircle size={11} aria-hidden="true" />
                                URGENTE {pos.urgentes}
                              </Badge>
                            )}
                            {pos.excedente_critico > 0 && (
                              <Badge variant="amber">
                                +{pos.excedente_critico} excede
                              </Badge>
                            )}
                            {pos.excedente_backup > 0 && (
                              <Badge variant="teal">
                                <Shield size={11} aria-hidden="true" />
                                +{pos.excedente_backup} back-up
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      {activeTab === ALL_TAB && (
                        <td className="cell-seccion hide-on-mobile">{pos.seccion}</td>
                      )}
                      <td className="text-center hide-on-mobile">
                        {pos.plantilla_autorizada}
                        {pos.backup > 0 && (
                          <Tooltip
                            content={
                              <div style={{ whiteSpace: 'pre-line' }}>
                                <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                                  Buffer de {pos.backup} personas
                                </div>
                                <div>{pos.notas || 'Excedentes autorizados'}</div>
                              </div>
                            }
                            side="top"
                            delayMs={200}
                          >
                            <span className="cell-backup-hint">
                              {' '}+{pos.backup}
                            </span>
                          </Tooltip>
                        )}
                      </td>
                      <td className="text-center font-strong hide-on-mobile">{pos.plantilla_real}</td>
                      <td className="text-center">
                        {pos.vacantes > 0 ? (
                          <span className="vacancy-count">{pos.vacantes}</span>
                        ) : (
                          <span className="no-vacancy">—</span>
                        )}
                      </td>
                      <td className="hide-on-mobile">
                        <CoverageBar
                          percentage={pos.porcentaje_cobertura}
                          color={getCoverageColor(pos.porcentaje_cobertura)}
                          height={6}
                        />
                      </td>
                      <td className="text-center">
                        {(() => {
                          // Cuenta de candidatos activos del row.
                          const activeCount =
                            candidatesByPuesto.get(
                              `${pos.seccion}\u0000${normalizePuesto(pos.puesto)}`
                            ) ?? 0;

                          if (latestComment) {
                            return (
                              <Badge
                                variant={
                                  latestComment.tipo === 'proceso_activo'
                                    ? 'amber'
                                    : latestComment.tipo === 'entrevista'
                                      ? 'teal'
                                      : latestComment.tipo === 'entrega_documentos'
                                        ? 'coral'
                                        : 'default'
                                }
                              >
                                {COMMENT_TYPE_LABELS[latestComment.tipo]}
                              </Badge>
                            );
                          }
                          if (pos.vacantes > 0 && activeCount > 0) {
                            // Hay vacante abierta y candidatos en pipeline activos:
                            // el puesto SÍ está en proceso aunque no haya
                            // comentario manual capturado.
                            return (
                              <div className="area-detail-modal__badge-stack">
                                <Badge variant="teal">
                                  Proceso ({activeCount})
                                </Badge>
                                {pos.proximos_ingresos > 0 && (
                                  <Badge variant="coral">
                                    Ingreso ({pos.proximos_ingresos})
                                  </Badge>
                                )}
                              </div>
                            );
                          }
                          if (pos.vacantes > 0) {
                            return (
                              <div className="area-detail-modal__badge-stack">
                                <Badge variant="error">Sin proceso</Badge>
                                {pos.proximos_ingresos > 0 && (
                                  <Badge variant="coral">
                                    Ingreso ({pos.proximos_ingresos})
                                  </Badge>
                                )}
                              </div>
                            );
                          }
                          if (pos.proximos_ingresos > 0) {
                            return (
                              <Badge variant="coral">
                                Ingreso ({pos.proximos_ingresos})
                              </Badge>
                            );
                          }
                          return <span className="no-vacancy">—</span>;
                        })()}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() =>
                            onOpenComment(pos.area, pos.seccion, pos.puesto)
                          }
                          title="Agregar comentario"
                          aria-label={`Comentario para ${pos.puesto}`}
                        >
                          <MessageSquare size={16} aria-hidden="true" />
                          {posComments.length > 0 && (
                            <span className="btn-icon__count">
                              {posComments.length}
                            </span>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );

  if (useModal) {
    return (
      <Modal
        isOpen={isOpen}
        title={dept.area}
        subtitle="Detalle por sección"
        onClose={onClose}
        className="area-detail-modal"
      >
        <div className="modal-body area-detail-modal-body">
          {modalContent}
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      title={dept.area}
      subtitle="Detalle por sección"
      onClose={onClose}
      className="area-detail-modal"
      size="xl"
      fullscreenMobile={true}
    >
      <div className="modal-body area-detail-modal-body">
        {modalContent}
      </div>
    </Modal>
  );
}