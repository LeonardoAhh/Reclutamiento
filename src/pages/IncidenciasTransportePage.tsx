import { BusFront } from 'lucide';
import { IncidenciasTable } from '@/components/transporte/IncidenciasTable';
import { MorphingIcon } from '@/components/ui/MorphingIcon';
import './IncidenciasTransportePage.css';

export function IncidenciasTransportePage() {
  return (
    <main className="container transport-incidents-page">
      <header className="page-header transport-incidents-page__header">
        <div className="page-header__content">
          <div className="transport-incidents-page__copy">
            <p className="transport-incidents-page__eyebrow">
              <MorphingIcon
                icon={BusFront}
                size="var(--icon-size-control)"
              />
              Transporte
            </p>
            <h1 className="page-title">Incidencias de transporte</h1>
            <p className="transport-incidents-page__subtitle">
              Gestión y reporte de incidencias en rutas
            </p>
          </div>
        </div>
      </header>

      <section
        className="transport-incidents-page__content"
        aria-labelledby="transport-incidents-list-title"
      >
        <h2 id="transport-incidents-list-title" className="sr-only">
          Listado de incidencias
        </h2>
        <IncidenciasTable />
      </section>
    </main>
  );
}
