import { Users, CalendarRange } from 'lucide-react';
import { Modal } from './Modal';
import type { Employee } from '@/lib/types';
import { formatShortDate, type IsoWeekRange } from '@/lib/dates';
import './WeeklyHiresModal.css';

interface WeeklyHiresModalProps {
  isOpen: boolean;
  onClose: () => void;
  range: IsoWeekRange;
  rangeLabel: string;
  hires: Employee[];
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
}: WeeklyHiresModalProps) {
  const grouped = groupByPuesto(hires);

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
          <div className="weekly-hires-modal__big-number">{hires.length}</div>
          <p className="weekly-hires-modal__big-label">
            {hires.length === 1 ? 'ingreso' : 'ingresos'} esta semana
          </p>
        </header>

        {hires.length === 0 ? (
          <p className="weekly-hires-modal__empty">
            No hay ingresos registrados en este rango.
          </p>
        ) : (
          <>
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

            <section
              className="weekly-hires-modal__section"
              aria-label="Detalle por empleado"
            >
              <h3 className="weekly-hires-modal__section-title">Detalle</h3>
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
          </>
        )}
      </div>
    </Modal>
  );
}
