import { Users } from 'lucide-react';
import './ComingSoon.css';

export function Pipeline() {
  return (
    <main className="page-shell container">
      <section className="coming-soon">
        <div className="coming-soon__icon" aria-hidden="true">
          <Users size={28} />
        </div>
        <h1 className="coming-soon__title">Pipeline de candidatos</h1>
        <p className="coming-soon__lead">
          Vista de tabla y kanban para seguimiento de candidatos. Próximamente.
        </p>
        <ul className="coming-soon__list">
          <li>Lista densa con filtros (puesto, área, reclutador, fuente, estado, fecha).</li>
          <li>Vista kanban con drag-and-drop entre etapas.</li>
          <li>Notas por candidato (mismo patrón que comentarios de puesto).</li>
          <li>Botón “Contratar” → crea empleado y cierra la vacante.</li>
        </ul>
      </section>
    </main>
  );
}
