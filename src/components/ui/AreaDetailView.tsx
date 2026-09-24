import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BriefcaseBusiness,
  HeartPulse,
  Star,
  UsersRound,
} from 'lucide-react';
import { Badge, StarliteBadge, AreaStatusBadge } from './Badge';
import { BackButton } from './BackButton';
import { CoverageBar } from './CoverageBar';
import { Tooltip } from './Tooltip';
import { useIsMobile } from '@/hooks/useIsMobile';
import { COMMENT_TYPE_LABELS } from '@/lib/constants';
import { normalizePuesto } from '@/lib/bajas';
import { formatPercentage, getCoverageColor } from '@/lib/utils';
import { summarizeOperationalCoverage } from '@/lib/workforceProjection';
import type { WorkforceProjection } from '@/lib/workforceProjection';
import { getStarlitePositionDisplayName } from '@/lib/positionCatalog';
import type {
  Candidate,
  CandidateStatus,
  DepartmentCoverage,
  PositionComment,
} from '@/lib/types';
import './AreaDetailView.css';

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

interface AreaDetailViewProps {
  dept: DepartmentCoverage | null;
  projection: WorkforceProjection | undefined;
  comments: PositionComment[];
  /**
   * Pipeline completo (todas las áreas). Se filtra internamente al área
   * abierta y se cuentan los candidatos activos por (puesto normalizado +
   * sección) para mostrar el badge "EN PROCESO (N)" en el row.
   */
  candidates?: Candidate[];
  onBack?: () => void;
  /** Mapa sección -> # empleados en incapacidad dentro del área activa. */
  incapacidadPorSeccion?: Map<string, number> | null;
  /** Total de empleados en incapacidad para el área activa. */
  incapacidadAreaTotal?: number;
}

