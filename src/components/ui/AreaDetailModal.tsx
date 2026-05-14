import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  MessageSquare,
  Shield,
} from 'lucide-react';
import { Modal } from './Modal';
import { Badge } from './Badge';
import { CoverageBar } from './CoverageBar';
import { COMMENT_TYPE_LABELS } from '@/lib/constants';
import { getCoverageColor } from '@/lib/utils';
import type { DepartmentCoverage, PositionComment } from '@/lib/types';
import './AreaDetailModal.css';

interface AreaDetailModalProps {
  isOpen: boolean;
  dept: DepartmentCoverage | null;
  comments: PositionComment[];
  onClose: () => void;
  onOpenComment: (area: string, seccion: string, puesto: string) => void;
  getCoverageBadge: (pct: number) => 'success' | 'teal' | 'amber' | 'error';
}

const ALL_TAB = '__all__';

export function AreaDetailModal({
  isOpen,
  dept,
  comments,
  onClose,
  onOpenComment,
  getCoverageBadge,
}: AreaDetailModalProps) {
  const tablistRef = useRef<HTMLDivElement>(null);

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

  const [activeTab, setActiveTab] = useState<string>(ALL_TAB);

  // Reset to "Todas" each time we open a new area
  useEffect(() => {
    if (isOpen) setActiveTab(ALL_TAB);
  }, [isOpen, dept?.area]);

  const visiblePuestos = useMemo(() => {
    if (!dept) return [];
    if (activeTab === ALL_TAB) return dept.puestos;
    return dept.puestos.filter((p) => p.seccion === activeTab);
  }, [dept, activeTab]);

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

  const tabs = [
    { id: ALL_TAB, label: 'Todas', count: dept.puestos.length },
    ...secciones.map((s) => ({
      id: s,
      label: s,
      count: dept.puestos.filter((p) => p.seccion === s).length,
    })),
  ];

  const activeTotals =
    activeTab === ALL_TAB
      ? {
          autorizada: dept.plantilla_autorizada,
          real: dept.plantilla_real,
          vacantes: dept.vacantes,
          urgentes: dept.urgentes,
        }
      : seccionTotals.get(activeTab) ?? {
          autorizada: 0,
          real: 0,
          vacantes: 0,
          urgentes: 0,
        };

  return (
    <Modal
      isOpen={isOpen}
      title={dept.area}
      subtitle="Detalle por sección"
      onClose={onClose}
      className="area-detail-modal"
      labelledById="area-detail-title"
    >
      <div className="area-detail-modal__summary" aria-hidden={false}>
        <div className="area-detail-modal__summary-stats">
          <span className="area-detail-modal__stat">
            <span className="area-detail-modal__stat-value">
              {activeTotals.real}
              <span className="area-detail-modal__stat-sep">/</span>
              {activeTotals.autorizada}
            </span>
            <span className="area-detail-modal__stat-label">Real / Autorizada</span>
          </span>
          <span className="area-detail-modal__stat">
            <span className="area-detail-modal__stat-value">{activeTotals.vacantes}</span>
            <span className="area-detail-modal__stat-label">Vacantes</span>
          </span>
          {activeTotals.urgentes > 0 && (
            <span className="area-detail-modal__stat">
              <span className="area-detail-modal__stat-value area-detail-modal__stat-value--error">
                {activeTotals.urgentes}
              </span>
              <span className="area-detail-modal__stat-label">Urgentes</span>
            </span>
          )}
        </div>
        <div className="area-detail-modal__summary-cobertura">
          <Badge variant={getCoverageBadge(dept.porcentaje_cobertura)}>
            {dept.porcentaje_cobertura}%
          </Badge>
          <div className="area-detail-modal__bar">
            <CoverageBar
              percentage={dept.porcentaje_cobertura}
              color={getCoverageColor(dept.porcentaje_cobertura)}
              height={6}
              showLabel={false}
            />
          </div>
        </div>
      </div>

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
                role="tab"
                type="button"
                aria-selected={isActive}
                aria-controls="area-detail-tabpanel"
                tabIndex={isActive ? 0 : -1}
                className={`area-detail-modal__tab${isActive ? ' is-active' : ''}`}
                onClick={() => setActiveTab(t.id)}
                onKeyDown={(e) => onTabKeyDown(e, idx)}
              >
                <span className="area-detail-modal__tab-label">{t.label}</span>
                <span className="area-detail-modal__tab-count" aria-hidden="true">
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div
        id="area-detail-tabpanel"
        role="tabpanel"
        aria-label={activeTab === ALL_TAB ? 'Todas las secciones' : activeTab}
        className="area-detail-modal__panel"
      >
        {visiblePuestos.length === 0 ? (
          <div className="area-detail-modal__empty">
            <p>No hay puestos en esta sección.</p>
          </div>
        ) : (
          <div className="dept-card__table-wrapper area-detail-modal__table-wrapper">
            <table className="dept-card__table">
              <thead>
                <tr>
                  <th scope="col">Puesto</th>
                  {activeTab === ALL_TAB && <th scope="col">Sección</th>}
                  <th scope="col" className="text-center">Autorizada</th>
                  <th scope="col" className="text-center">Real</th>
                  <th scope="col" className="text-center">Vacantes</th>
                  <th scope="col">Cobertura</th>
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
                        <td className="cell-seccion">{pos.seccion}</td>
                      )}
                      <td className="text-center">
                        {pos.plantilla_autorizada}
                        {pos.backup > 0 && (
                          <span
                            className="cell-backup-hint"
                            title={pos.notas ?? 'Buffer de back-up autorizado'}
                          >
                            {' '}+{pos.backup}
                          </span>
                        )}
                      </td>
                      <td className="text-center font-strong">{pos.plantilla_real}</td>
                      <td className="text-center">
                        {pos.vacantes > 0 ? (
                          <span className="vacancy-count">{pos.vacantes}</span>
                        ) : (
                          <span className="no-vacancy">—</span>
                        )}
                      </td>
                      <td>
                        <CoverageBar
                          percentage={pos.porcentaje_cobertura}
                          color={getCoverageColor(pos.porcentaje_cobertura)}
                          height={6}
                        />
                      </td>
                      <td className="text-center">
                        {latestComment ? (
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
                        ) : pos.vacantes > 0 ? (
                          <Badge variant="error">Sin proceso</Badge>
                        ) : (
                          <span className="no-vacancy">—</span>
                        )}
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
      </div>
    </Modal>
  );
}
