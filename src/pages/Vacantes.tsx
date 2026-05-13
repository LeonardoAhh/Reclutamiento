import { ClipboardList } from 'lucide-react';
import './ComingSoon.css';

export function Vacantes() {
  return (
    <main className="page-shell container">
      <section className="coming-soon">
        <div className="coming-soon__icon" aria-hidden="true">
          <ClipboardList size={28} />
        </div>
        <h1 className="coming-soon__title">Vacantes / Requisiciones</h1>
        <p className="coming-soon__lead">
          Ciclo de vida de cada vacante (apertura, asignación, time-to-fill,
          auditoría). Próximamente.
        </p>
        <ul className="coming-soon__list">
          <li>Estados: Abierta · En proceso · Pausa · Cubierta · Cancelada.</li>
          <li>Time-to-fill automático al cubrir.</li>
          <li>Histórico de cambios de status con autor y fecha.</li>
          <li>Cierre automático al dar de alta un empleado del puesto.</li>
        </ul>
      </section>
    </main>
  );
}