export function AreaDetailView({
  dept,
  projection,
  comments,
  candidates = [],
  onBack,
  incapacidadPorSeccion = null,
  incapacidadAreaTotal = 0,
}: AreaDetailViewProps) {
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
    setActiveTab(secciones[0] ?? '');
  }, [dept?.area, secciones]);

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

    const incr = (seccion: string, puestoNorm: string, isStarlite: boolean) => {
      const key = `${seccion}\u0000${puestoNorm}\u0000${isStarlite}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    };

    for (const c of candidates) {
      if (!ACTIVE_CANDIDATE_STATUSES.has(c.status)) continue;
      if ((c.area ?? '').trim() !== deptArea) continue;
      const puestoNorm = normalizePuesto(c.puesto);
      if (!puestoNorm) continue;
      const cSeccion = (c.seccion ?? '').trim();
      const isStarlite = !!c.is_starlite;
      if (cSeccion) {
        incr(cSeccion, puestoNorm, isStarlite);
      } else {
        // Sin sección -> contribuye a todas las secciones del depto donde
        // ese puesto esté autorizado. Así, un candidato genérico para
        // OPERADOR DE ACABADOS GP-12 / CALIDAD aparece como "EN PROCESO"
        // en cada turno (1ER / 2DO / 3ER / 4TO).
        for (const p of dept.puestos) {
          if (normalizePuesto(p.puesto) === puestoNorm) {
            incr(p.seccion, puestoNorm, isStarlite);
          }
        }
      }
    }
    return map;
  }, [dept, candidates]);

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

  const sectionTabs = secciones.map((s) => {
    const puestosInSection = dept.puestos.filter((p) => p.seccion === s);
    const count = puestosInSection.reduce((acc, pos) => {
      return acc + (pos.vacantes || 0);
    }, 0);

    return {
      id: s,
      displayLabel: formatSeccionTabLabel(s),
      count: count,
      incapacidad: incapacidadPorSeccion?.get(s) ?? 0,
    };
  });
  const tabs = sectionTabs;

  // El resumen superior es la vista de ÁREA (totales del departamento), coherente
  // con el título del área y la barra de cobertura. Los tabs sólo filtran la lista.
  const activeTotals = {
    autorizada: dept.plantilla_autorizada,
    real: dept.plantilla_real,
    vacantes: dept.vacantes,
    urgentes: dept.urgentes,
  };

  // Vínculo accesible tab <-> panel por índice; evita usar como id el texto
  // dinámico de la sección, que puede contener espacios o acentos.
  const activeTabIndex = tabs.findIndex((t) => t.id === activeTab);
  const activeTabDomId =
    tabs.length > 1 && activeTabIndex >= 0
      ? `area-tab-${activeTabIndex}`
      : undefined;

  type Puesto = DepartmentCoverage['puestos'][number];

  const commentsFor = (pos: Puesto) =>
    comments.filter(
      (c) => c.area === pos.area && c.seccion === pos.seccion && c.puesto === pos.puesto
    );

  /** Badge de estado del puesto (reutilizado por tabla y tarjetas móviles). */
  const renderEstado = (pos: Puesto, isStarlite: boolean, rowVacantes: number, rowProximos: number) => {
    const posComments = commentsFor(pos);
    const latestComment = posComments[posComments.length - 1];
    const activeCount =
      candidatesByPuesto.get(`${pos.seccion}\u0000${normalizePuesto(pos.puesto)}\u0000${isStarlite}`) ?? 0;

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
    if (rowVacantes > 0 && activeCount > 0) {
      return (
        <div className="area-detail-modal__badge-stack">
          <AreaStatusBadge type="proceso" count={activeCount} />
          {rowProximos > 0 && (
            <AreaStatusBadge type="ingreso" count={rowProximos} />
          )}
        </div>
      );
    }
    if (rowVacantes > 0) {
      return (
        <div className="area-detail-modal__badge-stack">
          <AreaStatusBadge type="sin_proceso" />
          {rowProximos > 0 && (
            <AreaStatusBadge type="ingreso" count={rowProximos} />
          )}
        </div>
      );
    }
    if (rowProximos > 0) {
      return <AreaStatusBadge type="ingreso" count={rowProximos} />;
    }
    return <span className="no-vacancy">—</span>;
  };

  const currentCoverage = projection
    ? summarizeOperationalCoverage(projection.current)
    : null;
  const coveragePercentage = currentCoverage?.percentage ?? null;
  const coverageColor =
    coveragePercentage === null
      ? 'var(--color-muted)'
      : getCoverageColor(coveragePercentage);
  const coverageLabel = !projection
    ? 'No disponible'
    : coveragePercentage === null
      ? 'No aplica'
      : formatPercentage(coveragePercentage);

  return (
    <section className="area-detail-view">
      <header className="area-detail__header">
        {onBack && (
          <BackButton
            className="area-detail__back-btn"
            onClick={onBack}
            aria-label="Volver a departamentos"
          />
        )}
        <h2 className="area-detail__title">{dept.area}</h2>
      </header>

      <section
        className="area-detail-modal__summary"
        aria-labelledby="area-detail-summary-title"
      >
        <div className="area-detail-modal__summary-heading">
          <h3 id="area-detail-summary-title">Resumen del área</h3>
        </div>

        <dl className="area-detail-modal__summary-stats">
          <div className="area-detail-modal__stat">
            <dt className="area-detail-modal__stat-label">
              <UsersRound aria-hidden="true" />
              Real / Aut.
            </dt>
            <dd className="area-detail-modal__stat-value">
              {activeTotals.real}
              <span className="area-detail-modal__stat-sep">/</span>
              {activeTotals.autorizada}
            </dd>
          </div>
          <div className="area-detail-modal__stat">
            <dt className="area-detail-modal__stat-label">
              <BriefcaseBusiness aria-hidden="true" />
              Vacantes
            </dt>
            <dd className="area-detail-modal__stat-value">{activeTotals.vacantes}</dd>
          </div>
          {activeTotals.urgentes > 0 && (
            <div className="area-detail-modal__stat">
              <dt className="area-detail-modal__stat-label">
                <Star aria-hidden="true" />
                Starlite
              </dt>
              <dd className="area-detail-modal__stat-value">{activeTotals.urgentes}</dd>
            </div>
          )}
          {incapacidadAreaTotal > 0 && (
            <div className="area-detail-modal__stat area-detail-modal__stat--amber">
              <dt className="area-detail-modal__stat-label">
                <HeartPulse size="var(--icon-size-sm)" aria-hidden="true" /> Incapacidad
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
              {coverageLabel}
            </span>
            <span className="area-detail-modal__coverage-label">Cobertura del área</span>
          </div>
          {coveragePercentage !== null && (
            <div aria-hidden="true">
              <CoverageBar
                percentage={coveragePercentage}
                color={coverageColor}
                showLabel={false}
              />
            </div>
          )}
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
                <span className="sr-only">, {t.count} vacantes</span>
                {t.incapacidad > 0 && (
                  <span
                    className="area-detail-modal__tab-incapacidad"
                    aria-label={`${t.incapacidad} en incapacidad`}
                    title={`${t.incapacidad} en incapacidad`}
                  >
                    <HeartPulse size="var(--icon-size-sm)" aria-hidden="true" />
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
        aria-label={activeTabDomId ? undefined : 'Puestos'}
        className="area-detail-modal__panel"
      >
        {visiblePuestos.length === 0 ? (
          <div className="area-detail-modal__empty">
            <p>No hay puestos en esta sección.</p>
          </div>
        ) : isMobile ? (
          <ul className="area-detail-modal__cards">
            {visiblePuestos.flatMap((pos) => {
              const rows = [];
              const starliteTotal = (pos.starlite_empleados || 0) + (pos.starlite_proximos || 0);
              const starliteAut = pos.starlite_autorizada ?? pos.urgentes ?? 0;
              const starliteBackup = pos.starlite_backup ?? 0;
              
              const regularReal = pos.plantilla_real - (pos.starlite_empleados || 0);
              const regularProximos = pos.proximos_ingresos - (pos.starlite_proximos || 0);
              
              rows.push({
                isStarlite: false,
                originalPos: pos,
                displayPuesto: pos.puesto,
                showStarliteBadge: false,
                plantilla_real: regularReal,
                plantilla_autorizada: pos.plantilla_autorizada,
                vacantes: pos.vacantes_plantilla + pos.vacantes_backup,
                proximosIngresos: regularProximos,
              });

              if (starliteAut > 0 || starliteBackup > 0 || starliteTotal > 0) {
                const displayPuesto = getStarlitePositionDisplayName(pos.puesto);
                rows.push({
                  isStarlite: true,
                  originalPos: pos,
                  displayPuesto,
                  showStarliteBadge: displayPuesto === pos.puesto,
                  plantilla_real: pos.starlite_empleados || 0,
                  plantilla_autorizada: starliteAut,
                  backup: starliteBackup,
                  vacantes: pos.vacantes_starlite,
                  proximosIngresos: pos.starlite_proximos || 0,
                });
              }
              return rows;
            }).map((row) => {
              const pos = row.originalPos;
              return (
                <li
                  key={`${pos.area}-${pos.seccion}-${pos.puesto}-${row.isStarlite ? 'starlite' : 'regular'}`}
                  className="area-detail-modal__card"
                >
                  <div className="area-detail-modal__card-top">
                    <div className="area-detail-modal__card-id">
                      <span className="area-detail-modal__card-name">
                        {row.displayPuesto}
                        {row.showStarliteBadge && (
                          <span className="area-detail__starlite-badge">
                            <StarliteBadge />
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="area-detail-modal__card-meta">
                    <span className="area-detail-modal__card-metric">
                      <span className="area-detail-modal__card-metric-value">
                        {row.plantilla_real}
                        <span className="area-detail-modal__stat-sep">/</span>
                        {row.plantilla_autorizada}
                      </span>
                      <span className="area-detail-modal__card-metric-label">Real / Aut.</span>
                    </span>
                    <span className="area-detail-modal__card-metric">
                      <span className="area-detail-modal__card-metric-value">
                        {row.vacantes > 0 ? (
                          <span className="vacancy-highlight">{row.vacantes}</span>
                        ) : (
                          <span className="no-vacancy">—</span>
                        )}
                      </span>
                      <span className="area-detail-modal__card-metric-label">Vacantes</span>
                    </span>
                    <span className="area-detail-modal__card-estado">{renderEstado(pos, row.isStarlite, row.vacantes, row.proximosIngresos)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="area-detail-modal__table-wrapper">
            <table className="area-detail-modal__table">
              <caption className="sr-only">Puestos del departamento {dept.area}</caption>
              <thead>
                <tr>
                  <th scope="col">Puesto</th>
                  <th scope="col" className="text-center hide-on-mobile">Autorizada</th>
                  <th scope="col" className="text-center hide-on-mobile">Backup</th>
                  <th scope="col" className="text-center hide-on-mobile">Activos</th>
                  <th scope="col" className="text-center">Vacantes</th>
                  <th scope="col" className="hide-on-mobile">Cobertura</th>
                </tr>
              </thead>
              <tbody>
                {visiblePuestos.flatMap((pos) => {
                  const rows = [];
                  const starliteTotal = (pos.starlite_empleados || 0) + (pos.starlite_proximos || 0);
                  const starliteAut = pos.starlite_autorizada ?? pos.urgentes ?? 0;
                  const starliteBackup = pos.starlite_backup ?? 0;
                  
                  const regularReal = pos.plantilla_real - (pos.starlite_empleados || 0);
                  const regularProximos = pos.proximos_ingresos - (pos.starlite_proximos || 0);
                  const regularTotal = regularReal + regularProximos;
                  const regularObj = pos.plantilla_autorizada + pos.backup;
                  const regularCobertura = regularObj > 0 ? Math.round((regularTotal / regularObj) * 100) : 0;

                  rows.push({
                    isStarlite: false,
                    originalPos: pos,
                    displayPuesto: pos.puesto,
                    showStarliteBadge: false,
                    plantilla_real: regularReal,
                    plantilla_autorizada: pos.plantilla_autorizada,
                    vacantes: pos.vacantes_plantilla + pos.vacantes_backup,
                    porcentaje_cobertura: regularCobertura,
                    backup: pos.backup,
                  });

                  if (starliteAut > 0 || starliteBackup > 0 || starliteTotal > 0) {
                    const starliteTarget = starliteAut + starliteBackup;
                    const starliteCobertura = starliteTarget > 0 ? Math.round((starliteTotal / starliteTarget) * 100) : 0;
                    const displayPuesto = getStarlitePositionDisplayName(pos.puesto);
                    rows.push({
                      isStarlite: true,
                      originalPos: pos,
                      displayPuesto,
                      showStarliteBadge: displayPuesto === pos.puesto,
                      plantilla_real: pos.starlite_empleados || 0,
                      plantilla_autorizada: starliteAut,
                      vacantes: pos.vacantes_starlite,
                      porcentaje_cobertura: starliteCobertura,
                      backup: starliteBackup,
                    });
                  }
                  return rows;
                }).map((row) => {
                  const pos = row.originalPos;

                  return (
                    <tr
                      key={`${pos.area}-${pos.seccion}-${pos.puesto}-${row.isStarlite ? 'starlite' : 'regular'}`}
                    >
                      <td className="cell-puesto">
                        <div className="cell-puesto__inner">
                          <span className="cell-puesto__name">
                            {row.displayPuesto}
                            {row.showStarliteBadge && (
                              <span className="area-detail__starlite-badge">
                                <StarliteBadge />
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="text-center hide-on-mobile font-mono">
                        {row.plantilla_autorizada}
                      </td>
                      <td className="text-center hide-on-mobile font-mono">
                        {row.backup > 0 ? (
                          <Tooltip
                            content={
                              <div className="tooltip-preline">
                                <div className="tooltip-title">
                                  Buffer de {row.backup} personas
                                </div>
                                <div>{pos.notas || 'Excedentes autorizados'}</div>
                              </div>
                            }
                            side="top"
                            delayMs={200}
                          >
                            <span className="color-primary area-detail__backup-help">
                              {row.backup}
                            </span>
                          </Tooltip>
                        ) : (
                          <span className="color-ink-faint">—</span>
                        )}
                      </td>
                      <td className="text-center font-strong hide-on-mobile">{row.plantilla_real}</td>
                      <td className="text-center">
                        {row.vacantes > 0 ? (
                          <span className="vacancy-highlight">{row.vacantes}</span>
                        ) : (
                          <span className="no-vacancy">—</span>
                        )}
                      </td>
                      <td className="hide-on-mobile font-strong" style={{ color: getCoverageColor(row.porcentaje_cobertura) }}>
                        {formatPercentage(row.porcentaje_cobertura)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
