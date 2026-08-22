import { useState, useRef, useMemo, useEffect } from "react";
import {
  Bus,
  CalendarDays,
  ChevronLeft,
  Clock,
  MapPin,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
// NOTE: MorphingIcon espera IconInput de 'morphicons', compatible solo con
// las definiciones crudas del paquete base 'lucide' (no 'lucide-react').
import { Search as SearchData, X as XIconData } from "lucide";
import { MorphingIcon } from "@/components/ui/MorphingIcon";
import { getShortName } from "@/lib/names";
import { formatLongDate } from "@/lib/dates";
import {
  useRutas,
  RutaAgrupada,
  getTurnosPorDia,
  type EmpleadoRuta,
} from "@/hooks/useRutas";
import { RutaEmployeesModal } from "@/components/ui/RutaEmployeesModal";
import { RutaDayEmployeesModal } from "@/components/ui/RutaDayEmployeesModal";
import { Tooltip } from "@/components/ui/Tooltip";
import { IncidenciasTable } from '@/components/transporte/IncidenciasTable';
import "./Rutas.css";

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

function RutaCard({
  ruta,
  isActive,
  onClick,
  matchCount,
}: RutaCardProps & { matchCount?: number }) {
  const isOverCapacity = Object.entries(ruta.turnosCount).some(
    ([t, c]) => ruta.maxCapacityPerShift[t] && c > ruta.maxCapacityPerShift[t],
  );

  return (
    <button
      type="button"
      className={`ruta-card${isActive ? " ruta-card--active" : ""}${matchCount ? " ruta-card--has-match" : ""}`}
      onClick={onClick}
      aria-pressed={isActive}
    >
      <span className="ruta-card__icon" aria-hidden="true">
        <Bus size={18} />
      </span>
      <span className="ruta-card__title type-heading-sm" style={{ flex: 'none', margin: '0' }}>
        {ruta.nombreRuta.split("-")[0].trim()}
        {isOverCapacity && (
          <span
            className="ruta-card__alert-dot"
            aria-label="Sobrecupo detectado"
            title="Sobrecupo detectado"
          />
        )}
      </span>
      {matchCount !== undefined && matchCount > 0 && (
        <span className="ruta-card__match-badge">{matchCount}</span>
      )}
    </button>
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

function ShiftBars({
  turnosCount,
  turnosCountPrev,
  maxCapacityPerShift,
  empleados = [],
  empleadosPrev = [],
  animKey,
}: ShiftBarsProps) {
  const entries = Object.entries(turnosCount).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  return (
    <div className="shift-bars" key={animKey}>
      {entries.map(([turno, count], i) => {
        const assignedCapacity = maxCapacityPerShift[turno];
        const barMax = assignedCapacity || Math.max(count, 21);
        const pct = barMax > 0 ? Math.round((count / barMax) * 100) : 0;
        const isOverCapacity = count > barMax;

        const prevCount = turnosCountPrev[turno] ?? count; // Default to count if no prev data
        const delta = count - prevCount;
        let trendAria = "Sin cambios";
        if (delta > 0) trendAria = `${delta} alta${delta === 1 ? "" : "s"}`;
        if (delta < 0)
          trendAria = `${Math.abs(delta)} baja${Math.abs(delta) === 1 ? "" : "s"}`;

        const currentEmps = empleados.filter((e) => e.turno === turno);
        const prevEmps = empleadosPrev.filter((e) => e.turno === turno);
        const added = currentEmps.filter(
          (curr) =>
            !prevEmps.some(
              (prev) => prev.numeroEmpleado === curr.numeroEmpleado,
            ),
        );
        const removed = prevEmps.filter(
          (prev) =>
            !currentEmps.some(
              (curr) => curr.numeroEmpleado === prev.numeroEmpleado,
            ),
        );

        const tooltipContent =
          added.length > 0 || removed.length > 0 ? (
            <div className="trend-tooltip">
              {added.length > 0 && (
                <div className="trend-tooltip__section">
                  <strong className="trend-tooltip__title trend-tooltip__title--success">
                    <TrendingUp size={12} /> Altas ({added.length}):
                  </strong>
                  <ul className="trend-tooltip__list">
                    {added.map((e) => (
                      <li key={e.numeroEmpleado}>
                        {e.numeroEmpleado} &middot; {getShortName(e.nombre)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {removed.length > 0 && (
                <div className="trend-tooltip__section">
                  <strong className="trend-tooltip__title trend-tooltip__title--danger">
                    <TrendingDown size={12} /> Bajas ({removed.length}):
                  </strong>
                  <ul className="trend-tooltip__list">
                    {removed.map((e) => (
                      <li key={e.numeroEmpleado}>
                        {e.numeroEmpleado} &middot; {getShortName(e.nombre)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null;

        const trendBadge = (
          <span
            tabIndex={0}
            className={`shift-bars__trend ${delta > 0 ? "trend-up" : delta < 0 ? "trend-down" : "trend-flat"}`}
            aria-label={trendAria}
          >
            {delta > 0 ? (
              <TrendingUp size={14} aria-hidden="true" />
            ) : delta < 0 ? (
              <TrendingDown size={14} aria-hidden="true" />
            ) : (
              <Minus size={14} aria-hidden="true" />
            )}
            <span aria-hidden="true">{Math.abs(delta)}</span>
          </span>
        );

        return (
          <div
            key={turno}
            className={`shift-bars__row${isOverCapacity ? " shift-bars__row--over" : ""}`}
            style={
              {
                "--bar-delay": `${i * 0.08}s`,
                "--bar-pct": `${Math.min(pct, 100)}%`,
              } as React.CSSProperties
            }
          >
            <span className="shift-bars__label type-body-sm">
              Turno {turno}
            </span>
            <div
              className="shift-bars__track"
              role="progressbar"
              aria-valuenow={count}
              aria-valuemin={0}
              aria-valuemax={Math.max(barMax, count)}
              aria-valuetext={
                assignedCapacity
                  ? `${count} de ${assignedCapacity} empleados`
                  : `${count} empleados`
              }
              aria-label={`Turno ${turno}`}
            >
              <div className="shift-bars__fill" />
            </div>
            <div className="shift-bars__stats">
              <span
                className={`shift-bars__count type-body-sm${isOverCapacity ? " shift-bars__count--over" : ""}`}
              >
                {assignedCapacity ? `${count} / ${assignedCapacity}` : count}
              </span>
              {turnosCountPrev[turno] !== undefined &&
                (tooltipContent ? (
                  <Tooltip content={tooltipContent} side="top" delayMs={200}>
                    {trendBadge}
                  </Tooltip>
                ) : (
                  trendBadge
                ))}
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
  empleados: EmpleadoRuta[];
  animKey: number;
  onSelectDay: (day: string) => void;
}

function DailyCapacityBars({
  capacityPerDay,
  empleados,
  animKey,
  onSelectDay,
}: DailyCapacityBarsProps) {
  const DAYS_ORDER = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];

  const RESTING_SHIFTS: Record<string, string> = {
    Lunes: "T2",
    Martes: "T2",
    Miércoles: "T3",
    Jueves: "T3",
    Viernes: "T4",
    Sábado: "T4",
    Domingo: "T1",
  };

  return (
    <div className="daily-cards" key={`daily-${animKey}`}>
      {DAYS_ORDER.map((day) => {
        const count = capacityPerDay[day] || 0;
        const turnos = getTurnosPorDia(empleados, day);
        return (
          <button
            key={day}
            type="button"
            className="daily-cards__card"
            onClick={() => onSelectDay(day)}
            aria-haspopup="dialog"
            aria-label={`Ver ${count} empleados de la ruta el ${day}`}
          >
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
                  title={`Descansa el Turno ${RESTING_SHIFTS[day].replace("T", "")}`}
                >
                  {RESTING_SHIFTS[day]}
                </span>
              </div>
            </div>
            <div className="daily-cards__shifts">
              <span className="daily-cards__label">Turnos</span>
              {turnos.length > 0 ? (
                <span className="daily-cards__shift-list">
                  {turnos.map((turno) => (
                    <span key={turno} className="daily-cards__shift-badge">
                      T{turno}
                    </span>
                  ))}
                </span>
              ) : (
                <span
                  className="daily-cards__shift-badge daily-cards__shift-badge--empty"
                  aria-hidden="true"
                >
                  —
                </span>
              )}
            </div>
          </button>
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
      <p className="type-body-sm">
        Toca cualquier tarjeta para ver sus detalles.
      </p>
    </div>
  );
}

/* ─── Detail panel ─── */
interface RutaDetailProps {
  ruta: RutaAgrupada;
  animKey: number;
  onOpenEmployeesModal: () => void;
  onSelectDay: (day: string) => void;
}

function RutaDetail({
  ruta,
  animKey,
  onOpenEmployeesModal,
  onSelectDay,
}: RutaDetailProps) {
  return (
    <div className="ruta-detail ruta-detail--enter" key={animKey}>
      <div className="ruta-detail__body">
        {/* Dual column grids */}
        <div className="ruta-detail__grids">
          <section className="ruta-section">
            <h3 className="ruta-section__title ruta-section__title-wrapper type-heading-sm">
              <MapPin
                size={16}
                aria-hidden="true"
                className="ruta-section__title-icon"
              />
              {ruta.nombreRuta}
              <button
                type="button"
                className="btn-secondary btn-sm ruta-section__title-btn"
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
              <CalendarDays
                size={16}
                aria-hidden="true"
                className="ruta-section__title-icon"
              />
              Empleados por día
            </h3>
            <DailyCapacityBars
              capacityPerDay={ruta.capacityPerDay}
              empleados={ruta.empleados}
              animKey={animKey}
              onSelectDay={onSelectDay}
            />
          </section>
        </div>

        {/* Route simulation */}
        <section className="ruta-section">
          <h3 className="ruta-section__title type-heading-sm">
            <MapPin
              size={16}
              aria-hidden="true"
              className="ruta-section__title-icon"
            />
            Itinerario ({ruta.paradas.length} paradas)
          </h3>
          <div className="ruta-stops">
            <ul className="ruta-stops__list">
              {ruta.paradas.map((parada, i) => (
                <li
                  key={parada}
                  className={`ruta-stops__item type-body-sm ${i === 0 ? "is-first" : i === ruta.paradas.length - 1 ? "is-last" : ""}`}
                  style={
                    {
                      "--item-delay": `${0.05 + i * 0.06}s`,
                    } as React.CSSProperties
                  }
                >
                  <div className="ruta-stops__track" aria-hidden="true">
                    <div className="ruta-stops__dot" />
                    {i !== ruta.paradas.length - 1 && (
                      <div className="ruta-stops__line" />
                    )}
                  </div>
                  <span className="ruta-stops__text">{parada}</span>
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
  const { rutas, lastUpdated, loading, errorMsg } = useRutas();
  const [selectedRuta, setSelectedRuta] = useState<RutaAgrupada | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDia, setSelectedDia] = useState<string | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'capacidad' | 'incidencias'>('capacidad');
  /**
   * mobileView controls which panel is shown on small screens.
   * On desktop both panels are always visible (CSS grid).
   */
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");
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
          emp.nombre.toLowerCase().includes(searchNorm),
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
      const currentStillVisible =
        selectedRuta && matchCounts.has(selectedRuta.nombreRuta);
      if (!currentStillVisible) {
        setSelectedRuta(filteredRutas[0]);
        setAnimKey((k) => k + 1);
      }
    }
  }, [searchNorm, filteredRutas, matchCounts]);

  function handleSelect(ruta: RutaAgrupada) {
    setSelectedRuta(ruta);
    setAnimKey((k) => k + 1);
    setMobileView("detail"); // push to detail on mobile
  }

  function handleBack() {
    setMobileView("list");
  }

  const handleListKeyDown = (event: React.KeyboardEvent) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const buttons = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>(".ruta-card") ?? [],
    );
    if (!buttons.length) return;
    const currentIndex = buttons.indexOf(
      document.activeElement as HTMLButtonElement,
    );
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? buttons.length - 1
          : (Math.max(currentIndex, 0) +
              (event.key === "ArrowDown" ? 1 : -1) +
              buttons.length) %
            buttons.length;
    buttons[nextIndex]?.focus();
  };

  return (
    <section
      className="rutas-page config-page"
      id="main-content"
      data-mobile-view={mobileView}
      tabIndex={-1}
    >
      <header className="config-page__header" style={{ marginBottom: 'var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="segmented-control">
          <button
            type="button"
            className={`segmented-control__btn ${activeTab === 'capacidad' ? 'active' : ''}`}
            onClick={() => setActiveTab('capacidad')}
            aria-pressed={activeTab === 'capacidad'}
          >
            Configuración de Rutas
          </button>
          <button
            type="button"
            className={`segmented-control__btn ${activeTab === 'incidencias' ? 'active' : ''}`}
            onClick={() => setActiveTab('incidencias')}
            aria-pressed={activeTab === 'incidencias'}
          >
            Incidencias Reportadas
          </button>
        </div>
      </header>

      {activeTab === 'incidencias' ? (
        <section className="rutas-incidencias" style={{ marginTop: 'var(--spacing-md)' }}>
          <IncidenciasTable />
        </section>
      ) : (
        <>
          {/* ── Search bar & Horarios ── */}
      <section
        className="config-page__toolbar"
        aria-label="Herramientas de rutas"
      >
        <div className="rutas-toolbar-flex">
          <div className="form-group config-search rutas-search-container">
            <label htmlFor="rutas-search-input" className="sr-only">
              Buscar empleado por número o nombre
            </label>
            <div className="config-search__wrapper">
              <button
                type="button"
                className={`config-search__icon rutas-search-clear-btn ${searchTerm ? "rutas-search-clear-btn--active" : "rutas-search-clear-btn--inactive"}`}
                onClick={() => {
                  setSearchTerm("");
                  searchInputRef.current?.focus();
                }}
                disabled={!searchTerm}
                aria-label={searchTerm ? "Limpiar búsqueda" : "Buscar"}
                tabIndex={searchTerm ? 0 : -1}
              >
                <MorphingIcon
                  icon={searchTerm ? XIconData : SearchData}
                  size={18}
                  className="text-muted"
                  aria-hidden="true"
                />
              </button>
              <input
                id="rutas-search-input"
                ref={searchInputRef}
                type="text"
                placeholder="Buscar por número de empleado o nombre…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-describedby={
                  searchNorm ? "rutas-search-status" : undefined
                }
                autoComplete="off"
              />
            </div>
            {searchNorm && (
              <p
                id="rutas-search-status"
                className="config-search__hint text-muted mt-xs"
                role="status"
                aria-live="polite"
              >
                {filteredRutas.length === 0
                  ? "Sin resultados"
                  : `${matchCounts.size} ruta${matchCounts.size === 1 ? "" : "s"} · ${Array.from(matchCounts.values()).reduce((a, b) => a + b, 0)} empleado${Array.from(matchCounts.values()).reduce((a, b) => a + b, 0) === 1 ? "" : "s"}`}
              </p>
            )}
          </div>

          <div className="rutas-toolbar-actions">
            <div className="rutas-last-updated">
              <span className="type-caption-up text-muted">
                Última actualización
              </span>
              <span
                className="type-body-sm strong"
                style={{ color: "var(--color-primary)" }}
              >
                {lastUpdated ? formatLongDate(lastUpdated) : "No especificada"}
              </span>
            </div>

            <a
              href="/horarios/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary rutas-horarios-btn"
              title="Ver horarios"
              aria-label="Ver horarios"
            >
              <Clock size={16} aria-hidden="true" />
              Horarios
            </a>
          </div>
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

          {!loading &&
            !errorMsg &&
            !searchNorm &&
            filteredRutas.length === 0 && (
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
                matchCount={
                  searchNorm ? matchCounts.get(ruta.nombreRuta) : undefined
                }
              />
            ))}
        </section>

        {/* ── Right: detail / placeholder ── */}
        <section
          className="rutas-detail-pane"
          aria-live="polite"
          aria-atomic="false"
        >
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
              onSelectDay={setSelectedDia}
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
      <RutaDayEmployeesModal
        isOpen={selectedDia !== null}
        onClose={() => setSelectedDia(null)}
        ruta={selectedRuta}
        dia={selectedDia}
      />
      </>
      )}
    </section>
  );
}
