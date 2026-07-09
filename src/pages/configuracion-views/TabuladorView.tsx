import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Wallet } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import '../Configuracion.css';

interface PuestoTabulador {
  ÁREA: string;
  PUESTO: string;
  TIPO: string;
  SALARIO_DIARIO: string;
  SUELDO_MENSUAL: string;
}

export function TabuladorView() {
  const [dataSindicalizado, setDataSindicalizado] = useState<PuestoTabulador[]>([]);
  const [dataNoSindicalizado, setDataNoSindicalizado] = useState<PuestoTabulador[]>([]);
  const [tabuladorType, setTabuladorType] = useState<'sindicalizado' | 'nosindicalizado'>('sindicalizado');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resSindicalizado, resNoSindicalizado] = await Promise.all([
          fetch('/sindicalizado.json'),
          fetch('/nosindicalizado.json')
        ]);
        
        if (resSindicalizado.ok) {
          const jsonS = await resSindicalizado.json();
          setDataSindicalizado(jsonS.map((item: any) => ({
            ÁREA: item.ÁREA,
            PUESTO: item.PUESTO,
            TIPO: item.TIPO,
            SALARIO_DIARIO: item['SALARIO DIARIO 2026'] || item['SUELDO DIARIO 2026'],
            SUELDO_MENSUAL: item['SUELDO MENSUAL 2026']
          })));
        }

        if (resNoSindicalizado.ok) {
          const jsonN = await resNoSindicalizado.json();
          setDataNoSindicalizado(jsonN.map((item: any) => ({
            ÁREA: item.ÁREA,
            PUESTO: item.PUESTO,
            TIPO: item.TIPO,
            SALARIO_DIARIO: item['SALARIO DIARIO 2026'] || item['SUELDO DIARIO 2026'],
            SUELDO_MENSUAL: item['SUELDO MENSUAL 2026']
          })));
        }
      } catch (error) {
        console.error("Error cargando tabuladores:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleClearSearch = () => {
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const groupedAndFilteredData = useMemo(() => {
    const currentData = tabuladorType === 'sindicalizado' ? dataSindicalizado : dataNoSindicalizado;
    const q = searchTerm.trim().toLowerCase();
    const filtered = q.length > 0
      ? currentData.filter(item => 
          item.PUESTO.toLowerCase().includes(q) || 
          item.ÁREA.toLowerCase().includes(q)
        )
      : currentData;

    const groups: Record<string, PuestoTabulador[]> = {};
    filtered.forEach(item => {
      if (!groups[item.ÁREA]) {
        groups[item.ÁREA] = [];
      }
      groups[item.ÁREA].push(item);
    });
    
    return groups;
  }, [dataSindicalizado, dataNoSindicalizado, tabuladorType, searchTerm]);

  if (loading) {
    return (
      <section className="tabulador-view config-page__content">
        <header className="config-page__header">
          <Skeleton variant="text" width="250px" height="28px" />
          <Skeleton variant="text" width="60%" height="20px" className="mt-sm" />
        </header>
        <div className="tabulador-skeleton" style={{ marginTop: 'var(--spacing-xl)' }}>
           <Skeleton variant="rect" width="100%" height="48px" radius="8px" />
           <Skeleton variant="rect" width="100%" height="200px" radius="8px" style={{ marginTop: 'var(--spacing-lg)' }} />
        </div>
      </section>
    );
  }

  return (
    <section className="tabulador-view config-page__content">
      <header className="config-page__header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
          <div>
            <h2 className="type-heading-md text-ink" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              <Wallet size={24} className="text-primary" />
              Tabulador de Salarios
            </h2>
            <p className="type-body-sm text-muted mt-xxs">
              Consulta los salarios diarios y mensuales vigentes agrupados por área.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: 'var(--spacing-xs)', background: 'var(--color-surface-soft)', padding: 'var(--spacing-xxs)', borderRadius: 'var(--rounded-lg)', border: '1px solid var(--color-hairline)' }}>
            <button
              onClick={() => setTabuladorType('sindicalizado')}
              style={{
                padding: 'var(--spacing-xs) var(--spacing-md)',
                borderRadius: 'var(--rounded-md)',
                border: 'none',
                background: tabuladorType === 'sindicalizado' ? 'var(--color-surface)' : 'transparent',
                color: tabuladorType === 'sindicalizado' ? 'var(--color-ink)' : 'var(--color-muted)',
                fontWeight: tabuladorType === 'sindicalizado' ? 'var(--font-semibold)' : 'var(--font-medium)',
                boxShadow: tabuladorType === 'sindicalizado' ? 'var(--shadow-sm)' : 'none',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              Sindicalizado
            </button>
            <button
              onClick={() => setTabuladorType('nosindicalizado')}
              style={{
                padding: 'var(--spacing-xs) var(--spacing-md)',
                borderRadius: 'var(--rounded-md)',
                border: 'none',
                background: tabuladorType === 'nosindicalizado' ? 'var(--color-surface)' : 'transparent',
                color: tabuladorType === 'nosindicalizado' ? 'var(--color-ink)' : 'var(--color-muted)',
                fontWeight: tabuladorType === 'nosindicalizado' ? 'var(--font-semibold)' : 'var(--font-medium)',
                boxShadow: tabuladorType === 'nosindicalizado' ? 'var(--shadow-sm)' : 'none',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              No Sindicalizado
            </button>
          </div>
        </div>
      </header>

      <section className="config-page__toolbar" aria-label="Buscador de puestos" style={{ marginTop: 'var(--spacing-xl)' }}>
        <div className="form-group config-search">
          <label htmlFor="tabulador-search-input" className="sr-only">
            Buscar puesto o área
          </label>
          <div className="config-search__wrapper">
            <Search size={18} className="config-search__icon text-muted" aria-hidden="true" />
            <input
              id="tabulador-search-input"
              ref={searchInputRef}
              type="text"
              placeholder="Buscar puesto o área..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
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

      <section className="tabulador-results" style={{ marginTop: 'var(--spacing-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xl)' }}>
        {Object.keys(groupedAndFilteredData).length === 0 ? (
          <div className="config-empty">
            <p className="type-body-md text-muted">No se encontraron puestos para "{searchTerm}".</p>
          </div>
        ) : (
          Object.entries(groupedAndFilteredData).map(([area, puestos]) => (
            <div key={area} className="tabulador-area-section">
              <h3 className="type-heading-sm text-ink" style={{ marginBottom: 'var(--spacing-md)', paddingBottom: 'var(--spacing-xs)', borderBottom: '1px solid var(--color-hairline-soft)' }}>
                {area}
              </h3>
              
              <div className="indicadores-card indicadores-table-card">
                <div className="table-responsive">
                  <table className="indicadores-table">
                    <thead>
                      <tr>
                        <th scope="col">Puesto</th>
                        <th scope="col" style={{ textAlign: 'center' }}>Salario Diario (2026)</th>
                        <th scope="col" style={{ textAlign: 'right' }}>Sueldo Mensual (2026)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {puestos.map((puesto, index) => (
                        <tr key={index}>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xxs)' }}>
                              <span className="type-body-sm font-medium text-ink">{puesto.PUESTO}</span>
                              <span className="type-caption-sm text-muted">{puesto.TIPO}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="indicador-value">{puesto.SALARIO_DIARIO.trim()}</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span className="indicador-value text-primary">{puesto.SUELDO_MENSUAL.trim()}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </section>
  );
}
