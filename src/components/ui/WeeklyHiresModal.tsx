import { useState } from 'react';
import { CalendarRange, Users } from 'lucide-react';
import { Modal } from './Modal';
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
  area: string;
  count: number;
}

function groupByPuesto(hires: Employee[]): PuestoCount[] {
  const map = new Map<string, PuestoCount>();
  for (const e of hires) {
    const key = `${e.area}||${e.puesto}`;
    const prev = map.get(key);
    if (prev) {
      prev.count += 1;
    } else {
      map.set(key, { puesto: e.puesto, area: e.area, count: 1 });
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => b.count - a.count || a.puesto.localeCompare(b.puesto)
  );
}

type WeekTab = 'current' | 'previous';

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
  const [activeTab, setActiveTab] = useState<WeekTab>('current');

  const selectedRange = activeTab === 'current' ? range : previousRange;
  const selectedLabel = activeTab === 'current' ? rangeLabel : previousRangeLabel;
  const selectedHires = activeTab === 'current' ? hires : previousHires;
  const selectedBajas = activeTab === 'current' ? bajas : previousBajas;

  const grouped = groupByPuesto(selectedHires);
  const empty = selectedHires.length === 0 && selectedBajas.length === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="weekly-hires-modal"
      icon={<Users size={20} aria-hidden="true" />}
      title={`Ingresos · Semanas ${previousRange.week} y ${range.week}`}
      subtitle={
        <span className="weekly-hires-modal__subtitle">
          <CalendarRange size={14} aria-hidden="true" />
          Comparativo semanal {range.year}
        </span>
      }
    >
      <div className="modal-body weekly-hires-modal__body">
        <section
          className="weekly-hires-modal__compare"
          aria-label="Comparativo de semanas"
        >
          <article className="weekly-hires-modal__compare-col">
            <header className="weekly-hires-modal__compare-head">
              <span className="weekly-hires-modal__compare-week">
                Semana {previousRange.week}
              </span>
              <span className="weekly-hires-modal__compare-range">
                {previousRangeLabel}
              </span>
            </header>
            <dl className="weekly-hires-modal__compare-stats">
              <div className="weekly-hires-modal__compare-stat">
                <dt>Ingresos</dt>
                <dd>{previousHires.length}</dd>
              </div>
              <div className="weekly-hires-modal__compare-stat">
                <dt>Bajas</dt>
                <dd className="weekly-hires-modal__compare-stat--bajas">
                  {previousBajas.length}
                </dd>
              </div>
            </dl>
          </article>

          <article className="weekly-hires-modal__compare-col weekly-hires-modal__compare-col--current">
            <header className="weekly-hires-modal__compare-head">
              <span className="weekly-hires-modal__compare-week">
                Semana {range.week}
              </span>
              <span className="weekly-hires-modal__compare-range">
                {rangeLabel}
              </span>
            </header>
            <dl className="weekly-hires-modal__compare-stats">
              <div className="weekly-hires-modal__compare-stat">
                <dt>Ingresos</dt>
                <dd>
                  {hires.length}
                  <Delta current={hires.length} previous={previousHires.length} />
                </dd>
              </div>
              <div className="weekly-hires-modal__compare-stat">
                <dt>Bajas</dt>
                <dd className="weekly-hires-modal__compare-stat--bajas">
                  {bajas.length}
                  <Delta
                    current={bajas.length}
                    previous={previousBajas.length}
                    invert
                  />
                </dd>
              </div>
            </dl>
          </article>
        </section>

        <div
          className="weekly-hires-modal__tabs"
          role="tablist"
          aria-label="Detalle por semana"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'current'}
            className={`weekly-hires-modal__tab ${
              activeTab === 'current' ? 'weekly-hires-modal__tab--active' : ''
            }`}
            onClick={() => setActiveTab('current')}
          >
            Semana {range.week}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'previous'}
            className={`weekly-hires-modal__tab ${
              activeTab === 'previous' ? 'weekly-hires-modal__tab--active' : ''
            }`}
            onClick={() => setActiveTab('previous')}
          >
            Semana {previousRange.week}
          </button>
        </div>

        <p className="weekly-hires-modal__range-caption">
          <CalendarRange size={14} aria-hidden="true" />
          {selectedLabel} {selectedRange.year}
        </p>

        {empty ? (
          <p className="weekly-hires-modal__empty">
            No hay movimientos registrados en este rango.
          </p>
        ) : (
          <>
            {selectedHires.length > 0 && (
              <section
                className="weekly-hires-modal__section"
                aria-label="Resumen por puesto"
              >
                <h3 className="weekly-hires-modal__section-title">
                  Puestos contratados
                </h3>
                <ul className="weekly-hires-modal__puesto-list">
                  {grouped.map((g) => (
                    <li
                      key={`${g.area}-${g.puesto}`}
                      className="weekly-hires-modal__puesto-item"
                    >
                      <span className="weekly-hires-modal__puesto-name">
                        {g.puesto}
                      </span>
                      <span className="weekly-hires-modal__puesto-area">
                        {g.area}
                      </span>
                      <span className="weekly-hires-modal__puesto-count">
                        {g.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {selectedHires.length > 0 && (
              <section
                className="weekly-hires-modal__section"
                aria-label="Detalle por empleado"
              >
                <h3 className="weekly-hires-modal__section-title">
                  Detalle de ingresos
                </h3>
                <div className="weekly-hires-modal__table-wrap">
                  <table className="weekly-hires-modal__table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Nombre</th>
                        <th>Puesto</th>
                        <th>Área · Sección</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedHires.map((e) => (
                        <tr key={e.num_empleado}>
                          <td className="weekly-hires-modal__cell-mono">
                            {e.num_empleado}
                          </td>
                          <td>{e.nombre}</td>
                          <td>{e.puesto}</td>
                          <td>
                            <div className="weekly-hires-modal__cell-area">
                              {e.area}
                            </div>
                            <div className="weekly-hires-modal__cell-seccion">
                              {e.seccion}
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
              </section>
            )}

            {selectedBajas.length > 0 && (
              <section
                className="weekly-hires-modal__section"
                aria-label="Detalle de bajas"
              >
                <h3 className="weekly-hires-modal__section-title">
                  Detalle de bajas
                </h3>
                <div className="weekly-hires-modal__table-wrap">
                  <table className="weekly-hires-modal__table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Nombre</th>
                        <th>Puesto</th>
                        <th>Área · Sección</th>
                        <th>Tipo</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBajas.map((b) => (
                        <tr key={`${b.num_empleado}-${b.fecha_baja}`}>
                          <td className="weekly-hires-modal__cell-mono">
                            {b.num_empleado}
                          </td>
                          <td>{b.nombre}</td>
                          <td>{b.puesto}</td>
                          <td>
                            <div className="weekly-hires-modal__cell-area">
                              {b.area}
                            </div>
                            <div className="weekly-hires-modal__cell-seccion">
                              {b.seccion}
                            </div>
                          </td>
                          <td>{b.tipo_baja || '—'}</td>
                          <td className="weekly-hires-modal__cell-mono">
                            {formatShortDate(b.fecha_baja)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
