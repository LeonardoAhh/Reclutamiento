import { useState, useRef, useMemo, useEffect } from 'react';
import { INCIDENCIA_LABELS } from '@/components/reporte-diario/constants';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useReporteDiario, ReporteDiarioRecord } from '@/hooks/useReporteDiario';
import { Navigate } from 'react-router-dom';
import { Settings, Search, X, User } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import '../Configuracion.css';

const NON_INCIDENT_CODES = new Set(["-", "X", "A", "D", "DF", "B"]);

const STICKER_COLORS = [
  'var(--color-accent-sky)',
  'var(--color-accent-purple)',
  'var(--color-accent-pink)',
  'var(--color-accent-orange)',
  'var(--color-accent-teal)',
];

function getStickerColor(numEmpleado: string) {
  const numVal = parseInt(numEmpleado.replace(/\D/g, '') || '0', 10);
  return STICKER_COLORS[numVal % STICKER_COLORS.length];
}

function MiniCalendar({ days, mesStr }: { days: Record<string, string> | undefined, mesStr: string }) {
  if (!mesStr) return null;
  const [yearStr, monthStr] = mesStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;

  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const blanks = Array.from({ length: startOffset }, (_, i) => i);
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
    const dayStr = String(i + 1).padStart(2, '0');
    return { dayStr, code: days?.[dayStr] };
  });

  const weekdays = [
    { short: 'L', full: 'Lunes' },
    { short: 'M', full: 'Martes' },
    { short: 'M', full: 'Miércoles' },
    { short: 'J', full: 'Jueves' },
    { short: 'V', full: 'Viernes' },
    { short: 'S', full: 'Sábado' },
    { short: 'D', full: 'Domingo' },
  ];

  return (
    <div className="config-calendar-wrapper" aria-hidden="true">
      <div className="config-calendar-header">
        {weekdays.map((d, i) => (
          <abbr key={i} title={d.full} className="config-calendar-header__abbr">
            {d.short}
          </abbr>
        ))}
      </div>
      <div className="config-calendar">
        {blanks.map(b => <div key={`blank-${b}`} className="config-calendar__day config-calendar__day--blank" />)}
        {monthDays.map(d => {
          const hasCode = !!d.code;
          const isIncident = hasCode && !NON_INCIDENT_CODES.has(d.code as string);

          let className = "config-calendar__day";
          if (isIncident) className += " config-calendar__day--incident";
          else if (hasCode) className += " config-calendar__day--active";

          return (
            <div
              key={d.dayStr}
              className={className}
              title={`${d.dayStr}: ${d.code || 'Sin registro'}`}
            />
          );
        })}
      </div>
      <div className="config-calendar-legend">
        <span className="config-calendar-legend__item">
          <span className="config-calendar-legend__swatch config-calendar-legend__swatch--active" />
          Asistencia
        </span>
        <span className="config-calendar-legend__item">
          <span className="config-calendar-legend__swatch config-calendar-legend__swatch--incident" />
          Incidencia
        </span>
      </div>
    </div>
  );
}

