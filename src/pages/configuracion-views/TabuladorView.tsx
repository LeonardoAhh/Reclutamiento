import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Search, Wallet, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import '../Configuracion.css';

interface PuestoTabulador {
  ÁREA: string;
  PUESTO: string;
  TIPO: string;
  SALARIO_DIARIO: string;
  SUELDO_MENSUAL: string;
}

interface PuestoTabuladorSource {
  ÁREA?: string;
  PUESTO?: string;
  TIPO?: string;
  'SALARIO DIARIO 2026'?: string;
  'SUELDO DIARIO 2026'?: string;
  'SUELDO MENSUAL 2026'?: string;
}

type TabuladorType = 'sindicalizado' | 'nosindicalizado';

const TAB_OPTIONS: Array<{ id: TabuladorType; label: string }> = [
  { id: 'sindicalizado', label: 'Sindicalizado' },
  { id: 'nosindicalizado', label: 'No sindicalizado' },
];

function normalizePuesto(item: PuestoTabuladorSource): PuestoTabulador {
  return {
    ÁREA: item.ÁREA?.trim() || 'Sin área',
    PUESTO: item.PUESTO?.trim() || 'Sin puesto',
    TIPO: item.TIPO?.trim() || 'Sin tipo',
    SALARIO_DIARIO: (item['SALARIO DIARIO 2026'] || item['SUELDO DIARIO 2026'] || '—').trim(),
    SUELDO_MENSUAL: (item['SUELDO MENSUAL 2026'] || '—').trim(),
  };
}

