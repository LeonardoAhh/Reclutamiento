import { useMemo } from 'react';
import { CircleCheckBig, Copy, UsersRound } from 'lucide-react';
import { Modal } from './Modal';
import { ExpandableSection } from './ExpandableSection';
import { StarliteBadge } from './Badge';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { Baja, Employee } from '@/lib/types';
import { formatShortDate, type IsoWeekRange } from '@/lib/dates';

import './WeeklyHiresModal.css';

interface WeeklyHiresModalProps {
  isOpen: boolean;
  onClose: () => void;
  range: IsoWeekRange;
  rangeLabel: string;
  hires: Employee[];
  bajas: Baja[];
  previousRange: IsoWeekRange;
  previousRangeLabel: string;
  previousHires: Employee[];
  previousBajas: Baja[];
}

interface PuestoCount {
  puesto: string;
  isStarlite: boolean;
  count: number;
}

function groupByPuesto(hires: Employee[]): PuestoCount[] {
  const map = new Map<string, PuestoCount>();
  for (const e of hires) {
    const isStarlite = !!e.is_starlite;
    const key = `${e.puesto}||${isStarlite}`;
    const prev = map.get(key);
    if (prev) {
      prev.count += 1;
    } else {
      map.set(key, {
        puesto: e.puesto || 'Sin puesto',
        isStarlite,
        count: 1,
      });
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => b.count - a.count || a.puesto.localeCompare(b.puesto)
  );
}

interface DeltaProps {
  current: number;
  previous: number;
  invert?: boolean;
}

function Delta({ current, previous, invert = false }: DeltaProps) {
  const diff = current - previous;
  if (diff === 0) {
    return <span className="weekly-hires-modal__delta weekly-hires-modal__delta--neutral">= 0</span>;
  }
  const positive = invert ? diff < 0 : diff > 0;
  const cls = positive
    ? 'weekly-hires-modal__delta--up'
    : 'weekly-hires-modal__delta--down';
  const sign = diff > 0 ? '+' : '';
  return (
    <span className={`weekly-hires-modal__delta ${cls}`}>
      {sign}
      {diff}
    </span>
  );
}

export function WeeklyHiresModal({
  isOpen,
  onClose,
  range,
  rangeLabel,
  hires,
  bajas,
  previousRange,
  previousRangeLabel,
  previousHires,
  previousBajas,
}: WeeklyHiresModalProps) {
  const isMobile = useIsMobile();

  const groupedHires = useMemo(() => groupByPuesto(hires), [hires]);
  const groupedPreviousHires = useMemo(() => groupByPuesto(previousHires), [previousHires]);

  const sortedHires = useMemo(() => {
    return [...hires].sort((a, b) => {
      const cmpArea = (a.area || '').localeCompare(b.area || '');
      if (cmpArea !== 0) return cmpArea;
      return (a.seccion || '').localeCompare(b.seccion || '');
    });
  }, [hires]);

  const totalHires = hires.length + previousHires.length;
  const totalBajas = bajas.length + previousBajas.length;
  const netMovement = totalHires - totalBajas;

  const renderHiresTable = (
    hiresToRender: Employee[],
    title?: string,
    highlightStarlite = false,
  ) => (
    <div className="weekly-hires-modal__section">
      {title && <h4 className="weekly-hires-modal__section-title">{title}</h4>}
      {isMobile ? (
        <div className="weekly-hires-modal__mobile-list">
          {hiresToRender.map((e, idx) => (
            <div key={e.num_empleado ?? idx} className="weekly-hires-modal__mobile-card">
              <div className="weekly-hires-modal__mobile-card-header">
                <span className="weekly-hires-modal__mobile-name">
                  <span className="weekly-hires-modal__mobile-apellidos">{e.puesto}</span>
                  {highlightStarlite && e.is_starlite && <StarliteBadge compact />}
                </span>
                <span className="weekly-hires-modal__mobile-date">{formatShortDate(e.fecha_ingreso)}</span>
              </div>
              <div className="weekly-hires-modal__mobile-card-body">
                <div className="weekly-hires-modal__mobile-seccion">
                  {e.seccion || '-'}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="weekly-hires-modal__table-wrap">
          <table className="weekly-hires-modal__table">
            <thead>
              <tr>
                <th>Puesto</th>
                <th>Sección</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {hiresToRender.map((e) => (
                <tr key={e.num_empleado}>
                  <td>
                    <span className="weekly-hires-modal__cell-name">
                      <span>{e.puesto}</span>
                      {highlightStarlite && e.is_starlite && <StarliteBadge />}
                    </span>
                  </td>
                  <td>
                    <div className="weekly-hires-modal__cell-seccion">
                      {e.seccion || '-'}
                    </div>
                  </td>
                  <td className="weekly-hires-modal__cell-mono">
                    {formatShortDate(e.fecha_ingreso)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderBajasTable = (bajasToRender: Baja[], title?: string, highlightStarlite = false) => (
    <div className="weekly-hires-modal__section">
      {title && <h4 className="weekly-hires-modal__section-title">{title}</h4>}
      {isMobile ? (
        <div className="weekly-hires-modal__mobile-list">
          {bajasToRender.map((b, idx) => (
            <div key={`${b.num_empleado}-${b.fecha_baja}-${idx}`} className="weekly-hires-modal__mobile-card">
              <div className="weekly-hires-modal__mobile-card-header">
                <span className="weekly-hires-modal__mobile-name">
                  <span className="weekly-hires-modal__mobile-apellidos">{b.puesto}</span>
                  {highlightStarlite && b.is_starlite && <StarliteBadge compact />}
                </span>
                <span className="weekly-hires-modal__mobile-date">{formatShortDate(b.fecha_baja)}</span>
              </div>
              <div className="weekly-hires-modal__mobile-card-body">
                <div className="weekly-hires-modal__mobile-seccion">
                  {[b.seccion, b.turno].map((v) => v?.trim()).filter(Boolean).join(' · ') || '—'}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="weekly-hires-modal__table-wrap">
          <table className="weekly-hires-modal__table">
            <thead>
              <tr>
                <th>Puesto</th>
                <th>Sección</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {bajasToRender.map((b) => (
                <tr key={`${b.num_empleado}-${b.fecha_baja}`}>
                  <td>
                    <span className="weekly-hires-modal__cell-name">
                      <span>{b.puesto}</span>
                      {highlightStarlite && b.is_starlite && <StarliteBadge />}
                    </span>
                  </td>
                  <td>
                    <div className="weekly-hires-modal__cell-seccion">
                      {[b.seccion, b.turno].map((v) => v?.trim()).filter(Boolean).join(' · ') || '—'}
                    </div>
                  </td>
                  <td className="weekly-hires-modal__cell-mono">
                    {formatShortDate(b.fecha_baja)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="weekly-hires-modal"
      icon={<UsersRound size={20} aria-hidden="true" />}
      title={`Ingresos · Semanas ${previousRange.week} y ${range.week}`}
      size="md"
    >
      <div className="modal-body weekly-hires-modal__body">
        {/* Estadísticas principales */}
        <header className="weekly-hires-modal__summary">
          <div className="weekly-hires-modal__stat">
            <div className="weekly-hires-modal__big-number">
              {totalHires}
            </div>
            <p className="weekly-hires-modal__big-label">
              Ingreso{totalHires === 1 ? '' : 's'}
            </p>
          </div>
          <div className="weekly-hires-modal__stat">
            <div className="weekly-hires-modal__big-number weekly-hires-modal__big-number--bajas">
              {totalBajas}
            </div>
            <p className="weekly-hires-modal__big-label">
              Baja{totalBajas === 1 ? '' : 's'}
            </p>
          </div>
          {!isMobile && (
            <div className="weekly-hires-modal__stat">
              <div className={`weekly-hires-modal__big-number ${netMovement >= 0 ? 'weekly-hires-modal__big-number--positive' : 'weekly-hires-modal__big-number--negative'}`}>
                {netMovement > 0 ? '+' : ''}{netMovement}
              </div>
              <p className="weekly-hires-modal__big-label">
                Balance neto
              </p>
            </div>
          )}
        </header>

        <div className="weekly-hires-modal__weeks-grid">
          {/* Semana Actual */}
          <ExpandableSection
            title={`Semana ${range.week}`}
            variant="card"
          >
          <div className="weekly-hires-modal__week-content">
            <div className="weekly-hires-modal__week-stats">
              <div className="weekly-hires-modal__week-stat">
                <span className="weekly-hires-modal__week-stat-label">Ingresos</span>
                <span className="weekly-hires-modal__week-stat-value">
                  {hires.length}
                  <Delta current={hires.length} previous={previousHires.length} />
                </span>
              </div>
              <div className="weekly-hires-modal__week-stat">
                <span className="weekly-hires-modal__week-stat-label">Bajas</span>
                <span className="weekly-hires-modal__week-stat-value weekly-hires-modal__week-stat-value--bajas">
                  {bajas.length}
                  <Delta current={bajas.length} previous={previousBajas.length} invert />
                </span>
              </div>
            </div>

            {groupedHires.length > 0 && (
              <div className="weekly-hires-modal__puestos">
                <h5 className="weekly-hires-modal__puestos-title">Puestos contratados</h5>
                <ul className="weekly-hires-modal__puesto-list">
                  {groupedHires.map((g, idx) => (
                    <li key={`${g.puesto}-${g.isStarlite}-${idx}`} className="weekly-hires-modal__puesto-item">
                      <span className="weekly-hires-modal__puesto-name">
                        {g.puesto}
                        {g.isStarlite && (
                          <span style={{ marginLeft: '6px', verticalAlign: 'middle' }}>
                            <StarliteBadge compact />
                          </span>
                        )}
                      </span>
                      <span className="weekly-hires-modal__puesto-count">{g.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {hires.length > 0 && renderHiresTable(sortedHires, 'Detalle de ingresos', true)}
            {bajas.length > 0 && renderBajasTable(bajas, 'Detalle de bajas', true)}
          </div>
        </ExpandableSection>

        {/* Semana Anterior */}
        <ExpandableSection
          title={`Semana ${previousRange.week}`}
          variant="card"
        >
          <div className="weekly-hires-modal__week-content">
            <div className="weekly-hires-modal__week-stats">
              <div className="weekly-hires-modal__week-stat">
                <span className="weekly-hires-modal__week-stat-label">Ingresos</span>
                <span className="weekly-hires-modal__week-stat-value">
                  {previousHires.length}
                </span>
              </div>
              <div className="weekly-hires-modal__week-stat">
                <span className="weekly-hires-modal__week-stat-label">Bajas</span>
                <span className="weekly-hires-modal__week-stat-value weekly-hires-modal__week-stat-value--bajas">
                  {previousBajas.length}
                </span>
              </div>
            </div>

            {groupedPreviousHires.length > 0 && (
              <div className="weekly-hires-modal__puestos">
                <h5 className="weekly-hires-modal__puestos-title">Puestos contratados</h5>
                <ul className="weekly-hires-modal__puesto-list">
                  {groupedPreviousHires.map((g, idx) => (
                    <li key={`${g.puesto}-${g.isStarlite}-${idx}`} className="weekly-hires-modal__puesto-item">
                      <span className="weekly-hires-modal__puesto-name">
                        {g.puesto}
                        {g.isStarlite && (
                          <span style={{ marginLeft: '6px', verticalAlign: 'middle' }}>
                            <StarliteBadge compact />
                          </span>
                        )}
                      </span>
                      <span className="weekly-hires-modal__puesto-count">{g.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {previousHires.length > 0 && renderHiresTable(
              [...previousHires].sort((a, b) => {
                const cmpArea = (a.area || '').localeCompare(b.area || '');
                if (cmpArea !== 0) return cmpArea;
                return (a.seccion || '').localeCompare(b.seccion || '');
              }),
              'Detalle de ingresos',
              true
            )}
            {previousBajas.length > 0 && renderBajasTable(previousBajas, 'Detalle de bajas', true)}
          </div>
            </ExpandableSection>
        </div>
      </div>
    </Modal>
  );
}