export function BusquedaView() {
  const { user, loading } = useAuth();
  const { employees } = useSupabaseData();
  const { fetchByMes, fetchSummaries } = useReporteDiario();

  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [summaries, setSummaries] = useState<any[]>([]);
  const [selectedMes, setSelectedMes] = useState<string>('');
  const [currentReport, setCurrentReport] = useState<ReporteDiarioRecord | null>(null);

  useEffect(() => {
    fetchSummaries().then(data => {
      setSummaries(data);
      if (data.length > 0) {
        setSelectedMes(data[0].mes);
      }
    });
  }, [fetchSummaries]);

  useEffect(() => {
    if (selectedMes) {
      fetchByMes(selectedMes).then(setCurrentReport);
    }
  }, [selectedMes, fetchByMes]);

  const filteredEmployees = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (q.length < 2) return [];

    return employees.filter(e => {
      return e.num_empleado.toLowerCase().includes(q) ||
             e.nombre.toLowerCase().includes(q);
    }).slice(0, 10);
  }, [searchTerm, employees]);

  if (loading) {
    return (
      <section className="busqueda-view">
        <header className="config-page__header">
          <Skeleton variant="text" width="200px" height="28px" />
          <Skeleton variant="text" width="60%" height="20px" className="mt-sm" />
        </header>

        <div className="busqueda-skeleton">
           <Skeleton variant="rect" width="100%" height="48px" radius="8px" />
           <Skeleton variant="rect" width="100%" height="150px" radius="8px" />
        </div>
      </section>
    );
  }

  const handleClearSearch = () => {
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const showHelperText = searchTerm.length === 1;

  return (
    <section className="busqueda-view config-page__content">
      <header className="config-page__header">
        <h2 className="config-page__title">Búsqueda Global</h2>
        <p className="config-page__subtitle">Encuentra y gestiona a los colaboradores activos e inactivos.</p>
      </header>

      <section className="config-page__toolbar" aria-label="Herramientas de configuración">
        <div className="form-group config-search">
          <label htmlFor="config-search-input" className="sr-only">
            Buscar empleado o configuración
          </label>
          <div className="config-search__wrapper">
            <Search size={18} className="config-search__icon text-muted" aria-hidden="true" />
            <input
              id="config-search-input"
              ref={searchInputRef}
              type="text"
              placeholder="Buscar empleado por nombre o número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
              aria-describedby={showHelperText ? "config-search-hint" : undefined}
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
          {showHelperText && (
            <p id="config-search-hint" className="config-search__hint type-caption-sm text-muted-soft">
              Escribe al menos 2 caracteres para buscar.
            </p>
          )}
        </div>
      </section>

      <section
        className="config-page__content"
        aria-label="Resultados de búsqueda"
      >
        {searchTerm.length < 2 ? (
          <div className="config-initial-state">
            <div className="config-initial-state__icon">
              <Search size={32} color="var(--color-muted-soft)" aria-hidden="true" />
            </div>
            <h2 className="type-heading-md text-ink">Búsqueda Global</h2>
            <p className="type-body-md text-muted config-initial-state__copy">
              Encuentra rápidamente la información de cualquier empleado ingresando su nombre o número.
            </p>
          </div>
        ) : filteredEmployees.length > 0 ? (
          <div className="config-results-wrapper">
            <h2 className="sr-only">Resultados de búsqueda</h2>
            <p
              className="config-results__count type-caption-sm text-muted"
              role="status"
              aria-live="polite"
            >
              {filteredEmployees.length} resultado{filteredEmployees.length !== 1 ? 's' : ''} para "{searchTerm}"
            </p>

            <div className="config-results">
              {filteredEmployees.map(emp => {
                const stickerColor = getStickerColor(emp.num_empleado);
                const monthSelectId = `config-month-select-${emp.num_empleado}`;

                return (
                  <article key={emp.num_empleado} className="config-card">
                    <header className="config-card__header">
                      <div
                        className="config-card__avatar"
                        style={{ backgroundColor: stickerColor }}
                        aria-hidden="true"
                      >
                        <User size={20} color="var(--color-on-primary)" aria-hidden="true" />
                      </div>
                      <div className="config-card__title-group">
                        <h3 className="type-heading-sm text-ink">{emp.nombre}</h3>
                        <p className="type-caption-sm text-muted-soft">#{emp.num_empleado}</p>
                      </div>
                    </header>

                    <div className="config-card__body">
                      <dl className="config-card__properties">
                        <div className="notion-prop">
                          <dt className="notion-prop__label type-caption-up text-muted">Puesto</dt>
                          <dd className="notion-prop__value type-body-sm-strong text-charcoal">{emp.puesto}</dd>
                        </div>
                        <div className="notion-prop">
                          <dt className="notion-prop__label type-caption-up text-muted">Departamento</dt>
                          <dd className="notion-prop__value text-charcoal">{emp.area}</dd>
                        </div>
                        <div className="notion-prop">
                          <dt className="notion-prop__label type-caption-up text-muted">Sección</dt>
                          <dd className="notion-prop__value text-charcoal">{emp.seccion}</dd>
                        </div>
                        <div className="notion-prop">
                          <dt className="notion-prop__label type-caption-up text-muted">Fecha Ingreso</dt>
                          <dd className="notion-prop__value text-charcoal">{emp.fecha_ingreso}</dd>
                        </div>
                        <div className="notion-prop">
                          <dt className="notion-prop__label type-caption-up text-muted">Turno</dt>
                          <dd className="notion-prop__value">
                            {emp.turno ? (
                              <Badge variant="teal">{emp.turno}</Badge>
                            ) : (
                              <span className="text-muted">N/A</span>
                            )}
                          </dd>
                        </div>
                      </dl>

                      <aside className="config-card__calendar-section" aria-label={`Incidencias de ${emp.nombre}`}>
                        <div className="config-calendar-header-actions">
                          <span className="notion-prop__label type-caption-up text-muted">Incidencias</span>

                          {summaries.length > 1 && (
                            <>
                              <label htmlFor={monthSelectId} className="sr-only">
                                Seleccionar mes para {emp.nombre}
                              </label>
                              <select
                                id={monthSelectId}
                                value={selectedMes}
                                onChange={e => setSelectedMes(e.target.value)}
                                className="config-month-select"
                              >
                                {summaries.map(s => (
                                  <option key={s.mes} value={s.mes}>{s.mes}</option>
                                ))}
                              </select>
                            </>
                          )}
                          {summaries.length === 1 && (
                            <span className="type-caption-sm text-muted">{selectedMes}</span>
                          )}
                          {summaries.length === 0 && (
                            <span className="type-caption-sm text-muted">Sin reportes</span>
                          )}
                        </div>

                        <div className="config-calendar-layout">
                          {(() => {
                            const empDays = (currentReport?.data as any[])?.find(r => r.numero_empleado === emp.num_empleado)?.days;

                            const parsedIncidents = Object.entries(empDays || {})
                              .filter(([, code]) => code && !NON_INCIDENT_CODES.has(code as string))
                              .map(([day, code]) => ({
                                day,
                                code: code as string,
                                label: INCIDENCIA_LABELS[code as string] || (code as string),
                              }))
                              .sort((a, b) => parseInt(a.day) - parseInt(b.day));

                            return (
                              <>
                                <div className="config-calendar-details">
                                  {parsedIncidents.length > 0 ? (
                                    <ul className="config-incidence-list">
                                      {parsedIncidents.map(inc => (
                                        <li key={inc.day} className="config-incidence-list__item">
                                          <span className="config-incidence-list__day">{inc.day}</span>
                                          <span className="config-incidence-list__label">{inc.label}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <div className="config-incidence-list--empty">
                                      <span className="type-caption-sm text-muted-soft">Mes sin incidencias registradas.</span>
                                    </div>
                                  )}
                                </div>
                                <div className="config-calendar-grid-container">
                                  <MiniCalendar
                                    mesStr={selectedMes}
                                    days={empDays}
                                  />
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </aside>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="config-empty" role="status">
            <Search size={32} className="text-muted-soft config-empty__icon" aria-hidden="true" />
            <p className="type-body-md text-muted config-empty__copy">No se encontraron resultados para "{searchTerm}"</p>
          </div>
        )}
      </section>
    </section>
  );
}
