import { useId } from 'react';
import { ChevronDown, ChevronRight, Image as ImageIcon } from 'lucide';
import type { IncidenciaTransporte } from '@/hooks/useIncidenciasTransporte';
import { MorphingIcon } from '@/components/ui/MorphingIcon';
import './TransportIncidentGroup.css';

interface TransportIncidentGroupProps {
  dateLabel: string;
  incidents: IncidenciaTransporte[];
  desktop: boolean;
  admin: boolean;
  loadingImageId: string | null;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onOpenImage: (incident: IncidenciaTransporte) => void;
}

interface ImageActionProps {
  incident: IncidenciaTransporte;
  loading: boolean;
  onOpen: (incident: IncidenciaTransporte) => void;
}

function ImageAction({ incident, loading, onOpen }: ImageActionProps) {
  return (
    <button
      type="button"
      className="incidencias-table__image-button"
      disabled={loading}
      aria-busy={loading || undefined}
      onClick={() => onOpen(incident)}
    >
      <MorphingIcon icon={ImageIcon} size="var(--icon-size-sm)" />
      {loading ? 'Abriendo…' : 'Ver imagen'}
    </button>
  );
}

export function TransportIncidentGroup({
  dateLabel,
  incidents,
  desktop,
  admin,
  loadingImageId,
  expanded,
  onToggle,
  onOpenImage,
}: TransportIncidentGroupProps) {
  const headingId = useId();

  return (
    <section className="incidencias-day-section" aria-labelledby={headingId}>
      <h3 id={headingId} className="incidencias-day-title">
        {dateLabel}
      </h3>

      {desktop ? (
        <div className="incidencias-table-wrapper">
          <table className="incidencias-table">
            <caption className="sr-only">
              Incidencias de transporte reportadas el {dateLabel}
            </caption>
            <thead>
              <tr>
                <th scope="col" className="incidencias-table__employee-column">
                  Número de empleado
                </th>
                <th scope="col" className="incidencias-table__route-column">
                  Ruta
                </th>
                <th scope="col" className="incidencias-table__shift-column">
                  Turno
                </th>
                <th scope="col" className="incidencias-table__type-column">
                  Tipo
                </th>
                <th scope="col">Comentarios</th>
                {admin && <th scope="col">Imagen</th>}
              </tr>
            </thead>
            <tbody>
              {incidents.map((incident) => (
                <tr key={incident.id}>
                  <td>{incident.numero_empleado}</td>
                  <td>{incident.ruta}</td>
                  <td>{incident.turno}</td>
                  <td>{incident.tipo}</td>
                  <td className="incidencias-table__comments">
                    {incident.comentarios || '—'}
                  </td>
                  {admin && (
                    <td>
                      {incident.imagen_path ? (
                        <ImageAction
                          incident={incident}
                          loading={loadingImageId === incident.id}
                          onOpen={onOpenImage}
                        />
                      ) : (
                        <span className="incidencias-table__empty-value">—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="incidencias-mobile-cards" aria-label={dateLabel}>
          {incidents.map((incident) => {
            const isOpen = expanded.has(incident.id);
            const detailId = `inc-detail-${incident.id}`;

            return (
              <li key={incident.id} className="incidencias-mobile-card">
                <button
                  type="button"
                  className="incidencias-mobile-card__summary"
                  aria-expanded={isOpen}
                  aria-controls={detailId}
                  onClick={() => onToggle(incident.id)}
                >
                  <span className="incidencias-mobile-card__main">
                    <span className="incidencias-mobile-card__name">
                      {incident.nombre_empleado || incident.numero_empleado}
                    </span>
                    <span className="incidencias-mobile-card__sub">
                      {incident.tipo}
                    </span>
                  </span>
                  <span className="incidencias-mobile-card__chip">
                    {incident.ruta}
                  </span>
                  <MorphingIcon
                    icon={isOpen ? ChevronDown : ChevronRight}
                    size="var(--icon-size-sm)"
                    className="incidencias-mobile-card__chevron"
                  />
                </button>

                <div
                  id={detailId}
                  className="incidencias-mobile-card__detail"
                  hidden={!isOpen}
                >
                  <dl className="incidencias-mobile-card__data">
                    <div>
                      <dt>Número</dt>
                      <dd>{incident.numero_empleado}</dd>
                    </div>
                    <div>
                      <dt>Turno</dt>
                      <dd>{incident.turno}</dd>
                    </div>
                    <div className="incidencias-mobile-card__data-full">
                      <dt>Comentarios</dt>
                      <dd>{incident.comentarios || '—'}</dd>
                    </div>
                  </dl>

                  {admin && incident.imagen_path && (
                    <ImageAction
                      incident={incident}
                      loading={loadingImageId === incident.id}
                      onOpen={onOpenImage}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
