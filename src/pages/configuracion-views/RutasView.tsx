import { useState, useRef, useMemo, useEffect } from 'react';
import { MapPin, Bus, Users, CalendarDays, ChevronLeft, ChevronRight, Clock, Search, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getShortName } from '@/lib/names';
import { useRutas, RutaAgrupada, type EmpleadoRuta } from '@/hooks/useRutas';
import { RutaEmployeesModal } from '@/components/ui/RutaEmployeesModal';
import { Tooltip } from '@/components/ui/Tooltip';
import './Rutas.css';

/* ─────────────────────────────────────────
   Subcomponents
───────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div className="ruta-skeleton" aria-hidden="true">
      <div className="ruta-skeleton__icon skeleton-pulse" />
      <div className="ruta-skeleton__lines">
        <div className="ruta-skeleton__line ruta-skeleton__line--title skeleton-pulse" />
        <div className="ruta-skeleton__line ruta-skeleton__line--sub skeleton-pulse" />
      </div>
    </div>
  );
}

interface RutaCardProps {
  ruta: RutaAgrupada;
  isActive: boolean;
  onClick: () => void;
}

function RutaCard({ ruta, isActive, onClick, matchCount }: RutaCardProps & { matchCount?: number }) {
  return (
    <button
      type="button"
      className={`ruta-card${isActive ? ' ruta-card--active' : ''}${matchCount ? ' ruta-card--has-match' : ''}`}
      onClick={onClick}
      aria-pressed={isActive}
    >
      <span className="ruta-card__icon" aria-hidden="true">
        <Bus size={18} />
      </span>
      <span className="ruta-card__title type-heading-sm">{ruta.nombreRuta.split('-')[0].trim()}</span>
      {matchCount !== undefined && matchCount > 0 && (
        <span className="ruta-card__match-badge">
          {matchCount} encontrado{matchCount === 1 ? '' : 's'}
        </span>
      )}
      <ChevronRight size={18} aria-hidden="true" className="ruta-card__chevron" />
    </button>
  );
}

/* ─── Animated route SVG ─── */
interface RouteSvgProps {
  paradas: string[];
  animKey: number;
}

