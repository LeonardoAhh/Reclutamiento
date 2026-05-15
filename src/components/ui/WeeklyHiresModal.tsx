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
  return Array.from(map.values()).sort((a, b) => b.count - a.count || a.puesto.localeCompare(b.puesto));
}

export function WeeklyHiresModal({
  isOpen,
  onClose,
  range,
  rangeLabel,
  hires,
  bajas,
}: WeeklyHiresModalProps) {
  const grouped = groupByPuesto(hires);
  const empty = hires.length === 0 && bajas.length === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="weekly-hires-modal"
      icon={<Users size={20} aria-hidden="true" />}
      title={`Ingresos · Semana ${range.week}`}
      subtitle={
        <span className="weekly-hires-modal__subtitle">
          <CalendarRange size={14} aria-hidden="true" />
          {rangeLabel} {range.year}
        </span>
      }
    >
      <div className="modal-body weekly-hires-modal__body">
        <header className="weekly-hires-modal__summary">
          <div className="weekly-hires-modal__stat">
            <div className="weekly-hires-modal__big-number">{hires.length}</div>
            <p className="weekly-hires-modal__big-label">
              {hires.length === 1 ? 'ingreso' : 'ingresos'} esta semana
            </p>
          </div>
          <div className="weekly-hires-modal__stat weekly-hires-modal__stat--bajas">
            <div className="weekly-hires-modal__big-number weekly-hires-modal__big-number--bajas">
              {bajas.length}
            </div>
            <p className="weekly-hires-modal__big-label">
              {bajas.length === 1 ? 'baja' : 'bajas'} esta semana
            </p>
          </div>
        </header>

        {empty ? (
          <p className="weekly-hires-modal__empty">
            No hay movimientos registrados en este rango.
          </p>
        ) : (
          <>
            {hires.length > 0 && (
              <section
                className="weekly-hires-modal__section"
                aria-label="Resumen por puesto"
              >
                <h3 className="weekly-hires-modal__section-title">
                  Puestos contratados
                </h3>
                <ul className="weekly-hires-modal__puesto-list">
                  {grouped.map((g) => (
                    <li key={`${g.area}-${g.puesto}`} className="weekly-hires-modal__puesto-item">
                      <span className="weekly-hires-modal__puesto-name">{g.puesto}</span>
                      <span className="weekly-hires-modal__puesto-area">{g.area}</span>
                      <span className="weekly-hires-modal__puesto-count">{g.count}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {hires.length > 0 && (
              <section
                className="weekly-hires-modal__section"
                aria-label="Detalle por empleado"
              >
                <h3 className="weekly-hires-modal__section-title">Detalle de ingresos</h3>
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
                      {hires.map((e) => (
                        <tr key={e.num_empleado}>
                          <td className="weekly-hires-modal__cell-mono">{e.num_empleado}</td>
                          <td>{e.nombre}</td>
                          <td>{e.puesto}</td>
                          <td>
                            <div className="weekly-hires-modal__cell-area">{e.area}</div>
                            <div className="weekly-hires-modal__cell-seccion">{e.seccion}</div>
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

            {bajas.length > 0 && (
              <section
                className="weekly-hires-modal__section"
                aria-label="Detalle de bajas"
              >
                <h3 className="weekly-hires-modal__section-title">Detalle de bajas</h3>
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
                      {bajas.map((b) => (
                        <tr key={`${b.num_empleado}-${b.fecha_baja}`}>
                          <td className="weekly-hires-modal__cell-mono">{b.num_empleado}</td>
                          <td>{b.nombre}</td>
                          <td>{b.puesto}</td>
                          <td>
                            <div className="weekly-hires-modal__cell-area">{b.area}</div>
                            <div className="weekly-hires-modal__cell-seccion">{b.seccion}</div>
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