export function TabuladorView() {
  const [dataSindicalizado, setDataSindicalizado] = useState<PuestoTabulador[]>([]);
  const [dataNoSindicalizado, setDataNoSindicalizado] = useState<PuestoTabulador[]>([]);
  const [tabuladorType, setTabuladorType] = useState<TabuladorType>('sindicalizado');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      try {
        const [resSindicalizado, resNoSindicalizado] = await Promise.all([
          fetch('/sindicalizado.json', { signal: controller.signal }),
          fetch('/nosindicalizado.json', { signal: controller.signal }),
        ]);

        if (!resSindicalizado.ok || !resNoSindicalizado.ok) {
          throw new Error('No se pudieron cargar los archivos del tabulador.');
        }

        const [jsonS, jsonN] = await Promise.all([
          resSindicalizado.json() as Promise<PuestoTabuladorSource[]>,
          resNoSindicalizado.json() as Promise<PuestoTabuladorSource[]>,
        ]);

        setDataSindicalizado(jsonS.map(normalizePuesto));
        setDataNoSindicalizado(jsonN.map(normalizePuesto));
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error('Error cargando tabuladores:', error);
        setLoadError('No fue posible cargar el tabulador. Intenta nuevamente más tarde.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchData();
    return () => controller.abort();
  }, []);

  const groupedAndFilteredData = useMemo(() => {
    const currentData = tabuladorType === 'sindicalizado' ? dataSindicalizado : dataNoSindicalizado;
    const query = searchTerm.trim().toLocaleLowerCase('es');
    const filtered = query
      ? currentData.filter((item) =>
          item.PUESTO.toLocaleLowerCase('es').includes(query) ||
          item.ÁREA.toLocaleLowerCase('es').includes(query)
        )
      : currentData;

    return filtered.reduce<Record<string, PuestoTabulador[]>>((groups, item) => {
      (groups[item.ÁREA] ??= []).push(item);
      return groups;
    }, {});
  }, [dataSindicalizado, dataNoSindicalizado, tabuladorType, searchTerm]);

  const resultCount = Object.values(groupedAndFilteredData).reduce(
    (total, puestos) => total + puestos.length,
    0
  );

  const handleClearSearch = () => {
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentId: TabuladorType) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = TAB_OPTIONS.findIndex(({ id }) => id === currentId);
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? TAB_OPTIONS.length - 1
        : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + TAB_OPTIONS.length) % TAB_OPTIONS.length;
    const nextId = TAB_OPTIONS[nextIndex].id;
    setTabuladorType(nextId);
    requestAnimationFrame(() => document.getElementById(`tabulador-tab-${nextId}`)?.focus());
  };

  if (loading) {
    return (
      <section className="tabulador-view config-page__content" aria-busy="true">
        <header className="config-page__header">
          <Skeleton variant="text" width="250px" height="28px" />
          <Skeleton variant="text" width="60%" height="20px" className="mt-sm" />
        </header>
        <div className="tabulador-skeleton" aria-hidden="true">
          <Skeleton variant="rect" width="100%" height="48px" radius="8px" />
          <Skeleton variant="rect" width="100%" height="200px" radius="8px" />
        </div>
        <span className="sr-only" role="status">Cargando tabulador de salarios…</span>
      </section>
    );
  }

  return (
    <section className="tabulador-view config-page__content" aria-labelledby="tabulador-title">
      <header className="config-page__header tabulador-header">
        <div className="tabulador-heading">
          <h2 id="tabulador-title" className="config-page__title">
            <Wallet size={24} className="text-primary" aria-hidden="true" />
            Tabulador de salarios
          </h2>
        </div>

        <div className="tabulador-tabs" role="tablist" aria-label="Tipo de tabulador">
          {TAB_OPTIONS.map(({ id, label }) => {
            const isActive = tabuladorType === id;
            return (
              <button
                key={id}
                type="button"
                id={`tabulador-tab-${id}`}
                className={`tabulador-tab${isActive ? ' tabulador-tab--active' : ''}`}
                role="tab"
                aria-selected={isActive}
                aria-controls="tabulador-panel"
                tabIndex={isActive ? 0 : -1}
                onClick={() => setTabuladorType(id)}
                onKeyDown={(event) => handleTabKeyDown(event, id)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </header>

      {loadError ? (
        <div className="config-empty" role="alert">
          <p className="type-body-md text-error">{loadError}</p>
        </div>
      ) : (
        <>
          <section className="config-page__toolbar" aria-label="Buscador de puestos">
            <div className="form-group config-search">
              <label htmlFor="tabulador-search-input" className="sr-only">
                Buscar puesto o área
              </label>
              <div className="config-search__wrapper">
                <Search size={18} className="config-search__icon text-muted" aria-hidden="true" />
                <input
                  id="tabulador-search-input"
                  ref={searchInputRef}
                  type="search"
                  placeholder="Buscar puesto o área…"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  autoComplete="off"
                  aria-describedby="tabulador-results-status"
                />
                {searchTerm.length > 0 && (
                  <button
                    type="button"
                    className="btn-icon config-search__clear"
                    onClick={handleClearSearch}
                    aria-label="Limpiar búsqueda"
                    title="Limpiar búsqueda"
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </section>

          <section
            id="tabulador-panel"
            className="tabulador-results"
            role="tabpanel"
            aria-labelledby={`tabulador-tab-${tabuladorType}`}
            tabIndex={0}
          >
            <p id="tabulador-results-status" className="sr-only" role="status" aria-live="polite">
              {resultCount} puesto{resultCount === 1 ? '' : 's'} encontrado{resultCount === 1 ? '' : 's'}.
            </p>

            {resultCount === 0 ? (
              <div className="config-empty">
                <p className="type-body-md text-muted">
                  No se encontraron puestos{searchTerm ? ` para “${searchTerm}”` : ''}.
                </p>
              </div>
            ) : (
              Object.entries(groupedAndFilteredData).map(([area, puestos]) => {
                const areaId = `tabulador-area-${area.toLocaleLowerCase('es').replace(/[^a-z0-9]+/g, '-')}`;
                return (
                  <section key={area} className="tabulador-area-section" aria-labelledby={areaId}>
                    <h3 id={areaId} className="tabulador-area-title type-heading-sm text-ink">
                      {area}
                    </h3>

                    <div className="indicadores-card indicadores-table-card tabulador-desktop-table">
                      <div className="table-responsive" tabIndex={0} role="region" aria-label={`Salarios del área ${area}`}>
                        <table className="indicadores-table tabulador-table">
                          <caption className="sr-only">Salarios vigentes del área {area}</caption>
                          <thead>
                            <tr>
                              <th scope="col">Puesto</th>
                              <th scope="col">Salario diario (2026)</th>
                              <th scope="col">Sueldo mensual (2026)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {puestos.map((puesto) => (
                              <tr key={`${puesto.ÁREA}-${puesto.PUESTO}-${puesto.TIPO}`}>
                                <th scope="row">
                                  <span className="tabulador-position-name type-body-sm font-medium text-ink">
                                    {puesto.PUESTO}
                                  </span>
                                  <span className="type-caption-sm text-muted">{puesto.TIPO}</span>
                                </th>
                                <td>
                                  <span className="indicador-value">{puesto.SALARIO_DIARIO}</span>
                                </td>
                                <td>
                                  <span className="indicador-value text-primary">{puesto.SUELDO_MENSUAL}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Móvil: tarjetas en lugar de la tabla (sin scroll horizontal) */}
                    <ul className="tabulador-cards" role="list" aria-label={`Salarios del área ${area}`}>
                      {puestos.map((puesto) => (
                        <li
                          key={`card-${puesto.ÁREA}-${puesto.PUESTO}-${puesto.TIPO}`}
                          className="tabulador-card"
                        >
                          <div className="tabulador-card__head">
                            <span className="tabulador-card__puesto">{puesto.PUESTO}</span>
                            <span className="tabulador-card__tipo">{puesto.TIPO}</span>
                          </div>
                          <dl className="tabulador-card__figures">
                            <div className="tabulador-card__figure">
                              <dt className="tabulador-card__label">Salario diario 2026</dt>
                              <dd className="tabulador-card__value">{puesto.SALARIO_DIARIO}</dd>
                            </div>
                            <div className="tabulador-card__figure">
                              <dt className="tabulador-card__label">Sueldo mensual 2026</dt>
                              <dd className="tabulador-card__value tabulador-card__value--primary">
                                {puesto.SUELDO_MENSUAL}
                              </dd>
                            </div>
                          </dl>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })
            )}
          </section>
        </>
      )}
    </section>
  );
}
