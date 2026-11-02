import { useState, useMemo } from 'react';
import { PageHeading } from '@/components/layout/PageHeading';
import { CircleAlert, UsersRound } from 'lucide-react';
import { Badge, StarliteBadge, type BadgeVariant } from '@/components/ui/Badge';
import { SearchField } from '@/components/ui/SearchField';
import { INCIDENCIA_LABELS } from '@/components/reporte-diario/constants';
import './Asistencia.css';

interface AsistenciaRecord {
  'numero empleado': string;
  nombre: string;
  turno: string;
  sección: string;
  tipo: string;
  puesto: string;
  proyecto?: string;
}

function getVariantForIncidencia(tipo: string): BadgeVariant {
  switch (tipo) {
    case 'A':
      return 'success';
    case 'F':
      return 'error';
    case 'FJ':
      return 'warning';
    case 'P':
    case 'PH':
      return 'warning';
    case 'I':
      return 'error';
    case 'CT':
    case 'V':
    case 'TXT':
      return 'warning';
    default:
      return 'neutral';
  }
}

export function Asistencia() {
  const [data, setData] = useState<AsistenciaRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [jsonInput, setJsonInput] = useState('');

  const handlePasteSubmit = () => {
    if (!jsonInput.trim()) {
      setError('Por favor pega el JSON antes de procesar.');
      return;
    }
    try {
      const json = JSON.parse(jsonInput);
      if (Array.isArray(json)) {
        setData(json);
        setError(null);
      } else {
        setError('El texto debe contener un arreglo JSON válido.');
      }
    } catch {
      setError('Error al procesar el JSON. Asegúrate de que el formato sea correcto.');
    }
  };

  const filteredData = data
    ?.filter((item) => {
      const term = searchTerm.toLowerCase();
      const nombreMatch = item.nombre?.toLowerCase().includes(term);
      const numMatch = item['numero empleado']?.toString().includes(term);
      return nombreMatch || numMatch;
    })
    .sort((a, b) => {
      const isA = a.tipo === 'A';
      const isB = b.tipo === 'A';
      if (isA === isB) {
        if (!isA && a.tipo !== b.tipo) {
          const labelA = INCIDENCIA_LABELS[a.tipo] || a.tipo || '';
          const labelB = INCIDENCIA_LABELS[b.tipo] || b.tipo || '';
          return labelA.localeCompare(labelB);
        }
        const numA = parseInt(a['numero empleado'], 10) || 0;
        const numB = parseInt(b['numero empleado'], 10) || 0;
        return numA - numB;
      }
      return isA ? 1 : -1;
    });

  const summaryByProyecto = useMemo(() => {
    if (!data) return [];

    interface ProyectoSummary {
      proyecto: string;
      total: number;
      breakdown: Record<string, number>;
    }

    const grouped = data.reduce(
      (acc, curr) => {
        if (!curr.proyecto) return acc;
        const proyecto = curr.proyecto.trim();

        const tipoCode = curr.tipo || 'Sin registro';
        const tipoLabel = INCIDENCIA_LABELS[tipoCode] || tipoCode;

        if (!acc[proyecto]) {
          acc[proyecto] = { proyecto, total: 0, breakdown: {} };
        }

        acc[proyecto].total += 1;
        acc[proyecto].breakdown[tipoLabel] = (acc[proyecto].breakdown[tipoLabel] || 0) + 1;

        return acc;
      },
      {} as Record<string, ProyectoSummary>,
    );

    return Object.values(grouped).sort((a, b) => b.total - a.total);
  }, [data]);

  const summaryByPuesto = useMemo(() => {
    if (!data) return [];

    interface PuestoSummary {
      puesto: string;
      total: number;
      breakdown: Record<string, number>;
    }

    const grouped = data.reduce(
      (acc, curr) => {
        // Remove trailing category letters like " A", " B", " C", " D" for grouping
        const rawPuesto = curr.puesto || 'Sin puesto';
        const puesto = rawPuesto.replace(/\s+[A-Z]$/i, '').trim();

        const tipoCode = curr.tipo || 'Sin registro';
        const tipoLabel = INCIDENCIA_LABELS[tipoCode] || tipoCode;

        if (!acc[puesto]) {
          acc[puesto] = { puesto, total: 0, breakdown: {} };
        }

        acc[puesto].total += 1;
        acc[puesto].breakdown[tipoLabel] = (acc[puesto].breakdown[tipoLabel] || 0) + 1;

        return acc;
      },
      {} as Record<string, PuestoSummary>,
    );

    // Sort descending by total count
    return Object.values(grouped).sort((a, b) => b.total - a.total);
  }, [data]);

  return (
    <div className="asistencia-page container">
      <PageHeading className="config-page__title app-page-title">
        <UsersRound className="text-primary" size="var(--icon-size-lg)" aria-hidden="true" />
        Asistencia del Personal
      </PageHeading>

      {!data ? (
        <div className="feature-card" style={{ marginTop: 'var(--spacing-xl)', maxWidth: '800px' }}>
          <h2 className="type-heading-3" style={{ marginBottom: 'var(--spacing-xs)' }}>
            Pegar JSON
          </h2>
          <p className="type-body-sm color-ink-muted" style={{ marginBottom: 'var(--spacing-lg)' }}>
            Pega aquí el contenido del reporte de asistencia generado en formato JSON.
          </p>

          <div className="form-group" style={{ marginBottom: 'var(--spacing-lg)' }}>
            <textarea
              placeholder='[\n  {\n    "numero empleado": "..."\n  }\n]'
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                if (error) setError(null);
              }}
              style={{
                minHeight: '250px',
                width: '100%',
                fontFamily: 'var(--font-code)',
                fontSize: 'var(--type-code-sm-size)',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
            <button className="btn-primary" onClick={handlePasteSubmit}>
              Procesar Asistencia
            </button>
          </div>

          {error && (
            <div className="asistencia-error">
              <CircleAlert size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="asistencia-content">
          {summaryByProyecto.length > 0 && (
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <h2 className="type-heading-sm" style={{ marginBottom: 'var(--spacing-md)' }}>
                Resumen por Proyecto
              </h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: 'var(--spacing-md)',
                }}
              >
                {summaryByProyecto.map((summary, i) => (
                  <div key={`proyecto-${i}`} className="feature-card" style={{ padding: 'var(--spacing-lg)' }}>
                    <h3 className="type-caption-up color-muted" style={{ marginBottom: 'var(--spacing-xs)' }}>
                      {summary.proyecto}
                    </h3>
                    <div className="type-display-lg color-ink" style={{ marginBottom: 'var(--spacing-md)' }}>
                      {summary.total}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                      {Object.entries(summary.breakdown)
                        .sort((a, b) => b[1] - a[1])
                        .map(([label, count]) => (
                          <div
                            key={label}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              borderBottom: '1px solid var(--color-hairline)',
                              paddingBottom: '4px',
                            }}
                          >
                            <span className="type-body-sm color-muted">{label}</span>
                            <span className="type-body-sm-strong color-ink">{count}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {summaryByPuesto.length > 0 && (
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <h2 className="type-heading-sm" style={{ marginBottom: 'var(--spacing-md)' }}>
                Resumen por Puesto
              </h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: 'var(--spacing-md)',
                }}
              >
                {summaryByPuesto.map((summary, i) => (
                  <div key={`puesto-${i}`} className="feature-card" style={{ padding: 'var(--spacing-lg)' }}>
                    <h3 className="type-caption-up color-muted" style={{ marginBottom: 'var(--spacing-xs)' }}>
                      {summary.puesto}
                    </h3>
                    <div className="type-display-lg color-ink" style={{ marginBottom: 'var(--spacing-md)' }}>
                      {summary.total}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                      {Object.entries(summary.breakdown)
                        .sort((a, b) => b[1] - a[1])
                        .map(([label, count]) => (
                          <div
                            key={label}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              borderBottom: '1px solid var(--color-hairline)',
                              paddingBottom: '4px',
                            }}
                          >
                            <span className="type-body-sm color-muted">{label}</span>
                            <span className="type-body-sm-strong color-ink">{count}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="asistencia-toolbar">
            <div className="form-group search-group">
              <SearchField
                id="asistencia-search"
                label="Buscar asistencia"
                placeholder="Buscar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              className="btn-secondary"
              onClick={() => {
                setData(null);
                setSearchTerm('');
                setJsonInput('');
              }}
            >
              Pegar otro JSON
            </button>
          </div>

          <div className="asistencia-table-wrapper">
            <table className="asistencia-table data-table data-table--cards">
              <caption className="sr-only">Asistencia del Personal</caption>
              <thead>
                <tr>
                  <th scope="col">No. Empleado</th>
                  <th scope="col">Nombre</th>
                  <th scope="col">Turno</th>
                  <th scope="col">Sección</th>
                  <th scope="col">Puesto</th>
                  <th scope="col">Proyecto</th>
                  <th scope="col" className="asistencia-table__type">
                    Tipo
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData?.map((item, idx) => (
                  <tr key={`${item['numero empleado']}-${idx}`}>
                    <td data-label="No. Empleado">{item['numero empleado']}</td>
                    <th scope="row" className="asistencia-table__name">
                      {item.nombre}
                    </th>
                    <td data-label="Turno">{item.turno}</td>
                    <td data-label="Sección">{item.sección}</td>
                    <td data-label="Puesto">{(item.puesto || '').replace(/\s+[A-Z]$/i, '').trim() || '-'}</td>
                    <td data-label="Proyecto">
                      {item.proyecto ? (
                        item.proyecto.toLowerCase() === 'starlite' ? (
                          <StarliteBadge />
                        ) : (
                          <Badge>{item.proyecto}</Badge>
                        )
                      ) : (
                        '-'
                      )}
                    </td>
                    <td data-label="Tipo" className="asistencia-table__type">
                      <Badge variant={getVariantForIncidencia(item.tipo)}>
                        {INCIDENCIA_LABELS[item.tipo] || item.tipo || '-'}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {filteredData?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="asistencia-table__empty">
                      No se encontraron resultados para la búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