function RouteSvg({ paradas, animKey }: RouteSvgProps) {
  // Mostramos TODAS las paradas (antes se hardcodeaba cap 6, lo que era
  // inconsistente con la lista de abajo). Cap generoso para casos extremos.
  const MAX_POINTS = 20;
  const count = Math.max(1, Math.min(paradas.length, MAX_POINTS));

  // ViewBox normalizado — el SVG usa width:100% del contenedor.
  const VB_W = 100;
  const VB_H = 24;
  const MARGIN_X = 4;
  const MID_Y = VB_H / 2;
  const AMPLITUDE = 5; // Alto de la ondulación (dentro del viewBox)

  const step = count > 1 ? (VB_W - MARGIN_X * 2) / (count - 1) : 0;

  // Ondulación sinusoidal suave (comunicativa, no aleatoria).
  const points = Array.from({ length: count }, (_, i) => {
    const t = count > 1 ? i / (count - 1) : 0.5;
    return {
      x: MARGIN_X + i * step,
      y: MID_Y + Math.sin(t * Math.PI * 1.6) * AMPLITUDE * 0.55,
    };
  });

  // Path suave usando Catmull-Rom → Bezier cúbico (pasa por todos los puntos).
  const smoothPath = (() => {
    if (points.length < 2) {
      return `M ${MARGIN_X} ${MID_Y} L ${VB_W - MARGIN_X} ${MID_Y}`;
    }
    let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }
    return d;
  })();

  return (
    <svg
      key={animKey}
      className="route-svg"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      role="img"
      aria-label={`Recorrido con ${paradas.length} ${paradas.length === 1 ? 'parada' : 'paradas'}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Track base (hairline) */}
      <path
        className="route-svg__track"
        d={smoothPath}
        pathLength="1"
      />
      {/* Progress line que se dibuja de origen a destino */}
      <path
        className="route-svg__line"
        d={smoothPath}
        pathLength="1"
      />
      {/* Paradas — endpoints más grandes; intermedias tipo donut. */}
      {points.map((p, i) => {
        const isEndpoint = i === 0 || i === count - 1;
        return (
          <g
            key={i}
            className={`route-svg__stop${isEndpoint ? ' route-svg__stop--endpoint' : ''}`}
            style={{ '--stop-delay': `${0.2 + i * (1 / Math.max(count, 6)) * 0.8}s` } as React.CSSProperties}
          >
            <circle
              cx={p.x}
              cy={p.y}
              className={`route-svg__dot${isEndpoint ? ' route-svg__dot--endpoint' : ''}`}
            />
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Animated shift bars ─── */
interface ShiftBarsProps {
  turnosCount: Record<string, number>;
  turnosCountPrev: Record<string, number>;
  maxCapacityPerShift: Record<string, number>;
  empleados: EmpleadoRuta[];
  empleadosPrev: EmpleadoRuta[];
  animKey: number;
}

function ShiftBars({ turnosCount, turnosCountPrev, maxCapacityPerShift, empleados = [], empleadosPrev = [], animKey }: ShiftBarsProps) {
  const entries = Object.entries(turnosCount)
    .sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="shift-bars" key={animKey}>
      {entries.map(([turno, count], i) => {
        const assignedCapacity = maxCapacityPerShift[turno];
        const barMax = assignedCapacity || Math.max(count, 21);
        const pct = barMax > 0 ? Math.round((count / barMax) * 100) : 0;
        const isOverCapacity = count > barMax;

        const prevCount = turnosCountPrev[turno] ?? count; // Default to count if no prev data
        const delta = count - prevCount;
        let trendAria = 'Sin cambios';
        if (delta > 0) trendAria = `${delta} alta${delta === 1 ? '' : 's'}`;
        if (delta < 0) trendAria = `${Math.abs(delta)} baja${Math.abs(delta) === 1 ? '' : 's'}`;

        const currentEmps = empleados.filter(e => e.turno === turno);
        const prevEmps = empleadosPrev.filter(e => e.turno === turno);
        const added = currentEmps.filter(curr => !prevEmps.some(prev => prev.numeroEmpleado === curr.numeroEmpleado));
        const removed = prevEmps.filter(prev => !currentEmps.some(curr => curr.numeroEmpleado === prev.numeroEmpleado));

        const tooltipContent = (added.length > 0 || removed.length > 0) ? (
          <div className="trend-tooltip">
            {added.length > 0 && (
              <div className="trend-tooltip__section">
                <strong className="trend-tooltip__title trend-tooltip__title--success">
                  <TrendingUp size={12} /> Altas ({added.length}):
                </strong>
                <ul className="trend-tooltip__list">
                  {added.map(e => <li key={e.numeroEmpleado}>{getShortName(e.nombre)}</li>)}
                </ul>
              </div>
            )}
            {removed.length > 0 && (
              <div className="trend-tooltip__section">
                <strong className="trend-tooltip__title trend-tooltip__title--danger">
                  <TrendingDown size={12} /> Bajas ({removed.length}):
                </strong>
                <ul className="trend-tooltip__list">
                  {removed.map(e => <li key={e.numeroEmpleado}>{getShortName(e.nombre)}</li>)}
                </ul>
              </div>
            )}
          </div>
        ) : null;

        const trendBadge = (
          <span
            tabIndex={0}
            className={`shift-bars__trend ${delta > 0 ? 'trend-up' : delta < 0 ? 'trend-down' : 'trend-flat'}`}
            aria-label={trendAria}
          >
            {delta > 0 ? <TrendingUp size={14} aria-hidden="true" /> : delta < 0 ? <TrendingDown size={14} aria-hidden="true" /> : <Minus size={14} aria-hidden="true" />}
            <span className="sr-only">{trendAria}</span>
            <span aria-hidden="true">{Math.abs(delta)}</span>
          </span>
        );

        return (
          <div
            key={turno}
            className={`shift-bars__row${isOverCapacity ? ' shift-bars__row--over' : ''}`}
            style={{ '--bar-delay': `${i * 0.08}s`, '--bar-pct': `${Math.min(pct, 100)}%` } as React.CSSProperties}
          >
            <span className="shift-bars__label type-body-sm">Turno {turno}</span>
            <div
              className="shift-bars__track"
              role="progressbar"
              aria-valuenow={count}
              aria-valuemin={0}
              aria-valuemax={Math.max(barMax, count)}
              aria-valuetext={assignedCapacity ? `${count} de ${assignedCapacity} empleados` : `${count} empleados`}
              aria-label={`Turno ${turno}`}
            >
              <div className="shift-bars__fill" />
            </div>
            <div className="shift-bars__stats">
              <span
                className={`shift-bars__count type-body-sm${isOverCapacity ? ' shift-bars__count--over' : ''}`}
              >
                {assignedCapacity ? `${count} / ${assignedCapacity}` : count}
              </span>
              {turnosCountPrev[turno] !== undefined && (
                tooltipContent ? (
                  <Tooltip content={tooltipContent} side="top" delayMs={200}>
                    {trendBadge}
                  </Tooltip>
                ) : (
                  trendBadge
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Animated daily capacity bars ─── */
interface DailyCapacityBarsProps {
  capacityPerDay: Record<string, number>;
  animKey: number;
}

function DailyCapacityBars({ capacityPerDay, animKey }: DailyCapacityBarsProps) {
  const DAYS_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const RESTING_SHIFTS: Record<string, string> = {
    Lunes:     'T2',
    Martes:    'T2',
    Miércoles: 'T3',
    Jueves:    'T3',
    Viernes:   'T4',
    Sábado:    'T4',
    Domingo:   'T1',
  };

  return (
    <div className="daily-cards" key={`daily-${animKey}`}>
      {DAYS_ORDER.map((day) => {
        const count = capacityPerDay[day] || 0;
        return (
          <div key={day} className="daily-cards__card">
            <span className="daily-cards__day">{day}</span>
            <div className="daily-cards__stats">
              <div className="daily-cards__stat">
                <span className="daily-cards__label">Empleados</span>
                <span className="daily-cards__value">{count}</span>
              </div>
              <div className="daily-cards__stat">
                <span className="daily-cards__label">Descansa</span>
                <span
                  className="daily-cards__rest-badge"
                  title={`Descansa el Turno ${RESTING_SHIFTS[day].replace('T', '')}`}
                >
                  {RESTING_SHIFTS[day]}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Placeholder ─── */
function Placeholder() {
  return (
    <div className="rutas-placeholder">
      <div className="rutas-mockup" aria-hidden="true">
        <div className="rutas-mockup__track">
          <span className="rutas-mockup__progress" />
          <span className="rutas-mockup__stop rutas-mockup__stop--start" />
          <span className="rutas-mockup__stop rutas-mockup__stop--mid" />
          <span className="rutas-mockup__stop rutas-mockup__stop--end" />
          <span className="rutas-mockup__bus">
            <Bus size={16} strokeWidth={2.2} aria-hidden="true" />
          </span>
        </div>
      </div>
      <h3 className="type-heading-md">Selecciona una ruta</h3>
      <p className="type-body-sm">Toca cualquier tarjeta para ver sus detalles.</p>
    </div>
  );
}

/* ─── Detail panel ─── */
interface RutaDetailProps {
  ruta: RutaAgrupada;
  animKey: number;
  onOpenEmployeesModal: () => void;
}

function RutaDetail({ ruta, animKey, onOpenEmployeesModal }: RutaDetailProps) {
  return (
    <div className="ruta-detail ruta-detail--enter" key={animKey}>
      <div className="ruta-detail__body">
        {/* Dual column grids */}
        <div className="ruta-detail__grids">
          <section className="ruta-section">
            <h3 className="ruta-section__title ruta-section__title-wrapper type-heading-sm">
              <MapPin size={16} aria-hidden="true" className="ruta-section__title-icon" />
              {ruta.nombreRuta}
              <button
                type="button"
                className="btn-secondary ruta-section__title-btn"
                onClick={onOpenEmployeesModal}
                title="Ver empleados"
                aria-label="Ver empleados"
              >
                Empleados
              </button>
            </h3>

            <ShiftBars
              turnosCount={ruta.turnosCount}
              turnosCountPrev={ruta.turnosCountPrev}
              maxCapacityPerShift={ruta.maxCapacityPerShift}
              empleados={ruta.empleados}
              empleadosPrev={ruta.empleadosPrev}
              animKey={animKey}
            />
          </section>

          <section className="ruta-section">
            <h3 className="ruta-section__title ruta-section__title-wrapper type-heading-sm">
              <CalendarDays size={16} aria-hidden="true" className="ruta-section__title-icon" />
              Empleados por día
            </h3>
            <DailyCapacityBars
              capacityPerDay={ruta.capacityPerDay}
              animKey={animKey}
            />
          </section>
        </div>

        {/* Route simulation */}
        <section className="ruta-section">
          <h3 className="ruta-section__title type-heading-sm">
            <MapPin size={16} aria-hidden="true" className="ruta-section__title-icon" style={{ marginRight: 'var(--spacing-sm)' }} />
            Paradas
          </h3>
          <RouteSvg paradas={ruta.paradas} animKey={animKey} />
          <div className="ruta-stops">
            <p className="ruta-stops__heading type-caption-up">
              Paradas registradas ({ruta.paradas.length})
            </p>
            <ul className="ruta-stops__list">
              {ruta.paradas.map((parada, i) => (
                <li
                  key={i}
                  className="ruta-stops__item type-body-sm"
                  style={{ '--item-delay': `${0.05 + i * 0.06}s` } as React.CSSProperties}
                >
                  <span className="ruta-stops__dot" aria-hidden="true" />
                  {parada}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main component
───────────────────────────────────────── */

export function RutasView() {
  const { rutas, loading, errorMsg } = useRutas();
  const [selectedRuta, setSelectedRuta] = useState<RutaAgrupada | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  /**
   * mobileView controls which panel is shown on small screens.
   * On desktop both panels are always visible (CSS grid).
   */
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const listRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter routes based on search term (by employee number or name)
  const searchNorm = searchTerm.trim().toLowerCase();

  const matchCounts = useMemo(() => {
    if (!searchNorm) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const ruta of rutas) {
      const count = ruta.empleados.filter(
        (emp) =>
          emp.numeroEmpleado.toLowerCase().includes(searchNorm) ||
          emp.nombre.toLowerCase().includes(searchNorm)
      ).length;
      if (count > 0) map.set(ruta.nombreRuta, count);
    }
    return map;
  }, [rutas, searchNorm]);

  const filteredRutas = useMemo(() => {
    if (!searchNorm) return rutas;
    return rutas.filter((ruta) => matchCounts.has(ruta.nombreRuta));
  }, [rutas, searchNorm, matchCounts]);

  // Auto-select first matching route when search changes
  useEffect(() => {
    if (searchNorm && filteredRutas.length > 0) {
      const currentStillVisible = selectedRuta && matchCounts.has(selectedRuta.nombreRuta);
      if (!currentStillVisible) {
        setSelectedRuta(filteredRutas[0]);
        setAnimKey((k) => k + 1);
      }
    }
  }, [searchNorm, filteredRutas, matchCounts]);

  function handleSelect(ruta: RutaAgrupada) {
    setSelectedRuta(ruta);
    setAnimKey((k) => k + 1);
    setMobileView('detail'); // push to detail on mobile
  }

  function handleBack() {
    setMobileView('list');
  }

  const handleListKeyDown = (event: React.KeyboardEvent) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const buttons = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('.ruta-card') ?? []);
    if (!buttons.length) return;
    const currentIndex = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? buttons.length - 1
        : (Math.max(currentIndex, 0) + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
    buttons[nextIndex]?.focus();
  };

  return (
    <section className="rutas-page config-page__content" id="main-content" data-mobile-view={mobileView} tabIndex={-1}>
      <header className="config-page__header rutas-header">
        <div className="rutas-header__copy">
          <h2 className="config-page__title">Rutas de transporte</h2>
        </div>
      </header>

      {/* ── Search bar & Horarios ── */}
      <section className="config-page__toolbar" aria-label="Herramientas de rutas">
        <div className="rutas-toolbar-flex" style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center', width: '100%' }}>
          <div className="form-group config-search" style={{ flex: 1, minWidth: 0, margin: 0 }}>
            <label htmlFor="rutas-search-input" className="sr-only">
              Buscar empleado por número o nombre
            </label>
            <div className="config-search__wrapper">
              <Search size={18} className="config-search__icon text-muted" aria-hidden="true" />
              <input
                id="rutas-search-input"
                ref={searchInputRef}
                type="text"
                placeholder="Buscar por número de empleado o nombre…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-describedby={searchNorm ? 'rutas-search-status' : undefined}
                autoComplete="off"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="btn-icon config-search__clear"
                  onClick={() => { setSearchTerm(''); searchInputRef.current?.focus(); }}
                  aria-label="Limpiar búsqueda"
                  title="Limpiar búsqueda"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </div>
            {searchNorm && (
              <p id="rutas-search-status" className="config-search__hint text-muted mt-xs" role="status" aria-live="polite">
                {filteredRutas.length === 0
                  ? 'Sin resultados'
                  : `${matchCounts.size} ruta${matchCounts.size === 1 ? '' : 's'} · ${Array.from(matchCounts.values()).reduce((a, b) => a + b, 0)} empleado${Array.from(matchCounts.values()).reduce((a, b) => a + b, 0) === 1 ? '' : 's'}`}
              </p>
            )}
          </div>
          
          <a
            href="/horarios/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{ flexShrink: 0 }}
            title="Ver horarios"
            aria-label="Ver horarios"
          >
            <Clock size={16} aria-hidden="true" />
            <span className="ruta-btn-text">Horarios</span>
          </a>
        </div>
      </section>

      <div className="rutas-layout" data-mobile-view={mobileView}>
        {/* ── Left: route list ── */}
        <section
          ref={listRef}
          className="rutas-list"
          aria-label="Lista de rutas"
          onKeyDown={handleListKeyDown}
        >
          {loading && (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          )}

          {errorMsg && (
            <div className="rutas-error" role="alert">
              <p className="type-body-strong">Error al cargar datos</p>
              <p className="type-body-sm">{errorMsg}</p>
            </div>
          )}

          {!loading && !errorMsg && !searchNorm && filteredRutas.length === 0 && (
            <p className="rutas-empty type-body-sm">
              No se encontraron rutas en el archivo.
            </p>
          )}

          {!loading &&
            !errorMsg &&
            filteredRutas.map((ruta) => (
              <RutaCard
                key={ruta.nombreRuta}
                ruta={ruta}
                isActive={selectedRuta?.nombreRuta === ruta.nombreRuta}
                onClick={() => handleSelect(ruta)}
                matchCount={searchNorm ? matchCounts.get(ruta.nombreRuta) : undefined}
              />
            ))}
        </section>

        {/* ── Right: detail / placeholder ── */}
        <section className="rutas-detail-pane" aria-live="polite" aria-atomic="false">
          {/* Back button — mobile only, rendered via CSS display */}
          {selectedRuta && (
            <button
              type="button"
              className="rutas-back-btn"
              onClick={handleBack}
              aria-label="Volver a la lista de rutas"
            >
              <ChevronLeft size={16} aria-hidden="true" />
              Todas las rutas
            </button>
          )}

          {selectedRuta ? (
            <RutaDetail
              ruta={selectedRuta}
              animKey={animKey}
              onOpenEmployeesModal={() => setIsModalOpen(true)}
            />
          ) : (
            <Placeholder />
          )}
        </section>
      </div>

      <RutaEmployeesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ruta={selectedRuta}
      />
    </section>
  );
}
