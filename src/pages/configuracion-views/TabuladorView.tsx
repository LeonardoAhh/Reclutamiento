import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { PageHeading } from '@/components/layout/PageHeading';
import { Search } from 'lucide-react';
import { BoneyardSkeleton } from '@/components/ui/BoneyardSkeleton';
import { ButtonUtility } from '@/components/ui/ButtonUtility';
import { normalizeSearchText } from './analisis-helpers';
import { SearchField } from '@/components/ui/SearchField';
import { TabuladorAreaSection, type PuestoTabulador } from './components/TabuladorAreaSection';
import { useLanguage } from '@/contexts/LanguageContext';
import { getConfiguracionCopy, localizeTabulatorFallback } from './configuracion-translations';
import '../Configuracion.css';

interface PuestoTabuladorSource {
  ÁREA?: string;
  PUESTO?: string;
  TIPO?: string;
  'SALARIO DIARIO 2026'?: string;
  'SUELDO DIARIO 2026'?: string;
  'SUELDO MENSUAL 2026'?: string;
}

type TabuladorType = 'sindicalizado' | 'nosindicalizado';

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
  const { language } = useLanguage();
  const copy = getConfiguracionCopy(language).tabulator;
  const tabOptions: Array<{ id: TabuladorType; label: string }> = [
    { id: 'sindicalizado', label: copy.union },
    { id: 'nosindicalizado', label: copy.nonUnion },
  ];
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
          throw new Error('Could not load salary scale data.');
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
        setLoadError('error');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchData();
    return () => controller.abort();
  }, []);

  const searchTokens = useMemo(
    () => normalizeSearchText(searchTerm).split(/\s+/).filter(Boolean),
    [searchTerm],
  );
  const isFiltering = searchTokens.length > 0;

  const groupedAndFilteredData = useMemo(() => {
    const currentData = tabuladorType === 'sindicalizado' ? dataSindicalizado : dataNoSindicalizado;
    const filtered = !isFiltering
      ? currentData
      : currentData.filter((item) => {
          const haystack = normalizeSearchText([
            item.PUESTO,
            item.ÁREA,
            item.TIPO,
          ].map((value) => localizeTabulatorFallback(value, language)).join(' '));
          return searchTokens.every((token) => haystack.includes(token));
        });

    return filtered.reduce<Record<string, PuestoTabulador[]>>((groups, item) => {
      (groups[item.ÁREA] ??= []).push(item);
      return groups;
    }, {});
  }, [dataSindicalizado, dataNoSindicalizado, tabuladorType, searchTokens, isFiltering, language]);

  const resultCount = Object.values(groupedAndFilteredData).reduce(
    (total, puestos) => total + puestos.length,
    0
  );
  const areaCount = Object.keys(groupedAndFilteredData).length;

  const handleClearSearch = () => {
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentId: TabuladorType) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = tabOptions.findIndex(({ id }) => id === currentId);
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? tabOptions.length - 1
        : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabOptions.length) % tabOptions.length;
    const nextId = tabOptions[nextIndex].id;
    setTabuladorType(nextId);
    requestAnimationFrame(() => document.getElementById(`config-tab-${nextId}`)?.focus());
  };

  return (
    <BoneyardSkeleton
      name="configuracion-tabulador"
      loading={loading}
      loadingLabel={copy.loading}
    >
      <section className="tabulador-view config-page" aria-labelledby="tabulador-title">
      <header className="config-page__header tabulador-header">
        <PageHeading id="tabulador-title" className="config-page__title app-page-title">
          {copy.title}
        </PageHeading>
        {!loadError && (
          <div className="tabulador-search-header">
            <SearchField
              id="tabulador-search-input"
              ref={searchInputRef}
              label={copy.searchLabel}
              placeholder={copy.searchPlaceholder}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape' && searchTerm) {
                  event.stopPropagation();
                  handleClearSearch();
                }
              }}
              onClear={handleClearSearch}
              autoComplete="off"
              aria-describedby="tabulador-results-status"
            />
          </div>
        )}
        <div className="config-tabs" role="tablist" aria-label={copy.tabList}>
          {tabOptions.map(({ id, label }) => {
            const isActive = tabuladorType === id;
            return (
              <button
                key={id}
                type="button"
                id={`config-tab-${id}`}
                className={`config-tab${isActive ? ' config-tab--active' : ''}`}
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
          <p className="type-body-md text-error">{copy.loadError}</p>
        </div>
      ) : (
        <>
          <p
            id="tabulador-results-status"
            className="tabulador-results-status sr-only"
            role="status"
            aria-live="polite"
          >
            {resultCount} {language === 'en' ? resultCount === 1 ? 'position' : 'positions' : `puesto${resultCount === 1 ? '' : 's'}`} {language === 'en' ? 'in' : 'en'}{' '}
            {areaCount} {language === 'en' ? areaCount === 1 ? 'area' : 'areas' : `área${areaCount === 1 ? '' : 's'}`}
            {isFiltering ? ` para “${searchTerm.trim()}”` : ''}.
          </p>

          <section
            id="tabulador-panel"
            className="tabulador-results"
            role="tabpanel"
            aria-labelledby={`config-tab-${tabuladorType}`}
            tabIndex={0}
          >
            {resultCount === 0 ? (
              <div className="config-empty" role="status">
                <Search
                  size="var(--icon-size-xxl)"
                  className="text-muted-soft config-empty__icon"
                  aria-hidden="true"
                />
                <p className="type-body-md text-muted config-empty__copy">
                  {copy.noPositions}
                  {isFiltering ? ` para “${searchTerm.trim()}”` : ''}.
                </p>
                {isFiltering && (
                  <ButtonUtility onClick={handleClearSearch}>
                    {copy.clearSearch}
                  </ButtonUtility>
                )}
              </div>
            ) : (
              Object.entries(groupedAndFilteredData).map(([area, puestos]) => (
                <TabuladorAreaSection
                  key={area}
                  area={localizeTabulatorFallback(area, language)}
                  puestos={puestos}
                  searchTokens={searchTokens}
                  language={language}
                />
              ))
            )}
          </section>
        </>
      )}
      </section>
    </BoneyardSkeleton>
  );
}
